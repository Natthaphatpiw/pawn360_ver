# 🔐 Password Hashing - Quick Reference

## สรุปสั้นๆ

**Algorithm:** bcrypt
**Salt Rounds:** 12
**Library:** `bcrypt` (Python), `bcrypt` (Node.js)

---

## Python (Backend)

```python
import bcrypt

# เข้ารหัส
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# ตรวจสอบ
def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
```

### ตัวอย่าง
```python
# Signup
hashed = hash_password("myPassword123")
# -> "$2b$12$..."

# Login
is_valid = verify_password("myPassword123", stored_hash)
# -> True
```

---

## JavaScript/TypeScript

```javascript
import bcrypt from 'bcrypt';

// เข้ารหัส (Async)
async function hashPassword(password) {
    return await bcrypt.hash(password, 12);
}

// ตรวจสอบ (Async)
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
```

### ตัวอย่าง
```javascript
// Signup
const hashed = await hashPassword("myPassword123");
// -> "$2b$12$..."

// Login
const isValid = await verifyPassword("myPassword123", storedHash);
// -> true
```

---

## สำหรับ Database

### Users Collection
```json
{
  "_id": "...",
  "email": "user@example.com",
  "passwordHash": "$2b$12$...",  // ← เก็บ hash
  "fullName": "John Doe"
}
```

### Stores Collection
```json
{
  "_id": "...",
  "storeName": "My Store",
  "ownerId": "...",
  "passwordHash": "$2b$12$..."  // ← ใช้ hash เดียวกับ owner
}
```

---

## ⚠️ สิ่งที่ต้องจำ

✅ **ต้องทำ:**
- เข้ารหัส password ก่อนเก็บ database
- ใช้ `verify_password()` เพื่อตรวจสอบ
- ส่ง password ผ่าน HTTPS เท่านั้น

❌ **ห้ามทำ:**
- เก็บ plain text password
- ใช้ MD5/SHA256 สำหรับ password
- Log password (แม้จะเป็น hash)

---

## ติดตั้ง

```bash
# Python
pip install bcrypt

# Node.js
npm install bcrypt
```

---

## ทดสอบ

```bash
# Python
python test_password_hashing.py

# JavaScript
node test_password_hashing.js
```

---

## เอกสารเพิ่มเติม

📄 [PASSWORD_HASHING_GUIDE.md](PASSWORD_HASHING_GUIDE.md) - คู่มือฉบับเต็ม
