# Customer System API Specification
# สำหรับระบบลูกค้า (https://pawn360.vercel.app/)

## 📋 ภาพรวมของระบบ

ระบบประกอบด้วย 2 ส่วนหลัก:

1. **Shop System (ระบบร้านค้า)**: `https://pawn360-ver.vercel.app/`
   - เป็น SaaS ที่พนักงานร้านจำนำใช้งาน
   - มีหน้า `/monitor` สำหรับดูแจ้งเตือนและตอบรับ/ปฏิเสธคำขอ
   - มีระบบ webhook ส่งกลับไปยัง Customer System

2. **Customer System (ระบบลูกค้า)**: `https://pawn360.vercel.app/`
   - เป็นระบบที่ลูกค้าใช้จัดการสัญญาจำนำของตนเอง
   - เชื่อมต่อกับ LINE สำหรับส่ง Flex Message (Card) ไปหาลูกค้า
   - รับ webhook กลับมาจาก Shop System

---

## 🔄 การสื่อสารระหว่าง 2 ระบบ

```
┌─────────────────────────────────────────────────────────────────┐
│                    Customer System Workflow                     │
│                  (https://pawn360.vercel.app/)                  │
└─────────────────────────────────────────────────────────────────┘

1. ลูกค้ากดปุ่มในระบบ → Customer System สร้างคำขอ
   ↓
2. POST ไปยัง Shop System: /api/notifications/redemption
   (พร้อม callbackUrl สำหรับรับ webhook กลับมา)
   ↓
3. Shop System ตอบกลับทันที: HTTP 200 + notificationId
   ↓
4. [รอพนักงานดำเนินการ - อาจใช้เวลานาน]
   ↓
5. ระบบลูกค้ารับ webhook จาก Shop System ที่ callbackUrl
   → POST /api/webhooks/shop-notification
   ↓
6. Customer System ส่ง LINE Flex Message ไปหาลูกค้า
   (แสดง QR code ถ้าพนักงานยืนยัน)
   ↓
7. [ลูกค้าชำระเงิน แล้วอัพโหลดสลิป]
   ↓
8. Customer System ส่งสลิปไป Shop System
   → POST /api/notifications/payment-proof
   ↓
9. รับ webhook แจ้งว่าพนักงานตรวจสอบสลิปแล้ว
   ↓
10. ส่ง LINE message แจ้งผลการตรวจสอบให้ลูกค้า
```

---

## 🛠️ API Endpoints ที่ Customer System ต้องสร้าง

### 1. POST /api/webhooks/shop-notification
**รับ webhook จาก Shop System เมื่อพนักงานดำเนินการ**

#### Request Body (จาก Shop System):
```json
{
  "notificationId": "651234567890abcdef12348",
  "type": "action_response",
  "data": {
    "action": "confirm",
    "confirmed": true,
    "message": "ยอมรับคำขอไถ่ถอนแล้ว กรุณาชำระเงินตาม QR Code",
    "qrCodeUrl": "https://pawn360.s3.ap-southeast-2.amazonaws.com/bank/xxx.png",
    "storeId": "651234567890abcdef12345",
    "customerId": "651234567890abcdef12346",
    "contractId": "651234567890abcdef12347"
  },
  "timestamp": "2025-10-28T06:18:47.942Z",
  "shopSystemUrl": "https://pawn360-ver.vercel.app"
}
```

#### Response:
```json
{
  "success": true,
  "message": "Webhook received successfully"
}
```

#### หน้าที่:
1. บันทึก webhook ลง database
2. ดึงข้อมูลลูกค้าและ LINE User ID จาก `customerId`
3. ส่ง LINE Flex Message Card ไปหาลูกค้า:
   - ถ้า `confirmed: true` → แสดง QR code พร้อมปุ่ม "อัพโหลดสลิป"
   - ถ้า `confirmed: false` → แสดงข้อความปฏิเสธ

---

### 2. POST /api/webhooks/shop-notification (type: payment_received)
**รับ webhook เมื่อลูกค้าอัพโหลดสลิปแล้ว**

