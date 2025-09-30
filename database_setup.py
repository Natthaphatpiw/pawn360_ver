#!/usr/bin/env python3
"""
Database Setup Script for Pawn Shop Management System
สร้าง mock data สำหรับทุก collection ตาม DATABASE_DESIGN_REPORT.md
"""

import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random

# MongoDB imports
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from bson import ObjectId
from bson.json_util import dumps

# Environment variables
MONGODB_URI = "mongodb+srv://natthapiw_db_user:afOJe2MrgMDsmm6k@cluster0.skadipr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DATABASE_NAME = "pawn"

def connect_to_mongodb():
    """เชื่อมต่อกับ MongoDB"""
    try:
        client = MongoClient(MONGODB_URI)
        # ทดสอบการเชื่อมต่อ
        client.admin.command('ping')
        print("✅ เชื่อมต่อ MongoDB สำเร็จ")

        # สร้างหรือใช้ database
        db = client[DATABASE_NAME]
        print(f"📊 ใช้ database: {DATABASE_NAME}")

        return client, db

    except ConnectionFailure as e:
        print(f"❌ ไม่สามารถเชื่อมต่อ MongoDB ได้: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        sys.exit(1)

def clear_database(db):
    """ล้างข้อมูลทั้งหมดใน database"""
    try:
        collections = db.list_collection_names()
        for collection in collections:
            db[collection].drop()
        print("🗑️ ล้างข้อมูลใน database เสร็จสิ้น")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการล้างข้อมูล: {e}")

def generate_contract_number(store_id: str, date: datetime) -> str:
    """สร้างเลขที่สัญญา"""
    date_str = date.strftime("%Y%m%d")
    random_suffix = str(random.randint(100, 999))
    return f"{store_id}{date_str}{random_suffix}"

def generate_id_number() -> str:
    """สร้างเลขบัตรประชาชนจำลอง"""
    return f"{random.randint(1, 9)}{random.randint(100000000, 999999999)}"

def generate_phone_number() -> str:
    """สร้างเบอร์โทรศัพท์จำลอง"""
    return f"0{random.randint(80, 99)}{random.randint(1000000, 9999999)}"

def create_test_user(db):
    """สร้าง test user ที่มีข้อมูลครอบคลุมการทดสอบ"""
    print("👤 กำลังสร้าง test user...")

    # สร้าง store ก่อน
    store_data = {
        "_id": ObjectId(),
        "storeName": "ร้านทองจำนำใจดี",
        "phone": "02-555-0123",
        "taxId": "0123456789012",
        "address": {
            "houseNumber": "123/45",
            "village": "หมู่บ้านสุขใจ",
            "street": "ถนนรัชดาภิเษก",
            "subDistrict": "ดินแดง",
            "district": "ดินแดง",
            "province": "กรุงเทพมหานคร",
            "country": "ประเทศไทย",
            "postcode": "10400"
        },
        "logoUrl": None,
        "stampUrl": None,
        "signatureUrl": None,
        "interestPresets": [
            {"days": 7, "rate": 3.0},
            {"days": 15, "rate": 5.0},
            {"days": 30, "rate": 10.0}
        ],
        "contractTemplate": {
            "header": "สัญญาจำนำทองคำ",
            "footer": "ขอบคุณที่ใช้บริการ",
            "terms": "เงื่อนไขการจำนำมาตรฐาน"
        },
        "ownerId": None,  # จะอัปเดตหลังจากสร้าง user
        "isActive": True,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }

    store_id = db.stores.insert_one(store_data).inserted_id
    print(f"🏪 สร้าง store สำเร็จ: {store_id}")

    # สร้าง test user
    user_data = {
        "_id": ObjectId(),
        "email": "test@pawnshop.com",
        "passwordHash": "$2b$10$test.hash.for.demo.purposes.only",  # bcrypt hash ของ "password123"
        "role": "owner",
        "fullName": "นายทดสอบ ระบบทดสอบ",
        "phone": "02-555-0123",
        "profileImage": None,
        "address": {
            "houseNumber": "123/45",
            "village": "หมู่บ้านสุขใจ",
            "street": "ถนนรัชดาภิเษก",
            "subDistrict": "ดินแดง",
            "district": "ดินแดง",
            "province": "กรุงเทพมหานคร",
            "country": "ประเทศไทย",
            "postcode": "10400"
        },
        "isActive": True,
        "lastLogin": None,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
        "storeId": store_id
    }

    user_id = db.users.insert_one(user_data).inserted_id

    # อัปเดต store ให้มี ownerId
    db.stores.update_one(
        {"_id": store_id},
        {"$set": {"ownerId": user_id}}
    )

    print(f"👤 สร้าง test user สำเร็จ: {user_id}")
    return store_id, user_id

def create_customers(db, store_id: ObjectId, count: int = 10):
    """สร้างข้อมูลลูกค้าจำลอง"""
    print(f"👥 กำลังสร้าง {count} ลูกค้า...")

    customers = []
    titles = ["นาย", "นาง", "นางสาว"]
    first_names = ["สมชาย", "สมหญิง", "วิชัย", "มาลี", "ประสิทธิ์", "สุนีย์", "ธนา", "นภาพร", "อดิศักดิ์", "นฤมล"]
    last_names = ["ใจดี", "รักดี", "เก่งกาจ", "ขยันดี", "มั่งมี", "สวยงาม", "ร่ำรวย", "นุ่มนิ่ม", "โชคดี", "สดใส"]

    for i in range(count):
        customer = {
            "_id": ObjectId(),
            "title": random.choice(titles),
            "firstName": random.choice(first_names),
            "lastName": random.choice(last_names),
            "fullName": f"{random.choice(titles)} {random.choice(first_names)} {random.choice(last_names)}",
            "phone": generate_phone_number(),
            "idNumber": generate_id_number(),
            "address": {
                "houseNumber": f"{random.randint(1, 999)}/{random.randint(1, 99)}",
                "village": f"หมู่บ้าน{random.choice(['สุขใจ', 'ร่มรื่น', 'เจริญทรัพย์', 'มั่งคั่ง'])}",
                "street": f"ถนน{random.choice(['สุขุมวิท', 'รัชดา', 'พระรามที่ 9', 'ลาดพร้าว'])}",
                "subDistrict": random.choice(["ดินแดง", "ห้วยขวาง", "สามเสนใน", "ทุ่งพญาไท"]),
                "district": random.choice(["ดินแดง", "ห้วยขวาง", "พญาไท", "ราชเทวี"]),
                "province": "กรุงเทพมหานคร",
                "country": "ประเทศไทย",
                "postcode": f"{random.randint(10, 11)}{random.randint(100, 999)}{random.randint(10, 99)}"
            },
            "totalContracts": random.randint(0, 5),
            "totalValue": random.randint(10000, 100000),
            "lastContractDate": datetime.now() - timedelta(days=random.randint(1, 365)),
            "storeId": store_id,
            "createdBy": ObjectId(),  # จะอัปเดตเป็น user_id ที่ถูกต้อง
            "createdAt": datetime.now() - timedelta(days=random.randint(1, 365)),
            "updatedAt": datetime.now()
        }
        customers.append(customer)

    result = db.customers.insert_many(customers)
    print(f"✅ สร้างลูกค้าจำลอง {len(result.inserted_ids)} รายการ")
    return result.inserted_ids

def create_items(db, store_id: ObjectId, count: int = 20):
    """สร้างข้อมูลสินค้าจำลอง"""
    print(f"📦 กำลังสร้าง {count} สินค้า...")

    items = []
    brands = ["Apple", "Samsung", "Dell", "HP", "Lenovo", "ASUS", "MSI", "Acer", "Sony", "LG"]
    types = ["Smartphone", "Laptop", "Desktop", "Tablet", "Gaming PC", "Monitor", "Smartwatch", "Camera"]
    models = {
        "Smartphone": ["iPhone 15", "Galaxy S24", "Pixel 8", "OnePlus 12", "Xiaomi 14"],
        "Laptop": ["MacBook Pro", "ThinkPad X1", "Dell XPS", "Surface Pro", "ROG Strix"],
        "Desktop": ["iMac", "Surface Studio", "Gaming PC", "All-in-One", "Workstation"],
        "Tablet": ["iPad Pro", "Galaxy Tab", "Surface Pro", "Kindle Fire", "Lenovo Tab"],
        "Gaming PC": ["ROG Strix", "Alienware", "Predator", "Legion", "Omen"],
        "Monitor": ["UltraWide", "Gaming Monitor", "4K Monitor", "Curved Monitor", "Portable"],
        "Smartwatch": ["Apple Watch", "Galaxy Watch", "Pixel Watch", "Fitbit", "Garmin"],
        "Camera": ["DSLR", "Mirrorless", "Action Camera", "Drone Camera", "Security Camera"]
    }

    for i in range(count):
        item_type = random.choice(types)
        model = random.choice(models[item_type])

        item = {
            "_id": ObjectId(),
            "brand": random.choice(brands),
            "model": model,
            "type": item_type,
            "serialNo": f"SN{random.randint(100000, 999999)}",
            "condition": random.randint(70, 100),
            "defects": random.choice(["", "รอยขีดข่วนเล็กน้อย", "ใช้งานปกติ", "สภาพดีมาก"]),
            "note": random.choice(["", "สินค้าอยู่ในสภาพดี", "ผ่านการใช้งานปกติ", "ยังไม่แกะกล่อง"]),
            "accessories": random.choice(["", "สายชาร์จ", "กล่อง + คู่มือ", "อุปกรณ์ครบชุด"]),
            "images": [],
            "status": random.choice(["available", "pawned", "sold", "lost"]),
            "currentContractId": None,
            "contractHistory": [],
            "storeId": store_id,
            "createdAt": datetime.now() - timedelta(days=random.randint(1, 365)),
            "updatedAt": datetime.now()
        }
        items.append(item)

    result = db.items.insert_many(items)
    print(f"✅ สร้างสินค้าจำลอง {len(result.inserted_ids)} รายการ")
    return result.inserted_ids

def create_contracts(db, store_id: ObjectId, user_id: ObjectId, customers: List[ObjectId], items: List[ObjectId], count: int = 15):
    """สร้างข้อมูลสัญญาจำลอง"""
    print(f"📋 กำลังสร้าง {count} สัญญา...")

    contracts = []
    statuses = ["active", "overdue", "redeemed", "suspended", "sold"]

    for i in range(count):
        customer_id = random.choice(customers)
        item_id = random.choice(items)

        # กำหนดวันที่
        start_date = datetime.now() - timedelta(days=random.randint(1, 365))
        period_days = random.choice([7, 15, 30, 60, 90])
        due_date = start_date + timedelta(days=period_days)

        # กำหนดราคาและสถานะ
        ai_price = random.randint(5000, 50000)
        pawned_price = int(ai_price * random.uniform(0.6, 0.9))
        status = random.choice(statuses)

        # สร้างข้อมูลสัญญา
        contract = {
            "_id": ObjectId(),
            "contractNumber": generate_contract_number("STORE", start_date),
            "status": status,
            "customerId": customer_id,
            "item": {
                "brand": random.choice(["Apple", "Samsung", "Dell", "HP"]),
                "model": random.choice(["iPhone 15", "MacBook Pro", "Galaxy S24", "ThinkPad X1"]),
                "type": random.choice(["Smartphone", "Laptop", "Desktop", "Tablet"]),
                "serialNo": f"SN{random.randint(100000, 999999)}",
                "accessories": random.choice(["สายชาร์จ", "กล่อง + คู่มือ", "อุปกรณ์ครบ"]),
                "condition": random.randint(70, 100),
                "defects": random.choice(["", "รอยเล็กน้อย", "ใช้งานปกติ"]),
                "note": random.choice(["", "สภาพดีมาก", "ผ่านการใช้งาน"]),
                "images": []
            },
            "pawnDetails": {
                "aiEstimatedPrice": ai_price,
                "pawnedPrice": pawned_price,
                "interestRate": random.choice([3.0, 5.0, 10.0]),
                "periodDays": period_days,
                "totalInterest": pawned_price * (random.choice([3.0, 5.0, 10.0]) / 100) * (period_days / 30),
                "remainingAmount": pawned_price + (pawned_price * (random.choice([3.0, 5.0, 10.0]) / 100) * (period_days / 30))
            },
            "dates": {
                "startDate": start_date,
                "dueDate": due_date,
                "redeemDate": None if status != "redeemed" else start_date + timedelta(days=random.randint(1, period_days)),
                "suspendedDate": None if status != "suspended" else start_date + timedelta(days=random.randint(1, 30))
            },
            "transactionHistory": [],
            "storeId": store_id,
            "createdBy": user_id,
            "createdAt": start_date,
            "updatedAt": datetime.now()
        }

        # ถ้าสัญญาเป็น redeemed หรือ suspended ให้อัปเดต item status
        if status in ["redeemed", "suspended"]:
            db.items.update_one(
                {"_id": item_id},
                {"$set": {"status": "available", "currentContractId": None}}
            )

        contracts.append(contract)

    result = db.contracts.insert_many(contracts)
    print(f"✅ สร้างสัญญาจำลอง {len(result.inserted_ids)} รายการ")
    return result.inserted_ids

def create_transactions(db, contracts: List[ObjectId], customers: List[ObjectId], user_id: ObjectId, store_id: ObjectId):
    """สร้างข้อมูลธุรกรรมจำลอง"""
    print("💰 กำลังสร้างธุรกรรมจำลอง...")

    transactions = []
    transaction_types = ["pawn", "interest_payment", "redeem", "extend", "suspend", "sell"]
    payment_methods = ["cash", "bank_transfer", "promptpay"]

    for contract_id in contracts:
        # สร้าง 2-5 ธุรกรรมต่อสัญญา
        num_transactions = random.randint(2, 5)

        for i in range(num_transactions):
            # กำหนดวันที่เรียงตามเวลา
            base_date = datetime.now() - timedelta(days=random.randint(1, 180))
            transaction_date = base_date + timedelta(days=i * 15)

            # กำหนดประเภทและจำนวนเงิน
            trans_type = random.choice(transaction_types)

            if trans_type == "pawn":
                amount = random.randint(5000, 30000)
            elif trans_type == "interest_payment":
                amount = random.randint(100, 1000)
            elif trans_type == "redeem":
                amount = random.randint(10000, 50000)
            else:
                amount = random.randint(500, 5000)

            transaction = {
                "_id": ObjectId(),
                "type": trans_type,
                "amount": amount,
                "paymentMethod": random.choice(payment_methods),
                "contractId": contract_id,
                "customerId": random.choice(customers),
                "itemId": None,  # จะเพิ่มถ้าจำเป็น
                "processedBy": user_id,
                "note": f"Transaction {i+1} for contract",
                "beforeBalance": amount * (1 + i),
                "afterBalance": amount * (1 + i) - amount,
                "storeId": store_id,
                "createdAt": transaction_date
            }

            transactions.append(transaction)

    result = db.transactions.insert_many(transactions)
    print(f"✅ สร้างธุรกรรมจำลอง {len(result.inserted_ids)} รายการ")

def create_indexes(db):
    """สร้าง indexes สำหรับ performance"""
    print("🔍 กำลังสร้าง database indexes...")

    # Users Collection
    db.users.create_index([("email", 1)], unique=True)
    db.users.create_index([("storeId", 1)])
    db.users.create_index([("role", 1)])

    # Stores Collection
    db.stores.create_index([("ownerId", 1)])
    db.stores.create_index([("taxId", 1)])

    # Customers Collection
    db.customers.create_index([("idNumber", 1)], unique=True)
    db.customers.create_index([("storeId", 1)])
    db.customers.create_index([("phone", 1)])

    # Contracts Collection
    db.contracts.create_index([("contractNumber", 1)], unique=True)
    db.contracts.create_index([("storeId", 1)])
    db.contracts.create_index([("customerId", 1)])
    db.contracts.create_index([("status", 1)])
    db.contracts.create_index([("dates.dueDate", 1)])
    db.contracts.create_index([("dates.startDate", 1)])
    # Compound indexes
    db.contracts.create_index([("storeId", 1), ("status", 1), ("dates.dueDate", 1)])
    db.contracts.create_index([("storeId", 1), ("dates.startDate", -1)])

    # Items Collection
    db.items.create_index([("storeId", 1)])
    db.items.create_index([("status", 1)])
    db.items.create_index([("type", 1)])

    # Transactions Collection
    db.transactions.create_index([("contractId", 1)])
    db.transactions.create_index([("storeId", 1)])
    db.transactions.create_index([("type", 1)])
    db.transactions.create_index([("createdAt", -1)])

    print("✅ สร้าง indexes เสร็จสิ้น")

def main():
    """ฟังก์ชันหลักสำหรับสร้าง mock data"""
    print("🚀 เริ่มต้นการสร้าง mock data สำหรับ Pawn Shop Management System")
    print("=" * 70)

    # เชื่อมต่อ MongoDB
    client, db = connect_to_mongodb()

    try:
        # ล้างข้อมูลเก่า
        clear_database(db)

        # สร้าง test user และ store
        store_id, user_id = create_test_user(db)

        # สร้างข้อมูลลูกค้า
        customer_ids = create_customers(db, store_id, 10)

        # สร้างข้อมูลสินค้า
        item_ids = create_items(db, store_id, 20)

        # สร้างข้อมูลสัญญา
        contract_ids = create_contracts(db, store_id, user_id, customer_ids, item_ids, 15)

        # สร้างข้อมูลธุรกรรม
        create_transactions(db, contract_ids, customer_ids, user_id, store_id)

        # สร้าง indexes
        create_indexes(db)

        print("=" * 70)
        print("🎉 การสร้าง mock data เสร็จสิ้น!")
        print(f"📊 สรุปข้อมูลที่สร้าง:")
        print(f"   👤 Users: 1 รายการ (test user)")
        print(f"   🏪 Stores: 1 รายการ")
        print(f"   👥 Customers: 10 รายการ")
        print(f"   📦 Items: 20 รายการ")
        print(f"   📋 Contracts: 15 รายการ")
        print(f"   💰 Transactions: {random.randint(30, 75)} รายการ (โดยประมาณ)")
        print()
        print("🔑 ข้อมูลสำหรับการทดสอบ:")
        print(f"   Email: test@pawnshop.com")
        print(f"   Password: password123")
        print(f"   Role: owner")
        print()
        print("📝 สัญญาที่สร้างจะมีสถานะต่างๆ สำหรับการทดสอบทุกรูปแบบ")
        print("🗂️ Indexes ถูกสร้างแล้วสำหรับประสิทธิภาพสูงสุด")

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # ปิดการเชื่อมต่อ
        client.close()
        print("🔌 ปิดการเชื่อมต่อ MongoDB")

if __name__ == "__main__":
    main()