# Node Zero - Module Architecture

> SaaS Product Structure & Feature Packaging

---

## Module Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NODE ZERO PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CORE (Always Included)                                                      │
│  ├── Identity (persons, users, auth, roles)                                 │
│  ├── Organizations (multi-tenant)                                           │
│  └── Base UI (shell, navigation, theme)                                     │
│                                                                              │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │  MANAGEMENT   │ │  PEDAGOGICAL  │ │   MARKETING   │ │     SALES     │    │
│  │               │ │               │ │               │ │               │    │
│  │ Settings      │ │ Curriculum    │ │ Campaigns     │ │ Pipeline      │    │
│  │ Permissions   │ │ Courses       │ │ Lead Capture  │ │ Proposals     │    │
│  │ Integrations  │ │ Progress      │ │ Content       │ │ Negotiation   │    │
│  │ Audit Logs    │ │ Assessments   │ │ A/B Testing   │ │ Enrollment    │    │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                                              │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │      HR       │ │  ACCOUNTING   │ │  OPERATIONS   │ │   PAYMENTS    │    │
│  │               │ │               │ │               │ │               │    │
│  │ Staff Mgmt    │ │ Fiscal/Tax    │ │ Rooms         │ │ Gateway       │    │
│  │ Payroll       │ │ Reports       │ │ Schedules     │ │ Subscriptions │    │
│  │ Retention     │ │ SPED Export   │ │ Attendance    │ │ Invoices      │    │
│  │ Careers       │ │ Bank Recon    │ │ Resources     │ │ Refunds       │    │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                                              │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │    TOOLBOX    │ │ RELATIONSHIPS │ │ AI COMPANION  │ │   ANALYTICS   │    │
│  │               │ │    (SCRM)     │ │               │ │               │    │
│  │ Student Tools │ │ 3x3 Insights  │ │ Memory Graph  │ │ Dashboards    │    │
│  │ Teacher Tools │ │ Sentiment     │ │ Auditor       │ │ Reports       │    │
│  │ Staff Tools   │ │ Family Links  │ │ Rights (D4-6) │ │ Predictions   │    │
│  │ Shared Utils  │ │ Communication │ │ Interview     │ │ Export        │    │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        COMMUNICATIONS                                │    │
│  │  Messaging | Notifications | Announcements | Email/SMS/WhatsApp      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Definitions

### 1. MANAGEMENT (Core)
**Purpose:** Organizational configuration and administration

| Feature | Description | Tables |
|---------|-------------|--------|
| Settings | Organization config, branding | `organizations`, `organizationSettings` |
| Users & Roles | User management, role assignments | `users`, `*Roles` junction tables |
| Permissions | Granular access control | `permissionGroups`, `userGroupAssignments` |
| Integrations | API keys, webhooks, external services | `integrations`, `webhooks` |
| Audit Logs | Activity tracking | `permissionAuditLog`, `crmAuditLog` |

**Portals:** Owner, Admin

---

### 2. PEDAGOGICAL
**Purpose:** Curriculum design, delivery, and student progress

| Feature | Description | Tables |
|---------|-------------|--------|
| Curriculum | Courses, modules, lessons structure | `courses`, `modules`, `lessons` |
| Progress | Student advancement tracking | `moduleProgress`, `lessonProgress` |
| Assessments | Quizzes, assignments, grading | `assessments`, `studentSubmissions` |
| Prompts | AI prompt templates, versioning | `prompts`, `promptVersions` |
| Prompt Runs | AI interaction history | `promptRuns` |

**Portals:** Teacher, Student

---

### 3. MARKETING
**Purpose:** Lead generation and nurturing (TOFU/MOFU)

| Feature | Description | Tables |
|---------|-------------|--------|
| Campaigns | Marketing campaigns, tracking | `marketingCampaigns`, `campaignLeads` |
| Lead Capture | Forms, landing pages, UTM tracking | `leadRoles`, utm fields |
| Content | Content calendar, deliverables | `contentDeliverables`, `contentCalendar` |
| A/B Testing | Experiment tracking | `abTests`, `abTestVariants` |
| Automations | Drip campaigns, triggers | `marketingAutomations` |

**Portals:** Marketing Staff

---

### 4. SALES
**Purpose:** Lead conversion and enrollment (MOFU/BOFU)

| Feature | Description | Tables |
|---------|-------------|--------|
| Pipeline | Deal stages, funnel management | `leadRoles.stage`, `salesOpportunities` |
| Proposals | Quote generation, pricing | `proposals`, `proposalItems` |
| Negotiation | Counter-offers, discounts | `negotiations`, `counterOffers` |
| Enrollment | Contract signing, onboarding | `enrollments`, `contracts` |
| Team Mgmt | Sales rules, targets, commission | `salesRules`, `salesTargets`, `teacherRoles.revenueSharePercent` |

**Portals:** Sales Staff, Sales Manager

---

### 5. HR (Human Resources)
**Purpose:** Staff lifecycle, payroll, and talent management

