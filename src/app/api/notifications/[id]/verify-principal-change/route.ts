import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getUserIdFromToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { sendPaymentVerifiedWebhook } from '@/lib/webhook';
import { calculatePrincipalReduction, calculateInterestCutoff, calculateDaysBetween } from '@/lib/interest-calculator';

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

    // Check if notification is for principal change
    if (!['reduce_principal', 'increase_principal'].includes(notification.type)) {
      return NextResponse.json(
        { error: 'This endpoint is only for principal change notifications' },
        { status: 400 }
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

    // For reduce_principal, check if payment proof exists
    if (notification.type === 'reduce_principal' && !notification.paymentProofUrl) {
      return NextResponse.json(
        { error: 'No payment proof uploaded yet for principal reduction' },
        { status: 400 }
      );
    }

    // Get item/contract
    const item = await db.collection('items').findOne({
      _id: notification.contractId
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item/Contract not found' },
        { status: 404 }
      );
    }

    // Update notification status
    const newStatus = verified ? 'completed' : 'rejected';
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          responseMessage: responseMessage || (verified ? 'Principal change verified' : 'Principal change rejected'),
          updatedAt: new Date()
        }
      }
    );

    // Update item/contract if verified
    if (verified) {
      const lastCutoffDate = item.lastInterestCutoffDate || item.createdAt;
      const daysSinceLastCutoff = calculateDaysBetween(new Date(lastCutoffDate), new Date());

      // ⚠️ ใช้ confirmationNewContract.pawnPrice เป็นเงินต้นจริง
      const currentPrincipal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;

      // ⚠️ ใช้ confirmationNewContract.interestRate เป็นอัตราดอกเบี้ยจริง
      const interestRate = item.confirmationNewContract?.interestRate || item.interestRate || 0;

      if (notification.type === 'reduce_principal') {
        // ลดเงินต้น
        const calculation = calculatePrincipalReduction(
          currentPrincipal,
          notification.reduceAmount,
          interestRate,
          daysSinceLastCutoff
        );

        // อัพเดท confirmationNewContract.pawnPrice และ desiredAmount
        await db.collection('items').updateOne(
          { _id: notification.contractId },
          {
            $set: {
              'confirmationNewContract.pawnPrice': calculation.newPrincipal, // ⚠️ อัพเดทเงินต้นใน confirmationNewContract
              desiredAmount: calculation.newPrincipal, // อัพเดทใน desiredAmount ด้วย (เพื่อ backward compatibility)
              lastInterestCutoffDate: new Date(), // ตัดดอกใหม่
              accruedInterest: 0, // reset ดอกเบี้ยค้าง (เพราะลูกค้าจ่ายแล้ว)
              updatedAt: new Date()
            },
            $push: {
              principalHistory: {
                type: 'reduce',
                changedAt: new Date(),
                previousPrincipal: currentPrincipal,
                newPrincipal: calculation.newPrincipal,
                reduceAmount: notification.reduceAmount,
                interestPaid: calculation.interestPayment,
                totalPaid: calculation.totalPayment,
                daysSinceLastCutoff: daysSinceLastCutoff,
                notificationId: new ObjectId(id)
              }
            }
          }
        );

        console.log(`[VerifyPrincipalChange] Principal reduced: ${item._id}, new principal: ${calculation.newPrincipal}`);

      } else if (notification.type === 'increase_principal') {
        // เพิ่มเงินต้น
        const interestCutoff = calculateInterestCutoff(
          currentPrincipal,
          interestRate,
          daysSinceLastCutoff
        );

        // อัพเดท confirmationNewContract.pawnPrice และ desiredAmount
        await db.collection('items').updateOne(
          { _id: notification.contractId },
          {
            $set: {
              'confirmationNewContract.pawnPrice': notification.newPrincipal, // ⚠️ อัพเดทเงินต้นใน confirmationNewContract
              desiredAmount: notification.newPrincipal, // อัพเดทใน desiredAmount ด้วย (เพื่อ backward compatibility)
              lastInterestCutoffDate: new Date(), // ตัดดอกใหม่
              accruedInterest: (item.accruedInterest || 0) + interestCutoff.interestAmount, // เพิ่มดอกค้าง
              updatedAt: new Date()
            },
            $push: {
              principalHistory: {
                type: 'increase',
                changedAt: new Date(),
                previousPrincipal: currentPrincipal,
                newPrincipal: notification.newPrincipal,
                increaseAmount: notification.increaseAmount,
                interestCutoff: interestCutoff.interestAmount,
                daysSinceLastCutoff: daysSinceLastCutoff,
                notificationId: new ObjectId(id)
              }
            }
          }
        );

        console.log(`[VerifyPrincipalChange] Principal increased: ${item._id}, new principal: ${notification.newPrincipal}`);
      }
    }

    // Send webhook to external system asynchronously
    if (notification.callbackUrl) {
      console.log(`[VerifyPrincipalChange] Sending webhook to ${notification.callbackUrl}`);

      sendPaymentVerifiedWebhook(
        notification.callbackUrl,
        id,
        verified,
        responseMessage || (verified ? `${notification.type === 'reduce_principal' ? 'Principal reduction' : 'Principal increase'} completed` : 'Principal change rejected'),
        store._id.toString(),
        notification.customerId.toString(),
        notification.contractId.toString()
      ).then((result) => {
        if (result.success) {
          console.log(`[VerifyPrincipalChange] Webhook sent successfully for notification ${id}`);
        } else {
          console.error(`[VerifyPrincipalChange] Webhook failed for notification ${id}:`, result.error);
        }
      }).catch((error) => {
        console.error(`[VerifyPrincipalChange] Webhook error for notification ${id}:`, error);
      });
    } else {
      console.warn(`[VerifyPrincipalChange] No callbackUrl for notification ${id}, skipping webhook`);
    }

    return NextResponse.json({
      success: true,
      notification: {
        _id: id,
        type: notification.type,
        status: newStatus,
        verified: verified,
        message: responseMessage || (verified ? 'Principal change verified' : 'Principal change rejected')
      }
    });

  } catch (error) {
    console.error('Principal change verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
