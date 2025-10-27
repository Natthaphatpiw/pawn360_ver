import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    // Validate required fields
    const { storeId, customerId, contractId, message, customerName, phone } = body;

    if (!storeId || !customerId || !contractId) {
      return NextResponse.json(
        { error: 'Missing required fields: storeId, customerId, contractId' },
        { status: 400 }
      );
    }

    // Create notification document
    const notificationDoc = {
      storeId: new ObjectId(storeId),
      customerId: new ObjectId(customerId),
      contractId: new ObjectId(contractId),
      type: 'redemption',
      status: 'pending', // pending -> confirmed/rejected
      message: message || '',
      customerName: customerName || '',
      phone: phone || '',
      responseMessage: '',
      qrCodeUrl: '',
      paymentProofUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert notification
    const result = await db.collection('notifications').insertOne(notificationDoc);

    return NextResponse.json({
      success: true,
      notificationId: result.insertedId,
      message: 'Redemption notification created successfully'
    });

  } catch (error) {
    console.error('Redemption notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
