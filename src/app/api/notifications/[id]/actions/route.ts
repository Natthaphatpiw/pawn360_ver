import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserIdFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, responseMessage } = body; // action: 'confirm' | 'reject'

    if (!action || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "confirm" or "reject"' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get notification
    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(id)
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user owns the store
    const store = await db.collection('stores').findOne({
      _id: notification.storeId,
      ownerId: new ObjectId(userId)
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Unauthorized to access this notification' },
        { status: 403 }
      );
    }

    // Get QR code URL for the store
    const qrCodeUrl = store.bankUrl || `https://piwp360.s3.ap-southeast-2.amazonaws.com/bank/${store._id.toString()}.png`;

    // Update notification
    const updateData: any = {
      status: action === 'confirm' ? 'confirmed' : 'rejected',
      responseMessage: responseMessage || '',
      qrCodeUrl: action === 'confirm' ? qrCodeUrl : '',
      updatedAt: new Date()
    };

    await db.collection('notifications').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Prepare response for external system
    const responseData = {
      notificationId: id,
      action: action,
      confirmed: action === 'confirm',
      message: responseMessage || '',
      qrCodeUrl: action === 'confirm' ? qrCodeUrl : null,
      storeId: store._id.toString(),
      timestamp: new Date().toISOString()
    };

    // Here you would typically send this response to the external LINE service
    // For now, we'll just return it
    // TODO: Implement webhook call to external service

    return NextResponse.json({
      success: true,
      notification: {
        ...notification,
        ...updateData,
        _id: notification._id.toString(),
        storeId: notification.storeId.toString(),
        customerId: notification.customerId.toString(),
        contractId: notification.contractId.toString(),
      },
      responseData: responseData
    });

  } catch (error) {
    console.error('Notification action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}