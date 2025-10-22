import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserIdFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET /api/stores - Get all stores owned by the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const stores = await db.collection('stores')
      .find({ ownerId: new ObjectId(userId) })
      .toArray();

    // Convert ObjectIds to strings
    const formattedStores = stores.map(store => ({
      ...store,
      _id: store._id.toString(),
      ownerId: store.ownerId.toString()
    }));

    return NextResponse.json(formattedStores);
  } catch (error) {
    console.error('Get stores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stores - Create a new store for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeData = await request.json();

    if (!storeData.store_name || !storeData.address || !storeData.phone) {
      return NextResponse.json(
        { error: 'Store name, address, and phone are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get user's password hash
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const storeDoc = {
      storeName: storeData.store_name,
      phone: storeData.phone,
      taxId: storeData.tax_id || '',
      address: storeData.address,
      passwordHash: user.passwordHash, // Use owner's password hash
      ownerId: new ObjectId(userId),
      logoUrl: null,
      stampUrl: null,
      signatureUrl: null,
      interestRate: storeData.interestRate || [], // Array of {days: rate} objects
      contractTemplate: {
        header: 'สัญญาจำนำ',
        footer: 'ขอบคุณที่ใช้บริการ',
        terms: 'เงื่อนไขการจำนำมาตรฐาน'
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('stores').insertOne(storeDoc);

    // Get created store
    const store = await db.collection('stores').findOne({ _id: result.insertedId });
    if (store) {
      (store as any)._id = store._id.toString();
      (store as any).ownerId = store.ownerId.toString();
    }

    return NextResponse.json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    console.error('Create store error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
