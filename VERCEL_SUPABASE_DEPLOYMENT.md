# Vercel + Supabase Deployment Guide

## Why Vercel + Supabase is Perfect for Your App

This combination is **highly recommended** for your LoanOps application. Here's why:

### ✅ Perfect Match for Your Stack

1. **Next.js Native** - Vercel created Next.js, so you get:
   - Zero-config deployment
   - Automatic optimizations
   - Edge functions support
   - Built-in analytics

2. **Supabase = PostgreSQL + More** - You're already using PostgreSQL, and Supabase adds:
   - Managed PostgreSQL database
   - Built-in connection pooling
   - Automatic backups
   - Real-time subscriptions (bonus feature!)
   - Built-in authentication (can replace NextAuth if needed)
   - Row Level Security (RLS) for multi-tenancy
   - Storage for files (PDFs, documents)
   - Edge functions

3. **Cost-Effective**
   - Free tier to start
   - Predictable pricing
   - No surprise bills
   - Scale as you grow

---

## Architecture: Vercel + Supabase

```
┌─────────────────────────────────────────┐
│         Vercel Edge Network             │
│  (Global CDN + Edge Functions)          │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Vercel Deployment                  │
│  ┌──────────────────────────────┐      │
│  │   Next.js App (SSR + API)    │      │
│  │   - Dashboard Pages          │      │
│  │   - API Routes               │      │
│  │   - Authentication           │      │
│  └──────────┬───────────────────┘      │
└─────────────┼──────────────────────────┘
              │
    ┌─────────┴─────────┬──────────────┐
    │                   │              │
┌───▼────────────┐  ┌──▼──────────┐  ┌▼────────────┐
│   Supabase     │  │  Upstash    │  │  SendGrid   │
│                │  │  Redis      │  │  + Twilio   │
│ - PostgreSQL   │  │  (Cache)    │  │  (Comms)    │
│ - Storage      │  │             │  │             │
│ - Auth         │  └─────────────┘  └─────────────┘
│ - Realtime     │
└────────────────┘
```

---

## Step-by-Step Deployment

### Phase 1: Supabase Setup (15 minutes)

#### 1. Create Supabase Project

```bash
# Go to https://supabase.com
# Click "New Project"
# Choose:
# - Project name: loanops-production
# - Database password: [generate strong password]
# - Region: Choose closest to your users
# - Plan: Free (start) or Pro ($25/month)
```

#### 2. Get Connection Strings

Supabase provides multiple connection strings:

```bash
# Direct Connection (for migrations)
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Connection Pooling (for app - RECOMMENDED)
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true

# Supabase URL (for Supabase client)
https://[PROJECT-REF].supabase.co

# Supabase Anon Key (public)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (secret - server only)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. Run Prisma Migrations

```bash
# Update your .env with Supabase connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"

# Generate Prisma client
npm run db:generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run db:seed
```

#### 4. Enable Supabase Features

**Connection Pooling (Already enabled with port 6543)**
- Handles 1000s of connections
- Essential for serverless

**Automatic Backups**
- Go to Database → Backups
- Daily backups enabled by default
- Point-in-time recovery available on Pro plan

**Database Webhooks (Optional)**
- Go to Database → Webhooks
- Trigger functions on data changes
- Useful for notifications

---

### Phase 2: Vercel Setup (10 minutes)

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Connect Your Repository

```bash
# Login to Vercel
vercel login

# Link your project
cd loanops-web
vercel link

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? loanops-web
# - Directory? ./
# - Override settings? No
```

#### 3. Configure Environment Variables

```bash
# Add environment variables via CLI
vercel env add DATABASE_URL production
# Paste: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true

vercel env add NEXTAUTH_SECRET production
# Generate: openssl rand -base64 32

vercel env add NEXTAUTH_URL production
# Enter: https://your-domain.vercel.app

vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-domain.vercel.app

vercel env add REDIS_URL production
# Enter: redis://default:[PASSWORD]@[UPSTASH-URL]:6379

vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
vercel env add TWILIO_PHONE_NUMBER production

vercel env add SENDGRID_API_KEY production
vercel env add SENDGRID_FROM_EMAIL production
```

**Or use Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables above

#### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Your app will be live at:
# https://loanops-web.vercel.app
# or your custom domain
```

---

### Phase 3: Upstash Redis (5 minutes)

Vercel integrates seamlessly with Upstash for Redis:

#### Option A: Via Vercel Dashboard (Easiest)

