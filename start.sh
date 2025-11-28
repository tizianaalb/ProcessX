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

# Stop any existing processes first
echo -e "${YELLOW}Stopping any existing processes...${NC}"
./stop.sh 2>/dev/null || true
sleep 2

# Start Docker services
echo -e "${GREEN}[1/3] Starting Docker services (PostgreSQL, Redis, pgAdmin)...${NC}"
docker compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker services started${NC}"
else
    echo -e "${RED}✗ Failed to start Docker services${NC}"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 3
until PGPASSWORD=postgres psql -h localhost -p 5100 -U postgres -d processx -c '\q' 2>/dev/null; do
    echo -e "${YELLOW}  Waiting for database...${NC}"
    sleep 1
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Start backend
echo -e "${GREEN}[2/3] Starting backend server (port 3100)...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# Wait for backend to start
sleep 3
if curl -s http://localhost:3100/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend server failed to start${NC}"
    echo -e "${YELLOW}  Check logs/backend.log for details${NC}"
    exit 1
fi

# Start frontend
echo -e "${GREEN}[3/3] Starting frontend server (port 5200)...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

# Wait for frontend to start
sleep 3
if curl -s http://localhost:5200 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ Frontend might be starting on a different port${NC}"
    echo -e "${YELLOW}  Check logs/frontend.log for the actual port${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   ProcessX is running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Access URLs:"
echo -e "  ${GREEN}Frontend:${NC}    http://localhost:5200"
echo -e "  ${GREEN}Backend API:${NC} http://localhost:3100"
echo -e "  ${GREEN}pgAdmin:${NC}     http://localhost:4100"
echo ""
echo -e "Logs:"
echo -e "  Backend:  tail -f logs/backend.log"
echo -e "  Frontend: tail -f logs/frontend.log"
echo ""
echo -e "To stop all services, run: ${YELLOW}./stop.sh${NC}"
echo ""
