# Railway Worker Deployment Guide

## Prerequisites
- Railway account (already set up)
- Railway CLI installed ✓

## Environment Variables Required in Railway

Set these in your Railway project dashboard:

```bash
DATABASE_URL=postgresql://postgres:Anthemcaci321!@db.dlpakvtxeeapcnduigox.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
REDIS_URL=redis://default:AWBtAAIncDJhZDdkYTQzMjc2ODg0OWNmYjRjZjA2YWJmNjNjZjc4M3AyMjQ2ODU@gorgeous-pup-24685.upstash.io:6379
ENCRYPTION_KEY=NE9kWFLxEmnIfBOMKAS7LW34IUGrdrj1X4Pi+b0a85I=
WHOP_API_KEY=FbNA1O0d8Sc3mIYhxXVNdgjbUfqC0E8K4CN5Rh-tOyg
NEXT_PUBLIC_WHOP_APP_ID=app_lBRgs6VjIgwjLt
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_PMExi23vqbzJB
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_v9zdDub5Sg6kZa
```

## Deployment Steps

### Option 1: Railway CLI (Requires Interactive Login)

1. Login to Railway:
```bash
railway login
```

2. Initialize Railway project:
```bash
railway init
```

3. Link to your Railway project or create new one:
```bash
railway link
```

4. Add environment variables (use Railway dashboard - it's easier):
```bash
# Or add via CLI one by one:
railway variables set DATABASE_URL="postgresql://postgres:Anthemcaci321!@db.dlpakvtxeeapcnduigox.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
# ... repeat for all variables
```

5. Deploy:
```bash
railway up
```

### Option 2: Railway Dashboard (Recommended)

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `Them1stocles/pixelflow`
5. Railway will auto-detect the configuration from `railway.json`
6. Add all environment variables in the Variables tab
7. Click "Deploy"

## Worker Configuration

The `railway.json` file is already configured with:
- **Build Command**: `npm install && npm run db:generate` (generates Prisma client)
- **Start Command**: `npm run worker:prod` (runs tsx worker.ts)
- **Restart Policy**: ON_FAILURE with 10 max retries

## Verify Deployment

Once deployed, check logs:
```bash
railway logs
```

You should see:
```
Worker started successfully
Processing events from queue...
```

## What the Worker Does

The worker processes background jobs from the BullMQ queue:
- **Facebook Conversions API**: Sends events to Facebook with server-side tracking
- **TikTok Events API**: Sends events to TikTok with enhanced matching
- **Event Processing**: Handles retries, deduplication, and error handling

## Monitoring

- View logs in Railway dashboard or via CLI: `railway logs -f`
- Monitor queue in Redis via Upstash dashboard
- Check job processing in your Vercel app at: `/dashboard/events`
