# 🔧 Troubleshooting Guide

---

## ❌ Webhook Error: "fetch failed"

### ปัญหาที่เจอ:

```
2025-10-29T07:05:44.645Z [info] [Webhook] Attempt 3/3 to http://localhost:3000/api/webhooks/shop-notification
2025-10-29T07:05:44.652Z [error] [Webhook] Error on attempt 3: fetch failed
2025-10-29T07:05:44.652Z [error] [Webhook] All 3 attempts failed
```

### สาเหตุ:

Webhook พยายามส่งไปที่ `http://localhost:3000/...` ซึ่งเป็น URL ของ local development environment ไม่สามารถเข้าถึงได้จาก Shop System ที่ deploy บน Vercel

### วิธีแก้:

#### 1. ตรวจสอบ callbackUrl ที่ส่งมา

เมื่อ Customer System ส่ง request มาที่ Shop System ต้องใช้ **production URL** ไม่ใช่ localhost:

**❌ ผิด:**
```json
{
  "callbackUrl": "http://localhost:3000/api/webhooks/shop-notification"
}
```

**✅ ถูก:**
```json
{
  "callbackUrl": "https://pawn360.vercel.app/api/webhooks/shop-notification"
}
```

#### 2. ตรวจสอบ Environment Variable

ใน Customer System ต้องตั้งค่า:

```bash
# .env.local (Development)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# .env.production (Vercel)
NEXT_PUBLIC_APP_URL=https://pawn360.vercel.app
```

แล้วใช้:
```typescript
const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shop-notification`;
```

#### 3. ตรวจสอบ Database

ถ้า notification ที่มีอยู่แล้วใน database มี callbackUrl เป็น localhost ให้อัพเดท:

```javascript
// MongoDB
db.notifications.updateMany(
  { callbackUrl: /localhost/ },
  { $set: { callbackUrl: "https://pawn360.vercel.app/api/webhooks/shop-notification" } }
)
```

---

## 🧪 Testing Webhooks Locally

### ปัญหา: ไม่สามารถทดสอบ webhook locally ได้

Shop System (Vercel) ไม่สามารถส่ง webhook มาที่ `localhost` ได้

### วิธีแก้: ใช้ ngrok

1. **ติดตั้ง ngrok:**
   ```bash
   brew install ngrok
   # หรือ
   npm install -g ngrok
   ```

2. **Run Customer System locally:**
   ```bash
   npm run dev
   # Running on http://localhost:3000
   ```

3. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **ใช้ ngrok URL แทน localhost:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **ส่ง request ด้วย ngrok URL:**
   ```json
   {
     "callbackUrl": "https://abc123.ngrok.io/api/webhooks/shop-notification"
   }
   ```

---

## 🔍 Debugging Webhook Issues

### 1. เช็ค Webhook Logs

ใน Shop System (Vercel):
```bash
vercel logs --follow
```

ดูว่า webhook ถูกส่งไปที่ URL ไหน

### 2. เช็คว่า Customer System รับ Webhook หรือไม่

เพิ่ม logging ใน Customer System:

```typescript
// src/app/api/webhooks/shop-notification/route.ts

export async function POST(request: NextRequest) {
  console.log('[Webhook] Received webhook from Shop System');
  console.log('[Webhook] Headers:', Object.fromEntries(request.headers));

  const body = await request.json();
  console.log('[Webhook] Body:', JSON.stringify(body, null, 2));

  // ... rest of code
}
```

### 3. ทดสอบ Manual Webhook

ใช้ `curl` หรือ Postman ทดสอบส่ง webhook:

```bash
curl -X POST https://pawn360.vercel.app/api/webhooks/shop-notification \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test-signature" \
  -d '{
    "notificationId": "test123",
    "type": "action_response",
    "data": {
      "action": "confirm",
      "confirmed": true,
      "message": "Test message",
      "qrCodeUrl": "https://example.com/qr.png"
    },
    "timestamp": "2025-10-29T07:00:00.000Z"
  }'
