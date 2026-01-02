#!/bin/bash

# ProcessX Stop Script
# This script stops all ProcessX services

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ProcessX - Stopping Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Stop frontend
echo -e "${YELLOW}[1/3] Stopping frontend server...${NC}"
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null
        sleep 1
        # Force kill if still running
        kill -9 $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend server stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}  Frontend process not running${NC}"
    fi
    rm -f logs/frontend.pid
else
    echo -e "${YELLOW}  No frontend PID file found${NC}"
fi

# Kill any remaining vite processes specific to ProcessX
pkill -f "ProcessX/frontend.*vite" 2>/dev/null && echo -e "${GREEN}✓ Cleaned up remaining ProcessX vite processes${NC}" || true

# Stop backend
echo -e "${YELLOW}[2/3] Stopping backend server...${NC}"
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null
        sleep 1
        # Force kill if still running
        kill -9 $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Backend server stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}  Backend process not running${NC}"
    fi
    rm -f logs/backend.pid
else
    echo -e "${YELLOW}  No backend PID file found${NC}"
fi

# Kill any remaining tsx processes specific to ProcessX backend
pkill -f "ProcessX/backend.*tsx" 2>/dev/null && echo -e "${GREEN}✓ Cleaned up remaining ProcessX tsx processes${NC}" || true

# Stop Docker services (optional - controlled by flag)
echo -e "${YELLOW}[3/3] Stopping Docker services...${NC}"
if [ "$1" == "--keep-db" ]; then
    echo -e "${YELLOW}  Keeping Docker services running (--keep-db flag)${NC}"
else
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        docker compose down 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Docker services stopped${NC}"
        else
            echo -e "${YELLOW}  Docker services might not be running${NC}"
        fi
    else
        echo -e "${YELLOW}  Docker not available, skipping${NC}"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All ProcessX services stopped${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "To start again: ${YELLOW}./start.sh${NC}"
echo -e "To stop but keep database: ${YELLOW}./stop.sh --keep-db${NC}"
echo ""
