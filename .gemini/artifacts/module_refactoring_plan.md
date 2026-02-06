# Module Refactoring Plan

> Systematic restructuring from flat to modular architecture

---

## Current State Summary

```
src/
├── app/
│   ├── (dashboard)/     # 21 portal folders (mixed concerns)
│   │   ├── owner/       # 18 children
│   │   ├── staff/       # 20 children
│   │   ├── student/     # 12 children
│   │   ├── teacher/     # 6 children
│   │   ├── marketing/   # 4 children
│   │   ├── school/      # 16 children
│   │   └── ... 15 more
│   └── api/             # 86 API route folders (flat!)
├── components/          # 12 folders (partially organized)
│   ├── shared/          # 18 items
│   ├── scrm/            # 3 items
│   ├── lattice/         # 4 items
│   └── ... 9 more
└── lib/                 # 13 folders + 4 files
    ├── ai/              # 13 items
    ├── db/              # schema + index
    ├── identity/        # 2 items (NEW)
    ├── lattice/         # 7 items
    └── ... 9 more
```

**Problems:**
1. 86 flat API folders - hard to find things
2. Portal folders mix multiple modules
3. No clear module boundaries
4. Shared components scattered
5. Schema is one 6500+ line file

---

## Target State

```
src/
├── modules/                    # Domain modules
│   ├── core/                   # Identity, orgs, auth
│   │   ├── components/
│   │   ├── api/
│   │   ├── lib/
│   │   └── types/
│   ├── management/             # Settings, permissions
│   ├── pedagogical/            # Curriculum, progress
│   ├── marketing/              # Campaigns, leads
│   ├── sales/                  # Pipeline, enrollment
│   ├── hr/                     # Staff, payroll, careers
│   ├── accounting/             # Fiscal, reports
│   ├── operations/             # Rooms, schedules
│   ├── payments/               # Gateway, invoices
│   ├── toolbox/                # Tools
│   │   ├── student/
│   │   ├── teacher/
│   │   └── staff/
│   ├── relationships/          # SCRM
│   ├── ai-companion/           # Memory, auditor
│   ├── analytics/              # Dashboards
│   └── communications/         # Messaging
├── shared/                     # Cross-module components
│   ├── components/
│   │   ├── ui/                 # Button, Input, etc.
│   │   ├── layout/             # Shell, Sidebar, Header
│   │   └── data/               # Table, Charts, etc.
│   ├── hooks/
│   ├── utils/
│   └── types/
├── app/                        # Routing only
│   ├── (portals)/              # Portal route groups
│   │   ├── owner/
│   │   ├── teacher/
│   │   ├── student/
│   │   └── ...
│   └── api/                    # Re-exports from modules
└── lib/
    └── db/                     # Schema (might split later)
```

---

## Module Audit Process

For each module:
1. **Identify** - What exists in current codebase?
2. **Map** - Current location → Target location
3. **Gap** - What's missing vs spec?
4. **Dependencies** - What does it import/export?
5. **Checklist** - Tasks to complete

---

## MODULE 1: CORE (Identity & Organizations)

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Schema** | `lib/db/schema.ts` lines 1-500 | persons, users, orgs, roles |
| **Auth helpers** | `lib/auth.ts`, `lib/auth/` | getCurrentUser |
| **Identity helpers** | `lib/identity/` | person-helpers, index |
| **Clerk webhook** | `api/webhooks/clerk/` | User sync |
| **User API** | `api/users/` | CRUD |
| **Profile API** | `api/profile/` | 8 sub-routes |
| **Roles API** | `api/roles/` | Role management |
| **Onboarding API** | `api/onboarding/` | 4 sub-routes |
| **Onboarding page** | `app/onboarding/` | UI |
| **Profile page** | `app/(dashboard)/profile/` | UI |
| **Auth component** | `components/auth/` | 1 item |

### Target Structure

```
src/modules/core/
├── components/
│   ├── auth/
│   │   └── UserButton.tsx
│   ├── profile/
│   │   └── ProfileForm.tsx
│   └── onboarding/
│       └── OnboardingWizard.tsx
├── api/
│   ├── users/
│   ├── profile/
│   ├── roles/
│   └── onboarding/
├── lib/
│   ├── auth.ts
│   ├── person-helpers.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── schema/
    └── identity.ts           # persons, users, orgs, roles
```

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Person normalization | ✅ | Just added |
| Role junction tables | ✅ | Just added |
| Clerk integration | ✅ | Exists |
| ensurePersonForUser | ✅ | Exists, needs hook into Clerk webhook |
| Profile editing | ✅ | Exists |
| Onboarding flow | 🔶 | Exists, needs Lattice interview integration |
| Multi-org switching | ❌ | Not implemented |
| User impersonation | ❌ | Not implemented (admin feature) |

