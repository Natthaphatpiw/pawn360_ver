import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const body = await request.json();

    // Validate required fields
    const { contractId, lineUserId, message, extensionDays } = body;

    if (!contractId || !lineUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: contractId, lineUserId' },
        { status: 400 }
      );
    }

    // Validate contractId format
    let objectId;
    try {
      objectId = new ObjectId(contractId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid contract ID format' },
        { status: 400 }
      );
    }

    // Query items collection (not contracts) as per spec
    const item = await db.collection('items').findOne({
      _id: objectId,
      lineId: lineUserId,
      status: 'active' // Only allow active items
    });

    if (!item) {
      return NextResponse.json(
        { error: 'pawn360.vercel.app ไม่พบรายการจำนำ' },
        { status: 404 }
      );
    }

    // Check if item has an active contract
    if (!item.currentContractId) {
      return NextResponse.json(
        { error: 'รายการจำนำนี้ไม่มีสัญญาที่ใช้งานอยู่' },
        { status: 400 }
      );
    }

    // Get contract details to include in the request
    const contract = await db.collection('contracts').findOne({
      _id: item.currentContractId
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสัญญา' },
        { status: 404 }
      );
    }

    // Prepare callback URL for webhook
    const callbackUrl = `${process.env.NEXT_PUBLIC_CUSTOMER_SYSTEM_URL || 'https://pawn360.vercel.app'}/api/webhooks/shop-notification`;

    // Prepare data to send to Shop System
    const shopRequestData = {
      storeId: item.storeId.toString(),
      customerId: contract.customerId.toString(),
      contractId: contract._id.toString(),
      message: message || `ลูกค้าขอต่อดอกเบี้ย ${extensionDays || 30} วัน สำหรับสัญญา ${contract.contractNumber}`,
      customerName: contract.customer?.fullName || 'ลูกค้า',
      phone: contract.customer?.phone || '',
      callbackUrl: callbackUrl,
      extensionDays: extensionDays || 30
    };

    // Send request to Shop System
    const shopSystemUrl = process.env.SHOP_SYSTEM_URL || 'https://pawn360-ver.vercel.app';
    const response = await fetch(`${shopSystemUrl}/api/notifications/extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shopRequestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `Failed to send request to shop system: ${errorData.error || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const shopResponse = await response.json();

    return NextResponse.json({
      success: true,
      message: 'คำขอต่อดอกเบี้ยถูกส่งไปยังร้านค้าเรียบร้อยแล้ว',
      notificationId: shopResponse.notificationId,
      item: {
        brand: item.brand,
        model: item.model,
        contractNumber: contract.contractNumber,
        extensionDays: extensionDays || 30
      }
    });

  } catch (error) {
    console.error('Customer extension request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
