# 🔧 CORRECTED Database Schema Documentation

## ⚠️ IMPORTANT: Actual Database Structure

### ❌ Previous Assumption (WRONG):
- Collection name: `contracts`
- Fields: `principalAmount`, `contractDays`, `dueDate`

### ✅ Actual Schema (CORRECT):
- Collection name: **`items`**
- Fields: `desiredAmount`, `loanDays`, `createdAt`

---

## 📊 Actual Database Schema

### Collection: `items`

```javascript
{
  _id: ObjectId,
  lineId: String,                    // LINE User ID ของลูกค้า

  // ข้อมูลสินค้าที่จำนำ
  brand: String,                     // ยี่ห้อ เช่น "Apple"
  model: String,                     // รุ่น เช่น "iPhone 12 pro"
  type: String,                      // ประเภท เช่น "โทรศัพท์"
  serialNo: String,                  // หมายเลขเครื่อง
  condition: Number,                 // สภาพ (0-100)
  defects: String,                   // ตำหนิ
  note: String,                      // หมายเหตุ
  accessories: String,               // อุปกรณ์ประกอบ
  images: Array<String>,             // รูปภาพสินค้า

  // ข้อมูลสัญญาจำนำ
  status: 'active' | 'redeem' | 'completed' | 'expired',
  currentContractId: ObjectId,       // สัญญาปัจจุบัน
  contractHistory: Array<ObjectId>,  // ประวัติสัญญาทั้งหมด

  // ข้อมูลการเงิน - ราคาเริ่มต้น (ก่อนต่อรอง)
  desiredAmount: Number,             // ⭐ เงินต้นที่ลูกค้าขอ (ก่อนต่อรอง)
  estimatedValue: Number,            // มูลค่าประเมิน
  loanDays: Number,                  // ⭐ จำนวนวันสัญญา
  interestRate: Number,              // อัตราดอกเบี้ย % ต่อเดือน (เริ่มต้น)

  // ⚠️ ข้อมูลสัญญาที่ใช้จริง (หลังต่อรอง) - สำคัญมาก!
  confirmationNewContract: {
    itemId: String,                  // ID ของสินค้า
    pawnPrice: Number,               // 🔥 เงินต้นจริงที่ใช้ในสัญญา (หลังต่อรอง)
    interestRate: Number,            // 🔥 อัตราดอกเบี้ยจริง (หลังต่อรอง)
    loanDays: Number,                // จำนวนวัน
    interest: Number,                // ดอกเบี้ยรวมทั้งหมด
    total: Number,                   // ยอดรวมที่ต้องชำระ (pawnPrice + interest)
    item: String                     // ชื่อสินค้า
  },
  confirmationStatus: String,        // สถานะการต่อรอง: 'confirmed', 'rejected', etc.
  confirmationTimestamp: Date,       // วันเวลาที่ยืนยันสัญญา
  confirmationModifications: Array<String>, // รายการเปลี่ยนแปลงจากการต่อรอง

  // สำหรับคำนวณดอกเบี้ย (optional fields)
  lastInterestCutoffDate: Date,      // วันที่ตัดดอกครั้งล่าสุด
  accruedInterest: Number,           // ดอกเบี้ยค้างสะสม

  // ประวัติ (optional fields)
  principalHistory: Array<{
    type: 'reduce' | 'increase',
    changedAt: Date,
    previousPrincipal: Number,
    newPrincipal: Number,
    reduceAmount: Number,
    increaseAmount: Number,
    interestPaid: Number,
    interestCutoff: Number,
    totalPaid: Number,
    daysSinceLastCutoff: Number,
    notificationId: ObjectId
  }>,

  extensionHistory: Array<{
    extendedAt: Date,
    extensionDays: Number,
    notificationId: ObjectId
  }>,

  redeemedAt: Date,                  // วันที่ไถ่ถอน

  // อื่นๆ
  storeId: ObjectId,
  negotiationStatus: String,
  createdAt: Date,
  updatedAt: Date,

  // สำหรับการต่อรอง
  confirmationModifications: Array<String>,
  confirmationNewContract: Object,
  confirmationStatus: String,
  confirmationTimestamp: Date
}
```

