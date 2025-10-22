# Pawn360 - Full-Stack Next.js Pawn Shop Management System

ระบบจัดการร้านรับจำนำแบบครบครันที่พัฒนาด้วย Next.js 15 พร้อม API Routes และ MongoDB

## 🚀 คุณสมบัติหลัก

- **การจัดการลูกค้า**: เพิ่ม แก้ไข ค้นหาข้อมูลลูกค้า
- **การจัดการสัญญาจำนำ**: สร้างและติดตามสัญญาจำนำ
- **แดชบอร์ด**: สถิติและกราฟแสดงข้อมูลร้านค้า
- **ระบบผู้ใช้**: การเข้าสู่ระบบและจัดการสิทธิ์
- **การจัดการร้านค้า**: รองรับหลายสาขา

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
MONGODB_URI=mongodb://localhost:27017/pawn360
JWT_SECRET=your-super-secret-jwt-key-here
```

4. รันแอปพลิเคชัน:
```bash
npm run dev
```

5. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

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
  address: Object,
  phone: String,
  taxId: String,
  ownerId: ObjectId,
  passwordHash: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
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

## 📝 License

This project is private and proprietary.

## 👥 ผู้พัฒนา

Pawn360 Development Team
