"""
FastAPI Backend for Pawn360 Application
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional, List
import uvicorn

# Load environment variables
load_dotenv()

# Database configuration
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = "pawn360"
JWT_SECRET = os.getenv("JWT_SECRET", "pawn360-super-secret-jwt-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

# FastAPI app
app = FastAPI(
    title="Pawn360 API",
    description="Backend API for Pawn360 Pawn Shop Management System",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database client
client: Optional[AsyncIOMotorClient] = None
database = None

# Pydantic models
from pydantic import BaseModel, EmailStr
from typing import Dict, Any

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "user"
    store_id: Optional[str] = None

class StoreCreate(BaseModel):
    store_name: str
    address: Dict[str, str]
    phone: str
    tax_id: str

class CustomerCreate(BaseModel):
    full_name: str
    phone_number: str
    id_number: str
    address: Dict[str, str]
    store_id: str

class ContractCreate(BaseModel):
    customer_id: str
    item: Dict[str, Any]
    pawn_details: Dict[str, Any]
    store_id: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]
    store: Optional[Dict[str, Any]] = None

# Database connection
@app.on_event("startup")
async def startup_db_client():
    global client, database
    client = AsyncIOMotorClient(MONGODB_URI)
    database = client[DATABASE_NAME]
    print("🟢 Connected to MongoDB Atlas")

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
        print("🔴 Disconnected from MongoDB Atlas")

# Utility functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# API Routes

@app.get("/")
async def root():
    return {"message": "Pawn360 API Server", "status": "running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    try:
        # Test database connection
        await database.command("ping")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.now()}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# Authentication endpoints
@app.post("/auth/signin", response_model=Token)
async def signin(user_credentials: UserLogin):
    # Find user by email
    user = await database.users.find_one({"email": user_credentials.email})
    
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Get store information
    store = None
    if user.get("store_id"):
        store = await database.stores.find_one({"_id": ObjectId(user["store_id"])})
        if store:
            store["_id"] = str(store["_id"])
    
    # Create token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    # Prepare user data (remove sensitive info)
    user_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "store_id": str(user["store_id"]) if user.get("store_id") else None
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
        "store": store
    }

class SignupRequest(BaseModel):
    user: UserCreate
    store: Optional[StoreCreate] = None

@app.post("/auth/signup")
async def signup(signup_data: SignupRequest):
    # Check if user already exists
    existing_user = await database.users.find_one({"email": signup_data.user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create store if provided
    store_id = None
    store = None
    if signup_data.store:
        store_doc = {
            **signup_data.store.dict(),
            "created_at": datetime.now()
        }
        store_result = await database.stores.insert_one(store_doc)
        store_id = store_result.inserted_id
        
        # Get created store
        store = await database.stores.find_one({"_id": store_id})
        if store:
            store["_id"] = str(store["_id"])
    
    # Create user
    user_doc = {
        "full_name": signup_data.user.full_name,
        "email": signup_data.user.email,
        "password_hash": hash_password(signup_data.user.password),
        "role": signup_data.user.role,
        "store_id": store_id,
        "created_at": datetime.now()
    }
    
    user_result = await database.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user_result.inserted_id)})
    
    # Prepare user data
    user_data = {
        "id": str(user_result.inserted_id),
        "email": signup_data.user.email,
        "full_name": signup_data.user.full_name,
        "role": signup_data.user.role,
        "store_id": str(store_id) if store_id else None
    }
    
    return {
        "message": "User created successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
        "store": store
    }

# Customer endpoints
@app.get("/customers")
async def get_customers(store_id: str, user_id: str = Depends(verify_token)):
    customers = await database.customers.find({"store_id": ObjectId(store_id)}).to_list(100)
    for customer in customers:
        customer["_id"] = str(customer["_id"])
        customer["store_id"] = str(customer["store_id"])
    return customers

@app.post("/customers")
async def create_customer(customer_data: CustomerCreate, user_id: str = Depends(verify_token)):
    customer_doc = {
        **customer_data.dict(),
        "store_id": ObjectId(customer_data.store_id),
        "created_at": datetime.now()
    }
    
    result = await database.customers.insert_one(customer_doc)
    return {"message": "Customer created successfully", "customer_id": str(result.inserted_id)}

@app.get("/customers/search")
async def search_customers(phone: Optional[str] = None, id_number: Optional[str] = None, store_id: str = None, user_id: str = Depends(verify_token)):
    query = {"store_id": ObjectId(store_id)}
    
    if phone:
        query["phone_number"] = {"$regex": phone, "$options": "i"}
    if id_number:
        query["id_number"] = {"$regex": id_number, "$options": "i"}
    
    customers = await database.customers.find(query).to_list(10)
    for customer in customers:
        customer["_id"] = str(customer["_id"])
        customer["store_id"] = str(customer["store_id"])
    
    return customers

# Contract endpoints
@app.get("/contracts")
async def get_contracts(store_id: str, status: Optional[str] = None, user_id: str = Depends(verify_token)):
    query = {"store_id": ObjectId(store_id)}
    if status:
        query["status"] = status
    
    contracts = await database.contracts.find(query).to_list(100)
    
    # Get customer data for each contract
    for contract in contracts:
        contract["_id"] = str(contract["_id"])
        contract["store_id"] = str(contract["store_id"])
        contract["customer_id"] = str(contract["customer_id"])
        
        # Get customer info
        customer = await database.customers.find_one({"_id": ObjectId(contract["customer_id"])})
        if customer:
            contract["customer"] = {
                "name": customer["full_name"],
                "phone": customer["phone_number"]
            }
    
    return contracts

@app.get("/contracts/{contract_id}")
async def get_contract(contract_id: str, user_id: str = Depends(verify_token)):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid contract ID")
    
    contract = await database.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Get customer info
    customer = await database.customers.find_one({"_id": contract["customer_id"]})
    
    contract["_id"] = str(contract["_id"])
    contract["store_id"] = str(contract["store_id"])
    contract["customer_id"] = str(contract["customer_id"])
    
    if customer:
        contract["customer"] = {
            "name": customer["full_name"],
            "phone": customer["phone_number"],
            "id_number": customer["id_number"],
            "address": customer["address"]
        }
    
    return contract

@app.post("/contracts")
async def create_contract(contract_data: ContractCreate, user_id: str = Depends(verify_token)):
    # Generate contract number
    import random
    import string
    timestamp = datetime.now().strftime("%y%m%d")
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    contract_number = f"SCL{timestamp}{random_part}"
    
    contract_doc = {
        "contract_number": contract_number,
        "store_id": ObjectId(contract_data.store_id),
        "customer_id": ObjectId(contract_data.customer_id),
        "item": contract_data.item,
        "pawn_details": contract_data.pawn_details,
        "dates": {
            "start_date": datetime.now(),
            "due_date": datetime.now() + timedelta(days=contract_data.pawn_details.get("period_days", 30))
        },
        "status": "active",
        "transaction_history": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    result = await database.contracts.insert_one(contract_doc)
    return {"message": "Contract created successfully", "contract_id": str(result.inserted_id), "contract_number": contract_number}

# Dashboard endpoints
@app.get("/dashboard/stats")
async def get_dashboard_stats(store_id: str, user_id: str = Depends(verify_token)):
    store_obj_id = ObjectId(store_id)
    
    # Count statistics
    total_customers = await database.customers.count_documents({"store_id": store_obj_id})
    total_contracts = await database.contracts.count_documents({"store_id": store_obj_id})
    active_contracts = await database.contracts.count_documents({"store_id": store_obj_id, "status": "active"})
    overdue_contracts = await database.contracts.count_documents({"store_id": store_obj_id, "status": "overdue"})
    
    # Calculate total pawned value
    pipeline = [
        {"$match": {"store_id": store_obj_id, "status": {"$in": ["active", "overdue"]}}},
        {"$group": {"_id": None, "total_value": {"$sum": "$pawn_details.pawned_price"}}}
    ]
    value_result = await database.contracts.aggregate(pipeline).to_list(1)
    total_pawned_value = value_result[0]["total_value"] if value_result else 0
    
    return {
        "total_customers": total_customers,
        "total_contracts": total_contracts,
        "active_contracts": active_contracts,
        "overdue_contracts": overdue_contracts,
        "total_pawned_value": total_pawned_value
    }

# Brands endpoints
@app.get("/brands")
async def get_brands():
    brands = await database.brands.find({"is_active": True}).to_list(100)
    for brand in brands:
        brand["_id"] = str(brand["_id"])
    return brands

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )