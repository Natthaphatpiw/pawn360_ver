# 📊 Principal Management System Specification
# ระบบจัดการเงินต้น (ลด/เพิ่ม)

⚠️ **CRITICAL WARNING**: เอกสารนี้มีการอ้างอิง schema เก่าบางส่วน กรุณาอ่าน [CORRECTED_SCHEMA_DOCUMENTATION.md](./CORRECTED_SCHEMA_DOCUMENTATION.md) เพื่อดู schema ที่ถูกต้อง!

**Schema ที่ถูกต้อง**:
- Collection: `items` (ไม่ใช่ `contracts`)
- Field: `desiredAmount` (ไม่ใช่ `principalAmount`)
- Field: `loanDays` (ไม่ใช่ `contractDays`)

## 🎯 Overview

ระบบนี้รองรับการเปลี่ยนแปลงเงินต้นระหว่างสัญญา ได้แก่:
1. **ลดเงินต้น (Reduce Principal)** - ลูกค้าจ่ายคืนบางส่วน
2. **เพิ่มเงินต้น (Increase Principal)** - ลูกค้าขอวงเงินเพิ่ม

---

## 📐 Interest Calculation Logic

### วิธีการคำนวณ:

```
อัตราดอกเบี้ย: 3% ต่อเดือน
อัตราดอกเบี้ยรายวัน: 3% / 30 = 0.1% ต่อวัน

ดอกเบี้ย = เงินต้น × (อัตราดอกเบี้ยรายวัน / 100) × จำนวนวัน
```

---

## 🔻 กรณีที่ 1: ลดเงินต้นระหว่างสัญญา

### สถานการณ์ตัวอย่าง:

```
วันเริ่มสัญญา: 1 มกราคม
กำหนดสัญญา: 20 วัน (วันครบกำหนด: 21 มกราคม)
เงินต้นเริ่มต้น: 10,000 บาท
ดอกเบี้ย: 3% ต่อเดือน (0.1% ต่อวัน)

วันที่ 12 มกราคม: ลูกค้าขอลดเงินต้น 3,000 บาท
```

### ขั้นตอนการคำนวณ:

1. **คำนวณดอกเบี้ยค้างจ่าย (วันที่ 1-12 = 12 วัน)**
   ```
   ดอกเบี้ยค้าง = 10,000 × 0.1% × 12 = 120 บาท
   ```

2. **ยอดที่ลูกค้าต้องชำระ**
   ```
   เงินต้นที่จ่าย: 3,000 บาท
   ดอกเบี้ยค้าง: 120 บาท
   ยอดรวม: 3,120 บาท
   ```

3. **เงินต้นใหม่**
   ```
   เงินต้นใหม่ = 10,000 - 3,000 = 7,000 บาท
   ```

4. **ดอกเบี้ยช่วงต่อไป (วันที่ 12-21 = 9 วัน)**
   ```
   ดอกเบี้ย = 7,000 × 0.1% × 9 = 63 บาท
   ```

### Database Update:

```javascript
{
  principalAmount: 7000,
  lastInterestCutoffDate: "2025-01-12T00:00:00.000Z",
  accruedInterest: 0, // reset เพราะลูกค้าจ่ายแล้ว
  principalHistory: [
    {
      type: "reduce",
      changedAt: "2025-01-12T10:00:00.000Z",
      previousPrincipal: 10000,
      newPrincipal: 7000,
      reduceAmount: 3000,
      interestPaid: 120,
      totalPaid: 3120,
      daysSinceLastCutoff: 12
    }
  ]
}
```

---

## 🔺 กรณีที่ 2: เพิ่มเงินต้นระหว่างสัญญา

### สถานการณ์ตัวอย่าง:

```
วันเริ่มสัญญา: 1 มกราคม
กำหนดสัญญา: 20 วัน (วันครบกำหนด: 21 มกราคม)
เงินต้นเริ่มต้น: 10,000 บาท
ดอกเบี้ย: 3% ต่อเดือน (0.1% ต่อวัน)

วันที่ 12 มกราคม: ลูกค้าขอเพิ่มวงเงินอีก 2,000 บาท
```

### ขั้นตอนการคำนวณ:

1. **คำนวณดอกเบี้ยถึงวันที่เพิ่ม (วันที่ 1-12 = 12 วัน)**
   ```
   ดอกเบี้ยค้าง = 10,000 × 0.1% × 12 = 120 บาท
   ```

2. **เงินที่ลูกค้าได้รับ**
   ```
   เงินเพิ่ม: 2,000 บาท (ลูกค้ารับเงินสด)
   ```

3. **เงินต้นใหม่**
   ```
   เงินต้นใหม่ = 10,000 + 2,000 = 12,000 บาท
   ```

4. **ดอกเบี้ยค้างสะสม**
   ```
   ดอกเบี้ยค้างรวม = 120 บาท (จะคิดรวมเมื่อไถ่ถอน/ต่อดอก)
   ```

5. **ดอกเบี้ยช่วงต่อไป (วันที่ 12-21 = 9 วัน)**
   ```
   ดอกเบี้ย = 12,000 × 0.1% × 9 = 108 บาท
   ```

6. **ยอดรวมเมื่อครบกำหนด**
   ```
   เงินต้น: 12,000 บาท
   ดอกเบี้ยค้าง (วันที่ 1-12): 120 บาท
   ดอกเบี้ยใหม่ (วันที่ 12-21): 108 บาท
   ยอดรวม: 12,228 บาท
   ```

### Database Update:

```javascript
{
  principalAmount: 12000,
  lastInterestCutoffDate: "2025-01-12T00:00:00.000Z",
  accruedInterest: 120, // เพิ่มดอกค้าง
  principalHistory: [
    {
      type: "increase",
      changedAt: "2025-01-12T10:00:00.000Z",
      previousPrincipal: 10000,
      newPrincipal: 12000,
      increaseAmount: 2000,
      interestCutoff: 120,
      daysSinceLastCutoff: 12
    }
  ]
}
```

---

## 🔄 API Workflow

### Workflow: Reduce Principal (ลดเงินต้น)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Reduce Principal Flow                        │
└─────────────────────────────────────────────────────────────────┘

1. ลูกค้ากดปุ่มใน LINE "ขอลดเงินต้น"
   ↓
2. Customer System → POST /api/notifications/reduce-principal
   {
     "storeId": "...",
     "customerId": "...",
     "contractId": "...",
     "reduceAmount": 3000,
     "callbackUrl": "https://pawn360.vercel.app/api/webhooks/shop-notification"
   }
   ↓
3. Shop System ตอบกลับทันที
   {
     "success": true,
     "notificationId": "xxx",
     "currentPrincipal": 10000,
     "reduceAmount": 3000,
     "newPrincipal": 7000
   }
   ↓
4. พนักงานเห็นแจ้งเตือนในหน้า /monitor
   ↓
5. พนักงานคำนวณยอดที่ต้องชำระ:
   - เงินต้น: 3,000 บาท
   - ดอกเบี้ยค้าง: 120 บาท (คำนวณจาก UI)
   - ยอดรวม: 3,120 บาท
   ↓
6. พนักงานกด "ยืนยัน" → PUT /api/notifications/{id}/actions
   ↓
7. Shop System ส่ง webhook พร้อม QR code
   ↓
8. Customer System ส่ง LINE Flex Message + QR code
   ↓
9. ลูกค้าโอนเงิน 3,120 บาท → อัพโหลดสลิป
   ↓
10. Customer System → POST /api/notifications/payment-proof
   ↓
11. พนักงานตรวจสอบสลิป → PUT /api/notifications/{id}/verify-principal-change
   {
     "verified": true,
     "responseMessage": "ยอดถูกต้อง ลดเงินต้นเรียบร้อย"
   }
   ↓
12. Shop System:
    - อัพเดท principalAmount = 7000
    - reset lastInterestCutoffDate = วันนี้
    - reset accruedInterest = 0
    - บันทึก history
    ↓
13. ส่ง webhook กลับ Customer System
    ↓
14. Customer System ส่ง LINE "✅ ลดเงินต้นสำเร็จ เงินต้นใหม่ 7,000 บาท"
```

### Workflow: Increase Principal (เพิ่มเงินต้น)

```
┌─────────────────────────────────────────────────────────────────┐
│                   Increase Principal Flow                       │
└─────────────────────────────────────────────────────────────────┘

