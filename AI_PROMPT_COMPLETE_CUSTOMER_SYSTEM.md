# 🤖 Complete Prompt: Customer System with Principal Management
# สำหรับ Claude Code AI ในการสร้างระบบลูกค้าครบถ้วน

---

## 📋 Overview

สร้างระบบลูกค้า (Customer System) ที่ deploy ที่ `https://pawn360.vercel.app/` เพื่อสื่อสารกับ Shop System (`https://pawn360-ver.vercel.app/`) แบบ asynchronous ผ่าน webhook

ระบบรองรับ **4 ประเภทการทำรายการ**:
1. **Redemption** - ไถ่ถอนสัญญา
2. **Extension** - ต่อดอกเบี้ย
3. **Reduce Principal** - ลดเงินต้น
4. **Increase Principal** - เพิ่มเงินต้น

---

## 🏗️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: MongoDB
- **LINE**: LINE Messaging API
- **Language**: TypeScript
- **Deploy**: Vercel

---

## 🗄️ Database Schema

⚠️ **IMPORTANT: ใช้ collection `items` ไม่ใช่ `contracts`!**

### Collection: `items`

```typescript
interface Item {
  _id: ObjectId;
  lineId: string; // LINE User ID ของลูกค้า

  // ข้อมูลสินค้าที่จำนำ
  brand: string;
  model: string;
  type: string;
  serialNo: string;
  condition: number;
  defects: string;
  note: string;
  accessories: string;
  images: Array<string>;

  // ข้อมูลสัญญาจำนำ
  status: 'active' | 'redeem' | 'completed' | 'expired';
  currentContractId: ObjectId;
  contractHistory: Array<ObjectId>;

  // ข้อมูลการเงิน - ราคาเริ่มต้น (ก่อนต่อรอง)
  desiredAmount: number; // ⭐ เงินต้นที่ลูกค้าขอ (ก่อนต่อรอง)
  estimatedValue: number;
  loanDays: number; // ⭐ จำนวนวันสัญญา (ไม่ใช่ contractDays!)
  interestRate: number; // อัตราดอกเบี้ย % ต่อเดือน (เริ่มต้น)

  // 🔥 ข้อมูลสัญญาจริง (หลังต่อรอง) - สำคัญมาก!
  confirmationNewContract?: {
    itemId: string;
    pawnPrice: number; // 🔥 เงินต้นจริงหลังต่อรอง (ใช้ตัวนี้ในการคำนวณ!)
    interestRate: number; // 🔥 อัตราดอกเบี้ยจริงหลังต่อรอง
    loanDays: number;
    interest: number; // ดอกเบี้ยรวมทั้งหมด
    total: number; // ยอดรวมที่ต้องชำระ
    item: string;
  };
  confirmationStatus?: string; // 'confirmed', 'rejected', etc.
  confirmationTimestamp?: Date;
  confirmationModifications?: Array<string>; // รายการเปลี่ยนแปลงจากการต่อรอง

  // สำหรับคำนวณดอกเบี้ย (optional fields)
  lastInterestCutoffDate?: Date; // วันที่ตัดดอกครั้งล่าสุด
  accruedInterest?: number; // ดอกเบี้ยค้างสะสม

  // ประวัติ (optional fields)
  principalHistory?: Array<{
    type: 'reduce' | 'increase';
    changedAt: Date;
    previousPrincipal: number;
    newPrincipal: number;
    reduceAmount?: number;
    increaseAmount?: number;
    interestPaid?: number;
    interestCutoff?: number;
    totalPaid?: number;
    daysSinceLastCutoff?: number;
    notificationId: ObjectId;
  }>;

  extensionHistory?: Array<{
    extendedAt: Date;
    extensionDays: number; // จำนวนวันที่ต่อ
    notificationId: ObjectId;
  }>;

  redeemedAt?: Date;

  // อื่นๆ
  storeId: ObjectId;
  negotiationStatus?: string;
  createdAt: Date; // ⭐ วันเริ่มสัญญา (ไม่ใช่ startDate!)
  updatedAt: Date;

  // สำหรับการต่อรอง
  confirmationModifications?: Array<string>;
  confirmationNewContract?: Object;
  confirmationStatus?: string;
  confirmationTimestamp?: Date;
}
```