---

## 🔥 CRITICAL: ราคาสัญญาจริง (Actual Contract Price)

### ⚠️ ใช้ `confirmationNewContract.pawnPrice` ไม่ใช่ `desiredAmount`!

```typescript
// ❌ WRONG - desiredAmount เป็นราคาที่ลูกค้าขอ (ก่อนต่อรอง)
const principal = item.desiredAmount; // 7000 (ราคาที่ลูกค้าขอ)

// ✅ CORRECT - pawnPrice เป็นราคาจริงหลังต่อรอง
const principal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0; // 6000 (ราคาจริง)
```

### ตัวอย่าง: การต่อรองราคา

```json
{
  "_id": "68fde0d172e51b43d322ef25",
  "desiredAmount": 7000,           // ลูกค้าขอ 7,000
  "interestRate": 10,              // ลูกค้าขอดอก 10%

  "confirmationNewContract": {
    "pawnPrice": 6000,             // 🔥 ร้านให้ 6,000 (ราคาจริง)
    "interestRate": 15,            // 🔥 ร้านกำหนดดอก 15% (อัตราจริง)
    "interest": 210,               // ดอกเบี้ยรวม
    "total": 6210                  // ยอดชำระรวม
  },

  "confirmationModifications": [
    "ราคา จาก 7,000 เป็น 6,000",
    "ดอกเบี้ย จาก 10% เป็น 15%"
  ],
  "confirmationStatus": "confirmed"
}
```

**สรุป**: สัญญาจริงใช้ **6,000 บาท** ดอก **15%** ไม่ใช่ 7,000 บาท ดอก 10%!

---

## 🔑 Key Field Mappings

| Concept | Field Name | Type | Description |
|---------|-----------|------|-------------|
| 💰 เงินต้น (จริง) | `confirmationNewContract.pawnPrice` | Number | 🔥 ราคาสัญญาจริง (หลังต่อรอง) |
| เงินต้น (ที่ขอ) | `desiredAmount` | Number | ราคาที่ลูกค้าขอ (ก่อนต่อรอง) |
| 📊 ดอกเบี้ย (จริง) | `confirmationNewContract.interestRate` | Number | 🔥 % จริง (หลังต่อรอง) |
| ดอกเบี้ย (ที่ขอ) | `interestRate` | Number | % เริ่มต้น (ก่อนต่อรอง) |
| จำนวนวันสัญญา | `loanDays` | Number | เช่น 7, 20 วัน |
| LINE User ID | `lineId` | String | สำหรับส่ง LINE message |
| วันเริ่มสัญญา | `createdAt` | Date | วันที่สร้างรายการ |
| สถานะ | `status` | String | active, redeem, completed, expired |

---

## ⚠️ Common Mistakes to Avoid

### ❌ WRONG:
```typescript
// Collection ผิด
const contract = await db.collection('contracts').findOne(...);

// Field names ผิด
const principal = contract.principalAmount;
const days = contract.contractDays;
const dueDate = contract.dueDate;

// ใช้ราคาผิด (ก่อนต่อรอง)
const principal = item.desiredAmount; // ❌ นี่คือราคาที่ลูกค้าขอ!
```

### ✅ CORRECT:
```typescript
// Collection ถูกต้อง
const item = await db.collection('items').findOne(...);

// Field names ถูกต้อง
const days = item.loanDays;
const startDate = item.createdAt;

// 🔥 ใช้ราคาจริงหลังต่อรอง
const principal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;
const days = item.loanDays;
const startDate = item.createdAt;
// Note: ไม่มี dueDate - ต้องคำนวณจาก createdAt + loanDays
```

---

## 📋 Updated API Implementations

### 1. Reduce Principal - CORRECTED
```typescript
// Get item (not contract!)
const item = await db.collection('items').findOne({
  _id: new ObjectId(contractId),
  storeId: new ObjectId(storeId)
});

const currentPrincipal = item.desiredAmount || 0;  // ✅ desiredAmount
const interestRate = item.interestRate || 0;

// Update
await db.collection('items').updateOne(
  { _id: notification.contractId },
  {
    $set: {
      desiredAmount: newPrincipal,  // ✅ desiredAmount
      lastInterestCutoffDate: new Date(),
      accruedInterest: 0,
      updatedAt: new Date()
    }
  }
);
```

