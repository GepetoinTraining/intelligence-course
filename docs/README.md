# Node Zero Documentation

> **AI Literacy Platform** | Educational management system with AI Companion integration

---

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture Overview](./architecture.md) | System architecture, tech stack, and design decisions |
| [Database Schema](./database-schema.md) | Complete table definitions and relationships |
| [API Reference](./api-reference.md) | All API endpoints organized by domain |
| [User Roles](./user-roles.md) | Role-based access control and permissions |
| [Payroll & Accounting](./payroll-accounting.md) | Enterprise payroll, double-entry bookkeeping, Lucro Real compliance |
| [AI Companion System](./ai-companion.md) | Memory topology and context building |
| [Ethics & Privacy](./ethics-privacy.md) | Data domains, AI Auditor, and student rights |
| [Frontend Components](./components.md) | Shared UI components library |
| [Deployment Guide](./deployment.md) | Environment setup and deployment |


---

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx drizzle-kit push:sqlite

# Start development server
npm run dev
```

---

## 🏗️ Project Structure

```
intelligence-course/
├── docs/                    # Documentation
├── public/                  # Static assets
├── scripts/                 # Database & utility scripts
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── student/     # Student toolbox
│   │   │   ├── teacher/     # Teacher portal
│   │   │   ├── parent/      # Parent portal
│   │   │   ├── staff/       # Staff CRM
│   │   │   ├── school/      # School admin
│   │   │   └── owner/       # Owner analytics
│   │   ├── api/             # API routes
│   │   ├── onboarding/      # Public onboarding flow
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   │   ├── layout/          # AppLayout, headers
│   │   ├── shared/          # Reusable components
│   │   └── ui/              # Base UI elements
│   └── lib/                 # Utilities & services
│       ├── db/              # Drizzle schema & queries
│       ├── ai/              # AI Companion & Auditor
│       └── auth/            # Authentication helpers
├── .env.local               # Environment variables
├── drizzle.config.ts        # Drizzle ORM config
└── package.json
```

---

## 🔑 Key Concepts

### User Roles

| Role | Primary Users | Access |
|------|--------------|--------|
| `student` | Enrolled students | Lessons, toolbox, AI Companion |
| `teacher` | Instructors | Classes, attendance, grades |
| `parent` | Guardians | Child progress, billing, alerts |
| `staff` | Reception/Sales | CRM, leads, trials, check-in |
| `school` | School Admin | All operations, scheduling |
| `owner` | Business Owner | Financial analytics, BI |

### Data Domains (Ethics Policy)

| Domain | Contents | Access |
|--------|----------|--------|
| **Institutional** | Grades, attendance, certificates | Teachers, parents, staff |
| **Relational** | AI memories, conversations | Student only (encrypted) |
| **Supervision** | Metadata, alerts, audit logs | AI Auditor, coordinators |

### Memory System (Memory Topology)

| Component | Purpose |
|-----------|---------|
| **Memory Graph** | Lossy topology of nodes + edges with gravity |
| **Ledger** | Lossless critical facts (promises, secrets, debts) |
| **World Overlay** | Student's fog-of-war perspective |
| **Compression** | SNR-based double-layer compression |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Mantine UI v7, CSS |
| **3D Graphics** | React Three Fiber, Three.js |
| **Database** | Turso (LibSQL), Drizzle ORM |
| **Authentication** | Clerk |
| **AI** | Anthropic Claude API |
| **Email** | Resend |
| **Payments** | PIX (Asaas), Stripe |
| **Deployment** | Vercel |

---

## 📊 Current Status

See [CHECKLISTS.md](../CHECKLISTS.md) for detailed implementation status.

| Category | Frontend | Backend |
|----------|----------|---------|
| Student Experience | ✅ 90% | ⏳ 10% |
| Teacher Experience | ✅ 70% | ⏳ 0% |
| Parent Experience | ✅ 80% | ⏳ 0% |
| Staff CRM | ✅ 95% | ⏳ 0% |
| School Admin | ✅ 85% | ⏳ 0% |
| Owner Analytics | ✅ 75% | ⏳ 0% |
| AI Companion | ⏳ Design | ⏳ 0% |
| Ethics/Auditor | ⏳ Design | ⏳ 0% |

---

## 📄 License

Proprietary - Eco Escola e Coworking Educacional

---

*Last updated: 2026-02-03*
