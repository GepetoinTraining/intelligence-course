# Feature Inventory — Full Codebase Audit

**Generated:** 2026-02-10
**Codebase:** intelligence-course (Next.js + Drizzle ORM + SQLite/Turso)
**Scope:** 319 schema tables, 251 API routes, ~260 pages, 15 domain modules, 10 external integrations

---

## Executive Summary

| Metric | Count | Notes |
|--------|-------|-------|
| Schema tables | 319 | Only ~75 have any API usage |
| API routes | 251 | ~65 have no frontend caller |
| Frontend pages | ~260 | ~170 LIVE, ~40 MIXED, ~30 MOCK, ~40 SKELETON |
| Domain modules | 15 | **ALL 15 are types-only** — zero runtime logic |
| External integrations | 10 | 5 production, 4 partial/scaffold, 1 dead |
| Broken nav links | 0 | Navigation is clean |
| Orphaned pages | ~12 | Minor issue |

### The Big Picture

This is an ambitious education/school management ERP with ~319 database tables designed across every business domain imaginable. However, the **implementation pyramid is inverted**: massive schema, moderate API layer, and selective frontend coverage. Roughly **75% of all tables are schema-only** — defined but never touched by any code.

---

## 1. DATABASE SCHEMA AUDIT (319 tables)

### Classification Summary

| Status | Count | % | Description |
|--------|-------|---|-------------|
| **FULL** (schema + API + frontend) | ~46 | 14% | Complete end-to-end implementation |
| **API-ONLY** (schema + API, no frontend) | ~75 | 24% | Backend works, nothing displays it |
| **SCHEMA-ONLY** (defined, unused) | ~192 | 60% | Defined but no code touches it |
| **DEAD** (never referenced) | ~6 | 2% | Not even imported |

### FULL — End-to-End Implemented (46 tables)

These tables have schema definition, API routes, AND frontend pages consuming them:

| Table | Domain | Frontend Location |
|-------|--------|-------------------|
| anunciacoes | Teams/Announcements | /teams/[id]/anunciacao |
| attendance | Academic | /teacher/attendance |
| campaigns | Marketing | /marketing/campaigns |
| classes | School Ops | /school/classes |
| conversations | Communication | /admin/comunicacao |
| courses | Academic | /school/courses |
| discounts | Financial | /school/discounts |
| enrollments | Operations | /school/enrollments |
| graveyardEntries | Student | /graveyard, /student/graveyard |
| invoices | Financial | /financial, /parent/billing |
| journalEntries | Accounting | /accountant |
| journalEntryLines | Accounting | /accountant |
| kaizenSuggestions | Continuous Improvement | /kaizen/[id] |
| kaizenVotes | Continuous Improvement | /kaizen/[id] |
| leads | CRM/Sales | /staff/leads |
| lessons | Academic | /school/lessons |
| levels | Academic | /school/levels |
| meetings | Scheduling | /owner/calendar |
| memoryAuditLog | AI Memory | (API-only, auditor system) |
| memoryContradictions | AI Memory | (API-only) |
| memoryEdges | AI Memory | (API-only) |
| memoryGraphs | AI Memory | (API-only) |
| memoryIntegrityHashes | AI Memory | (API-only) |
| memoryLedger | AI Memory | (API-only) |
| memoryNodes | AI Memory | (API-only) |
| messages | Communication | /inbox |
| modules | Academic | /school/modules |
| notes | Notes | (API-only) |
| organizations | Core | Global tenant context |
| payables | Financial | /owner/payables |
| paymentMethods | Financial | /profile |
| payrollPayments | HR | /owner/payroll |
| permissionGroups | Access Control | /admin/configuracoes/permissoes |
| persons | Core Identity | Global — used everywhere |
| positionPermissions | Access Control | /owner/permissions |
| procedureExecutions | Workflow | (API-only) |
| procedureSteps | Workflow | (API-only) |
| products | Catalog | /school/products |
| progress | Student Progress | (API-only) |
| promptRuns | AI Prompts | /prompts |
| prompts | AI Prompts | /prompts, /student/prompts |
| receivables | Financial | Admin sidebar |
| referrals | Marketing | /marketing/referrals |
| rooms | School Ops | /school/rooms |
| teams | Team Management | /teams |
| terms | Academic | /school/terms |
| users | Core Identity | Global — used everywhere |
| waitlist | Operations | Admin sidebar |

### API-ONLY — Backend Works, No Frontend (75 tables)

These have functional API routes but nothing in the frontend calls them:

| Table | Domain | API Route | Gap |
|-------|--------|-----------|-----|
| actionItems | Task Management | /api/action-items | No UI to display action items |
| actionItemTypes | Task Management | /api/action-items/types | No type selector in UI |
| actionTypes | Workflow | Multiple routes | Backend reference only |
| aiSummaries | AI/Communication | /api/communicator/summaries | No summary display |
| attendanceRecords | Academic | /api/rights/export | Export-only usage |
| capstoneSubmissions | Student | /api/capstones | No capstone UI calling API |
| challenges | Student | /api/challenges | No challenges UI calling API |
| chartOfAccounts | Accounting | /api/chart-of-accounts | Used by financial APIs only |
| chatMessages | AI Chat | /api/chat/* | Chat UI may use different path |
| chatSessions | AI Chat | /api/chat/sessions | Chat UI may use different path |
| classSessions | Scheduling | /api/sessions | No session calendar UI |
| contractTemplates | Operations | /api/enrollment-flow/complete | Internal use only |
| conversationParticipants | Communication | /api/communicator/* | Backend join table |
| costCenters | Accounting | /api/cost-centers | No UI for cost centers |
| courseTypes | Academic | /api/enrollment-flow/* | Internal reference |
| crmAuditLog | CRM | /api/crm/[id] | Audit trail, no viewer |
| crmStageHistory | CRM | /api/crm/[id] | History, no viewer |
| drafts | Content | /api/drafts | No drafts management UI |
| emailTemplates | Marketing | /api/templates | Templates UI doesn't call it |
| familyLinks | Parent Portal | /api/family-links | No family management UI |
| fiscalDocuments | Accounting | /api/fiscal-documents | No NFe viewer |
| genesisCubePositions | Platform/AI | lib/genesis | Internal engine |
| genesisEdges | Platform/AI | lib/genesis | Internal engine |
| genesisEmbeddings | Platform/AI | lib/genesis | Internal engine |
| genesisLedger | Platform/AI | lib/genesis | Internal engine |
| genesisNodes | Platform/AI | lib/genesis | Internal engine |
| knowledgeEdges | Knowledge Graph | /api/knowledge-edges | No graph viewer |
| knowledgeNodes | Knowledge Graph | /api/knowledge-nodes | No graph viewer |
| latticeEvidence | Student Assessment | lib/lattice | Library only |
| latticeProjections | Student Assessment | /api/lattice/projections | No projections UI |
| leadInsights | CRM/AI | /api/scrm/insights | No insights page calling it |
| meetingTranscripts | Communication | /api/communicator/meetings/*/transcripts | No transcript viewer |
| messageAttachments | Communication | /api/chat/*, /api/communicator/* | Backend handling only |
| peerReviews | Student | /api/reviews | Review UI exists but may not call |
| placementResults | Academic | /api/placements | No placement UI |
| placementTests | Academic | /api/placements | No placement UI |
| pipelineEvents | Workflow | lib reference | Pipeline tracking |
| qrCodes | Marketing | /api/qr/* | No QR management UI |
| qrScans | Marketing | /api/qr/scan | No scan analytics UI |
| rolePermissions | Access Control | /api/permissions | Backend permission checks |
| roleRelationships | Access Control | /api/meetings | Internal reference |
| runAnnotations | AI Prompts | /api/annotations | No annotation viewer |
| safetyAlerts | Student Safety | /api/alerts/* | 5 alert routes, no UI |
| schedules | Scheduling | /api/schedules | Schedule pages exist but may use different source |
| sessions | Analytics | /api/sessions | Session tracking, no viewer |
| staffContracts | HR | /api/staff-contracts | No contract management UI |
| staffLeave | HR | /api/staff-leave | No leave management UI |
| staffPayroll | HR | /api/staff-payroll | Payroll API, indirect UI |
| stepExecutions | Workflow | /api/procedures/*/execute | No execution tracker UI |
| studentPrompts | AI/Student | /api/student-prompts | Student prompts page may use /api/prompts instead |
| supportTickets | Support | /api/tickets | No ticket management UI in dashboard |
| talentEvidenceDocuments | HR/Recruitment | /api/talent/documents | No talent docs UI |
| talentGapInterviews | HR/Recruitment | /api/talent/gap-interview | No interview UI |
| talentProfiles | HR/Recruitment | /api/talent/profile | Talent pool page may not call this |
| tasks | Academic | /api/lessons/[id] | Internal lesson subtasks |
| taxWithholdings | Accounting | /api/fiscal-documents/[id] | Tax computation only |
| teacherContracts | HR | /api/teacher-contracts | No contract management UI |
| teacherPayouts | Financial | /api/payouts | No payout management UI |
| teamMembers | Team Management | /api/teams/* | Backend join table |
| teamPositions | Team Management | /api/teams/*, /api/positions | Backend reference |
| techniqueUsage | Student | /api/techniques | Techniques page may not call |
| ticketMessages | Support | /api/tickets/*/messages | No message thread UI |
| todoItems | Student | /api/todos | Todo page may use different path |
| trackingEvents | Marketing | /api/marketing/tracking | Analytics backend |
| transactions | Financial | /api/transactions | No transaction viewer UI |
| trialClasses | Sales | /api/trials | Trials page exists |
| userApiKeys | Platform | /api/api-keys | No API key management UI |
| userGroupAssignments | Access Control | /api/permission-groups | Backend reference |
| userPermissionOverrides | Access Control | /api/user-overrides | Backend reference |
| userPermissions | Access Control | /api/permissions | Backend checks |
| userRoleAssignments | Access Control | /api/meetings | Backend reference |
| visitors | Marketing | /api/marketing/tracking | Analytics backend |
| wikiArticleFeedback | Knowledge | /api/wiki/articles/[slug] | No feedback UI |
| wikiArticleVersions | Knowledge | /api/wiki/articles | No version history UI |
| wikiArticles | Knowledge | /api/wiki/articles | Wiki pages exist but may use different call |
| wikiCategories | Knowledge | /api/wiki/categories | Backend reference |
| wikiPages | Knowledge | /api/procedures | Procedures reference |

### SCHEMA-ONLY — Defined but Never Used (~192 tables)

These tables exist in the 14,124-line schema file but NO code anywhere imports or references them:

**Academic/Pedagogical (40+ tables):**
assessmentTypes, attendanceRecords (minimal use), classEnrollments, classGroups, classStructures, classroomIncidents, curriculumMaterials, gradebookEntries, gradingScales, homeworkAssignments, homeworkPolicies, homeworkSubmissions, lessonPlans, materialSubmissions, materialTemplates, pedagogicalNoteAcknowledgements, pedagogicalNoteReplies, pedagogicalNotes, proficiencyLevels, programAssessmentWeights, programClassSchedules, programClassSessions, programPassRequirements, programUnits, progressReports, rubricCriteria, rubricPerformanceLevels, rubrics, schoolPrograms, scoringCriteria, studentAssessments, studentCertificates, studentGrades, studentLearningProfiles, studentProgressions, substituteTeacherLogs, teacherAssignments, teacherAvailability, teacherEvaluations, teacherProfiles, teacherWorkload, teachingMethodologies, varkAssessmentResponses, academicActivities, activityRegistrations, generatedStudentMaterials

**Financial/Accounting (30+ tables):**
bankAccounts, cacLtvSnapshots, cashTransactions, cashierSessions, cashiers, checkoutRecords, commissionPayouts, couponRedemptions, coupons, coursePricing, financialGoals, fiscalTaxWithholdings, fiscalTransactionDocuments, fiscalTransactions, invoiceItems, lateFeeNegotiations, moneyFlows, organizationFinancialSettings, paymentGateways, paymentReminders, receivablePayments, splitRecipients, splitRuleItems, splitRules

**HR/People (15+ tables):**
employeeBenefits, laborProvisionBalances, laborProvisionSettings, orgChartPositions, positionAssignments, staffAuthorityLevels, staffInsightCommunications, staffRoles, staffSalaryHistory, staffSentimentHistory, staffTrainingRecords, terminationPlans, timeClockEntries, timeSheets, workScheduleTemplates

**Marketing/Sales (25+ tables):**
abTestAssignments, brandActivations, campaignDailyMetrics, campaignLeads, contentAssets, contentCalendar, contentTypes, eventRegistrations, landingPageDailyMetrics, landingPages, marketingEvents, marketingIntegrations, marketingPartners, marketingTargets, salesActions, salesCalendar, salesPipeline, salesTeamDailyMetrics, salesTeamMembers, salesTeams, salesTouches, sweepstakesEntries, pipelineStageHistory

**CRM/Lead (10+ tables):**
leadCourseInterests, leadFunnelHistory, leadInteractions, leadPersonas, leadRoles, leadSentimentHistory, dropoffInferences, insightCommunications

**Communication (10+ tables):**
communicationTemplates, messageReadReceipts, notificationQueue, parentCommunications, typingIndicators, meetingNotes, meetingParticipants, meetingTemplates

**Contracts/Legal (5+ tables):**
contractClauses, contractParties, contractTemplates (minor use), contracts

**Operations (10+ tables):**
makeupClasses, receptionVisits, intakeInterviews, scheduleExceptions

**Platform/System (15+ tables):**
accountantApiKeys, accountantApiLogs, accountantDeliveryConfig, accountantDeliveryHistory, actionItemComments, actionTypes (partial), activityFeed, aiProviders, alertAcknowledgments, badges, branchChanges, branchStakeholders, cohortAnalytics, dataAccessAuditLog, dataDeletionRequests, dataExportRequests, journeyEvents, journeyInstances, kaizenComments, kaizenMetrics, knowledgeGenBatches, knowledgeGenRuns, latticeShares, latticeSkillAssessments, latticeSkillDefinitions, memoryContradictions (minor), orgAnunciacaoSettings, organizationBranding, organizationDomains, organizationLocations, organizationMemberships, organizationalRoles, ownerRoles, parentRoles, permissionAuditLog, permissionGroupActions, personBankAccounts, personLattice, privacyConsents, problemWorkshops, procedureAnalytics, procedureBranches, procedureTemplates, procedureTransitions, procedureVersions, processDiscoveryEvents, promptDeltas, schoolServices, stakeholderLifecycles, studentRoles, studentWorldOverlay, talentPoolCandidates, trialExecutions, trialMetricsComparison, trialVibeSummary, userBadges, userCalendarSettings, wellbeingSnapshots, wikiArticleStubs, wikiEditSessions, wikiEvidencePoints, wikiQualityMetrics

---

## 2. API ROUTES AUDIT (251 routes)

### Classification Summary

| Status | Count | % |
|--------|-------|---|
| Called by frontend | ~186 | 74% |
| **No frontend caller** | **~65** | **26%** |

### API Routes With No Frontend Caller (~65 routes)

**Auditor/Integrity System (10 routes):**
- `/api/auditor/alerts` — Student safety alerts
- `/api/auditor/analyze` — AI analysis
- `/api/auditor/engagement/[studentId]` — Engagement metrics
- `/api/auditor/verify-integrity/[studentId]` — Data integrity
- `/api/auditor/wellbeing/[studentId]` — Wellbeing checks
- `/api/integrity/hash/[studentId]` — Hash verification
- `/api/integrity/log/[studentId]` — Audit log
- `/api/integrity/report` — Integrity reports
- `/api/integrity/verify` — Verification endpoint

**Alerts System (5 routes):**
- `/api/alerts` — List alerts
- `/api/alerts/[id]` — Get alert
- `/api/alerts/[id]/acknowledge` — Acknowledge
- `/api/alerts/[id]/escalate` — Escalate
- `/api/alerts/[id]/resolve` — Resolve

**GDPR/Data Rights (6 routes):**
- `/api/rights/access/[studentId]` — Data access request
- `/api/rights/export/[studentId]` — Data export
- `/api/rights/forget` — Right to be forgotten
- `/api/rights/negotiate` — Consent negotiation
- `/api/rights/portability` — Data portability
- `/api/rights/rectify` — Data rectification

**Knowledge Graph (4 routes):**
- `/api/knowledge-edges` — Edge CRUD
- `/api/knowledge-edges/[id]`
- `/api/knowledge-nodes` — Node CRUD
- `/api/knowledge-nodes/[id]`