| Feature | Description | Tables |
|---------|-------------|--------|
| Staff Management | Hiring, positions, departments | `staffRoles`, `teacherRoles` |
| Compensation | CLT/PJ, cargo de confiança, dissídio | `staffRoles.*` compensation fields |
| Benefits | VT, VR, health, etc. | `staffRoles.*` benefits fields |
| Payroll | 13th, vacation, termination | `staffSalaryHistory` |
| Retention | 3x3 insights, sentiment, turnover risk | `staffSentimentHistory`, `staffInsightCommunications` |
| Training | Records, certifications, aspirations | `staffTrainingRecords` |
| Careers | Job posts, applicant tracking | `jobPositions`, `talentProfiles`, `talentApplications` |

**Portals:** HR Staff, Owner

---

### 6. ACCOUNTING (Contábil)
**Purpose:** Fiscal compliance, financial reporting (Lucro Real)

| Feature | Description | Tables |
|---------|-------------|--------|
| Chart of Accounts | Plano de contas | `chartOfAccounts` |
| Journal Entries | Lançamentos contábeis | `journalEntries`, `journalLines` |
| Fiscal | Tax calculation, withholdings | Tax fields across tables |
| Reports | DRE, Balancete, Balanço | Generated from entries |
| SPED Export | ECD, ECF, EFD-Contribuições | Export functions |
| Bank Reconciliation | Statement matching | `bankAccounts`, `bankTransactions` |

**Portals:** Accountant, Owner

---

### 7. OPERATIONS
**Purpose:** Physical resources, scheduling, and attendance

| Feature | Description | Tables |
|---------|-------------|--------|
| Rooms | Facility management | `rooms`, `roomAvailability` |
| Schedules | Class scheduling, teacher allocation | `schedules`, `classInstances` |
| Attendance | Student/teacher check-in | `attendance`, `attendanceRecords` |
| Resources | Equipment, materials | `resources`, `resourceBookings` |
| Calendar | Events, holidays | `academicCalendar`, `events` |

**Portals:** Admin Staff, Teachers

---

### 8. PAYMENTS
**Purpose:** Revenue collection and financial transactions

| Feature | Description | Tables |
|---------|-------------|--------|
| Gateway | Payment processing (Stripe, PagSeguro) | `paymentMethods`, `paymentTransactions` |
| Subscriptions | Recurring billing | `subscriptions`, `subscriptionPlans` |
| Invoices | Generation, sending | `invoices`, `invoiceItems` |
| Refunds | Returns, chargebacks | `refunds` |
| PIX | Instant payments | PIX fields in `personBankAccounts` |

**Portals:** Finance Staff, Parent

---

### 9. TOOLBOX
**Purpose:** Productivity tools for all user types

| Sub-module | Users | Features |
|------------|-------|----------|
| **Student Toolbox** | Students | Knowledge Constellation, To-Do Cube, Prompt Library, Technique Tracker, Problem Workshop, Challenge Board |
| **Teacher Toolbox** | Teachers | Lesson Planner, Student Progress View, Prompt Builders, Assessment Creator, AI Teaching Assistant |
| **Staff Toolbox** | All Staff | Document Templates, Report Generators, Quick Actions, Shared Knowledge Base |

**Tables:** `studentPromptLibrary`, `techniques`, `knowledgeNodes`, `knowledgeEdges`, `problemSolver`, `challenges`

---

### 10. RELATIONSHIPS (SCRM)
**Purpose:** Social CRM for deep relationship management

| Feature | Description | Tables |
|---------|-------------|--------|
| 3x3 Insights | Dreams, Hobbies, Aspirations | `*Roles.insight*` fields |
| Sentiment | Emotional tracking over time | `*SentimentHistory` |
| Family Links | Parent-student relationships | `parentRoles`, `familyLinks` |
| Communications | Insight-anchored conversations | `*InsightCommunications` |
| AI Persona | Generated from 3x3 | `aiPersona` field |

**Portals:** All (context-specific)

---

### 11. AI COMPANION
**Purpose:** Personalized AI assistant with memory and ethics

| Feature | Description | Tables |
|---------|-------------|--------|
| Memory Graph | Persistent AI memory | `memoryNodes`, `memoryEdges` |
| Narrative Ledger | Critical facts | `narrativeLedger` |
| Lattice Interview | Initial mapping | `personLattice` |
| Auditor | Wellbeing monitoring (metadata-only) | `aiAuditorAlerts`, `wellbeingIndicators` |
| Student Rights | D4 (Transparency), D5 (Portability), D6 (Deletion) | Rights enforcement layer |
| Synapse Tools | MCP tool integration | Tool execution system |

**Portals:** All (via chat interface)

---

### 12. ANALYTICS
**Purpose:** Insights, dashboards, and predictive intelligence

| Feature | Description | Tables |
|---------|-------------|--------|
| Dashboards | Role-specific metrics | Aggregated views |
| Reports | Exportable data | Report templates |
| Predictions | AI-powered forecasting | `predictions`, `forecasts` |
| Discovery | Process mining, patterns | `processDiscoveryEvents` |
| Export | CSV, Excel, PDF, JSON | Export functions |

