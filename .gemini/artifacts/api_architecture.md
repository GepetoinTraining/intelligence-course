# API Architecture - Intelligence Course Platform

## Overview

This document maps all APIs required for the multi-tenant Intelligence Course platform, organized by:
1. **Platform APIs** - Super-admin, billing, tenant management
2. **Tenant APIs** - Per-school operations, accessed via `[orgSlug]`
3. **Module APIs** - Domain-specific endpoints grouped by business module

---

## API Route Structure

```
/api/
├── platform/                    # Super-admin (NodeZero level)
│   ├── tenants/                 # Tenant/School management
│   ├── billing/                 # Platform billing
│   ├── analytics/               # Cross-tenant analytics
│   └── ai/                      # Platform AI (uses platform API key)
│
├── [orgSlug]/                   # Tenant-scoped APIs
│   ├── setup/                   # Onboarding/Configuration
│   ├── auth/                    # Tenant-level auth
│   └── modules/                 # All business modules
│       ├── crm/
│       ├── enrollment/
│       ├── academic/
│       ├── financial/
│       ├── hr/
│       ├── communication/
│       ├── analytics/
│       └── ...
│
└── public/                      # Public endpoints (no auth)
    └── [orgSlug]/               # Public school pages
```

---

## 1. Platform APIs (Super-Admin)

### `/api/platform/tenants`
Tenant (School) lifecycle management.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tenants` | List all tenants |
| `POST` | `/tenants` | Create new tenant |
| `GET` | `/tenants/:id` | Get tenant details |
| `PATCH` | `/tenants/:id` | Update tenant |
| `DELETE` | `/tenants/:id` | Deactivate tenant |
| `POST` | `/tenants/:id/activate` | Activate tenant |
| `POST` | `/tenants/:id/suspend` | Suspend tenant |

### `/api/platform/billing`
Platform-level billing for tenants.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/billing/plans` | List available plans |
| `GET` | `/billing/:tenantId` | Get tenant billing info |
| `POST` | `/billing/:tenantId/subscribe` | Subscribe tenant to plan |
| `POST` | `/billing/:tenantId/cancel` | Cancel subscription |
| `GET` | `/billing/:tenantId/invoices` | Get tenant invoices |

### `/api/platform/analytics`
Cross-tenant platform analytics.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/overview` | Platform-wide metrics |
| `GET` | `/analytics/tenants` | Per-tenant comparison |
| `GET` | `/analytics/revenue` | Platform revenue |
| `GET` | `/analytics/growth` | Growth metrics |

### `/api/platform/ai`
Platform AI endpoints (uses NodeZero API keys).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/blueprint` | Generate school blueprint |
| `POST` | `/ai/analyze` | Analyze school data |
| `POST` | `/ai/recommend` | Get recommendations |

---

## 2. Setup/Onboarding APIs

### `/api/[orgSlug]/setup`
School configuration and onboarding.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/setup/status` | Get setup completion status |
| `GET` | `/setup/team` | Get team/roles config |
| `POST` | `/setup/team/roles` | Create role |
| `PUT` | `/setup/team/roles/:id` | Update role |
| `DELETE` | `/setup/team/roles/:id` | Delete role |
| `GET` | `/setup/team/rooms` | Get rooms |
| `POST` | `/setup/team/rooms` | Create room |
| `GET` | `/setup/products` | Get products/courses |
| `POST` | `/setup/products/courses` | Create course |
| `GET` | `/setup/products/pricing` | Get pricing table |
| `PUT` | `/setup/products/pricing` | Update pricing |
| `GET` | `/setup/rules` | Get business rules |
| `PUT` | `/setup/rules/commissions` | Update commissions |
| `PUT` | `/setup/rules/policies` | Update policies |
| `GET` | `/setup/financial` | Get financial config |
| `PUT` | `/setup/financial/accounts` | Update bank accounts |
| `PUT` | `/setup/financial/providers` | Update payment providers |
| `PUT` | `/setup/financial/credentials` | Update API keys/certs |

### `/api/[orgSlug]/setup/contracts`
Contract template management.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/contracts/clauses` | List clause templates |
| `POST` | `/contracts/clauses` | Create clause template |
| `PUT` | `/contracts/clauses/:id` | Update clause |
| `DELETE` | `/contracts/clauses/:id` | Delete clause |
| `GET` | `/contracts/templates` | List contract templates |
| `POST` | `/contracts/templates` | Create contract template |
| `POST` | `/contracts/preview` | Preview contract with vars |

---

## 3. Module APIs

Each module represents a menu bundle in the application.

### Module 1: CRM (Leads & Opportunities)

**Route:** `/api/[orgSlug]/crm`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/leads` | List leads (filterable) |
| `POST` | `/leads` | Create lead |
| `GET` | `/leads/:id` | Get lead details |
| `PUT` | `/leads/:id` | Update lead |
| `POST` | `/leads/:id/convert` | Convert to enrollment |
| `GET` | `/leads/:id/timeline` | Get lead activity |
| `POST` | `/leads/:id/tasks` | Create follow-up task |
| `GET` | `/pipeline` | Get sales pipeline |
| `GET` | `/sources` | Lead sources analytics |
| `GET` | `/campaigns` | Marketing campaigns |
| `POST` | `/campaigns` | Create campaign |

---

### Module 2: Enrollment (Matrículas)

**Route:** `/api/[orgSlug]/enrollment`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/enrollments` | List enrollments |
| `POST` | `/enrollments` | Create enrollment |
| `GET` | `/enrollments/:id` | Get enrollment details |
| `PUT` | `/enrollments/:id` | Update enrollment |
| `POST` | `/enrollments/:id/cancel` | Cancel enrollment |
| `POST` | `/enrollments/:id/renew` | Renew enrollment |
| `GET` | `/enrollments/:id/contract` | Get generated contract |
| `POST` | `/enrollments/:id/contract/sign` | Digital signature flow |
| `GET` | `/students` | List students |
| `GET` | `/students/:id` | Get student profile |
| `PUT` | `/students/:id` | Update student |
| `GET` | `/students/:id/enrollments` | Student's enrollments |
| `GET` | `/guardians` | List guardians/responsibles |
| `POST` | `/guardians` | Create guardian |