⚠️ **หมายเหตุสำคัญ**:
- ไม่มี field `dueDate` - ต้องคำนวณจาก `createdAt + loanDays`
- ไม่มี `contractNumber` - ใช้ `_id` หรือสร้างจาก business logic
- ไม่มี `customerName`, `phone` แยกไปอยู่ใน collection อื่น - ดึงมาผ่าน `lineId`

🔥 **CRITICAL - ราคาสัญญาจริง**:
- `desiredAmount` (เช่น 7,000) = ราคาที่ลูกค้า**ขอ** (ก่อนต่อรอง)
- `confirmationNewContract.pawnPrice` (เช่น 6,000) = ราคาที่ร้าน**ให้จริง** (หลังต่อรอง)
- **ใช้ `confirmationNewContract.pawnPrice` สำหรับคำนวณทุกอย่าง!**

ตัวอย่าง:
```typescript
// ✅ CORRECT - ใช้ราคาจริงหลังต่อรอง
const principal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;
const interestRate = item.confirmationNewContract?.interestRate || item.interestRate || 0;
```

### Collection: `notifications`

```typescript
interface Notification {
  _id: ObjectId;
  shopNotificationId: string; // notificationId จาก Shop System
  contractId: ObjectId;
  customerId: ObjectId;
  lineUserId: string;
  type: 'redemption' | 'extension' | 'reduce_principal' | 'increase_principal';
  status: 'pending' | 'confirmed' | 'rejected' | 'payment_pending' | 'completed';

  // สำหรับ principal change
  reduceAmount?: number;
  increaseAmount?: number;
  currentPrincipal?: number;
  newPrincipal?: number;

  callbackUrl: string;
  qrCodeUrl?: string;
  paymentProofUrl?: string;
  lastWebhookAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📡 API Endpoints ที่ต้องสร้าง

### 1. POST /api/webhooks/shop-notification
**รับ webhook จาก Shop System**

```typescript
// src/app/api/webhooks/shop-notification/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyWebhookSignature } from '@/lib/webhook-security';
import { sendLineFlexMessage, sendLineTextMessage } from '@/lib/line-client';
import { createQRCodeCard, createSuccessCard, createRejectionCard } from '@/lib/line-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('X-Webhook-Signature');

    // 1. Verify webhook signature
    if (!verifyWebhookSignature(body, signature || '')) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { notificationId, type, data, timestamp } = body;
    const db = await getDatabase();

    // 2. Check idempotency
    const existing = await db.collection('webhooks_log').findOne({
      notificationId,
      type,
      timestamp
    });

    if (existing) {
      console.log(`[Webhook] Duplicate webhook ignored: ${notificationId}`);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // 3. Log webhook
    await db.collection('webhooks_log').insertOne({
      notificationId,
      type,
      data,
      timestamp,
      receivedAt: new Date()
    });

    // 4. Get notification
    const notification = await db.collection('notifications').findOne({
      shopNotificationId: notificationId
    });

    if (!notification) {
      console.error(`[Webhook] Notification not found: ${notificationId}`);
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // 5. Get item (contract)
    const item = await db.collection('items').findOne({
      _id: notification.contractId
    });

    if (!item) {
      console.error(`[Webhook] Item not found: ${notification.contractId}`);
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // 6. Handle webhook based on type
    if (type === 'action_response') {
      await handleActionResponse(db, notification, item, data);
    } else if (type === 'payment_received') {
      await handlePaymentReceived(db, notification, item, data);
    } else if (type === 'payment_verified') {
      await handlePaymentVerified(db, notification, item, data);
    }

    // 7. Update notification
    await db.collection('notifications').updateOne(
      { _id: notification._id },
      {
        $set: {
          status: data.status || notification.status,
          lastWebhookAt: new Date()
        }
      }
    );

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleActionResponse(db: any, notification: any, item: any, data: any) {
  const { confirmed, message, qrCodeUrl } = data;

  if (confirmed) {
    // ยืนยัน - ส่ง Flex Message Card พร้อม QR code

    let flexMessage;

    if (notification.type === 'reduce_principal') {
      // ลดเงินต้น - แสดง QR code + ยอดที่ต้องชำระ
      flexMessage = createReducePrincipalCard({
        message,
        qrCodeUrl,
        notificationId: notification.shopNotificationId,
        reduceAmount: notification.reduceAmount,
        // TODO: คำนวณดอกเบี้ยค้าง + ยอดรวม
      });
    } else if (notification.type === 'increase_principal') {
      // เพิ่มเงินต้น - แจ้งให้มารับเงิน (ไม่มี QR code)
      flexMessage = createIncreasePrincipalCard({
        message,
        increaseAmount: notification.increaseAmount,
        storeName: 'ร้านจำนำ' // TODO: ดึงชื่อร้านจาก storeId
      });
    } else {
      // redemption/extension - แสดง QR code
      flexMessage = createQRCodeCard({
        message,
        qrCodeUrl,
        notificationId: notification.shopNotificationId,
        contractNumber: item._id.toString() // ⚠️ ไม่มี contractNumber - ใช้ _id
      });
    }

    await sendLineFlexMessage(item.lineId, flexMessage);

  } else {
    // ปฏิเสธ
    const rejectMessage = createRejectionCard({
      message: message || 'คำขอถูกปฏิเสธ',
      type: notification.type
    });

    await sendLineFlexMessage(item.lineId, rejectMessage);
  }
}

async function handlePaymentReceived(db: any, notification: any, item: any, data: any) {
  // แจ้งว่าได้รับสลิปแล้ว กำลังรอตรวจสอบ
  await sendLineTextMessage(
    item.lineId,
    '✅ ได้รับสลิปการโอนเงินเรียบร้อย\nกำลังรอพนักงานตรวจสอบ...'
  );
}

async function handlePaymentVerified(db: any, notification: any, item: any, data: any) {
  const { verified, message, status } = data;

  if (verified) {
    // ยืนยันการชำระเงิน
    let successMessage;

    if (notification.type === 'redemption') {
      successMessage = createSuccessCard({
        title: '✅ ไถ่ถอนสำเร็จ',
        message: message || 'สัญญาของคุณเสร็จสิ้นแล้ว',
        contractNumber: item._id.toString()
      });

      // อัพเดทสถานะ item
      await db.collection('items').updateOne(
        { _id: item._id },
        {
          $set: {
            status: 'redeem',
            redeemedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

    } else if (notification.type === 'extension') {
      // ต่อดอก - อัพเดทวันครบกำหนด (จาก Shop System)
      successMessage = createSuccessCard({
        title: '✅ ต่อดอกเบี้ยสำเร็จ',
        message: message || 'ต่อดอกเบี้ยเรียบร้อยแล้ว',
        contractNumber: item._id.toString()
      });

      // อัพเดท extension history
      await db.collection('items').updateOne(
        { _id: item._id },
        {
          $set: { updatedAt: new Date() },
          $push: {
            extensionHistory: {
              extendedAt: new Date(),
              extensionDays: item.loanDays || 7,
              notificationId: notification._id
            }
          }
        }
      );

    } else if (notification.type === 'reduce_principal') {
      successMessage = createSuccessCard({
        title: '✅ ลดเงินต้นสำเร็จ',
        message: `${message}\nเงินต้นใหม่: ${notification.newPrincipal?.toLocaleString()} บาท`,
        contractNumber: item._id.toString()
      });

      // อัพเดท confirmationNewContract.pawnPrice และ desiredAmount
      // (Shop System จะอัพเดทแล้ว แต่อัพเดทที่นี่เผื่อ sync)
      await db.collection('items').updateOne(
        { _id: item._id },
        {
          $set: {
            'confirmationNewContract.pawnPrice': notification.newPrincipal, // 🔥 อัพเดทราคาจริง
            desiredAmount: notification.newPrincipal, // backward compatibility
            updatedAt: new Date()
          }
        }
      );

    } else if (notification.type === 'increase_principal') {
      successMessage = createSuccessCard({
        title: '✅ เพิ่มวงเงินสำเร็จ',
        message: `${message}\nเงินต้นใหม่: ${notification.newPrincipal?.toLocaleString()} บาท`,
        contractNumber: item._id.toString()
      });

      // อัพเดท confirmationNewContract.pawnPrice และ desiredAmount
      await db.collection('items').updateOne(
        { _id: item._id },
        {
          $set: {
            'confirmationNewContract.pawnPrice': notification.newPrincipal, // 🔥 อัพเดทราคาจริง
            desiredAmount: notification.newPrincipal, // backward compatibility
            updatedAt: new Date()
          }
        }
      );
    }

    await sendLineFlexMessage(item.lineId, successMessage);

  } else {
    // ปฏิเสธการชำระเงิน
    await sendLineTextMessage(
      item.lineId,
      `❌ ${message || 'การชำระเงินไม่ผ่าน กรุณาติดต่อร้าน'}`
    );
  }
}
```

---

### 2. POST /api/customer/request-redemption
**ลูกค้าขอไถ่ถอน**

```typescript
// src/app/api/customer/request-redemption/route.ts

export async function POST(request: NextRequest) {
  const { contractId, lineUserId } = await request.json();
  const db = await getDatabase();

  // 1. Get item
  const item = await db.collection('items').findOne({
    _id: new ObjectId(contractId),
    lineId: lineUserId // ⚠️ ใช้ lineId ไม่ใช่ lineUserId
  });

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // TODO: ดึงข้อมูล customer จาก collection อื่น (ถ้ามี)
  // สมมติว่ามี customers collection หรือใช้ข้อมูลจาก LINE profile

  // 2. POST to Shop System
  const response = await fetch(`${process.env.SHOP_SYSTEM_URL}/api/notifications/redemption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeId: item.storeId.toString(),
      customerId: lineUserId, // หรือใช้ customerId จาก collection อื่น
      contractId: item._id.toString(),
      customerName: 'ลูกค้า', // TODO: ดึงจากที่อื่น
      phone: '', // TODO: ดึงจากที่อื่น
      message: `ต้องการไถ่ถอนสัญญา ${item._id.toString()}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shop-notification`
    })
  });

  const data = await response.json();

  if (!data.success) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }

  // 3. Save notification
  await db.collection('notifications').insertOne({
    shopNotificationId: data.notificationId,
    contractId: item._id,
    customerId: new ObjectId(lineUserId), // TODO: ใช้ customerId จริง
    lineUserId,
    type: 'redemption',
    status: 'pending',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shop-notification`,
    createdAt: new Date()
  });

  // 4. Reply LINE
  await replyLineMessage(lineUserId, '✅ ส่งคำขอไถ่ถอนแล้ว รอพนักงานดำเนินการ');

  return NextResponse.json({ success: true, notificationId: data.notificationId });
}
```

---

### 3. POST /api/customer/request-extension
**ลูกค้าขอต่อดอก (เหมือน redemption)**

```typescript
// เหมือนกับ redemption แต่เปลี่ยน type และ endpoint
fetch(`${process.env.SHOP_SYSTEM_URL}/api/notifications/extension`, {...})
```

---

### 4. POST /api/customer/request-reduce-principal
**ลูกค้าขอลดเงินต้น**

```typescript
// src/app/api/customer/request-reduce-principal/route.ts

export async function POST(request: NextRequest) {
  const { contractId, lineUserId, reduceAmount } = await request.json();
  const db = await getDatabase();

  // Validate reduceAmount
  if (!reduceAmount || reduceAmount <= 0) {
    return NextResponse.json({ error: 'Invalid reduceAmount' }, { status: 400 });
  }

  const item = await db.collection('items').findOne({
    _id: new ObjectId(contractId),
    lineId: lineUserId // ⚠️ ใช้ lineId
  });

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // 🔥 ใช้ confirmationNewContract.pawnPrice เป็นเงินต้นจริง
  const currentPrincipal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;

  // Check if reduceAmount < currentPrincipal
  if (reduceAmount >= currentPrincipal) {
    return NextResponse.json(
      { error: 'Reduce amount must be less than current principal' },
      { status: 400 }
    );
  }

  // POST to Shop System
  const response = await fetch(`${process.env.SHOP_SYSTEM_URL}/api/notifications/reduce-principal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeId: item.storeId.toString(),
      customerId: lineUserId, // TODO: ใช้ customerId จริง
      contractId: item._id.toString(),
      reduceAmount,
      customerName: 'ลูกค้า', // TODO: ดึงจากที่อื่น
      phone: '', // TODO: ดึงจากที่อื่น
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shop-notification`
    })
  });

  const data = await response.json();

  if (!data.success) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }

  // Save notification
  await db.collection('notifications').insertOne({
    shopNotificationId: data.notificationId,
    contractId: item._id,
    customerId: new ObjectId(lineUserId), // TODO: ใช้ customerId จริง
    lineUserId,
    type: 'reduce_principal',
    status: 'pending',
    reduceAmount,
    currentPrincipal: data.currentPrincipal,
    newPrincipal: data.newPrincipal,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shop-notification`,
    createdAt: new Date()
  });

  await replyLineMessage(lineUserId, `✅ ส่งคำขอลดเงินต้น ${reduceAmount.toLocaleString()} บาทแล้ว\nรอพนักงานดำเนินการ`);

  return NextResponse.json({ success: true, notificationId: data.notificationId });
}
```

---

### 5. POST /api/customer/request-increase-principal
**ลูกค้าขอเพิ่มเงินต้น**

```typescript
// เหมือนกับ reduce-principal แต่เปลี่ยน type และไม่ต้องเช็ค >= principalAmount
fetch(`${process.env.SHOP_SYSTEM_URL}/api/notifications/increase-principal`, {...})
```

---

### 6. POST /api/customer/upload-payment-proof
**อัพโหลดสลิปการโอนเงิน**

```typescript
export async function POST(request: NextRequest) {
  const { notificationId, lineUserId, imageId } = await request.json();

  // 1. Download image from LINE
  const imageBuffer = await downloadLineImage(imageId);

  // 2. Create FormData
  const formData = new FormData();
  formData.append('notificationId', notificationId);
  formData.append('file', new Blob([imageBuffer]), 'slip.jpg');

  // 3. Upload to Shop System
  const response = await fetch(`${process.env.SHOP_SYSTEM_URL}/api/notifications/payment-proof`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    await replyLineMessage(lineUserId, '✅ อัพโหลดสลิปสำเร็จ กำลังรอพนักงานตรวจสอบ');
  }

  return NextResponse.json({ success: true });
}
```

---

### 7. POST /api/line/webhook
**รับ events จาก LINE**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-line-signature');

  // Verify LINE signature
  if (!verifyLineSignature(body, signature || '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const { events } = JSON.parse(body);

  for (const event of events) {
    if (event.type === 'postback') {
      await handlePostback(event);
    } else if (event.type === 'message' && event.message.type === 'image') {
      await handleImageMessage(event);
    }
  }

  return NextResponse.json({ success: true });
}

async function handlePostback(event: any) {
  const data = new URLSearchParams(event.postback.data);
  const action = data.get('action');
  const contractId = data.get('contractId');
  const notificationId = data.get('notificationId');

  switch (action) {
    case 'redemption':
      await requestRedemption(contractId, event.source.userId);
      break;
    case 'extension':
      await requestExtension(contractId, event.source.userId);
      break;
    case 'reduce_principal':
      // TODO: Ask for amount via Rich Menu or Quick Reply
      break;
    case 'increase_principal':
      // TODO: Ask for amount
      break;
    case 'upload_slip':
      await replyLineMessage(event.replyToken, 'กรุณาส่งรูปสลิปการโอนเงิน');
      break;
  }
}

async function handleImageMessage(event: any) {
  // TODO: Find pending notification waiting for slip
  // Then call upload-payment-proof API
}
```

---

## 🎨 LINE Flex Message Templates

### 1. QR Code Card (ไถ่ถอน/ต่อดอก)

```typescript
// src/lib/line-templates.ts

export function createQRCodeCard(params: {
  message: string;
  qrCodeUrl: string;
  notificationId: string;
  contractNumber: string;
}) {
  return {
    type: 'flex',
    altText: 'คำขอของคุณได้รับการยืนยัน',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '✅ คำขอได้รับการยืนยัน', weight: 'bold', color: '#1DB446', size: 'lg' }
        ]
      },
      hero: {
        type: 'image',
        url: params.qrCodeUrl,
        size: 'full',
        aspectRatio: '1:1'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: params.message, wrap: true },
          { type: 'separator', margin: 'md' },
          { type: 'text', text: `สัญญา: ${params.contractNumber}`, size: 'sm', color: '#999999', margin: 'md' },
          { type: 'text', text: 'กรุณาสแกน QR Code เพื่อชำระเงิน', size: 'sm', color: '#999999' }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: 'อัพโหลดสลิปการโอน',
              data: `action=upload_slip&notificationId=${params.notificationId}`
            },
            style: 'primary',
            color: '#1DB446'
          }
        ]
      }
    }
  };
}
```

### 2. Reduce Principal Card (ลดเงินต้น พร้อมยอดที่ต้องชำระ)

```typescript
export function createReducePrincipalCard(params: {
  message: string;
  qrCodeUrl: string;
  notificationId: string;
  reduceAmount: number;
  interestAmount?: number; // คำนวณในระบบลูกค้า
  totalAmount?: number;
}) {
  const interest = params.interestAmount || 0;
  const total = params.totalAmount || (params.reduceAmount + interest);

  return {
    type: 'flex',
    altText: 'คำขอลดเงินต้นได้รับการยืนยัน',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '✅ ยืนยันการลดเงินต้น', weight: 'bold', color: '#1DB446', size: 'lg' }
        ]
      },
      hero: {
        type: 'image',
        url: params.qrCodeUrl,
        size: 'full',
        aspectRatio: '1:1'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: params.message, wrap: true, margin: 'md' },
          { type: 'separator', margin: 'lg' },
          { type: 'text', text: 'รายละเอียด', weight: 'bold', margin: 'lg' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'เงินต้นที่ลด', size: 'sm', color: '#555555', flex: 0 },
              { type: 'text', text: `${params.reduceAmount.toLocaleString()} บาท`, size: 'sm', align: 'end' }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'ดอกเบี้ยค้าง', size: 'sm', color: '#555555', flex: 0 },
              { type: 'text', text: `${interest.toLocaleString()} บาท`, size: 'sm', align: 'end' }
            ]
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'ยอดรวม', weight: 'bold', flex: 0 },
              { type: 'text', text: `${total.toLocaleString()} บาท`, weight: 'bold', align: 'end', color: '#1DB446' }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: 'อัพโหลดสลิปการโอน',
              data: `action=upload_slip&notificationId=${params.notificationId}`
            },
            style: 'primary',
            color: '#1DB446'
          }
        ]
      }
    }
  };
}
```

### 3. Increase Principal Card (เพิ่มเงินต้น - ไม่มี QR)

```typescript
export function createIncreasePrincipalCard(params: {
  message: string;
  increaseAmount: number;
  storeName: string;
}) {
  return {
    type: 'flex',
    altText: 'คำขอเพิ่มวงเงินได้รับการยืนยัน',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '✅ ยืนยันการเพิ่มวงเงิน', weight: 'bold', color: '#1DB446', size: 'lg' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: params.message, wrap: true },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: `เงินที่จะได้รับ: ${params.increaseAmount.toLocaleString()} บาท`, size: 'xl', weight: 'bold', color: '#1DB446', align: 'center' },
              { type: 'text', text: `กรุณามารับเงินที่ ${params.storeName}`, size: 'sm', color: '#999999', align: 'center', margin: 'md' }
            ],
            margin: 'lg'
          }
        ]
      }
    }
  };
}
```

### 4. Success Card

```typescript
export function createSuccessCard(params: {
  title: string;
  message: string;
  contractNumber: string;
}) {
  return {
    type: 'flex',
    altText: params.title,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: params.title, weight: 'bold', color: '#1DB446', size: 'xl' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: params.message, wrap: true },
          { type: 'separator', margin: 'lg' },
          { type: 'text', text: `สัญญา: ${params.contractNumber}`, size: 'sm', color: '#999999', margin: 'md' }
        ]
      }
    }
  };
}
```

---

## 🔒 Security Implementation

### Webhook Signature Verification

```typescript
// src/lib/webhook-security.ts