### Checklist

- [ ] Move `lib/auth.ts` → `modules/core/lib/auth.ts`
- [ ] Move `lib/identity/` → `modules/core/lib/identity/`
- [ ] Move `components/auth/` → `modules/core/components/auth/`
- [ ] Move `api/users/` → `modules/core/api/users/`
- [ ] Move `api/profile/` → `modules/core/api/profile/`
- [ ] Move `api/roles/` → `modules/core/api/roles/`
- [ ] Move `api/onboarding/` → `modules/core/api/onboarding/`
- [ ] Move `api/webhooks/clerk/` → `modules/core/api/webhooks/clerk/`
- [ ] Create re-export in `app/api/` for backwards compat
- [ ] Update Clerk webhook to call `ensurePersonForUser`
- [ ] Extract schema lines 1-500 → `core/schema/identity.ts`
- [ ] Add multi-org switching
- [ ] Add user impersonation for admins

---

## MODULE 2: MANAGEMENT

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Settings pages** | `app/(dashboard)/owner/` | 18 children |
| **Permissions lib** | `lib/permissions.ts` | 16KB |
| **Permission middleware** | `lib/permission-middleware.ts` | 9KB |
| **Permission groups API** | `api/permission-groups/` | |
| **Permissions API** | `api/permissions/` | 2 routes |
| **User overrides API** | `api/user-overrides/` | |
| **Position permissions** | `api/position-permissions/` | |
| **API keys** | `api/api-keys/` | |
| **Domains** | `api/domains/` | 3 routes |
| **Teams** | `api/teams/` + pages | |

### Target Structure

```
src/modules/management/
├── components/
│   ├── settings/
│   ├── permissions/
│   ├── teams/
│   └── integrations/
├── api/
│   ├── settings/
│   ├── permissions/
│   ├── api-keys/
│   └── domains/
├── lib/
│   ├── permissions.ts
│   └── permission-middleware.ts
├── types/
└── schema/
    └── permissions.ts
```

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Permission groups | ✅ | Exists |
| Granular permissions | ✅ | Exists |
| User overrides | ✅ | Exists |
| Expiring permissions | ✅ | Exists |
| Audit log | 🔶 | Partially exists |
| API keys | ✅ | Exists |
| Custom domains | 🔶 | Schema exists, UI incomplete |
| Integrations hub | ❌ | Not implemented |
| Webhook management | 🔶 | Incoming exists, outgoing not |

### Checklist

- [ ] Move `lib/permissions.ts` → `modules/management/lib/`
- [ ] Move `lib/permission-middleware.ts` → `modules/management/lib/`
- [ ] Move permission APIs → `modules/management/api/`
- [ ] Move owner settings pages → `modules/management/components/`
- [ ] Create settings dashboard
- [ ] Complete custom domain UI
- [ ] Add integrations hub page
- [ ] Add outgoing webhooks

---

## MODULE 3: PEDAGOGICAL

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Courses API** | `api/courses/` | 2 routes |
| **Modules API** | `api/modules/` | 2 routes |
| **Lessons API** | `api/lessons/` | 2 routes |
| **Progress API** | `api/progress/` | |
| **Prompts API** | `api/prompts/` | 3 routes |
| **Runs API** | `api/runs/` | |
| **Techniques API** | `api/techniques/` | 2 routes |
| **School pages** | `app/(dashboard)/school/` | 16 children |
| **Student pages** | `app/(dashboard)/student/` | 12 children |
| **Teacher pages** | `app/(dashboard)/teacher/` | 6 children |
| **Lesson components** | `components/lesson/` | |
| **Playground** | `components/playground/` | 3 items |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Course structure | ✅ | Exists |
| Lesson content | ✅ | Exists |
| Progress tracking | ✅ | Exists |
| Prompt library | ✅ | Exists |
| Prompt runs | ✅ | Exists |
| Assessments | ❌ | Schema exists, no UI |
| Grading | ❌ | Not implemented |
| Certificates | ❌ | Not implemented |

### Checklist

- [ ] Move course/module/lesson APIs → `modules/pedagogical/api/`
- [ ] Move prompt APIs → `modules/pedagogical/api/`
- [ ] Move progress APIs → `modules/pedagogical/api/`
- [ ] Move lesson components → `modules/pedagogical/components/`
- [ ] Move playground components → `modules/pedagogical/components/`
- [ ] Create assessment UI
- [ ] Add grading system
- [ ] Add certificate generation