#### Request Body:
```json
{
  "notificationId": "651234567890abcdef12348",
  "type": "payment_received",
  "data": {
    "paymentProofUrl": "https://pawn360.s3.ap-southeast-2.amazonaws.com/payment_proofs/xxx.jpg",
    "storeId": "651234567890abcdef12345",
    "customerId": "651234567890abcdef12346",
    "contractId": "651234567890abcdef12347",
    "status": "payment_pending"
  },
  "timestamp": "2025-10-28T06:25:30.123Z",
  "shopSystemUrl": "https://pawn360-ver.vercel.app"
}
```

#### หน้าที่:
1. บันทึกว่าได้รับสลิปแล้ว
2. (Optional) ส่ง LINE message แจ้งลูกค้าว่า "กำลังรอพนักงานตรวจสอบ"

---

### 3. POST /api/webhooks/shop-notification (type: payment_verified)
**รับ webhook เมื่อพนักงานตรวจสอบสลิปเสร็จ**

#### Request Body:
```json
{
  "notificationId": "651234567890abcdef12348",
  "type": "payment_verified",
  "data": {
    "verified": true,
    "message": "ตรวจสอบการชำระเงินเรียบร้อยแล้ว",
    "storeId": "651234567890abcdef12345",
    "customerId": "651234567890abcdef12346",
    "contractId": "651234567890abcdef12347",
    "status": "completed"
  },
  "timestamp": "2025-10-28T06:30:15.456Z",
  "shopSystemUrl": "https://pawn360-ver.vercel.app"
}
```

#### หน้าที่:
1. อัพเดทสถานะสัญญา (`contractId`) เป็น "completed" หรือ "rejected"
2. ส่ง LINE Flex Message แจ้งผลการตรวจสอบ:
   - ถ้า `verified: true` → "✅ การชำระเงินสำเร็จ! สัญญาของคุณเสร็จสิ้นแล้ว"
   - ถ้า `verified: false` → "❌ การชำระเงินไม่ผ่าน กรุณาติดต่อร้าน"

---

### 4. GET /api/customer/contracts/{contractId}
**ดึงข้อมูลสัญญาเพื่อส่งไปยัง Shop System**

#### Response:
```json
{
  "_id": "651234567890abcdef12347",
  "lineId": "U1234567890abcdef",
  "storeId": "651234567890abcdef12345",
  "brand": "Apple",
  "model": "iPhone 12 pro",
  "type": "โทรศัพท์",
  "desiredAmount": 50000,
  "loanDays": 7,
  "interestRate": 3,
  "status": "active",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

⚠️ **หมายเหตุ**: ไม่มี `contractNumber`, `customerName`, `phone` ใน collection `items` - ต้องดึงจาก LINE Profile API หรือ collection อื่น

---

### 5. POST /api/customer/request-redemption
**ลูกค้ากดปุ่ม "ขอไถ่ถอน" ใน LINE**

#### Request Body (จาก LINE Bot):
```json
{
  "contractId": "651234567890abcdef12347",
  "lineUserId": "U1234567890abcdef",
  "message": "ต้องการไถ่ถอนสัญญา CT-2025-001"
}
```

#### หน้าที่:
1. ดึงข้อมูล item จาก database (collection: `items` ⚠️)
2. สร้าง `callbackUrl` = `https://pawn360.vercel.app/api/webhooks/shop-notification`
3. POST ไปยัง Shop System:

```javascript
// ⚠️ ใช้ collection 'items' ไม่ใช่ 'contracts'
const item = await db.collection('items').findOne({
  _id: new ObjectId(contractId),
  lineId: lineUserId  // ⚠️ ใช้ lineId
});

const response = await fetch('https://pawn360-ver.vercel.app/api/notifications/redemption', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    storeId: item.storeId.toString(),
    customerId: lineUserId, // TODO: ใช้ customerId จริง
    contractId: item._id.toString(),
    customerName: 'ลูกค้า', // TODO: ดึงจาก LINE Profile API
    phone: '', // TODO: ดึงจาก collection อื่น
    message: "ต้องการไถ่ถอนสินค้าที่จำนำไว้",
    callbackUrl: "https://pawn360.vercel.app/api/webhooks/shop-notification"
  })
});

const data = await response.json();
// { success: true, notificationId: "..." }
```

