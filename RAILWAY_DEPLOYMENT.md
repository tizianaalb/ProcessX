# Railway Deployment Guide for ProcessX

This guide provides step-by-step instructions for deploying ProcessX to Railway.app.

## Overview

ProcessX consists of three services that need to be deployed:
1. **PostgreSQL Database** - Managed PostgreSQL instance
2. **Backend API** - Node.js/Express API server
3. **Frontend** - React/Vite application

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account with ProcessX repository access
- API keys for AI services (Anthropic, OpenAI, Google AI, Groq)

## Deployment Steps

### 1. Create a New Railway Project

1. Log in to Railway
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your ProcessX repository
5. Railway will create a new project

### 2. Deploy PostgreSQL Database

1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL database
4. Note: The `DATABASE_URL` environment variable will be automatically created

### 3. Deploy Backend API

1. Click "New Service" → "GitHub Repo"
2. Select your ProcessX repository
3. Configure the service:
   - **Name**: `processx-backend`
   - **Root Directory**: `/backend`
   - **Build Command**: Uses `railway.json` configuration
   - **Start Command**: Uses `railway.json` configuration

4. Add the following environment variables (Settings → Variables):

```bash
# Node Environment
NODE_ENV=production
PORT=3100

# Database (automatically set by Railway when you link the database)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Frontend URL (will be set after deploying frontend)
FRONTEND_URL=https://your-frontend-url.railway.app

# JWT Configuration
JWT_SECRET=<generate-a-strong-random-secret>
JWT_EXPIRES_IN=7d

# AI API Keys
ANTHROPIC_API_KEY=<your-claude-api-key>
GOOGLE_AI_API_KEY=<your-gemini-api-key>
OPENAI_API_KEY=<your-openai-api-key>
GROQ_API_KEY=<your-groq-api-key>

# Optional: AWS S3 for file storage
# AWS_ACCESS_KEY_ID=<your-aws-access-key>
# AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
# AWS_S3_BUCKET=<your-s3-bucket-name>
# AWS_REGION=us-east-1
```

5. Link the PostgreSQL database:
   - Go to "Settings" → "Service Variables"
   - Click "Add Reference"
   - Select the PostgreSQL database
   - This will add `DATABASE_URL` automatically

6. Deploy:
   - Railway will automatically deploy on push to main branch
   - First deployment will run Prisma migrations via `start:migrate` script

### 4. Deploy Frontend

1. Click "New Service" → "GitHub Repo"
2. Select your ProcessX repository
3. Configure the service:
   - **Name**: `processx-frontend`
   - **Root Directory**: `/frontend`
   - **Build Command**: Uses `railway.json` configuration
   - **Start Command**: Uses `railway.json` configuration

4. Add the following environment variables:

```bash
# Backend API URL (from backend service)
VITE_API_URL=https://your-backend-url.railway.app
```

5. Generate a domain:
   - Go to "Settings" → "Domains"
   - Click "Generate Domain"
   - Copy the generated URL (e.g., `https://processx-frontend-xxx.railway.app`)

6. Update backend `FRONTEND_URL`:
   - Go back to backend service
   - Update `FRONTEND_URL` environment variable with the frontend domain
   - Redeploy backend

### 5. Verify Deployment

1. **Check Backend Health**:
   - Visit `https://your-backend-url.railway.app/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Backend API**:
   - Visit `https://your-backend-url.railway.app/api`
   - Should return API information

3. **Access Frontend**:
   - Visit `https://your-frontend-url.railway.app`
   - Should load the ProcessX application

4. **Test Registration/Login**:
   - Create a new account
   - Log in and verify functionality

## Environment Variable Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Server port (set by Railway) | `3100` |
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.railway.app` |
| `JWT_SECRET` | Secret for JWT tokens | Generate strong secret |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `GOOGLE_AI_API_KEY` | Gemini API key | `AIza...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GROQ_API_KEY` | Groq API key | `gsk_...` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.railway.app` |

## Database Migrations

The backend automatically runs Prisma migrations on startup using the `start:migrate` script:

```bash
npm run start:migrate
# Runs: prisma migrate deploy && node dist/index.js
```

### Manual Migration (if needed)

If you need to run migrations manually:

1. Go to backend service in Railway
2. Click "Settings" → "Deploy"
3. Add a custom deploy command temporarily:
   ```bash
   npm run prisma:migrate:deploy
   ```
4. After migration completes, revert to normal start command

## Custom Domains (Optional)

### Backend Custom Domain

1. Go to backend service → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Add CNAME record to your DNS:
   ```
   CNAME api.yourdomain.com -> your-backend-url.railway.app
   ```

### Frontend Custom Domain

1. Go to frontend service → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Add CNAME record to your DNS:
   ```
   CNAME app.yourdomain.com -> your-frontend-url.railway.app
   ```

5. Update backend `FRONTEND_URL` environment variable with your custom domain

## Monitoring and Logs

### View Logs

1. Go to service in Railway
2. Click "Deployments" tab
3. Select the deployment
4. View real-time logs

### Health Checks

Railway automatically monitors the `/health` endpoint and will restart the service if it fails.

## Troubleshooting

### Database Connection Issues

**Problem**: Backend can't connect to database

**Solutions**:
1. Verify `DATABASE_URL` is set correctly
2. Check database service is running
3. Verify backend service is linked to database
4. Check logs for connection errors

### CORS Errors

**Problem**: Frontend can't connect to backend

**Solutions**:
1. Verify `FRONTEND_URL` in backend matches actual frontend URL
2. Check backend logs for CORS errors
3. Verify both services are deployed and running

### Build Failures

**Problem**: Service fails to build

**Solutions**:
1. Check build logs for specific errors
2. Verify `railway.json` configuration is correct
3. Ensure all dependencies are in `package.json`
4. Check Node.js version compatibility

### Migration Failures

**Problem**: Prisma migrations fail on deployment

**Solutions**:
1. Check database connection
2. Verify Prisma schema is valid
3. Run migrations manually using Railway CLI
4. Check migration files in `prisma/migrations/`

## Costs and Scaling

### Railway Pricing

- **Hobby Plan**: $5/month per service (includes $5 credit)
- **Pro Plan**: Pay as you go based on resource usage
- Database backup and high availability available on Pro plan

### Scaling Recommendations

1. **Database**: Start with Hobby plan, upgrade as needed
2. **Backend**: Monitor memory usage, scale if needed
3. **Frontend**: Static hosting, minimal resources needed

## Security Checklist

- [ ] Use strong `JWT_SECRET` (generate with `openssl rand -base64 32`)
- [ ] Enable HTTPS only (Railway provides SSL automatically)
- [ ] Keep API keys secure (use Railway environment variables)
- [ ] Regular database backups enabled
- [ ] Rate limiting configured (already in code)
- [ ] Helmet security headers enabled (already in code)
- [ ] CORS properly configured
- [ ] Monitor logs for suspicious activity

## Continuous Deployment

Railway automatically deploys when you push to your GitHub repository:

1. Push to `main` branch
2. Railway detects the push
3. Builds and deploys automatically
4. Health checks verify deployment
5. Rollback available if deployment fails

### Disable Auto-Deploy

If you want to deploy manually:
1. Go to service → Settings → Build & Deploy
2. Toggle "Auto Deploy" off
3. Click "Deploy" button manually when ready

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- ProcessX Issues: https://github.com/yourusername/processx/issues

## Next Steps

After successful deployment:

1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure database backups
4. Add custom domains
5. Set up CI/CD pipeline (optional)
6. Document API endpoints
7. Create user onboarding materials
