# API Reference

## Overview

All API routes follow REST conventions and are located under `/api/`.

**Authentication**: All routes require Clerk authentication unless marked as `public`.

**Base URL**: `https://nodezero.app/api` (production) or `http://localhost:3000/api` (development)

---

## Response Format

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in to access this resource"
  }
}
```

---

## Authentication Headers

```http
Authorization: Bearer <clerk_session_token>
X-Organization-Id: <organization_id>
```

---

## B1. Core CRUD APIs

### Users

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/users` | List users | school, staff |
| GET | `/api/users/:id` | Get user | owner of record, school, staff |
| POST | `/api/users` | Create user | school |
| PATCH | `/api/users/:id` | Update user | owner of record, school |
| DELETE | `/api/users/:id` | Delete user | school |

### Courses

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/courses` | List course types | all |
| GET | `/api/courses/:id` | Get course | all |
| POST | `/api/courses` | Create course | school |
| PATCH | `/api/courses/:id` | Update course | school |
| DELETE | `/api/courses/:id` | Delete course | school |

### Modules

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/modules` | List modules | all |
| GET | `/api/modules/:id` | Get module with lessons | all |
| POST | `/api/modules` | Create module | school |
| PATCH | `/api/modules/:id` | Update module | school |

### Lessons

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/lessons/:id` | Get lesson content | student, teacher |
| POST | `/api/lessons` | Create lesson | school |
| PATCH | `/api/lessons/:id` | Update lesson | school |

### Prompts

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/prompts` | List prompt templates | student, teacher |
| GET | `/api/prompts/:id` | Get prompt | student, teacher |
| POST | `/api/prompts/:id/run` | Execute prompt | student |

### Progress

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/progress` | Get user progress | owner of record |
| POST | `/api/progress` | Record progress | student |

---

## B2. Student Toolbox APIs

### Student Prompts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student-prompts` | List student's saved prompts |
| POST | `/api/student-prompts` | Save new prompt |
| PATCH | `/api/student-prompts/:id` | Update prompt |
| DELETE | `/api/student-prompts/:id` | Delete prompt |

### Annotations (Journal)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/annotations` | List journal entries |
| POST | `/api/annotations` | Create entry |
| PATCH | `/api/annotations/:id` | Update entry |
| DELETE | `/api/annotations/:id` | Delete entry |

### Graveyard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/graveyard` | List failed ideas |
| POST | `/api/graveyard` | Add failed idea |
| PATCH | `/api/graveyard/:id` | Complete autopsy |
| DELETE | `/api/graveyard/:id` | Delete entry |

### Techniques

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/techniques` | Get technique mastery |
| POST | `/api/techniques/:technique/use` | Record technique usage |

### Todos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List todos |
| POST | `/api/todos` | Create todo |
| PATCH | `/api/todos/:id` | Update todo |
| DELETE | `/api/todos/:id` | Delete todo |

### Knowledge Graph (Constellation)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge-nodes` | List nodes |
| POST | `/api/knowledge-nodes` | Create node |
| PATCH | `/api/knowledge-nodes/:id` | Update node |
| DELETE | `/api/knowledge-nodes/:id` | Delete node |
| GET | `/api/knowledge-edges` | List edges |
| POST | `/api/knowledge-edges` | Create edge |
| DELETE | `/api/knowledge-edges/:id` | Delete edge |

---

## B3. School Operations APIs

### Rooms

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/rooms` | List rooms | school, staff |
| POST | `/api/rooms` | Create room | school |
| PATCH | `/api/rooms/:id` | Update room | school |
| DELETE | `/api/rooms/:id` | Delete room | school |

### Terms

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/terms` | List terms | school, staff |
| POST | `/api/terms` | Create term | school |
| PATCH | `/api/terms/:id` | Update term | school |

### Classes

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/classes` | List classes | teacher, school, staff |
| GET | `/api/classes/:id` | Get class with roster | teacher, school, staff |
| POST | `/api/classes` | Create class | school |
| PATCH | `/api/classes/:id` | Update class | school |

### Schedules

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/schedules` | Get schedule grid | all |
| POST | `/api/schedules` | Add schedule slot | school |
| DELETE | `/api/schedules/:id` | Remove slot | school |