4. บันทึก `notificationId` ลง database เพื่อใช้ track status ต่อ
5. ตอบกลับใน LINE: "✅ ส่งคำขอไถ่ถอนแล้ว รอพนักงานดำเนินการ"

---

### 6. POST /api/customer/request-extension
**ลูกค้ากดปุ่ม "ขอต่อดอกเบี้ย" ใน LINE**

เหมือนกับ redemption แต่เปลี่ยนเป็น:
```javascript
fetch('https://pawn360-ver.vercel.app/api/notifications/extension', {...})
```

---

### 7. POST /api/customer/upload-payment-proof
**ลูกค้าอัพโหลดสลิปการโอนเงิน**

#### Request Body (multipart/form-data จาก LINE):
```
notificationId: "651234567890abcdef12348"
file: [รูปสลิป.jpg]
```

#### หน้าที่:
1. รับไฟล์จาก LINE (ใช้ LINE Messaging API เพื่อดาวน์โหลดรูป)
2. ส่งต่อไปยัง Shop System:

```javascript
const formData = new FormData();
formData.append('notificationId', notificationId);
formData.append('file', imageFile);

const response = await fetch('https://pawn360-ver.vercel.app/api/notifications/payment-proof', {
  method: 'POST',
  body: formData
});

const data = await response.json();
// { success: true, paymentProofUrl: "..." }
```

3. ตอบกลับใน LINE: "✅ อัพโหลดสลิปสำเร็จ กำลังรอพนักงานตรวจสอบ"

---

## 🎨 LINE Flex Message Templates

### Template 1: แจ้งผลการยืนยัน (มี QR Code)

```json
{
  "type": "flex",
  "altText": "คำขอไถ่ถอนของคุณได้รับการยืนยันแล้ว",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "✅ คำขอได้รับการยืนยัน",
          "weight": "bold",
          "color": "#1DB446",
          "size": "lg"
        }
      ]
    },
    "hero": {
      "type": "image",
      "url": "{{qrCodeUrl}}",
      "size": "full",
      "aspectRatio": "1:1",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "{{message}}",
          "wrap": true
        },
        {
          "type": "separator",
          "margin": "md"
        },
        {
          "type": "text",
          "text": "กรุณาสแกน QR Code เพื่อชำระเงิน",
          "size": "sm",
          "color": "#999999",
          "margin": "md"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "uri",
            "label": "อัพโหลดสลิปการโอน",
            "uri": "line://nv/camera"
          },
          "style": "primary",
          "color": "#1DB446"
        }
      ]
    }
  }
}
```

### Template 2: แจ้งผลการตรวจสอบสลิป (สำเร็จ)

```json
{
  "type": "flex",
  "altText": "การชำระเงินของคุณสำเร็จแล้ว",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "✅ ชำระเงินสำเร็จ",
          "weight": "bold",
          "color": "#1DB446",
          "size": "xl"
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "{{message}}",
          "wrap": true,
          "size": "md"
        },
        {
          "type": "separator",
          "margin": "lg"
        },
        {
          "type": "text",
          "text": "สัญญาของคุณเสร็จสิ้นแล้ว",
          "size": "sm",
          "color": "#999999",
          "margin": "md"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "uri",
            "label": "ดูสัญญาของฉัน",
            "uri": "https://pawn360.vercel.app/contracts/{{contractId}}"
          },
          "style": "primary"
        }
      ]
    }
  }
}
```

---

## 🔐 Security Recommendations