---

## MODULE 4: MARKETING

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Marketing pages** | `app/(dashboard)/marketing/` | 4 children |
| **Campaigns API** | `api/campaigns/` | 2 routes |
| **Leads API** | `api/leads/` | 4 routes |
| **Referrals API** | `api/referrals/` | 2 routes |
| **SCRM components** | `components/scrm/` | 3 items |
| **SCRM API** | `api/scrm/` | 6 sub-routes |
| **Waitlist API** | `api/waitlist/` | |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Campaign management | 🔶 | Basic, needs enhancement |
| Lead capture | ✅ | Exists |
| Lead stages | ✅ | Exists |
| UTM tracking | ✅ | In schema |
| A/B testing | ❌ | Not implemented |
| Content calendar | ❌ | Not implemented |
| Email marketing | ❌ | Not implemented |
| Referral system | ✅ | Exists |

### Checklist

- [ ] Move marketing pages → `modules/marketing/components/`
- [ ] Move campaigns/leads/referrals APIs → `modules/marketing/api/`
- [ ] Consolidate SCRM components
- [ ] Add A/B testing system
- [ ] Add content calendar
- [ ] Add email marketing integration

---

## MODULE 5: SALES

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Enrollments API** | `api/enrollments/` | 4 routes |
| **Discounts API** | `api/discounts/` | 2 routes |
| **Products API** | `api/products/` | 2 routes |
| **Trials API** | `api/trials/` | 2 routes |
| **Staff dashboard** | `app/(dashboard)/staff/` | 20 children (mixed) |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Enrollment flow | ✅ | Exists |
| Product catalog | ✅ | Exists |
| Discount system | ✅ | Exists |
| Trial management | ✅ | Exists |
| Proposal generation | ❌ | Not implemented |
| Negotiation tracking | ❌ | Not implemented |
| Sales targets | ❌ | Not implemented |
| Commission calculation | 🔶 | Basic in teacherRoles |

### Checklist

- [ ] Move enrollment APIs → `modules/sales/api/`
- [ ] Move discount/product APIs → `modules/sales/api/`
- [ ] Create sales dashboard
- [ ] Add proposal system
- [ ] Add negotiation tracking
- [ ] Add sales targets/KPIs
- [ ] Add commission calculation

---

## MODULE 6: HR

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Staff contracts API** | `api/staff-contracts/` | 2 routes |
| **Staff leave API** | `api/staff-leave/` | 2 routes |
| **Staff payroll API** | `api/staff-payroll/` | 2 routes |
| **Payroll payments** | `api/payroll-payments/` | |
| **Teacher contracts** | `api/teacher-contracts/` | 2 routes |
| **Talent API** | `api/talent/` | 3 routes |
| **Careers API** | `api/careers/` | 4 routes |
| **Careers pages** | `app/careers/` | Public portal |
| **Talent pages** | `app/(dashboard)/talent/` | |
| **Lattice lib** | `lib/lattice/` | 7 items |
| **Lattice components** | `components/lattice/` | 4 items |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Staff management | ✅ | Enhanced with CLT/PJ |
| Payroll | 🔶 | Basic, needs IRRF/INSS calc |
| Leave tracking | ✅ | Exists |
| Cargo de confiança | ✅ | Just added |
| 3x3 insights for staff | ✅ | Just added |
| Turnover prediction | ✅ | Fields added, no ML |
| Training records | ✅ | Just added |
| Careers portal | ✅ | Exists |
| Lattice HR | ✅ | Exists |
| Job matching | 🔶 | Schema exists, algorithm incomplete |

### Checklist

- [ ] Move staff APIs → `modules/hr/api/`
- [ ] Move talent/careers APIs → `modules/hr/api/`
- [ ] Move lattice lib → `modules/hr/lib/lattice/`
- [ ] Move lattice components → `modules/hr/components/lattice/`
- [ ] Complete IRRF/INSS calculation
- [ ] Add dissídio automation
- [ ] Complete job matching algorithm
- [ ] Add org chart visualization

---