---

### Module 3: Academic (Pedagógico)

**Route:** `/api/[orgSlug]/academic`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/courses` | List courses |
| `POST` | `/courses` | Create course |
| `GET` | `/courses/:id` | Course details |
| `PUT` | `/courses/:id` | Update course |
| `GET` | `/courses/:id/curriculum` | Course curriculum |
| `PUT` | `/courses/:id/curriculum` | Update curriculum |
| `GET` | `/classes` | List classes/turmas |
| `POST` | `/classes` | Create class |
| `GET` | `/classes/:id` | Class details |
| `GET` | `/classes/:id/schedule` | Class schedule |
| `PUT` | `/classes/:id/schedule` | Update schedule |
| `GET` | `/classes/:id/students` | Students in class |
| `POST` | `/classes/:id/attendance` | Record attendance |
| `GET` | `/classes/:id/attendance` | Get attendance records |
| `GET` | `/lessons` | List lessons |
| `POST` | `/lessons` | Create lesson |
| `GET` | `/lessons/:id` | Lesson details |
| `PUT` | `/lessons/:id` | Update lesson |
| `POST` | `/grades` | Record grade |
| `GET` | `/grades/student/:id` | Student grades |
| `GET` | `/grades/class/:id` | Class grades |

---

### Module 4: Financial (Financeiro)

**Route:** `/api/[orgSlug]/financial`

#### Gateway & Split Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/gateways` | List payment gateways |
| `POST` | `/gateways` | Add payment gateway |
| `GET` | `/gateways/:id` | Gateway details |
| `PUT` | `/gateways/:id` | Update gateway |
| `DELETE` | `/gateways/:id` | Remove gateway |
| `POST` | `/gateways/:id/test` | Test gateway connection |
| `GET` | `/gateways/:id/balance` | Get gateway balance |
| `GET` | `/split-recipients` | List split recipients |
| `POST` | `/split-recipients` | Create split recipient |
| `PUT` | `/split-recipients/:id` | Update recipient |
| `POST` | `/split-recipients/:id/verify` | Verify bank account |
| `GET` | `/split-rules` | List split rules |
| `POST` | `/split-rules` | Create split rule |
| `GET` | `/split-rules/:id` | Rule details with items |
| `PUT` | `/split-rules/:id` | Update rule |
| `POST` | `/split-rules/:id/simulate` | Simulate split on amount |

#### Receivables (Accounts Receivable)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/receivables` | List receivables (filterable) |
| `POST` | `/receivables` | Create receivable |
| `GET` | `/receivables/:id` | Receivable details |
| `PUT` | `/receivables/:id` | Update receivable |
| `POST` | `/receivables/:id/cancel` | Cancel receivable |
| `POST` | `/receivables/:id/generate-boleto` | Generate boleto |
| `POST` | `/receivables/:id/generate-pix` | Generate PIX code |
| `GET` | `/receivables/:id/payments` | Payment history |
| `POST` | `/receivables/batch` | Create batch receivables |
| `POST` | `/receivables/from-contract` | Generate from contract |

#### Payments & Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/payments` | List all payments |
| `POST` | `/payments` | Record manual payment |
| `GET` | `/payments/:id` | Payment details |
| `POST` | `/payments/:id/refund` | Process refund |
| `POST` | `/payments/:id/confirm` | Confirm pending payment |
| `GET` | `/payments/pending` | Pending confirmations |

#### Money Flow & Chain of Custody

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/money-flows` | Money movement ledger |
| `GET` | `/money-flows/:id` | Flow details |
| `GET` | `/money-flows/balance` | Current balances by location |
| `POST` | `/money-flows/transfer` | Manual transfer |
| `POST` | `/money-flows/reconcile` | Mark as reconciled |

#### Commissions & Payouts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/commissions` | List commissions |
| `POST` | `/commissions` | Create commission |
| `GET` | `/commissions/:id` | Commission details |
| `POST` | `/commissions/:id/approve` | Approve commission |
| `POST` | `/commissions/:id/pay` | Execute payout |
| `POST` | `/commissions/calculate` | Calculate pending commissions |
| `GET` | `/commissions/by-user/:userId` | User's commissions |

#### Financial Goals & Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/goals` | List financial goals |
| `POST` | `/goals` | Create goal |
| `GET` | `/goals/:id` | Goal details |
| `PUT` | `/goals/:id` | Update goal |
| `POST` | `/goals/:id/recalculate` | Recalculate actuals |
| `GET` | `/goals/dashboard` | Goals dashboard |

#### Invoices & NFS-e

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/invoices` | List invoices (NFS-e) |
| `POST` | `/invoices` | Emit invoice |
| `GET` | `/invoices/:id` | Invoice details |
| `POST` | `/invoices/:id/cancel` | Cancel invoice |
| `GET` | `/invoices/:id/pdf` | Download PDF |

#### Settings & Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/settings` | Financial settings |
| `PUT` | `/settings` | Update settings |
| `GET` | `/settings/late-fees` | Late fee configuration |
| `PUT` | `/settings/late-fees` | Update late fees |
| `GET` | `/settings/dunning` | Dunning settings |
| `PUT` | `/settings/dunning` | Update dunning |

#### Reports & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/cashflow` | Cash flow report |
| `GET` | `/reports/dre` | DRE (income statement) |
| `GET` | `/reports/aging` | Aging report (inadimplência) |
| `GET` | `/reports/collections` | Collections performance |
| `GET` | `/reports/split-summary` | Split payments summary |
| `GET` | `/reports/commissions` | Commission report |
| `GET` | `/cost-centers` | Cost centers list |
| `GET` | `/cost-centers/:id/report` | Cost center report |

---

### Module 5: HR (Recursos Humanos)

**Route:** `/api/[orgSlug]/hr`

