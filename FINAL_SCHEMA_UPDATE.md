# 🔥 FINAL Schema Update: confirmationNewContract.pawnPrice
**วันที่**: 2025-10-29 (Update #2)

---

## 🎯 การค้นพบใหม่

จากข้อมูล database จริง พบว่า:

### ❌ สิ่งที่เข้าใจผิดก่อนหน้านี้:
```typescript
const principal = item.desiredAmount; // 7000 บาท
```

### ✅ ความจริงจาก database:
```json
{
  "desiredAmount": 7000,           // ราคาที่ลูกค้าขอ (ก่อนต่อรอง)
  "interestRate": 10,              // ดอกเบี้ยที่ลูกค้าขอ

  "confirmationNewContract": {
    "pawnPrice": 6000,             // 🔥 ราคาจริงหลังต่อรอง
    "interestRate": 15,            // 🔥 ดอกเบี้ยจริงหลังต่อรอง
    "interest": 210,
    "total": 6210
  },

  "confirmationModifications": [
    "ราคา จาก 7,000 เป็น 6,000",
    "ดอกเบี้ย จาก 10% เป็น 15%"
  ],
  "confirmationStatus": "confirmed"
}
```

**สรุป**: ระบบมีการ**ต่อรองราคา** ทำให้:
- `desiredAmount` (7,000) = ราคาที่ลูกค้า**ขอ**
- `confirmationNewContract.pawnPrice` (6,000) = ราคาที่ร้าน**ให้จริง**

---

## 🛠️ ไฟล์ที่แก้ไข (Update #2)

### 1. [src/app/api/notifications/reduce-principal/route.ts](src/app/api/notifications/reduce-principal/route.ts:54)
```typescript
// ✅ อัพเดทแล้ว
const currentPrincipal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;
```

### 2. [src/app/api/notifications/increase-principal/route.ts](src/app/api/notifications/increase-principal/route.ts:54)
```typescript
// ✅ อัพเดทแล้ว
const currentPrincipal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;
```

### 3. [src/app/api/notifications/[id]/verify-principal-change/route.ts](src/app/api/notifications/[id]/verify-principal-change/route.ts:100-103)
```typescript
// ✅ อัพเดทแล้ว - ทั้งการอ่านและการเขียน
const currentPrincipal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;
const interestRate = item.confirmationNewContract?.interestRate || item.interestRate || 0;

// อัพเดททั้ง confirmationNewContract.pawnPrice และ desiredAmount
await db.collection('items').updateOne(
  { _id: notification.contractId },
  {
    $set: {
      'confirmationNewContract.pawnPrice': calculation.newPrincipal, // ⚠️ อัพเดทราคาจริง
      desiredAmount: calculation.newPrincipal, // backward compatibility
      // ...
    }
  }
);
```

---

## 📊 ตัวอย่างการใช้งาน

### Scenario: ลดเงินต้น 1,000 บาท

**Before** (ก่อนต่อรอง):
- ลูกค้าขอ: 7,000 บาท ดอก 10%
- ร้านให้: 6,000 บาท ดอก 15%

**Transaction**:
```typescript
// 1. Read: ใช้ราคาจริง (6,000)
const currentPrincipal = item.confirmationNewContract.pawnPrice; // 6000
const reduceAmount = 1000;
const newPrincipal = 6000 - 1000; // 5000

// 2. Write: อัพเดททั้งสองที่
await db.collection('items').updateOne(
  { _id: itemId },
  {
    $set: {
      'confirmationNewContract.pawnPrice': 5000, // ราคาจริง
      desiredAmount: 5000 // เก็บไว้เผื่อ backward compatibility
    }
  }
);
```

**After**:
- ราคาสัญญาใหม่: 5,000 บาท
- ดอกเบี้ย: ยังคง 15% (ไม่เปลี่ยน)

---

## 🔥 CRITICAL Rules

### 1. สำหรับการอ่าน (Read)
```typescript
// ✅ ลำดับความสำคัญ: pawnPrice → desiredAmount → 0
const principal = item.confirmationNewContract?.pawnPrice || item.desiredAmount || 0;
const interestRate = item.confirmationNewContract?.interestRate || item.interestRate || 0;
```

### 2. สำหรับการเขียน (Write)
```typescript
// ✅ อัพเดททั้งสองที่
await db.collection('items').updateOne(
  { _id: itemId },
  {
    $set: {
      'confirmationNewContract.pawnPrice': newPrincipal, // ⚠️ สำคัญ!
      desiredAmount: newPrincipal // backward compatibility
    }
  }
);
```

### 3. Validation
```typescript
// ✅ เช็คว่ามี confirmationNewContract หรือไม่
if (!item.confirmationNewContract) {
  console.warn('No confirmationNewContract found, using desiredAmount as fallback');
}
```

---

## 📋 Validation Checklist (อัพเดท)

เมื่อทำงานกับเงินต้น (principal) ต้องตรวจสอบ:

- [ ] ใช้ `confirmationNewContract.pawnPrice` เป็นอันดับแรก
- [ ] มี fallback เป็น `desiredAmount`
- [ ] เมื่ออัพเดท ต้องอัพเดททั้ง `confirmationNewContract.pawnPrice` และ `desiredAmount`
- [ ] ใช้ `confirmationNewContract.interestRate` สำหรับอัตราดอกเบี้ยจริง
- [ ] ใช้ `item.lineId` ไม่ใช่ `contract.lineUserId`
- [ ] ใช้ `db.collection('items')` ไม่ใช่ `'contracts'`

---

## 🧪 การทดสอบที่แนะนำ

### Test Case 1: Item มีการต่อรอง (มี confirmationNewContract)
```json
{
  "_id": "abc123",
  "desiredAmount": 7000,
  "confirmationNewContract": {
    "pawnPrice": 6000,
    "interestRate": 15
  }
}
```

**Expected**:
- Read: `currentPrincipal = 6000` (ใช้ pawnPrice)
- Reduce 1000: `newPrincipal = 5000`
- Write: อัพเดททั้ง `pawnPrice` และ `desiredAmount` เป็น 5000

### Test Case 2: Item ไม่มีการต่อรอง (ไม่มี confirmationNewContract)
```json
{
  "_id": "def456",
  "desiredAmount": 8000
}
```

**Expected**:
- Read: `currentPrincipal = 8000` (fallback ไป desiredAmount)
- Reduce 2000: `newPrincipal = 6000`
- Write: อัพเดทแค่ `desiredAmount` เป็น 6000

### Test Case 3: Extension (ควรใช้ interestRate จาก confirmationNewContract)
```json
{
  "_id": "ghi789",
  "interestRate": 10,
  "confirmationNewContract": {
    "pawnPrice": 5000,
    "interestRate": 15,
    "loanDays": 7
  }
}
```

**Expected**:
- คำนวณดอกเบี้ยโดยใช้ `15%` (ไม่ใช่ 10%)
- ใช้ `pawnPrice = 5000` ในการคำนวณ

---

## 📚 เอกสารที่เกี่ยวข้อง

1. **[CORRECTED_SCHEMA_DOCUMENTATION.md](CORRECTED_SCHEMA_DOCUMENTATION.md)** - อัพเดทแล้ว ✅
   - เพิ่มส่วน "CRITICAL: ราคาสัญญาจริง"
   - อธิบายความแตกต่างระหว่าง desiredAmount vs pawnPrice
   - ตัวอย่างการต่อรองราคา

2. **[SCHEMA_FIX_SUMMARY.md](SCHEMA_FIX_SUMMARY.md)** - Update #1
   - การแก้ไข collection name และ field names

3. **[AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md](AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md)** - ⚠️ ต้องอัพเดท
   - ยังใช้ `desiredAmount` อยู่
   - ควรเพิ่มข้อมูลเกี่ยวกับ `confirmationNewContract`

---

## 🎯 Next Steps

### 1. ทดสอบ Shop System APIs
- [ ] Test reduce principal with negotiated price
- [ ] Test increase principal with negotiated price
- [ ] Test interest calculation with negotiated rate
- [ ] Verify database updates in both fields

### 2. อัพเดท Customer System Prompt
- [ ] เพิ่มข้อมูลเกี่ยวกับ `confirmationNewContract`
- [ ] อธิบายความแตกต่างระหว่าง desiredAmount vs pawnPrice
- [ ] เพิ่ม validation checklist

### 3. สร้าง Customer System
- [ ] ใช้ AI_PROMPT_COMPLETE_CUSTOMER_SYSTEM.md (หลังอัพเดท)
- [ ] ตรวจสอบว่าใช้ `confirmationNewContract.pawnPrice` ถูกต้อง
- [ ] ทดสอบการสื่อสารกับ Shop System

---

## 📝 สรุปการเปลี่ยนแปลง

### Update #1 (เมื่อก่อน):
- ✅ แก้ collection name: `contracts` → `items`
- ✅ แก้ field names: `principalAmount` → `desiredAmount`, `contractDays` → `loanDays`

### Update #2 (ตอนนี้):
- ✅ แก้การใช้ราคา: `desiredAmount` → `confirmationNewContract.pawnPrice`
- ✅ แก้การใช้ดอกเบี้ย: `interestRate` → `confirmationNewContract.interestRate`
- ✅ อัพเดททั้งสองที่เมื่อเปลี่ยนแปลงเงินต้น

---

**สรุป**: ระบบตอนนี้ใช้ราคาและอัตราดอกเบี้ย**หลังการต่อรอง**แล้ว! 🎉
