# PixelFlow - Multi-Platform Conversion Tracking

PixelFlow is a comprehensive Whop mini-app for merchants to track advertising conversions across multiple platforms (Facebook, TikTok, Google Analytics) using both browser-based pixels and server-side Conversions APIs.

**Built for the Whop Platform** - Seamless OAuth, automatic user management, and native integration with Whop checkout webhooks.

## ✨ Features

- ✅ **Whop Native Integration**: Seamless OAuth authentication and user management
- ✅ **Multi-Platform Tracking**: Facebook, TikTok, Google Analytics 4
- ✅ **Server-Side Conversions API**: Bypass ad blockers, capture 99%+ of events
- ✅ **Browser Tracking Script**: Automatic page view tracking + custom events
- ✅ **Whop Webhooks Integration**: Automatic purchase tracking from Whop checkouts
- ✅ **Event Deduplication**: Prevent double-counting with 5-minute deduplication window
- ✅ **Reliable Queue System**: BullMQ with automatic retries and exponential backoff
- ✅ **Real-Time Dashboard**: Analytics, event logs, and platform delivery status
- ✅ **Rate Limiting**: Protect your infrastructure with Redis-based rate limiting
- ✅ **Zero Authentication Code**: Whop SDK handles all OAuth flows automatically

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Whop developer account at [dev.whop.com](https://dev.whop.com)
- PostgreSQL database ([Supabase](https://supabase.com) or [Railway](https://railway.app))
- Redis instance ([Upstash](https://upstash.com))

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Then edit .env.local with your credentials

# 3. Generate Prisma client
npm run db:generate

# 4. Run database migrations
npm run db:migrate

# 5. (Optional) Seed demo data
npm run db:seed

# 6. Start development (in 3 terminals)
npm run dev        # Terminal 1: Next.js server
npm run worker     # Terminal 2: BullMQ worker

# Terminal 3: Whop dev proxy (requires Whop CLI)
npm install -g @whop-apps/dev-proxy
whop-dev-proxy --app-id=YOUR_WHOP_APP_ID --port=3000
```

### Access

- **Whop Dashboard**: Access through Whop dev proxy URL (shown in Terminal 3)
- **Prisma Studio**: http://localhost:5555 (run `npm run db:studio`)
- **Local Direct Access**: Not recommended - app should run in Whop iframe

## 📘 Whop Platform Setup

For detailed instructions on setting up your Whop app, configuring OAuth, and deploying to production, see:

**[WHOP_SETUP.md](./WHOP_SETUP.md)** - Complete Whop integration guide

Quick summary:
1. Create app at https://dev.whop.com
2. Copy App ID, API Key, and Webhook Secret to `.env.local`
3. Use Whop dev proxy for local development
4. Deploy to Vercel (frontend) + Railway (worker)
5. Submit to Whop App Store

## 📚 Full Documentation

See the comprehensive guide in [SETUP.md](./SETUP.md) for:
- Detailed setup instructions
- Architecture overview
- API documentation
- Deployment guide
- Troubleshooting

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma, PostgreSQL
- **Queue**: BullMQ + Redis
- **External APIs**: Facebook Conversions API, TikTok Events API, GA4

## 📦 Key Files

- `app/api/track/` - Main tracking endpoint
- `app/dashboard/` - Dashboard UI
- `lib/services/pixel-sender.ts` - Platform integrations
- `lib/queue/event-queue.ts` - BullMQ setup
- `public/pixel-script.js` - Browser tracking script
- `worker.ts` - Background job processor

## 🚀 Deployment

### Whop App Deployment

PixelFlow is designed to run as a Whop mini-app. Full deployment guide: [WHOP_SETUP.md](./WHOP_SETUP.md)

**1. Vercel (Frontend + API)**
```bash
# Connect GitHub repo to Vercel
# Add all environment variables from .env.example
# Deploy automatically on push
```

**2. Railway (Worker)**
```bash
# Deploy worker as separate service
# Add same environment variables
npm run worker:prod
```

**3. Configure Whop App**
- Set production URL in Whop dashboard
- Configure webhook endpoint
- Submit for App Store review

See [WHOP_SETUP.md](./WHOP_SETUP.md) for complete deployment instructions.

##  📝 License

MIT

---

**Built for Whop merchants** | [Documentation](./SETUP.md) | [Issues](https://github.com/yourusername/pixelflow/issues)
