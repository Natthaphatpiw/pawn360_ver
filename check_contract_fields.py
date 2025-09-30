import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = "pawn"

async def check_contract_fields():
    client = AsyncIOMotorClient(MONGODB_URI)
    database = client[DATABASE_NAME]

    # Get one contract to see the structure
    contract = await database.contracts.find_one()
    if contract:
        print("=== CONTRACT STRUCTURE ===")
        for key, value in contract.items():
            print(f"{key}: {type(value).__name__} - {value}")
    else:
        print("No contracts found")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_contract_fields())