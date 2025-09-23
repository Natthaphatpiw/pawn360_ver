# Pawn360 Database Scripts

This directory contains scripts for setting up and managing the MongoDB database for Pawn360.

## 📁 Files

- **`init-database.py`** - Complete database initialization script
- **`check-database.py`** - Database health check and status verification
- **`reset-database.py`** - Database reset tool with backup option
- **`setup-database.sh`** - Automated setup script for Unix/Linux/macOS
- **`requirements.txt`** - Python dependencies for the scripts

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
cd scripts
./setup-database.sh
```

### Option 2: Manual Setup

```bash
cd scripts

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python3 init-database.py
```

## 📋 What Gets Created

### Collections
- **`users`** - User accounts and authentication
- **`stores`** - Pawn shop information and settings  
- **`customers`** - Customer database
- **`contracts`** - Pawn contracts with transaction history
- **`brands`** - Brand options for item categorization
- **`audit_logs`** - System activity logs
- **`sessions`** - User session management
- **`notifications`** - System notifications

### Indexes
Each collection gets optimized indexes for:
- Search performance (text indexes)
- Relationship queries (foreign key indexes)
- Date-based queries (timestamp indexes)
- Unique constraints (email, contract numbers)

### Demo Data
- **Demo Store**: "Demo Pawn Shop" with complete information
- **Demo User**: email: `demo@pawn360.com`, password: `demo123`
- **Demo Customers**: 3 sample customers with addresses
- **Demo Contracts**: 3 sample contracts (active, overdue, etc.)
- **Brands**: 40+ initial brands across categories

## 🔧 Database Scripts

### Initialize Database

Creates all collections, indexes, and demo data:

```bash
python3 init-database.py
```

**Features:**
- ✅ Creates all collections with proper schemas
- ✅ Sets up performance indexes
- ✅ Loads initial brand data (40+ brands)
- ✅ Creates demo store and user account
- ✅ Generates sample customers and contracts
- ✅ Verifies setup completion

### Check Database Status

Comprehensive health check of your database:

```bash
python3 check-database.py
```

**Checks:**
- 🔍 Connection status
- 📊 Collection document counts
- 🔗 Index status
- 🧩 Data integrity and relationships
- 🎭 Demo data availability
- ⏰ Recent activity

### Reset Database

Safely reset the database with backup option:

```bash
python3 reset-database.py
```

**Features:**
- ⚠️ Safe confirmation prompts
- 💾 Optional backup creation
- 🗑️ Complete collection removal
- 🔐 Secure operation

## 🌐 Database Configuration

The scripts are configured to use your MongoDB Atlas cluster:

```
URI: mongodb+srv://natthapiw_db_user:***@cluster0.skadipr.mongodb.net/
Database: pawn360
Region: MongoDB Atlas Cloud
```

## 📊 Database Schema Overview

### Core Relationships
```
Store (1) ←→ (N) Users
Store (1) ←→ (N) Customers  
Store (1) ←→ (N) Contracts
Customer (1) ←→ (N) Contracts
```

### Key Features
- **Multi-tenancy**: All data is scoped by `store_id`
- **Audit Trail**: Complete transaction history in contracts
- **Search Optimization**: Text indexes on key fields
- **Data Integrity**: Foreign key validation
- **Performance**: Optimized indexes for common queries

## 🎯 Demo Data Details

### Demo Login
```
Email: demo@pawn360.com
Password: demo123
Role: admin
```

### Sample Contracts
1. **iPhone 14 Pro** - Active contract (₿25,000)
2. **Rolex Submariner** - Overdue contract (₿150,000)  
3. **Canon EOS R5** - Active contract (₿75,000)

### Brand Categories
- Electronics (Apple, Samsung, Sony, Canon, etc.)
- Watches (Rolex, Omega, Casio, etc.)
- Jewelry (Tiffany & Co., Cartier, etc.)
- Bags (Louis Vuitton, Chanel, etc.)
- Shoes (Nike, Adidas, etc.)
- Musical Instruments (Yamaha, Fender, etc.)

## 🔒 Security Notes

- Database credentials are configured in environment variables
- Demo data is for development/testing only
- Production deployments should use different credentials
- All passwords are properly hashed with bcrypt

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check if MongoDB URI is correct
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; asyncio.run(AsyncIOMotorClient('your-uri').admin.command('ping')); print('OK')"
```

### Permission Issues
```bash
# Make setup script executable
chmod +x setup-database.sh
```

### Python Environment
```bash
# Check Python version (requires 3.8+)
python3 --version

# Verify virtual environment
which python3
pip list
```

## 📈 Performance Optimization

The database is pre-configured with indexes for optimal performance:

- **Text Search**: Full-text search on names, brands, models
- **Date Queries**: Optimized for due date and creation date searches  
- **Relationships**: Fast joins between stores, customers, and contracts
- **Status Filtering**: Quick contract status lookups

## 🔄 Maintenance

### Regular Checks
Run the health check regularly:
```bash
python3 check-database.py
```

### Data Backup
Before major changes:
```bash
python3 reset-database.py  # Select backup option
```

### Re-initialization
If needed, completely reset and recreate:
```bash
python3 reset-database.py
python3 init-database.py
```

---

**Need Help?** 
- Check the main README.md for application setup
- Review error messages for specific issues
- Ensure MongoDB Atlas cluster is running
- Verify network connectivity