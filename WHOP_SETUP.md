# Whop Platform Setup Guide

This guide explains how to set up PixelFlow as a Whop mini-app for local development and production deployment.

## Prerequisites

- Node.js 18+ installed
- A Whop developer account at https://dev.whop.com
- PostgreSQL and Redis instances (or Supabase + Upstash)

## 1. Create Whop App

1. Visit https://dev.whop.com/apps
2. Click "Create New App"
3. Fill in app details:
   - **Name**: PixelFlow
   - **Description**: Multi-platform conversion tracking for merchants
   - **Category**: Analytics & Tracking
4. Save your app credentials:
   - App ID (starts with `app_`)
   - API Key (starts with `whop_`)
   - Webhook Secret (starts with `whsec_`)

## 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Whop credentials:

```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Whop Platform Configuration
NEXT_PUBLIC_WHOP_APP_ID="app_your_app_id_here"
WHOP_API_KEY="whop_your_api_key_here"
WHOP_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Database (use Supabase or Railway)
DATABASE_URL="postgresql://..."

# Redis (use Upstash)
REDIS_URL="redis://..."

# Encryption key (generate with: openssl rand -base64 32)
ENCRYPTION_KEY="your_generated_key_here"
```

## 3. Local Development with Whop Dev Proxy

Whop apps run inside an iframe on the Whop platform. For local development, use the Whop dev proxy:

### Install Whop CLI

```bash
npm install -g @whop-apps/dev-proxy
```

### Start Development Server

Open **three terminal windows**:

**Terminal 1: Next.js Dev Server**
```bash
npm run dev
```

**Terminal 2: BullMQ Worker**
```bash
npm run worker
```

**Terminal 3: Whop Dev Proxy**
```bash
whop-dev-proxy --app-id=app_your_app_id_here --port=3000
```

The dev proxy will:
- Inject Whop authentication cookies
- Simulate the iframe environment
- Proxy requests to your local server

### Access Your App

1. Open the URL provided by the dev proxy (usually `https://dev.whop.com/apps/your-app-id`)
2. You'll see your app running inside the Whop dashboard
3. Authentication is handled automatically by Whop

## 4. Configure App Routes in Whop Dashboard

In your Whop app settings (https://dev.whop.com/apps), configure these routes:

### Main Routes

- **Dashboard**: `/dashboard`
- **Pixel Configuration**: `/dashboard/pixels`
- **Event Logs**: `/dashboard/events`
- **Installation**: `/dashboard/installation`

### Webhook Endpoint

- **URL**: `https://your-domain.vercel.app/api/webhooks/whop`
- **Events**:
  - `payment.succeeded`
  - `payment.failed`
  - `membership.created`
  - `membership.renewed`
  - `membership.cancelled`
  - `checkout.completed`

## 5. Database Setup

Run migrations and seed data:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed demo data
npm run db:seed
```

## 6. Testing Authentication Flow

1. Start all three processes (dev server, worker, proxy)
2. Open your app in the Whop dashboard
3. Verify that:
   - You're automatically logged in via Whop
   - Your merchant account is created in the database
   - Dashboard loads with your Whop email

## 7. Production Deployment

### Deploy to Vercel

1. **Deploy Frontend + API**:
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Production ready"
   git push

   # Import to Vercel
   # - Connect your GitHub repo
   # - Add all environment variables
   # - Deploy
   ```

2. **Deploy Worker to Railway**:
   ```bash
   # Create railway.json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm run worker:prod"
     }
   }
   ```

   Then:
   - Connect repo to Railway
   - Add same environment variables
   - Deploy worker as separate service

### Update Whop App Settings

1. Go to https://dev.whop.com/apps
2. Update your app URL to your Vercel domain:
   - **Production URL**: `https://your-domain.vercel.app`
3. Update webhook URL:
   - **Webhook URL**: `https://your-domain.vercel.app/api/webhooks/whop`

## 8. Submit to Whop App Store

Once your app is working in production:

1. Go to https://dev.whop.com/apps
2. Click "Submit for Review"
3. Provide:
   - App screenshots
   - Demo video (optional)
   - Privacy policy URL
   - Terms of service URL
   - Detailed description
   - Pricing information

## 9. How Whop Authentication Works

PixelFlow uses the Whop SDK for authentication:

```typescript
import { validateToken } from '@whop-apps/sdk';

// Extract token from cookie
const whopToken = req.headers.get('cookie')
  ?.split(';')
  .find(c => c.trim().startsWith('whop_user_token='))
  ?.split('=')[1];

// Validate token
const { valid, userId, companyId } = await validateToken({
  token: whopToken,
});

// Create or find merchant
const merchant = await prisma.merchant.findUnique({
  where: { whopUserId: userId },
});
```

**Key Points**:
- Whop handles OAuth flow automatically
- App receives `whop_user_token` cookie in iframe
- Token contains user ID and company ID
- No login forms or password management needed

## 10. Rate Limits & Quotas

Configure rate limits based on subscription tier:

- **Free**: 10,000 events/month
- **Basic**: 50,000 events/month
- **Pro**: 200,000 events/month
- **Enterprise**: 1,000,000 events/month

These are enforced in the tracking endpoint at `app/api/track/route.ts`.

## Troubleshooting

### "Unauthorized" errors in development

- Make sure Whop dev proxy is running
- Verify your app ID is correct
- Check that cookies are being sent (iframe must be same-origin or have proper CORS)

### Webhooks not working

- Verify webhook secret matches `.env` value
- Check webhook signature verification in `app/api/webhooks/whop/route.ts`
- Use Whop webhook testing tool to debug

### Authentication failing in production

- Ensure `NEXT_PUBLIC_WHOP_APP_ID` is set in Vercel
- Verify your production domain is registered in Whop app settings
- Check that cookies are not being blocked (must use HTTPS)

## Support

- Whop Developer Docs: https://docs.whop.com
- Whop Discord: https://discord.gg/whop
- PixelFlow Issues: https://github.com/yourusername/pixelflow/issues

---

**Built for Whop merchants** | [Documentation](./SETUP.md) | [API Reference](./API.md)
