#!/bin/bash
# Start Backend Server Script

echo "=========================================="
echo "Starting FastAPI Backend Server"
echo "=========================================="
echo ""

# Navigate to backend directory
cd backend || exit 1

# Check if virtual environment exists
if [ ! -d "../.venv" ]; then
    echo "ERROR: Virtual environment not found at .venv"
    echo "Please create it first with: python -m venv .venv"
    exit 1
fi

# Activate virtual environment (Git Bash)
source ../.venv/Scripts/activate 2>/dev/null || source ../.venv/bin/activate

# Check if uvicorn is installed
if ! command -v uvicorn &> /dev/null; then
    echo "ERROR: uvicorn not found. Installing dependencies..."
    pip install -r requirements.txt
fi

# Start server
echo "Starting Uvicorn on http://localhost:8001"
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --port 8001 --host 0.0.0.0

