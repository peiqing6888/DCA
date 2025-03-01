#!/bin/bash

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found, please run setup.sh first"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Start the service
echo "Starting backend service..."
uvicorn main:app --host 127.0.0.1 --port 8000 --reload 