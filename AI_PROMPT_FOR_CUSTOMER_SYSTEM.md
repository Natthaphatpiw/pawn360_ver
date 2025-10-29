# 🤖 Prompt สำหรับ Claude Code AI: สร้างระบบลูกค้า (Customer System)

⚠️ **DEPRECATED**: เอกสารนี้เป็นเวอร์ชันเก่า กรุณาใช้ [AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md](./AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md) แทน ซึ่งมี:
- Schema ที่ถูกต้อง (collection `items`, field `desiredAmount`, `loanDays`)
- รองรับ 4 transaction types (redemption, extension, reduce principal, increase principal)
- มี validation warnings และ checklist

---

## 📋 Context

ฉันมีระบบ **Shop System** (ระบบร้านจำนำ) ที่ deploy อยู่ที่ `https://pawn360-ver.vercel.app/` แล้ว ตอนนี้ต้องการให้คุณสร้าง **Customer System** (ระบบลูกค้า) ที่ deploy ที่ `https://pawn360.vercel.app/` เพื่อให้ทั้ง 2 ระบบสื่อสารกันแบบ asynchronous ผ่าน webhook

---

## 🎯 วัตถุประสงค์

สร้างระบบที่ทำให้:
1. ลูกค้าสามารถกดปุ่มใน LINE เพื่อขอ "ไถ่ถอนสัญญา" หรือ "ต่อดอกเบี้ย"
2. ระบบส่งคำขอไปที่ Shop System
3. เมื่อพนักงานร้านยืนยัน/ปฏิเสธ → รับ webhook กลับมา
4. ส่ง LINE Flex Message Card พร้อม QR code ให้ลูกค้า
5. ลูกค้าอัพโหลดสลิปการโอนเงิน
6. ส่งสลิปไปที่ Shop System
7. รับ webhook แจ้งผลการตรวจสอบ
8. ส่ง LINE message แจ้งลูกค้าว่าสำเร็จ/ไม่สำเร็จ

---

## 📦 Stack ที่ใช้

- **Framework**: Next.js 14+ (App Router)
- **Database**: MongoDB (เชื่อมต่อเดียวกันกับ Shop System หรือใช้ database แยก)
- **LINE Integration**: LINE Messaging API
- **Language**: TypeScript
- **Deployment**: Vercel

---

## 🏗️ API Endpoints ที่ต้องสร้าง

### 1. **POST /api/webhooks/shop-notification**
รับ webhook จาก Shop System เมื่อพนักงานทำ action

**Request Body จาก Shop System:**
```typescript
{
  notificationId: string;
  type: 'action_response' | 'payment_received' | 'payment_verified';
  data: {
    action?: 'confirm' | 'reject';
    confirmed?: boolean;
    message: string;
    qrCodeUrl?: string;
    paymentProofUrl?: string;
    verified?: boolean;
    storeId: string;
    customerId: string;
    contractId: string;
    status: string;
  };
  timestamp: string;
  shopSystemUrl: string;
}
```

**หน้าที่:**
1. Validate webhook signature จาก header `X-Webhook-Signature`
2. เช็ค idempotency (ไม่ประมวลผล webhook ซ้ำ)
3. บันทึกลง database
4. ส่ง LINE Flex Message ตาม type:
   - `action_response` + `confirmed: true` → ส่ง card พร้อม QR code
   - `action_response` + `confirmed: false` → ส่งข้อความปฏิเสธ
   - `payment_verified` + `verified: true` → ส่งข้อความชำระสำเร็จ
   - `payment_verified` + `verified: false` → ส่งข้อความชำระไม่ผ่าน

**Response:**
```typescript
{ success: true, message: 'Webhook processed successfully' }
```

---

### 2. **POST /api/line/webhook**
รับ events จาก LINE (เมื่อลูกค้ากดปุ่ม/ส่งรูป)

**Request Body จาก LINE:**
```typescript
{
  destination: string;
  events: [
    {
      type: 'message' | 'postback';
      replyToken: string;
      source: {
        userId: string;
        type: 'user';
      };
      timestamp: number;
      message?: { type: 'image', id: string };
      postback?: { data: string }; // เช่น "action=redemption&contractId=xxx"
    }
  ]
}
```

**หน้าที่:**
- Validate LINE Signature
- Handle postback actions:
  - `action=redemption` → เรียก `/api/customer/request-redemption`
  - `action=extension` → เรียก `/api/customer/request-extension`
  - `action=upload_slip` → เรียก `/api/customer/upload-payment-proof`
- Handle image messages (สลิปการโอนเงิน)

---

### 3. **POST /api/customer/request-redemption**
ลูกค้าขอไถ่ถอนสัญญา

**Request Body:**
```typescript
{
  contractId: string;
  lineUserId: string;
  message: string;
}
```

