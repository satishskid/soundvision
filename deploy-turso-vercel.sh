#!/bin/bash

# 🚀 Complete Turso + Vercel Deployment Script
# Health Screener PWA - Production Deployment

set -e  # Exit on error

echo "🎯 Health Screener PWA - Turso + Vercel Deployment"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Turso authentication
echo -e "${BLUE}Step 1: Checking Turso authentication...${NC}"
if ! turso auth whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Turso. Please authenticate in the browser that just opened.${NC}"
    turso auth login
    echo -e "${GREEN}✅ Turso authentication complete!${NC}"
else
    echo -e "${GREEN}✅ Already authenticated with Turso${NC}"
    turso auth whoami
fi
echo ""

# Step 2: Create Turso database
echo -e "${BLUE}Step 2: Creating Turso database...${NC}"
DB_NAME="health-screener-pwa"

# Check if database already exists
if turso db list | grep -q "$DB_NAME"; then
    echo -e "${YELLOW}Database '$DB_NAME' already exists. Using existing database.${NC}"
else
    echo "Creating new database: $DB_NAME"
    turso db create $DB_NAME
    echo -e "${GREEN}✅ Database created!${NC}"
fi
echo ""

# Step 3: Get database URL
echo -e "${BLUE}Step 3: Getting database URL...${NC}"
DB_URL=$(turso db show $DB_NAME --url)
echo -e "${GREEN}✅ Database URL: $DB_URL${NC}"
echo ""

# Step 4: Create auth token
echo -e "${BLUE}Step 4: Creating auth token...${NC}"
AUTH_TOKEN=$(turso db tokens create $DB_NAME)
echo -e "${GREEN}✅ Auth token created!${NC}"
echo ""

# Step 5: Update .env file
echo -e "${BLUE}Step 5: Updating .env file...${NC}"
cat > .env << EOF
# Turso Database Configuration
DATABASE_URL=$DB_URL
TURSO_AUTH_TOKEN=$AUTH_TOKEN

# Application Configuration
VITE_APP_TITLE=Health Screener PWA
JWT_SECRET=$(openssl rand -base64 32)

# Optional
OPENAI_API_KEY=
PORT=3000
EOF

echo -e "${GREEN}✅ .env file updated!${NC}"
echo ""

# Step 6: Install Turso client
echo -e "${BLUE}Step 6: Installing @libsql/client...${NC}"
npm install @libsql/client
echo -e "${GREEN}✅ Turso client installed!${NC}"
echo ""

# Step 7: Generate and push migrations
echo -e "${BLUE}Step 7: Setting up database schema...${NC}"
echo "Generating migrations..."
npm run db:generate || true
echo "Pushing schema to Turso..."
npm run db:push
echo -e "${GREEN}✅ Database schema ready!${NC}"
echo ""

# Step 8: Initialize Git (if not already)
echo -e "${BLUE}Step 8: Setting up Git repository...${NC}"
if [ ! -d .git ]; then
    git init
    git branch -M main
    echo -e "${GREEN}✅ Git initialized!${NC}"
else
    echo -e "${GREEN}✅ Git already initialized${NC}"
fi
echo ""

# Step 9: Commit changes
echo -e "${BLUE}Step 9: Committing changes...${NC}"
git add .
git commit -m "Health Screener PWA - Production ready with Turso + rPPG" || echo "Nothing to commit"
echo -e "${GREEN}✅ Changes committed!${NC}"
echo ""

# Step 10: Check if Vercel is installed
echo -e "${BLUE}Step 10: Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed!${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI already installed${NC}"
fi
echo ""

# Step 11: Deploy to Vercel
echo -e "${BLUE}Step 11: Deploying to Vercel...${NC}"
echo -e "${YELLOW}This will open Vercel login if needed...${NC}"
vercel --yes

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""

# Step 12: Add environment variables to Vercel
echo -e "${BLUE}Step 12: Adding environment variables to Vercel...${NC}"
echo "Adding DATABASE_URL..."
echo "$DB_URL" | vercel env add DATABASE_URL production

echo "Adding TURSO_AUTH_TOKEN..."
echo "$AUTH_TOKEN" | vercel env add TURSO_AUTH_TOKEN production

echo "Adding JWT_SECRET..."
openssl rand -base64 32 | vercel env add JWT_SECRET production

echo -e "${GREEN}✅ Environment variables added!${NC}"
echo ""

# Step 13: Deploy to production
echo -e "${BLUE}Step 13: Deploying to production...${NC}"
vercel --prod

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "Your Health Screener PWA is now live!"
echo ""
echo "Next steps:"
echo "1. Check your deployment URL (shown above)"
echo "2. Test all features (Vision, Hearing, rPPG)"
echo "3. Share your amazing health platform!"
echo ""
echo "Database Info:"
echo "  Name: $DB_NAME"
echo "  URL: $DB_URL"
echo ""
echo "Useful commands:"
echo "  turso db shell $DB_NAME          # Access database shell"
echo "  turso db show $DB_NAME           # Show database info"
echo "  vercel logs                      # View deployment logs"
echo "  vercel domains add <domain>      # Add custom domain"
echo ""
echo -e "${GREEN}Happy deploying! 🚀💓${NC}"