#### Employees & Contracts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/employees` | List employees |
| `POST` | `/employees` | Create employee |
| `GET` | `/employees/:id` | Employee details |
| `PUT` | `/employees/:id` | Update employee |
| `GET` | `/employees/:id/contracts` | Work contracts (CLT/PJ) |
| `POST` | `/employees/:id/contracts` | Create work contract |
| `PUT` | `/contracts/:id` | Update contract |
| `GET` | `/contracts/:id` | Contract details |

#### Time & Attendance (GPS Geo-fenced)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/time-clock` | Clock in/out (with GPS) |
| `GET` | `/time-clock/current` | Current clock status |
| `GET` | `/time-clock/entries` | List clock entries |
| `POST` | `/time-clock/entries/:id/approve` | Approve manual entry |
| `GET` | `/timesheets` | List timesheets |
| `GET` | `/timesheets/:id` | Timesheet details |
| `POST` | `/timesheets/:id/submit` | Submit timesheet |
| `POST` | `/timesheets/:id/approve` | Approve timesheet |

#### Locations & Geo-fencing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/locations` | List org locations |
| `POST` | `/locations` | Create location |
| `PUT` | `/locations/:id` | Update location (lat/lng/radius) |
| `GET` | `/locations/:id/geofence` | Get geofence config |
| `PUT` | `/locations/:id/geofence` | Update geofence radius |

#### Org Chart & Positions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/org-chart` | Full org chart tree |
| `GET` | `/positions` | List positions |
| `POST` | `/positions` | Create position |
| `PUT` | `/positions/:id` | Update position |
| `DELETE` | `/positions/:id` | Remove position |
| `POST` | `/positions/:id/assign` | Assign user to position |
| `GET` | `/positions/:id/assignments` | Position assignments |

#### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/teams` | List teams |
| `POST` | `/teams` | Create team |
| `GET` | `/teams/:id` | Team details |
| `PUT` | `/teams/:id` | Update team |
| `GET` | `/teams/:id/members` | Team members |
| `POST` | `/teams/:id/members` | Add team member |
| `DELETE` | `/teams/:id/members/:userId` | Remove member |

#### Talent Pool (Candidates)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/talent-pool` | List candidates |
| `POST` | `/talent-pool` | Add candidate |
| `GET` | `/talent-pool/:id` | Candidate details |
| `PUT` | `/talent-pool/:id` | Update candidate |
| `POST` | `/talent-pool/:id/hire` | Convert to employee |
| `PUT` | `/talent-pool/:id/status` | Update status |

#### Termination Planning ("Plan to Fire")

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/termination-plans` | List termination plans |
| `POST` | `/termination-plans` | Create plan |
| `GET` | `/termination-plans/:id` | Plan details |
| `POST` | `/termination-plans/:id/simulate` | Recalculate costs |
| `POST` | `/termination-plans/:id/approve` | Approve plan |
| `POST` | `/termination-plans/:id/execute` | Execute termination |
| `POST` | `/termination-plans/:id/cancel` | Cancel plan |

#### Labor Provisions (13º, Férias, FGTS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/provisions/settings` | Provision settings |
| `PUT` | `/provisions/settings` | Update settings |
| `GET` | `/provisions/balances` | All employee balances |
| `GET` | `/provisions/balances/:userId` | User provision balance |
| `POST` | `/provisions/calculate` | Calculate provisions |
| `GET` | `/provisions/report` | Provisions report |

#### Benefits

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/benefits` | List benefits |
| `POST` | `/benefits` | Add benefit |
| `PUT` | `/benefits/:id` | Update benefit |
| `GET` | `/employees/:id/benefits` | Employee's benefits |

#### Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/payroll` | List payroll records |
| `POST` | `/payroll/run` | Run payroll calculation |
| `GET` | `/payroll/:id` | Payroll details |
| `POST` | `/payroll/:id/approve` | Approve payroll |
| `POST` | `/payroll/:id/pay` | Execute payment |

#### Work Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/schedules` | List schedule templates |
| `POST` | `/schedules` | Create schedule |
| `PUT` | `/schedules/:id` | Update schedule |
| `POST` | `/employees/:id/schedule` | Assign schedule |

---

### Module 6: Communication (Comunicador)

**Route:** `/api/[orgSlug]/communication`

#### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | List user's conversations |
| `POST` | `/conversations` | Create conversation |
| `GET` | `/conversations/:id` | Conversation details |
| `PUT` | `/conversations/:id` | Update conversation |
| `DELETE` | `/conversations/:id` | Archive/delete conversation |
| `POST` | `/conversations/:id/pin` | Pin conversation |
| `POST` | `/conversations/:id/mute` | Mute conversation |

#### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations/:id/messages` | List messages (paginated) |
| `POST` | `/conversations/:id/messages` | Send message |
| `GET` | `/messages/:id` | Message details |
| `PUT` | `/messages/:id` | Edit message |
| `DELETE` | `/messages/:id` | Delete message |
| `POST` | `/messages/:id/react` | Add reaction |
| `DELETE` | `/messages/:id/react/:emoji` | Remove reaction |

#### Participants

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations/:id/participants` | List participants |
| `POST` | `/conversations/:id/participants` | Add participant |
| `PUT` | `/conversations/:id/participants/:userId` | Update role |
| `DELETE` | `/conversations/:id/participants/:userId` | Remove participant |

#### Read Status & Typing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/conversations/:id/read` | Mark as read |
| `POST` | `/conversations/:id/typing` | Send typing indicator |
| `GET` | `/conversations/:id/typing` | Get who's typing |

#### Broadcasts (Announcements)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/broadcasts` | List broadcasts |
| `POST` | `/broadcasts` | Create broadcast |
| `GET` | `/broadcasts/:id` | Broadcast details |
| `PUT` | `/broadcasts/:id` | Update broadcast |
| `POST` | `/broadcasts/:id/send` | Send to recipients |
| `GET` | `/broadcasts/:id/stats` | Delivery stats |

