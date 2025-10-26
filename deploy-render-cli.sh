#!/bin/bash

# 🚀 Deploy to Render via CLI
# This script will push to GitHub and trigger Render deployment

set -e  # Exit on error

echo "🎯 Health Screener PWA - Render CLI Deployment"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git remote exists
if git remote get-url origin &> /dev/null; then
    echo -e "${GREEN}✅ Git remote already configured${NC}"
    REMOTE_URL=$(git remote get-url origin)
    echo "   Remote: $REMOTE_URL"
else
    echo -e "${YELLOW}⚠️  No git remote found${NC}"
    echo ""
    echo "Please create a GitHub repository first:"
    echo "1. Go to: https://github.com/new"
    echo "2. Name: health-screener-pwa"
    echo "3. Create repository"
    echo ""
    read -p "Enter your GitHub repository URL (e.g., https://github.com/username/health-screener-pwa.git): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}❌ No repository URL provided. Exiting.${NC}"
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✅ Git remote added${NC}"
fi

echo ""
echo -e "${BLUE}Step 1: Committing latest changes...${NC}"
git add .
if git commit -m "Deploy to Render" &> /dev/null; then
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Pushing to GitHub...${NC}"
if git push -u origin main; then
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo "Please check your GitHub credentials and try again"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Code pushed to GitHub successfully!${NC}"
echo ""
echo "=============================================="
echo -e "${BLUE}Next Steps:${NC}"
echo "=============================================="
echo ""
echo "1. Go to: https://dashboard.render.com"
echo ""
echo "2. Click 'New +' → 'Web Service'"
echo ""
echo "3. Connect your GitHub repository: health-screener-pwa"
echo ""
echo "4. Render will auto-detect the render.yaml configuration!"
echo ""
echo "5. Add these environment variables:"
echo "   - DATABASE_URL: libsql://health-screener-pwa-satishskid.aws-ap-south-1.turso.io"
echo "   - TURSO_AUTH_TOKEN: (from .env file)"
echo "   - JWT_SECRET: (generate a random secret)"
echo ""
echo "6. Click 'Create Web Service'"
echo ""
echo "7. Wait 3-5 minutes for deployment"
echo ""
echo -e "${GREEN}Your app will be live at: https://health-screener-pwa.onrender.com${NC}"
echo ""
echo "=============================================="
echo -e "${BLUE}Alternative: Use Render Blueprint${NC}"
echo "=============================================="
echo ""
echo "Since we have render.yaml, Render will:"
echo "✅ Auto-detect build and start commands"
echo "✅ Configure the service automatically"
echo "✅ Set up the correct runtime"
echo ""
echo "You just need to:"
echo "1. Connect the repository"
echo "2. Add environment variables"
echo "3. Deploy!"
echo ""
echo -e "${GREEN}🎉 Ready to deploy!${NC}"