**Memory System (3 routes):**
- `/api/memory/compress/[studentId]` — Memory compression
- `/api/memory/compress/stats/[studentId]` — Compression stats
- `/api/memory/overlay/[studentId]` — World overlay

**Procedures/Workflow (5 routes):**
- `/api/procedures` — List procedures
- `/api/procedures/[id]/execute` — Execute
- `/api/procedures/[id]/steps` — Steps
- `/api/procedures/executions/[executionId]` — Execution tracking
- `/api/procedures/seed-pipelines` — Seed data

**Parent/Child Context (5 routes):**
- `/api/parent/child/[childId]/alerts`
- `/api/parent/child/[childId]/engagement`
- `/api/parent/child/[childId]/progress`
- `/api/parent/child/[childId]/recommendations`
- `/api/parent/child/[childId]/wellbeing`

**Domain Analysis (3 routes):**
- `/api/domains/institutional/[studentId]`
- `/api/domains/relational/[studentId]`
- `/api/domains/supervision/[studentId]`

**Other Uncalled Routes:**
- `/api/annotations`, `/api/annotations/[id]`
- `/api/capstones`, `/api/capstones/[id]`
- `/api/chat/stream`
- `/api/delegation`
- `/api/drafts/[type]/[id]`
- `/api/export`
- `/api/marketing/tracking`
- `/api/memory/snr`
- `/api/permission-expiry`
- `/api/platform/genesis/process`
- `/api/platform/mcp/genesis`
- `/api/qr/generate`, `/api/qr/scan/[code]`
- `/api/reports/financial`
- `/api/runs`
- `/api/scrm/persona/generate`
- `/api/scrm/sentiment/analyze`
- `/api/waitlist`, `/api/waitlist/[id]`
- `/api/workshops`, `/api/workshops/[id]`

---

## 3. FRONTEND PAGES AUDIT (~260 pages)

### Classification Summary

| Status | Count | % | Description |
|--------|-------|---|-------------|
| **LIVE** | ~170 | 61% | Fetches real data from API |
| **MIXED** | ~40 | 14% | Real data + hardcoded fallbacks |
| **MOCK** | ~30 | 11% | All hardcoded/demo data |
| **SKELETON** | ~40 | 14% | Empty placeholder shells |

### By Section

#### Admin Panel (148 pages)
The admin panel is the most comprehensive section, organized into 15 "bundles" (departments):

| Bundle | Pages | Status | Notes |
|--------|-------|--------|-------|
| Marketing | 9 | Mostly LIVE | Analytics, campaigns, leads all wired |
| Comercial | 8 | LIVE/MIXED | Pipeline, clients live; some mock fallbacks |
| Operacional | 9 | LIVE | Enrollments, students, contracts all wired |
| Pedagógico | 9 | LIVE | Courses, classes, grades wired |
| Financeiro | 9 | Mostly LIVE | Cash flow, billing live; bank accounts MOCK |
| RH & Pessoas | 10 | LIVE | Staff, payroll, contracts all wired |
| Comunicação | 8 | LIVE | Inbox, templates, WhatsApp all wired |
| Agenda | 9 | MIXED | Personal agenda LIVE; rooms MOCK; some skeleton |
| Relatórios | 11 | **SKELETON** | All 11 report pages are empty shells |
| Contábil | 11 | MIXED | Chart of accounts LIVE; many mock financial reports |
| Conhecimento | 7 | MIXED | Wiki LIVE; policies/procedures have mock fallbacks |
| Assistente IA | 6 | MOCK/SKELETON | Chat has mock messages; others are shells |
| Kaizen | 8 | MIXED | Suggestions LIVE; NPS/retrospectives have mock data |
| Suporte | 3 | MIXED | Tickets partially wired |
| Configurações | 13 | LIVE | All settings pages wired to APIs |

#### Dashboard — Owner (18 pages)
Almost entirely LIVE — analytics, cashflow, employees, payroll, revenue, projections all fetch real data.

#### Dashboard — School (16 pages)
All LIVE — classes, courses, enrollments, lessons, levels, modules, products, rooms, schedules, students, teachers, terms.

#### Dashboard — Staff (21 pages)
All LIVE — leads, CRM, pipeline, marketing tools, payments, sales, trials, check-in.

#### Dashboard — Student (11 pages)
Mostly LIVE — capstone, challenges, journal, prompts, techniques, todo. Constellation and graveyard may be skeleton.

#### Dashboard — Teacher (6 pages)
All LIVE — attendance, classes, grades, schedule, student detail.

#### Dashboard — Parent (3 pages)
All LIVE — child progress, billing.

#### Dashboard — Teams (6 pages)
All LIVE — team directory, announcements, capacity, permissions, reporting.

#### Dashboard — Wiki (6 pages)
All LIVE — articles, categories, editing, creation.

#### Organization Setup (7 pages)
All SKELETON — blueprint, financial, products, rules, team setup wizards.

#### Main Dashboard Page
**MOCK** — The main /dashboard page uses hardcoded demo data (mock user, mock modules, mock activity).

---

## 4. EXTERNAL INTEGRATIONS AUDIT (10 services)

### Integration Status