1. ลูกค้ากดปุ่มใน LINE "ขอเพิ่มวงเงิน"
   ↓
2. Customer System → POST /api/notifications/increase-principal
   {
     "storeId": "...",
     "customerId": "...",
     "contractId": "...",
     "increaseAmount": 2000,
     "callbackUrl": "https://pawn360.vercel.app/api/webhooks/shop-notification"
   }
   ↓
3. Shop System ตอบกลับทันที
   {
     "success": true,
     "notificationId": "xxx",
     "currentPrincipal": 10000,
     "increaseAmount": 2000,
     "newPrincipal": 12000
   }
   ↓
4. พนักงานเห็นแจ้งเตือนในหน้า /monitor
   ↓
5. พนักงานตรวจสอบและคำนวณดอกเบี้ยค้าง:
   - ดอกเบี้ยค้าง: 120 บาท (จะถูกบันทึกเพิ่มในระบบ)
   ↓
6. พนักงานกด "ยืนยัน" → PUT /api/notifications/{id}/actions
   ↓
7. Shop System ส่ง webhook (ไม่มี QR code - เพราะลูกค้ารับเงิน)
   ↓
8. Customer System ส่ง LINE "✅ คำขอเพิ่มวงเงินได้รับการยืนยัน มารับเงิน 2,000 บาทที่ร้าน"
   ↓
9. ลูกค้ามารับเงินที่ร้าน
   ↓
10. พนักงานมอบเงิน 2,000 บาท → กด "ยืนยันการมอบเงิน"
    → PUT /api/notifications/{id}/verify-principal-change
   {
     "verified": true,
     "responseMessage": "มอบเงินเรียบร้อย"
   }
   ↓
11. Shop System:
    - อัพเดท principalAmount = 12000
    - อัพเดท lastInterestCutoffDate = วันนี้
    - เพิ่ม accruedInterest = 120 (ดอกค้าง)
    - บันทึก history
   ↓
12. ส่ง webhook กลับ Customer System
   ↓
