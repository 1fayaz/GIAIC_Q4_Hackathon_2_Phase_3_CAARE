#!/bin/bash
# Start Frontend Server Script

echo "=========================================="
echo "Starting Next.js Frontend Server"
echo "=========================================="
echo ""

# Navigate to frontend directory
cd frontend || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "ERROR: node_modules not found. Installing dependencies..."
    npm install
fi

# Start server
echo "Starting Next.js on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

npm run dev

