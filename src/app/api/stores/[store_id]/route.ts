import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserIdFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{
    store_id: string;
  }>;
}

// GET /api/stores/[store_id] - Get a specific store owned by the authenticated user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = await params;

    if (!ObjectId.isValid(store_id)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const store = await db.collection('stores').findOne({
      _id: new ObjectId(store_id),
      ownerId: new ObjectId(userId)
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Convert ObjectIds to strings
    (store as any)._id = store._id.toString();
    (store as any).ownerId = store.ownerId.toString();

    return NextResponse.json(store);
  } catch (error) {
    console.error('Get store error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/stores/[store_id] - Update a store owned by the authenticated user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store_id } = await params;
    const storeData = await request.json();

    if (!ObjectId.isValid(store_id)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    const db = await getDatabase();

    // Verify ownership
    const existingStore = await db.collection('stores').findOne({
      _id: new ObjectId(store_id),
      ownerId: new ObjectId(userId)
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const updateDoc = {
      storeName: storeData.store_name,
      phone: storeData.phone,
      taxId: storeData.tax_id,
      address: storeData.address,
      interestRate: storeData.interestRate || [], // Update interest rates if provided
      updatedAt: new Date()
    };

    await db.collection('stores').updateOne(
      { _id: new ObjectId(store_id) },
      { $set: updateDoc }
    );

    return NextResponse.json({ message: 'Store updated successfully' });
  } catch (error) {
    console.error('Update store error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
