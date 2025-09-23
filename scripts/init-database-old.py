#!/usr/bin/env python3
"""
Database Initialization Script for Pawn360
This script creates the database, collections, indexes, and initial data
"""

import asyncio
import os
from datetime import datetime, date, timedelta
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from bson import ObjectId

# Database configuration
MONGODB_URI = "mongodb+srv://natthapiw_db_user:afOJe2MrgMDsmm6k@cluster0.skadipr.mongodb.net/pawn360?retryWrites=true&w=majority&appName=Cluster0"
DATABASE_NAME = "pawn360"

# Collections to create
COLLECTIONS = {
    "users": "users",
    "stores": "stores",
    "customers": "customers", 
    "contracts": "contracts",
    "brands": "brands",
    "audit_logs": "audit_logs",
    "sessions": "sessions",
    "notifications": "notifications"
}

# Indexes for performance optimization
INDEXES = {
    "users": [
        [("email", 1), {"unique": True}],
        [("store_id", 1)],
        [("role", 1)],
        [("created_at", -1)]
    ],
    "stores": [
        [("store_name", 1)],
        [("phone", 1)],
        [("created_at", -1)],
        [("store_name", "text"), {"default_language": "english"}]
    ],
    "customers": [
        [("store_id", 1)],
        [("phone_number", 1)],
        [("id_number", 1)],
        [("store_id", 1), ("phone_number", 1)],
        [("store_id", 1), ("id_number", 1)],
        [("full_name", "text", "phone_number", "text"), {"default_language": "english"}],
        [("created_at", -1)]
    ],
    "contracts": [
        [("store_id", 1)],
        [("customer_id", 1)],
        [("contract_number", 1), {"unique": True}],
        [("status", 1)],
        [("dates.due_date", 1)],
        [("dates.start_date", 1)],
        [("store_id", 1), ("status", 1)],
        [("store_id", 1), ("dates.due_date", 1)],
        [("store_id", 1), ("dates.start_date", -1)],
        [("contract_number", "text", "item.brand", "text", "item.model", "text"), {"default_language": "english"}],
        [("created_at", -1)],
        [("updated_at", -1)]
    ],
    "brands": [
        [("name", 1), {"unique": True}],
        [("category", 1)],
        [("name", "text"), {"default_language": "english"}]
    ],
    "audit_logs": [
        [("store_id", 1)],
        [("user_id", 1)],
        [("action", 1)],
        [("timestamp", -1)],
        [("store_id", 1), ("timestamp", -1)]
    ],
    "sessions": [
        [("user_id", 1)],
        [("token", 1), {"unique": True}],
        [("expires_at", 1), {"expireAfterSeconds": 0}]
    ],
    "notifications": [
        [("store_id", 1)],
        [("user_id", 1)],
        [("read", 1)],
        [("created_at", -1)],
        [("store_id", 1), ("read", 1), ("created_at", -1)]
    ]
}

# Initial brands data
INITIAL_BRANDS = [
    {"name": "Apple", "category": "Electronics"},
    {"name": "Samsung", "category": "Electronics"},
    {"name": "Sony", "category": "Electronics"},
    {"name": "Canon", "category": "Electronics"},
    {"name": "Nikon", "category": "Electronics"},
    {"name": "Nintendo", "category": "Electronics"},
    {"name": "PlayStation", "category": "Electronics"},
    {"name": "Xbox", "category": "Electronics"},
    {"name": "iPhone", "category": "Electronics"},
    {"name": "iPad", "category": "Electronics"},
    
    {"name": "Rolex", "category": "Watches"},
    {"name": "Omega", "category": "Watches"},
    {"name": "Casio", "category": "Watches"},
    {"name": "Seiko", "category": "Watches"},
    {"name": "Citizen", "category": "Watches"},
    {"name": "TAG Heuer", "category": "Watches"},
    {"name": "Breitling", "category": "Watches"},
    
    {"name": "Tiffany & Co.", "category": "Jewelry"},
    {"name": "Cartier", "category": "Jewelry"},
    {"name": "Pandora", "category": "Jewelry"},
    {"name": "Swarovski", "category": "Jewelry"},
    {"name": "Bulgari", "category": "Jewelry"},
    {"name": "Van Cleef & Arpels", "category": "Jewelry"},
    
    {"name": "Louis Vuitton", "category": "Bags"},
    {"name": "Chanel", "category": "Bags"},
    {"name": "Gucci", "category": "Bags"},
    {"name": "Prada", "category": "Bags"},
    {"name": "Hermès", "category": "Bags"},
    {"name": "Coach", "category": "Bags"},
    {"name": "Michael Kors", "category": "Bags"},
    
    {"name": "Nike", "category": "Shoes"},
    {"name": "Adidas", "category": "Shoes"},
    {"name": "Jordan", "category": "Shoes"},
    {"name": "Converse", "category": "Shoes"},
    {"name": "Vans", "category": "Shoes"},
    
    {"name": "Yamaha", "category": "Musical Instruments"},
    {"name": "Fender", "category": "Musical Instruments"},
    {"name": "Gibson", "category": "Musical Instruments"},
    {"name": "Roland", "category": "Musical Instruments"},
    
    {"name": "Generic", "category": "Other"},
    {"name": "Unknown", "category": "Other"}
]