1. Go to your Vercel project
2. Click "Storage" tab
3. Click "Create Database"
4. Select "KV (Redis)"
5. Name: loanops-redis
6. Region: Same as Supabase
7. Click "Create"
8. Environment variables auto-added!

#### Option B: Direct Upstash Setup

```bash
# Go to https://upstash.com
# Create account
# Create Redis database
# Copy connection string
# Add to Vercel env vars
```

---

## Code Changes Required

### 1. Update Database Connection

**Current:** `lib/prisma.ts` (hardcoded credentials)

**New:** `lib/prisma.ts`
```typescript
import { PrismaClient } from './generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Supabase connection with pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### 2. Add Redis Caching

**Create:** `lib/redis.ts`
```typescript
import { Redis } from '@upstash/redis';

// Upstash Redis (serverless-friendly)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache helpers
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached as T | null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache(
  key: string,
  value: any,
  ttl: number = 300
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}
```

### 3. Add Rate Limiting

**Create:** `lib/rateLimit.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

// API rate limiting
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min
  analytics: true,
  prefix: 'api',
});

// Per-tenant rate limiting
export const tenantRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'), // 1000 req/min per tenant
  analytics: true,
  prefix: 'tenant',
});

// Helper function
export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await apiRateLimit.limit(identifier);
  
  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    },
  };
}
```

### 4. Update Middleware

**Update:** `middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './lib/rateLimit';

export async function middleware(request: NextRequest) {
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const { success, headers } = await checkRateLimit(ip);
    
    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers,
      });
    }
    
    const response = NextResponse.next();
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
```

### 5. Add Caching to API Routes

**Example:** Update `app/api/customers/route.ts`
```typescript
import { getCached, setCache, invalidateCache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId');
  const cacheKey = `customers:${tenantId}:list`;
  
  // Try cache first
  const cached = await getCached(cacheKey);
  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
    });
  }
  
  // Fetch from database
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    include: { Agent: true, Line: true },
  });
  
  // Cache for 5 minutes
  await setCache(cacheKey, customers, 300);
  
  return NextResponse.json({
    success: true,
    data: customers,
    cached: false,
  });
}

export async function POST(request: NextRequest) {
  // ... create customer logic
  
  // Invalidate cache after creating
  await invalidateCache(`customers:${tenantId}:*`);
  
  return NextResponse.json({ success: true, data: customer });
}
```

---

## Vercel Configuration

### 1. Create `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "@next-public-app-url"
  },
  "build": {
    "env": {
      "DATABASE_URL": "@database-url",
      "NEXTAUTH_SECRET": "@nextauth-secret"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 2. Update `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimize images
  images: {
    domains: ['supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Custom Domain Setup

### 1. Add Domain in Vercel

```bash
# Via CLI
vercel domains add yourdomain.com

# Or via Dashboard:
# Project Settings → Domains → Add Domain
```

### 2. Configure DNS

Add these records to your domain registrar:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### 3. SSL Certificate

- Automatically provisioned by Vercel
- Free Let's Encrypt certificate
- Auto-renewal
- HTTPS enforced

---

## Performance Optimizations

### 1. Enable Edge Functions

**Create:** `app/api/health/route.ts` (Edge Runtime)
```typescript
export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'content-type': 'application/json' },
  });
}
```

### 2. Implement ISR (Incremental Static Regeneration)

**Update:** `app/(dashboard)/analytics/page.tsx`
```typescript
export const revalidate = 300; // Revalidate every 5 minutes

export default async function AnalyticsPage() {
  // This page will be statically generated and revalidated
  const data = await fetchAnalytics();
  return <AnalyticsView data={data} />;
}
```

### 3. Add Loading States

**Create:** `app/(dashboard)/loading.tsx`
```typescript
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
    </div>
  );
}
```

---

## Monitoring & Analytics

### 1. Vercel Analytics (Built-in)

```bash
# Install
npm install @vercel/analytics

# Add to layout
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Vercel Speed Insights

