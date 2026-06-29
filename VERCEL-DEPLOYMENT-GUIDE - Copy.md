# StudentWorks - Vercel Deployment Guide

## ⚠️ Important Notice

**Your app uses SQLite, which is NOT recommended for Vercel because:**
1. Vercel uses **serverless functions** (stateless)
2. SQLite files are **ephemeral** (deleted after each function execution)
3. File uploads won't persist across deployments
4. Database changes will be lost on each deployment

## Recommended Solutions

### Option 1: Use Vercel Postgres (Recommended)
Migrate from SQLite to Vercel Postgres (free tier available)

**Pros:**
- ✅ Persistent database
- ✅ Free tier (60 hours compute/month)
- ✅ No data loss
- ✅ Better performance

**Cons:**
- ❌ Requires database migration
- ❌ Schema changes needed

### Option 2: Use Alternative Hosting (Easier)
Deploy to platforms that support SQLite:

**Recommended Platforms:**
1. **Railway** - https://railway.app
   - ✅ Supports SQLite
   - ✅ Persistent file storage
   - ✅ Easy deployment
   - ✅ Free tier available
   
2. **Render** - https://render.com
   - ✅ Supports SQLite
   - ✅ Background workers
   - ✅ Free tier
   
3. **Fly.io** - https://fly.io
   - ✅ Persistent volumes
   - ✅ SQLite support
   - ✅ Global deployment

4. **DigitalOcean App Platform**
   - ✅ Full Node.js support
   - ✅ Persistent storage
   
5. **Heroku** (if still using free tier alternatives)

---

## If You Still Want Vercel (Not Recommended for SQLite)

### Prerequisites
1. Vercel account
2. GitHub repository (optional but recommended)
3. Vercel CLI installed: `npm i -g vercel`

### Files Already Created
✅ `vercel.json` - Vercel configuration
✅ `.vercelignore` - Files to ignore
✅ `api/index.js` - Serverless function wrapper
✅ Modified `server.js` - Export for Vercel

### Deployment Steps

#### Method 1: Deploy via Vercel CLI (Quick)

