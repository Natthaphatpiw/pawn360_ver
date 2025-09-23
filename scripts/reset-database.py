#!/usr/bin/env python3
"""
Database Reset Script for Pawn360
This script safely resets the database by dropping collections and recreating them
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# Database configuration
MONGODB_URI = "mongodb+srv://natthapiw_db_user:afOJe2MrgMDsmm6k@cluster0.skadipr.mongodb.net/pawn360?retryWrites=true&w=majority&appName=Cluster0"
DATABASE_NAME = "pawn360"

async def reset_database():
    """Reset the database by dropping all collections"""
    print("⚠️  WARNING: This will delete ALL data in the Pawn360 database!")
    print("🗄️  Database: " + DATABASE_NAME)
    print("🔗 URI: " + MONGODB_URI.split('@')[1].split('/')[0])  # Hide credentials
    
    # Ask for confirmation
    confirmation = input("\nDo you want to continue? Type 'YES' to confirm: ")
    
    if confirmation != "YES":
        print("❌ Reset cancelled")
        return
    
    try:
        # Connect to MongoDB
        print("\n🔄 Connecting to MongoDB Atlas...")
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas")
        
        # Get all collections
        collections = await db.list_collection_names()
        
        if not collections:
            print("ℹ️  No collections found, database is already empty")
            return
        
        print(f"\n🗑️  Found {len(collections)} collections to drop:")
        for collection in collections:
            count = await db[collection].count_documents({})
            print(f"   - {collection}: {count} documents")
        
        # Ask for final confirmation
        final_confirmation = input(f"\nThis will delete {len(collections)} collections. Type 'DELETE' to confirm: ")
        
        if final_confirmation != "DELETE":
            print("❌ Reset cancelled")
            return
        
        # Drop all collections
        print("\n🔄 Dropping collections...")
        for collection_name in collections:
            await db[collection_name].drop()
            print(f"✅ Dropped collection: {collection_name}")
        
        print(f"\n🎉 Successfully reset database '{DATABASE_NAME}'")
        print("💡 Run 'python3 init-database.py' to recreate the database with initial data")
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        raise e
    finally:
        if 'client' in locals():
            client.close()
            print("🔐 Database connection closed")

async def backup_database():
    """Create a backup of important data before reset"""
    print("💾 Creating backup of important data...")
    
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        
        # Backup stores and users
        stores = await db.stores.find({}).to_list(length=None)
        users = await db.users.find({}).to_list(length=None)
        
        if stores or users:
            import json
            from datetime import datetime
            
            backup_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "stores": stores,
                "users": users
            }
            
            filename = f"pawn360_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            # Convert ObjectId to string for JSON serialization
            def convert_objectid(obj):
                if hasattr(obj, '__iter__') and not isinstance(obj, (str, bytes)):
                    if isinstance(obj, dict):
                        return {k: convert_objectid(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [convert_objectid(v) for v in obj]
                    else:
                        return obj
                elif hasattr(obj, 'isoformat'):  # datetime
                    return obj.isoformat()
                elif hasattr(obj, '__str__') and 'ObjectId' in str(type(obj)):
                    return str(obj)
                else:
                    return obj
            
            backup_data = convert_objectid(backup_data)
            
            with open(filename, 'w') as f:
                json.dump(backup_data, f, indent=2, default=str)
            
            print(f"✅ Backup saved to: {filename}")
            return filename
        else:
            print("ℹ️  No data to backup")
            return None
            
    except Exception as e:
        print(f"⚠️  Backup failed: {e}")
        return None
    finally:
        if 'client' in locals():
            client.close()

async def main():
    """Main reset function"""
    print("🔄 Pawn360 Database Reset Tool")
    print("=" * 40)
    
    # Ask if user wants to create a backup
    backup_choice = input("Do you want to create a backup before reset? (y/N): ")
    
    if backup_choice.lower() in ['y', 'yes']:
        backup_file = await backup_database()
        if backup_file:
            print(f"💾 Backup created: {backup_file}")
        print()
    
    # Proceed with reset
    await reset_database()

if __name__ == "__main__":
    asyncio.run(main())