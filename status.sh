#!/bin/bash

# ProcessX Status Script
# Check the status of all ProcessX services

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ProcessX - Service Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Docker services
echo -e "${BLUE}Docker Services:${NC}"
if docker ps --filter "name=processx" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q processx; then
    docker ps --filter "name=processx" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo -e "${GREEN}✓ Docker services running${NC}"
else
    echo -e "${RED}✗ No Docker services running${NC}"
fi
echo ""

# Check backend
echo -e "${BLUE}Backend Server (Port 3100):${NC}"
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Running (PID: $BACKEND_PID)${NC}"
        if curl -s http://localhost:3100/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Health check passed${NC}"
        else
            echo -e "${RED}✗ Health check failed${NC}"
        fi
    else
        echo -e "${RED}✗ Process not running (stale PID file)${NC}"
    fi
else
    echo -e "${RED}✗ Not running (no PID file)${NC}"
fi
echo ""

# Check frontend
echo -e "${BLUE}Frontend Server (Port 5200):${NC}"
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Running (PID: $FRONTEND_PID)${NC}"
        if curl -s http://localhost:5200 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Responding to requests${NC}"
        else
            echo -e "${RED}✗ Not responding${NC}"
        fi
    else
        echo -e "${RED}✗ Process not running (stale PID file)${NC}"
    fi
else
    echo -e "${RED}✗ Not running (no PID file)${NC}"
fi
echo ""

# Check database connection
echo -e "${BLUE}Database Connection:${NC}"
if PGPASSWORD=postgres psql -h localhost -p 5100 -U postgres -d processx -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL accessible${NC}"
else
    echo -e "${RED}✗ Cannot connect to PostgreSQL${NC}"
fi
echo ""

# Access URLs
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Frontend:    ${GREEN}http://localhost:5200${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:3100${NC}"
echo -e "  API Health:  ${GREEN}http://localhost:3100/health${NC}"
echo -e "  pgAdmin:     ${GREEN}http://localhost:4100${NC}"
echo ""

# Log files
echo -e "${BLUE}Log Files:${NC}"
if [ -f logs/backend.log ]; then
    BACKEND_SIZE=$(du -h logs/backend.log | cut -f1)
    echo -e "  Backend:  logs/backend.log (${BACKEND_SIZE})"
else
    echo -e "  Backend:  ${YELLOW}No log file${NC}"
fi

if [ -f logs/frontend.log ]; then
    FRONTEND_SIZE=$(du -h logs/frontend.log | cut -f1)
    echo -e "  Frontend: logs/frontend.log (${FRONTEND_SIZE})"
else
    echo -e "  Frontend: ${YELLOW}No log file${NC}"
fi
echo ""

echo -e "${BLUE}Commands:${NC}"
echo -e "  View logs:     ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "                 ${YELLOW}tail -f logs/frontend.log${NC}"
echo -e "  Stop services: ${YELLOW}./stop.sh${NC}"
echo -e "  Restart:       ${YELLOW}./start.sh${NC}"
echo ""