#### Problem Resolution

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/problems` | List open problems |
| `POST` | `/problems` | Create problem thread |
| `POST` | `/problems/:id/resolve` | Mark as resolved |
| `POST` | `/messages/:id/mark-solution` | Mark message as solution |

#### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/templates` | List templates |
| `POST` | `/templates` | Create template |
| `GET` | `/templates/:id` | Template details |
| `PUT` | `/templates/:id` | Update template |
| `DELETE` | `/templates/:id` | Delete template |
| `POST` | `/templates/:id/use` | Use template (increment count) |

#### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | List notifications |
| `POST` | `/notifications/mark-read` | Mark as read |
| `POST` | `/notifications/mark-all-read` | Mark all as read |
| `GET` | `/notifications/unread-count` | Count unread |
| `DELETE` | `/notifications/:id` | Dismiss notification |

#### Parent Communications (Pedagogical)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/parent-comms` | Parent communication log |
| `POST` | `/parent-comms` | Log parent communication |
| `GET` | `/parent-comms/:id` | Communication details |
| `PUT` | `/parent-comms/:id` | Update communication |
| `GET` | `/students/:id/parent-comms` | Student's parent comms |

#### Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload attachment |
| `GET` | `/attachments/:id` | Get attachment |
| `DELETE` | `/attachments/:id` | Delete attachment |

---

### Module 7: Scheduling (Agenda)

**Route:** `/api/[orgSlug]/scheduling`

#### My Agenda (Personalized)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/my-agenda` | All my events (unified view) |
| `GET` | `/my-agenda/:date` | Single day agenda |
| `GET` | `/my-agenda/week/:date` | Week view |
| `GET` | `/my-agenda/month/:date` | Month view |
| `GET` | `/my-upcoming` | Next N events |
| `GET` | `/my-today` | Today's events |

#### Meetings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/meetings` | List meetings (filtered) |
| `POST` | `/meetings` | Create meeting |
| `GET` | `/meetings/:id` | Meeting details |
| `PUT` | `/meetings/:id` | Update meeting |
| `DELETE` | `/meetings/:id` | Cancel meeting |
| `POST` | `/meetings/:id/reschedule` | Reschedule |
| `POST` | `/meetings/:id/complete` | Mark completed + notes |

#### Meeting Participants

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/meetings/:id/participants` | List participants |
| `POST` | `/meetings/:id/participants` | Add participant |
| `DELETE` | `/meetings/:id/participants/:userId` | Remove participant |
| `POST` | `/meetings/:id/respond` | Accept/decline |

#### Approval Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/meetings/pending-approval` | My pending approvals |
| `POST` | `/meetings/:id/approve` | Approve meeting |
| `POST` | `/meetings/:id/reject` | Reject meeting |

#### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/availability/:userId` | User's availability |
| `GET` | `/availability/team/:teamId` | Team availability |
| `POST` | `/availability/find-slot` | Find available slot |
| `GET` | `/rooms/:id/availability` | Room availability |
| `GET` | `/teachers/:id/availability` | Teacher availability |

#### Rooms & Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rooms` | List rooms |
| `GET` | `/rooms/:id` | Room details |
| `POST` | `/rooms/:id/book` | Book room |
| `DELETE` | `/rooms/:id/bookings/:bookingId` | Cancel booking |
| `GET` | `/rooms/:id/schedule` | Room schedule |

#### Calendar Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/settings` | My calendar settings |
| `PUT` | `/settings` | Update settings |
| `POST` | `/settings/google/connect` | Connect Google Calendar |
| `POST` | `/settings/google/disconnect` | Disconnect Google |
| `POST` | `/settings/outlook/connect` | Connect Outlook |
| `POST` | `/settings/outlook/disconnect` | Disconnect Outlook |
| `POST` | `/settings/sync` | Force sync now |

#### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/templates` | Meeting templates |
| `POST` | `/templates` | Create template |
| `PUT` | `/templates/:id` | Update template |
| `DELETE` | `/templates/:id` | Delete template |

#### View by Entity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/schedule/class/:id` | Class schedule |
| `GET` | `/schedule/teacher/:id` | Teacher schedule |
| `GET` | `/schedule/room/:id` | Room schedule |
| `GET` | `/schedule/student/:id` | Student schedule |
| `GET` | `/schedule/team/:id` | Team schedule |

---

### Module 8: Analytics & Reports (BI)

**Route:** `/api/[orgSlug]/analytics`

#### Dashboards

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard` | Main dashboard metrics |
| `GET` | `/dashboard/owner` | Owner-specific dashboard |
| `GET` | `/dashboard/manager` | Manager dashboard |
| `GET` | `/dashboard/sales` | Sales team dashboard |
| `GET` | `/dashboard/teacher` | Teacher dashboard |
| `GET` | `/dashboard/finance` | Finance dashboard |

#### KPIs & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/kpis` | All KPIs |
| `GET` | `/kpis/:category` | KPIs by category |
| `GET` | `/metrics/daily` | Daily metrics time-series |
| `GET` | `/metrics/weekly` | Weekly aggregations |
| `GET` | `/metrics/monthly` | Monthly aggregations |
| `GET` | `/metrics/compare` | Period comparison |

#### Pre-built Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/enrollment` | Enrollment funnel |
| `GET` | `/reports/retention` | Retention analysis |
| `GET` | `/reports/churn` | Churn analysis |
| `GET` | `/reports/financial` | Financial summary |
| `GET` | `/reports/cashflow` | Cash flow projection |
| `GET` | `/reports/receivables` | Receivables aging |
| `GET` | `/reports/academic` | Academic performance |
| `GET` | `/reports/attendance` | Attendance report |
| `GET` | `/reports/hr` | HR summary |
| `GET` | `/reports/payroll` | Payroll report |
| `GET` | `/reports/crm` | CRM/Sales pipeline |
| `GET` | `/reports/commissions` | Commission report |

#### Funnel Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/funnel/crm` | CRM stage funnel |
| `GET` | `/funnel/enrollment` | Enrollment funnel |
| `GET` | `/funnel/stages/:stageId/conversions` | Stage conversion rates |
| `GET` | `/funnel/transitions` | Stage transition times |

#### Cohort Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cohorts/enrollment` | Enrollment cohorts |
| `GET` | `/cohorts/retention` | Retention by cohort |
| `GET` | `/cohorts/ltv` | LTV by cohort |

