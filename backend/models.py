# MongoDB Models using Pydantic for FastAPI Backend
# This file contains all the data models for the Pawn360 application

from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from enum import Enum


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic models"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


# Base Models
class Address(BaseModel):
    street: str
    sub_district: str
    district: str
    province: str
    postcode: str


class InterestPreset(BaseModel):
    days: int = Field(..., gt=0)
    rate: float = Field(..., gt=0, le=100)


# User and Store Models
class User(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    store_id: PyObjectId
    full_name: str
    email: EmailStr
    password_hash: str
    role: str = "staff"  # admin, staff
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Store(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    store_name: str
    address: Address
    phone: str
    tax_id: Optional[str] = None
    logo_url: Optional[str] = None
    stamp_url: Optional[str] = None
    signature_url: Optional[str] = None
    interest_presets: List[InterestPreset] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Customer Model
class Customer(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    store_id: PyObjectId
    full_name: str
    phone_number: str
    id_number: str
    address: Address
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Contract Models
class ContractStatus(str, Enum):
    ACTIVE = "active"
    OVERDUE = "overdue"
    REDEEMED = "redeemed"
    SUSPENDED = "suspended"
    SOLD = "sold"


class TransactionType(str, Enum):
    INTEREST_PAYMENT = "interest_payment"
    PRINCIPAL_INCREASE = "principal_increase"
    PRINCIPAL_DECREASE = "principal_decrease"
    REDEEM = "redeem"
    SUSPEND = "suspend"
    RESUME = "resume"


class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    PROMPTPAY = "promptpay"
    CREDIT_CARD = "credit_card"


class Item(BaseModel):
    brand: str
    model: str
    type: str
    serial_no: Optional[str] = None
    accessories: Optional[str] = None
    condition_percent: int = Field(..., ge=0, le=100)
    defects: Optional[str] = None
    note: Optional[str] = None
    images_urls: List[str] = Field(default_factory=list)


class PawnDetails(BaseModel):
    ai_estimated_price: float = Field(..., gt=0)
    pawned_price: float = Field(..., gt=0)
    interest_rate_percent: float = Field(..., gt=0)
    period_days: int = Field(..., gt=0)


class ContractDates(BaseModel):
    start_date: date
    due_date: date


class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    type: TransactionType
    amount: float
    payment_method: Optional[PaymentMethod] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None
    processed_by: Optional[PyObjectId] = None


class Contract(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    contract_number: str = Field(..., unique=True)
    store_id: PyObjectId
    customer_id: PyObjectId
    item: Item
    pawn_details: PawnDetails
    dates: ContractDates
    status: ContractStatus = ContractStatus.ACTIVE
    remarks: Optional[str] = None
    transaction_history: List[Transaction] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, date: str, datetime: str}


# Request/Response Models for API
class UserSignUpRequest(BaseModel):
    user: dict
    store: dict


class UserSignInRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict
    store: Optional[dict] = None


class CustomerCreateRequest(BaseModel):
    full_name: str
    phone_number: str
    id_number: str
    address: Address


class CustomerSearchResponse(BaseModel):
    customers: List[Customer]
    total: int


class ContractCreateRequest(BaseModel):
    customer_id: str
    item: Item
    pawn_details: PawnDetails
    dates: ContractDates
    remarks: Optional[str] = None


class ContractUpdateRequest(BaseModel):
    status: Optional[ContractStatus] = None
    remarks: Optional[str] = None


class ContractActionRequest(BaseModel):
    payment_method: Optional[PaymentMethod] = None
    amount: Optional[float] = None
    note: Optional[str] = None
    reason: Optional[str] = None


class AIValuationRequest(BaseModel):
    brand: str
    model: str
    type: str
    condition_percent: int
    accessories: Optional[str] = None
    defects: Optional[str] = None


class AIValuationResponse(BaseModel):
    estimated_price: float
    confidence: float
    factors: Dict[str, Any]


class DashboardStats(BaseModel):
    awaiting_sale: int
    sold: int
    today_value: float
    overdue_contracts: int
    active_contracts: int
    total_customers: int
    total_value: float


class ChartData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]


class FileUploadResponse(BaseModel):
    filename: str
    url: str
    size: int
    content_type: str


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    details: Optional[Dict[str, Any]] = None


class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None


# Database Collections Configuration
COLLECTIONS = {
    "users": "users",
    "stores": "stores", 
    "customers": "customers",
    "contracts": "contracts",
    "brands": "brands",  # For storing brand options
    "audit_logs": "audit_logs"  # For tracking changes
}


# Indexes to create in MongoDB
INDEXES = {
    "users": [
        [("email", 1), {"unique": True}],
        [("store_id", 1)],
    ],
    "stores": [
        [("store_name", 1)],
        [("phone", 1)],
    ],
    "customers": [
        [("store_id", 1)],
        [("phone_number", 1)],
        [("id_number", 1)],
        [("store_id", 1), ("phone_number", 1)],
        [("store_id", 1), ("id_number", 1)],
    ],
    "contracts": [
        [("store_id", 1)],
        [("customer_id", 1)],
        [("contract_number", 1), {"unique": True}],
        [("status", 1)],
        [("dates.due_date", 1)],
        [("store_id", 1), ("status", 1)],
        [("store_id", 1), ("dates.due_date", 1)],
    ]
}


# Validation functions
def validate_contract_number(contract_number: str) -> bool:
    """Validate contract number format"""
    # Example format: SCL7053KCAKZ01
    return len(contract_number) >= 10 and contract_number.isalnum()


def calculate_due_date(start_date: date, period_days: int) -> date:
    """Calculate due date based on start date and period"""
    from datetime import timedelta
    return start_date + timedelta(days=period_days)


def calculate_interest(principal: float, rate: float, days: int) -> float:
    """Calculate interest amount"""
    return round(principal * (rate / 100) * (days / 30), 2)


def calculate_total_amount(principal: float, rate: float, days: int) -> float:
    """Calculate total amount to be paid"""
    interest = calculate_interest(principal, rate, days)
    return principal + interest


def generate_contract_number(store_id: str) -> str:
    """Generate unique contract number"""
    import random
    import string
    
    # Get current timestamp
    from datetime import datetime
    timestamp = datetime.now().strftime("%y%m%d")
    
    # Generate random string
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Combine parts
    contract_number = f"SCL{timestamp}{random_part}"
    
    return contract_number


# Example usage and testing functions
def create_sample_data():
    """Create sample data for testing"""
    
    # Sample store
    store = Store(
        store_name="Gold Pawn Shop",
        address=Address(
            street="123 Main Street",
            sub_district="Pathumwan",
            district="Pathumwan", 
            province="Bangkok",
            postcode="10330"
        ),
        phone="02-123-4567",
        tax_id="0123456789123",
        interest_presets=[
            InterestPreset(days=7, rate=3.5),
            InterestPreset(days=15, rate=3.0),
            InterestPreset(days=30, rate=2.5),
        ]
    )
    
    # Sample customer
    customer = Customer(
        store_id=store.id,
        full_name="John Smith",
        phone_number="0812345678",
        id_number="1234567890123",
        address=Address(
            street="456 Customer Street",
            sub_district="Huai Khwang",
            district="Huai Khwang",
            province="Bangkok", 
            postcode="10310"
        )
    )
    
    # Sample contract
    contract = Contract(
        contract_number=generate_contract_number(str(store.id)),
        store_id=store.id,
        customer_id=customer.id,
        item=Item(
            brand="Apple",
            model="iPhone 14 Pro",
            type="Smartphone",
            serial_no="FQHD34KL9876",
            accessories="Charger, Case, Earphones",
            condition_percent=85,
            defects="Minor scratches on the back",
            note="Original box included"
        ),
        pawn_details=PawnDetails(
            ai_estimated_price=35000,
            pawned_price=25000,
            interest_rate_percent=3.0,
            period_days=30
        ),
        dates=ContractDates(
            start_date=date.today(),
            due_date=calculate_due_date(date.today(), 30)
        )
    )
    
    return store, customer, contract


if __name__ == "__main__":
    # Test the models
    store, customer, contract = create_sample_data()
    print("Sample data created successfully:")
    print(f"Store: {store.store_name}")
    print(f"Customer: {customer.full_name}")
    print(f"Contract: {contract.contract_number}")
    print(f"Total amount: ฿{calculate_total_amount(25000, 3.0, 30):,.2f}")