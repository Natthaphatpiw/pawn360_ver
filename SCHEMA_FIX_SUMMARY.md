# 🔧 Schema Correction Summary
# สรุปการแก้ไข Database Schema ทั้งระบบ

**วันที่**: 2025-10-29

---

## 🎯 ปัญหาที่พบ

ระบบถูกพัฒนาโดยใช้ **schema ที่ผิด** จากการคาดเดา ไม่ตรงกับ database จริง:

### ❌ Schema ที่ผิด (ใช้มาก่อนหน้านี้):
- **Collection name**: `contracts`
- **Field names**:
  - `principalAmount` (เงินต้น)
  - `contractDays` (จำนวนวัน)
  - `startDate` (วันเริ่ม)
  - `dueDate` (วันครบกำหนด)
  - `lineUserId` (LINE User ID)

### ✅ Schema ที่ถูกต้อง (จาก database จริง):
- **Collection name**: `items`
- **Field names**:
  - `desiredAmount` (เงินต้น)
  - `loanDays` (จำนวนวัน)
  - `createdAt` (วันเริ่ม)
  - **ไม่มี** `dueDate` (ต้องคำนวณเอง)
  - `lineId` (LINE User ID)

---

## 🛠️ ไฟล์ที่แก้ไขแล้ว (Shop System)

### 1. API Endpoints - แก้ไขเสร็จสมบูรณ์ ✅

#### [src/app/api/notifications/reduce-principal/route.ts](src/app/api/notifications/reduce-principal/route.ts)
**การแก้ไข**:
```typescript
// ❌ Before
const contract = await db.collection('contracts').findOne({...});
const currentPrincipal = contract.principalAmount || 0;

// ✅ After
const item = await db.collection('items').findOne({...});
const currentPrincipal = item.desiredAmount || 0;
```

#### [src/app/api/notifications/increase-principal/route.ts](src/app/api/notifications/increase-principal/route.ts)
**การแก้ไข**:
```typescript
// ❌ Before
const contract = await db.collection('contracts').findOne({...});
const currentPrincipal = contract.principalAmount || 0;

// ✅ After
const item = await db.collection('items').findOne({...});
const currentPrincipal = item.desiredAmount || 0;
```

#### [src/app/api/notifications/[id]/verify-payment/route.ts](src/app/api/notifications/[id]/verify-payment/route.ts:76-117)
**การแก้ไข**:
```typescript
// ❌ Before
const contract = await db.collection('contracts').findOne({...});
const contractDays = contract.contractDays || 7;
await db.collection('contracts').updateOne(...);

// ✅ After
const item = await db.collection('items').findOne({...});
const loanDays = item.loanDays || 7;
await db.collection('items').updateOne(
  { _id: notification.contractId },
  {
    $set: { updatedAt: new Date() },
    $push: {
      extensionHistory: {
        extendedAt: new Date(),
        extensionDays: loanDays,
        notificationId: new ObjectId(id)
      }
    }
  }
);
```

**หมายเหตุ**: Extension ไม่อัพเดท `dueDate` แล้ว แต่บันทึกใน `extensionHistory` แทน

#### [src/app/api/notifications/[id]/verify-principal-change/route.ts](src/app/api/notifications/[id]/verify-principal-change/route.ts:28-129)
**การแก้ไข**:
```typescript
// ❌ Before
const contract = await db.collection('contracts').findOne({...});
const currentPrincipal = contract.principalAmount || 0;
const lastCutoffDate = contract.lastInterestCutoffDate || contract.startDate;

await db.collection('contracts').updateOne(
  { _id: notification.contractId },
  { $set: { principalAmount: calculation.newPrincipal } }
);

// ✅ After
const item = await db.collection('items').findOne({...});
const currentPrincipal = item.desiredAmount || 0;
const lastCutoffDate = item.lastInterestCutoffDate || item.createdAt;

await db.collection('items').updateOne(
  { _id: notification.contractId },
  {
    $set: {
      desiredAmount: calculation.newPrincipal,
      lastInterestCutoffDate: new Date(),
      accruedInterest: 0,
      updatedAt: new Date()
    },
    $push: {
      principalHistory: {
        type: 'reduce',
        changedAt: new Date(),
        previousPrincipal: currentPrincipal,
        newPrincipal: calculation.newPrincipal,
        reduceAmount: notification.reduceAmount,
        interestPaid: calculation.interestPayment,
        totalPaid: calculation.totalPayment,
        daysSinceLastCutoff: daysSinceLastCutoff,
        notificationId: new ObjectId(id)
      }
    }
  }
);
```

