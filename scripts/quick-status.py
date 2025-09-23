#!/usr/bin/env python3
"""
Quick Status Check for Pawn360 Database
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = "mongodb+srv://natthapiw_db_user:afOJe2MrgMDsmm6k@cluster0.skadipr.mongodb.net/pawn360?retryWrites=true&w=majority&appName=Cluster0"

async def quick_status():
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client["pawn360"]
        
        # Test connection
        await client.admin.command('ping')
        
        # Get basic counts
        users = await db.users.count_documents({})
        stores = await db.stores.count_documents({})
        customers = await db.customers.count_documents({})
        contracts = await db.contracts.count_documents({})
        brands = await db.brands.count_documents({})
        
        print("🟢 Database Status: ONLINE")
        print(f"📊 Data: {users} users, {stores} stores, {customers} customers, {contracts} contracts, {brands} brands")
        
        # Check demo login
        demo_user = await db.users.find_one({"email": "demo@pawn360.com"})
        if demo_user:
            print("✅ Demo login ready: demo@pawn360.com / demo123")
        else:
            print("❌ Demo login not found")
            
        client.close()
        return True
        
    except Exception as e:
        print(f"🔴 Database Status: OFFLINE - {e}")
        return False

if __name__ == "__main__":
    asyncio.run(quick_status())