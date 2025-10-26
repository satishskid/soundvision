# Health Screener PWA

Comprehensive vision and hearing screening in one accessible Progressive Web App. Fast, affordable, and designed for preliminary assessment.

## 🎯 Overview

Health Screener PWA brings preliminary vision and hearing screening directly to your device. This application is designed for preliminary screening and educational purposes only - results are **not diagnostic** and do not constitute medical advice.

### Key Features

- **Vision Screening** 👁️
  - Photoscreening: Red reflex and eye alignment detection using device camera
  - Visual Acuity Test: Snellen-style chart reading for distance vision assessment
  - Results in 5-10 minutes

- **Hearing Screening** 👂
  - Pure Tone Audiometry: Hearing thresholds at 6 frequencies (250-8000 Hz)
  - Speech-in-Noise Test: Real-world listening ability evaluation
  - Results in 8-12 minutes

- **rPPG Cardiovascular Monitoring** 💓 **NEW!**
  - Heart Rate: Real-time BPM measurement (40-200 BPM)
  - Heart Rate Variability (HRV): SDNN, RMSSD, pNN50 metrics
  - Stress Level: AI-powered stress assessment
  - Blood Oxygen (SpO2): Non-invasive oxygen saturation estimation
  - Blood Pressure: Systolic/Diastolic estimation using PTT method
  - Respiratory Rate: Breaths per minute detection
  - Health Score: Overall cardiovascular health assessment
  - Results in 30-60 seconds using just your camera!

- **User Management**
  - Email-based whitelisting with subscription tiers
  - Trial: 3 days free access
  - Paid: Monthly ($9.99/month) or Yearly ($99/year)
  - Admin dashboard for user and access request management

- **Progressive Web App**
  - Offline functionality
  - Install on any device
  - Push notifications for screening reminders
  - Background sync for data submission

## 🏗️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Wouter** for routing
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **TanStack Query** for data fetching

### Backend
- **Express.js** with TypeScript
- **tRPC** for type-safe API
- **Turso (libSQL)** database with Drizzle ORM
- **OAuth** for secure authentication
- **JWT** for session management

### rPPG Algorithms
- **TensorFlow.js** for face detection
- **MediaPipe FaceMesh** for ROI selection
- **Custom DSP** for signal processing (FFT, filtering, peak detection)
- **Medical-grade algorithms** for vital signs extraction

### Infrastructure
- Progressive Web App with service worker
- Secure data encryption
- HIPAA-compliant data handling practices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Turso database (free tier available)
- OAuth server credentials (optional for demo mode)

### Installation

1. **Clone the repository**
   ```bash
   cd health-screener-pwa
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database connection (`DATABASE_URL`)
   - OAuth credentials (`VITE_OAUTH_PORTAL_URL`, `OAUTH_SERVER_URL`)
   - JWT secret (`JWT_SECRET`)
   - Owner ID for first admin user (`OWNER_ID`)

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

### Building for Production

```bash
pnpm build
pnpm start
```

## 📱 User Journey

1. **Discovery** - Learn about the screening capabilities
2. **Request Access** - Submit access request with desired subscription tier
3. **Login** - Authenticate via OAuth
4. **Complete Screening** - Perform vision and/or hearing tests
5. **Get Results** - View detailed results and recommendations
6. **Follow-up** - Track history and schedule professional evaluation if needed

## 🔐 Security & Privacy

- Secure OAuth authentication
- Data encryption in transit and at rest
- HIPAA-compliant data handling
- User data never shared without explicit consent
- Regular security audits

## 🏥 Medical Disclaimer

**IMPORTANT**: This application is designed for preliminary screening and educational purposes only. Results are **not diagnostic** and do not constitute medical advice. If you have concerns about your vision or hearing, please consult with a qualified healthcare professional for proper diagnosis and treatment. Always seek professional medical evaluation for any health concerns.

## 📊 Database Schema

### Core Tables

- **users** - User accounts with subscription and whitelist status
- **vision_screening_sessions** - Vision screening metadata
- **photoscreening_results** - Red reflex and alignment data
- **visual_acuity_results** - Visual acuity measurements
- **hearing_screening_sessions** - Hearing screening metadata
- **pure_tone_audiometry_results** - Frequency-specific thresholds
- **speech_in_noise_results** - Speech perception data
- **screening_summary_reports** - Overall assessments and recommendations
- **access_requests** - User access request tracking
- **subscription_history** - Subscription changes and payments

## 🎨 UI Components

Built with shadcn/ui components:
- Buttons, Cards, Dialogs
- Forms with validation
- Tables and Data displays
- Tabs and Navigation
- Badges and Status indicators
- Toast notifications

## 🔧 Development

### Project Structure

```
health-screener-pwa/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── server/                # Backend Express application
│   ├── _core/            # Core server setup
│   ├── db.ts             # Database functions
│   └── routers.ts        # API routes
├── drizzle/              # Database schema
└── shared/               # Shared types and utilities
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm check` - Type checking
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema changes

## 🌐 Deployment

**See `DEPLOY_TOMORROW_GUIDE.md` for complete deployment instructions.**

### Recommended: Render.com (100% Free)

1. Push code to GitHub
2. Connect to Render.com
3. Configure environment variables
4. Deploy in 5 minutes!

**Alternative platforms**:
- **Render.com** - ✅ Free tier, perfect for Express apps
- **Fly.io** - ✅ Free tier, no cold starts
- **Koyeb** - ✅ Free tier, simple deployment
- **Railway** - Paid ($5/month), best performance

## 📈 Business Model

### Revenue Streams

1. **Individual Subscriptions**
   - Trial: 3 days free
   - Monthly: $9.99/month
   - Yearly: $99/year (17% savings)

2. **B2B Partnerships**
   - Schools and educational institutions
   - Corporate wellness programs
   - Healthcare providers

3. **Data Analytics** (anonymized, aggregated)
   - Population health insights
   - Screening effectiveness metrics

## 🤝 Contributing

This is a proprietary application. For questions or support, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For technical support or questions:
- Email: support@healthscreener.app
- Documentation: https://docs.healthscreener.app

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Vision and hearing screening capabilities
- User management and subscription system
- Admin dashboard
- PWA functionality with offline support
- Secure authentication and data handling

---

**Remember**: This is a screening tool, not a diagnostic device. Always consult healthcare professionals for medical advice.