**Portals:** Owner, Managers

---

### 13. COMMUNICATIONS
**Purpose:** Multi-channel messaging and notifications

| Feature | Description | Tables |
|---------|-------------|--------|
| Conversations | In-app messaging | `conversations`, `messages` |
| Notifications | System alerts | `notificationQueue`, `notificationTemplates` |
| Announcements | Broadcast messages | `announcements` |
| Email | Transactional + marketing | Email service integration |
| SMS/WhatsApp | Mobile messaging | External API integration |
| Templates | Message templates | `messageTemplates` |

**Portals:** All

---

## SaaS Packaging Tiers

### Tier 1: ESSENTIALS
For small schools getting started

**Modules included:**
- ✅ Management (Core)
- ✅ Pedagogical
- ✅ Payments (Basic)
- ✅ Communications (Basic)
- ✅ Student Toolbox (Limited)

**Limits:**
- 100 students
- 10 staff
- 1 organization

---

### Tier 2: PROFESSIONAL
For growing schools

**Modules included:**
- ✅ Everything in Essentials
- ✅ Operations
- ✅ Marketing
- ✅ Sales
- ✅ Relationships (SCRM)
- ✅ Full Toolbox
- ✅ Analytics (Basic)
- ✅ AI Companion (Limited memory)

**Limits:**
- 500 students
- 50 staff
- Custom branding

---

### Tier 3: ENTERPRISE
For established schools and franchises

**Modules included:**
- ✅ Everything in Professional
- ✅ HR (Full CLT/PJ)
- ✅ Accounting (Lucro Real)
- ✅ Careers/Talent Pool
- ✅ Full AI Companion
- ✅ Advanced Analytics
- ✅ API Access
- ✅ White-label option

**Limits:**
- Unlimited students
- Unlimited staff
- Multi-organization
- Dedicated support

---

### Add-on Modules (Any Tier)

| Add-on | Description | Price Model |
|--------|-------------|-------------|
| **Lattice HR** | Full talent topology, job matching | Per active job post |
| **AI Auditor** | Wellbeing monitoring, alerts | Per monitored student |
| **SPED Export** | Fiscal compliance package | Per export |
| **WhatsApp Business** | Official API integration | Per message |
| **Custom Integrations** | API development | Hourly |

---

## Module Dependencies

```
CORE (Identity + Organizations)
    │
    ├── MANAGEMENT ─────────────┐
    │                           │
    ├── PEDAGOGICAL ────────────┼── TOOLBOX (Student)
    │       │                   │
    │       └── AI COMPANION ───┤
    │               │           │
    │               └── RELATIONSHIPS (SCRM)
    │                           │
    ├── MARKETING ──────────────┤
    │       │                   │
    │       └── SALES ──────────┤
    │               │           │
    │               └── PAYMENTS
    │                           │
    ├── OPERATIONS ─────────────┤
    │                           │
    ├── HR ─────────────────────┤
    │       │                   │
    │       └── ACCOUNTING ─────┤
    │                           │
    ├── COMMUNICATIONS ─────────┤
    │                           │
    └── ANALYTICS ──────────────┘ (reads from all)
```

---

## Technical Implementation Notes

### Folder Structure (Recommended)
```
src/
├── modules/
│   ├── core/           # Identity, orgs, auth
│   ├── management/     # Settings, permissions
│   ├── pedagogical/    # Curriculum, progress
│   ├── marketing/      # Campaigns, leads
│   ├── sales/          # Pipeline, enrollment
│   ├── hr/             # Staff, payroll, careers
│   ├── accounting/     # Fiscal, reports
│   ├── operations/     # Rooms, schedules
│   ├── payments/       # Gateway, invoices
│   ├── toolbox/        # All tools
│   │   ├── student/
│   │   ├── teacher/
│   │   └── staff/
│   ├── relationships/  # SCRM
│   ├── ai-companion/   # Memory, auditor
│   ├── analytics/      # Dashboards
│   └── communications/ # Messaging
├── lib/
│   ├── db/            # Schema (shared)
│   ├── ai/            # AI services
│   └── utils/         # Shared utilities
└── app/
    └── (portals)/     # Route groups per portal
```

### Feature Flags
Each module should be toggle-able via organization settings:
```typescript
organizationSettings: {
  enabledModules: ['management', 'pedagogical', 'payments', ...],
  moduleConfig: {
    aiCompanion: { memoryLimit: 1000 },
    analytics: { retentionDays: 90 },
    ...
  }
}
```

---

## Questions for Decision

1. **Careers as sub-module of HR or separate?** 
   - Pro separate: Can be sold independently for recruitment agencies
   - Pro HR: Natural fit, shared tables

2. **AI Companion as separate billable?**
   - Memory storage costs money
   - Could tier by memory nodes

3. **Accounting separate from Payments?**
   - Currently distinct but related
   - Accounting is Brazil-specific (Lucro Real)

4. **Operations mandatory?**
   - Some online-only schools don't need rooms
   - Could make optional
