# Deployment Guide

## Overview

Node Zero is deployed using the following stack:
- **Frontend/API**: Vercel (Next.js)
- **Database**: Turso (LibSQL)
- **Authentication**: Clerk
- **File Storage**: Cloudflare R2
- **Email**: Resend
- **Payments**: Stripe (international), Asaas (PIX/Boleto)

---

## Prerequisites

Before deploying, ensure you have accounts with:
- [ ] Vercel (hosting)
- [ ] Turso (database)
- [ ] Clerk (authentication)
- [ ] Anthropic (AI)
- [ ] Resend (email)
- [ ] Cloudflare (R2 storage)
- [ ] Stripe (payments)
- [ ] Asaas (PIX/Boleto)

---

## Environment Variables

### Required Variables

```env
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@nodezero.app

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=nodezero-uploads
R2_PUBLIC_URL=https://uploads.nodezero.app

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Payments (Asaas - PIX/Boleto)
ASAAS_API_KEY=xxx
ASAAS_WEBHOOK_TOKEN=xxx
ASAAS_ENVIRONMENT=production

# Application
NEXT_PUBLIC_APP_URL=https://nodezero.app
ENCRYPTION_SALT=random-32-character-string
```

### Development vs Production

| Variable | Development | Production |
|----------|-------------|------------|
| `TURSO_DATABASE_URL` | Local file or dev instance | Production Turso URL |
| `CLERK_*` | Test keys (pk_test_, sk_test_) | Live keys (pk_live_, sk_live_) |
| `STRIPE_*` | Test keys | Live keys |
| `ASAAS_ENVIRONMENT` | sandbox | production |

---

## Database Setup

### 1. Create Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create nodezero-production --location gru

# Get connection info
turso db show nodezero-production --url
turso db tokens create nodezero-production
```

### 2. Run Migrations

```bash
# Generate migrations from schema
npx drizzle-kit generate:sqlite

# Apply to production
npx drizzle-kit push:sqlite
```

### 3. Seed Initial Data

```bash
# Run seed script
npm run db:seed
```

---

## Vercel Setup

### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

### 2. Configure Environment Variables

```bash
# Add each variable
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
# ... etc
```

Or use the Vercel dashboard: Project Settings → Environment Variables

### 3. Configure Build Settings

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

### 4. Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

---

## Clerk Configuration

### 1. Create Application

1. Go to [clerk.com](https://clerk.com)
2. Create new application
3. Select authentication methods (Email, Google, etc.)

### 2. Configure Webhooks

Set up webhook for user sync:

**Endpoint**: `https://nodezero.app/api/webhooks/clerk`

**Events**:
- `user.created`
- `user.updated`
- `user.deleted`
- `organization.created`
- `organization.updated`
- `organizationMembership.created`

### 3. Configure Roles

In Clerk Dashboard → Organizations → Roles:

| Role | Key |
|------|-----|
| Student | `org:student` |
| Teacher | `org:teacher` |
| Parent | `org:parent` |
| Staff | `org:staff` |
| Admin | `org:school` |
| Owner | `org:owner` |

### 4. Middleware Configuration

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/onboarding(.*)',
  '/api/webhooks(.*)',
  '/api/leads', // POST only
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});
```

---

## Payment Configuration

### Stripe Setup

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API Keys
3. Configure webhook:
   - Endpoint: `https://nodezero.app/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `charge.refunded`, `invoice.paid`

### Asaas Setup (PIX/Boleto)

1. Create Asaas account at [asaas.com](https://asaas.com)
2. Get API key from Settings → API
3. Configure webhook:
   - Endpoint: `https://nodezero.app/api/webhooks/asaas`
   - Events: `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`

---

## Email Configuration

### Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Add and verify sending domain
3. Get API key

### Domain Verification

Add these DNS records:

```
Type: TXT
Name: _resend
Value: [provided by Resend]

Type: MX
Name: [your domain]
Value: feedback-smtp.resend.com
Priority: 10
```

---

## File Storage (R2)

### 1. Create R2 Bucket

In Cloudflare Dashboard:
1. Go to R2 → Create bucket
2. Name: `nodezero-uploads`
3. Location: Auto

### 2. Create API Tokens

1. Go to R2 → Manage R2 API Tokens
2. Create token with Object Read & Write permissions
3. Save Access Key ID and Secret Access Key

### 3. Configure Public Access (Optional)

For public file serving:
1. Enable public access on bucket
2. Configure custom domain: `uploads.nodezero.app`

---

## Monitoring Setup

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### Vercel Analytics

```typescript
// src/app/layout.tsx
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

---

## Security Checklist

### Before Production

- [ ] All environment variables set in Vercel
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Clerk in production mode
- [ ] Stripe in live mode
- [ ] Database backups enabled
- [ ] Error tracking configured
- [ ] Rate limiting implemented
- [ ] CORS configured correctly
- [ ] Webhook secrets validated
- [ ] Encryption salt securely generated

### Ongoing

- [ ] Regular dependency updates
- [ ] Security audit logs reviewed
- [ ] Access control tested
- [ ] Backup restoration tested
- [ ] Incident response plan documented

---

## Domain Configuration

### 1. Add Custom Domain in Vercel

1. Go to Project Settings → Domains
2. Add `nodezero.app`
3. Configure DNS records as shown

### 2. DNS Records

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL Certificate

Automatic with Vercel via Let's Encrypt.

---

## Rollback Procedure

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# List database snapshots (Turso)
turso db list-snapshots nodezero-production

# Restore from snapshot
turso db restore nodezero-production --snapshot [snapshot-id]
```

---

## Scaling Considerations

### Database

- Turso automatically scales reads
- Consider read replicas for high traffic
- Index optimization for common queries

### Vercel

- Auto-scales by default
- Consider Edge Functions for global performance
- Use ISR for static content caching

### AI Calls

- Implement request queuing for high volume
- Cache common AI responses
- Use streaming for better UX

---

## Cost Estimation

| Service | Free Tier | Production Estimate |
|---------|-----------|---------------------|
| Vercel | 100GB bandwidth | $20/mo (Pro) |
| Turso | 9 DB, 8GB storage | $29/mo (Scaler) |
| Clerk | 10k MAU | $25/mo (Pro) |
| Anthropic | — | $50-200/mo (usage) |
| Resend | 3k emails/mo | $20/mo |
| R2 | 10GB storage | $5-10/mo |
| Stripe | 2.9% + $0.30 | Variable |
| Asaas | 2.99% (PIX) | Variable |

**Estimated Monthly Cost**: $150-350 + payment processing fees

---

*Last updated: 2026-02-03*
