#!/bin/bash

echo "🚀 Starting Pawn360 Backend Server..."
echo "=================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing backend dependencies..."
pip install -r backend/requirements.txt

# Navigate to backend directory
cd backend

# Run the FastAPI server
echo "🌟 Starting FastAPI server on http://127.0.0.1:8000"
echo "📖 API Documentation: http://127.0.0.1:8000/docs"
echo "🏥 Health Check: http://127.0.0.1:8000/health"
echo "=================================="

python run.py