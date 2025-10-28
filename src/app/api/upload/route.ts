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

// Helper function to upload file to S3
async function uploadToS3(file: File, key: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // Remove ACL - use bucket policy or presigned URLs instead
    });

  await s3Client.send(command);

  // Return the public URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${key}`;
}

// POST /api/upload - Upload file to S3
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo', 'signature', 'bank', etc.
    const storeId = formData.get('storeId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'File type is required' }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
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

    // Generate file key based on type
    let key = '';
    switch (type) {
      case 'logo':
        key = storeId === 'temp' ? `temp/shop_logo/${userId}_${Date.now()}.png` : `shop_logo/${storeId}.png`;
        break;
      case 'signature':
        key = storeId === 'temp' ? `temp/shop_signature/${userId}_${Date.now()}.png` : `shop_signature/${storeId}.png`;
        break;
      case 'bank':
        key = storeId === 'temp' ? `temp/bank/${userId}_${Date.now()}.png` : `bank/${storeId}.png`; // Store-specific QR code
        break;
      default:
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Upload to S3
    const fileUrl = await uploadToS3(file, key);

    // Update store with the file URL
    const db = await getDatabase();

    // Handle temporary uploads (for signup/account before store creation)
    if (storeId === 'temp') {
      // For temporary uploads, just return the URL without database operations
      return NextResponse.json({
        success: true,
        url: fileUrl,
        type,
        message: 'File uploaded successfully (temporary)'
      });
    }

    // Verify store ownership for regular uploads
    const store = await db.collection('stores').findOne({
      _id: new ObjectId(storeId),
      ownerId: new ObjectId(userId)
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Update the appropriate field
    const updateField = type === 'bank' ? 'bankUrl' : type;
    await db.collection('stores').updateOne(
      { _id: new ObjectId(storeId) },
      { $set: { [updateField]: fileUrl, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      url: fileUrl,
      type,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