#### Procedure Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/procedures` | All procedure stats |
| `GET` | `/procedures/:id/analytics` | Single procedure |
| `GET` | `/procedures/:id/bottlenecks` | Bottleneck analysis |
| `GET` | `/procedures/:id/sla` | SLA compliance |
| `GET` | `/procedures/comparison` | Compare procedures |

#### Knowledge Graph (Nodes & Edges)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/graph/nodes` | List nodes (filtered) |
| `GET` | `/graph/nodes/:id` | Node details + edges |
| `GET` | `/graph/nodes/:id/neighbors` | Connected nodes |
| `GET` | `/graph/edges` | List edges |
| `GET` | `/graph/paths/:from/:to` | Find paths |
| `GET` | `/graph/clusters` | Cluster analysis |
| `POST` | `/graph/query` | Graph query (Cypher-like) |

#### Custom Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/custom` | Saved custom reports |
| `POST` | `/custom` | Create custom report |
| `GET` | `/custom/:id` | Run custom report |
| `PUT` | `/custom/:id` | Update report definition |
| `DELETE` | `/custom/:id` | Delete custom report |
| `POST` | `/custom/:id/schedule` | Schedule report |

#### Export System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/exports` | List available exports |
| `POST` | `/exports/generate` | Generate export |
| `GET` | `/exports/:id/status` | Export status |
| `GET` | `/exports/:id/download` | Download export |
| `GET` | `/exports/formats` | Available formats (CSV, Excel, PDF, JSON) |

#### AI-Powered Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/insights` | AI-generated insights |
| `GET` | `/insights/anomalies` | Detected anomalies |
| `GET` | `/insights/trends` | Trend analysis |
| `GET` | `/insights/predictions` | Predictions/forecasts |
| `POST` | `/insights/ask` | Ask AI about data |

#### Journey Analytics (Owner/Director BI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/journeys` | List all journeys (kanban view) |
| `GET` | `/journeys/students` | Student journey kanban |
| `GET` | `/journeys/staff` | Staff journey kanban |
| `GET` | `/journeys/:id` | Journey details + timeline |
| `GET` | `/journeys/:id/events` | Journey event history |
| `POST` | `/journeys/:id/stage` | Move to stage |
| `POST` | `/journeys/:id/risk` | Update risk assessment |

#### CAC-LTV Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cac-ltv/overview` | CAC-LTV dashboard |
| `GET` | `/cac-ltv/timeline` | Historical snapshots |
| `GET` | `/cac-ltv/by-channel` | CAC by acquisition channel |
| `GET` | `/cac-ltv/projections` | LTV projections |
| `GET` | `/cac-ltv/ratio` | LTV:CAC ratio trend |

#### Dropoff Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dropoffs` | All dropoff inferences |
| `GET` | `/dropoffs/by-stage` | Dropoffs per stage |
| `GET` | `/dropoffs/by-reason` | Dropoffs by category |
| `GET` | `/dropoffs/:id` | Inference details |
| `POST` | `/dropoffs/:id/acknowledge` | Acknowledge inference |
| `POST` | `/dropoffs/:id/action` | Record action taken |
| `POST` | `/dropoffs/analyze` | Trigger AI analysis |

#### Cohort Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cohorts/enrollment` | Enrollment cohorts |
| `GET` | `/cohorts/hire` | Staff hire cohorts |
| `GET` | `/cohorts/churn` | Churn cohorts |
| `GET` | `/cohorts/:type/:period` | Specific cohort data |
| `GET` | `/cohorts/retention-curve` | Retention curves |
| `GET` | `/cohorts/revenue-curve` | Revenue by month |

---

### Module 9: AI Assistant

**Route:** `/api/[orgSlug]/ai`

Uses school's configured AI provider (OpenAI, Anthropic, Google, etc.)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Chat with AI assistant |
| `POST` | `/generate/lesson-plan` | Generate lesson plan |
| `POST` | `/generate/content` | Generate content |
| `POST` | `/analyze/student` | Analyze student performance |
| `POST` | `/analyze/class` | Analyze class performance |
| `POST` | `/suggest/actions` | Get action suggestions |
| `GET` | `/usage` | AI usage/costs |

---

### Module 10: Knowledge Wiki

**Route:** `/api/[orgSlug]/wiki`

AI-generated institutional knowledge base from procedure executions.

#### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/articles` | List articles |
| `GET` | `/articles/:slug` | Get article |
| `POST` | `/articles` | Create article (manual) |
| `PUT` | `/articles/:id` | Update article |
| `DELETE` | `/articles/:id` | Delete article |
| `GET` | `/articles/:id/versions` | Version history |
| `GET` | `/articles/:id/versions/:version` | Specific version |
| `POST` | `/articles/:id/revert/:version` | Revert to version |

#### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create category |
| `PUT` | `/categories/:id` | Update category |
| `DELETE` | `/categories/:id` | Delete category |

#### Search & Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/search` | Full-text search |
| `GET` | `/search/semantic` | Semantic search (embeddings) |
| `GET` | `/related/:articleId` | Related articles |
| `GET` | `/popular` | Most viewed |
| `GET` | `/recent` | Recently updated |

#### Feedback

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/articles/:id/helpful` | Mark helpful |
| `POST` | `/articles/:id/not-helpful` | Mark not helpful |
| `POST` | `/articles/:id/feedback` | Submit feedback |

#### AI Generation Pipeline (Auto-Documentation)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stubs` | List article stubs |
| `GET` | `/stubs/:id` | Stub details + evidence |
| `GET` | `/stubs/ready` | Stubs ready for AI |
| `POST` | `/stubs/:id/collect-evidence` | Manually trigger evidence collection |

#### Weekly AI Batches (Gemini 2.5)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/batches` | List generation batches |
| `GET` | `/batches/:id` | Batch details |
| `POST` | `/batches/schedule` | Schedule batch |
| `POST` | `/batches/:id/run` | Run batch now |
| `GET` | `/batches/:id/runs` | Generation runs |
| `GET` | `/batches/stats` | Batch statistics |