## MODULE 7: ACCOUNTING

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Chart of accounts** | `api/chart-of-accounts/` | 2 routes |
| **Journal entries** | `api/journal-entries/` | 2 routes |
| **Cost centers** | `api/cost-centers/` | 2 routes |
| **Fiscal documents** | `api/fiscal-documents/` | 2 routes |
| **Export lib** | `lib/export/` | 2 items |
| **Financial lib** | `lib/financial/` | 1 item |
| **Schemas** | `lib/schemas/` | 5 items |
| **Accountant pages** | `app/accountant/` | Portal |
| **Financial pages** | `app/(dashboard)/financial/` | |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Chart of accounts | ✅ | Exists |
| Journal entries | ✅ | Exists |
| Cost centers | ✅ | Exists |
| Fiscal documents | ✅ | Exists |
| DRE | ✅ | Exists |
| Balancete | ✅ | Exists |
| Balanço | ✅ | Exists |
| SPED export | 🔶 | Partial |
| Bank reconciliation | 🔶 | Schema exists, no UI |

### Checklist

- [ ] Move accounting APIs → `modules/accounting/api/`
- [ ] Move export lib → `modules/accounting/lib/`
- [ ] Move financial lib → `modules/accounting/lib/`
- [ ] Move schemas → `modules/accounting/lib/schemas/`
- [ ] Complete SPED export
- [ ] Add bank reconciliation UI
- [ ] Add automated closing

---

## MODULE 8: OPERATIONS

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Rooms API** | `api/rooms/` | 2 routes |
| **Schedules API** | `api/schedules/` | 2 routes |
| **Classes API** | `api/classes/` | 2 routes |
| **Attendance API** | `api/attendance/` | 1 route |
| **Calendar component** | `components/calendar/` | 1 item |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Room management | ✅ | Exists |
| Schedule management | ✅ | Exists |
| Class instances | ✅ | Exists |
| Attendance tracking | ✅ | Exists |
| Resource booking | ❌ | Not implemented |
| Academic calendar | 🔶 | Schema exists, no UI |

### Checklist

- [ ] Move operations APIs → `modules/operations/api/`
- [ ] Move calendar component → `modules/operations/components/`
- [ ] Add resource booking
- [ ] Add academic calendar UI

---

## MODULE 9: PAYMENTS

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Invoices API** | `api/invoices/` | 3 routes |
| **Payment methods** | `api/payment-methods/` | 2 routes |
| **Transactions** | `api/transactions/` | 2 routes |
| **Payables** | `api/payables/` | 2 routes |
| **Payouts** | `api/payouts/` | 3 routes |
| **Payments lib** | `lib/payments/` | 2 items |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Invoice generation | ✅ | Exists |
| Payment methods | ✅ | Exists |
| Transactions | ✅ | Exists |
| Payables | ✅ | Exists |
| Payouts | ✅ | Exists |
| Subscriptions | ❌ | Not implemented |
| Gateway integration | 🔶 | Structure exists, no real gateway |
| PIX | ✅ | Schema exists |

### Checklist

- [ ] Move payment APIs → `modules/payments/api/`
- [ ] Move payments lib → `modules/payments/lib/`
- [ ] Add subscription management
- [ ] Integrate real payment gateway
- [ ] Add PIX QR code generation

---

## MODULE 10: TOOLBOX

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Student prompts API** | `api/student-prompts/` | 2 routes |
| **Techniques API** | `api/techniques/` | 2 routes |
| **Todos API** | `api/todos/` | 2 routes |
| **Workshops API** | `api/workshops/` | 2 routes |
| **Challenges API** | `api/challenges/` | 2 routes |
| **Capstones API** | `api/capstones/` | 2 routes |
| **Knowledge nodes/edges** | `api/knowledge-*` | 4 routes |
| **Student pages** | `app/(dashboard)/student/` | Many toolbox pages |
| **Todo component** | `components/todo/` | |
| **Shared components** | `components/shared/` | 18 items |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Student prompt library | ✅ | Exists |
| Technique tracker | ✅ | Exists |
| To-Do Cube | ✅ | Exists |
| Problem Workshop | ✅ | Exists |
| Challenge Board | ✅ | Exists |
| Capstone Project | ✅ | Exists |
| Knowledge Constellation | ✅ | Exists |
| Teacher tools | ❌ | Limited |
| Staff tools | ❌ | Limited |

### Checklist

- [ ] Move student tool APIs → `modules/toolbox/student/api/`
- [ ] Move student tool components → `modules/toolbox/student/components/`
- [ ] Create teacher toolbox
- [ ] Create staff toolbox
- [ ] Add shared tools (templates, etc.)

---

## MODULE 11: RELATIONSHIPS (SCRM)

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **SCRM API** | `api/scrm/` | 6 sub-routes |
| **CRM API** | `api/crm/` | 3 routes |
| **Family links** | `api/family-links/` | 2 routes |
| **Parent API** | `api/parent/` | 5 routes |
| **SCRM components** | `components/scrm/` | 3 items |
| **Parent pages** | `app/(dashboard)/parent/` | 3 children |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| 3x3 insights | ✅ | Just standardized |
| Sentiment tracking | ✅ | Exists |
| Family links | ✅ | Exists |
| Parent portal | ✅ | Exists |
| AI persona | 🔶 | Schema exists, generation partial |
| Insight communications | ✅ | Exists |

