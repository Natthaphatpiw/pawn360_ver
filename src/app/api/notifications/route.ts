import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/notifications - Get notifications for user's stores
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    // Get user's stores
    const userStores = await db.collection('stores').find(
      { ownerId: new ObjectId(userId) },
      { projection: { _id: 1 } }
    ).toArray();

    const storeIds = userStores.map(store => store._id);

    if (storeIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get notifications for user's stores
    const notifications = await db.collection('notifications').find({
      storeId: { $in: storeIds }
    }).sort({ createdAt: -1 }).toArray();

    // Convert ObjectIds to strings and format response
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      _id: notification._id.toString(),
      storeId: notification.storeId.toString(),
      customer: {
        ...notification.customer,
        id: notification.customer.id ? notification.customer.id.toString() : undefined
      },
      actions: notification.actions?.map((action: any) => ({
        ...action,
        timestamp: action.timestamp
      })) || []
    }));

    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Create new notification (from LINE webhook)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type, // 'redemption' or 'interest_renewal'
      lineId,
      message,
      storeId,
      customerInfo,
      contractInfo
    } = body;

    // Validate required fields
    if (!type || !lineId || !storeId || !customerInfo || !contractInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDatabase();

    // Verify store exists
    const store = await db.collection('stores').findOne({ _id: new ObjectId(storeId) });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find customer by lineId
    const customer = await db.collection('customers').findOne({
      lineId: lineId,
      storeId: new ObjectId(storeId)
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create notification
    const notification = {
      type,
      status: 'pending',
      storeId: new ObjectId(storeId),
      customer: {
        id: customer._id,
        name: customer.name || customerInfo.name,
        phone: customer.phone || customerInfo.phone,
        lineId: lineId
      },
      contract: {
        contractNumber: contractInfo.contractNumber,
        item: contractInfo.item,
        amount: contractInfo.amount
      },
      message: message || '',
      qrCodeUrl: store.bankUrl || null, // QR code for payment
      slipUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      actions: []
    };

    const result = await db.collection('notifications').insertOne(notification);

    // Return formatted notification
    const formattedNotification = {
      ...notification,
      _id: result.insertedId.toString(),
      storeId: storeId,
      customer: {
        ...notification.customer,
        id: notification.customer.id.toString()
      }
    };

    return NextResponse.json(formattedNotification, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
