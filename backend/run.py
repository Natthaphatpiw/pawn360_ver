#!/usr/bin/env python3
"""
Run script for Pawn360 FastAPI Backend
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    print("🚀 Starting Pawn360 FastAPI Backend Server...")
    print("📊 Database: MongoDB Atlas")
    print("🔗 API Documentation: http://127.0.0.1:8000/docs")
    print("🔗 Health Check: http://127.0.0.1:8000/health")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )