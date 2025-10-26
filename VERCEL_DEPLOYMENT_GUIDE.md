# 🚀 Vercel Deployment Guide

## 📋 **DEPLOYMENT CHECKLIST**

### **Step 1: Database Setup (Choose One)**

---

## ⭐ **OPTION A: Turso (Recommended - SQLite Compatible)**

**Why Turso?**
- ✅ SQLite compatible (zero code changes!)
- ✅ Free tier: 500 databases, 1GB storage
- ✅ Edge network (fast globally)
- ✅ Works with existing Drizzle schema
- ✅ 5-minute setup

### **Setup Turso**

```bash
# 1. Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Sign up
turso auth signup

# 3. Create database
turso db create health-screener

# 4. Get database URL
turso db show health-screener --url

# 5. Create auth token
turso db tokens create health-screener
```

### **Update .env**

```bash
# Replace DATABASE_URL with Turso URL
DATABASE_URL=libsql://health-screener-[your-org].turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

### **Update drizzle.config.ts**

```typescript
import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config();

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  driver: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
} satisfies Config;
```

### **Install Turso Driver**

```bash
npm install @libsql/client
```

### **Update db.ts**

```typescript
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client);
```

---

## 🔵 **OPTION B: Vercel Postgres**

**Why Vercel Postgres?**
- ✅ Built into Vercel
- ✅ Free tier available
- ✅ Easy setup
- ⚠️ Requires PostgreSQL adapter

### **Setup Vercel Postgres**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Link project
vercel link

# 3. Add Postgres
vercel postgres create
```

### **Update Dependencies**

```bash
npm install @vercel/postgres
npm install drizzle-orm pg
npm install -D @types/pg
```

### **Update drizzle.config.ts**

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
} satisfies Config;
```

---

## 🟢 **OPTION C: Supabase**

**Why Supabase?**
- ✅ PostgreSQL + real-time
- ✅ Free tier
- ✅ Great scaling
- ✅ Auth included

### **Setup Supabase**

```bash
# 1. Create project at supabase.com
# 2. Get connection string from Settings > Database
# 3. Add to .env
```

```bash
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

---

## 📦 **Step 2: Git Setup**

### **Initialize Git (if not done)**

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Health Screener PWA with rPPG"

# Create GitHub repo (via GitHub.com or CLI)
gh repo create health-screener-pwa --public --source=. --remote=origin

# Push to GitHub
git push -u origin main
```

### **Create .gitignore**

```bash
# Already exists, but verify it includes:
node_modules/
.env
.env.local
dist/
build/
.vercel/
*.db
*.db-journal
```

---

## 🚀 **Step 3: Deploy to Vercel**

### **Method 1: CLI (Fastest)**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? health-screener-pwa
# - Directory? ./
# - Override settings? No

# 4. Deploy to production
vercel --prod
```

### **Method 2: GitHub Integration (Recommended)**

```bash
# 1. Go to vercel.com
# 2. Click "New Project"
# 3. Import from GitHub
# 4. Select your repository
# 5. Configure:
#    - Framework Preset: Vite
#    - Root Directory: ./
#    - Build Command: npm run build
#    - Output Directory: dist
# 6. Add Environment Variables (see below)
# 7. Click "Deploy"
```

---

## 🔐 **Step 4: Environment Variables**

### **Add to Vercel Dashboard**

Go to: Project Settings > Environment Variables

```bash
# Required
DATABASE_URL=your-database-url
TURSO_AUTH_TOKEN=your-turso-token  # If using Turso

# Optional (for full features)
JWT_SECRET=your-jwt-secret-change-in-production
OPENAI_API_KEY=your-openai-api-key  # If using AI features
VITE_APP_TITLE=Health Screener PWA
```

### **Or via CLI**

```bash
vercel env add DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add JWT_SECRET
```

---

## 🗄️ **Step 5: Run Migrations**

### **After Database Setup**

```bash
# Generate migrations
npm run db:generate

# Push to database
npm run db:push

# Or migrate
npm run db:migrate
```

### **For Turso**

```bash
# Push schema to Turso
turso db shell health-screener < drizzle/migrations/0000_initial.sql
```

---

## ✅ **Step 6: Verify Deployment**

### **Check Your App**

```bash
# Your app will be live at:
https://health-screener-pwa.vercel.app

# Or custom domain:
https://your-domain.com
```

### **Test Features**

1. ✅ Vision screening works
2. ✅ Hearing screening works
3. ✅ rPPG measurement works
4. ✅ Database saves data
5. ✅ Authentication works

---

## 🎯 **QUICK START (Turso + Vercel)**

```bash
# 1. Setup Turso
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create health-screener
turso db show health-screener --url
turso db tokens create health-screener

# 2. Install dependencies
npm install @libsql/client

# 3. Update .env
echo "DATABASE_URL=libsql://health-screener-[your-org].turso.io" >> .env
echo "TURSO_AUTH_TOKEN=your-token" >> .env

# 4. Push to GitHub
git add .
git commit -m "Add Turso database"
git push

# 5. Deploy to Vercel
vercel login
vercel

# 6. Add env vars to Vercel
vercel env add DATABASE_URL
vercel env add TURSO_AUTH_TOKEN

# 7. Redeploy
vercel --prod

# Done! 🎉
```

---

## 📊 **Recommended Setup**

**For Your Health Screener PWA**:

✅ **Database**: Turso (SQLite compatible, no code changes)  
✅ **Hosting**: Vercel (free, fast, auto-deploy)  
✅ **Git**: GitHub (version control, CI/CD)  
✅ **Domain**: Vercel subdomain (free) or custom domain  

**Total Cost**: $0/month (free tier)  
**Setup Time**: 10 minutes  
**Deployment**: Automatic on git push  

---

## 🔧 **Troubleshooting**

### **Build Fails**

```bash
# Check build locally
npm run build

# Check logs
vercel logs
```

### **Database Connection Fails**

```bash
# Verify env vars
vercel env ls

# Test connection locally
npm run db:studio
```

### **TypeScript Errors**

```bash
# Rebuild
npm run build

# Check types
npx tsc --noEmit
```

---

## 🎊 **POST-DEPLOYMENT**

### **Custom Domain**

```bash
# Add domain in Vercel dashboard
# Or via CLI
vercel domains add your-domain.com
```

### **Analytics**

```bash
# Vercel Analytics (free)
npm install @vercel/analytics
```

### **Monitoring**

```bash
# Vercel automatically provides:
# - Performance metrics
# - Error tracking
# - Usage stats
```

---

## 📝 **DEPLOYMENT COMMANDS SUMMARY**

```bash
# Complete deployment flow
turso db create health-screener          # Create database
npm install @libsql/client               # Install driver
git add . && git commit -m "Deploy"      # Commit changes
git push                                 # Push to GitHub
vercel                                   # Deploy to Vercel
vercel env add DATABASE_URL              # Add env vars
vercel --prod                            # Production deploy
```

---

## 🏆 **YOU'RE READY!**

Your Health Screener PWA will be:
- ✅ Live on Vercel
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Auto-deploy on push
- ✅ Free forever
- ✅ Production-ready

**Deploy now and share your amazing health platform with the world!** 🚀💓✨