**Logic:**
```typescript
// 1. ดึงข้อมูลสัญญาจาก database
const contract = await db.collection('contracts').findOne({ _id: contractId });

// 2. สร้าง callbackUrl
const callbackUrl = 'https://pawn360.vercel.app/api/webhooks/shop-notification';

// 3. POST ไปที่ Shop System
const response = await fetch('https://pawn360-ver.vercel.app/api/notifications/redemption', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storeId: contract.storeId,
    customerId: contract.customerId,
    contractId: contract._id,
    customerName: contract.customerName,
    phone: contract.phone,
    message: "ต้องการไถ่ถอนสัญญา",
    callbackUrl: callbackUrl
  })
});

const data = await response.json();

// 4. บันทึก notificationId
await db.collection('notifications').insertOne({
  shopNotificationId: data.notificationId,
  contractId: contractId,
  lineUserId: lineUserId,
  type: 'redemption',
  status: 'pending',
  createdAt: new Date()
});

// 5. Reply ใน LINE
await replyLineMessage(lineUserId, '✅ ส่งคำขอไถ่ถอนแล้ว รอพนักงานดำเนินการ');
```

---

### 4. **POST /api/customer/request-extension**
ลูกค้าขอต่อดอกเบี้ย (เหมือนกับ redemption)

**Endpoint:** เปลี่ยนเป็น
```typescript
fetch('https://pawn360-ver.vercel.app/api/notifications/extension', {...})
```

---

### 5. **POST /api/customer/upload-payment-proof**
ลูกค้าอัพโหลดสลิปการโอนเงิน

**Request Body:**
```typescript
{
  notificationId: string; // shopNotificationId
  lineUserId: string;
  imageId: string; // LINE image message ID
}
```

**Logic:**
```typescript
// 1. ดาวน์โหลดรูปจาก LINE
const imageBuffer = await downloadLineImage(imageId);

// 2. แปลงเป็น File/Blob
const imageFile = new File([imageBuffer], 'slip.jpg', { type: 'image/jpeg' });

// 3. ส่งไปที่ Shop System
const formData = new FormData();
formData.append('notificationId', notificationId);
formData.append('file', imageFile);

const response = await fetch('https://pawn360-ver.vercel.app/api/notifications/payment-proof', {
  method: 'POST',
  body: formData
});

const data = await response.json();

// 4. Reply ใน LINE
await replyLineMessage(lineUserId, '✅ อัพโหลดสลิปสำเร็จ กำลังรอพนักงานตรวจสอบ');
```

---

## 🎨 LINE Flex Message Templates

### Template 1: QR Code Card (เมื่อพนักงานยืนยัน)

```typescript
const flexMessage = {
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
      url: qrCodeUrl, // จาก webhook
      size: 'full',
      aspectRatio: '1:1'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: message, wrap: true },
        { type: 'separator', margin: 'md' },
        { type: 'text', text: 'กรุณาสแกน QR Code เพื่อชำระเงิน', size: 'sm', color: '#999999', margin: 'md' }
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
            data: `action=upload_slip&notificationId=${notificationId}`
          },
          style: 'primary',
          color: '#1DB446'
        }
      ]
    }
  }
};

await pushLineMessage(lineUserId, flexMessage);
```

### Template 2: สำเร็จ (เมื่อพนักงานยืนยันสลิป)

```typescript
const flexMessage = {
  type: 'flex',
  altText: 'การชำระเงินสำเร็จ',
  contents: {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: '✅ ชำระเงินสำเร็จ', weight: 'bold', color: '#1DB446', size: 'xl' }
      ]
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: message, wrap: true },
        { type: 'separator', margin: 'lg' },
        { type: 'text', text: 'สัญญาของคุณเสร็จสิ้นแล้ว', size: 'sm', color: '#999999', margin: 'md' }
      ]
    }
  }
};
```

---

## 🗄️ Database Schema

### Collection: `notifications`
```typescript
interface Notification {
  _id: ObjectId;
  shopNotificationId: string; // จาก Shop System
  contractId: ObjectId;
  customerId: ObjectId;
  lineUserId: string;
  type: 'redemption' | 'extension';
  status: 'pending' | 'confirmed' | 'rejected' | 'payment_pending' | 'completed';
  qrCodeUrl?: string;
  paymentProofUrl?: string;
  callbackUrl: string;
  lastWebhookAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Collection: `contracts`
```typescript
interface Contract {
  _id: ObjectId;
  contractNumber: string;
  customerId: ObjectId;
  storeId: ObjectId;
  principalAmount: number;
  interestRate: number;
  status: 'active' | 'completed' | 'expired';
  customerName: string;
  phone: string;
  lineUserId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔐 Security

### 1. Webhook Signature Verification
```typescript
// src/lib/webhook-security.ts
export function verifyWebhookSignature(
  payload: any,
  signature: string
): boolean {
  const secret = process.env.WEBHOOK_SECRET || 'pawn360-webhook-secret';
  const expectedSignature = Buffer.from(
    `${payload.notificationId}-${payload.timestamp}-${secret}`
  ).toString('base64');

  return signature === expectedSignature;
}
```

### 2. LINE Signature Verification
```typescript
// src/lib/line-security.ts
import crypto from 'crypto';

export function verifyLineSignature(
  body: string,
  signature: string
): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET!;
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return signature === hash;
}
```

---

## 🔧 Utility Functions

### 1. ดาวน์โหลดรูปจาก LINE
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
```

### 2. ส่ง LINE Message
```typescript
export async function pushLineMessage(
  userId: string,
  message: any
): Promise<void> {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: userId,
      messages: [message]
    })
  });
}