#### Human Editing + Claude Polish

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/articles/:id/edit-session` | Start edit session |
| `PUT` | `/edit-sessions/:id` | Update edit session |
| `POST` | `/edit-sessions/:id/submit-for-polish` | Send to Claude |
| `GET` | `/edit-sessions/:id/polish-result` | Get Claude result |
| `POST` | `/edit-sessions/:id/accept` | Accept AI polish |
| `POST` | `/edit-sessions/:id/reject` | Reject, keep human edits |
| `GET` | `/my-edit-sessions` | My editing sessions |

#### Evidence Collection

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/evidence` | List evidence points |
| `GET` | `/evidence/by-stub/:stubId` | Evidence for stub |
| `POST` | `/evidence` | Submit evidence (from procedure) |
| `PUT` | `/evidence/:id/quality` | Mark high/low quality |

#### Quality Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/quality` | Article quality report |
| `GET` | `/quality/:articleId` | Quality history |
| `GET` | `/quality/needs-review` | Articles needing review |
| `POST` | `/quality/recalculate` | Recalculate scores |

---

### Module 11: Contábil (Accounting)

**Route:** `/api/[orgSlug]/contabil`

**Access:** Owner, Director, Accountant roles only

#### Chart of Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/coa` | Chart of accounts |
| `POST` | `/coa` | Create account |
| `PUT` | `/coa/:id` | Update account |
| `DELETE` | `/coa/:id` | Delete account |
| `GET` | `/coa/template` | Standard templates (Lucro Real) |

#### Fiscal Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/transactions` | Fiscal transactions |
| `POST` | `/transactions` | Create transaction |
| `PUT` | `/transactions/:id` | Update transaction |
| `GET` | `/transactions/:id` | Transaction details |
| `GET` | `/transactions/by-period/:period` | By competency period |

#### Bank Reconciliation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/bank-accounts` | Bank accounts |
| `POST` | `/bank-accounts` | Add bank account |
| `PUT` | `/bank-accounts/:id` | Update account |
| `POST` | `/bank-accounts/:id/import-statement` | Import OFX/CSV |
| `GET` | `/bank-accounts/:id/pending` | Pending reconciliation |
| `POST` | `/bank-accounts/:id/reconcile` | Reconcile transaction |
| `GET` | `/bank-accounts/:id/discrepancies` | List discrepancies |

#### Tax Withholdings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/withholdings` | Tax withholdings |
| `GET` | `/withholdings/:type` | By type (IRRF, INSS, ISS) |
| `GET` | `/withholdings/by-period/:period` | By period |
| `GET` | `/withholdings/darf/:period` | Generate DARF |
| `GET` | `/withholdings/gps/:period` | Generate GPS |

#### Reports (DRE, Balanço, Balancete)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/dre` | Income Statement (DRE) |
| `GET` | `/reports/dre/:period` | DRE by period |
| `GET` | `/reports/balancete` | Trial Balance |
| `GET` | `/reports/balancete/:period` | Balancete by period |
| `GET` | `/reports/balanco` | Balance Sheet |
| `GET` | `/reports/balanco/:year` | Balanço by year |
| `GET` | `/reports/razao` | General Ledger |
| `GET` | `/reports/diario` | Journal |

#### SPED Exports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sped/ecd` | ECD (Digital Bookkeeping) |
| `POST` | `/sped/ecd/generate` | Generate ECD file |
| `GET` | `/sped/ecf` | ECF (Fiscal Bookkeeping) |
| `POST` | `/sped/ecf/generate` | Generate ECF file |
| `GET` | `/sped/efd-contribuicoes` | EFD Contribuições |
| `POST` | `/sped/efd-contribuicoes/generate` | Generate EFD |
| `GET` | `/sped/history` | Export history |
| `GET` | `/sped/:id/download` | Download SPED file |

#### Document Repository

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/documents` | All fiscal documents |
| `GET` | `/documents/invoices` | Invoices (NFS-e, NF-e) |
| `GET` | `/documents/receipts` | Receipts |
| `GET` | `/documents/contracts` | Contracts |
| `GET` | `/documents/payroll` | Payroll docs (holerites) |
| `GET` | `/documents/darfs` | DARF payments |
| `GET` | `/documents/:id/download` | Download document |
| `POST` | `/documents/batch-download` | Batch download (ZIP) |

#### Accountant Access Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/accountant/access` | Accountant access config |
| `PUT` | `/accountant/access` | Update access settings |
| `POST` | `/accountant/invite` | Invite accountant |
| `POST` | `/accountant/api-key` | Generate API key |
| `POST` | `/accountant/api-key/:id/revoke` | Revoke API key (audited) |
| `GET` | `/accountant/activity` | Accountant activity log |

---

### Module 12: Kaizen (Process Improvement)

**Route:** `/api/[orgSlug]/kaizen`

Toyota-style democratic process improvement. Anyone can propose, everyone votes, consensus → trial → commit.

#### Suggestions (General Improvements)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/suggestions` | List suggestions |
| `GET` | `/suggestions/:id` | Suggestion details |
| `POST` | `/suggestions` | Submit suggestion |
| `PUT` | `/suggestions/:id` | Update (if draft) |
| `POST` | `/suggestions/:id/vote` | Vote (up/down) |
| `GET` | `/suggestions/:id/votes` | Who voted |
| `GET` | `/suggestions/:id/comments` | Discussion |
| `POST` | `/suggestions/:id/comments` | Add comment |
| `POST` | `/suggestions/:id/approve` | Approve (reviewer) |
| `POST` | `/suggestions/:id/reject` | Reject (reviewer) |



#### Procedure Branches (Process Evolution)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/branches` | List branches |
| `GET` | `/branches/:id` | Branch details |
| `POST` | `/branches` | Create branch (fork procedure) |
| `PUT` | `/branches/:id` | Update branch |
| `GET` | `/branches/:id/diff` | View changes from parent |
| `GET` | `/branches/:id/preview` | Preview modified procedure |

