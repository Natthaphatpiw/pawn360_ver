import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    // Validate required fields
    const { storeId, customerId, contractId, reduceAmount, customerName, phone, callbackUrl } = body;

    if (!storeId || !customerId || !contractId || !reduceAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: storeId, customerId, contractId, reduceAmount' },
        { status: 400 }
      );
    }

    // Validate reduceAmount is positive number
    if (reduceAmount <= 0) {
      return NextResponse.json(
        { error: 'reduceAmount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate callbackUrl if provided
    if (callbackUrl) {
      try {
        new URL(callbackUrl);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid callbackUrl format' },
          { status: 400 }
        );
      }
    }

    // Check if item exists and get current principal
    const item = await db.collection('items').findOne({
      _id: new ObjectId(contractId),
      storeId: new ObjectId(storeId)
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item/Contract not found' },
        { status: 404 }
      );
    }

    // ⚠️ ใช้ confirmationNewContract.pawnPrice เป็นเงินต้นจริง
    const currentPrincipal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;

    // Validate reduce amount is not greater than current principal
    if (reduceAmount >= currentPrincipal) {
      return NextResponse.json(
        { error: 'Reduce amount cannot be greater than or equal to current principal' },
        { status: 400 }
      );
    }

    // Create notification document
    const notificationDoc = {
      storeId: new ObjectId(storeId),
      customerId: new ObjectId(customerId),
      contractId: new ObjectId(contractId),
      type: 'reduce_principal',
      status: 'pending', // pending -> confirmed/rejected -> payment_pending -> completed
      message: `ต้องการลดเงินต้น ${reduceAmount.toLocaleString()} บาท`,
      customerName: customerName || '',
      phone: phone || '',
      callbackUrl: callbackUrl || '',
      reduceAmount: reduceAmount,
      currentPrincipal: currentPrincipal,
      newPrincipal: currentPrincipal - reduceAmount,
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
      message: 'Reduce principal notification created successfully',
      currentPrincipal: currentPrincipal,
      reduceAmount: reduceAmount,
      newPrincipal: currentPrincipal - reduceAmount
    });

  } catch (error) {
    console.error('Reduce principal notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
