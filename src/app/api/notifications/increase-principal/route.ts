import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    // Validate required fields
    const { storeId, customerId, contractId, increaseAmount, customerName, phone, callbackUrl } = body;

    if (!storeId || !customerId || !contractId || !increaseAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: storeId, customerId, contractId, increaseAmount' },
        { status: 400 }
      );
    }

    // Validate increaseAmount is positive number
    if (increaseAmount <= 0) {
      return NextResponse.json(
        { error: 'increaseAmount must be greater than 0' },
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

    // Create notification document
    const notificationDoc = {
      storeId: new ObjectId(storeId),
      customerId: new ObjectId(customerId),
      contractId: new ObjectId(contractId),
      type: 'increase_principal',
      status: 'pending', // pending -> confirmed/rejected -> completed (ลูกค้ารับเงิน ไม่ต้องโอนมา)
      message: `ต้องการเพิ่มเงินต้น ${increaseAmount.toLocaleString()} บาท`,
      customerName: customerName || '',
      phone: phone || '',
      callbackUrl: callbackUrl || '',
      increaseAmount: increaseAmount,
      currentPrincipal: currentPrincipal,
      newPrincipal: currentPrincipal + increaseAmount,
      responseMessage: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert notification
    const result = await db.collection('notifications').insertOne(notificationDoc);

    return NextResponse.json({
      success: true,
      notificationId: result.insertedId,
      message: 'Increase principal notification created successfully',
      currentPrincipal: currentPrincipal,
      increaseAmount: increaseAmount,
      newPrincipal: currentPrincipal + increaseAmount
    });

  } catch (error) {
    console.error('Increase principal notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