### Checklist

- [ ] Move SCRM APIs → `modules/relationships/api/`
- [ ] Move CRM APIs → `modules/relationships/api/`
- [ ] Move parent APIs → `modules/relationships/api/`
- [ ] Move SCRM components → `modules/relationships/components/`
- [ ] Complete AI persona generation

---

## MODULE 12: AI COMPANION

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **AI lib** | `lib/ai/` | 13 items |
| **Memory API** | `api/memory/` | 13 sub-routes |
| **Auditor API** | `api/auditor/` | 5 sub-routes |
| **Rights API** | `api/rights/` | 6 sub-routes |
| **Chat API** | `api/chat/` | 5 routes |
| **Communicator API** | `api/communicator/` | 5 routes |
| **Communicator components** | `components/communicator/` | 1 item |
| **Embeddings lib** | `lib/embeddings/` | 3 items |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Memory graph | ✅ | Exists |
| Narrative ledger | ✅ | Exists |
| Memory compression | ✅ | Exists |
| Synapse tools | ✅ | Exists |
| Lattice interview | ✅ | Just added |
| Auditor | ✅ | Exists |
| Student rights (D4-D6) | ✅ | Exists |
| Wellbeing indicators | ✅ | Exists |

### Checklist

- [ ] Move AI lib → `modules/ai-companion/lib/`
- [ ] Move memory/auditor/rights APIs → `modules/ai-companion/api/`
- [ ] Move chat/communicator → `modules/ai-companion/api/`
- [ ] Move embeddings → `modules/ai-companion/lib/`
- [ ] Move communicator components → `modules/ai-companion/components/`

---

## MODULE 13: ANALYTICS

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Export API** | `api/export/` | |
| **Dashboard pages** | `app/(dashboard)/dashboard/` | |
| **Various dashboard widgets** | Scattered | |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| Role dashboards | 🔶 | Partial |
| Data export | ✅ | Exists |
| Reports | 🔶 | Accounting only |
| Predictions | ❌ | Not implemented |
| Charts | 🔶 | Scattered |

### Checklist

- [ ] Create analytics module structure
- [ ] Consolidate dashboard components
- [ ] Move export API → `modules/analytics/api/`
- [ ] Create unified reporting system
- [ ] Add prediction engine (ML)

---

## MODULE 14: COMMUNICATIONS

### Current Locations

| What | Current Path | Notes |
|------|-------------|-------|
| **Communicator API** | `api/communicator/` | 5 routes |
| **Alerts API** | `api/alerts/` | 5 routes |
| **Notes API** | `api/notes/` | |
| **Inbox pages** | `app/(dashboard)/inbox/` | 2 children |
| **Communicator component** | `components/communicator/` | |

### Gap Analysis

| Feature | Status | Notes |
|---------|--------|-------|
| In-app messaging | ✅ | Exists |
| Conversations | ✅ | Exists |
| Notifications | 🔶 | Queue exists, delivery limited |
| Alerts | ✅ | Exists |
| Announcements | ❌ | Not implemented |
| Email integration | ❌ | Not implemented |
| WhatsApp | ❌ | Not implemented |

### Checklist

- [ ] Move communicator to communications module
- [ ] Move alerts API → `modules/communications/api/`
- [ ] Add announcement system
- [ ] Add email service
- [ ] Add WhatsApp integration

---

## Execution Order

Based on dependencies, refactor in this order:

1. **CORE** - Everything depends on it
2. **MANAGEMENT** - Permissions used everywhere
3. **COMMUNICATIONS** - Used by many modules
4. **PEDAGOGICAL** - Core business
5. **TOOLBOX** - Student/teacher experience
6. **RELATIONSHIPS** - SCRM layer
7. **AI COMPANION** - Depends on relationships
8. **MARKETING** - Lead gen
9. **SALES** - Conversion
10. **PAYMENTS** - Revenue
11. **HR** - Staff
12. **ACCOUNTING** - Fiscal
13. **OPERATIONS** - Physical
14. **ANALYTICS** - Reads from all

---

## Next Steps

Start with MODULE 1 (CORE):
1. Create `src/modules/core/` folder structure
2. Move files according to checklist
3. Update imports
4. Test
5. Mark complete
6. Move to MODULE 2