### Sessions

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/sessions` | List sessions | teacher, school |
| PATCH | `/api/sessions/:id` | Update session | teacher, school |

### Attendance

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/attendance` | Get attendance | teacher, school |
| POST | `/api/attendance` | Record attendance | teacher, staff |
| PATCH | `/api/attendance/:id` | Update attendance | teacher, staff |

### Enrollments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/enrollments` | List enrollments | school, staff |
| POST | `/api/enrollments` | Create enrollment | school, staff |
| POST | `/api/enrollments/:id/transfer` | Transfer class | school |
| POST | `/api/enrollments/:id/drop` | Drop enrollment | school |

---

## B4. Financial APIs

### Products

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/products` | List products | school, staff |
| POST | `/api/products` | Create product | school |
| PATCH | `/api/products/:id` | Update product | school |

### Invoices

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/invoices` | List invoices | parent (own), school, staff |
| POST | `/api/invoices` | Create invoice | school |
| POST | `/api/invoices/:id/pay` | Process payment | parent (own), staff |
| GET | `/api/invoices/:id/pdf` | Download PDF | parent (own), school |

### Transactions

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/transactions` | List transactions | school, owner |

### Payouts

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/payouts` | List payouts | teacher (own), school |
| POST | `/api/payouts/:id/approve` | Approve payout | school |

---

## B4.5 Staff Payroll APIs

### Staff Payroll

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/staff-payroll` | List payroll records | school, owner |
| POST | `/api/staff-payroll` | Create payroll entry | school, owner |
| GET | `/api/staff-payroll/:id` | Get payroll with payments | school, owner |
| PATCH | `/api/staff-payroll/:id` | Update status/approve | school, owner |
| DELETE | `/api/staff-payroll/:id` | Cancel payroll | school, owner |

### Payroll Payments (Split Support)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/payroll-payments` | List payments | school, owner |
| POST | `/api/payroll-payments` | Register payment | school, owner |
| GET | `/api/payroll-payments/:id` | Get payment | school, owner |
| PATCH | `/api/payroll-payments/:id` | Update status | school, owner |
| DELETE | `/api/payroll-payments/:id` | Cancel payment | school, owner |

### Payment Methods

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/payment-methods` | List user methods | owner of record, school |
| POST | `/api/payment-methods` | Register method | owner of record, school |
| GET | `/api/payment-methods/:id` | Get method (masked) | owner of record, school |
| PATCH | `/api/payment-methods/:id` | Update method | owner of record, school |
| DELETE | `/api/payment-methods/:id` | Deactivate | owner of record, school |

---

## B4.6 Accounting APIs (Lucro Real)

### Chart of Accounts (Plano de Contas)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/chart-of-accounts` | List accounts (hierarchy) | school, owner |
| POST | `/api/chart-of-accounts` | Create account | school, owner |
| GET | `/api/chart-of-accounts/:id` | Get with balance | school, owner |
| PATCH | `/api/chart-of-accounts/:id` | Update account | school, owner |
| DELETE | `/api/chart-of-accounts/:id` | Deactivate | school, owner |

### Journal Entries (Lançamentos Contábeis)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/journal-entries` | List entries | school, owner |
| POST | `/api/journal-entries` | Create with lines | school, owner |
| GET | `/api/journal-entries/:id` | Get with lines | school, owner |
| PATCH | `/api/journal-entries/:id` | Post/reverse | school, owner |
| DELETE | `/api/journal-entries/:id` | Cancel draft | school, owner |

### Cost Centers (Centros de Custo)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/cost-centers` | List cost centers | school, owner |
| POST | `/api/cost-centers` | Create cost center | school, owner |
| GET | `/api/cost-centers/:id` | Get with expenses | school, owner |
| PATCH | `/api/cost-centers/:id` | Update center | school, owner |
| DELETE | `/api/cost-centers/:id` | Deactivate | school, owner |

