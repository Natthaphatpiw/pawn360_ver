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

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');
    const id_number = searchParams.get('id_number');
    const store_id = searchParams.get('store_id');

    if (!store_id) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const query: any = { storeId: new ObjectId(store_id) };

    if (phone) {
      query.phone = { $regex: phone, $options: 'i' };
    }
    if (name) {
      // Search in both firstName, lastName, and fullName
      query.$or = [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
        { fullName: { $regex: name, $options: 'i' } }
      ];
    }
    if (id_number) {
      query.idNumber = { $regex: id_number, $options: 'i' };
    }

    const customers = await db.collection('customers')
      .find(query)
      .limit(10)
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
    console.error('Customer search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
