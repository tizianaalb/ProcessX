#!/bin/bash
#
# ProcessX Prerequisites Installation Script
# Run with: sudo ./scripts/install-prerequisites.sh
#
# This script installs all required software for running ProcessX locally.
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  ProcessX Prerequisites Installer${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (use sudo)${NC}"
    echo "Usage: sudo ./scripts/install-prerequisites.sh"
    exit 1
fi

echo -e "${YELLOW}Installing for user: ${ACTUAL_USER}${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

#----------------------------------------------
# Update package lists
#----------------------------------------------
echo -e "${BLUE}[1/6] Updating package lists...${NC}"
apt-get update -qq
print_status $? "Package lists updated"
echo ""

#----------------------------------------------
# Install basic dependencies
#----------------------------------------------
echo -e "${BLUE}[2/6] Installing basic dependencies...${NC}"
apt-get install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    netcat-openbsd
print_status $? "Basic dependencies installed"
echo ""

#----------------------------------------------
# Install Docker
#----------------------------------------------
echo -e "${BLUE}[3/6] Installing Docker...${NC}"

if command_exists docker; then
    echo -e "${YELLOW}Docker already installed, skipping...${NC}"
    docker --version
else
    # Clean up any failed Docker repo configurations
    rm -f /etc/apt/sources.list.d/docker.list 2>/dev/null || true
    rm -f /etc/apt/keyrings/docker.asc 2>/dev/null || true
    apt-get update -qq

    # Use Ubuntu's built-in docker.io package (reliable for Ubuntu 24.04)
    echo "Installing Docker from Ubuntu repositories..."
    apt-get install -y docker.io containerd

    # Enable and start Docker
    systemctl enable docker
    systemctl start docker

    print_status $? "Docker installed"
fi
echo ""

#----------------------------------------------
# Install Docker Compose
#----------------------------------------------
echo -e "${BLUE}[4/6] Installing Docker Compose...${NC}"

if command_exists docker-compose || docker compose version &>/dev/null; then
    echo -e "${YELLOW}Docker Compose already available, skipping...${NC}"
    docker compose version 2>/dev/null || docker-compose --version
else
    # Install docker-compose from Ubuntu repos
    echo "Installing Docker Compose from Ubuntu repositories..."
    apt-get install -y docker-compose-v2

    # Also install standalone docker-compose for compatibility
    if ! command_exists docker-compose; then
        echo "Installing standalone docker-compose..."
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
        curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    print_status $? "Docker Compose installed"
fi
echo ""

#----------------------------------------------
# Install PostgreSQL Client
#----------------------------------------------
echo -e "${BLUE}[5/6] Installing PostgreSQL client...${NC}"

if command_exists psql; then
    echo -e "${YELLOW}PostgreSQL client already installed, skipping...${NC}"
    psql --version
else
    apt-get install -y -qq postgresql-client
    print_status $? "PostgreSQL client installed"
fi
echo ""

#----------------------------------------------
# Configure Docker for non-root user
#----------------------------------------------
echo -e "${BLUE}[6/6] Configuring Docker for user ${ACTUAL_USER}...${NC}"

# Add user to docker group
if getent group docker > /dev/null 2>&1; then
    usermod -aG docker "$ACTUAL_USER"
    print_status $? "User added to docker group"
else
    groupadd docker
    usermod -aG docker "$ACTUAL_USER"
    print_status $? "Docker group created and user added"
fi

# Start and enable Docker service
systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
systemctl enable docker 2>/dev/null || true
echo ""

#----------------------------------------------
# Verification
#----------------------------------------------
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Installation Verification${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

echo "Installed versions:"
echo -e "  Node.js:        $(node --version 2>/dev/null || echo 'Not installed')"
echo -e "  npm:            $(npm --version 2>/dev/null || echo 'Not installed')"
echo -e "  Git:            $(git --version 2>/dev/null || echo 'Not installed')"
echo -e "  Docker:         $(docker --version 2>/dev/null || echo 'Not installed')"
echo -e "  Docker Compose: $(docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || echo 'Not installed')"
echo -e "  PostgreSQL:     $(psql --version 2>/dev/null || echo 'Not installed')"
echo ""

#----------------------------------------------
# Final Instructions
#----------------------------------------------
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: You need to log out and log back in${NC}"
echo -e "${YELLOW}for Docker group changes to take effect.${NC}"
echo ""
echo "Or run this command to apply changes in current session:"
echo -e "  ${BLUE}newgrp docker${NC}"
echo ""
echo "Then start ProcessX with:"
echo -e "  ${BLUE}cd /home/tiziana/Software/ProcessX${NC}"
echo -e "  ${BLUE}docker compose up -d${NC}"
echo -e "  ${BLUE}cd backend && npm install && npx prisma migrate dev && npm run dev${NC}"
echo -e "  ${BLUE}cd frontend && npm install && npm run dev${NC}"
echo ""
echo -e "${GREEN}Database will be available at: localhost:5100${NC}"
echo -e "${GREEN}pgAdmin will be available at: http://localhost:4100${NC}"
echo -e "${GREEN}  Email: admin@processx.local${NC}"
echo -e "${GREEN}  Password: admin${NC}"
echo ""