async def create_database_and_collections():
    """Create database and collections"""
    print("🔄 Connecting to MongoDB Atlas...")
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully")
        
        # Create collections
        print("🔄 Creating collections...")
        existing_collections = await db.list_collection_names()
        
        for collection_name in COLLECTIONS.values():
            if collection_name not in existing_collections:
                await db.create_collection(collection_name)
                print(f"✅ Created collection: {collection_name}")
            else:
                print(f"⚠️  Collection already exists: {collection_name}")
        
        return client, db
        
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        raise e

async def create_indexes(db):
    """Create database indexes for performance"""
    print("🔄 Creating database indexes...")
    
    for collection_name, indexes in INDEXES.items():
        collection = db[collection_name]
        
        for index_spec in indexes:
            try:
                if len(index_spec) == 2 and isinstance(index_spec[1], dict):
                    # Index with options
                    await collection.create_index(index_spec[0], **index_spec[1])
                    print(f"✅ Created index for {collection_name}: {index_spec[0]} with options {index_spec[1]}")
                else:
                    # Simple index
                    await collection.create_index(index_spec[0])
                    print(f"✅ Created index for {collection_name}: {index_spec[0]}")
                    
            except Exception as e:
                print(f"⚠️  Error creating index for {collection_name}: {e}")

async def insert_initial_brands(db):
    """Insert initial brand data"""
    print("🔄 Inserting initial brand data...")
    
    brands_collection = db[COLLECTIONS["brands"]]
    
    # Check if brands already exist
    existing_count = await brands_collection.count_documents({})
    
    if existing_count > 0:
        print(f"⚠️  Brands already exist ({existing_count} brands), skipping initial data insertion")
        return
    
    # Insert brands
    brands_to_insert = []
    for brand in INITIAL_BRANDS:
        brands_to_insert.append({
            "_id": ObjectId(),
            "name": brand["name"],
            "category": brand["category"],
            "created_at": datetime.utcnow(),
            "is_active": True
        })
    
    result = await brands_collection.insert_many(brands_to_insert)
    print(f"✅ Inserted {len(result.inserted_ids)} brands")

