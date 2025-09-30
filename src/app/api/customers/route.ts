import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const search = searchParams.get('search');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const storeObjectId = new ObjectId(storeId);
    const query: any = { storeId: storeObjectId };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await db.collection('customers')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const customerData = await request.json();

    const newCustomer = {
      _id: new ObjectId(),
      ...customerData,
      storeId: new ObjectId(customerData.storeId),
      createdBy: new ObjectId(customerData.createdBy),
      totalContracts: 0,
      totalValue: 0,
      lastContractDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('customers').insertOne(newCustomer);

    return NextResponse.json({
      success: true,
      customerId: result.insertedId
    });
  } catch (error) {
    console.error('Create customer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}