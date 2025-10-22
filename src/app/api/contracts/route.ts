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

    const contracts = await db.collection('contracts').find(query).toArray();

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
    const convertedContracts = [];
    for (const contract of contracts) {
      // First, convert all ObjectIds to strings
      const convertedContract = convertObjectIds(contract);

      // Get customer info (using string ID now)
      const customer = await db.collection('customers').findOne({ "_id": new ObjectId(convertedContract["customerId"]) });
      if (customer) {
        convertedContract["customer"] = {
          "fullName": customer.fullName || "",
          "phone": customer.phone || "",
          "idNumber": customer.idNumber || ""
        };
      } else {
        // Fallback if customer not found
        convertedContract["customer"] = {
          "fullName": "ลูกค้าไม่ทราบชื่อ",
          "phone": "",
          "idNumber": ""
        };
      }

      // Ensure pawnDetails has correct structure with all fields
      if ("pawnDetails" in convertedContract) {
        const pawnDetails = convertedContract["pawnDetails"];
        convertedContract["pawnDetails"] = {
          "pawnedPrice": pawnDetails.pawnedPrice || 0,
          "interestRate": pawnDetails.interestRate || 0,
          "totalInterest": pawnDetails.totalInterest || 0,
          "remainingAmount": pawnDetails.remainingAmount || 0,
          "payInterest": pawnDetails.payInterest || 0,
          "fineAmount": pawnDetails.fineAmount || 0,
          "soldAmount": pawnDetails.soldAmount || 0
        };
      }

      convertedContracts.push(convertedContract);
    }

    return NextResponse.json(convertedContracts);
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

    // Generate contract number
    const startDate = new Date();
    const periodDays = contractData.pawnDetails?.periodDays || 90;
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + periodDays);

    // Calculate interest and total amount
    const pawnedPrice = contractData.pawnDetails?.pawnedPrice || 0;
    const interestRate = contractData.pawnDetails?.interestRate || 10.0;
    const totalInterest = Math.round(pawnedPrice * (interestRate / 100) * (periodDays / 30) * 100) / 100;
    const remainingAmount = pawnedPrice + totalInterest;

    // Generate contract number
    const timestamp = startDate.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const contractNumber = `STORE${timestamp}${randomPart}`;

    const contractDoc = {
      contractNumber,
      status: 'active',
      customerId: new ObjectId(contractData.customerId),
      item: {
        brand: contractData.item?.brand || '',
        model: contractData.item?.model || '',
        type: contractData.item?.type || '',
        serialNo: contractData.item?.serialNo || '',
        accessories: contractData.item?.accessories || '',
        condition: contractData.item?.condition || 0,
        defects: contractData.item?.defects || '',
        note: contractData.item?.note || '',
        images: contractData.item?.images || []
      },
      pawnDetails: {
        aiEstimatedPrice: contractData.pawnDetails?.aiEstimatedPrice || 0,
        pawnedPrice,
        interestRate,
        periodDays,
        totalInterest,
        remainingAmount,
        payInterest: 0,
        fineAmount: 0,
        soldAmount: 0
      },
      dates: {
        startDate,
        dueDate,
        redeemDate: null,
        suspendedDate: null
      },
      transactionHistory: [],
      storeId: new ObjectId(contractData.storeId),
      createdBy: new ObjectId(userId),
      userId: new ObjectId(userId),
      createdAt: startDate,
      updatedAt: startDate
    };

    const result = await db.collection('contracts').insertOne(contractDoc);
    const contractId = result.insertedId.toString();

    // Update customer: add contract ID to contractsID array and update stats
    await db.collection('customers').updateOne(
      { "_id": new ObjectId(contractData.customerId) },
      {
        $push: { contractsID: contractId },
        $inc: { totalContracts: 1, totalValue: pawnedPrice },
        $set: { lastContractDate: startDate, updatedAt: new Date() }
      } as any
    );

    return NextResponse.json({
      message: 'Contract created successfully',
      contract_id: contractId,
      contract_number: contractNumber
    });
  } catch (error) {
    console.error('Create contract error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}