# Pawn360 - Modern Pawn Shop Management System

A comprehensive SaaS solution for pawn shop operations, featuring customer management, item valuation, contract handling, and business analytics.

## 🚀 Features

### Landing Page
- **Modern Responsive Design** - Fully responsive landing page with smooth animations
- **Multi-section Layout** - Hero section, feature overview, roadmap, and contact form
- **Interactive Elements** - Hover effects, sticky navigation, and smooth scrolling
- **Call-to-Action** - Clear signup/signin flow for new users

### Authentication System
- **Secure Signup/Signin** - Complete user registration with store information
- **JWT Authentication** - Secure token-based authentication system
- **Role-Based Access** - Admin and staff user roles with appropriate permissions

### Dashboard
- **Business Analytics** - Real-time metrics, charts, and performance indicators
- **Contract Overview** - Quick view of active, overdue, and suspended contracts
- **Financial Summary** - Today's value, total assets, and revenue trends
- **Interactive Charts** - Pie charts for item categories, revenue line charts

### Pawn Entry System
- **Multi-Step Form** - Guided process for creating new pawn contracts
- **Customer Search** - Find existing customers or register new ones
- **Item Documentation** - Detailed item information with image uploads
- **AI-Powered Valuation** - Automated item assessment and pricing suggestions
- **Contract Generation** - Complete loan terms and contract creation

### Contract Management
- **Contract List View** - Searchable and filterable contract table
- **Detailed Contract View** - Complete contract information and history
- **Action Management** - Redeem, pay interest, adjust loans, suspend contracts
- **Transaction History** - Full audit trail of all contract activities
- **Status Tracking** - Visual status indicators and due date warnings

### Account Management
- **Store Settings** - Complete store information and configuration
- **File Uploads** - Store logo, official stamp, and signature management
- **Interest Presets** - Configurable interest rates for different periods
- **User Profile** - Personal information and password management

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart and data visualization library
- **Lucide React** - Modern icon library

### Backend (Ready for Integration)
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database for flexible data storage
- **Pydantic** - Data validation and serialization
- **JWT** - JSON Web Token authentication
- **AWS S3** - File storage for images and documents

### Color Palette
Based on the Pawn360 UI specifications:
- **Primary Green (Leaf Green)**: #4CAF50 - Main actions and highlights
- **Navy Blue**: #1976D2 - Secondary actions and accents
- **Clay Grey**: #5F6368 - Text and subtle elements
- **Semantic Colors**: Red (#F44336), Orange (#FF9800) for status indicators
- **Light Greys**: Various shades for backgrounds and borders

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud)
- Python 3.8+ (for backend)
- AWS Account (for S3 file storage)

## 🚀 Quick Start

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pawn360
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/pawn360
   
   # FastAPI Backend
   NEXT_PUBLIC_API_URL=http://localhost:8000
   
   # JWT Secret
   JWT_SECRET=your-jwt-secret-key-here
   
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=pawn360-uploads
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Backend Setup (FastAPI)

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **API Documentation**
   Visit [http://localhost:8000/docs](http://localhost:8000/docs) for interactive API documentation

## 📁 Project Structure

```
pawn360/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── pawn-entry/        # Pawn entry form
│   │   ├── contracts/         # Contract management
│   │   ├── account/           # Account settings
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable React components
│   │   └── layout/           # Layout components
│   └── lib/                   # Utility libraries
│       └── api.ts            # API client functions
├── backend/                   # FastAPI backend
│   ├── models.py             # Pydantic models
│   ├── database.py           # MongoDB operations
│   └── main.py               # FastAPI application
├── public/                    # Static assets
├── .env.example              # Environment variables template
├── .env.local                # Environment variables (create this)
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── package.json              # Node.js dependencies
└── README.md                 # This file
```

## 🔐 Authentication Flow

1. **User Registration**: Complete signup with personal and store information
2. **Store Creation**: Automatic store creation during user registration
3. **JWT Token**: Secure token-based authentication
4. **Protected Routes**: Automatic redirection for unauthenticated users
5. **Role Management**: Admin and staff roles with appropriate permissions

## 📊 Database Schema

### Collections

1. **users** - User accounts and authentication
2. **stores** - Pawn shop information and settings
3. **customers** - Customer database with contact information
4. **contracts** - Pawn contracts with complete transaction history
5. **brands** - Brand options for item categorization

### Key Relationships
- Users belong to Stores (many-to-one)
- Customers belong to Stores (many-to-one)
- Contracts link Customers and Stores (many-to-one each)
- Transactions belong to Contracts (many-to-one)

## 🎨 UI/UX Design Principles

### Color Usage
- **Primary Actions**: Leaf Green for main CTAs, confirmations
- **Secondary Actions**: Navy Blue and Clay Grey for supporting elements
- **Status Indicators**: Red for overdue/errors, Orange for warnings, Green for success
- **Backgrounds**: Light greys and off-white for clean, professional appearance

### Typography
- **Headings**: Bold weights (700) for prominence
- **Body Text**: Regular weights (400) for readability
- **Fonts**: Inter and Poppins for modern, clean appearance

### Interactive Elements
- **Hover Effects**: Subtle scaling and color transitions
- **Form Focus**: Green accent colors and subtle shadows
- **Button Animations**: Smooth transitions with elevation changes

## 🔧 API Integration

The frontend includes a comprehensive API client (`src/lib/api.ts`) with functions for:

- **Authentication**: signup, signin, token refresh
- **Store Management**: CRUD operations, file uploads
- **Customer Operations**: search, create, update
- **Contract Management**: full lifecycle operations
- **Dashboard Data**: statistics and chart data
- **AI Valuation**: automated item assessment

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices with progressive enhancement
- **Breakpoints**: Responsive design for tablets and desktop
- **Touch Friendly**: Large touch targets and intuitive gestures
- **Cross-Browser**: Compatible with modern browsers

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Connect your repository to Vercel or Netlify
2. Configure environment variables
3. Deploy automatically on push to main branch

### Backend (Railway/Heroku/DigitalOcean)
1. Containerize the FastAPI application
2. Configure MongoDB connection
3. Set up AWS S3 for file storage
4. Deploy to your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the code comments for implementation details

## 🔮 Future Enhancements

- **Mobile App**: React Native application for mobile access
- **Advanced Analytics**: Machine learning insights and predictions
- **Multi-Location**: Support for multiple store locations
- **Investor Portal**: Platform for connecting with investors
- **Payment Integration**: Stripe/PayPal payment processing
- **Notification System**: Email and SMS notifications
- **Backup & Recovery**: Automated data backup solutions

---

Built with ❤️ for modern pawn shop management