export function verifyWebhookSignature(payload: any, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET || 'pawn360-webhook-secret';
  const expectedSignature = Buffer.from(
    `${payload.notificationId}-${payload.timestamp}-${secret}`
  ).toString('base64');

  return signature === expectedSignature;
}
```

### LINE Signature Verification

```typescript
// src/lib/line-security.ts

import crypto from 'crypto';

export function verifyLineSignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET!;
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return signature === hash;
}
```

---

## 🛠️ Utility Functions

### LINE Client

```typescript
// src/lib/line-client.ts

export async function downloadLineImage(messageId: string): Promise<Buffer> {
  const response = await fetch(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      }
    }
  );

  return Buffer.from(await response.arrayBuffer());
}

export async function sendLineFlexMessage(userId: string, flexMessage: any): Promise<void> {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: userId,
      messages: [flexMessage]
    })
  });
}

export async function sendLineTextMessage(userId: string, text: string): Promise<void> {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text }]
    })
  });
}

export async function replyLineMessage(replyToken: string, text: string): Promise<void> {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }]
    })
  });
}
```

---

## 🌍 Environment Variables

```bash
# .env.local

# Shop System
SHOP_SYSTEM_URL=https://pawn360-ver.vercel.app

# Webhook Security
WEBHOOK_SECRET=pawn360-webhook-secret

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# MongoDB
MONGODB_URI=mongodb+srv://...