### Fiscal Documents (NF-e/NFS-e)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/fiscal-documents` | List documents | school, owner |
| POST | `/api/fiscal-documents` | Create document | school, owner |
| GET | `/api/fiscal-documents/:id` | Get with taxes | school, owner |
| PATCH | `/api/fiscal-documents/:id` | Update/cancel | school, owner |
| DELETE | `/api/fiscal-documents/:id` | Delete draft | school, owner |

> 📖 See [Payroll & Accounting Documentation](./payroll-accounting.md) for detailed schemas, business rules, and integration examples.

---


## B5. CRM APIs

### Leads

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/leads` | List leads | staff, school |
| GET | `/api/leads/:id` | Get lead detail | staff, school |
| POST | `/api/leads` | Create lead | staff, school, `public` |
| PATCH | `/api/leads/:id` | Update lead | staff, school |
| POST | `/api/leads/:id/interact` | Log interaction | staff |
| POST | `/api/leads/:id/convert` | Convert to student | staff, school |

### Trials

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/trials` | List trials | staff, school |
| POST | `/api/trials` | Schedule trial | staff, school |
| PATCH | `/api/trials/:id` | Update trial | staff, school |

### Campaigns

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/campaigns` | List campaigns | staff, school |
| POST | `/api/campaigns` | Create campaign | staff, school |

### Referrals

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/referrals` | List referrals | staff, school |
| POST | `/api/referrals` | Track referral | all |

---

## B7. AI Companion APIs (Memory Topology)

### Memory Graph

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/memory/graph` | Create graph for student |
| GET | `/api/memory/graph/:studentId` | Get student's graph |

### Memory Nodes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/nodes` | Query nodes (filter by gravity, modality) |
| POST | `/api/memory/nodes` | Add memory node |
| PATCH | `/api/memory/nodes/:id/gravity` | Update gravity |
| DELETE | `/api/memory/nodes/:id` | Remove node (student right) |

### Memory Edges

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/edges` | Query edges |
| POST | `/api/memory/edges` | Add edge |
| DELETE | `/api/memory/edges/:id` | Remove edge |

### Ledger

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/ledger` | List ledger entries |
| POST | `/api/memory/ledger` | Add ledger entry |
| DELETE | `/api/memory/ledger/:id` | Remove entry (with limits) |
| POST | `/api/memory/ledger/trigger` | Trigger-based retrieval |

### Compression

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/memory/compress/:studentId` | Run compression |
| GET | `/api/memory/compress/stats/:studentId` | Get stats |
| GET | `/api/memory/snr/:content` | Calculate SNR |

### Contradictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/contradictions` | List contradictions |
| POST | `/api/memory/contradictions/:id/resolve` | Resolve |

### World Overlay

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/overlay/:studentId` | Get overlay |
| PATCH | `/api/memory/overlay/:studentId` | Update overlay |

---

## B8. AI Chat APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message |
| GET | `/api/chat/history/:studentId` | Get history (encrypted) |
| POST | `/api/chat/stream` | Streaming response |
| GET | `/api/chat/context/:studentId` | Build context |

### Message Request
```typescript
{
  message: string;
  contextOptions?: {
    includeMemories?: boolean;
    includeLedger?: boolean;
    maxTokens?: number;
  };
}
```

### Message Response (Streamed)
```typescript
{
  id: string;
  content: string; // Streamed in chunks
  tokensUsed: number;
  memoriesFormed: number;
}
```

---

## B9. Ethics & Supervision APIs

### Data Domains

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/domains/institutional/:studentId` | Grades, attendance | teacher, parent, school |
| GET | `/api/domains/relational/:studentId` | Encrypted memories | student only |
| GET | `/api/domains/supervision/:studentId` | Metadata | auditor, school |

### AI Auditor

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/auditor/wellbeing/:studentId` | Aggregated wellbeing | auditor, school |
| GET | `/api/auditor/engagement/:studentId` | Session metrics | auditor, school |
| POST | `/api/auditor/analyze` | Run safety analysis | auditor |
| GET | `/api/auditor/alerts` | List alerts | staff, school |
| POST | `/api/auditor/verify-integrity/:studentId` | Verify hash | auditor |

### Escalation

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/alerts` | Create alert | auditor, teacher |
| GET | `/api/alerts` | List alerts | staff, school |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge | staff, school |
| PATCH | `/api/alerts/:id/resolve` | Resolve | staff, school |
| POST | `/api/alerts/:id/escalate` | Escalate level | staff, school |

