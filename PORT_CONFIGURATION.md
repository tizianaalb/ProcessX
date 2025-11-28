# ProcessX Port Configuration

## Overview

ProcessX uses custom ports to avoid conflicts with other applications running on standard ports.

## Port Assignments

| Service | Port | Default Port | Purpose |
|---------|------|--------------|---------|
| Backend API | 3100 | 3000 | Express REST API server |
| pgAdmin | 4100 | 5050 | PostgreSQL database management UI |
| PostgreSQL (Docker) | 5100 | 5432 | Database server (mapped from container) |
| Frontend | 5200 | 5173 | Vite development server |
| Redis (Docker) | 6100 | 6379 | Cache/job queue (mapped from container) |

## Configuration Files Updated

### Backend Configuration

**File: `backend/.env`**
```env
PORT=3100
FRONTEND_URL=http://localhost:5200
DATABASE_URL="postgresql://postgres:postgres@localhost:5100/processx?schema=public"
```

**File: `backend/.env.example`**
```env
PORT=3100
FRONTEND_URL=http://localhost:5200
DATABASE_URL="postgresql://user:password@localhost:5100/processx?schema=public"
```

**File: `backend/src/index.ts`**
```typescript
const PORT = process.env.PORT || 3100;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5200',
  credentials: true,
}));
```

### Frontend Configuration

**File: `frontend/.env`**
```env
VITE_API_URL=http://localhost:3100
```

**File: `frontend/.env.example`**
```env
VITE_API_URL=http://localhost:3100
```

**File: `frontend/vite.config.ts`**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5200,
  },
})
```

**File: `frontend/src/lib/api.ts`**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';
```

### Docker Configuration

**File: `docker-compose.yml`**
```yaml
services:
  postgres:
    ports:
      - "5100:5432"  # Changed from 5432:5432
  redis:
    ports:
      - "6100:6379"  # Changed from 6379:6379
  pgadmin:
    ports:
      - "4100:80"  # Changed from 5050:80
```

## Access URLs

Once all services are running, access them at:

- **Frontend Application**: http://localhost:5200
- **Backend API**: http://localhost:3100
- **API Health Check**: http://localhost:3100/health
- **pgAdmin**: http://localhost:4100
  - Email: admin@processx.local
  - Password: admin

## Starting the Application

### Option 1: Using Docker Compose (Recommended)

```bash
# Start database and services
docker-compose up -d

# Start backend (in separate terminal)
cd backend
npm run dev
# Backend will run on http://localhost:3100

# Start frontend (in separate terminal)
cd frontend
npm run dev
# Frontend will run on http://localhost:5200
```

### Option 2: Manual Setup

**Terminal 1 - Database:**
```bash
# If using Docker for PostgreSQL only
docker-compose up postgres -d
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Server will start on port 3100
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Server will start on port 5200
```

## Verifying Port Configuration

### Check if ports are in use:
```bash
# Linux/Mac
lsof -i :3100  # Backend
lsof -i :4100  # pgAdmin
lsof -i :5100  # PostgreSQL
lsof -i :5200  # Frontend
lsof -i :6100  # Redis

# Windows
netstat -ano | findstr :3100
netstat -ano | findstr :4100
netstat -ano | findstr :5100
netstat -ano | findstr :5200
netstat -ano | findstr :6100
```

### Test Backend API:
```bash
curl http://localhost:3100/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend:
```bash
# Open browser
open http://localhost:5200
# or
xdg-open http://localhost:5200
```

## Firewall Configuration

If you're running into connection issues, ensure these ports are allowed:

```bash
# Linux (ufw)
sudo ufw allow 3100/tcp  # Backend
sudo ufw allow 5100/tcp  # PostgreSQL
sudo ufw allow 5200/tcp  # Frontend
sudo ufw allow 6100/tcp  # Redis

# Windows Firewall
# Add inbound rules for ports 3100 and 5100
```

## Production Deployment

For production, you should:

1. Use standard HTTPS port (443) with a reverse proxy (nginx/Apache)
2. Configure proper domain names
3. Update CORS settings to match production domain
4. Set environment-specific ports via environment variables

### Example Production nginx Configuration:

```nginx
# Frontend
server {
    listen 443 ssl;
    server_name app.processx.com;

    location / {
        proxy_pass http://localhost:5200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 443 ssl;
    server_name api.processx.com;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

## Troubleshooting

### Issue: Port already in use

**Error:** `EADDRINUSE: address already in use :::3100`

**Solution:**
```bash
# Find process using the port
lsof -i :3100  # Linux/Mac
netstat -ano | findstr :3100  # Windows

# Kill the process
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows

# Or change to different port
# Edit .env file with new port number
```

### Issue: Frontend can't connect to backend

**Symptoms:** Network errors, CORS errors, "Failed to fetch"

**Checklist:**
1. Verify backend is running: `curl http://localhost:3100/health`
2. Check CORS configuration in `backend/src/index.ts`
3. Verify frontend API URL in `frontend/.env`
4. Check browser console for specific errors
5. Ensure no firewall is blocking the connection

### Issue: Changes to .env not taking effect

**Solution:**
```bash
# Restart the development servers
# Stop with Ctrl+C and restart:

# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## Environment Variables Summary

### Backend `.env`
```env
# Server
PORT=3100
NODE_ENV=development
FRONTEND_URL=http://localhost:5100

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/processx?schema=public"

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Frontend `.env`
```env
# API
VITE_API_URL=http://localhost:3100
```

## Notes

- PostgreSQL and Redis use standard ports (5432, 6379) as they don't typically conflict
- Frontend dev server port can be changed in `vite.config.ts`
- Backend port can be changed via `PORT` environment variable
- Always ensure CORS origin matches frontend URL
- In production, use environment-specific configuration