async def create_demo_store_and_user(db):
    """Create demo store and user for testing"""
    print("🔄 Creating demo store and user...")
    
    stores_collection = db[COLLECTIONS["stores"]]
    users_collection = db[COLLECTIONS["users"]]
    
    # Check if demo data already exists
    existing_store = await stores_collection.find_one({"store_name": "Demo Pawn Shop"})
    if existing_store:
        print("⚠️  Demo store already exists, skipping demo data creation")
        return existing_store["_id"]
    
    # Create demo store
    store_id = ObjectId()
    demo_store = {
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
        "logo_url": None,
        "stamp_url": None,
        "signature_url": None,
        "interest_presets": [
            {"days": 7, "rate": 4.0},
            {"days": 15, "rate": 3.5},
            {"days": 30, "rate": 3.0},
            {"days": 60, "rate": 2.5},
            {"days": 90, "rate": 2.0}
        ],
        "created_at": datetime.utcnow()
    }
    
    await stores_collection.insert_one(demo_store)
    print("✅ Created demo store")
    
    # Create demo user
    password = "demo123"
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    demo_user = {
        "_id": ObjectId(),
        "store_id": store_id,
        "full_name": "Demo Admin",
        "email": "demo@pawn360.com",
        "password_hash": password_hash,
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    
    await users_collection.insert_one(demo_user)
    print("✅ Created demo user (email: demo@pawn360.com, password: demo123)")
    
    return store_id

async def create_demo_customers(db, store_id):
    """Create demo customers"""
    print("🔄 Creating demo customers...")
    
    customers_collection = db[COLLECTIONS["customers"]]
    
    # Check if demo customers already exist
    existing_count = await customers_collection.count_documents({"store_id": store_id})
    if existing_count > 0:
        print(f"⚠️  Demo customers already exist ({existing_count} customers), skipping")
        return []
    
    demo_customers = [
        {
            "_id": ObjectId(),
            "store_id": store_id,
            "full_name": "John Smith",
            "phone_number": "0812345678",
            "id_number": "1234567890123",
            "address": {
                "street": "456 Customer Street",
                "sub_district": "Huai Khwang",
                "district": "Huai Khwang",
                "province": "Bangkok",
                "postcode": "10310"
            },
            "created_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "store_id": store_id,
            "full_name": "Mary Johnson",
            "phone_number": "0987654321",
            "id_number": "9876543210987",
            "address": {
                "street": "789 Test Avenue",
                "sub_district": "Siam",
                "district": "Pathumwan",
                "province": "Bangkok",
                "postcode": "10330"
            },
            "created_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "store_id": store_id,
            "full_name": "David Brown",
            "phone_number": "0856789123",
            "id_number": "5555666677778",
            "address": {
                "street": "321 Sample Road",
                "sub_district": "Silom",
                "district": "Bang Rak",
                "province": "Bangkok",
                "postcode": "10500"
            },
            "created_at": datetime.utcnow()
        }
    ]
    
    result = await customers_collection.insert_many(demo_customers)
    print(f"✅ Created {len(result.inserted_ids)} demo customers")
    
    return demo_customers

async def create_demo_contracts(db, store_id, customers):
    """Create demo contracts"""
    print("🔄 Creating demo contracts...")
    
    contracts_collection = db[COLLECTIONS["contracts"]]
    
    # Check if demo contracts already exist
    existing_count = await contracts_collection.count_documents({"store_id": store_id})
    if existing_count > 0:
        print(f"⚠️  Demo contracts already exist ({existing_count} contracts), skipping")
        return
    
    def generate_contract_number():
        """Generate contract number"""
        import random
        import string
        timestamp = datetime.now().strftime("%y%m%d")
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"SCL{timestamp}{random_part}"
    
    demo_contracts = []
    
    # Contract 1 - Active iPhone
    contract1_start = date.today() - timedelta(days=15)
    contract1_due = contract1_start + timedelta(days=30)
    demo_contracts.append({
        "_id": ObjectId(),
        "contract_number": generate_contract_number(),
        "store_id": store_id,
        "customer_id": customers[0]["_id"],
        "item": {
            "brand": "Apple",
            "model": "iPhone 14 Pro",
            "type": "Smartphone",
            "serial_no": "FQHD34KL9876",
            "accessories": "Charger, Case, Earphones",
            "condition_percent": 85,
            "defects": "Minor scratches on the back",
            "note": "Original box included",
            "images_urls": []
        },
        "pawn_details": {
            "ai_estimated_price": 35000,
            "pawned_price": 25000,
            "interest_rate_percent": 3.0,
            "period_days": 30
        },
        "dates": {
            "start_date": contract1_start,
            "due_date": contract1_due
        },
        "status": "active",
        "remarks": "Customer preferred 30-day term",
        "transaction_history": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    # Contract 2 - Overdue Rolex
    contract2_start = date.today() - timedelta(days=45)
    contract2_due = contract2_start + timedelta(days=30)
    demo_contracts.append({
        "_id": ObjectId(),
        "contract_number": generate_contract_number(),
        "store_id": store_id,
        "customer_id": customers[1]["_id"],
        "item": {
            "brand": "Rolex",
            "model": "Submariner",
            "type": "Watch",
            "serial_no": "ROL123456789",
            "accessories": "Original box, warranty card",
            "condition_percent": 95,
            "defects": "None",
            "note": "Excellent condition, authentic",
            "images_urls": []
        },
        "pawn_details": {
            "ai_estimated_price": 200000,
            "pawned_price": 150000,
            "interest_rate_percent": 2.5,
            "period_days": 30
        },
        "dates": {
            "start_date": contract2_start,
            "due_date": contract2_due
        },
        "status": "overdue",
        "remarks": "High-value item, requires special handling",
        "transaction_history": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    # Contract 3 - Active Camera
    contract3_start = date.today() - timedelta(days=5)
    contract3_due = contract3_start + timedelta(days=60)
    demo_contracts.append({
        "_id": ObjectId(),
        "contract_number": generate_contract_number(),
        "store_id": store_id,
        "customer_id": customers[2]["_id"],
        "item": {
            "brand": "Canon",
            "model": "EOS R5",
            "type": "Camera",
            "serial_no": "CAN987654321",
            "accessories": "Lens, Battery, Charger, Memory card",
            "condition_percent": 90,
            "defects": "Minor wear on grip",
            "note": "Professional camera, well maintained",
            "images_urls": []
        },
        "pawn_details": {
            "ai_estimated_price": 100000,
            "pawned_price": 75000,
            "interest_rate_percent": 3.5,
            "period_days": 60
        },
        "dates": {
            "start_date": contract3_start,
            "due_date": contract3_due
        },
        "status": "active",
        "remarks": "Extended 60-day term requested",
        "transaction_history": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    result = await contracts_collection.insert_many(demo_contracts)
    print(f"✅ Created {len(result.inserted_ids)} demo contracts")

async def verify_database_setup(db):
    """Verify that everything was set up correctly"""
    print("🔄 Verifying database setup...")
    
    # Check collections
    collections = await db.list_collection_names()
    print(f"📊 Collections created: {len(collections)}")
    for collection in sorted(collections):
        count = await db[collection].count_documents({})
        print(f"   - {collection}: {count} documents")
    
    # Check indexes
    print("\n📊 Indexes created:")
    for collection_name in COLLECTIONS.values():
        if collection_name in collections:
            indexes = await db[collection_name].list_indexes().to_list(length=None)
            print(f"   - {collection_name}: {len(indexes)} indexes")
    
    print("\n✅ Database setup verification completed!")

async def main():
    """Main initialization function"""
    print("🚀 Starting Pawn360 Database Initialization")
    print("=" * 50)
    
    try:
        # Connect and create database/collections
        client, db = await create_database_and_collections()
        
        # Create indexes
        await create_indexes(db)
        
        # Insert initial data
        await insert_initial_brands(db)
        
        # Create demo data
        store_id = await create_demo_store_and_user(db)
        customers = await create_demo_customers(db, store_id)
        await create_demo_contracts(db, store_id, customers)
        
        # Verify setup
        await verify_database_setup(db)
        
        print("\n" + "=" * 50)
        print("🎉 Database initialization completed successfully!")
        print("\n📝 Demo Login Credentials:")
        print("   Email: demo@pawn360.com")
        print("   Password: demo123")
        print("\n🔗 MongoDB Atlas Cluster: Connected")
        print("🗄️  Database: pawn360")
        print("📊 Collections: 8 created with indexes")
        print("🏪 Demo Store: Demo Pawn Shop")
        print("👥 Demo Customers: 3 created")
        print("📄 Demo Contracts: 3 created")
        print("🏷️  Brands: 40+ initial brands loaded")
        
    except Exception as e:
        print(f"\n❌ Database initialization failed: {e}")
        raise e
    finally:
        if 'client' in locals():
            client.close()
            print("\n🔐 Database connection closed")

if __name__ == "__main__":
    asyncio.run(main())