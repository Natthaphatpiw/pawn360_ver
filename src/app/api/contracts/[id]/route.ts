import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase();
    const { id: itemId } = await params;

    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // First, try to get from items collection (our new system)
    const item = await db.collection('items').findOne({ _id: new ObjectId(itemId) });

    if (item) {
      // Found item, transform to contract-like format
      const convertedItem = convertObjectIds(item);

      // Get customer info
      let customerInfo = null;
      if (convertedItem.lineId) {
        const customer = await db.collection('customers').findOne({
          $or: [
            { lineId: convertedItem.lineId },
            { phone: convertedItem.lineId }
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
        customerInfo = {
          "fullName": "ลูกค้าผ่าน LINE",
          "phone": convertedItem.lineId || "",
          "idNumber": ""
        };
      }

      // Create contract-like structure
      let contractData: any = {
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
        dates: {
          createdAt: convertedItem.createdAt,
          updatedAt: convertedItem.updatedAt
        },
        confirmationStatus: convertedItem.confirmationStatus || 'pending',
        confirmationNewContract: convertedItem.confirmationNewContract,
        transactionHistory: []
      };

      // Calculate pawn details based on status
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

        // If there's a currentContractId, try to get the actual contract data
        if (convertedItem.currentContractId) {
          const actualContract = await db.collection('contracts').findOne({
            _id: new ObjectId(convertedItem.currentContractId)
          });

          if (actualContract) {
            // Merge actual contract data
            contractData = { ...contractData, ...convertObjectIds(actualContract) };
            contractData.transactionHistory = actualContract.transactionHistory || [];
          }
        }
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

      return NextResponse.json(contractData);
    }

    // If not found in items, try legacy contracts collection (backward compatibility)
    const contract = await db.collection('contracts')
      .aggregate([
        { $match: { _id: new ObjectId(itemId) } },
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
        }
      ])
      .toArray();

    if (!contract || contract.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contractData = contract[0];

    // Get transaction history
    let transactions = [];
    if (contractData.transactionHistory && contractData.transactionHistory.length > 0) {
      transactions = await db.collection('transactions')
        .find({ _id: { $in: contractData.transactionHistory.map((id: any) => new ObjectId(id)) } })
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      // Fallback: get by contractId if transactionHistory is empty
      transactions = await db.collection('transactions')
        .find({ contractId: new ObjectId(itemId) })
        .sort({ createdAt: -1 })
        .toArray();
    }

    contractData.transactionHistory = transactions;

    return NextResponse.json(contractData);
  } catch (error) {
    console.error('Get contract API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase();
    const { id: contractId } = await params;
    const updateData = await request.json();

    if (!ObjectId.isValid(contractId)) {
      return NextResponse.json({ error: 'Invalid contract ID' }, { status: 400 });
    }

    const result = await db.collection('contracts').updateOne(
      { _id: new ObjectId(contractId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update contract API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}