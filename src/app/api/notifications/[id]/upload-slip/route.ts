import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getUserIdFromToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'piwp360';

// POST /api/notifications/[id]/upload-slip - Upload payment slip
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const formData = await request.formData();
    const file = formData.get('slip') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const key = `slips/${id}_${timestamp}.${fileExtension}`;

    // Upload to S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // Make file publicly accessible
    });

    await s3Client.send(command);

    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${key}`;

    // Update notification with slip URL
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          slipUrl: publicUrl,
          updatedAt: new Date()
        },
        $push: {
          actions: {
            action: 'upload_slip',
            message: 'อัพโหลดสลิปการชำระเงินแล้ว',
            timestamp: new Date()
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      slipUrl: publicUrl
    });
  } catch (error) {
    console.error('Upload slip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
