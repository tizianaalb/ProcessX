# ProcessX - Setup Guide

This guide will help you set up the ProcessX development environment on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ LTS ([Download](https://nodejs.org/))
- **npm** 10+ (comes with Node.js)
- **Docker** and **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))
- **PostgreSQL** (optional if using Docker)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ProcessX
```

### 2. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **pgAdmin** on port `5050` (optional database UI)

To verify services are running:

```bash
docker-compose ps
```

### 3. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys (optional for now)
# - ANTHROPIC_API_KEY
# - GOOGLE_AI_API_KEY
# - OPENAI_API_KEY
# - GROQ_API_KEY

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database (optional)
# npm run seed

# Start the development server
npm run dev
```

The backend API will be running at `http://localhost:3000`

### 4. Set Up Frontend

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be running at `http://localhost:5173`

### 5. Verify Installation

- **Frontend:** Open http://localhost:5173 in your browser
- **Backend API:** Open http://localhost:3000/health in your browser
- **pgAdmin:** Open http://localhost:5050 in your browser
  - Email: `admin@processx.local`
  - Password: `admin`

---

## Development Workflow

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Database (if needed):**
```bash
# View logs
docker-compose logs -f postgres

# Stop services
docker-compose down

# Start services
docker-compose up -d
```

### Working with the Database

**View Database with Prisma Studio:**
```bash
cd backend
npx prisma studio
```
Opens at `http://localhost:5555`

**Create a New Migration:**
```bash
cd backend
npx prisma migrate dev --name description_of_changes
```

**Reset Database (⚠️ Deletes all data):**
```bash
cd backend
npx prisma migrate reset
```

**Generate Prisma Client (after schema changes):**
```bash
cd backend
npx prisma generate
```

---

## Project Structure

```
ProcessX/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── features/         # Feature modules
│   │   ├── lib/              # Utilities and helpers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API clients
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   └── package.json
│
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilities
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
│
├── docs/                     # Documentation
├── docker-compose.yml        # Docker services configuration
└── README.md                 # Project overview
```

---

## Environment Variables

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/processx?schema=public"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI APIs (add your keys)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
OPENAI_API_KEY=sk-...
GROQ_API_KEY=...
```

### Frontend (.env - if needed)

```env
VITE_API_URL=http://localhost:3000
```

---

## Available Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Database Schema

The database schema is defined in `backend/prisma/schema.prisma` and includes:

### Core Tables

- **organizations** - Multi-tenant organization management
- **users** - User accounts and authentication
- **processes** - Process definitions
- **process_steps** - Individual process steps
- **process_connections** - Flow connections between steps
- **pain_points** - Identified issues and bottlenecks
- **recommendations** - AI-generated optimization suggestions
- **target_processes** - Optimized process versions
- **process_templates** - Reusable process templates
- **exports** - Export history and files
- **audit_logs** - Change tracking and audit trail

### Entity Relationship

```
Organization (1) ---> (N) User
Organization (1) ---> (N) Process
User (1) ---> (N) Process (created_by)
Process (1) ---> (N) ProcessStep
Process (1) ---> (N) ProcessConnection
Process (1) ---> (N) PainPoint
Process (1) ---> (N) Recommendation
Process (1) ---> (N) Export
```

---

## Adding AI API Keys

To enable AI features, you'll need to obtain API keys from the following providers:

### 1. Anthropic (Claude)

1. Visit https://console.anthropic.com/
2. Sign up and create an API key
3. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

### 2. Google (Gemini)

1. Visit https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to `.env`: `GOOGLE_AI_API_KEY=...`

### 3. OpenAI (GPT-4)

1. Visit https://platform.openai.com/api-keys
2. Create an API key
3. Add to `.env`: `OPENAI_API_KEY=sk-...`

### 4. Groq (Llama)

1. Visit https://console.groq.com/
2. Create an API key
3. Add to `.env`: `GROQ_API_KEY=...`

**Note:** AI features will work without these keys during development, but will return mock data.

---

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

**Backend (port 3000):**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Frontend (port 5173):**
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**PostgreSQL (port 5432):**
```bash
docker-compose down
docker-compose up -d
```

### Database Connection Errors

1. Verify Docker services are running:
```bash
docker-compose ps
```

2. Check PostgreSQL logs:
```bash
docker-compose logs postgres
```

3. Restart database:
```bash
docker-compose restart postgres
```

### Prisma Errors

**"Prisma Client did not initialize yet"**
```bash
cd backend
npx prisma generate
```

**Migration errors:**
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

### Frontend Build Errors

1. Clear node_modules and reinstall:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

2. Clear Vite cache:
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## Testing the Setup

### 1. Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api
```

### 2. Test Database Connection

```bash
cd backend
npx prisma studio
```

Open http://localhost:5555 and verify you can see the database tables.

### 3. Test Frontend

Open http://localhost:5173 in your browser. You should see the ProcessX application.

---

## Next Steps

Once your development environment is set up:

1. **Explore the codebase** - Review the project structure
2. **Read the documentation** - Check PROJECT_PROPOSAL.md for detailed specifications
3. **Create your first process** - Use the UI to create a sample process
4. **Add AI API keys** - Enable AI-powered features
5. **Start building** - Implement new features!

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Express Documentation](https://expressjs.com/)
- [ReactFlow Documentation](https://reactflow.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

## Support

If you encounter any issues:

1. Check this setup guide
2. Review the troubleshooting section
3. Check project documentation in `/docs`
4. Create an issue in the repository

---

**Happy Coding!** 🚀
