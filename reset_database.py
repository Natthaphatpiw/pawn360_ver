import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = "pawn"

async def reset_database():
    client = AsyncIOMotorClient(MONGODB_URI)
    database = client[DATABASE_NAME]

    print("=== UPDATING CONTRACTS WITH USER ID ===")

    # Get all stores and their owners
    stores = await database.stores.find().to_list(100)

    for store in stores:
        store_id = store["_id"]
        owner_id = store["ownerId"]

        print(f"Updating contracts for store {store.get('storeName')} (Owner: {owner_id})")

        # Update all contracts in this store to include userId
        result = await database.contracts.update_many(
            {"storeId": store_id},
            {"$set": {"userId": owner_id}}
        )

        print(f"  Updated {result.modified_count} contracts")

    print("\n=== ADDING MORE TEST CONTRACTS ===")

    # Find test@pawnshop.com user and store
    test_user = await database.users.find_one({"email": "test@pawnshop.com"})
    if test_user:
        test_store = await database.stores.find_one({"ownerId": test_user["_id"]})
        if test_store:
            # Create more test contracts
            for i in range(5):
                # Create a new customer
                customer_doc = {
                    "title": random.choice(["นาย", "นาง", "นางสาว"]),
                    "firstName": f"ลูกค้า",
                    "lastName": f"ทดสอบ{i+16}",
                    "fullName": f"ลูกค้า ทดสอบ{i+16}",
                    "phone": f"098{random.randint(1000000, 9999999)}",
                    "idNumber": f"{random.randint(1000000000000, 9999999999999)}",
                    "address": {
                        "houseNumber": f"{random.randint(1, 999)}/{random.randint(1, 99)}",
                        "street": "ถนนทดสอบ",
                        "subDistrict": "ตำบลทดสอบ",
                        "district": "อำเภอทดสอบ",
                        "province": "จังหวัดทดสอบ",
                        "country": "ประเทศไทย",
                        "postcode": f"{random.randint(10000, 99999)}"
                    },
                    "totalContracts": 1,
                    "totalValue": 0,
                    "storeId": test_store["_id"],
                    "createdBy": test_user["_id"],
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                }

                customer_result = await database.customers.insert_one(customer_doc)
                customer_id = customer_result.inserted_id

                # Create contract
                pawn_price = random.randint(5000, 50000)
                start_date = datetime.now() - timedelta(days=random.randint(1, 60))
                due_date = start_date + timedelta(days=90)

                contract_doc = {
                    "contractNumber": f"TEST{random.randint(100000, 999999)}",
                    "status": random.choice(["active", "overdue", "suspended", "redeemed"]),
                    "customerId": customer_id,
                    "userId": test_user["_id"],  # Add userId
                    "storeId": test_store["_id"],
                    "item": {
                        "brand": random.choice(["Apple", "Samsung", "Huawei", "OPPO"]),
                        "model": f"Model{random.randint(1, 20)}",
                        "type": random.choice(["Smartphone", "Tablet", "Laptop"]),
                        "serialNo": f"SN{random.randint(100000, 999999)}",
                        "accessories": "กล่อง + อุปกรณ์",
                        "condition": random.randint(70, 95),
                        "defects": "ใช้งานปกติ",
                        "note": "สภาพดี",
                        "images": []
                    },
                    "pawnDetails": {
                        "aiEstimatedPrice": int(pawn_price * 1.3),
                        "pawnedPrice": pawn_price,
                        "interestRate": 10.0,
                        "periodDays": 90,
                        "totalInterest": pawn_price * 0.1 * 3,
                        "remainingAmount": pawn_price + (pawn_price * 0.1 * 3)
                    },
                    "dates": {
                        "startDate": start_date,
                        "dueDate": due_date,
                        "redeemDate": None,
                        "suspendedDate": None
                    },
                    "transactionHistory": [],
                    "createdBy": test_user["_id"],
                    "createdAt": start_date,
                    "updatedAt": datetime.now()
                }

                await database.contracts.insert_one(contract_doc)
                print(f"  Created contract {contract_doc['contractNumber']}")

    print("\n=== DATABASE UPDATE COMPLETE ===")
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_database())