| Integration | Status | SDK Installed | Actual API Calls | Error Handling |
|-------------|--------|---------------|-----------------|----------------|
| **Clerk** (auth) | PRODUCTION | Yes | Yes | Yes — dev mode fallback |
| **Anthropic/Claude** (AI) | PRODUCTION | Yes (@anthropic-ai/sdk@0.72.1) | Yes | Yes — APIError handling |
| **Google AI** (embeddings) | PRODUCTION | Yes (@google/generative-ai@0.24.1) | Yes | Yes — rate limiting, caching |
| **Resend** (email) | PRODUCTION | Yes (resend@6.9.1) | Yes | Yes — fallback to mock |
| **Turso/LibSQL** (database) | PRODUCTION | Yes (@libsql/client@0.17.0) | Yes | Yes — connection management |
| **Stripe** (payments) | SCAFFOLD | **No** — not in package.json | Mock responses only | Partial |
| **Asaas** (BR payments) | PARTIAL | No | Mock responses only | Partial structure |
| **MercadoPago** | PARTIAL | No | Mock responses only | Partial structure |
| **PagarMe** | PARTIAL | No | Mock responses only | Partial structure |
| **PagSeguro** | PARTIAL | No | Mock responses only | Partial structure |

### Payment Gateway Detail

All 5 payment providers share a unified provider interface at `/src/lib/payments/providers.ts`:
- Type definitions exist for all providers
- Fee structures are configured (e.g., Stripe 2.9%+$0.30, Asaas 2.99% credit, MercadoPago 4.99% credit, etc.)
- Webhook handlers exist at `/api/webhooks/{stripe,asaas,mercadopago,pagarme,pagseguro}`
- **BUT**: No SDKs are installed. All provider functions return mocked responses. No real payment processing is possible.

### AI System Detail

The AI subsystem is the most deeply implemented integration:
- **Anthropic Claude**: Used for communicator, SCRM sentiment analysis, talent document analysis, gap interviews, prompt engine
- **Google Gemini**: Used for embedding generation (text-embedding-004, 768 dimensions) with rate limiting (1500 RPM), in-memory caching (1000 entries), and batch processing
- **Memory System**: Full graph-based memory with nodes, edges, contradictions, integrity hashes, ledger, and audit log
- **Genesis Engine**: Internal AI engine with cube positions, embeddings, subconscious processing (files in `/src/lib/genesis/`)
- **Lattice System**: Student assessment with evidence tracking, projections, skill assessments (files in `/src/lib/lattice/`)

---

## 5. DOMAIN MODULES AUDIT (15 modules)

**Critical Finding: ALL 15 modules are TYPES-ONLY.**

Every module under `src/modules/` follows the exact same pattern:
```
src/modules/{name}/
  index.ts          → re-exports from types/
  types/
    index.ts        → TypeScript interface definitions only
```

**Zero runtime logic. Zero imports from anywhere in the codebase.**

| Module | Types Exported | Used By | Status |
|--------|---------------|---------|--------|
| academic | Course, Class, Lesson, Module, Attendance, Grade, Assessment, Certificate, Material | Nothing | TYPES-ONLY |
| accounting | ChartOfAccount, JournalEntry, CostCenter, FiscalDocument, TaxWithholding, SPEDExport | Nothing | TYPES-ONLY |
| ai-companion | AIChat, AIChatMessage, AIGenerator, AIAnalysis, AIInsight, MemoryNode, MemoryEdge | Nothing | TYPES-ONLY |
| analytics | Dashboard, DashboardWidget, KPI | Nothing | TYPES-ONLY |
| communications | Conversation, Message, MessageAttachment, Announcement | Nothing | TYPES-ONLY |
| core | Person, Organization, User, UserRole, Permission, Role | Nothing | TYPES-ONLY |
| financial | Invoice, Transaction, Receivable, Payable, BankAccount, CashFlowEntry, PaymentMethod | Nothing | TYPES-ONLY |
| hr | Employee, StaffContract, PayrollEntry, Leave, Benefit | Nothing | TYPES-ONLY |
| kaizen | Suggestions, Feedback, Retrospectives, NPS | Nothing | TYPES-ONLY |
| knowledge | Wiki, Procedures, Policies, FAQ | Nothing | TYPES-ONLY |
| management | OrganizationSettings, BrandingSettings, UserSettings | Nothing | TYPES-ONLY |
| marketing | Campaigns, Leads, Sources, Content | Nothing | TYPES-ONLY |
| operations | Enrollments, Students, Contracts | Nothing | TYPES-ONLY |
| sales | Pipeline, Opportunities, Proposals | Nothing | TYPES-ONLY |
| scheduling | Calendars, Events, Rooms, Resources | Nothing | TYPES-ONLY |

**The actual runtime logic lives in:**
- `src/lib/` — utility libraries (AI, payments, auth, DB, embeddings, etc.)
- `src/app/api/` — route handlers with business logic
- `src/components/` — UI logic

---

## 6. NAVIGATION & ROUTING AUDIT

### Middleware
- **Dev mode**: `NEXT_PUBLIC_DEV_AUTH='true'` bypasses all auth
- **Production**: Clerk authentication required for all non-public routes
- **Public routes**: `/`, `/sign-in`, `/sign-up`, `/onboarding`, `/join`, `/careers`, `/lattice/demo`, `/api/careers`, `/api/onboarding`, `/api/invites`

### Navigation Structure
Two separate navigation systems:
1. **AdminSidebar** (`/admin/*`) — 15 bundles, 148 items, role-gated
2. **AppLayout** (`/(dashboard)/*`) — 7 user roles (student, teacher, parent, staff, school, owner, accountant)

