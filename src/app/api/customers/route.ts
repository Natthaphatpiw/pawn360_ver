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

    // Convert ObjectIds to strings and ensure contractsID is array
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      _id: customer._id.toString(),
      storeId: customer.storeId.toString(),
      createdBy: customer.createdBy?.toString() || '',
      contractsID: customer.contractsID || []
    }));

    return NextResponse.json(formattedCustomers);
  } catch (error) {
    console.error('Customers API error:', error);
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
    const customerData = await request.json();

    // Create customer document matching the structure from FastAPI
    const customerDoc = {
      title: customerData.title || '',
      firstName: customerData.firstName || '',
      lastName: customerData.lastName || '',
      fullName: customerData.fullName || `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),
      phone: customerData.phone || customerData.phoneNumber || '',
      idNumber: customerData.idNumber || '',
      address: customerData.address || {},
      totalContracts: 0,
      totalValue: 0,
      lastContractDate: null,
      contractsID: [], // Initialize as empty array
      storeId: new ObjectId(customerData.storeId),
      createdBy: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('customers').insertOne(customerDoc);

    return NextResponse.json({
      message: 'Customer created successfully',
      customer_id: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Create customer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}