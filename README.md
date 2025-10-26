# Pawn360 - Full-Stack Next.js Pawn Shop Management System

ระบบจัดการร้านรับจำนำแบบครบครันที่พัฒนาด้วย Next.js 15 พร้อม API Routes และ MongoDB

## 🚀 คุณสมบัติหลัก

- **การจัดการลูกค้า**: เพิ่ม แก้ไข ค้นหาข้อมูลลูกค้า
- **การจัดการสัญญาจำนำ**: สร้างและติดตามสัญญาจำนำ
- **แดชบอร์ด**: สถิติและกราฟแสดงข้อมูลร้านค้า
- **ระบบผู้ใช้**: การเข้าสู่ระบบและจัดการสิทธิ์
- **การจัดการร้านค้า**: รองรับหลายสาขา พร้อมการตั้งค่าดอกเบี้ยครบครัน
- **อัพโหลดไฟล์**: อัพโหลดโลโก้ รูปลายเซ็น และ QR Code ธนาคารไปยัง AWS S3
- **ตั้งค่าดอกเบี้ย**: จัดการอัตราดอกเบี้ยแบบยืดหยุ่นตามจำนวนวัน

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js, Recharts

## 📦 การติดตั้งและรัน

### ข้อกำหนดเบื้องต้น

- Node.js 18+
- MongoDB (Local หรือ MongoDB Atlas)
- npm หรือ yarn

### การติดตั้ง

1. Clone โปรเจค:
```bash
git clone <repository-url>
cd pawn360
```

2. ติดตั้ง dependencies:
```bash
npm install
```

3. ตั้งค่า Environment Variables:
สร้างไฟล์ `.env.local`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/pawn360

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# AWS S3 (สำหรับอัพโหลดไฟล์)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET=your-s3-bucket-name

# Next.js (เว้นว่างไว้สำหรับ API routes)
NEXT_PUBLIC_API_URL=
```

4. ตั้งค่า AWS S3 (สำหรับการอัพโหลดไฟล์):

   - สร้าง AWS S3 bucket
   - ตั้งค่า CORS policy สำหรับ bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
   - สร้าง IAM user ด้วย S3 permissions และนำ access keys ใส่ใน `.env.local`

5. รันแอปพลิเคชัน:
```bash
npm run dev
```

6. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

## 📁 โครงสร้างโปรเจค

```
pawn360/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── stores/     # Store management
│   │   │   ├── customers/  # Customer management
│   │   │   ├── contracts/  # Contract management
│   │   │   └── dashboard/  # Dashboard statistics
│   │   ├── dashboard/      # Dashboard page
│   │   ├── contracts/      # Contracts page
│   │   ├── customers/      # Customers page
│   │   └── auth/           # Authentication pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and configurations
│   └── data/               # Static data and types
├── public/                 # Static assets
├── package.json
├── next.config.js
└── tailwind.config.js
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signin` - เข้าสู่ระบบ
- `POST /api/auth/signup` - สมัครสมาชิก

### Stores
- `GET /api/stores` - ดูร้านค้าทั้งหมดของผู้ใช้
- `POST /api/stores` - สร้างร้านค้าใหม่
- `GET /api/stores/[store_id]` - ดูรายละเอียดร้านค้า
- `PUT /api/stores/[store_id]` - แก้ไขร้านค้า

### Customers
- `GET /api/customers?storeId=...` - ดูลูกค้าทั้งหมด
- `POST /api/customers` - สร้างลูกค้าใหม่
- `GET /api/customers/search` - ค้นหาลูกค้า

### Contracts
- `GET /api/contracts?storeId=...&status=...` - ดูสัญญาทั้งหมด
- `POST /api/contracts` - สร้างสัญญาใหม่
- `GET /api/contracts/[id]` - ดูรายละเอียดสัญญา
- `PUT /api/contracts/[id]` - แก้ไขสัญญา

### Dashboard
- `GET /api/dashboard?storeId=...` - สถิติแดชบอร์ด

## 🗄️ โครงสร้างฐานข้อมูล

### Collections

#### users
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  passwordHash: String,
  role: String,
  createdAt: Date
}
```

#### stores
```javascript
{
  _id: ObjectId,
  storeName: String,
  phone: String,
  taxId: String,
  address: {
    houseNumber: String,
    village: String,
    street: String,
    subDistrict: String,
    district: String,
    province: String,
    country: String,
    postcode: String
  },
  ownerId: ObjectId,
  passwordHash: String,
  logoUrl: String,           // AWS S3 URL
  stampUrl: String,          // AWS S3 URL
  signatureUrl: String,      // AWS S3 URL
  interestPresets: [{        // Array of interest rate presets
    days: Number,
    rate: Number
  }],
  contractTemplate: {
    header: String,
    footer: String,
    terms: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  googlemap: String,          // Google Maps URL
  bankUrl: String,            // Bank QR Code URL (AWS S3)
  interestPerday: Number,     // Daily interest rate percentage
  interestSet: Object,        // Interest rates by period
  logo: String,               // Logo image URL (AWS S3)
  signature: String,          // Signature image URL (AWS S3)
  delayed: {
    maxday: Number,           // Maximum late days
    feeperday: Number         // Late fee per day
  }
}
```

#### customers
```javascript
{
  _id: ObjectId,
  storeId: ObjectId,
  fullName: String,
  phone: String,
  idNumber: String,
  address: Object,
  totalContracts: Number,
  totalValue: Number,
  lastContractDate: Date,
  contractsID: [ObjectId],
  createdAt: Date
}
```

#### contracts
```javascript
{
  _id: ObjectId,
  contractNumber: String,
  storeId: ObjectId,
  customerId: ObjectId,
  item: Object,
  pawnDetails: Object,
  dates: Object,
  status: String,
  transactionHistory: Array,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 การ Deploy

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables สำหรับ Production
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pawn360
JWT_SECRET=your-production-jwt-secret
NEXT_PUBLIC_API_URL=
```

## 🎯 ฟีเจอร์พิเศษ

### ตั้งค่าดอกเบี้ย (Interest Rate Settings)

ระบบรองรับการตั้งค่าอัตราดอกเบี้ยแบบยืดหยุ่น:

- **Interest Presets**: ตั้งค่าอัตราดอกเบี้ยตามจำนวนวัน (7, 15, 30 วัน)
- **Daily Interest**: เลือกคิดดอกเบี้ยแบบรายวัน
- **Dynamic Periods**: เพิ่ม/ลบช่วงเวลาดอกเบี้ยได้ตามต้องการ
- **Late Fee Settings**: ตั้งค่าค่าปรับเมื่อเลยกำหนด

### อัพโหลดไฟล์ (File Upload)

รองรับการอัพโหลดไฟล์ไปยัง AWS S3:

- **Logo**: โลโก้ร้านค้า
- **Signature**: รูปลายเซ็น
- **Bank QR**: QR Code สำหรับการชำระเงินผ่านธนาคาร
- **Validation**: ตรวจสอบประเภทไฟล์และขนาด (สูงสุด 5MB)
- **Auto Organization**: จัดเก็บไฟล์ในโฟลเดอร์ตามรหัสร้านค้า

### API Endpoints เพิ่มเติม

- `POST /api/upload` - อัพโหลดไฟล์ไปยัง AWS S3
- `PUT /api/stores/[store_id]` - อัพเดตรายละเอียดร้านค้า

## 📝 License

This project is private and proprietary.

## 👥 ผู้พัฒนา

Pawn360 Development Team
