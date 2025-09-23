#!/usr/bin/env python3
"""
Clean Database Initialization Script for Pawn360
This is a simplified version that handles existing data properly
"""

import asyncio
from datetime import datetime, date, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from bson import ObjectId

# Database configuration
MONGODB_URI = "mongodb+srv://natthapiw_db_user:afOJe2MrgMDsmm6k@cluster0.skadipr.mongodb.net/pawn360?retryWrites=true&w=majority&appName=Cluster0"
DATABASE_NAME = "pawn360"

async def connect_to_database():
    """Connect to MongoDB"""
    print("🔄 Connecting to MongoDB Atlas...")
    
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully")
        
        return client, db
        
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        raise e

async def create_basic_indexes(db):
    """Create essential indexes only"""
    print("🔄 Creating essential indexes...")
    
    try:
        # Users collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("store_id")
        print("✅ Created users indexes")
        
        # Customers collection indexes
        await db.customers.create_index("store_id")
        await db.customers.create_index("phone_number")
        await db.customers.create_index([("store_id", 1), ("phone_number", 1)])
        print("✅ Created customers indexes")
        
        # Contracts collection indexes
        await db.contracts.create_index("contract_number", unique=True)
        await db.contracts.create_index("store_id")
        await db.contracts.create_index("status")
        await db.contracts.create_index([("store_id", 1), ("status", 1)])
        print("✅ Created contracts indexes")
        
        # Brands collection indexes
        await db.brands.create_index("name", unique=True)
        print("✅ Created brands indexes")
        
    except Exception as e:
        print(f"⚠️  Some indexes may already exist: {e}")

async def insert_brands(db):
    """Insert brand data"""
    print("🔄 Inserting brand data...")
    
    brands = [
        {"name": "Apple", "category": "Electronics"},
        {"name": "Samsung", "category": "Electronics"},
        {"name": "Sony", "category": "Electronics"},
        {"name": "Canon", "category": "Electronics"},
        {"name": "Rolex", "category": "Watches"},
        {"name": "Omega", "category": "Watches"},
        {"name": "Casio", "category": "Watches"},
        {"name": "Tiffany & Co.", "category": "Jewelry"},
        {"name": "Cartier", "category": "Jewelry"},
        {"name": "Louis Vuitton", "category": "Bags"},
        {"name": "Chanel", "category": "Bags"},
        {"name": "Gucci", "category": "Bags"},
        {"name": "Nike", "category": "Shoes"},
        {"name": "Adidas", "category": "Shoes"},
        {"name": "Generic", "category": "Other"}
    ]
    
    for brand in brands:
        try:
            await db.brands.update_one(
                {"name": brand["name"]},
                {
                    "$set": {
                        "name": brand["name"],
                        "category": brand["category"],
                        "is_active": True,
                        "created_at": datetime.now()
                    }
                },
                upsert=True
            )
        except Exception as e:
            print(f"⚠️  Brand {brand['name']} may already exist")
    
    count = await db.brands.count_documents({})
    print(f"✅ Brands in database: {count}")

