import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = "pawn"

async def check_database():
    client = AsyncIOMotorClient(MONGODB_URI)
    database = client[DATABASE_NAME]

    print("=== DATABASE INSPECTION ===")
    print(f"Database: {DATABASE_NAME}")

    # Check users
    print("\n=== USERS ===")
    users = await database.users.find().to_list(100)
    for user in users:
        print(f"User: {user.get('email')} - ID: {user.get('_id')} - Role: {user.get('role')}")

    # Check stores
    print("\n=== STORES ===")
    stores = await database.stores.find().to_list(100)
    for store in stores:
        print(f"Store: {store.get('storeName')} - ID: {store.get('_id')} - Owner: {store.get('ownerId')}")

    # Find test@pawnshop.com user
    test_user = await database.users.find_one({"email": "test@pawnshop.com"})
    if test_user:
        print(f"\n=== TEST@PAWNSHOP.COM USER DETAILS ===")
        print(f"User ID: {test_user['_id']}")
        print(f"Email: {test_user['email']}")
        print(f"Role: {test_user.get('role')}")

        # Find stores owned by this user
        test_user_stores = await database.stores.find({"ownerId": test_user["_id"]}).to_list(100)
        print(f"\n=== STORES OWNED BY test@pawnshop.com ===")
        for store in test_user_stores:
            print(f"Store Name: {store.get('storeName')} - Store ID: {store['_id']}")

            # Find contracts for each store
            store_contracts = await database.contracts.find({"storeId": store["_id"]}).to_list(100)
            print(f"  Contracts in this store: {len(store_contracts)}")
            for contract in store_contracts[:5]:  # Show first 5 contracts
                print(f"    Contract: {contract.get('contractNumber')} - Status: {contract.get('status')} - Value: {contract.get('pawnDetails', {}).get('pawnedPrice')}")

    # Check total contracts
    print(f"\n=== TOTAL CONTRACTS IN DATABASE ===")
    total_contracts = await database.contracts.count_documents({})
    print(f"Total contracts: {total_contracts}")

    # Check contracts by storeId
    print(f"\n=== CONTRACTS BY STORE ===")
    async for store in database.stores.find():
        store_contract_count = await database.contracts.count_documents({"storeId": store["_id"]})
        print(f"Store {store.get('storeName')} (ID: {store['_id']}): {store_contract_count} contracts")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_database())