### Navigation Health
- **Broken links**: 0 (all sidebar items point to valid pages)
- **Orphaned pages**: ~12 pages not in any navigation menu
  - `/admin/ai/automacoes` — not in sidebar
  - `/admin/configuracoes/roles` — path mismatch
  - `/admin/comunicacoes/mensagens` — different bundle name
  - `/admin/perfil` — profile, accessible from menu only
  - `/admin/preferencias` — preferences, accessible from menu only
  - `/admin/relatorios/relatorios` — duplicate naming
  - `/admin/operacional/matriculas/nova` — sub-form

---

## 7. FEATURE-BY-FEATURE STATUS MAP

### Legend
- COMPLETE = Schema + API + Frontend + Real Data
- PARTIAL = Some layers exist, gaps in others
- SCAFFOLD = Structure exists, no real implementation
- PLANNED = Schema only, no code

### Core Platform

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Multi-tenant orgs | organizations | /api/user/organizations | Global context | Real | COMPLETE |
| User management | users, persons | /api/users, /api/profile | /admin/configuracoes/usuarios | Real | COMPLETE |
| Authentication (Clerk) | — | Middleware + auth lib | Sign-in/up pages | Real | COMPLETE |
| Role-based access | rolePermissions, userPermissions | /api/permissions | /admin/configuracoes/permissoes | Real | COMPLETE |
| Team management | teams, teamMembers, teamPositions | /api/teams/* | /teams/* | Real | COMPLETE |
| Onboarding | — | /api/onboarding/* | /onboarding, /[orgSlug]/onboarding | Mixed | PARTIAL |

### Academic/Pedagogical

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Courses | courses | /api/courses | /school/courses | Real | COMPLETE |
| Modules | modules | /api/modules | /school/modules, /m/[moduleId] | Real | COMPLETE |
| Lessons | lessons | /api/lessons | /school/lessons, /m/*/l/* | Real | COMPLETE |
| Classes/Turmas | classes | /api/classes | /school/classes | Real | COMPLETE |
| Levels | levels | /api/levels | /school/levels | Real | COMPLETE |
| Terms | terms | /api/terms | /school/terms | Real | COMPLETE |
| Rooms | rooms | /api/rooms | /school/rooms | Real | COMPLETE |
| Teachers | teacherRoles | — | /school/teachers | Real | COMPLETE |
| Students | studentRoles | — | /school/students | Real | COMPLETE |
| Attendance | attendance | /api/attendance | /teacher/attendance | Real | COMPLETE |
| Grades | studentGrades, gradebookEntries | — | /teacher/grades | Real | PARTIAL |
| Homework | homeworkAssignments, homeworkSubmissions | — | — | — | PLANNED |
| Rubrics | rubrics, rubricCriteria, rubricPerformanceLevels | — | — | — | PLANNED |
| Certificates | studentCertificates | — | — | — | PLANNED |
| Learning profiles | studentLearningProfiles, varkAssessmentResponses | — | — | — | PLANNED |
| Curriculum materials | curriculumMaterials, lessonPlans | — | — | — | PLANNED |
| Placement tests | placementTests, placementResults | /api/placements | — | — | SCAFFOLD |
| Programs | schoolPrograms, programUnits, etc. (7 tables) | — | — | — | PLANNED |
| Pedagogical notes | pedagogicalNotes, replies, acks | — | — | — | PLANNED |
| Progress reports | progressReports | — | — | — | PLANNED |
| Teacher evaluations | teacherEvaluations | — | — | — | PLANNED |
| Classroom incidents | classroomIncidents | — | — | — | PLANNED |

### Financial

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Invoices | invoices, invoiceItems | /api/invoices | /financial, /parent/billing | Real | COMPLETE |
| Transactions | transactions | /api/transactions | — | Real | PARTIAL (no UI) |
| Payables | payables | /api/payables | /owner/payables | Real | COMPLETE |
| Receivables | receivables | /api/enrollment-flow | Admin sidebar | Real | COMPLETE |
| Payment methods | paymentMethods | /api/payment-methods | /profile | Real | COMPLETE |
| Payroll | payrollPayments, staffPayroll | /api/payroll-payments | /owner/payroll | Real | COMPLETE |
| Teacher payouts | teacherPayouts | /api/payouts | — | Real | PARTIAL (no UI) |
| Discounts | discounts | /api/discounts | /school/discounts | Real | COMPLETE |
| Products | products | /api/products | /school/products | Real | COMPLETE |
| Journal entries | journalEntries, journalEntryLines | /api/journal-entries | /accountant | Real | COMPLETE |
| Chart of accounts | chartOfAccounts | /api/chart-of-accounts | /admin/contabil/plano-contas | Real | COMPLETE |
| Cost centers | costCenters | /api/cost-centers | — | Real | PARTIAL (no UI) |
| Fiscal documents (NFe) | fiscalDocuments | /api/fiscal-documents | — | Real | PARTIAL (no UI) |
| Cash flow | — | — | /admin/financeiro/fluxo-caixa | Mock/Mixed | SCAFFOLD |
| Commission payouts | commissionPayouts | — | — | — | PLANNED |
| Money flows | moneyFlows | — | — | — | PLANNED |
| Financial goals | financialGoals | — | — | — | PLANNED |
| Payment gateways | paymentGateways | — | — | — | PLANNED |
| Split payments | splitRules, splitRuleItems, splitRecipients | — | — | — | PLANNED |
| Payment reminders | paymentReminders | — | — | — | PLANNED |
| Late fee negotiations | lateFeeNegotiations | — | — | — | PLANNED |
| Coupons | coupons, couponRedemptions | — | — | — | PLANNED |

### CRM/Sales

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Leads | leads | /api/leads, /api/scrm/leads | /staff/leads | Real | COMPLETE |
| Lead detail | leads | /api/leads/[id] | /staff/leads/[id] | Real | COMPLETE |
| Lead conversion | — | /api/leads/[id]/convert | — | Real | PARTIAL |
| CRM pipeline | — | /api/crm/funnel | /owner/crm | Real | COMPLETE |
| CRM audit | crmAuditLog, crmStageHistory | /api/crm/[id] | — | Real | PARTIAL (no UI) |
| SCRM insights | leadInsights | /api/scrm/insights | /staff/scrm/insights | Real | COMPLETE |
| Trials | trialClasses | /api/trials | /staff/trials | Real | COMPLETE |
| Lead personas | leadPersonas | /api/scrm/persona/generate | — | — | SCAFFOLD |
| Lead sentiment | leadSentimentHistory | /api/scrm/sentiment/analyze | — | — | SCAFFOLD |
| Sales pipeline | salesPipeline, salesTouches | — | — | — | PLANNED |
| Sales teams | salesTeams, salesTeamMembers | — | — | — | PLANNED |
| Sales calendar | salesCalendar, salesActions | — | — | — | PLANNED |
| Brand activations | brandActivations | — | — | — | PLANNED |

### Marketing

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Campaigns | campaigns | /api/campaigns | /marketing/campaigns | Real | COMPLETE |
| Email templates | emailTemplates | /api/templates | /marketing/templates | Real | COMPLETE |
| Referrals | referrals | /api/referrals | /marketing/referrals | Real | COMPLETE |
| Lead forms | — | — | /marketing/lead-form | Real | COMPLETE |
| QR codes | qrCodes, qrScans | /api/qr/* | — | Real | PARTIAL (no UI) |
| Marketing tracking | trackingEvents, visitors | /api/marketing/tracking | — | Real | PARTIAL (no UI) |
| Landing pages | landingPages | — | /staff/landing-builder | — | SCAFFOLD |
| Content calendar | contentCalendar, contentAssets | — | — | — | PLANNED |
| Marketing events | marketingEvents, eventRegistrations | — | — | — | PLANNED |
| Marketing partners | marketingPartners | — | — | — | PLANNED |
| A/B testing | abTestAssignments | — | — | — | PLANNED |
| Campaign metrics | campaignDailyMetrics | — | — | — | PLANNED |

### HR/People

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Staff contracts | staffContracts | /api/staff-contracts | /admin/rh/contratos | Real | COMPLETE |
| Staff leave | staffLeave | /api/staff-leave | /admin/rh/ferias | Real | COMPLETE |
| Staff payroll | staffPayroll | /api/staff-payroll | /admin/rh/folha | Real | COMPLETE |
| Teacher contracts | teacherContracts | /api/teacher-contracts | — | Real | PARTIAL |
| Careers/Jobs | — | /api/careers | /careers | Real | COMPLETE |
| Talent pool | talentProfiles | /api/talent/* | /owner/talent-pool | Real | PARTIAL |
| Time clock | timeClockEntries, timeSheets | — | — | — | PLANNED |
| Org chart | orgChartPositions | — | /admin/rh/organograma | — | SCAFFOLD |
| Benefits | employeeBenefits | — | — | — | PLANNED |
| Termination plans | terminationPlans | — | — | — | PLANNED |
| Work schedule templates | workScheduleTemplates | — | — | — | PLANNED |
| Labor provisions | laborProvisionSettings, laborProvisionBalances | — | — | — | PLANNED |

### AI/Intelligence System

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| AI chat | chatSessions, chatMessages | /api/chat/* | /admin/ai/chat | Mock UI | PARTIAL |
| Prompt engine | prompts, promptRuns | /api/prompts | /prompts | Real | COMPLETE |
| Student prompts | studentPrompts | /api/student-prompts | /student/prompts | Real | COMPLETE |
| Memory system | memoryNodes, memoryEdges, memoryGraphs, memoryLedger | /api/memory/* | — | Real | PARTIAL (no UI) |
| Memory integrity | memoryIntegrityHashes, memoryAuditLog | /api/integrity/* | — | Real | PARTIAL (no UI) |
| Memory contradictions | memoryContradictions | /api/memory/contradictions | — | Real | PARTIAL (no UI) |
| Knowledge graph | knowledgeNodes, knowledgeEdges | /api/knowledge-edges, /api/knowledge-nodes | — | Real | PARTIAL (no UI) |
| Embeddings (Gemini) | genesisEmbeddings | lib/embeddings | — | Real | COMPLETE (library) |
| Genesis engine | genesisNodes, genesisEdges, genesisCubePositions, genesisLedger | lib/genesis | — | Real | COMPLETE (library) |
| Lattice assessment | latticeEvidence, latticeProjections, latticeSkill* | /api/lattice/* | /lattice/demo | Real | PARTIAL |
| Student world overlay | studentWorldOverlay | — | — | — | PLANNED |
| Safety alerts | safetyAlerts | /api/alerts/* | — | Real | PARTIAL (no UI) |
| Wellbeing | wellbeingSnapshots | /api/auditor/wellbeing | — | — | SCAFFOLD |

### Communication

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Inbox/Messaging | messages, conversations | /api/communicator/* | /inbox | Real | COMPLETE |
| Meeting management | meetings | /api/meetings | /owner/calendar | Real | COMPLETE |
| Meeting transcripts | meetingTranscripts | /api/communicator/meetings/*/transcripts | — | Real | PARTIAL (no UI) |
| Notifications | notificationQueue | /api/notifications | — | — | SCAFFOLD |
| Email sending (Resend) | — | lib/email | — | Real | COMPLETE (library) |
| WhatsApp | — | — | /admin/comunicacao/whatsapp | — | SCAFFOLD |
| Announcements | anunciacoes | /api/teams/*/anunciacao | /teams/*/anunciacao | Real | COMPLETE |

