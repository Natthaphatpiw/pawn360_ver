import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { sendPaymentReceivedWebhook } from '@/lib/webhook';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'piwp360';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const notificationId = formData.get('notificationId') as string;
    const file = formData.get('file') as File;

    if (!notificationId || !file) {
      return NextResponse.json(
        { error: 'Missing notificationId or file' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if notification exists
    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(notificationId)
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const key = `payment_proofs/${notificationId}_${timestamp}.${fileExtension}`;

    // Upload to S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${key}`;

    // Update notification with payment proof
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(notificationId) },
      {
        $set: {
          paymentProofUrl: publicUrl,
          status: notification.status === 'confirmed' ? 'payment_pending' : notification.status,
          updatedAt: new Date()
        }
      }
    );

    // Send webhook to notify external system (LINE) that payment proof was received
    // This runs asynchronously in the background
    if (notification.callbackUrl) {
      console.log(`[PaymentProof] Sending webhook to ${notification.callbackUrl}`);

      // Fire and forget - don't await (truly asynchronous)
      sendPaymentReceivedWebhook(
        notification.callbackUrl,
        notificationId,
        publicUrl,
        notification.storeId.toString(),
        notification.customerId.toString(),
        notification.contractId.toString()
      ).then((result) => {
        if (result.success) {
          console.log(`[PaymentProof] Webhook sent successfully for notification ${notificationId}`);
        } else {
          console.error(`[PaymentProof] Webhook failed for notification ${notificationId}:`, result.error);
        }
      }).catch((error) => {
        console.error(`[PaymentProof] Webhook error for notification ${notificationId}:`, error);
      });
    } else {
      console.warn(`[PaymentProof] No callbackUrl for notification ${notificationId}, skipping webhook`);
    }

    return NextResponse.json({
      success: true,
      paymentProofUrl: publicUrl,
      message: 'Payment proof uploaded successfully'
    });

  } catch (error) {
    console.error('Payment proof upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
