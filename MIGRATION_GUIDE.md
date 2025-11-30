# Database Migration Guide - Local to Railway

This guide will help you migrate all your data from your local PostgreSQL database to Railway.

## Prerequisites

- Railway CLI installed (`npm install -g @railway/cli`)
- Logged into Railway CLI (`railway login`)
- Railway project linked (`railway link` in the project directory)

## Step-by-Step Migration

### Step 1: Export Data from Local Database

From the project root directory:

```bash
cd backend
tsx ../scripts/export-data.ts
```

This will create a JSON file in `exports/data-export-YYYY-MM-DDTHH-MM-SS.json` with all your data.

### Step 2: Get Railway Database URL

Option A - Using Railway CLI:
```bash
railway variables --service backend | grep DATABASE_URL
```

Option B - From Railway Dashboard:
1. Go to your Railway project
2. Click on the backend service
3. Go to "Variables" tab
4. Copy the `DATABASE_URL` value

### Step 3: Import Data to Railway Database

Using the exported file from Step 1 and the DATABASE_URL from Step 2:

```bash
cd backend
DATABASE_URL="postgresql://postgres:..." tsx ../scripts/import-data.ts ../exports/data-export-YYYY-MM-DDTHH-MM-SS.json
```

Replace:
- `postgresql://postgres:...` with your actual Railway DATABASE_URL
- `data-export-YYYY-MM-DDTHH-MM-SS.json` with the actual filename from Step 1

### Step 4: Verify Migration

1. Check the import output for any errors
2. Log into your Railway-deployed app at https://processx.up.railway.app
3. Verify you can see your:
   - Organizations
   - Users (you should be able to log in)
   - Processes
   - AI Analyses
   - Templates

## Alternative: Using Railway CLI Shell

You can also run the import directly in Railway's environment:

```bash
# Navigate to backend directory
cd backend

# Copy your export file to a temporary location
cp ../exports/data-export-*.json /tmp/data-export.json

# Run import using Railway's database connection
railway run tsx ../scripts/import-data.ts /tmp/data-export.json
```

## Troubleshooting

### "Connection refused" Error
- Make sure your Railway database is running
- Verify the DATABASE_URL is correct
- Check that your IP is allowed (Railway allows all IPs by default)

### "Unique constraint violation" Error
- The import script uses `upsert`, so this shouldn't happen
- If it does, the data already exists in the target database

### "Foreign key constraint" Error
- Make sure you're importing the full export file
- The script imports in the correct order to respect foreign keys

### "Cannot find module" Error
```bash
# Make sure you're in the backend directory
cd backend

# Install dependencies if needed
npm install
```

## Data Included in Migration

The migration includes:
- ✅ Organizations
- ✅ Users (with encrypted passwords)
- ✅ API Configurations
- ✅ Processes (AS-IS and TO-BE)
- ✅ Process Steps
- ✅ Process Connections
- ✅ Pain Points
- ✅ Recommendations
- ✅ AI Analyses
- ✅ Target Processes
- ✅ Process Templates
- ✅ Export Histories

## Important Notes

1. **Passwords**: User passwords are already hashed, so they will work as-is in Railway
2. **IDs**: All UUIDs are preserved, so relationships remain intact
3. **Timestamps**: All created/updated timestamps are preserved
4. **No Data Loss**: The import uses `upsert`, so existing data won't be overwritten
5. **Rollback**: If something goes wrong, you can delete the Railway database and recreate it

## After Migration

1. Update your local `.env` to use Railway database (optional):
   ```
   DATABASE_URL="postgresql://postgres:...@railway.app/railway"
   ```

2. Or keep using local database for development and Railway for production

3. Consider setting up regular backups:
   ```bash
   # Export local data regularly
   tsx ../scripts/export-data.ts
   ```

## Security Notes

- ⚠️ Keep your export files secure - they contain sensitive data
- ⚠️ Don't commit export files to Git (already in .gitignore)
- ⚠️ Delete export files after successful migration
- ⚠️ The DATABASE_URL contains your database credentials - keep it secret
