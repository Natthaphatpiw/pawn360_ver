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

    // Get user's stores
    const userStores = await db.collection('stores').find({
      ownerId: new ObjectId(userId)
    }).toArray();

    const storeIds = userStores.map(store => store._id);

    // Get notifications for user's stores
    const notifications = await db.collection('notifications').find({
      storeId: { $in: storeIds }
    }).sort({ createdAt: -1 }).toArray();

    // Convert ObjectIds to strings
    const convertedNotifications = notifications.map(notification => ({
      ...notification,
      _id: notification._id.toString(),
      storeId: notification.storeId.toString(),
      customerId: notification.customerId.toString(),
      contractId: notification.contractId.toString(),
    }));

    return NextResponse.json(convertedNotifications);

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}