# App URL
NEXT_PUBLIC_APP_URL=https://pawn360.vercel.app
```

---

## ✅ Implementation Checklist

- [ ] สร้าง Next.js project
- [ ] ติดตั้ง dependencies: `mongodb`
- [ ] สร้าง MongoDB connection
- [ ] สร้าง POST /api/webhooks/shop-notification
- [ ] สร้าง POST /api/line/webhook
- [ ] สร้าง POST /api/customer/request-redemption
- [ ] สร้าง POST /api/customer/request-extension
- [ ] สร้าง POST /api/customer/request-reduce-principal
- [ ] สร้าง POST /api/customer/request-increase-principal
- [ ] สร้าง POST /api/customer/upload-payment-proof
- [ ] สร้าง LINE Flex Message templates (5 templates)
- [ ] Implement webhook signature verification
- [ ] Implement LINE signature verification
- [ ] สร้าง LINE client utilities
- [ ] เพิ่ม error handling และ logging
- [ ] ทดสอบ end-to-end ทั้ง 4 workflows
- [ ] Deploy ไปที่ Vercel

---

## 🎯 4 Complete Workflows

### 1. Redemption (ไถ่ถอน)
ลูกค้ากดปุ่ม → ส่งคำขอ → พนักงานยืนยัน → ส่ง QR → อัพโหลดสลิป → พนักงานยืนยันสลิป → สัญญา status = "redeem"

### 2. Extension (ต่อดอก)
เหมือน Redemption แต่อัพเดท extensionHistory และเพิ่มจำนวนวันที่ต่อ

### 3. Reduce Principal (ลดเงินต้น)
ลูกค้าระบุยอดที่ต้องการลด → พนักงานคำนวณดอกค้าง → ส่ง QR → อัพโหลดสลิป → พนักงานยืนยัน → อัพเดท `confirmationNewContract.pawnPrice` และ `desiredAmount`, ตัดดอกใหม่

### 4. Increase Principal (เพิ่มเงินต้น)
ลูกค้าระบุยอดที่ต้องการเพิ่ม → พนักงานยืนยัน → แจ้งให้มารับเงิน → ลูกค้ามารับเงิน → พนักงานยืนยันมอบเงิน → อัพเดท `confirmationNewContract.pawnPrice` และ `desiredAmount`, สะสมดอกค้าง

---

## ⚠️ CRITICAL: Common Schema Mistakes to AVOID

### ❌ WRONG (ห้ามใช้):
```typescript
// ❌ collection ผิด
const contract = await db.collection('contracts').findOne(...);