#### Branch Changes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/branches/:id/changes` | List changes |
| `POST` | `/branches/:id/changes` | Add change |
| `PUT` | `/branches/:id/changes/:changeId` | Update change |
| `POST` | `/branches/:id/changes/:changeId/remove` | Remove change |
| `PUT` | `/branches/:id/changes/reorder` | Reorder changes |

#### Stakeholder Consensus

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/branches/:id/stakeholders` | List stakeholders |
| `POST` | `/branches/:id/stakeholders` | Add stakeholder |
| `POST` | `/branches/:id/stakeholders/:userId/remove` | Remove stakeholder |
| `POST` | `/branches/:id/propose` | Move to voting |
| `POST` | `/branches/:id/vote` | Cast vote |
| `GET` | `/branches/:id/consensus` | Consensus status |
| `POST` | `/branches/:id/start-trial` | Start trial (when consensus) |

#### Trial Runs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/branches/:id/trial` | Trial status |
| `GET` | `/branches/:id/trial/executions` | Trial executions |
| `POST` | `/branches/:id/trial/feedback` | Submit vibe feedback |
| `GET` | `/branches/:id/trial/metrics` | Before/After metrics |
| `GET` | `/branches/:id/trial/vibes` | Aggregated vibes |

#### Commit & Versioning

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/branches/:id/commit` | Commit to main |
| `POST` | `/branches/:id/reject` | Reject after trial |
| `POST` | `/branches/:id/abandon` | Abandon branch |
| `GET` | `/procedures/:id/versions` | Version history |
| `GET` | `/procedures/:id/versions/:version` | Specific version |
| `GET` | `/procedures/:id/versions/:version/diff` | Compare versions |
| `POST` | `/procedures/:id/versions/:version/rollback` | Rollback to version |

#### My Kaizen

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/my/suggestions` | My suggestions |
| `GET` | `/my/branches` | My branches |
| `GET` | `/my/pending-votes` | Branches needing my vote |
| `GET` | `/my/trial-feedback` | Trials needing my feedback |

---

### Module 13: Settings

**Route:** `/api/[orgSlug]/settings`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/org` | Organization settings |
| `PUT` | `/org` | Update org settings |
| `GET` | `/branding` | Branding/Theme |
| `PUT` | `/branding` | Update branding |
| `GET` | `/users` | List users |
| `POST` | `/users` | Invite user |
| `PUT` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Remove user |
| `GET` | `/roles` | List roles |
| `POST` | `/roles` | Create role |
| `PUT` | `/roles/:id` | Update role |
| `GET` | `/permissions` | Available permissions |
| `GET` | `/integrations` | List integrations |
| `PUT` | `/integrations/:id` | Configure integration |
| `GET` | `/audit-log` | Audit log |

---

## 4. Public APIs

### `/api/public/[orgSlug]`
Public endpoints for school landing pages and forms.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/info` | Public school info |
| `GET` | `/courses` | Public course catalog |
| `GET` | `/courses/:slug` | Course details |
| `POST` | `/leads` | Submit interest form |
| `POST` | `/contact` | Contact form |
| `GET` | `/testimonials` | Testimonials |

---

## 5. External Accountant API (Contador)

**Route:** `/api/external/contabil`

**Authentication:** API Key (header: `X-Accountant-API-Key`)

This API allows external accountants (contadores) to automatically receive fiscal documents without logging into the platform. Schools generate an API key and share it with their accountant.

### Security

- API keys are organization-specific
- All requests are logged for audit trail
- Rate limited: 100 requests/hour
- IP whitelist optional
- Documents are read-only

### Available Endpoints

#### Document Retrieval

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/documents/monthly/:period` | All documents for period (YYYY-MM) |
| `GET` | `/documents/invoices` | All invoices (NFS-e) |
| `GET` | `/documents/invoices/:period` | Invoices by period |
| `GET` | `/documents/receipts/:period` | Receipts by period |
| `GET` | `/documents/payroll/:period` | Payroll docs (holerites) |
| `GET` | `/documents/contracts` | Active contracts |
| `GET` | `/documents/:id` | Single document |
| `GET` | `/documents/:id/download` | Download PDF/XML |
| `GET` | `/documents/package/:period` | ZIP of all period docs |

#### Fiscal Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/dre/:period` | DRE for period |
| `GET` | `/reports/balancete/:period` | Balancete for period |
| `GET` | `/reports/razao/:period` | Razão for period |
| `GET` | `/reports/transactions/:period` | All transactions |

#### SPED Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sped/ecd/:year` | ECD file for year |
| `GET` | `/sped/ecf/:year` | ECF file for year |
| `GET` | `/sped/efd/:period` | EFD for period |
| `GET` | `/sped/available` | List available SPED files |

#### Tax Vouchers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/taxes/withholdings/:period` | All withholdings |
| `GET` | `/taxes/darfs/:period` | DARF payments |
| `GET` | `/taxes/gps/:period` | GPS payments |
| `GET` | `/taxes/summary/:period` | Tax summary |

#### Organization Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/org/info` | Organization fiscal info |
| `GET` | `/org/bank-accounts` | Bank account list |
| `GET` | `/org/coa` | Chart of accounts |

### Automatic Delivery (Push)

Configure automatic delivery of documents to accountant:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/delivery/config` | Delivery configuration |
| `PUT` | `/delivery/config` | Update config |
| `GET` | `/delivery/history` | Delivery history |

**Delivery Options:**
- Email (ZIP attachment)
- Webhook (POST to accountant's system)
- SFTP (upload to accountant's server)
- Google Drive / Dropbox sync

### Response Format

```json
{
  "success": true,
  "data": {
    "documents": [...],
    "meta": {
      "period": "2026-01",
      "totalDocuments": 45,
      "generatedAt": "2026-02-05T00:00:00Z"
    }
  }
}
```

---

## 6. User Portal API (Synapse)

**Route:** `/api/me`

The "Synapse" - where users access their own data across all roles. LGPD compliant data portability and ownership.

### Profile & Identity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/profile` | My full profile |
| `PUT` | `/profile` | Update profile |
| `PUT` | `/profile/avatar` | Update avatar |
| `PUT` | `/profile/password` | Change password |
| `GET` | `/profile/roles` | My roles across orgs |
| `GET` | `/profile/preferences` | App preferences |
| `PUT` | `/profile/preferences` | Update preferences |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | My notifications |
| `GET` | `/notifications/unread` | Unread count |
| `PUT` | `/notifications/:id/read` | Mark read |
| `PUT` | `/notifications/read-all` | Mark all read |
| `GET` | `/notifications/settings` | Notification settings |
| `PUT` | `/notifications/settings` | Update settings |

