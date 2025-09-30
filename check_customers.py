import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = "pawn"

async def check_customers():
    client = AsyncIOMotorClient(MONGODB_URI)
    database = client[DATABASE_NAME]

    # Get one customer to see the structure
    customer = await database.customers.find_one()
    if customer:
        print("=== CUSTOMER STRUCTURE ===")
        for key, value in customer.items():
            print(f"{key}: {type(value).__name__} - {value}")
    else:
        print("No customers found")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_customers())