// ❌ field name ผิด
const principal = contract.principalAmount;
const days = contract.contractDays;
const startDate = contract.startDate;
const dueDate = contract.dueDate;

// ❌ ใช้ราคาผิด (ราคาที่ลูกค้าขอ ไม่ใช่ราคาจริง)
const principal = item.desiredAmount; // นี่คือราคาก่อนต่อรอง!
```

### ✅ CORRECT (ใช้แบบนี้):
```typescript
// ✅ collection ถูกต้อง
const item = await db.collection('items').findOne(...);

// ✅ field name ถูกต้อง
const days = item.loanDays;
const startDate = item.createdAt;

// 🔥 ใช้ราคาจริงหลังต่อรอง
const principal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;
const interestRate = item.confirmationNewContract?.interestRate || item.interestRate || 0;

// ⚠️ ไม่มี dueDate - ต้องคำนวณ: new Date(item.createdAt.getTime() + item.loanDays * 24*60*60*1000)
```

### 📋 Schema Validation Checklist

ก่อนสร้างโค้ดทุกครั้ง ต้องตรวจสอบ:

#### Collection & Field Names:
- [ ] ใช้ `db.collection('items')` **ไม่ใช่** `'contracts'`
- [ ] ใช้ `item.loanDays` **ไม่ใช่** `contract.contractDays`
- [ ] ใช้ `item.createdAt` **ไม่ใช่** `contract.startDate`
- [ ] ใช้ `item.lineId` **ไม่ใช่** `contract.lineUserId`
- [ ] **ไม่มี** `dueDate` field - ต้องคำนวณเอง

#### 🔥 Principal Amount (สำคัญมาก!):
- [ ] ใช้ `item.confirmationNewContract?.pawnPrice` เป็นอันดับแรก (ราคาจริงหลังต่อรอง)
- [ ] มี fallback เป็น `item.desiredAmount` (ราคาก่อนต่อรอง)
- [ ] ใช้ `item.confirmationNewContract?.interestRate` สำหรับดอกเบี้ยจริง
- [ ] เมื่ออัพเดทเงินต้น ต้องอัพเดททั้ง `confirmationNewContract.pawnPrice` และ `desiredAmount`

#### Other:
- [ ] ตรวจสอบ optional fields ก่อนใช้ (`confirmationNewContract`, `lastInterestCutoffDate`, `accruedInterest`)

---

**เริ่มสร้างระบบได้เลย! ระบบนี้ครบถ้วนพร้อมใช้งานจริง** 🚀

⚠️ **อย่าลืม**: ใช้ `items` collection และ field names ที่ถูกต้องทุกครั้ง!