```bash
# Install
npm install @vercel/speed-insights

// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3. Supabase Monitoring

- Go to Supabase Dashboard
- Check Database → Performance
- Monitor query performance
- Set up alerts for slow queries

---

## Cost Breakdown

### Free Tier (Perfect for Testing)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Vercel | Hobby Plan | 100GB bandwidth, 100 builds/day |
| Supabase | Free Plan | 500MB database, 1GB storage, 2GB bandwidth |
| Upstash | Free Plan | 10,000 commands/day |
| **Total** | **$0/month** | Good for development |

### Startup Tier (100-1,000 users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Supabase | Pro | $25/month |
| Upstash | Pay-as-you-go | ~$10/month |
| SendGrid | Essentials | $20/month |
| Twilio | Pay-as-you-go | ~$20/month |
| **Total** | | **$95/month** |

**Handles:**
- 1,000 active users
- 10,000 loans
- 100,000 API requests/day
- 10GB database

### Growth Tier (1,000-10,000 users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Supabase | Pro | $25/month (+ compute) |
| Supabase Compute | 2XL | $100/month |
| Upstash | Pro | $50/month |
| SendGrid | Premier | $90/month |
| Twilio | Pay-as-you-go | ~$100/month |
| **Total** | | **$385/month** |

**Handles:**
- 10,000 active users
- 100,000 loans
- 1M API requests/day
- 50GB database

### Scale Tier (10,000+ users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Enterprise | $200/month |
| Supabase | Team | $599/month |
| Upstash | Pro | $200/month |
| SendGrid | Premier | $200/month |
| Twilio | Pay-as-you-go | ~$300/month |
| **Total** | | **$1,499/month** |

**Handles:**
- 50,000+ active users
- 500,000+ loans
- 10M+ API requests/day
- 200GB+ database

---

## Deployment Checklist

### Pre-Deployment
- [ ] Update `lib/prisma.ts` to use environment variables
- [ ] Create Supabase project
- [ ] Run database migrations on Supabase
- [ ] Create Upstash Redis database
- [ ] Set up Vercel project
- [ ] Configure all environment variables
- [ ] Test locally with production database
- [ ] Add Redis caching to critical endpoints
- [ ] Implement rate limiting
- [ ] Add error tracking (Sentry)

### Deployment
- [ ] Deploy to Vercel
- [ ] Verify all environment variables
- [ ] Test authentication flow
- [ ] Test API endpoints
- [ ] Check database connections
- [ ] Verify Redis caching works
- [ ] Test rate limiting
- [ ] Check error logging

### Post-Deployment
- [ ] Set up custom domain
- [ ] Configure DNS
- [ ] Enable Vercel Analytics
- [ ] Set up Supabase backups
- [ ] Configure monitoring alerts
- [ ] Load test the application
- [ ] Document deployment process
- [ ] Create rollback plan

---

## Quick Deploy Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run migrations
npx prisma migrate deploy

# 4. Deploy to Vercel
vercel --prod

# 5. Set environment variables in Vercel
vercel env pull .env.production.local

# Done! Your app is live 🚀
```

---

## Advantages of Vercel + Supabase

### vs Railway
✅ Better global CDN (Vercel)
✅ More PostgreSQL features (Supabase)
✅ Built-in auth and storage
✅ Better free tier
❌ Slightly more complex setup

### vs AWS
✅ Much simpler setup (hours vs days)
✅ Lower cost for small-medium scale
✅ Better developer experience
✅ Automatic scaling
❌ Less control over infrastructure
❌ Higher cost at very large scale (100k+ users)

### vs DigitalOcean
✅ Better performance (global CDN)
✅ Automatic scaling
✅ Better monitoring tools
✅ Serverless benefits
❌ Slightly higher cost

---

## Troubleshooting

### Issue: Database Connection Timeout

**Solution:**
```typescript
// Increase timeout in lib/prisma.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increase this
});
```

### Issue: Vercel Function Timeout

**Solution:**
```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Issue: Redis Connection Errors

**Solution:**
```typescript
// Use Upstash REST API instead of Redis protocol
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

---

## Conclusion

**Vercel + Supabase is the BEST choice for your LoanOps application because:**

1. ✅ **Perfect Stack Match** - Built for Next.js + PostgreSQL
2. ✅ **Cost-Effective** - Start free, scale affordably
3. ✅ **Simple Deployment** - Deploy in minutes, not days
4. ✅ **Auto-Scaling** - Handles traffic spikes automatically
5. ✅ **Great DX** - Excellent developer experience
6. ✅ **Production-Ready** - Used by thousands of companies
7. ✅ **Global Performance** - CDN + edge functions
8. ✅ **Built-in Features** - Auth, storage, realtime included

**Recommended for:** Startups to medium-scale businesses (0-50k users)

**Start with Free Tier → Upgrade to Pro ($45/month) → Scale to Team ($624/month)**

Your app will be live in under 30 minutes! 🚀
