# ProcessX - Getting Started Guide

## Application is Running! 🎉

Your ProcessX application is currently up and running with the following services:

### Active Services

| Service | Status | URL | Credentials |
|---------|--------|-----|-------------|
| **Frontend** | ✅ Running | http://localhost:5200 | N/A |
| **Backend API** | ✅ Running | http://localhost:3100 | N/A |
| **PostgreSQL** | ✅ Running | localhost:5100 | user: `postgres`, pass: `postgres` |
| **Redis** | ✅ Running | localhost:6100 | N/A |
| **pgAdmin** | ✅ Running | http://localhost:4100 | user: `admin@processx.local`, pass: `admin` |

## Quick Start - Using the Application

### 1. Access the Frontend

Open your browser and navigate to:
```
http://localhost:5200
```

### 2. Register a New Account

1. You'll be redirected to the login page
2. Click "Sign up" link at the bottom
3. Fill in the registration form:
   - **First Name**: Your first name
   - **Last Name**: Your last name
   - **Email**: Valid email address
   - **Organization Name**: Your company/organization name
   - **Password**: Min 8 characters, include uppercase, lowercase, and number

Example:
```
First Name: John
Last Name: Doe
Email: john.doe@example.com
Organization Name: Acme Insurance
Password: Password123
```

4. Click "Create account"
5. You'll be automatically logged in and redirected to the dashboard

### 3. Explore the Dashboard

Once logged in, you'll see:
- **Statistics Cards**: Shows total processes, pain points, and optimizations (currently 0)
- **Quick Actions**: Buttons for creating processes and viewing templates (coming in Phase 2)
- **Navigation**: Your name and sign out button in the top right

### 4. Test the Authentication

**Logout:**
- Click the "Sign out" button in the top right
- You'll be redirected to the login page

**Login:**
- Enter your email and password
- Click "Sign in"
- You'll be redirected back to the dashboard

**Session Persistence:**
- Close the browser
- Reopen and navigate to http://localhost:5200
- You should still be logged in (token stored in localStorage)

## Testing the API Directly

You can test the backend API using curl:

### Health Check
```bash
curl http://localhost:3100/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-28T22:XX:XX.XXXZ"}
```

### Register a User
```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Org"
  }'
```

Expected response:
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "admin",
    "organizationId": "..."
  },
  "organization": {
    "id": "...",
    "name": "Test Org"
  }
}
```

### Login
```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### Get Current User
```bash
# First, save the token from register or login response
TOKEN="your-jwt-token-here"

curl http://localhost:3100/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Database Management

### Using pgAdmin

1. Navigate to http://localhost:4100
2. Login with:
   - Email: `admin@processx.local`
   - Password: `admin`
3. Add server:
   - Right-click "Servers" → Register → Server
   - General tab:
     - Name: ProcessX Local
   - Connection tab:
     - Host: `processx-postgres` (or `host.docker.internal` on Mac/Windows)
     - Port: `5432` (internal container port)
     - Database: `processx`
     - Username: `postgres`
     - Password: `postgres`
4. Click "Save"
5. Explore the database schema under: ProcessX Local → Databases → processx → Schemas → public → Tables

### Using psql (Command Line)

```bash
# Connect to PostgreSQL
PGPASSWORD=postgres psql -h localhost -p 5100 -U postgres -d processx

# List tables
\dt

# View users
SELECT * FROM "User";

# View organizations
SELECT * FROM "Organization";

# Exit
\q
```

## Managing the Application

### Stopping the Services

**Stop Frontend and Backend:**
```bash
# In the terminals where they're running, press Ctrl+C
```

**Stop Docker Services:**
```bash
cd /home/pascal/Software/ProcessX
docker compose down
```

### Starting the Services Again

**Start Docker Services:**
```bash
cd /home/pascal/Software/ProcessX
docker compose up -d
```

**Start Backend:**
```bash
cd /home/pascal/Software/ProcessX/backend
npm run dev
```

**Start Frontend:**
```bash
cd /home/pascal/Software/ProcessX/frontend
npm run dev
```

### Viewing Logs

**Backend Logs:**
- Visible in the terminal where backend is running

**Frontend Logs:**
- Visible in the terminal where frontend is running

**Docker Logs:**
```bash
# PostgreSQL
docker logs processx-postgres

# Redis
docker logs processx-redis

# pgAdmin
docker logs processx-pgadmin

# Follow logs in real-time
docker logs -f processx-postgres
```

## Development Workflow

### Making Code Changes

**Backend Changes:**
- Edit files in `backend/src/`
- The server will automatically restart (using tsx watch)
- Check the terminal for any errors

**Frontend Changes:**
- Edit files in `frontend/src/`
- Vite will automatically hot-reload
- Changes appear instantly in the browser

**Database Schema Changes:**
1. Edit `backend/prisma/schema.prisma`
2. Run migration:
   ```bash
   cd backend
   npx prisma migrate dev --name your_migration_name
   ```
3. Prisma Client will be regenerated automatically

### Running Tests

**Backend Tests:**
```bash
cd backend
npm test
```

All 23 tests should pass:
- ✓ 9 password utility tests
- ✓ 9 JWT utility tests
- ✓ 5 auth middleware tests

**Frontend Tests:**
```bash
cd frontend
npm test
# (Tests not yet implemented - Phase 2)
```

### Code Quality

**Backend Linting:**
```bash
cd backend
npm run lint  # (if configured)
```

**TypeScript Type Checking:**
```bash
# Backend
cd backend
npx tsc --noEmit