---

## 📚 เอกสารที่แก้ไขแล้ว

### 1. [CORRECTED_SCHEMA_DOCUMENTATION.md](CORRECTED_SCHEMA_DOCUMENTATION.md) - สร้างใหม่ ✅
เอกสารหลักที่อธิบาย schema ที่ถูกต้อง พร้อม:
- ตารางเปรียบเทียบ schema เก่า vs ใหม่
- ตัวอย่างโค้ดที่ถูกต้อง
- Validation checklist
- ตัวอย่าง document จริงจาก database

### 2. [AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md](AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md) - แก้ไขเสร็จสมบูรณ์ ✅
**การแก้ไข**:
- เปลี่ยน interface `Contract` เป็น `Item`
- อัพเดท collection name จาก `contracts` เป็น `items`
- แก้ไข field names ทั้งหมด (`desiredAmount`, `loanDays`, `lineId`, `createdAt`)
- แก้โค้ดตัวอย่างทั้งหมดให้ใช้ schema ที่ถูกต้อง
- เพิ่มส่วน "CRITICAL: Common Schema Mistakes to AVOID"
- เพิ่ม Schema Validation Checklist

### 3. [CUSTOMER_SYSTEM_API_SPEC.md](CUSTOMER_SYSTEM_API_SPEC.md) - แก้ไขเสร็จสมบูรณ์ ✅
**การแก้ไข**:
- อัพเดท database schema section ให้ใช้ `items` collection
- แก้ตัวอย่าง API response ให้ตรงกับ schema จริง
- แก้โค้ดตัวอย่างการเรียกใช้ database
- เพิ่มส่วน "CRITICAL: Database Schema Warnings"
- เพิ่ม link ไปยัง CORRECTED_SCHEMA_DOCUMENTATION.md

### 4. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - เพิ่ม Warning ✅
เพิ่มคำเตือนด้านบนสุดของไฟล์:
```markdown
⚠️ **CRITICAL WARNING**: เอกสารนี้มีการอ้างอิง schema เก่าบางส่วน
กรุณาอ่าน CORRECTED_SCHEMA_DOCUMENTATION.md เพื่อดู schema ที่ถูกต้อง!
```

### 5. [PRINCIPAL_MANAGEMENT_SPEC.md](PRINCIPAL_MANAGEMENT_SPEC.md) - เพิ่ม Warning ✅
เพิ่มคำเตือนด้านบนสุดของไฟล์เช่นเดียวกัน

### 6. [AI_PROMPT_FOR_CUSTOMER_SYSTEM.md](AI_PROMPT_FOR_CUSTOMER_SYSTEM.md) - เพิ่ม Deprecation Notice ✅
ทำเครื่องหมายว่าเป็นเอกสารเวอร์ชันเก่า ให้ใช้ `AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md` แทน

---

## ✅ Validation Checklist สำหรับการเขียนโค้ดใหม่

ก่อนเขียนโค้ดที่เกี่ยวข้องกับ database ทุกครั้ง ต้องตรวจสอบ:

