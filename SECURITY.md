# Security Setup Instructions

## Before Deploying to Production

### 1. Generate a Strong JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and set it as `JWT_SECRET` in your environment variables.

### 2. Set a Strong Admin Password
Set `ADMIN_PASSWORD` to a password with:
- At least 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Example generator: `openssl rand -base64 16`

**Delete the local database** after changing the password so it re-seeds:
```bash
rm data/billy.db
```

### 3. Environment Variables on Vercel/Server
- Set `NODE_ENV=production`
- Set `JWT_SECRET` to your generated secret
- Set `ADMIN_PASSWORD` to your strong password
- **NEVER** commit `.env.local` to git

### 4. HTTPS
- Always deploy behind HTTPS
- Vercel provides this automatically
- For VPS: use Let's Encrypt / Nginx

### 5. Database Backup
- SQLite file is at `data/billy.db`
- Back up regularly
- Never expose the `data/` directory publicly

## Security Features Implemented
- ✅ Rate limiting on login (5 attempts / 15 min)
- ✅ bcrypt password hashing (cost factor 12)
- ✅ httpOnly + SameSite=Strict cookies
- ✅ JWT tokens (24h expiry)
- ✅ File upload validation (MIME + magic bytes + size)
- ✅ All DB queries use parameterized statements
- ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Input validation + length limits on all APIs
- ✅ No secrets in source code