### My Data (Student/Parent/Staff)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/data/overview` | Summary of my data |
| `GET` | `/data/enrollments` | My enrollments |
| `GET` | `/data/grades` | My grades/assessments |
| `GET` | `/data/attendance` | My attendance |
| `GET` | `/data/payments` | My payment history |
| `GET` | `/data/contracts` | My contracts |
| `GET` | `/data/documents` | My documents |

### AI Companion (Memory Graph)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/companion/status` | AI companion status |
| `GET` | `/companion/memory` | My memory graph summary |
| `GET` | `/companion/memory/nodes` | Memory nodes (paginated) |
| `GET` | `/companion/memory/search` | Search memories |
| `POST` | `/companion/memory/:nodeId/request-delete` | Request memory deletion (audited) |
| `POST` | `/companion/memory/forget-topic` | Request forget topic (audited) |
| `GET` | `/companion/chats` | Chat history |
| `GET` | `/companion/chats/:id` | Specific chat |
| `POST` | `/companion/chats/:id/request-delete` | Request chat deletion (audited) |
| `GET` | `/companion/settings` | AI companion settings |
| `PUT` | `/companion/settings` | Update settings |
| `POST` | `/companion/pause` | Pause AI memory collection |
| `POST` | `/companion/resume` | Resume memory collection |

### Privacy & Data Export (LGPD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/privacy/summary` | Data privacy summary |
| `GET` | `/privacy/consents` | My consent records |
| `PUT` | `/privacy/consents/:id` | Update consent |
| `POST` | `/privacy/export-request` | Request full data export |
| `GET` | `/privacy/export-request/:id` | Export request status |
| `GET` | `/privacy/export-request/:id/download` | Download export (ZIP) |
| `POST` | `/privacy/deletion-request` | Request data deletion |
| `GET` | `/privacy/deletion-request/:id` | Deletion request status |
| `GET` | `/privacy/audit-log` | My data access log |

### Export Formats

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/export/academic` | Export academic data (PDF) |
| `GET` | `/export/financial` | Export financial data (PDF) |
| `GET` | `/export/attendance` | Export attendance (PDF) |
| `GET` | `/export/companion` | Export AI companion data (JSON) |
| `GET` | `/export/full` | Full data export (ZIP) |
| `GET` | `/export/portable` | Portable format for migration |

### Voice & Wellbeing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/feedback` | Submit feedback |
| `POST` | `/support/ticket` | Create support ticket |
| `GET` | `/support/tickets` | My support tickets |
| `GET` | `/wellbeing/check-in` | Wellbeing check prompt |
| `POST` | `/wellbeing/check-in` | Submit check-in |

---

## 7. Webhook Endpoints

### `/api/webhooks`
Incoming webhooks from external services.

#### Payment Gateway Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/pagarme` | Pagar.me payment/split webhooks |
| `POST` | `/asaas` | Asaas payment webhooks |
| `POST` | `/iugu` | iugu payment webhooks |
| `POST` | `/pagbank` | PagBank/PagSeguro webhooks |
| `POST` | `/stripe` | Stripe webhooks |
| `POST` | `/mercadopago` | Mercado Pago webhooks |

#### Communication Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/whatsapp` | WhatsApp Business webhooks |
| `POST` | `/email` | Email delivery webhooks |
| `POST` | `/sms` | SMS delivery webhooks |

#### NFS-e & Fiscal Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/nfse` | NFS-e status webhooks |
| `POST` | `/nfe` | NF-e status webhooks |

#### Student Portal Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/material-submission` | Student material QR submission |

---

## Module → Menu Bundle Mapping

Each module corresponds to a menu section in the admin panel:

| Module | Menu Bundle | Icon | Color |
|--------|-------------|------|-------|
| CRM | Comercial | 💼 | Blue |
| Enrollment | Matrículas | 📋 | Green |
| Academic | Pedagógico | 📚 | Purple |
| Financial | Financeiro | 💰 | Emerald |
| HR | RH & Pessoas | 👥 | Orange |
| Communication | Comunicação | 💬 | Cyan |
| Scheduling | Agenda | 📅 | Yellow |
| Analytics | Relatórios | 📊 | Pink |
| **Knowledge Wiki** | **Base de Conhecimento** | **📖** | **Indigo** |
| **Kaizen** | **Melhoria Contínua** | **💡** | **Amber** |
| **Contábil** | **Contabilidade** | **📒** | **Teal** |
| AI Assistant | Assistente IA | 🤖 | Grape |
| Settings | Configurações | ⚙️ | Gray |

---

## Authentication & Authorization

### Auth Flow
1. User authenticates via `/api/auth/*` (NextAuth)
2. JWT contains: `userId`, `orgSlug`, `roleId`, `permissions[]`
3. Middleware validates org access and permissions per endpoint

### Permission Structure
```typescript
type Permission = {
  module: 'crm' | 'enrollment' | 'academic' | 'financial' | 'hr' | ...;
  action: 'view' | 'create' | 'update' | 'delete' | 'manage';
  scope: 'own' | 'team' | 'all';
};
```

### Example Permissions
- `crm:leads:view:all` - Can view all leads
- `financial:receivables:create:all` - Can create receivables
- `academic:grades:update:own` - Can update own class grades

---

## Next Steps

1. **Implement API routes** in `/src/app/api/`
2. **Create Prisma models** for each module
3. **Build tRPC procedures** (optional, for type-safe client)
4. **Add middleware** for auth, rate limiting, logging
5. **Document with OpenAPI/Swagger**

---

*Last Updated: 2026-02-05*