- [ ] ใช้ `db.collection('items')` **ไม่ใช่** `'contracts'`
- [ ] ใช้ `item.desiredAmount` **ไม่ใช่** `contract.principalAmount`
- [ ] ใช้ `item.loanDays` **ไม่ใช่** `contract.contractDays`
- [ ] ใช้ `item.createdAt` **ไม่ใช่** `contract.startDate`
- [ ] ใช้ `item.lineId` **ไม่ใช่** `contract.lineUserId`
- [ ] **ไม่มี** `dueDate` field - ต้องคำนวณจาก `createdAt + loanDays`
- [ ] อัพเดท `desiredAmount` เมื่อเปลี่ยนแปลงเงินต้น
- [ ] ตรวจสอบว่า optional fields มีอยู่จริงก่อนใช้ (`lastInterestCutoffDate`, `accruedInterest`)

---

## 🧪 การทดสอบที่ควรทำ

### 1. Reduce Principal
- [ ] สร้างคำขอลดเงินต้น
- [ ] ตรวจสอบว่า `item.desiredAmount` ถูกอัพเดท
- [ ] ตรวจสอบว่า `principalHistory` ถูกบันทึก
- [ ] ตรวจสอบว่า `lastInterestCutoffDate` ถูกรีเซ็ต
- [ ] ตรวจสอบว่า `accruedInterest` ถูกล้าง

### 2. Increase Principal
- [ ] สร้างคำขอเพิ่มเงินต้น
- [ ] ตรวจสอบว่า `item.desiredAmount` ถูกอัพเดท
- [ ] ตรวจสอบว่า `principalHistory` ถูกบันทึก

### 3. Extension
- [ ] สร้างคำขอต่อดอก
- [ ] ตรวจสอบว่า `extensionHistory` ถูกบันทึก
- [ ] ตรวจสอบว่าใช้ `item.loanDays` ในการคำนวณ

### 4. Redemption
- [ ] สร้างคำขอไถ่ถอน
- [ ] ตรวจสอบว่า `item.status` เปลี่ยนเป็น `'redeem'`
- [ ] ตรวจสอบว่า `redeemedAt` ถูกบันทึก

---

## 📊 สถานะปัจจุบัน

### ✅ เสร็จสมบูรณ์:
- Shop System API endpoints ทั้งหมด (4 endpoints)
- เอกสารหลักสำหรับ Customer System
- Schema documentation และ warnings
- Validation checklists

### ⚠️ ต้องระวัง:
- IMPLEMENTATION_SUMMARY.md และ PRINCIPAL_MANAGEMENT_SPEC.md ยังมีโค้ดตัวอย่างที่ใช้ schema เก่า (แต่มี warning แล้ว)
- Customer System ยังไม่ได้สร้าง - ต้องใช้ AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md ในการสร้าง

### 📝 แนะนำ:
- อ่าน [CORRECTED_SCHEMA_DOCUMENTATION.md](CORRECTED_SCHEMA_DOCUMENTATION.md) ก่อนเขียนโค้ดใหม่
- ใช้ [AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md](AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md) ในการสร้าง Customer System
- ตรวจสอบ validation checklist ทุกครั้งก่อน commit

---

## 🎯 Next Steps

1. **ทดสอบ Shop System**:
   - ทดสอบ 4 workflows ทั้งหมด (redemption, extension, reduce, increase)
   - ตรวจสอบว่า database ถูกอัพเดทถูกต้อง
   - ตรวจสอบว่า webhook ทำงานปกติ

2. **สร้าง Customer System**:
   - ใช้ AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md
   - ตรวจสอบให้แน่ใจว่าใช้ schema ที่ถูกต้อง
   - ทดสอบการสื่อสารกับ Shop System

3. **End-to-End Testing**:
   - ทดสอบทั้ง 4 workflows จากลูกค้าถึงร้านค้า
   - ตรวจสอบ LINE Flex Messages
   - ตรวจสอบการอัพโหลดสลิปและการยืนยัน

---

**สรุป**: ระบบถูกแก้ไขให้ใช้ schema ที่ถูกต้องแล้วทั้งหมด โปรดอ่าน CORRECTED_SCHEMA_DOCUMENTATION.md และตรวจสอบ validation checklist ก่อนเขียนโค้ดใหม่! ✅
