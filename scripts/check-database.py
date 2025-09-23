#!/usr/bin/env python3
"""
Database Check Script for Pawn360
This script checks the database status, collections, and data integrity
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Database configuration
MONGODB_URI = "mongodb+srv://natthapiw_db_user:afOJe2MrgMDsmm6k@cluster0.skadipr.mongodb.net/pawn360?retryWrites=true&w=majority&appName=Cluster0"
DATABASE_NAME = "pawn360"

async def check_connection():
    """Check database connection"""
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        await client.admin.command('ping')
        print("✅ Database connection: OK")
        return client
    except Exception as e:
        print(f"❌ Database connection: FAILED - {e}")
        return None

async def check_collections(db):
    """Check collections and their status"""
    print("\n📊 Collections Status:")
    print("-" * 50)
    
    collections = await db.list_collection_names()
    
    if not collections:
        print("❌ No collections found")
        return
    
    total_documents = 0
    
    for collection_name in sorted(collections):
        collection = db[collection_name]
        count = await collection.count_documents({})
        total_documents += count
        
        # Get sample document to check structure
        sample = await collection.find_one({})
        has_sample = "✅" if sample else "⚠️"
        
        print(f"{has_sample} {collection_name:15} | {count:6} documents")
    
    print("-" * 50)
    print(f"Total: {len(collections)} collections, {total_documents} documents")

async def check_indexes(db):
    """Check database indexes"""
    print("\n🔍 Indexes Status:")
    print("-" * 50)
    
    collections = await db.list_collection_names()
    
    for collection_name in sorted(collections):
        collection = db[collection_name]
        indexes = await collection.list_indexes().to_list(length=None)
        
        index_count = len(indexes)
        status = "✅" if index_count > 1 else "⚠️"  # More than just _id index
        
        print(f"{status} {collection_name:15} | {index_count:2} indexes")
        
        # Show index details
        for index in indexes:
            index_name = index.get('name', 'unknown')
            if index_name != '_id_':  # Skip default _id index
                keys = list(index.get('key', {}).keys())
                print(f"    - {index_name}: {', '.join(keys)}")

async def check_data_integrity(db):
    """Check data integrity and relationships"""
    print("\n🔗 Data Integrity Check:")
    print("-" * 50)
    
    # Check stores
    stores_count = await db.stores.count_documents({})
    if stores_count > 0:
        print(f"✅ Stores: {stores_count} found")
        
        # Check users for each store
        stores = await db.stores.find({}).to_list(length=None)
        for store in stores:
            store_id = store['_id']
            users_count = await db.users.count_documents({"store_id": store_id})
            customers_count = await db.customers.count_documents({"store_id": store_id})
            contracts_count = await db.contracts.count_documents({"store_id": store_id})
            
            print(f"   📍 {store['store_name'][:20]:<20} | Users: {users_count}, Customers: {customers_count}, Contracts: {contracts_count}")
    else:
        print("❌ No stores found")
    
    # Check orphaned records
    print("\n🔍 Orphaned Records Check:")
    
    # Check users without stores
    users = await db.users.find({}).to_list(length=None)
    orphaned_users = 0
    for user in users:
        store_exists = await db.stores.find_one({"_id": user.get("store_id")})
        if not store_exists:
            orphaned_users += 1
    
    if orphaned_users > 0:
        print(f"⚠️  Found {orphaned_users} users without valid store")
    else:
        print("✅ All users have valid store references")
    
    # Check contracts without customers
    contracts = await db.contracts.find({}).to_list(length=None)
    orphaned_contracts = 0
    for contract in contracts:
        customer_exists = await db.customers.find_one({"_id": contract.get("customer_id")})
        if not customer_exists:
            orphaned_contracts += 1
    
    if orphaned_contracts > 0:
        print(f"⚠️  Found {orphaned_contracts} contracts without valid customer")
    else:
        print("✅ All contracts have valid customer references")

async def check_demo_data(db):
    """Check if demo data exists"""
    print("\n🎭 Demo Data Status:")
    print("-" * 50)
    
    # Check demo user
    demo_user = await db.users.find_one({"email": "demo@pawn360.com"})
    if demo_user:
        print("✅ Demo user found (demo@pawn360.com)")
        
        # Check demo store
        demo_store = await db.stores.find_one({"_id": demo_user["store_id"]})
        if demo_store:
            print(f"✅ Demo store found ({demo_store['store_name']})")
            
            # Check demo data counts
            store_id = demo_store["_id"]
            customers_count = await db.customers.count_documents({"store_id": store_id})
            contracts_count = await db.contracts.count_documents({"store_id": store_id})
            
            print(f"   - Demo customers: {customers_count}")
            print(f"   - Demo contracts: {contracts_count}")
        else:
            print("❌ Demo store not found")
    else:
        print("❌ Demo user not found")
        print("💡 Run 'python3 init-database.py' to create demo data")

async def check_recent_activity(db):
    """Check recent activity in the database"""
    print("\n⏰ Recent Activity (Last 7 days):")
    print("-" * 50)
    
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Check recent contracts
    recent_contracts = await db.contracts.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    # Check recent customers
    recent_customers = await db.customers.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    # Check recent transactions (in contracts)
    contracts_with_recent_transactions = await db.contracts.count_documents({
        "transaction_history.date": {"$gte": week_ago}
    })
    
    print(f"📄 New contracts: {recent_contracts}")
    print(f"👥 New customers: {recent_customers}")
    print(f"💰 Contracts with transactions: {contracts_with_recent_transactions}")
    
    if recent_contracts == 0 and recent_customers == 0:
        print("ℹ️  No recent activity found")

async def show_system_info():
    """Show system information"""
    print("🔧 System Information:")
    print("-" * 50)
    print(f"Database: {DATABASE_NAME}")
    print(f"MongoDB Atlas: {MONGODB_URI.split('@')[1].split('/')[0]}")
    print(f"Check Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")

async def main():
    """Main check function"""
    print("🔍 Pawn360 Database Health Check")
    print("=" * 50)
    
    # Show system info
    await show_system_info()
    print()
    
    # Check connection
    client = await check_connection()
    if not client:
        return
    
    try:
        db = client[DATABASE_NAME]
        
        # Run all checks
        await check_collections(db)
        await check_indexes(db)
        await check_data_integrity(db)
        await check_demo_data(db)
        await check_recent_activity(db)
        
        print("\n" + "=" * 50)
        print("✅ Database health check completed")
        
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    finally:
        client.close()
        print("🔐 Database connection closed")

if __name__ == "__main__":
    asyncio.run(main())