export async function replyLineMessage(
  replyToken: string,
  text: string
): Promise<void> {
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

สร้างไฟล์ `.env.local`:
```bash
# Shop System
SHOP_SYSTEM_URL=https://pawn360-ver.vercel.app

# Webhook Security
WEBHOOK_SECRET=pawn360-webhook-secret

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pawn360

# Next.js
NEXT_PUBLIC_APP_URL=https://pawn360.vercel.app
```

---

## 📂 File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── shop-notification/
│   │   │       └── route.ts          # รับ webhook จาก Shop System
│   │   ├── line/
│   │   │   └── webhook/
│   │   │       └── route.ts          # รับ events จาก LINE
│   │   └── customer/
│   │       ├── request-redemption/
│   │       │   └── route.ts
│   │       ├── request-extension/
│   │       │   └── route.ts
│   │       └── upload-payment-proof/
│   │           └── route.ts
│   └── contracts/
│       └── [id]/
│           └── page.tsx              # หน้าแสดงข้อมูลสัญญา
├── lib/
│   ├── mongodb.ts                    # MongoDB connection
│   ├── webhook-security.ts           # Webhook signature verification
│   ├── line-security.ts              # LINE signature verification
│   ├── line-client.ts                # LINE API utilities
│   └── line-templates.ts             # Flex Message templates
└── types/
    └── index.ts                      # TypeScript interfaces
```

---

## ✅ Implementation Checklist

- [ ] สร้าง Next.js project ใหม่
- [ ] ติดตั้ง dependencies: `mongodb`, `@line/bot-sdk`
- [ ] สร้าง MongoDB connection (`lib/mongodb.ts`)
- [ ] สร้าง `POST /api/webhooks/shop-notification`
- [ ] สร้าง `POST /api/line/webhook`
- [ ] สร้าง `POST /api/customer/request-redemption`
- [ ] สร้าง `POST /api/customer/request-extension`
- [ ] สร้าง `POST /api/customer/upload-payment-proof`
- [ ] สร้าง LINE Flex Message templates
- [ ] Implement webhook signature verification
- [ ] Implement LINE signature verification
- [ ] สร้าง utility functions สำหรับ LINE API
- [ ] เพิ่ม error handling และ logging
- [ ] ทดสอบ end-to-end workflow
- [ ] Deploy ไปที่ Vercel

---

## 🧪 Testing Workflow

1. **Setup LINE Bot:**
   - สร้าง LINE Official Account
   - เปิด Messaging API
   - ตั้ง Webhook URL: `https://pawn360.vercel.app/api/line/webhook`

2. **Test Redemption Flow:**
   - ส่งข้อความ "ขอไถ่ถอน" ใน LINE
   - Bot ควรแสดงรายการสัญญา (Rich Menu/Postback buttons)
   - กดปุ่ม → ส่งคำขอไป Shop System
   - พนักงานยืนยันในหน้า monitor
   - Bot ควรได้รับ webhook และส่ง QR code card
   - อัพโหลดสลิป → ส่งไป Shop System
   - พนักงานตรวจสอบสลิป
   - Bot ควรได้รับ webhook และส่งข้อความสำเร็จ

3. **Test Error Cases:**
   - ลองส่ง webhook ซ้ำ (ควร ignore)
   - ลองส่ง webhook ที่ signature ไม่ถูกต้อง (ควร reject)
   - ลองอัพโหลดไฟล์ที่ไม่ใช่รูป (ควร error)

---

## 📚 Resources

- [LINE Messaging API Docs](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Flex Message Simulator](https://developers.line.biz/flex-simulator/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)

---

## 🚀 Final Notes

- ระบบนี้ออกแบบเป็น **Asynchronous** เพื่อหลีกเลี่ยง timeout
- ทุก webhook มี retry mechanism จาก Shop System (3 ครั้ง)
- ใช้ idempotency เพื่อป้องกันการประมวลผล webhook ซ้ำ
- ทุก API ควรมี error handling และ logging
- ควรมี monitoring สำหรับ webhook failures

**เริ่มสร้างระบบได้เลย! ถ้ามีคำถามสามารถถามได้ตลอด** 🎉
