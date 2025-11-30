# Password Reset Guide for Railway

## Get the Public DATABASE_URL

The `railway run` command uses an internal DATABASE_URL that's not accessible from your local machine. You need to get the **public** DATABASE_URL instead.

### Option 1: Using Railway CLI (Recommended)

```bash
# Get the public database URL
railway variables --service ProcessX_backend | grep DATABASE_URL
```

This will show you the DATABASE_URL that the backend service uses. Copy the entire connection string.

### Option 2: Using Railway Dashboard

1. Go to your Railway project: https://railway.app/project/your-project-id
2. Click on the **PostgreSQL database service** (not the ProcessX_backend service)
3. Click on the **"Connect"** or **"Variables"** tab
4. Look for **"Database Public URL"** or similar
5. Copy the full connection string (it should look like `postgresql://postgres:password@roundhouse.proxy.rlwy.net:port/railway`)

### Option 3: Construct Public URL from Parts

If you see individual variables like `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, you can construct the URL:

```
postgresql://PGUSER:PGPASSWORD@PGHOST:PGPORT/PGDATABASE
```

## Reset the Password

Once you have the public DATABASE_URL:

```bash
cd backend
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@roundhouse.proxy.rlwy.net:PORT/railway" npx tsx scripts/reset-password.ts tiziana@ballester.de "NewPassword123!"
```

Replace:
- `YOUR_PASSWORD` - with your actual database password
- `PORT` - with your actual database port
- `NewPassword123!` - with the desired new password (min 8 characters)

## Verify the Reset

After running the script, you should see:

```
🔐 Resetting password...

👤 User found:
   Name: Tiziana Ballester
   Email: tiziana@ballester.de
   ID: user-uuid

✅ Password reset successfully!

📧 Email: tiziana@ballester.de
🔑 New Password: NewPassword123!

⚠️  Remember to change this password after logging in!
```

Then you can log in at https://processx.up.railway.app with:
- Email: `tiziana@ballester.de`
- Password: `NewPassword123!` (or whatever you set)

## Troubleshooting

### "Can't reach database server" error
- Make sure you're using the **public** DATABASE_URL (with `roundhouse.proxy.rlwy.net` or similar external hostname)
- Do NOT use the internal URL with `postgres.railway.internal`

### "User not found" error
- Check that the email is spelled correctly
- Verify the user exists in the Railway database (check after data import completed)

### "Connection timeout" error
- Railway database might be sleeping (on free tier)
- Try accessing the Railway app first to wake it up
- Then try the password reset again