### 2. Extension - CORRECTED
```typescript
const item = await db.collection('items').findOne({
  _id: notification.contractId
});

const loanDays = item.loanDays || 7;  // ✅ loanDays

await db.collection('items').updateOne(
  { _id: notification.contractId },
  {
    $set: { updatedAt: new Date() },
    $push: {
      extensionHistory: {
        extendedAt: new Date(),
        extensionDays: loanDays,  // ✅ loanDays
        notificationId: new ObjectId(id)
      }
    }
  }
);
```

### 3. Redemption - CORRECTED
```typescript
await db.collection('items').updateOne(  // ✅ items
  { _id: notification.contractId },
  {
    $set: {
      status: 'redeem',  // ✅ status
      redeemedAt: new Date(),
      updatedAt: new Date()
    }
  }
);
```

---

## 🔍 Validation Checklist

เมื่อสร้าง API ใหม่ ต้องตรวจสอบ:

- [ ] ใช้ `db.collection('items')` ไม่ใช่ `'contracts'`
- [ ] ใช้ `item.desiredAmount` ไม่ใช่ `contract.principalAmount`
- [ ] ใช้ `item.loanDays` ไม่ใช่ `contract.contractDays`
- [ ] ใช้ `item.createdAt` แทน `contract.startDate`
- [ ] ใช้ `item.lineId` สำหรับ LINE User ID
- [ ] อัพเดท `desiredAmount` เมื่อเปลี่ยนแปลงเงินต้น
- [ ] ตรวจสอบว่า field มีอยู่จริงก่อนใช้ (optional fields)

---

## 📝 Example: Complete Item Document

```json
{
  "_id": "68fde0d172e51b43d322ef25",
  "lineId": "Uebe5597f925edb9dc6c3d4b3760a4648",
  "brand": "Apple",
  "model": "iPhone 12 pro",
  "type": "โทรศัพท์",
  "serialNo": "162825",
  "condition": 50,
  "defects": "มีรอยนิดหน่อย",
  "note": "สุขภาพแบต 90%",
  "accessories": "กล่อง",
  "images": ["blob:https://..."],
  "status": "active",
  "currentContractId": "68fde256204c5d2f617257cd",
  "contractHistory": ["68fde17372e51b43d322ef27", "68fde256204c5d2f617257cd"],
  "desiredAmount": 7000,           // ⭐ เงินต้น
  "estimatedValue": 7656,
  "loanDays": 7,                   // ⭐ จำนวนวัน
  "interestRate": 10,              // ⭐ ดอกเบี้ย 10%
  "storeId": "68db61416f0fe035f9e82982",
  "negotiationStatus": "none",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",

  // Optional fields สำหรับ principal management
  "lastInterestCutoffDate": "2025-01-12T00:00:00.000Z",
  "accruedInterest": 120,
  "principalHistory": [
    {
      "type": "reduce",
      "changedAt": "2025-01-12T10:00:00.000Z",
      "previousPrincipal": 10000,
      "newPrincipal": 7000,
      "reduceAmount": 3000,
      "interestPaid": 120,
      "totalPaid": 3120,
      "daysSinceLastCutoff": 12,
      "notificationId": "..."
    }
  ],
  "extensionHistory": [
    {
      "extendedAt": "2025-01-15T10:00:00.000Z",
      "extensionDays": 7,
      "notificationId": "..."
    }
  ]
}
```

---

## ✅ All Files Updated

ไฟล์ที่แก้ไขแล้วให้ใช้ `items` collection:

1. ✅ `/api/notifications/reduce-principal/route.ts`
2. ✅ `/api/notifications/increase-principal/route.ts`
3. ✅ `/api/notifications/[id]/verify-payment/route.ts`
4. ✅ `/api/notifications/[id]/verify-principal-change/route.ts`

---

**ระบบใช้ schema ที่ถูกต้องแล้ว!** 🎉