### Operations

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Enrollments | enrollments | /api/enrollments | /school/enrollments | Real | COMPLETE |
| Enrollment flow | — | /api/enrollment-flow/* | — | Real | PARTIAL |
| Family links | familyLinks | /api/family-links | — | Real | PARTIAL (no UI) |
| Contracts | contracts, contractTemplates | — | /admin/operacional/contratos | — | SCAFFOLD |
| Reception/Check-in | receptionVisits | — | /staff/checkin | — | SCAFFOLD |
| Waitlist | waitlist | /api/waitlist | — | Real | PARTIAL (no UI) |
| Makeup classes | makeupClasses | — | — | — | PLANNED |

### Continuous Improvement (Kaizen)

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Suggestions | kaizenSuggestions, kaizenVotes | /api/kaizen/suggestions | /kaizen | Real | COMPLETE |
| Feedback | — | — | /admin/kaizen/feedback | Mock | SCAFFOLD |
| NPS | — | — | /admin/kaizen/nps | Mock | SCAFFOLD |
| Retrospectives | — | — | /admin/kaizen/retrospectivas | — | SKELETON |
| Metrics | kaizenMetrics | — | — | — | PLANNED |

### Knowledge Base

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Wiki articles | wikiArticles, wikiArticleVersions | /api/wiki/articles | /wiki | Real | COMPLETE |
| Wiki categories | wikiCategories | /api/wiki/categories | /wiki/categories | Real | COMPLETE |
| Procedures | — | /api/procedures | — | Real | PARTIAL (no UI) |
| FAQ | — | — | /admin/conhecimento/faq | Real | COMPLETE |

### Support

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Tickets | supportTickets, ticketMessages | /api/tickets | /admin/suporte/tickets | Mixed | PARTIAL |

### Reports & Analytics

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Financial reports | — | /api/reports/financial | /admin/relatorios/financeiro | — | SKELETON |
| All other reports | — | — | /admin/relatorios/* (11 pages) | — | SKELETON |
| Data export | — | /api/export | /admin/relatorios/exportar | — | SCAFFOLD |

### GDPR/Compliance

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Data access | dataAccessAuditLog | /api/rights/access | — | — | SCAFFOLD |
| Data deletion | dataDeletionRequests | /api/rights/forget | — | — | SCAFFOLD |
| Data export | dataExportRequests | /api/rights/export | — | — | SCAFFOLD |
| Data portability | — | /api/rights/portability | — | — | SCAFFOLD |
| Consent management | privacyConsents | — | — | — | PLANNED |

### Student Experience

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Challenges | challenges, challengeAttempts | /api/challenges | /student/challenges | Real | PARTIAL |
| Capstones | capstoneSubmissions | /api/capstones | /student/capstone | Real | PARTIAL |
| Journal | — | /api/annotations | /student/journal | Real | COMPLETE |
| Techniques | techniqueUsage | /api/techniques | /student/techniques | Real | COMPLETE |
| Reviews | peerReviews | /api/reviews | /student/review | Real | COMPLETE |
| Graveyard | graveyardEntries | /api/graveyard | /student/graveyard | Real | COMPLETE |
| Todo | todoItems | /api/todos | /student/todo | Real | COMPLETE |
| Problems/Workshops | problemWorkshops | — | /student/problems | — | SCAFFOLD |
| Constellation | — | — | /student/constellation | Real | COMPLETE |
| Badges | badges, userBadges | — | — | — | PLANNED |

---

## 8. TOP-LEVEL STATUS SUMMARY

### By Completeness

| Status | Feature Count | Description |
|--------|--------------|-------------|
| **COMPLETE** | ~55 | Full stack working: schema + API + frontend + real data |
| **PARTIAL** | ~40 | Some layers missing (usually frontend or API gaps) |
| **SCAFFOLD** | ~25 | Structure exists but minimal implementation |
| **PLANNED** | ~80+ | Schema tables defined but zero implementation |

### Most Critical Gaps

1. **Payment Processing**: All 5 payment gateways (Stripe, Asaas, MercadoPago, PagarMe, PagSeguro) are mocked. No real payments can be processed.

2. **Reports**: All 11 report pages under `/admin/relatorios/` are empty skeletons. No reporting functionality exists.

3. **192 Unused Schema Tables**: 60% of the database schema is never touched by any code. This is either ambitious forward-planning or significant technical debt.

4. **65 Uncalled API Routes**: 26% of API routes have no frontend consumer, including complete subsystems (auditor, GDPR rights, knowledge graph, procedures).

5. **15 Empty Modules**: Every module under `src/modules/` exports only TypeScript interfaces with zero runtime logic. The intended module architecture was never populated.

6. **AI UI**: The AI chat page (`/admin/ai/chat`) uses hardcoded mock messages. The powerful backend AI system (memory, embeddings, genesis engine) has no user-facing interface.

7. **Parent Portal**: API routes for parent/child context exist (alerts, engagement, progress, recommendations, wellbeing) but none are called from the parent frontend.

---

## Appendix: File Counts

| Directory | Files |
|-----------|-------|
| src/app/api/ (route.ts) | 251 |
| src/app/ (page.tsx) | ~260 |
| src/components/ | ~50 dirs |
| src/modules/ | 15 modules (30 files, types only) |
| src/lib/ | 17 subdirectories |
| src/hooks/ | 4 files |
| src/types/ | 1 file |
| src/lib/db/schema.ts | 14,124 lines, 319 tables |
