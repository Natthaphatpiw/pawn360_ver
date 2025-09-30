import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase();
    const { id: contractId } = await params;

    if (!ObjectId.isValid(contractId)) {
      return NextResponse.json({ error: 'Invalid contract ID' }, { status: 400 });
    }

    // Get contract with customer data
    const contract = await db.collection('contracts')
      .aggregate([
        { $match: { _id: new ObjectId(contractId) } },
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

    // Get transaction history using IDs from contract
    let transactions = [];
    if (contractData.transactionHistory && contractData.transactionHistory.length > 0) {
      transactions = await db.collection('transactions')
        .find({ _id: { $in: contractData.transactionHistory.map((id: any) => new ObjectId(id)) } })
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      // Fallback: get by contractId if transactionHistory is empty
      transactions = await db.collection('transactions')
        .find({ contractId: new ObjectId(contractId) })
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