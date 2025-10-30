import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserIdFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const storeObjectId = new ObjectId(storeId);
    const query: any = { storeId: storeObjectId };

    if (status) {
      query.status = status;
    }

    // First, try to fetch from contracts collection (active contracts)
    const contracts = await db.collection('contracts')
      .aggregate([
        { $match: { ...query, status: { $in: ['active', 'overdue', 'suspended'] } } },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer'
          }
        },
        {
          $addFields: {
            customer: { $arrayElemAt: ['$customer', 0] }
          }
        },
        {
          $lookup: {
            from: 'transactions',
            let: { contractId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$contractId', '$$contractId'] } } },
              { $sort: { createdAt: -1 } }
            ],
            as: 'transactionHistory'
          }
        }
      ])
      .sort({ 'dates.startDate': -1 })
      .toArray();

    // If we have contracts, return them
    if (contracts.length > 0) {
      // Convert ObjectIds and return
      const convertedContracts = contracts.map(contract => convertObjectIds(contract));
      return NextResponse.json(convertedContracts);
    }

    // Fallback: Fetch from items collection (pending contracts)
    const items = await db.collection('items').find({ ...query, status: 'active' }).sort({ createdAt: -1 }).toArray();

    // Helper function to convert ObjectIds and datetimes
    function convertObjectIds(obj: any): any {
      if (obj instanceof ObjectId) {
        return obj.toString();
      } else if (obj instanceof Date) {
        return obj.toISOString();
      } else if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          return obj.map(convertObjectIds);
        } else {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            result[key] = convertObjectIds(value);
          }
          return result;
        }
      } else {
        return obj;
      }
    }

    // Convert to frontend format
    const convertedItems = [];
    for (const item of items) {
      // First, convert all ObjectIds to strings
      const convertedItem = convertObjectIds(item);

      // Try to get customer info from lineId (if available)
      let customerInfo = null;
      if (convertedItem.lineId) {
        // Look for customer with matching lineId or create placeholder
        const customer = await db.collection('customers').findOne({
          $or: [
            { lineId: convertedItem.lineId },
            { phone: convertedItem.lineId } // fallback
          ]
        });
        if (customer) {
          customerInfo = {
            "fullName": customer.fullName || "",
            "phone": customer.phone || "",
            "idNumber": customer.idNumber || ""
          };
        }
      }

      if (!customerInfo) {
        // Fallback customer info
        customerInfo = {
          "fullName": "ลูกค้าผ่าน LINE",
          "phone": convertedItem.lineId || "",
          "idNumber": ""
        };
      }

      // Create contract-like structure from item data
      const contractData = {
        _id: convertedItem._id,
        contractNumber: convertedItem.currentContractId ?
          `CONTRACT-${convertedItem.currentContractId.substring(0, 8).toUpperCase()}` :
          `PENDING-${convertedItem._id.substring(0, 8).toUpperCase()}`,
        status: convertedItem.status || 'pending',
        customer: customerInfo,
        item: {
          brand: convertedItem.brand || '',
          model: convertedItem.model || '',
          type: convertedItem.type || '',
          serialNo: convertedItem.serialNo || '',
          accessories: convertedItem.accessories || '',
          condition: convertedItem.condition || 0,
          defects: convertedItem.defects || '',
          note: convertedItem.note || '',
          images: convertedItem.images || []
        },
        pawnDetails: {},
        dates: {
          createdAt: convertedItem.createdAt,
          updatedAt: convertedItem.updatedAt
        },
        storeId: convertedItem.storeId,
        confirmationStatus: convertedItem.confirmationStatus || 'pending'
      };

      // Calculate pawn details based on status and confirmation data
      if (convertedItem.status === 'active' && convertedItem.confirmationNewContract) {
        // Use confirmed contract data for active items
        const confirmed = convertedItem.confirmationNewContract;
        contractData.pawnDetails = {
          pawnedPrice: confirmed.pawnPrice || 0,
          interestRate: confirmed.interestRate || 0,
          periodDays: confirmed.loanDays || 0,
          totalInterest: confirmed.interest || 0,
          remainingAmount: confirmed.total || 0,
          payInterest: 0,
          fineAmount: 0,
          soldAmount: 0
        };
      } else {
        // Use desired/estimated values for pending items
        const pawnPrice = convertedItem.desiredAmount || convertedItem.estimatedValue || 0;
        const interestRate = convertedItem.interestRate || 10;
        const loanDays = convertedItem.loanDays || 30;
        const totalInterest = Math.round(pawnPrice * (interestRate / 100) * (loanDays / 30) * 100) / 100;

        contractData.pawnDetails = {
          pawnedPrice: pawnPrice,
          interestRate: interestRate,
          periodDays: loanDays,
          totalInterest: totalInterest,
          remainingAmount: pawnPrice + totalInterest,
          payInterest: 0,
          fineAmount: 0,
          soldAmount: 0
        };
      }

      convertedItems.push(contractData);
    }

    return NextResponse.json(convertedItems);
  } catch (error) {
    console.error('Contracts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const contractData = await request.json();

    const startDate = new Date();

    // Create item document in items collection
    const itemDoc = {
      lineId: contractData.lineId || '', // From LINE integration
      brand: contractData.item?.brand || '',
      model: contractData.item?.model || '',
      type: contractData.item?.type || '',
      serialNo: contractData.item?.serialNo || '',
      condition: contractData.item?.condition || 50,
      defects: contractData.item?.defects || '',
      note: contractData.item?.note || '',
      accessories: contractData.item?.accessories || '',
      images: contractData.item?.images || [],
      status: 'pending', // Start as pending, will be confirmed later
      currentContractId: null,
      contractHistory: [],
      desiredAmount: contractData.pawnDetails?.pawnedPrice || contractData.pawnDetails?.aiEstimatedPrice || 0,
      estimatedValue: contractData.pawnDetails?.aiEstimatedPrice || contractData.pawnDetails?.pawnedPrice || 0,
      loanDays: contractData.pawnDetails?.periodDays || 30,
      interestRate: contractData.pawnDetails?.interestRate || 10,
      storeId: new ObjectId(contractData.storeId),
      negotiationStatus: 'none',
      createdAt: startDate,
      updatedAt: startDate,
      confirmationModifications: [],
      confirmationNewContract: {
        itemId: '', // Will be set after insertion
        pawnPrice: contractData.pawnDetails?.pawnedPrice || 0,
        interestRate: contractData.pawnDetails?.interestRate || 10,
        loanDays: contractData.pawnDetails?.periodDays || 30,
        interest: 0, // Will be calculated during confirmation
        total: 0, // Will be calculated during confirmation
        item: `${contractData.item?.brand || ''} ${contractData.item?.model || ''}`.trim()
      },
      confirmationStatus: 'pending',
      confirmationTimestamp: null
    };

    // Insert item
    const result = await db.collection('items').insertOne(itemDoc);
    const itemId = result.insertedId;

    // Update confirmationNewContract with itemId
    await db.collection('items').updateOne(
      { _id: itemId },
      {
        $set: {
          'confirmationNewContract.itemId': itemId.toString(),
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      message: 'Item created successfully',
      item_id: itemId.toString(),
      status: 'pending'
    });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/contracts/[id]/actions - Handle contract actions (approve, reject, etc.)
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const contractId = url.pathname.split('/')[3]; // Extract ID from /api/contracts/[id]/actions

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const actionData = await request.json();
    const { action, modifications } = actionData;

    // Find the item
    const item = await db.collection('items').findOne({ _id: new ObjectId(contractId) });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const currentTime = new Date();

    if (action === 'approve' || action === 'confirm') {
      // Calculate final amounts
      const confirmedData = item.confirmationNewContract;
      const pawnPrice = confirmedData.pawnPrice;
      const interestRate = confirmedData.interestRate;
      const loanDays = confirmedData.loanDays;

      // Calculate interest: (pawnPrice * interestRate% * loanDays/30)
      const interest = Math.round(pawnPrice * (interestRate / 100) * (loanDays / 30) * 100) / 100;
      const total = pawnPrice + interest;

      // Generate contract number
      const timestamp = currentTime.toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const contractNumber = `STORE${timestamp}${randomPart}`;

      // Create actual contract document
      const contractDoc = {
        contractNumber,
        status: 'active',
        itemId: item._id,
        customerInfo: {
          lineId: item.lineId,
          contact: item.lineId // For now, use lineId as contact
        },
        item: {
          brand: item.brand,
          model: item.model,
          type: item.type,
          serialNo: item.serialNo,
          accessories: item.accessories,
          condition: item.condition,
          defects: item.defects,
          note: item.note,
          images: item.images
        },
        pawnDetails: {
          pawnPrice,
          interestRate,
          loanDays,
          interest,
          total,
          paidInterest: 0,
          fineAmount: 0,
          remainingAmount: total
        },
        dates: {
          startDate: currentTime,
          dueDate: new Date(currentTime.getTime() + loanDays * 24 * 60 * 60 * 1000),
          createdAt: currentTime,
          updatedAt: currentTime
        },
        storeId: item.storeId,
        createdBy: new ObjectId(userId),
        transactionHistory: []
      };

      // Insert contract
      const contractResult = await db.collection('contracts').insertOne(contractDoc);
      const actualContractId = contractResult.insertedId;

      // Add initial transaction for contract creation
      const initialTransaction = {
        _id: new ObjectId(),
        contractId: actualContractId,
        type: 'contract_created',
        amount: pawnPrice,
        customerId: null, // Will be set if we have customer info
        processedBy: new ObjectId(userId),
        storeId: item.storeId,
        createdAt: currentTime,
        description: 'Contract created and approved',
        beforeBalance: 0,
        afterBalance: pawnPrice
      };

      await db.collection('transactions').insertOne(initialTransaction);

      // Update contract with transaction history
      await db.collection('contracts').updateOne(
        { _id: actualContractId },
        {
          $push: { transactionHistory: initialTransaction._id.toString() }
        }
      );

      // Update item with contract info
      await db.collection('items').updateOne(
        { _id: item._id },
        {
          $set: {
            status: 'active',
            currentContractId: actualContractId,
            'confirmationNewContract.interest': interest,
            'confirmationNewContract.total': total,
            confirmationStatus: 'confirmed',
            confirmationTimestamp: currentTime,
            updatedAt: currentTime
          },
          $push: {
            contractHistory: actualContractId,
            confirmationModifications: {
              action: 'approved',
              timestamp: currentTime,
              contractNumber,
              finalAmount: total
            }
          } as any
        }
      );

      return NextResponse.json({
        message: 'Contract approved and created successfully',
        contractNumber,
        itemId: contractId,
        status: 'active'
      });

    } else if (action === 'reject' || action === 'cancel') {
      // Update item status to rejected/cancelled
      const newStatus = action === 'reject' ? 'rejected' : 'cancelled';

      await db.collection('items').updateOne(
        { _id: item._id },
        {
          $set: {
            status: newStatus,
            confirmationStatus: 'cancelled',
            updatedAt: currentTime
          },
          $push: {
            confirmationModifications: {
              action: newStatus,
              timestamp: currentTime,
              reason: modifications?.reason || 'No reason provided'
            }
          } as any
        }
      );

      return NextResponse.json({
        message: `Contract ${newStatus} successfully`,
        itemId: contractId,
        status: newStatus
      });

    } else if (action === 'modify') {
      // Update contract terms
      const updates: any = {
        updatedAt: currentTime
      };

      if (modifications) {
        if (modifications.pawnPrice !== undefined) {
          updates['confirmationNewContract.pawnPrice'] = modifications.pawnPrice;
          updates['confirmationModifications'] = item.confirmationModifications || [];
          updates['confirmationModifications'].push({
            action: 'price_modified',
            oldValue: item.confirmationNewContract.pawnPrice,
            newValue: modifications.pawnPrice,
            timestamp: currentTime
          });
        }
        if (modifications.interestRate !== undefined) {
          updates['confirmationNewContract.interestRate'] = modifications.interestRate;
          updates['confirmationModifications'] = item.confirmationModifications || [];
          updates['confirmationModifications'].push({
            action: 'interest_modified',
            oldValue: item.confirmationNewContract.interestRate,
            newValue: modifications.interestRate,
            timestamp: currentTime
          });
        }
        if (modifications.loanDays !== undefined) {
          updates['confirmationNewContract.loanDays'] = modifications.loanDays;
          updates['confirmationModifications'] = item.confirmationModifications || [];
          updates['confirmationModifications'].push({
            action: 'duration_modified',
            oldValue: item.confirmationNewContract.loanDays,
            newValue: modifications.loanDays,
            timestamp: currentTime
          });
        }
      }

      await db.collection('items').updateOne(
        { _id: item._id },
        { $set: updates }
      );

      return NextResponse.json({
        message: 'Contract modified successfully',
        itemId: contractId
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Contract action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}