# Phase 2 Enterprise Features - Setup Guide

## Overview

This guide covers the setup and configuration for Phase 2 Enterprise Features including authentication, database, notifications, and subscription management.

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or use Prisma local dev database)
- Redis 7+
- Twilio account (for SMS)
- SendGrid account (for Email)

## Dependencies Installed

### Core Dependencies
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI and migrations
- `ioredis` - Redis client for sessions and caching
- `next-auth` - Authentication for Next.js
- `bcryptjs` - Password hashing
- `zod` - Schema validation

### Notification Services
- `twilio` - SMS notifications
- `@sendgrid/mail` - Email notifications

### PDF & Security
- `pdfkit` - PDF receipt generation
- `speakeasy` - TOTP for MFA
- `qrcode` - QR code generation for MFA
- `@upstash/ratelimit` - Rate limiting

### Background Jobs
- `bullmq` - Job queue for scheduled tasks

### Development Dependencies
- `@types/qrcode` - TypeScript types for qrcode
- `fast-check` - Property-based testing

## Environment Variables

### Required Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Database Setup

**Option 1: Prisma Local Dev Database (Recommended for Development)**
```bash
# Already configured in .env
# Prisma will manage the local database automatically
npx prisma dev
```

**Option 2: External PostgreSQL**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/loanops?schema=public"
```

### Redis Setup

**Local Redis:**
```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Or use Docker
docker run -d -p 6379:6379 redis:7-alpine
```

**Redis Cloud:**
```env
REDIS_URL="redis://username:password@host:port"
```

### NextAuth Configuration

Generate a secure secret:
```bash
openssl rand -base64 32
```

Update `.env`:
```env
NEXTAUTH_SECRET=your-generated-secret-here
```

### Twilio Setup (SMS)

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Update `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### SendGrid Setup (Email)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Verify sender email
4. Update `.env`:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=LoanOps
```

## Database Schema

The Prisma schema includes:
- **User** - Authentication and user management
- **Tenant** - Multi-tenant organization data
- **Customer** - Borrower information
- **Loan** - Loan details with grace periods
- **Collection** - Payment records
- **AuditLog** - Immutable audit trail
- **Notification** - SMS/Email notification tracking
- **NotificationTemplate** - Customizable templates
- **ApiKey** - API key management
- **UsageMetric** - Subscription usage tracking

## Next Steps

1. **Initialize Database Schema** (Task 2)
   ```bash
   cd loanops-web
   npx prisma migrate dev --name init
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests** (after implementation)
   ```bash
   npm test
   ```

## Verification

Check that all services are running:

```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Check PostgreSQL (if using external)
psql -U user -d loanops -c "SELECT version();"

# Check Prisma
npx prisma studio
# Opens database browser at http://localhost:5555
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Restart Redis
brew services restart redis
```

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset
```

### Environment Variable Issues
```bash
# Verify variables are loaded
node -e "console.log(process.env.DATABASE_URL)"
```

## Security Notes

⚠️ **Important Security Reminders:**

1. Never commit `.env` file to version control
2. Use strong secrets in production (min 32 characters)
3. Rotate API keys regularly
4. Use HTTPS in production
5. Enable MFA for admin accounts
6. Review audit logs regularly

## Production Deployment

Before deploying to production:

1. ✅ Set strong `NEXTAUTH_SECRET`
2. ✅ Configure production database with SSL
3. ✅ Use managed Redis (AWS ElastiCache, Upstash, etc.)
4. ✅ Set up database backups
5. ✅ Configure CORS with specific origins
6. ✅ Enable rate limiting
7. ✅ Set up monitoring (Sentry, DataDog)
8. ✅ Review security headers
9. ✅ Test notification delivery
10. ✅ Run full test suite

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Twilio API Documentation](https://www.twilio.com/docs)
- [SendGrid API Documentation](https://docs.sendgrid.com)
- [Redis Documentation](https://redis.io/docs)

---

**Setup Complete!** ✅

You're now ready to proceed with Task 2: Create database schema and migrations.