### 1. ตรวจสอบ Webhook Signature
```javascript
// ใน /api/webhooks/shop-notification
export async function POST(request: Request) {
  const signature = request.headers.get('X-Webhook-Signature');
  const body = await request.json();

  // ตรวจสอบ signature
  const expectedSignature = generateWebhookSignature(body);
  if (signature !== expectedSignature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ประมวลผล webhook...
}

function generateWebhookSignature(payload: any): string {
  const secret = process.env.WEBHOOK_SECRET || 'pawn360-webhook-secret';
  return Buffer.from(`${payload.notificationId}-${payload.timestamp}-${secret}`).toString('base64');
}
```

### 2. Rate Limiting
ใช้ middleware เพื่อป้องกัน webhook spam

### 3. Idempotency
เช็คว่า `notificationId` ซ้ำหรือไม่ก่อนประมวลผล

---

## 📦 Database Schema สำหรับ Customer System

### Collection: `notifications`
```javascript
{
  _id: ObjectId,
  notificationId: String, // จาก Shop System
  contractId: ObjectId,
  customerId: ObjectId,
  lineUserId: String,
  type: 'redemption' | 'extension',
  status: 'pending' | 'confirmed' | 'rejected' | 'payment_pending' | 'completed',
  shopNotificationId: String, // notificationId จาก Shop System
  callbackUrl: String,
  qrCodeUrl: String,
  paymentProofUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `items` ⚠️ (ไม่ใช่ `contracts`)
```javascript
{
  _id: ObjectId,
  lineId: String,              // ⚠️ LINE User ID (ใช้ lineId ไม่ใช่ lineUserId)

  // ข้อมูลสินค้าที่จำนำ
  brand: String,
  model: String,
  type: String,
  serialNo: String,
  condition: Number,
  defects: String,
  note: String,
  accessories: String,
  images: Array<String>,

  // ข้อมูลสัญญา
  status: 'active' | 'redeem' | 'completed' | 'expired',
  currentContractId: ObjectId,
  contractHistory: Array<ObjectId>,

  // ข้อมูลการเงิน - ⚠️ ชื่อจริง!
  desiredAmount: Number,       // ⚠️ เงินต้น (ไม่ใช่ principalAmount)
  estimatedValue: Number,
  loanDays: Number,            // ⚠️ จำนวนวัน (ไม่ใช่ contractDays)
  interestRate: Number,        // อัตราดอกเบี้ย % ต่อเดือน

  // สำหรับคำนวณดอกเบี้ย
  lastInterestCutoffDate: Date,
  accruedInterest: Number,

  // ประวัติ
  principalHistory: Array<Object>,
  extensionHistory: Array<Object>,
  redeemedAt: Date,

  // อื่นๆ
  storeId: ObjectId,
  negotiationStatus: String,
  createdAt: Date,             // ⚠️ วันเริ่มสัญญา (ไม่ใช่ startDate)
  updatedAt: Date
}
```

⚠️ **IMPORTANT**:
- Collection name คือ `items` **ไม่ใช่** `contracts`
- ใช้ `desiredAmount` **ไม่ใช่** `principalAmount`
- ใช้ `loanDays` **ไม่ใช่** `contractDays`
- ใช้ `lineId` **ไม่ใช่** `lineUserId`
- ไม่มี `dueDate` - ต้องคำนวณจาก `createdAt + loanDays`

---

## 🚀 การ Deploy และ Environment Variables

### `.env` สำหรับ Customer System:
```bash
# Shop System URL
SHOP_SYSTEM_URL=https://pawn360-ver.vercel.app

# Webhook Secret (ต้องตรงกับ Shop System)
WEBHOOK_SECRET=pawn360-webhook-secret

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# MongoDB
MONGODB_URI=mongodb+srv://...