### Integrity

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrity/hash/:studentId` | Get current hash |
| POST | `/api/integrity/verify` | Verify integrity |
| GET | `/api/integrity/log/:studentId` | Get audit log |
| POST | `/api/integrity/report` | Report tampering |

---

## B10. Parent Consultation APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parent/child/:childId/engagement` | Session frequency |
| GET | `/api/parent/child/:childId/progress` | Curricular progress |
| GET | `/api/parent/child/:childId/wellbeing` | Emotional indicators |
| GET | `/api/parent/child/:childId/alerts` | Relevant alerts |
| GET | `/api/parent/child/:childId/recommendations` | AI suggestions |

### What Parents CAN See
- ✅ Engagement metrics (how often, how long)
- ✅ Progress through curriculum
- ✅ Aggregated emotional indicators
- ✅ Alert notifications (when escalated)
- ✅ AI-suggested interventions

### What Parents CANNOT See
- ❌ Actual conversation content
- ❌ Specific memory details
- ❌ AI Companion's notes
- ❌ Student confessions/venting

---

## B11. Student Rights APIs (LGPD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rights/access/:studentId` | View all data |
| POST | `/api/rights/rectify` | Request correction |
| POST | `/api/rights/forget` | Request deletion |
| GET | `/api/rights/export/:studentId` | Export all data |
| POST | `/api/rights/portability` | Package for migration |
| POST | `/api/rights/negotiate` | Memory agreements |

### Export Response
```json
{
  "format": "json",
  "includes": [
    "profile",
    "progress", 
    "memories",
    "conversations",
    "ledger"
  ],
  "downloadUrl": "/api/rights/export/download/:token"
}
```

### Forget Request
```typescript
{
  targetType: "memory" | "conversation" | "ledger";
  targetIds: string[];
  reason?: string;
}
```

**Note**: Deletion is limited for safety. AI Companion cannot forget information essential for protecting the student from harm.

---

## B12. Profile & Onboarding APIs

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get current user profile |
| PATCH | `/api/profile` | Update profile |
| GET | `/api/profile/address` | Get addresses |
| PATCH | `/api/profile/address` | Update addresses |
| GET | `/api/profile/payment-methods` | List cards |
| POST | `/api/profile/payment-methods` | Add card |
| DELETE | `/api/profile/payment-methods/:id` | Remove card |
| GET | `/api/profile/payment-history` | Payment records |
| PATCH | `/api/profile/preferences` | Update preferences |
| POST | `/api/profile/password` | Change password |
| GET | `/api/profile/sessions` | Active sessions |
| DELETE | `/api/profile/sessions/:id` | End session |

### Onboarding (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/onboarding/register` | Create account (QR flow) |
| POST | `/api/onboarding/verify-email` | Email verification |
| POST | `/api/onboarding/complete` | Finalize |

### Registration Request
```typescript
{
  accountType: "parent" | "student";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  cpf: string;
  birthDate: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  child?: { // If parent
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  acceptTerms: boolean;
  acceptMarketing: boolean;
}
```

---

## Webhooks

### Payment Webhooks

| Provider | Endpoint | Events |
|----------|----------|--------|
| Stripe | `/api/webhooks/stripe` | payment_intent.succeeded, charge.refunded |
| Asaas | `/api/webhooks/asaas` | PAYMENT_RECEIVED, PAYMENT_OVERDUE |

### Clerk Webhooks

| Endpoint | Events |
|----------|--------|
| `/api/webhooks/clerk` | user.created, user.updated, organization.created |

---

## Rate Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Auth endpoints | 10/minute |
| Read endpoints | 100/minute |
| Write endpoints | 30/minute |
| AI endpoints | 20/minute |
| Export endpoints | 2/hour |

---

*Last updated: 2026-02-03*
