import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/notifications/[id]/actions - Handle notification actions
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, message } = body;

    // Validate action
    const validActions = ['approve', 'reject', 'respond', 'confirm_payment'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const db = await getDatabase();

    // Get notification
    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(id)
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Verify user owns the store
    const store = await db.collection('stores').findOne({
      _id: notification.storeId,
      ownerId: new ObjectId(userId)
    });

    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const currentTime = new Date();
    let newStatus = notification.status;
    let responseData: any = null;

    // Handle different actions
    switch (action) {
      case 'approve':
        if (notification.type === 'redemption') {
          newStatus = 'approved';
          // For redemption, move to payment_pending after approval
          setTimeout(() => {
            // Update status to payment_pending after sending response
          }, 100);
        } else if (notification.type === 'interest_renewal') {
          newStatus = 'payment_pending';
        }

        // Add action to history
        await db.collection('notifications').updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { status: newStatus, updatedAt: currentTime },
            $push: {
              actions: {
                action: 'approve',
                message: message || 'อนุมัติคำขอ',
                timestamp: currentTime
              }
            }
          }
        );

        // Prepare response data for LINE
        responseData = {
          action: 'approved',
          message: message || 'อนุมัติคำขอเรียบร้อยแล้ว',
          qrCodeUrl: notification.qrCodeUrl,
          contractNumber: notification.contract.contractNumber,
          amount: notification.contract.amount
        };
        break;

      case 'reject':
        newStatus = 'rejected';

        await db.collection('notifications').updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { status: newStatus, updatedAt: currentTime },
            $push: {
              actions: {
                action: 'reject',
                message: message || 'ปฏิเสธคำขอ',
                timestamp: currentTime
              }
            }
          }
        );

        // Prepare response data for LINE
        responseData = {
          action: 'rejected',
          message: message || 'ขออภัย ไม่สามารถดำเนินการได้ในขณะนี้'
        };
        break;

      case 'respond':
        // Just add response message without changing status
        await db.collection('notifications').updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { updatedAt: currentTime },
            $push: {
              actions: {
                action: 'respond',
                message: message || '',
                timestamp: currentTime
              }
            }
          }
        );

        // Prepare response data for LINE
        responseData = {
          action: 'respond',
          message: message || ''
        };
        break;

      case 'confirm_payment':
        if (notification.status === 'payment_pending') {
          newStatus = 'completed';

          await db.collection('notifications').updateOne(
            { _id: new ObjectId(id) },
            {
              $set: { status: newStatus, updatedAt: currentTime },
              $push: {
                actions: {
                  action: 'confirm_payment',
                  message: 'ยืนยันการชำระเงินเรียบร้อยแล้ว',
                  timestamp: currentTime
                }
              }
            }
          );

          // Prepare response data for LINE
          responseData = {
            action: 'payment_confirmed',
            message: 'การชำระเงินได้รับการยืนยันเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ'
          };
        } else {
          return NextResponse.json({ error: 'Invalid status for payment confirmation' }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // TODO: Send response back to LINE webhook
    // This would typically involve calling LINE's API to send message back to user
    if (responseData) {
      try {
        // Example: Send to LINE webhook (you would implement this)
        console.log('Sending response to LINE:', {
          lineId: notification.customer.lineId,
          ...responseData
        });

        // Here you would make an HTTP request to LINE's webhook endpoint
        // const lineResponse = await fetch(process.env.LINE_WEBHOOK_URL, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     lineId: notification.customer.lineId,
        //     ...responseData
        //   })
        // });

      } catch (lineError) {
        console.error('Failed to send response to LINE:', lineError);
        // Don't fail the request if LINE webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      responseData
    });
  } catch (error) {
    console.error('Notification action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