async def create_demo_data(db):
    """Create demo store, user, customers, and contracts"""
    print("🔄 Creating demo data...")
    
    # Create or get demo store
    store = await db.stores.find_one({"store_name": "Demo Pawn Shop"})
    if not store:
        store_id = ObjectId()
        store_data = {
            "_id": store_id,
            "store_name": "Demo Pawn Shop",
            "address": {
                "street": "123 Demo Street",
                "sub_district": "Pathumwan",
                "district": "Pathumwan",
                "province": "Bangkok",
                "postcode": "10330"
            },
            "phone": "02-123-4567",
            "tax_id": "1234567890123",
            "interest_presets": [
                {"days": 7, "rate": 4.0},
                {"days": 15, "rate": 3.5},
                {"days": 30, "rate": 3.0},
                {"days": 60, "rate": 2.5}
            ],
            "created_at": datetime.now()
        }
        await db.stores.insert_one(store_data)
        store_id = store_data["_id"]
        print("✅ Created demo store")
    else:
        store_id = store["_id"]
        print("✅ Demo store already exists")
    
    # Create or get demo user
    user = await db.users.find_one({"email": "demo@pawn360.com"})
    if not user:
        password_hash = bcrypt.hashpw("demo123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_data = {
            "_id": ObjectId(),
            "store_id": store_id,
            "full_name": "Demo Admin",
            "email": "demo@pawn360.com",
            "password_hash": password_hash,
            "role": "admin",
            "created_at": datetime.now()
        }
        await db.users.insert_one(user_data)
        print("✅ Created demo user")
    else:
        print("✅ Demo user already exists")
    
    # Create demo customers
    customers_data = [
        {
            "full_name": "John Smith",
            "phone_number": "0812345678", 
            "id_number": "1234567890123"
        },
        {
            "full_name": "Mary Johnson",
            "phone_number": "0987654321",
            "id_number": "9876543210987"
        },
        {
            "full_name": "David Brown", 
            "phone_number": "0856789123",
            "id_number": "5555666677778"
        }
    ]
    
    customer_ids = []
    for customer_data in customers_data:
        customer = await db.customers.find_one({
            "store_id": store_id,
            "phone_number": customer_data["phone_number"]
        })
        
        if not customer:
            customer_id = ObjectId()
            full_customer_data = {
                "_id": customer_id,
                "store_id": store_id,
                "full_name": customer_data["full_name"],
                "phone_number": customer_data["phone_number"],
                "id_number": customer_data["id_number"],
                "address": {
                    "street": "123 Sample Street",
                    "sub_district": "Pathumwan",
                    "district": "Pathumwan",
                    "province": "Bangkok",
                    "postcode": "10330"
                },
                "created_at": datetime.now()
            }
            await db.customers.insert_one(full_customer_data)
            customer_ids.append(customer_id)
        else:
            customer_ids.append(customer["_id"])
    
    print(f"✅ Demo customers ready: {len(customer_ids)}")
    
    # Create demo contracts
    contracts_data = [
        {
            "customer_idx": 0,
            "item": {
                "brand": "Apple",
                "model": "iPhone 14 Pro", 
                "type": "Smartphone",
                "condition_percent": 85,
                "defects": "Minor scratches"
            },
            "pawn_details": {
                "ai_estimated_price": 35000,
                "pawned_price": 25000,
                "interest_rate_percent": 3.0,
                "period_days": 30
            },
            "status": "active",
            "start_days_ago": 15
        },
        {
            "customer_idx": 1,
            "item": {
                "brand": "Rolex",
                "model": "Submariner",
                "type": "Watch", 
                "condition_percent": 95,
                "defects": "None"
            },
            "pawn_details": {
                "ai_estimated_price": 200000,
                "pawned_price": 150000,
                "interest_rate_percent": 2.5,
                "period_days": 30
            },
            "status": "overdue",
            "start_days_ago": 45
        },
        {
            "customer_idx": 2,
            "item": {
                "brand": "Canon",
                "model": "EOS R5",
                "type": "Camera",
                "condition_percent": 90,
                "defects": "Minor wear on grip"
            },
            "pawn_details": {
                "ai_estimated_price": 100000,
                "pawned_price": 75000,
                "interest_rate_percent": 3.5,
                "period_days": 60
            },
            "status": "active",
            "start_days_ago": 5
        }
    ]
    
    for contract_data in contracts_data:
        # Generate unique contract number
        import random
        import string
        timestamp = datetime.now().strftime("%y%m%d") 
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        contract_number = f"SCL{timestamp}{random_part}"
        
        # Check if similar contract exists
        existing = await db.contracts.find_one({
            "store_id": store_id,
            "customer_id": customer_ids[contract_data["customer_idx"]],
            "item.brand": contract_data["item"]["brand"],
            "item.model": contract_data["item"]["model"]
        })
        
        if not existing:
            start_date = date.today() - timedelta(days=contract_data["start_days_ago"])
            due_date = start_date + timedelta(days=contract_data["pawn_details"]["period_days"])
            
            contract_doc = {
                "_id": ObjectId(),
                "contract_number": contract_number,
                "store_id": store_id,
                "customer_id": customer_ids[contract_data["customer_idx"]],
                "item": {
                    **contract_data["item"],
                    "serial_no": f"SN{random.randint(100000, 999999)}",
                    "accessories": "Standard accessories",
                    "note": "Demo contract",
                    "images_urls": []
                },
                "pawn_details": contract_data["pawn_details"],
                "dates": {
                    "start_date": datetime.combine(start_date, datetime.min.time()),
                    "due_date": datetime.combine(due_date, datetime.min.time())
                },
                "status": contract_data["status"],
                "remarks": "Demo contract for testing",
                "transaction_history": [],
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            await db.contracts.insert_one(contract_doc)
    
    contract_count = await db.contracts.count_documents({"store_id": store_id})
    print(f"✅ Demo contracts ready: {contract_count}")

async def show_summary(db):
    """Show database summary"""
    print("\n📊 Database Summary:")
    print("-" * 40)
    
    collections = ["users", "stores", "customers", "contracts", "brands"]
    for collection_name in collections:
        count = await db[collection_name].count_documents({})
        print(f"📄 {collection_name:12} : {count:3} documents")
    
    print("\n✅ Demo Login Credentials:")
    print("   Email: demo@pawn360.com")
    print("   Password: demo123")

async def main():
    """Main function"""
    print("🚀 Pawn360 Database Setup (Clean Version)")
    print("=" * 50)
    
    try:
        # Connect to database
        client, db = await connect_to_database()
        
        # Create indexes
        await create_basic_indexes(db)
        
        # Insert brand data
        await insert_brands(db)
        
        # Create demo data
        await create_demo_data(db)
        
        # Show summary
        await show_summary(db)
        
        print("\n🎉 Database setup completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'client' in locals():
            client.close()
            print("\n🔐 Database connection closed")

if __name__ == "__main__":
    asyncio.run(main())