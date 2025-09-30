import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const storeObjectId = new ObjectId(storeId);
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { storeId: storeObjectId };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { 'item.brand': { $regex: search, $options: 'i' } },
        { 'item.model': { $regex: search, $options: 'i' } }
      ];
    }

    // Get contracts with customer data
    const contracts = await db.collection('contracts')
      .aggregate([
        { $match: query },
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
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    // Get total count for pagination
    const totalCount = await db.collection('contracts').countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      contracts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Contracts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const contractData = await request.json();

    // Generate contract number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const contractNumber = `CNT${dateStr}${randomSuffix}`;

    // Calculate due date
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + contractData.pawnDetails.periodDays);

    // Calculate total interest
    const totalInterest = contractData.pawnDetails.pawnedPrice *
      (contractData.pawnDetails.interestRate / 100) *
      (contractData.pawnDetails.periodDays / 30);

    const newContract = {
      _id: new ObjectId(),
      contractNumber,
      status: 'active',
      customerId: new ObjectId(contractData.customerId),
      item: contractData.item,
      pawnDetails: {
        ...contractData.pawnDetails,
        totalInterest,
        remainingAmount: contractData.pawnDetails.pawnedPrice + totalInterest
      },
      dates: {
        startDate: now,
        dueDate,
        redeemDate: null,
        suspendedDate: null
      },
      transactionHistory: [],
      storeId: new ObjectId(contractData.storeId),
      createdBy: new ObjectId(contractData.createdBy),
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection('contracts').insertOne(newContract);

    // Create initial pawn transaction
    const pawnTransaction = {
      _id: new ObjectId(),
      type: 'pawn',
      amount: contractData.pawnDetails.pawnedPrice,
      paymentMethod: contractData.paymentMethod || 'cash',
      contractId: result.insertedId,
      customerId: new ObjectId(contractData.customerId),
      processedBy: new ObjectId(contractData.createdBy),
      note: 'Initial pawn transaction',
      beforeBalance: 0,
      afterBalance: contractData.pawnDetails.pawnedPrice,
      storeId: new ObjectId(contractData.storeId),
      createdAt: now
    };

    await db.collection('transactions').insertOne(pawnTransaction);

    return NextResponse.json({
      success: true,
      contractId: result.insertedId,
      contractNumber
    });
  } catch (error) {
    console.error('Create contract API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}