1. **Install Vercel CLI** (if not installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
cd c:\Users\Nyoman\Documents\Student-works-qoder
vercel
```

4. **Follow prompts**:
- Set up and deploy? `Y`
- Which scope? (Select your account)
- Link to existing project? `N`
- Project name? `student-works-qoder`
- Directory? `./`
- Override settings? `N`

5. **Deploy to production**:
```bash
vercel --prod
```

#### Method 2: Deploy via GitHub + Vercel Dashboard

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/student-works-qoder.git
git push -u origin main
```

2. **Connect to Vercel**:
- Go to https://vercel.com
- Click "New Project"
- Import your GitHub repository
- Vercel will auto-detect settings
- Click "Deploy"

---

## ⚠️ Critical Issues with Vercel + SQLite

### 1. Database Will Be Lost
Every deployment recreates the database. You'll need to:
- Re-run migrations
- Re-seed data
- Lose all user-generated content

### 2. File Uploads Won't Work
Files uploaded to `/uploads` will disappear after ~10 minutes.

**Solutions:**
- Use **Vercel Blob Storage**: https://vercel.com/docs/storage/vercel-blob
- Use **Cloudinary** for images
- Use **AWS S3** or similar

### 3. Session Management Issues
Express sessions won't work properly in serverless.

**Solution:**
- Use **Vercel KV** (Redis): https://vercel.com/docs/storage/vercel-kv
- Or JWT tokens instead of sessions

---

## Migration Guide: SQLite → Vercel Postgres

### Step 1: Create Vercel Postgres Database

1. Go to Vercel dashboard
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Create database

### Step 2: Install Postgres Client

```bash
npm install pg
```

### Step 3: Update Database Connection

Replace `db/database.js`:

```javascript
// For local development (SQLite)
if (process.env.NODE_ENV !== 'production') {
  const Database = require('better-sqlite3');
  const path = require('path');
  const dbPath = path.join(__dirname, '..', 'studentworks.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  module.exports = db;
}
// For production (Vercel Postgres)
else {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  // Wrapper to make Postgres queries similar to SQLite
  const db = {
    prepare: (sql) => ({
      run: async (...params) => {
        const result = await pool.query(sql, params);
        return { lastID: result.rows[0]?.id, changes: result.rowCount };
      },
      get: async (...params) => {
        const result = await pool.query(sql, params);
        return result.rows[0];
      },
      all: async (...params) => {
        const result = await pool.query(sql, params);
        return result.rows;
      }
    })
  };
  module.exports = db;
}
```

### Step 4: Convert SQL Schema

SQLite → Postgres differences:
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `DATETIME` → `TIMESTAMP`
- `TEXT` → `TEXT` or `VARCHAR`
- `BOOLEAN` → `BOOLEAN` (no change)

---

## Recommended: Deploy to Railway Instead

### Why Railway?
- ✅ **No SQLite issues**
- ✅ **Persistent file storage**
- ✅ **Easier setup**
- ✅ **Better for full-stack apps**
- ✅ **Free $5/month credit**

### Railway Deployment Steps

1. **Sign up**: https://railway.app
2. **Install CLI**:
```bash
npm i -g @railway/cli
```

3. **Login**:
```bash
railway login
```

4. **Initialize**:
```bash
cd c:\Users\Nyoman\Documents\Student-works-qoder
railway init
```

5. **Deploy**:
```bash
railway up
```

6. **Add domain**:
```bash
railway domain
```

That's it! Your SQLite database and uploads will work perfectly.

---

## Recommended: Deploy to Render

### Render Deployment Steps

1. **Sign up**: https://render.com
2. **Create Web Service**:
   - Connect GitHub repository
   - Or deploy via CLI
   
3. **Configure**:
   - **Build Command**: `npm install && npm run migrate`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
   
4. **Add Persistent Disk** (for SQLite):
   - Go to service settings
   - Add disk at `/opt/render/project/src`
   - Mount path: `/opt/render/project/src`
   
5. **Deploy**

---

## Environment Variables

For any platform, set these:

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-super-secret-key-change-this
```

---

## File Upload Solutions

### Option 1: Cloudinary (Recommended)

```bash
npm install cloudinary multer-storage-cloudinary
```

### Option 2: Vercel Blob

```bash
npm install @vercel/blob
```

### Option 3: AWS S3

```bash
npm install aws-sdk multer-s3
```

---

## Post-Deployment Checklist

- [ ] Database is persistent
- [ ] File uploads work
- [ ] Sessions work correctly
- [ ] All routes accessible
- [ ] Static files load (CSS, images)
- [ ] Environment variables set
- [ ] Run database migrations
- [ ] Test all features

---

## Cost Comparison

| Platform | Free Tier | SQLite Support | File Storage | Best For |
|----------|-----------|----------------|--------------|----------|
| **Vercel** | ✅ Yes | ❌ No | Limited | Static/JAMstack |
| **Railway** | ✅ $5/month | ✅ Yes | ✅ Yes | Full-stack Node.js |
| **Render** | ✅ 750 hrs | ✅ Yes | ✅ Paid | Production apps |
| **Fly.io** | ✅ Limited | ✅ Yes | ✅ Yes | Global apps |

---

## My Recommendation

**For StudentWorks specifically:**

### 🥇 **Best Choice: Railway**
- Deploy in 5 minutes
- No code changes needed
- Everything works out of the box
- $5/month free credit

### 🥈 **Alternative: Render**
- More professional
- Better for production
- Free tier available
- Need to configure disk

### 🥉 **Not Recommended: Vercel**
- Requires major refactoring
- Database migration needed
- File upload issues
- Better for Next.js/static sites

---

## Quick Start: Railway Deployment

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd c:\Users\Nyoman\Documents\Student-works-qoder
railway init

# 4. Deploy
railway up

# 5. Open in browser
railway open
```

Done! ✅

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Contact: Check documentation for each platform's Discord/support

---

**TL;DR:** Don't use Vercel for SQLite apps. Use Railway or Render instead. It'll save you hours of frustration.
