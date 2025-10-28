import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserIdFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { sendPaymentVerifiedWebhook } from '@/lib/webhook';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { verified, responseMessage } = body; // verified: boolean

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid verified field. Must be boolean' },
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

    // Check if payment proof exists
    if (!notification.paymentProofUrl) {
      return NextResponse.json(
        { error: 'No payment proof uploaded yet' },
        { status: 400 }
      );
    }

    // Update notification status
    const newStatus = verified ? 'completed' : 'rejected';
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          responseMessage: responseMessage || (verified ? 'Payment verified' : 'Payment rejected'),
          updatedAt: new Date()
        }
      }
    );

    // Send webhook to external system (LINE) asynchronously
    if (notification.callbackUrl) {
      console.log(`[VerifyPayment] Sending webhook to ${notification.callbackUrl}`);

      // Fire and forget - don't await (truly asynchronous)
      sendPaymentVerifiedWebhook(
        notification.callbackUrl,
        id,
        verified,
        responseMessage || (verified ? 'Payment verified successfully' : 'Payment rejected'),
        store._id.toString(),
        notification.customerId.toString(),
        notification.contractId.toString()
      ).then((result) => {
        if (result.success) {
          console.log(`[VerifyPayment] Webhook sent successfully for notification ${id}`);
        } else {
          console.error(`[VerifyPayment] Webhook failed for notification ${id}:`, result.error);
        }
      }).catch((error) => {
        console.error(`[VerifyPayment] Webhook error for notification ${id}:`, error);
      });
    } else {
      console.warn(`[VerifyPayment] No callbackUrl for notification ${id}, skipping webhook`);
    }

    return NextResponse.json({
      success: true,
      notification: {
        _id: id,
        status: newStatus,
        verified: verified,
        message: responseMessage || (verified ? 'Payment verified' : 'Payment rejected')
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
