# 📊 Database Design Report - Pawn Shop Management System

## 📋 สารบัญ
- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [MongoDB Database Schemas](#mongodb-database-schemas)
- [AWS S3 File Storage Structure](#aws-s3-file-storage-structure)
- [API Endpoints Design](#api-endpoints-design)
- [Authentication & Authorization](#authentication--authorization)
- [Database Indexing & Performance](#database-indexing--performance)
- [File Upload & Management](#file-upload--management)
- [Data Relationships & Integrity](#data-relationships--integrity)

---

## 🎯 ภาพรวมระบบ

ระบบ Pawn Shop Management เป็นแอปพลิเคชันสำหรับจัดการร้านรับจำนำที่มีฟีเจอร์หลักดังนี้:

- **Dashboard**: แสดงภาพรวมข้อมูล สถิติ และการแจ้งเตือน
- **Pawn Entry**: ฟอร์มสร้างสัญญาจำนำใหม่
- **Contracts Management**: จัดการสัญญาที่มีอยู่
- **Account Settings**: ตั้งค่าร้านค้าและผู้ใช้
- **File Management**: จัดการรูปภาพและเอกสาร

### 🏗️ Architecture Overview
```
Frontend (Next.js + React) ↔️ API (FastAPI) ↔️ Database (MongoDB) + Files (AWS S3)
```

---

## 🗄️ MongoDB Database Schemas

### 1. **Users Collection**
จัดการข้อมูลผู้ใช้ระบบ (เจ้าของร้าน, พนักงาน)

```javascript
{
  _id: ObjectId,
  // Authentication
  email: String (unique, required),
  passwordHash: String (required),
  role: String (enum: ['owner', 'manager', 'staff'], required),

  // Personal Information
  fullName: String (required),
  phone: String,
  profileImage: String (S3 URL),

  // Address
  address: {
    houseNumber: String,
    village: String,
    street: String,
    subDistrict: String,
    district: String,
    province: String,
    country: String (default: 'ประเทศไทย'),
    postcode: String
  },

  // System Fields
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now),

  // Store Association
  storeId: ObjectId (ref: 'stores', required)
}
```

### 2. **Stores Collection**
จัดการข้อมูลร้านค้า

```javascript
{
  _id: ObjectId,

  // Basic Information
  storeName: String (required),
  phone: String (required),
  taxId: String (required),

  // Address
  address: {
    houseNumber: String,
    village: String,
    street: String,
    subDistrict: String,
    district: String,
    province: String,
    country: String (default: 'ประเทศไทย'),
    postcode: String
  },

  // Assets (S3 URLs)
  logoUrl: String,
  stampUrl: String,
  signatureUrl: String,

  // Business Settings
  interestPresets: [{
    days: Number (required),
    rate: Number (required) // percentage
  }],

  // Contract Template
  contractTemplate: {
    header: String,
    footer: String,
    terms: String
  },

  // System Fields
  ownerId: ObjectId (ref: 'users', required),
  isActive: Boolean (default: true),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

### 3. **Customers Collection**
จัดการข้อมูลลูกค้าที่มาจำนำ

```javascript
{
  _id: ObjectId,

  // Personal Information
  title: String (enum: ['นาย', 'นาง', 'นางสาว']),
  firstName: String (required),
  lastName: String (required),
  fullName: String (computed field),

  // Contact Information
  phone: String (required),
  idNumber: String (required, unique),

  // Address
  address: {
    houseNumber: String,
    village: String,
    street: String,
    subDistrict: String,
    district: String,
    province: String,
    country: String (default: 'ประเทศไทย'),
    postcode: String
  },

  // Statistics
  totalContracts: Number (default: 0),
  totalValue: Number (default: 0),
  lastContractDate: Date,

  // System Fields
  storeId: ObjectId (ref: 'stores', required),
  createdBy: ObjectId (ref: 'users', required),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

### 4. **Contracts Collection**
จัดการสัญญาจำนำ (เอกสารหลักของระบบ)

```javascript
{
  _id: ObjectId,

  // Contract Identification
  contractNumber: String (unique, required), // Auto-generated: STOREDATE-XXXX
  status: String (enum: ['active', 'overdue', 'redeemed', 'suspended', 'sold'], default: 'active'),

  // Customer Reference
  customerId: ObjectId (ref: 'customers', required),

  // Item Information
  item: {
    brand: String (required),
    model: String (required),
    type: String (required), // Smartphone, Laptop, etc.
    serialNo: String,
    accessories: String,
    condition: Number (0-100, required),
    defects: String,
    note: String,
    images: [String] // Array of S3 URLs
  },

  // Financial Details
  pawnDetails: {
    aiEstimatedPrice: Number (required), // จาก AI evaluation
    pawnedPrice: Number (required), // ราคาที่ให้กู้จริง
    interestRate: Number (required), // อัตราดอกเบี้ยต่อปี
    periodDays: Number (required), // ระยะเวลากู้ (วัน)
    totalInterest: Number (computed), // ดอกเบี้ยรวมทั้งหมด
    remainingAmount: Number (computed) // ยอดค้างชำระ
  },

  // Date Information
  dates: {
    startDate: Date (required), // วันที่เริ่มสัญญา
    dueDate: Date (required), // วันที่ครบกำหนด
    redeemDate: Date, // วันที่ไถ่ถอน (ถ้ามี)
    suspendedDate: Date // วันที่ถูกระงับ (ถ้ามี)
  },

  // Transaction History
  transactionHistory: [{
    _id: ObjectId,
    type: String (enum: ['interest_payment', 'principal_increase', 'principal_decrease', 'redeem', 'suspend']),
    amount: Number (required),
    paymentMethod: String,
    date: Date (default: Date.now),
    note: String,
    processedBy: ObjectId (ref: 'users', required)
  }],

  // System Fields
  storeId: ObjectId (ref: 'stores', required),
  createdBy: ObjectId (ref: 'users', required),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

### 5. **Items Collection** (สำหรับ inventory management)

```javascript
{
  _id: ObjectId,

  // Item Details
  brand: String (required),
  model: String (required),
  type: String (required),
  serialNo: String,

  // Condition & Description
  condition: Number (0-100, required),
  defects: String,
  note: String,
  accessories: String,

  // Images
  images: [String], // S3 URLs

  // Status & Ownership
  status: String (enum: ['available', 'pawned', 'sold', 'lost'], default: 'available'),
  currentContractId: ObjectId (ref: 'contracts'), // ถ้าถูกจำนำอยู่

  // History
  contractHistory: [{
    contractId: ObjectId (ref: 'contracts'),
    pawnDate: Date,
    redeemDate: Date,
    pawnedPrice: Number
  }],

  // System Fields
  storeId: ObjectId (ref: 'stores', required),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

### 6. **Transactions Collection** (สำหรับบันทึกธุรกรรมทั้งหมด)

```javascript
{
  _id: ObjectId,

  // Transaction Details
  type: String (enum: ['pawn', 'interest_payment', 'redeem', 'extend', 'suspend', 'sell'], required),
  amount: Number (required),
  paymentMethod: String,

  // References
  contractId: ObjectId (ref: 'contracts', required),
  customerId: ObjectId (ref: 'customers', required),
  itemId: ObjectId (ref: 'items'),

  // Processing
  processedBy: ObjectId (ref: 'users', required),
  note: String,

  // Financial Impact
  beforeBalance: Number,
  afterBalance: Number,

  // System Fields
  storeId: ObjectId (ref: 'stores', required),
  createdAt: Date (default: Date.now)
}
```

---

## ☁️ AWS S3 File Storage Structure

### 📁 Bucket Structure
```
pawn-shop-files/
├── store-assets/{storeId}/
│   ├── logos/
│   │   ├── logo.{ext}
│   │   └── thumbnail_logo.{ext}
│   ├── stamps/
│   │   ├── stamp.{ext}
│   │   └── thumbnail_stamp.{ext}
│   └── signatures/
│       ├── signature.{ext}
│       └── thumbnail_signature.{ext}
├── item-images/{storeId}/
│   └── {contractId}/
│       ├── image1.{ext}
│       ├── image2.{ext}
│       └── thumbnails/
│           ├── thumb_image1.{ext}
│           └── thumb_image2.{ext}
└── contracts/{storeId}/
    └── {contractId}/
        ├── contract.pdf
        └── attachments/
            ├── receipt.pdf
            └── agreement.pdf
```

### 🔧 File Naming Conventions

#### Store Assets:
- **Logo**: `logo_{timestamp}.{ext}` หรือ `logo.{ext}`
- **Stamp**: `stamp_{timestamp}.{ext}` หรือ `stamp.{ext}`
- **Signature**: `signature_{timestamp}.{ext}` หรือ `signature.{ext}`

#### Item Images:
- **Original**: `{contractId}_{index}.{ext}`
- **Thumbnail**: `thumb_{contractId}_{index}.{ext}`

#### Generated Documents:
- **Contract PDF**: `contract_{contractNumber}.pdf`
- **Receipt**: `receipt_{contractNumber}_{date}.pdf`

### 📊 Storage Classes Recommendation

| File Type | Storage Class | Reason |
|-----------|---------------|---------|
| Store logos/stamps/signatures | Standard | ใช้งานบ่อย |
| Item images | Standard-IA | เข้าถึงปานกลาง |
| Contract PDFs | Glacier | เก็บถาวร, เข้าถึงน้อย |

### 🔒 Security & Access Control

```javascript
// S3 Bucket Policy Example
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowStoreAccess",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::ACCOUNT_ID:user/STORE_USER" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pawn-shop-files/store-assets/${storeId}/*"
    },
    {
      "Sid": "AllowItemImageAccess",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::ACCOUNT_ID:user/ITEM_USER" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pawn-shop-files/item-images/${storeId}/*"
    }
  ]
}
```

---

## 🌐 API Endpoints Design

### Base URL: `/api/v1`

### 🔐 Authentication Endpoints

```typescript
// POST /auth/signup
{
  "user": {
    "fullName": "string",
    "email": "string",
    "password": "string",
    "role": "owner|manager|staff"
  },
  "store": {
    "storeName": "string",
    "phone": "string",
    "taxId": "string",
    "address": { /* address object */ }
  }
}

// POST /auth/signin
{
  "email": "string",
  "password": "string"
}

// POST /auth/refresh
// Headers: Authorization: Bearer <refresh_token>

// POST /auth/logout
```

### 🏪 Store Management

```typescript
// GET /stores/{storeId}
Response: Store object

// PUT /stores/{storeId}
{
  "storeName": "string",
  "phone": "string",
  "taxId": "string",
  "address": { /* address object */ },
  "interestPresets": [{ "days": number, "rate": number }]
}

// POST /stores/{storeId}/upload-logo
// Content-Type: multipart/form-data
// Body: logo file

// POST /stores/{storeId}/upload-stamp
// POST /stores/{storeId}/upload-signature
```

### 👥 Customer Management

```typescript
// GET /customers?storeId={id}&search={query}&page={num}&limit={num}
// GET /customers/{customerId}
Response: Customer object

// POST /customers
{
  "title": "นาย|นาง|นางสาว",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "idNumber": "string",
  "address": { /* address object */ }
}

// PUT /customers/{customerId}
// DELETE /customers/{customerId}
```

### 📋 Contract Management

```typescript
// GET /contracts?storeId={id}&status={status}&page={num}&limit={num}
// GET /contracts/{contractId}
// GET /contracts/statistics?storeId={id}&dateRange={range}

Response: {
  contracts: Contract[],
  total: number,
  page: number,
  totalPages: number
}

// POST /contracts
{
  "customerId": "ObjectId",
  "item": {
    "brand": "string",
    "model": "string",
    "type": "string",
    "serialNo": "string",
    "accessories": "string",
    "condition": number,
    "defects": "string",
    "note": "string"
  },
  "pawnDetails": {
    "pawnedPrice": number,
    "periodDays": number
  }
}

// PUT /contracts/{contractId}
{
  "status": "active|overdue|redeemed|suspended|sold",
  "item": { /* item updates */ },
  "pawnDetails": { /* pawn details updates */ }
}

// POST /contracts/{contractId}/transactions
{
  "type": "interest_payment|principal_increase|principal_decrease|redeem|suspend",
  "amount": number,
  "paymentMethod": "string",
  "note": "string"
}

// POST /contracts/{contractId}/upload-images
// Content-Type: multipart/form-data
// Body: image files

// GET /contracts/{contractId}/export-pdf
// Response: PDF file
```

### 📦 Item Management

```typescript
// GET /items?storeId={id}&type={type}&status={status}
// GET /items/{itemId}

// POST /items
{
  "brand": "string",
  "model": "string",
  "type": "string",
  "serialNo": "string",
  "condition": number,
  "accessories": "string",
  "defects": "string",
  "note": "string"
}

// PUT /items/{itemId}
// DELETE /items/{itemId}
```

### 💰 Transaction Management

```typescript
// GET /transactions?storeId={id}&type={type}&dateRange={range}
// GET /transactions/{transactionId}

// POST /transactions/{contractId}
{
  "type": "pawn|interest_payment|redeem|extend|suspend|sell",
  "amount": number,
  "paymentMethod": "cash|bank_transfer|promptpay",
  "note": "string"
}
```

### 📊 Analytics & Reports

```typescript
// GET /analytics/dashboard?storeId={id}&dateRange={range}
// GET /analytics/revenue?storeId={id}&dateRange={range}
// GET /analytics/contracts-summary?storeId={id}&dateRange={range}
// GET /analytics/customer-insights?storeId={id}
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure

```javascript
// Access Token Payload
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "owner|manager|staff",
  "storeId": "store_id",
  "permissions": ["contracts.read", "contracts.write", "customers.read"],
  "exp": 1735689600, // 24 hours
  "iat": 1735603200
}

// Refresh Token Payload
{
  "sub": "user_id",
  "type": "refresh",
  "exp": 1735689600, // 30 days
  "iat": 1735603200
}
```

### Permission System

```javascript
// Role-based Permissions
const PERMISSIONS = {
  owner: [
    'stores.read', 'stores.write', 'stores.delete',
    'users.read', 'users.write', 'users.delete',
    'contracts.read', 'contracts.write', 'contracts.delete',
    'customers.read', 'customers.write', 'customers.delete',
    'items.read', 'items.write', 'items.delete',
    'transactions.read', 'transactions.write',
    'analytics.read'
  ],
  manager: [
    'contracts.read', 'contracts.write',
    'customers.read', 'customers.write',
    'items.read', 'items.write',
    'transactions.read', 'transactions.write',
    'analytics.read'
  ],
  staff: [
    'contracts.read',
    'customers.read',
    'items.read',
    'transactions.read'
  ]
};
```

### Security Headers (สำหรับ API)

```javascript
// FastAPI Security Headers
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https://your-s3-bucket.s3.amazonaws.com",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

---

## ⚡ Database Indexing & Performance

### Critical Indexes

```javascript
// Users Collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ storeId: 1 });
db.users.createIndex({ role: 1 });

// Stores Collection
db.stores.createIndex({ ownerId: 1 });
db.stores.createIndex({ taxId: 1 });

// Customers Collection
db.customers.createIndex({ idNumber: 1 }, { unique: true });
db.customers.createIndex({ storeId: 1 });
db.customers.createIndex({ phone: 1 });
db.customers.createIndex({ "address.province": 1 });

// Contracts Collection
db.contracts.createIndex({ contractNumber: 1 }, { unique: true });
db.contracts.createIndex({ storeId: 1 });
db.contracts.createIndex({ customerId: 1 });
db.contracts.createIndex({ status: 1 });
db.contracts.createIndex({ "dates.dueDate": 1 });
db.contracts.createIndex({ "dates.startDate": 1 });

// Compound indexes for dashboard queries
db.contracts.createIndex({ storeId: 1, status: 1, "dates.dueDate": 1 });
db.contracts.createIndex({ storeId: 1, "dates.startDate": -1 });

// Items Collection
db.items.createIndex({ storeId: 1 });
db.items.createIndex({ status: 1 });
db.items.createIndex({ type: 1 });
db.items.createIndex({ "contractHistory.contractId": 1 });

// Transactions Collection
db.transactions.createIndex({ contractId: 1 });
db.transactions.createIndex({ storeId: 1 });
db.transactions.createIndex({ type: 1 });
db.transactions.createIndex({ createdAt: -1 });
```

### Performance Optimization

```javascript
// Aggregation Pipeline for Dashboard Statistics
const dashboardStats = await db.contracts.aggregate([
  {
    $match: {
      storeId: storeId,
      "dates.startDate": { $gte: startDate, $lte: endDate }
    }
  },
  {
    $group: {
      _id: null,
      totalContracts: { $sum: 1 },
      activeContracts: {
        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
      },
      overdueContracts: {
        $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] }
      },
      totalValue: { $sum: "$pawnDetails.pawnedPrice" }
    }
  }
]);
```

---

## 📁 File Upload & Management

### File Upload Process

```typescript
// Frontend: Handle file selection and preview
const handleFileUpload = async (file: File, type: 'logo' | 'stamp' | 'signature' | 'item-image') => {
  // 1. Generate presigned URL from backend
  const presignedUrl = await api.getPresignedUrl({
    fileName: file.name,
    fileType: file.type,
    uploadType: type,
    storeId: currentStoreId
  });

  // 2. Upload directly to S3
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });

  // 3. Save file URL to database
  await api.saveFileReference({
    fileName: file.name,
    fileUrl: presignedUrl.split('?')[0], // Remove query params
    uploadType: type,
    storeId: currentStoreId
  });
};
```

### Backend File Upload Handler

```python
# FastAPI endpoint for generating presigned URLs
@app.post("/upload/generate-presigned-url")
async def generate_presigned_url(
    file_name: str,
    file_type: str,
    upload_type: str,
    store_id: str,
    current_user: User = Depends(get_current_user)
):
    # Validate user permissions
    if not can_upload_file(current_user, store_id, upload_type):
        raise HTTPException(403, "Insufficient permissions")

    # Generate S3 key based on upload type and store
    s3_key = generate_s3_key(upload_type, store_id, file_name)

    # Generate presigned URL
    presigned_url = s3_client.generate_presigned_post(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Fields={
            'Content-Type': file_type,
            'ACL': 'private'
        },
        Conditions=[
            {'Content-Type': file_type},
            {'ACL': 'private'}
        ],
        ExpiresIn=3600  # 1 hour
    )

    return {
        "presignedUrl": presigned_url,
        "s3Key": s3_key,
        "fileUrl": f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    }
```

### S3 Key Generation Function

```python
def generate_s3_key(upload_type: str, store_id: str, file_name: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_ext = file_name.split('.')[-1]

    key_patterns = {
        'logo': f"store-assets/{store_id}/logos/logo_{timestamp}.{file_ext}",
        'stamp': f"store-assets/{store_id}/stamps/stamp_{timestamp}.{file_ext}",
        'signature': f"store-assets/{store_id}/signatures/signature_{timestamp}.{file_ext}",
        'item-image': f"item-images/{store_id}/{contract_id}/image_{timestamp}.{file_ext}"
    }

    return key_patterns.get(upload_type, f"misc/{store_id}/{file_name}")
```

---

## 🔗 Data Relationships & Integrity

### Entity Relationships

```mermaid
graph TB
    A[Stores] --> B[Users]
    A --> C[Contracts]
    A --> D[Customers]
    A --> E[Items]
    C --> F[Transactions]
    C --> D
    E --> C
    B --> A
    B --> C
    B --> F
```

### Referential Integrity Rules

1. **Cascade Delete Rules:**
   - ลบ Store → ลบ Users, Contracts, Customers, Items ที่เกี่ยวข้อง
   - ลบ Contract → ลบ Transactions ที่เกี่ยวข้อง
   - ลบ Customer → ไม่ลบ Contracts (เก็บประวัติ)

2. **Data Validation Rules:**
   - Contract ต้องมี Customer ที่ valid
   - Item ใน Contract ต้องมีข้อมูลครบถ้วน
   - Transaction ต้องอ้างอิง Contract ที่มีอยู่

### Data Consistency Checks

```javascript
// Middleware for Contract Creation
const validateContractData = async (contractData) => {
  // Check if customer exists and belongs to store
  const customer = await Customer.findOne({
    _id: contractData.customerId,
    storeId: contractData.storeId
  });

  if (!customer) {
    throw new Error('Invalid customer or customer does not belong to this store');
  }

  // Validate pawn details
  if (contractData.pawnDetails.pawnedPrice > contractData.item.aiEstimatedPrice) {
    throw new Error('Pawned price cannot exceed AI estimated price');
  }

  // Check for duplicate contract number
  const existingContract = await Contract.findOne({
    contractNumber: contractData.contractNumber,
    storeId: contractData.storeId
  });

  if (existingContract) {
    throw new Error('Contract number already exists');
  }

  return true;
};
```

---

## 📈 Implementation Timeline

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up MongoDB Atlas cluster
- [ ] Configure AWS S3 bucket and IAM policies
- [ ] Implement authentication system
- [ ] Create basic API endpoints

### Phase 2: Data Models (Week 3-4)
- [ ] Implement all MongoDB schemas
- [ ] Set up database indexing
- [ ] Create data validation middleware
- [ ] Implement file upload system

### Phase 3: Business Logic (Week 5-6)
- [ ] Implement contract creation workflow
- [ ] Add transaction processing
- [ ] Create dashboard analytics
- [ ] Implement reporting features

### Phase 4: Frontend Integration (Week 7-8)
- [ ] Connect frontend to backend APIs
- [ ] Implement file upload UI
- [ ] Add real-time updates
- [ ] Create admin dashboard

### Phase 5: Testing & Deployment (Week 9-10)
- [ ] Unit and integration testing
- [ ] Performance testing
- [ ] Security auditing
- [ ] Production deployment

---

## 🔧 Development Setup

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pawnshop

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=pawn-shop-files

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret

# API
API_PORT=8000
FRONTEND_URL=http://localhost:3000
```

### Database Connection

```python
# Python/FastAPI
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = "pawnshop"

client = AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]
```

```typescript
// TypeScript/Next.js
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const client = new MongoClient(MONGODB_URI);
const database = client.db('pawnshop');
```

---

## 📋 สรุปและคำแนะนำ

### ข้อควรพิจารณาในการ Implement

1. **Scalability**: ออกแบบให้รองรับหลายสาขา (multi-store)
2. **Security**: ใช้ encryption สำหรับข้อมูล敏感
3. **Backup**: ตั้งค่า automated backup สำหรับฐานข้อมูล
4. **Monitoring**: ติดตั้ง monitoring สำหรับ performance และ errors

### Cost Optimization

1. **MongoDB Atlas**: เริ่มด้วย M0 (free) แล้ว upgrade ตามการใช้งาน
2. **AWS S3**: ใช้ lifecycle policies เพื่อย้ายไฟล์เก่าไป storage class ที่ถูกกว่า
3. **CDN**: พิจารณาใช้ CloudFront สำหรับ serve รูปภาพ

### Next Steps

1. **เริ่มจาก Core Models**: Users, Stores, Customers ก่อน
2. **Implement Authentication**: ก่อนพัฒนา features อื่น
3. **สร้าง API Documentation**: ด้วย Swagger/OpenAPI
4. **เขียน Tests**: Unit tests และ integration tests

เอกสารนี้ออกแบบมาอย่างครอบคลุมสำหรับการพัฒนาระบบ Pawn Shop Management ที่สมบูรณ์และ scalable ครับ! 🚀