```

---

## 🚨 Common Issues

### Issue 1: "Invalid signature"

**สาเหตุ:** `WEBHOOK_SECRET` ไม่ตรงกันระหว่าง 2 ระบบ

**วิธีแก้:**
```bash
# ทั้ง 2 ระบบต้องใช้ secret เดียวกัน
WEBHOOK_SECRET=pawn360-webhook-secret
```

### Issue 2: "Notification not found"

**สาเหตุ:** Customer System หา notification ด้วย `shopNotificationId` ไม่เจอ

**วิธีแก้:**
```typescript
// ตรวจสอบว่าบันทึก notificationId ถูกต้อง
await db.collection('notifications').insertOne({
  shopNotificationId: data.notificationId, // ← ต้องเก็บ ID จาก Shop System
  // ...
});
```

### Issue 3: "Webhook timeout"

**สาเหตุ:** Customer System ใช้เวลานานเกิน 10 วินาที

**วิธีแก้:**
```typescript
// ทำงานที่หนักใน background
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Return 200 ทันที
  const response = NextResponse.json({ success: true });

  // ประมวลผลใน background (ไม่รอ)
  processWebhook(body).catch(console.error);

  return response;
}

async function processWebhook(body: any) {
  // ส่ง LINE message, อัพเดท database, etc.
}
```

### Issue 4: "Duplicate webhook processing"

**สาเหตุ:** ไม่มี idempotency check

**วิธีแก้:**
```typescript
// เช็คว่าประมวลผลแล้วหรือยัง
const existing = await db.collection('webhooks_log').findOne({
  notificationId,
  type,
  timestamp
});

if (existing) {
  return NextResponse.json({ success: true, message: 'Already processed' });
}

// บันทึก log
await db.collection('webhooks_log').insertOne({
  notificationId,
  type,
  timestamp,
  processedAt: new Date()
});
```

---

## 📊 Webhook Health Check

### ตรวจสอบสถานะ Webhook

สร้าง endpoint สำหรับดู webhook statistics:

```typescript
// src/app/api/admin/webhook-stats/route.ts

export async function GET(request: NextRequest) {
  const db = await getDatabase();

  const stats = await db.collection('webhooks_log').aggregate([
    {
      $group: {
        _id: { type: '$type', success: '$success' },
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  return NextResponse.json({ stats });
}
```

**Response:**
```json
{
  "stats": [
    { "_id": { "type": "action_response", "success": true }, "count": 45 },
    { "_id": { "type": "action_response", "success": false }, "count": 2 },
    { "_id": { "type": "payment_verified", "success": true }, "count": 38 }
  ]
}
```

---

## 🔄 Webhook Retry Strategy

Shop System มี retry mechanism ดังนี้:

```
Attempt 1: ส่งทันที
   ↓ fail
   รอ 1 วินาที

Attempt 2: ส่งครั้งที่ 2
   ↓ fail
   รอ 2 วินาที

Attempt 3: ส่งครั้งที่ 3 (สุดท้าย)
   ↓ fail

   บันทึก error log และยกเลิก
```

ถ้า webhook ล้มเหลวทั้ง 3 ครั้ง:
- พนักงานต้องแจ้งลูกค้าด้วยตนเอง
- หรือใช้ manual retry mechanism

---

## 🛠️ Manual Retry

สร้าง API สำหรับ retry webhook ด้วยตัวเอง:

```typescript
// src/app/api/admin/retry-webhook/route.ts

export async function POST(request: NextRequest) {
  const { notificationId } = await request.json();
  const db = await getDatabase();

  const notification = await db.collection('notifications').findOne({
    _id: new ObjectId(notificationId)
  });

  if (!notification || !notification.callbackUrl) {
    return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
  }

  // ส่ง webhook ใหม่
  const result = await sendActionResponseWebhook(
    notification.callbackUrl,
    notification._id.toString(),
    notification.status === 'confirmed' ? 'confirm' : 'reject',
    notification.responseMessage,
    notification.qrCodeUrl,
    notification.storeId.toString(),
    notification.customerId.toString(),
    notification.contractId.toString()
  );

  return NextResponse.json({ success: result.success, result });
}
```

---

## 📝 Best Practices

1. **Always use production URLs** - ไม่ใช้ localhost ใน production
2. **Implement idempotency** - ป้องกัน duplicate processing
3. **Log everything** - เก็บ log ทุก webhook event
4. **Quick response** - Return HTTP 200 ภายใน 1 วินาที
5. **Background processing** - ทำงานหนักใน background
6. **Error handling** - Catch และ log ทุก error
7. **Monitoring** - ติดตาม webhook success rate
8. **Manual retry** - มีช่องทางแก้ไขเมื่อ webhook ล้มเหลว

---

**ระบบพร้อมใช้งานและ debug ได้แล้ว!** 🎉
