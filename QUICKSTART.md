# Quick Start Guide - Health Screener PWA

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- MySQL database running locally or remotely

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and update these critical values:

```bash
# Minimum required configuration
DATABASE_URL=mysql://user:password@localhost:3306/health_screener
JWT_SECRET=your-super-secret-jwt-key-here
OWNER_ID=your-user-id-will-be-admin

# Optional: Update these for branding
VITE_APP_TITLE="Health Screener PWA"
VITE_APP_LOGO="https://placehold.co/40x40/3b82f6/ffffff?text=HS"
```

## Step 3: Set Up Database

```bash
# Create database tables
pnpm db:push
```

This will create all necessary tables in your MySQL database.

## Step 4: Start Development Server

```bash
pnpm dev
```

The application will start at: **http://localhost:3000**

## Step 5: Test the Application

### Access the App
1. Open http://localhost:3000 in your browser
2. You'll see the home page with vision and hearing screening options

### Request Access
1. Click "Request Access" in the header
2. Fill out the form with your email
3. Submit the request

### Login (First Time)
1. Click "Login" button
2. Complete OAuth authentication
3. Your user ID will be set as admin (if it matches OWNER_ID in .env)

### Admin Dashboard
1. After logging in as admin, click "Admin" in the header
2. View user statistics
3. Approve/reject access requests
4. Manage user subscriptions

### Try Screening
1. Click on "Vision Screening" or "Hearing Screening"
2. Follow the on-screen instructions
3. Complete the screening process
4. View results in "My Results"

## Common Issues

### Database Connection Error
```bash
# Verify MySQL is running
mysql -u root -p

# Check DATABASE_URL format
# mysql://username:password@host:port/database
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Project Structure Overview

```
health-screener-pwa/
├── client/src/pages/          # Frontend pages
│   ├── Home.tsx               # Landing page
│   ├── VisionScreening.tsx    # Vision test
│   ├── HearingScreening.tsx   # Hearing test
│   ├── Results.tsx            # Results history
│   ├── RequestAccess.tsx      # Registration
│   └── AdminDashboard.tsx     # Admin panel
├── server/
│   ├── db.ts                  # Database functions
│   └── routers.ts             # API endpoints
└── drizzle/schema.ts          # Database schema
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm check        # Type checking
pnpm format       # Format code
pnpm test         # Run tests
pnpm db:push      # Update database schema
```

## Key Features to Test

### ✅ User Flow
1. Request access
2. Login via OAuth
3. Complete screening
4. View results
5. Track history

### ✅ Admin Flow
1. Login as admin
2. View dashboard statistics
3. Review access requests
4. Approve/reject users
5. Manage subscriptions

### ✅ PWA Features
1. Install app on mobile/desktop
2. Test offline functionality
3. Check service worker caching

## Next Steps

1. **Customize Branding**
   - Update logo and colors in `.env`
   - Modify theme in `client/src/index.css`

2. **Implement Screening Logic**
   - Add camera integration for vision tests
   - Add audio playback for hearing tests
   - Implement result calculations

3. **Add Payment Integration**
   - Integrate Stripe or PayPal
   - Set up subscription billing
   - Configure webhooks

4. **Deploy to Production**
   - Follow `DEPLOYMENT.md` guide
   - Set up SSL certificates
   - Configure production database

## Getting Help

- **Documentation**: See `README.md` for detailed information
- **Deployment**: See `DEPLOYMENT.md` for production setup
- **Project Overview**: See `PROJECT_SUMMARY.md` for architecture details

## Development Tips

### Hot Reload
The dev server supports hot module replacement. Changes to frontend code will reload automatically.

### Database Changes
After modifying `drizzle/schema.ts`, run:
```bash
pnpm db:push
```

### Type Safety
The project uses TypeScript and tRPC for end-to-end type safety. Your IDE should provide autocomplete for API calls.

### Debugging
- Frontend errors: Check browser console
- Backend errors: Check terminal output
- Database issues: Check MySQL logs

## Production Checklist

Before deploying to production:

- [ ] Update all environment variables
- [ ] Generate secure JWT secret
- [ ] Set up production database
- [ ] Configure SSL certificate
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Test all features
- [ ] Review security settings
- [ ] Set up error tracking
- [ ] Configure analytics

## Support

For issues or questions:
- Check `README.md` for detailed documentation
- Review `DEPLOYMENT.md` for deployment help
- Contact: support@healthscreener.app

---

**You're all set!** 🎉

Start building amazing health screening experiences!
