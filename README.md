# NodeZero App

> **AI-Powered Educational Management Platform** | Multi-tenant school operations with AI Companion integration

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Mantine](https://img.shields.io/badge/Mantine-8-blue)](https://mantine.dev)
[![Turso](https://img.shields.io/badge/Turso-SQLite-teal)](https://turso.tech)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)](https://clerk.com)

---

## Overview

NodeZero is a comprehensive SaaS platform for managing educational institutions. It provides:

- **Multi-tenant architecture** - Each school operates as an isolated organization
- **14 modular admin bundles** - Marketing, Sales, Operations, Academic, Financial, HR, Accounting, and more
- **AI Companion** - Personalized learning assistant with memory topology
- **Lattice Interview System** - Skill/personality mapping for students and candidates
- **Brazilian Compliance** - Full Lucro Real accounting and fiscal document integration

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **UI** | Mantine 8, Tabler Icons, React Three Fiber |
| **Database** | Turso (LibSQL), Drizzle ORM |
| **Auth** | Clerk (multi-tenant organizations) |
| **AI** | Anthropic Claude, Google Gemini (embeddings) |
| **Payments** | Stripe, Asaas (PIX/Boleto) |
| **Deployment** | Vercel |

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Apply database schema
npx drizzle-kit push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Environment Variables

See [`.env.example`](./.env.example) for the full template. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `TURSO_DATABASE_URL` | ✅ | Turso database connection URL |
| `TURSO_AUTH_TOKEN` | ✅ | Turso authentication token |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend key |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend key |
| `ANTHROPIC_API_KEY` | ✅ | Claude API for AI features |
| `ENCRYPTION_KEY` | ✅ | 64-char hex for API key encryption |

For local development without Clerk, set `NEXT_PUBLIC_DEV_AUTH=true`.

---

## Project Structure

```
intelligence-course/
├── docs/                    # Detailed documentation
├── drizzle/                 # Database migrations
├── public/                  # Static assets
├── scripts/                 # Utility scripts
└── src/
    ├── app/                 # Next.js App Router
    │   ├── (auth)/          # Sign-in/up pages
    │   ├── (dashboard)/     # Protected dashboard
    │   ├── [orgSlug]/       # Org-scoped landing pages
    │   ├── admin/           # Admin panel (110+ pages)
    │   └── api/             # API routes
    ├── components/          # React components
    └── lib/                 # Utilities & services
        ├── db/              # Drizzle schema & client
        ├── ai/              # AI Companion engine
        └── lattice/         # Interview system
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/architecture.md) | System design and patterns |
| [Database Schema](./docs/database-schema.md) | Complete table definitions |
| [API Reference](./docs/api-reference.md) | All API endpoints |
| [User Roles](./docs/user-roles.md) | RBAC and permissions |
| [Deployment](./docs/deployment.md) | Vercel setup and env vars |
| [AI Companion](./docs/ai-companion.md) | Memory topology system |
| [Ethics & Privacy](./docs/ethics-privacy.md) | Data domains and LGPD |

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Important:** Configure all environment variables in Vercel Dashboard before first deployment. See [docs/deployment.md](./docs/deployment.md) for the complete checklist.

---

## Development

```bash
# Run dev server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Apply schema changes
npx drizzle-kit push
```

---

## License

Proprietary - Eco Escola e Coworking Educacional

---

*Built with ❤️ by NodeZero Team*
