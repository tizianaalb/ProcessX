# Railway Environment Variables Configuration

## Quick Reference

### PostgreSQL Database Service
**No manual variables needed** - Railway automatically provisions the database and creates the `DATABASE_URL` variable.

---

## Backend Service Environment Variables

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Port (automatically set by Railway, but you can override)
PORT=3100

# Database Connection (automatically set when you link the PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Frontend URL (set after deploying frontend - update with actual URL)
FRONTEND_URL=https://your-frontend-name.railway.app

# JWT Configuration (generate a strong random secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-openssl-rand-base64-32
JWT_EXPIRES_IN=7d

# AI API Keys (at least one is required for AI features to work)
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-api-key-here
GOOGLE_AI_API_KEY=AIzaSy-your-google-ai-api-key-here
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
GROQ_API_KEY=gsk_your-groq-api-key-here
```

### Optional Variables

```bash
# AWS S3 for file storage (optional - only if you want to use S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1
```

---

## Frontend Service Environment Variables

### Required Variables

```bash
# Backend API URL (set after deploying backend - update with actual URL)
VITE_API_URL=https://your-backend-name.railway.app
```

---

## Step-by-Step Setup Order

### 1. Deploy PostgreSQL Database
1. In Railway, click "New Service" → "Database" → "PostgreSQL"
2. Railway will automatically create `DATABASE_URL`
3. No manual configuration needed

### 2. Deploy Backend Service

1. Add service from GitHub repo, set root directory to `/backend`
2. Add these environment variables in order:

**Basic Configuration:**
```bash
NODE_ENV=production
PORT=3100
```

**Database (reference the Postgres service):**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**JWT Secret (generate with: openssl rand -base64 32):**
```bash
JWT_SECRET=<paste-your-generated-secret-here>
JWT_EXPIRES_IN=7d
```

**AI API Keys (add the ones you have):**
```bash
ANTHROPIC_API_KEY=<your-claude-api-key>
GOOGLE_AI_API_KEY=<your-gemini-api-key>
OPENAI_API_KEY=<your-openai-api-key>
GROQ_API_KEY=<your-groq-api-key>
```

**Frontend URL (placeholder - will update after frontend is deployed):**
```bash
FRONTEND_URL=https://placeholder.railway.app
```

3. Deploy the backend
4. Once deployed, go to "Settings" → "Domains" → "Generate Domain"
5. Copy the generated backend URL (e.g., `https://processx-backend-production-xxxx.railway.app`)

### 3. Deploy Frontend Service

1. Add service from GitHub repo, set root directory to `/frontend`
2. Add this environment variable:

```bash
VITE_API_URL=https://your-backend-url-from-step-2.railway.app
```

3. Deploy the frontend
4. Once deployed, go to "Settings" → "Domains" → "Generate Domain"
5. Copy the generated frontend URL (e.g., `https://processx-frontend-production-xxxx.railway.app`)

### 4. Update Backend FRONTEND_URL

1. Go back to your backend service
2. Update the `FRONTEND_URL` environment variable with the actual frontend URL from step 3
3. Railway will automatically redeploy the backend with the updated CORS configuration

---

## How to Generate Secrets

### JWT_SECRET
Generate a strong random secret using OpenSSL:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

**Example output:** `K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=`

---

## Getting AI API Keys

### Anthropic (Claude)
1. Sign up at https://console.anthropic.com
2. Go to "API Keys" section
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### OpenAI (GPT)
1. Sign up at https://platform.openai.com
2. Go to "API Keys" section
3. Create a new API key
4. Copy the key (starts with `sk-proj-` or `sk-`)

### Google AI (Gemini)
1. Sign up at https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key (starts with `AIza`)

### Groq
1. Sign up at https://console.groq.com
2. Go to "API Keys" section
3. Create a new API key
4. Copy the key (starts with `gsk_`)

---

## Railway Variable Reference Syntax

When linking services, use Railway's reference syntax:

- `${{Postgres.DATABASE_URL}}` - References the DATABASE_URL from your Postgres service
- `${{RAILWAY_STATIC_URL}}` - Your service's Railway-provided URL
- `${{RAILWAY_ENVIRONMENT}}` - Current environment (production, staging, etc.)

---

## Verification Checklist

After setting all variables:

- [ ] PostgreSQL database is running
- [ ] Backend has DATABASE_URL linked to Postgres
- [ ] Backend has JWT_SECRET set (strong random value)
- [ ] Backend has at least one AI API key configured
- [ ] Backend has FRONTEND_URL set to actual frontend domain
- [ ] Frontend has VITE_API_URL set to actual backend domain
- [ ] Backend health check works: `https://your-backend.railway.app/health`
- [ ] Frontend loads successfully: `https://your-frontend.railway.app`
- [ ] Can register a new account
- [ ] Can log in successfully

---

## Common Issues

### CORS Errors
**Problem:** Frontend can't connect to backend
**Solution:** Make sure `FRONTEND_URL` in backend matches the exact frontend domain (including https://)

### Database Connection Errors
**Problem:** Backend can't connect to database
**Solution:** Ensure `DATABASE_URL` is properly linked using `${{Postgres.DATABASE_URL}}`

### AI Features Not Working
**Problem:** AI analysis fails
**Solution:** Verify at least one AI API key is set and valid

### 401 Unauthorized Errors
**Problem:** Authentication fails
**Solution:** Check that `JWT_SECRET` is set and consistent across deployments

---

## Security Best Practices

1. **Never commit API keys** to the repository
2. **Use strong JWT secrets** (minimum 32 characters random)
3. **Rotate API keys** regularly
4. **Use different secrets** for different environments (development/production)
5. **Monitor API usage** to detect unauthorized access
6. **Enable rate limiting** (already configured in the code)
7. **Use HTTPS only** (Railway provides this automatically)

---

## Cost Estimation

- **PostgreSQL Database**: ~$5/month (Hobby plan)
- **Backend Service**: ~$5/month (Hobby plan)
- **Frontend Service**: ~$5/month (Hobby plan)
- **AI API Costs**: Variable based on usage
  - Anthropic Claude: ~$0.015 per 1K tokens
  - OpenAI GPT-4: ~$0.03 per 1K tokens
  - Google Gemini: Free tier available
  - Groq: Very low cost

**Total Railway Cost**: ~$15/month (excluding AI API usage)
