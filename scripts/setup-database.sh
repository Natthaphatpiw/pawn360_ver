#!/bin/bash

# Pawn360 Database Setup Script
# This script sets up the Python environment and initializes the database

echo "🚀 Pawn360 Database Setup"
echo "========================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🔄 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "🔄 Installing Python dependencies..."
pip install -r requirements.txt

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Run database initialization
echo ""
echo "🔄 Initializing database..."
python3 init-database.py

# Check if database initialization was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database setup completed successfully!"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Update your .env.local file with AWS S3 credentials"
    echo "2. Start the Next.js development server: npm run dev"
    echo "3. Visit http://localhost:3000 to see the application"
    echo "4. Login with demo@pawn360.com / demo123"
else
    echo "❌ Database initialization failed"
    exit 1
fi

deactivate
echo "🔐 Virtual environment deactivated"