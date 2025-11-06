#!/bin/bash#!/bin/bash



echo "========================================"# JEE RL Tutor - Startup Script

echo " RL Tutor - Startup Script"# This script starts both backend and frontend services

echo "========================================"

echo ""echo "🚀 Starting JEE RL Tutor..."

echo ""

# Check if Python is installed

if ! command -v python3 &> /dev/null; then# Colors for output

    echo "ERROR: Python 3 is not installed"GREEN='\033[0;32m'

    exit 1BLUE='\033[0;34m'

fiYELLOW='\033[1;33m'

NC='\033[0m' # No Color

# Check if Node.js is installed

if ! command -v node &> /dev/null; then# Check if Python is installed

    echo "ERROR: Node.js is not installed"if ! command -v python &> /dev/null; then

    exit 1    echo -e "${YELLOW}⚠️  Python not found. Please install Python 3.8+${NC}"

fi    exit 1

fi

echo "[1/4] Installing Python dependencies..."

cd backend# Check if Node is installed

if [ ! -d "venv" ]; thenif ! command -v node &> /dev/null; then

    echo "Creating virtual environment..."    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js${NC}"

    python3 -m venv venv    exit 1

fifi

source venv/bin/activate

pip install -r requirements.txt# Function to cleanup background processes on exit

cd ..cleanup() {

echo ""    echo ""

    echo -e "${YELLOW}🛑 Shutting down services...${NC}"

echo "[2/4] Installing Node.js dependencies..."    kill $(jobs -p) 2>/dev/null

npm install    exit 0

echo ""}



echo "[3/4] Starting Backend Server (Port 8001)..."trap cleanup SIGINT SIGTERM

cd backend

source venv/bin/activate# Start Backend

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &echo -e "${BLUE}� Starting Backend (FastAPI on port 8002)...${NC}"

BACKEND_PID=$!cd backend

cd ..python -m uvicorn app.main:app --reload --port 8002 &

echo "Backend started with PID: $BACKEND_PID"BACKEND_PID=$!

sleep 3cd ..

echo ""

# Wait for backend to start

echo "[4/4] Starting Frontend Server (Port 3000)..."sleep 3

npm run dev &

FRONTEND_PID=$!# Start Frontend

echo "Frontend started with PID: $FRONTEND_PID"echo -e "${BLUE}🎨 Starting Frontend (Next.js on port 3000)...${NC}"

echo ""npm run dev &

FRONTEND_PID=$!

echo "========================================"

echo " Both servers are running!"echo ""

echo "========================================"echo -e "${GREEN}✅ Services started successfully!${NC}"

echo " Backend:  http://localhost:8001"echo ""

echo " Frontend: http://localhost:3000"echo "📍 Backend:  http://localhost:8002"

echo "========================================"echo "📍 Frontend: http://localhost:3000"

echo ""echo "📍 API Docs: http://localhost:8002/docs"

echo "Press Ctrl+C to stop both servers"echo ""

echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for Ctrl+Cecho ""

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait# Wait for both processes

wait
echo ""

# Wait for user to stop
wait
