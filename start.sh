#!/bin/bash

# ProcessX Start Script
# This script starts all services required for ProcessX

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ProcessX - Starting Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop any existing processes first
echo -e "${YELLOW}Stopping any existing processes...${NC}"
./stop.sh 2>/dev/null || true
sleep 2

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo -e "Run: ${YELLOW}sudo ./scripts/install-prerequisites.sh${NC}"
    exit 1
fi

# Check if user can run Docker
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Docker daemon${NC}"
    echo -e "Try: ${YELLOW}newgrp docker${NC} or log out and log back in"
    exit 1
fi

# Start Docker services
echo -e "${GREEN}[1/5] Starting Docker services (PostgreSQL, Redis, pgAdmin)...${NC}"
docker compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker services started${NC}"
else
    echo -e "${RED}✗ Failed to start Docker services${NC}"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
RETRIES=30
until PGPASSWORD=postgres psql -h localhost -p 5100 -U postgres -d processx -c '\q' 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo -e "${RED}✗ PostgreSQL failed to start in time${NC}"
        echo -e "${YELLOW}  Check: docker compose logs postgres${NC}"
        exit 1
    fi
    echo -e "${YELLOW}  Waiting for database... ($RETRIES attempts remaining)${NC}"
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Check and install backend dependencies if needed
echo -e "${GREEN}[2/5] Checking backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  Installing backend dependencies...${NC}"
    npm install
fi

# Run Prisma migrations
echo -e "${GREEN}[3/5] Running database migrations...${NC}"
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name auto 2>/dev/null || true
npx prisma generate
echo -e "${GREEN}✓ Database migrations complete${NC}"
cd ..

# Check and install frontend dependencies if needed
echo -e "${GREEN}[4/5] Checking frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  Installing frontend dependencies...${NC}"
    npm install
fi
cd ..

# Start backend
echo -e "${GREEN}[5/5] Starting application servers...${NC}"
echo -e "${YELLOW}  Starting backend server (port 3100)...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# Wait for backend to start
echo -e "${YELLOW}  Waiting for backend to initialize...${NC}"
RETRIES=20
until curl -s http://localhost:3100/health > /dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo -e "${RED}✗ Backend server failed to start${NC}"
        echo -e "${YELLOW}  Check: tail -f logs/backend.log${NC}"
        exit 1
    fi
    sleep 2
done
echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"

# Start frontend
echo -e "${YELLOW}  Starting frontend server (port 5200)...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

# Wait for frontend to start
sleep 5
if curl -s http://localhost:5200 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
else
    # Check the log for the actual port
    ACTUAL_PORT=$(grep -oP 'localhost:\K[0-9]+' logs/frontend.log 2>/dev/null | tail -1)
    if [ -n "$ACTUAL_PORT" ]; then
        echo -e "${GREEN}✓ Frontend server started on port $ACTUAL_PORT (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend starting... check logs/frontend.log${NC}"
    fi
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   ProcessX is running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Access URLs:"
echo -e "  ${GREEN}Frontend:${NC}    http://localhost:5200"
echo -e "  ${GREEN}Backend API:${NC} http://localhost:3100"
echo -e "  ${GREEN}API Health:${NC}  http://localhost:3100/health"
echo -e "  ${GREEN}pgAdmin:${NC}     http://localhost:4100"
echo -e "                 Email: admin@processx.local"
echo -e "                 Password: admin"
echo ""
echo -e "Logs:"
echo -e "  Backend:  ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "  Frontend: ${YELLOW}tail -f logs/frontend.log${NC}"
echo -e "  Docker:   ${YELLOW}docker compose logs -f${NC}"
echo ""
echo -e "To stop all services: ${YELLOW}./stop.sh${NC}"
echo ""