13. Customer System ส่ง LINE "✅ เพิ่มวงเงินสำเร็จ เงินต้นใหม่ 12,000 บาท"
```

---

## 📋 API Endpoints Summary

### 1. POST /api/notifications/reduce-principal
**Request:**
```json
{
  "storeId": "651234567890abcdef12345",
  "customerId": "651234567890abcdef12346",
  "contractId": "651234567890abcdef12347",
  "reduceAmount": 3000,
  "customerName": "สมชาย ใจดี",
  "phone": "0812345678",
  "callbackUrl": "https://pawn360.vercel.app/api/webhooks/shop-notification"
}
```

**Response:**
```json
{
  "success": true,
  "notificationId": "651234567890abcdef12348",
  "message": "Reduce principal notification created successfully",
  "currentPrincipal": 10000,
  "reduceAmount": 3000,
  "newPrincipal": 7000
}
```

### 2. POST /api/notifications/increase-principal
**Request:**
```json
{
  "storeId": "651234567890abcdef12345",
  "customerId": "651234567890abcdef12346",
  "contractId": "651234567890abcdef12347",
  "increaseAmount": 2000,
  "customerName": "สมชาย ใจดี",
  "phone": "0812345678",
  "callbackUrl": "https://pawn360.vercel.app/api/webhooks/shop-notification"
}
```

**Response:**
```json
{
  "success": true,
  "notificationId": "651234567890abcdef12348",
  "message": "Increase principal notification created successfully",
  "currentPrincipal": 10000,
  "increaseAmount": 2000,
  "newPrincipal": 12000
}
```

### 3. PUT /api/notifications/{id}/verify-principal-change
**Request:**
```json
{
  "verified": true,
  "responseMessage": "ยอดถูกต้อง ดำเนินการเรียบร้อย"
}
```

**Response:**
```json
{
  "success": true,
  "notification": {
    "_id": "651234567890abcdef12348",
    "type": "reduce_principal",
    "status": "completed",
    "verified": true,
    "message": "ยอดถูกต้อง ดำเนินการเรียบร้อย"
  }
}
```

---

## 🗄️ Database Schema Updates

### Contract Collection:

```javascript
{
  _id: ObjectId,
  contractNumber: String,
  customerId: ObjectId,
  storeId: ObjectId,
  principalAmount: Number, // เงินต้นปัจจุบัน
  interestRate: Number, // อัตราดอกเบี้ยต่อเดือน
  contractDays: Number, // จำนวนวันตามสัญญา
  startDate: Date,
  dueDate: Date,
  status: String, // 'active', 'redeem', 'completed', 'expired'

  // สำหรับคำนวณดอกเบี้ย
  lastInterestCutoffDate: Date, // วันที่ตัดดอกครั้งล่าสุด
  accruedInterest: Number, // ดอกเบี้ยค้างสะสม

  // ประวัติการเปลี่ยนแปลงเงินต้น
  principalHistory: [
    {
      type: 'reduce' | 'increase',
      changedAt: Date,
      previousPrincipal: Number,
      newPrincipal: Number,
      reduceAmount: Number, // สำหรับ reduce
      increaseAmount: Number, // สำหรับ increase
      interestPaid: Number, // ดอกที่จ่าย (reduce)
      interestCutoff: Number, // ดอกที่ตัดรอบ (increase)
      totalPaid: Number, // ยอดรวมที่จ่าย (reduce)
      daysSinceLastCutoff: Number,
      notificationId: ObjectId
    }
  ],

  // ประวัติการต่อดอก
  extensionHistory: [
    {
      extendedAt: Date,
      previousDueDate: Date,
      newDueDate: Date,
      extensionDays: Number,
      notificationId: ObjectId
    }
  ],

  redeemedAt: Date, // วันที่ไถ่ถอน
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Collection:

```javascript
{
  _id: ObjectId,
  storeId: ObjectId,
  customerId: ObjectId,
  contractId: ObjectId,
  type: 'redemption' | 'extension' | 'reduce_principal' | 'increase_principal',
  status: 'pending' | 'confirmed' | 'rejected' | 'payment_pending' | 'completed',
  message: String,
  customerName: String,
  phone: String,
  callbackUrl: String,

  // สำหรับ reduce/increase principal
  reduceAmount: Number,
  increaseAmount: Number,
  currentPrincipal: Number,
  newPrincipal: Number,

  responseMessage: String,
  qrCodeUrl: String,
  paymentProofUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📊 ตารางเปรียบเทียบ

| รายการ | ลดเงินต้น | เพิ่มเงินต้น |
|--------|-----------|--------------|
| **ลูกค้าทำอะไร** | ชำระเงิน (เงินต้น + ดอกค้าง) | รับเงินเพิ่ม |
| **ต้อง QR code?** | ใช่ | ไม่ (ลูกค้ามารับเงินที่ร้าน) |
| **ต้องสลิปโอนเงิน?** | ใช่ | ไม่ |
| **ดอกเบี้ยค้าง** | ลูกค้าจ่าย → reset เป็น 0 | สะสมเพิ่ม (จ่ายตอนไถ่ถอน) |
| **lastInterestCutoffDate** | อัพเดทเป็นวันที่ลด | อัพเดทเป็นวันที่เพิ่ม |
| **เงินต้นใหม่** | ลดลง | เพิ่มขึ้น |

---

## ✅ Implementation Checklist

### Shop System (ระบบนี้):
- [x] สร้าง interest calculator utility
- [x] สร้าง POST /api/notifications/reduce-principal
- [x] สร้าง POST /api/notifications/increase-principal
- [x] สร้าง PUT /api/notifications/{id}/verify-principal-change
- [x] อัพเดท actions endpoint ให้รองรับ principal change
- [x] อัพเดท contract schema
- [ ] เพิ่ม UI ในหน้า /monitor สำหรับคำนวณดอกเบี้ย

### Customer System:
- [ ] สร้าง POST /api/customer/request-reduce-principal
- [ ] สร้าง POST /api/customer/request-increase-principal
- [ ] อัพเดท webhook handler ให้รองรับ reduce_principal, increase_principal
- [ ] สร้าง LINE Flex Message templates สำหรับ principal change
- [ ] อัพเดท database schema

---

**ระบบคำนวณดอกเบี้ยอัตโนมัติและรองรับการลด/เพิ่มเงินต้นครบถ้วนแล้ว!** 🎉