# AWS S3 (ถ้าต้องการเก็บไฟล์เอง)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=pawn360-customer
AWS_REGION=ap-southeast-2
```

---

## ✅ Testing Workflow

### Test Case 1: ไถ่ถอนสำเร็จ
1. ลูกค้ากดปุ่ม "ขอไถ่ถอน" ใน LINE
2. Customer System → POST `/api/notifications/redemption` → Shop System
3. Shop System ตอบกลับทันที: `{ success: true, notificationId: "xxx" }`
4. พนักงานเห็นแจ้งเตือนในหน้า `/monitor`
5. พนักงานกด "ยืนยัน" + พิมพ์ข้อความ
6. Shop System → POST webhook → Customer System `/api/webhooks/shop-notification`
7. Customer System ส่ง LINE Flex Message พร้อม QR code
8. ลูกค้าชำระเงิน + อัพโหลดสลิป
9. Customer System → POST `/api/notifications/payment-proof` → Shop System
10. พนักงานตรวจสอบสลิปในหน้า `/monitor`
11. พนักงานกด "ยืนยันการชำระ"
12. Shop System → POST webhook → Customer System
13. Customer System ส่ง LINE message "ชำระเงินสำเร็จ"

---

## 🎯 Summary Checklist

ระบบลูกค้าต้องสร้าง:

- [ ] `POST /api/webhooks/shop-notification` - รับ webhook จาก Shop System
- [ ] `POST /api/customer/request-redemption` - ลูกค้าขอไถ่ถอน
- [ ] `POST /api/customer/request-extension` - ลูกค้าขอต่อดอกเบี้ย
- [ ] `POST /api/customer/upload-payment-proof` - อัพโหลดสลิป
- [ ] `GET /api/customer/contracts/{contractId}` - ดึงข้อมูลสัญญา
- [ ] LINE Bot Webhook Handler - รับ events จาก LINE
- [ ] LINE Flex Message Templates - 3 templates
- [ ] Database Schema - `notifications` และ `items` ⚠️
- [ ] Webhook Signature Verification - ตรวจสอบ security
- [ ] Environment Variables - กำหนดค่าใน `.env`

---

## ⚠️ CRITICAL: Database Schema Warnings

### ❌ WRONG (ห้ามใช้):
```javascript
// ❌ Collection ผิด
const contract = await db.collection('contracts').findOne(...);

// ❌ Field names ผิด
const principal = contract.principalAmount;
const days = contract.contractDays;
const userId = contract.lineUserId;
```

### ✅ CORRECT (ใช้แบบนี้):
```javascript
// ✅ Collection ถูกต้อง
const item = await db.collection('items').findOne(...);

// ✅ Field names ถูกต้อง
const principal = item.desiredAmount;
const days = item.loanDays;
const userId = item.lineId;
```

### 📋 Schema Validation Checklist

ก่อนเขียนโค้ดทุกครั้ง ต้องตรวจสอบ:

- [ ] ใช้ `db.collection('items')` **ไม่ใช่** `'contracts'`
- [ ] ใช้ `item.desiredAmount` **ไม่ใช่** `contract.principalAmount`
- [ ] ใช้ `item.loanDays` **ไม่ใช่** `contract.contractDays`
- [ ] ใช้ `item.lineId` **ไม่ใช่** `contract.lineUserId`
- [ ] ใช้ `item.createdAt` **ไม่ใช่** `contract.startDate`
- [ ] **ไม่มี** `dueDate` field - ต้องคำนวณเอง
- [ ] ตรวจสอบ optional fields ก่อนใช้

---

## 📖 Resources

- [LINE Messaging API Docs](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Flex Message Simulator](https://developers.line.biz/flex-simulator/)
- [Shop System API Docs](https://pawn360-ver.vercel.app/api.txt)
- [CORRECTED_SCHEMA_DOCUMENTATION.md](./CORRECTED_SCHEMA_DOCUMENTATION.md) - **อ่านก่อนเขียนโค้ด!**

---

**ระบบนี้ออกแบบมาเป็น Asynchronous เพื่อหลีกเลี่ยงปัญหา timeout และให้ทั้ง 2 ระบบทำงานอิสระกันได้!** 🚀

⚠️ **อย่าลืม**: ใช้ `items` collection และ field names ที่ถูกต้องทุกครั้ง!
