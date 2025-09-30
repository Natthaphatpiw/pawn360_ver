# Database connection and setup for MongoDB
# This file handles the MongoDB connection and database operations

import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from typing import Optional
import asyncio
from models import COLLECTIONS, INDEXES


class Database:
    """Database connection manager"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None
        self.database_name = "pawn"
        
    async def connect_to_database(self, path: str = None):
        """Create database connection"""
        if path is None:
            path = os.getenv("MONGODB_URI", "mongodb://localhost:27017/pawn360")
            
        self.client = AsyncIOMotorClient(path)
        self.database = self.client[self.database_name]
        
        # Test connection
        try:
            await self.client.admin.command('ping')
            print("Connected to MongoDB successfully")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise e
            
    async def close_database_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("Database connection closed")
            
    async def create_indexes(self):
        """Create database indexes for better performance"""
        for collection_name, indexes in INDEXES.items():
            collection = self.database[collection_name]
            for index_spec in indexes:
                try:
                    if len(index_spec) == 2:
                        # Index with options
                        await collection.create_index(index_spec[0], **index_spec[1])
                    else:
                        # Simple index
                        await collection.create_index(index_spec[0])
                    print(f"Created index for {collection_name}: {index_spec[0]}")
                except Exception as e:
                    print(f"Error creating index for {collection_name}: {e}")


# Global database instance
database = Database()


# Database connection functions
async def get_database():
    """Get database instance"""
    return database.database


async def connect_to_mongo():
    """Connect to MongoDB"""
    await database.connect_to_database()
    await database.create_indexes()


async def close_mongo_connection():
    """Close MongoDB connection"""
    await database.close_database_connection()


# Collection getters
async def get_users_collection():
    """Get users collection"""
    db = await get_database()
    return db[COLLECTIONS["users"]]


async def get_stores_collection():
    """Get stores collection"""
    db = await get_database()
    return db[COLLECTIONS["stores"]]


async def get_customers_collection():
    """Get customers collection"""
    db = await get_database()
    return db[COLLECTIONS["customers"]]


async def get_contracts_collection():
    """Get contracts collection"""
    db = await get_database()
    return db[COLLECTIONS["contracts"]]


async def get_brands_collection():
    """Get brands collection"""
    db = await get_database()
    return db[COLLECTIONS["brands"]]


async def get_audit_logs_collection():
    """Get audit logs collection"""
    db = await get_database()
    return db[COLLECTIONS["audit_logs"]]


# Database operations helpers
class DatabaseOperations:
    """Helper class for common database operations"""
    
    @staticmethod
    async def insert_one(collection_name: str, document: dict):
        """Insert a single document"""
        db = await get_database()
        collection = db[collection_name]
        result = await collection.insert_one(document)
        return result.inserted_id
    
    @staticmethod
    async def insert_many(collection_name: str, documents: list):
        """Insert multiple documents"""
        db = await get_database()
        collection = db[collection_name]
        result = await collection.insert_many(documents)
        return result.inserted_ids
    
    @staticmethod
    async def find_one(collection_name: str, filter_dict: dict, projection: dict = None):
        """Find a single document"""
        db = await get_database()
        collection = db[collection_name]
        return await collection.find_one(filter_dict, projection)
    
    @staticmethod
    async def find_many(collection_name: str, filter_dict: dict = None, 
                       projection: dict = None, sort: list = None, 
                       limit: int = None, skip: int = None):
        """Find multiple documents"""
        db = await get_database()
        collection = db[collection_name]
        
        cursor = collection.find(filter_dict or {}, projection)
        
        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
            
        return await cursor.to_list(length=limit)
    
    @staticmethod
    async def update_one(collection_name: str, filter_dict: dict, update_dict: dict):
        """Update a single document"""
        db = await get_database()
        collection = db[collection_name]
        result = await collection.update_one(filter_dict, update_dict)
        return result.modified_count
    
    @staticmethod
    async def update_many(collection_name: str, filter_dict: dict, update_dict: dict):
        """Update multiple documents"""
        db = await get_database()
        collection = db[collection_name]
        result = await collection.update_many(filter_dict, update_dict)
        return result.modified_count
    
    @staticmethod
    async def delete_one(collection_name: str, filter_dict: dict):
        """Delete a single document"""
        db = await get_database()
        collection = db[collection_name]
        result = await collection.delete_one(filter_dict)
        return result.deleted_count
    
    @staticmethod
    async def delete_many(collection_name: str, filter_dict: dict):
        """Delete multiple documents"""
        db = await get_database()
        collection = db[collection_name]
        result = await collection.delete_many(filter_dict)
        return result.deleted_count
    
    @staticmethod
    async def count_documents(collection_name: str, filter_dict: dict = None):
        """Count documents"""
        db = await get_database()
        collection = db[collection_name]
        return await collection.count_documents(filter_dict or {})
    
    @staticmethod
    async def aggregate(collection_name: str, pipeline: list):
        """Run aggregation pipeline"""
        db = await get_database()
        collection = db[collection_name]
        cursor = collection.aggregate(pipeline)
        return await cursor.to_list(length=None)


# Specific database operations for the application
class UserOperations:
    """User-specific database operations"""
    
    @staticmethod
    async def create_user(user_data: dict):
        """Create a new user"""
        return await DatabaseOperations.insert_one(COLLECTIONS["users"], user_data)
    
    @staticmethod
    async def get_user_by_email(email: str):
        """Get user by email"""
        return await DatabaseOperations.find_one(
            COLLECTIONS["users"], 
            {"email": email}
        )
    
    @staticmethod
    async def get_user_by_id(user_id: str):
        """Get user by ID"""
        from bson import ObjectId
        return await DatabaseOperations.find_one(
            COLLECTIONS["users"], 
            {"_id": ObjectId(user_id)}
        )


class StoreOperations:
    """Store-specific database operations"""
    
    @staticmethod
    async def create_store(store_data: dict):
        """Create a new store"""
        return await DatabaseOperations.insert_one(COLLECTIONS["stores"], store_data)
    
    @staticmethod
    async def get_store_by_id(store_id: str):
        """Get store by ID"""
        from bson import ObjectId
        return await DatabaseOperations.find_one(
            COLLECTIONS["stores"], 
            {"_id": ObjectId(store_id)}
        )
    
    @staticmethod
    async def update_store(store_id: str, update_data: dict):
        """Update store"""
        from bson import ObjectId
        from datetime import datetime
        
        update_data["updated_at"] = datetime.utcnow()
        return await DatabaseOperations.update_one(
            COLLECTIONS["stores"],
            {"_id": ObjectId(store_id)},
            {"$set": update_data}
        )


class CustomerOperations:
    """Customer-specific database operations"""
    
    @staticmethod
    async def create_customer(customer_data: dict):
        """Create a new customer"""
        return await DatabaseOperations.insert_one(COLLECTIONS["customers"], customer_data)
    
    @staticmethod
    async def search_customers(store_id: str, query: str):
        """Search customers by phone or ID number"""
        from bson import ObjectId
        
        filter_dict = {
            "store_id": ObjectId(store_id),
            "$or": [
                {"phone_number": {"$regex": query, "$options": "i"}},
                {"id_number": {"$regex": query, "$options": "i"}},
                {"full_name": {"$regex": query, "$options": "i"}}
            ]
        }
        
        return await DatabaseOperations.find_many(COLLECTIONS["customers"], filter_dict)
    
    @staticmethod
    async def get_customer_by_id(customer_id: str):
        """Get customer by ID"""
        from bson import ObjectId
        return await DatabaseOperations.find_one(
            COLLECTIONS["customers"], 
            {"_id": ObjectId(customer_id)}
        )


class ContractOperations:
    """Contract-specific database operations"""
    
    @staticmethod
    async def create_contract(contract_data: dict):
        """Create a new contract"""
        return await DatabaseOperations.insert_one(COLLECTIONS["contracts"], contract_data)
    
    @staticmethod
    async def get_contracts(store_id: str, filters: dict = None, 
                           sort: list = None, limit: int = None, skip: int = None):
        """Get contracts with filters"""
        from bson import ObjectId
        
        filter_dict = {"store_id": ObjectId(store_id)}
        
        if filters:
            if filters.get("status"):
                filter_dict["status"] = filters["status"]
            if filters.get("search"):
                search_query = filters["search"]
                filter_dict["$or"] = [
                    {"contract_number": {"$regex": search_query, "$options": "i"}},
                    {"item.brand": {"$regex": search_query, "$options": "i"}},
                    {"item.model": {"$regex": search_query, "$options": "i"}}
                ]
        
        return await DatabaseOperations.find_many(
            COLLECTIONS["contracts"], 
            filter_dict,
            sort=sort,
            limit=limit,
            skip=skip
        )
    
    @staticmethod
    async def get_contract_by_id(contract_id: str):
        """Get contract by ID"""
        from bson import ObjectId
        return await DatabaseOperations.find_one(
            COLLECTIONS["contracts"], 
            {"_id": ObjectId(contract_id)}
        )
    
    @staticmethod
    async def update_contract(contract_id: str, update_data: dict):
        """Update contract"""
        from bson import ObjectId
        from datetime import datetime
        
        update_data["updated_at"] = datetime.utcnow()
        return await DatabaseOperations.update_one(
            COLLECTIONS["contracts"],
            {"_id": ObjectId(contract_id)},
            {"$set": update_data}
        )
    
    @staticmethod
    async def add_transaction(contract_id: str, transaction: dict):
        """Add transaction to contract history"""
        from bson import ObjectId
        from datetime import datetime
        
        return await DatabaseOperations.update_one(
            COLLECTIONS["contracts"],
            {"_id": ObjectId(contract_id)},
            {
                "$push": {"transaction_history": transaction},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )


# Dashboard aggregation queries
class DashboardOperations:
    """Dashboard-specific database operations"""
    
    @staticmethod
    async def get_dashboard_stats(store_id: str):
        """Get dashboard statistics"""
        from bson import ObjectId
        from datetime import datetime, timedelta
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Aggregation pipeline for dashboard stats
        pipeline = [
            {"$match": {"store_id": ObjectId(store_id)}},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "total_value": {"$sum": "$pawn_details.pawned_price"}
                }
            }
        ]
        
        contract_stats = await DatabaseOperations.aggregate(COLLECTIONS["contracts"], pipeline)
        
        # Count customers
        customer_count = await DatabaseOperations.count_documents(
            COLLECTIONS["customers"], 
            {"store_id": ObjectId(store_id)}
        )
        
        # Calculate today's value (contracts created today)
        today_pipeline = [
            {
                "$match": {
                    "store_id": ObjectId(store_id),
                    "created_at": {"$gte": today}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "today_value": {"$sum": "$pawn_details.pawned_price"}
                }
            }
        ]
        
        today_stats = await DatabaseOperations.aggregate(COLLECTIONS["contracts"], today_pipeline)
        today_value = today_stats[0]["today_value"] if today_stats else 0
        
        return {
            "contract_stats": contract_stats,
            "customer_count": customer_count,
            "today_value": today_value
        }
    
    @staticmethod
    async def get_item_categories(store_id: str):
        """Get item categories distribution"""
        from bson import ObjectId
        
        pipeline = [
            {"$match": {"store_id": ObjectId(store_id)}},
            {
                "$group": {
                    "_id": "$item.type",
                    "count": {"$sum": 1},
                    "value": {"$sum": "$pawn_details.pawned_price"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        return await DatabaseOperations.aggregate(COLLECTIONS["contracts"], pipeline)


# Setup script for initial data
async def setup_initial_data():
    """Setup initial data for development"""
    
    # Create sample brands
    brands = [
        "Apple", "Samsung", "Sony", "Canon", "Nike", "Rolex", "Tiffany & Co.",
        "Louis Vuitton", "Chanel", "Gucci", "Prada", "Hermès", "Cartier"
    ]
    
    brands_collection = await get_brands_collection()
    
    for brand in brands:
        await brands_collection.update_one(
            {"name": brand},
            {"$set": {"name": brand, "created_at": datetime.utcnow()}},
            upsert=True
        )
    
    print("Initial data setup completed")


# Testing function
async def test_database_connection():
    """Test database connection and operations"""
    try:
        await connect_to_mongo()
        
        # Test basic operations
        db = await get_database()
        test_collection = db["test"]
        
        # Insert test document
        result = await test_collection.insert_one({"test": "data"})
        print(f"Test document inserted with ID: {result.inserted_id}")
        
        # Find test document
        document = await test_collection.find_one({"_id": result.inserted_id})
        print(f"Test document found: {document}")
        
        # Delete test document
        await test_collection.delete_one({"_id": result.inserted_id})
        print("Test document deleted")
        
        print("Database connection test successful")
        
    except Exception as e:
        print(f"Database connection test failed: {e}")
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    # Run database connection test
    asyncio.run(test_database_connection())