# Frontend
cd frontend
npx tsc --noEmit
```

## Troubleshooting

### Frontend Can't Connect to Backend

**Symptoms:** "Failed to fetch" errors, network errors in browser console

**Solutions:**
1. Verify backend is running: `curl http://localhost:3100/health`
2. Check browser console for CORS errors
3. Verify frontend .env has correct API URL:
   ```env
   VITE_API_URL=http://localhost:3100
   ```
4. Restart frontend after .env changes:
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

### Database Connection Errors

**Symptoms:** "Authentication failed" or "database not found"

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```
2. Test connection:
   ```bash
   PGPASSWORD=postgres psql -h localhost -p 5100 -U postgres -d processx
   ```
3. Check DATABASE_URL in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5100/processx?schema=public"
   ```
4. Re-run migrations:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

### Port Already in Use

**Symptoms:** "EADDRINUSE: address already in use"

**Solutions:**
1. Find process using the port:
   ```bash
   # Linux/Mac
   lsof -i :3100  # or :5200

   # Kill the process
   kill -9 <PID>
   ```
2. Or use different ports by editing:
   - Backend: `backend/.env` → `PORT=3101`
   - Frontend: `frontend/vite.config.ts` → `port: 5201`

### Login/Registration Not Working

**Common Issues:**

1. **Password validation failure:**
   - Ensure password is at least 8 characters
   - Include uppercase, lowercase, and number
   - Example: `Password123`

2. **Email already exists:**
   - Use a different email
   - Or delete the user from database:
     ```sql
     DELETE FROM "User" WHERE email = 'test@example.com';
     ```

3. **Token not being stored:**
   - Check browser console for localStorage errors
   - Try in incognito mode to rule out browser extensions

4. **Redirect loop:**
   - Clear localStorage: Open browser console and run:
     ```javascript
     localStorage.clear();
     ```
   - Refresh the page

## Next Steps

### Current Features (Phase 1 - Complete)

- ✅ User registration with organization creation
- ✅ Secure authentication with JWT
- ✅ Login/logout functionality
- ✅ Protected routes
- ✅ Session persistence
- ✅ Dashboard UI

### Coming Soon (Phase 2)

- 🔄 Interactive process mapping with ReactFlow
- 🔄 Process step creation and editing
- 🔄 Process visualization controls
- 🔄 Save and load processes
- 🔄 Process templates

### Future Phases

**Phase 3: Pain Point Analysis**
- AI-powered pain point detection
- Manual pain point annotation
- Pain point categorization and impact analysis

**Phase 4: Optimization & Export**
- AI-generated target process recommendations
- PowerPoint export functionality
- PDF, Excel, and Word exports
- Process comparison views

## Development Resources

### Documentation

- [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md) - Complete project specifications
- [TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md) - Technology decisions
- [PHASE1_PROGRESS.md](./PHASE1_PROGRESS.md) - Backend authentication details
- [FRONTEND_AUTHENTICATION.md](./FRONTEND_AUTHENTICATION.md) - Frontend implementation guide
- [PORT_CONFIGURATION.md](./PORT_CONFIGURATION.md) - Port configuration reference
- [SETUP.md](./SETUP.md) - Initial setup instructions

### API Documentation

**Authentication Endpoints:**
- `POST /api/auth/register` - Create new user and organization
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user (requires auth)

### Database Schema

Key tables:
- `User` - User accounts
- `Organization` - Multi-tenant organizations
- `Process` - As-is processes (Phase 2)
- `ProcessStep` - Individual process steps (Phase 2)
- `PainPoint` - Identified pain points (Phase 3)
- `Recommendation` - AI recommendations (Phase 4)

Full schema: `backend/prisma/schema.prisma`

## Support

### Common Commands Reference

```bash
# Start everything
docker compose up -d && cd backend && npm run dev &
cd ../frontend && npm run dev

# Stop everything
pkill -f "tsx watch"
pkill -f "vite"
docker compose down

# Reset database
cd backend
npx prisma migrate reset

# View database in Prisma Studio
cd backend
npx prisma studio
# Opens at http://localhost:5555

# Check service status
curl http://localhost:3100/health  # Backend
curl http://localhost:5200          # Frontend
docker ps                            # Docker services

# Rebuild everything
npm install  # In both backend/ and frontend/
docker compose down -v  # Remove volumes
docker compose up -d
cd backend && npx prisma migrate dev
```

## Congratulations! 🎊

Your ProcessX application is fully set up and ready for development. You have:

- ✅ Complete authentication system
- ✅ Working frontend and backend
- ✅ PostgreSQL database with full schema
- ✅ Docker services (PostgreSQL, Redis, pgAdmin)
- ✅ All tests passing
- ✅ Development servers running with hot-reload

Navigate to **http://localhost:5200** to start using the application!
