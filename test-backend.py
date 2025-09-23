#!/usr/bin/env python3
"""
Test script for Pawn360 Backend API
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print("🏥 Health Check:")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_demo_signin():
    """Test demo signin"""
    try:
        data = {
            "email": "demo@pawn360.com",
            "password": "demo123"
        }
        response = requests.post(f"{BASE_URL}/auth/signin", json=data)
        print("\n🔐 Demo Signin:")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   User: {result['user']['full_name']}")
            print(f"   Store: {result['store']['store_name'] if result.get('store') else 'None'}")
            return True, result.get('access_token')
        else:
            print(f"   Error: {response.json()}")
            return False, None
    except Exception as e:
        print(f"❌ Demo signin failed: {e}")
        return False, None

def test_signup():
    """Test user signup"""
    try:
        data = {
            "user": {
                "full_name": "Test User",
                "email": "test@example.com",
                "password": "test123",
                "role": "admin"
            },
            "store": {
                "store_name": "Test Pawn Shop",
                "address": {
                    "street": "123 Test St",
                    "subDistrict": "Test Sub",
                    "district": "Test District",
                    "province": "Test Province",
                    "postcode": "12345"
                },
                "phone": "02-123-4567",
                "tax_id": "1234567890123"
            }
        }
        response = requests.post(f"{BASE_URL}/auth/signup", json=data)
        print("\n📝 User Signup:")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   User: {result['user']['full_name']}")
            print(f"   Store: {result['store']['store_name'] if result.get('store') else 'None'}")
            return True
        else:
            print(f"   Error: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Signup failed: {e}")
        return False

def main():
    print("🚀 Testing Pawn360 Backend API")
    print("=" * 40)
    
    # Test health
    if not test_health():
        print("❌ Backend server is not running!")
        print("💡 Run: ./run-backend.sh")
        return
    
    # Test demo signin
    signin_success, token = test_demo_signin()
    
    # Test signup (will fail if user already exists, that's OK)
    test_signup()
    
    print("\n" + "=" * 40)
    if signin_success:
        print("✅ Backend is working correctly!")
        print("🌐 API Documentation: http://127.0.0.1:8000/docs")
    else:
        print("⚠️  Some tests failed, but backend is running")

if __name__ == "__main__":
    main()