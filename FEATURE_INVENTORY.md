# Feature Inventory — Full Codebase Audit

**Generated:** 2026-02-10
**Last Updated:** 2026-02-10 (Pass 2 — post master push `1001cf4`)
**Codebase:** intelligence-course (Next.js + Drizzle ORM + SQLite/Turso)
**Scope:** 319 schema tables, 257+ API routes, ~260 pages, 15 domain modules, 12 external integrations

---

## Changelog

### Pass 2 — `1001cf4` (Identity Rebuild + Admin Wiring + Reports)

Key commits scored: `77ccb1e` (Phase C: Wire all admin pages), `cae7aa8` (98-file mock-to-API migration), `3c50be6` (reports financial API), `ab5962d` (Identity System Nuke & Rebuild)

**What moved:**

| Change | Before | After |
|--------|--------|-------|
| Admin pages API-connected | ~60% | **96%** (141/147) |
| Mock constants in admin | 57 | **0** |
| "Em Construção" stubs | 35 | **0** |
| Report pages | ALL SKELETON | ~~SKELETON~~ → LIVE/MIXED |
| Identity model | userId-based | **personId-canonical** (236 API files migrated) |
| API routes (total) | 251 | **257+** (6 new enrollment-flow + notifications + esign webhook) |
| New integrations | — | **+E-Signature (ZapSign/D4Sign)**, **+Notification system** |
| Frontend LIVE pages | ~170 | **~230** |
| Frontend SKELETON pages | ~40 | **~10** |

**Specific items struck:**
- ~~All 11 report pages SKELETON~~ → 7 LIVE, 2 MIXED (kpis, dashboards retain some hardcoded), 2 still building
- ~~Relatórios bundle SKELETON~~ → financeiro LIVE, pedagogico LIVE, kpis MIXED, dashboards MIXED
- ~~Contábil balanco SKELETON~~ → LIVE (fetches /api/reports/financial?section=accounting)
- ~~Contábil documentos SKELETON~~ → LIVE
- ~~Contábil contador SKELETON~~ → LIVE
- ~~AI uso SKELETON~~ → LIVE (fetches /api/chat/sessions)
- ~~AI analises SKELETON~~ → LIVE
- ~~AI geradores SKELETON~~ → LIVE
- ~~Agenda salas MOCK~~ → LIVE (useApi)
- ~~Agenda recursos SKELETON~~ → LIVE
- ~~Kaizen retrospectivas SKELETON~~ → LIVE
- ~~Kaizen quadro SKELETON~~ → LIVE
- ~~RH organograma SCAFFOLD~~ → LIVE
- ~~Configurações webhooks MIXED~~ → LIVE (still has DEMO_EVENTS fallback)
- ~~Comunicação whatsapp SCAFFOLD~~ → LIVE (useApi conversions?channel=whatsapp)
- ~~/api/reports/financial uncalled~~ → Now called by /admin/relatorios/financeiro + contabil pages
- ~~Enrollment flow PARTIAL~~ → upgraded with 6 complete routes + e-sign + notifications
- ~~Notifications SCAFFOLD~~ → PARTIAL (lib/notifications.ts + used in enrollment-flow)
- ~~Cash flow SCAFFOLD~~ → LIVE (/admin/financeiro/fluxo-caixa wired)

**Still unchanged:**
- AI chat page (`/admin/ai/chat`) — still hardcoded mock messages
- Main dashboard (`/dashboard`) — still fully mock (USER, MODULES, BADGES, etc.)
- All 15 modules — still TYPES-ONLY
- All 5 payment gateways — still mocked (no SDKs)
- ~192 schema-only tables — unchanged
- ~60 uncalled API routes — mostly unchanged (minus /api/reports/financial)

---

## Executive Summary

| Metric | Count | Notes |
|--------|-------|-------|
| Schema tables | 319 | Only ~75 have any API usage |
| API routes | 257+ | ~60 have no frontend caller |
| Frontend pages | ~260 | **~230 LIVE**, ~15 MIXED, ~5 MOCK, ~10 SKELETON |
| Domain modules | 15 | **ALL 15 are types-only** — zero runtime logic |
| External integrations | 12 | 5 production, 2 partial (new), 4 partial/scaffold, 1 dead |
| Broken nav links | 0 | Navigation is clean |
| Orphaned pages | ~12 | Minor issue |

### The Big Picture

This is an ambitious education/school management ERP with ~319 database tables designed across every business domain imaginable. ~~However, the implementation pyramid is inverted: massive schema, moderate API layer, and selective frontend coverage.~~ **UPDATE**: The frontend layer has been massively wired — 96% of admin pages now connect to real APIs. The remaining gap is the **schema layer**: roughly **60% of all tables are still schema-only** — defined but never touched by any code. Identity has been rebuilt around a person-canonical model (personId replaces userId across 236 files).

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

## 2. API ROUTES AUDIT (257+ routes)

### Classification Summary

| Status | Count | % |
|--------|-------|---|
| Called by frontend | **~197** | **77%** *(was ~186)* |
| **No frontend caller** | **~60** | **23%** *(was ~65)* |

**New routes added since initial audit:**
- `/api/enrollment-flow/calculate` — Price calculation
- `/api/enrollment-flow/classes` — Available classes
- `/api/enrollment-flow/complete` — Atomic enrollment cascade (uses e-sign + notifications)
- `/api/enrollment-flow/courses` — Available courses
- `/api/enrollment-flow/persons` — Person lookup/create
- `/api/enrollment-flow/seed-template` — Contract template seeding
- `/api/notifications` — Universal notification dispatcher
- `/api/webhooks/esign` — E-signature webhook (ZapSign/D4Sign)
- `/api/teams/my-memberships` — Current user's team memberships
- `/api/procedures/seed-pipelines` — Procedure pipeline seeding

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
- ~~`/api/reports/financial`~~ ✅ **NOW CALLED** by /admin/relatorios/financeiro, contabil pages, owner/reports
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
| **LIVE** | **~230** | **85%** | Fetches real data from API *(was ~170)* |
| **MIXED** | ~15 | 6% | Real data + hardcoded fallbacks *(was ~40)* |
| **MOCK** | ~5 | 2% | All hardcoded/demo data *(was ~30)* |
| **SKELETON** | ~10 | 4% | Empty placeholder shells *(was ~40)* |

### By Section

#### Admin Panel (148 pages)
The admin panel is the most comprehensive section, organized into 15 "bundles" (departments):

| Bundle | Pages | Status | Notes |
|--------|-------|--------|-------|
| Marketing | 9 | LIVE | Analytics, campaigns, leads all wired |
| Comercial | 8 | LIVE | Pipeline, clients, followups all wired via useApi |
| Operacional | 9 | LIVE | Enrollments, students, contracts + new enrollment form |
| Pedagógico | 9 | LIVE | Courses, classes, grades wired |
| Financeiro | 9 | LIVE | ~~bank accounts MOCK~~ All wired via useApi |
| RH & Pessoas | 10 | LIVE | ~~organograma SCAFFOLD~~ All wired including org chart |
| Comunicação | 8 | LIVE | ~~WhatsApp SCAFFOLD~~ All wired including WhatsApp channel |
| Agenda | 9 | LIVE | ~~rooms MOCK; some skeleton~~ All wired via useApi |
| Relatórios | 11 | **LIVE/MIXED** | ~~ALL SKELETON~~ financeiro+pedagogico LIVE; kpis+dashboards MIXED |
| Contábil | 11 | **LIVE** | ~~many mock~~ balanco, documentos, contador all wired to /api/reports/financial |
| Conhecimento | 7 | LIVE/MIXED | Wiki LIVE; some pages have mock fallbacks |
| Assistente IA | 6 | **MIXED** | ~~MOCK/SKELETON~~ uso+analises+geradores LIVE; **chat still MOCK** |
| Kaizen | 8 | **LIVE** | ~~retrospectivas SKELETON~~ All wired including retrospectivas, quadro |
| Suporte | 3 | MIXED | Tickets partially wired |
| Configurações | 13 | LIVE | All settings + webhooks + api-keys + auditoria wired |

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
All SKELETON — blueprint, financial, products, rules, team setup wizards. *(unchanged)*

#### Main Dashboard Page
**MOCK** — The main /dashboard page still uses hardcoded demo data (USER, MODULES, BADGES, WEEKLY_ACTIVITY). *(unchanged)*

---

## 4. EXTERNAL INTEGRATIONS AUDIT (12 services)

### Integration Status

| Integration | Status | SDK Installed | Actual API Calls | Error Handling |
|-------------|--------|---------------|-----------------|----------------|
| **Clerk** (auth) | PRODUCTION | Yes | Yes | Yes — dev mode fallback, **personId-canonical** |
| **Anthropic/Claude** (AI) | PRODUCTION | Yes (@anthropic-ai/sdk@0.72.1) | Yes | Yes — APIError handling |
| **Google AI** (embeddings) | PRODUCTION | Yes (@google/generative-ai@0.24.1) | Yes | Yes — rate limiting, caching |
| **Resend** (email) | PRODUCTION | Yes (resend@6.9.1) | Yes | Yes — fallback to mock |
| **Turso/LibSQL** (database) | PRODUCTION | Yes (@libsql/client@0.17.0) | Yes | Yes — connection management |
| **ZapSign** (e-signature) | **PARTIAL** *(NEW)* | No (API calls via fetch) | Yes — API endpoint defined | Yes — webhook handler |
| **D4Sign** (e-signature backup) | **SCAFFOLD** *(NEW)* | No | Webhook handler only | Partial |
| **Stripe** (payments) | SCAFFOLD | **No** — not in package.json | Mock responses only | Partial |
| **Asaas** (BR payments) | PARTIAL | No | Mock responses only | Partial structure |
| **MercadoPago** | PARTIAL | No | Mock responses only | Partial structure |
| **PagarMe** | PARTIAL | No | Mock responses only | Partial structure |
| **PagSeguro** | PARTIAL | No | Mock responses only | Partial structure |

### E-Signature Detail *(NEW)*

New library at `src/lib/esign.ts`:
- **Primary**: ZapSign (Brazilian e-signature provider, API at `api.zapsign.com.br`)
- **Backup**: D4Sign (webhook handler ready)
- **Also supports**: in-person signing, Gov.br (planned)
- **Used by**: `/api/enrollment-flow/complete` (signs contracts during enrollment)
- **Webhook**: `/api/webhooks/esign` handles signature completion callbacks

### Notification System *(NEW)*

New library at `src/lib/notifications.ts`:
- Universal dispatcher with categories: enrollment, contract, payment, academic, etc.
- Rich metadata: priority, source tracking, action URLs, expiration
- **Used by**: `/api/enrollment-flow/complete` (sends enrollment confirmations)

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
| Cash flow | — | — | /admin/financeiro/fluxo-caixa | Real | ~~SCAFFOLD~~ **LIVE** |
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
| Org chart | orgChartPositions | — | /admin/rh/organograma | Real | ~~SCAFFOLD~~ **LIVE** (wired via fetch) |
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
| Notifications | notificationQueue | /api/notifications | — | Real | ~~SCAFFOLD~~ **PARTIAL** (lib + API + used in enrollment flow, no UI) |
| Email sending (Resend) | — | lib/email | — | Real | COMPLETE (library) |
| WhatsApp | — | /api/communicator/conversations?channel=whatsapp | /admin/comunicacao/whatsapp | Real | ~~SCAFFOLD~~ **LIVE** (wired via useApi) |
| Announcements | anunciacoes | /api/teams/*/anunciacao | /teams/*/anunciacao | Real | COMPLETE |

### Operations

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Enrollments | enrollments | /api/enrollments | /school/enrollments | Real | COMPLETE |
| Enrollment flow | enrollments, contracts, familyLinks | /api/enrollment-flow/* (6 routes) | /admin/operacional/matriculas/nova | Real | ~~PARTIAL~~ **COMPLETE** — atomic cascade with e-sign + notifications |
| Family links | familyLinks | /api/family-links | /api/enrollment-flow/complete | Real | ~~PARTIAL~~ **COMPLETE** (created during enrollment) |
| Contracts | contracts, contractTemplates | /api/enrollment-flow/complete | /admin/operacional/contratos | Real | ~~SCAFFOLD~~ **PARTIAL** (created via enrollment, no standalone CRUD UI) |
| Reception/Check-in | receptionVisits | — | /staff/checkin | Real | ~~SCAFFOLD~~ **LIVE** (wired via useApi) |
| Waitlist | waitlist | /api/waitlist | — | Real | PARTIAL (no UI) |
| Makeup classes | makeupClasses | — | — | — | PLANNED |

### Continuous Improvement (Kaizen)

| Feature | Schema | API | Frontend | Data | Status |
|---------|--------|-----|----------|------|--------|
| Suggestions | kaizenSuggestions, kaizenVotes | /api/kaizen/suggestions | /kaizen | Real | COMPLETE |
| Feedback | — | — | /admin/kaizen/feedback | Real | ~~SCAFFOLD~~ **LIVE** (wired via useApi) |
| NPS | — | — | /admin/kaizen/nps | Real | ~~SCAFFOLD~~ **LIVE** (wired via useApi) |
| Retrospectives | — | — | /admin/kaizen/retrospectivas | Real | ~~SKELETON~~ **LIVE** (wired via fetch) |
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
| Financial reports | invoices, journalEntries, chartOfAccounts, persons | /api/reports/financial | /admin/relatorios/financeiro | Real | ~~SKELETON~~ **COMPLETE** — revenue by course, payment methods, defaulters, teacher analysis |
| Accounting reports | journalEntryLines, chartOfAccounts | /api/reports/financial?section=accounting | /admin/contabil/balancete, dre, balanco | Real | ~~SKELETON~~ **COMPLETE** — balancete, DRE, balanço patrimonial |
| Pedagogical reports | classes, enrollments | fetched directly | /admin/relatorios/pedagogico | Real | ~~SKELETON~~ **LIVE** |
| KPI dashboards | — | /api/reports/financial | /admin/relatorios/kpis, /admin/relatorios/dashboards | Mixed | ~~SKELETON~~ **MIXED** (API + hardcoded kpiData fallback) |
| Other reports | — | — | /admin/relatorios/comercial, rh, personalizado, agendados | Real | ~~SKELETON~~ **LIVE** (wired via useApi) |
| Data export | — | /api/export | /admin/relatorios/exportar | Real | ~~SCAFFOLD~~ **LIVE** (wired) |

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
| **COMPLETE** | **~65** *(was ~55)* | Full stack working: schema + API + frontend + real data |
| **PARTIAL** | **~35** *(was ~40)* | Some layers missing (usually frontend or API gaps) |
| **SCAFFOLD** | **~15** *(was ~25)* | Structure exists but minimal implementation |
| **PLANNED** | ~80+ | Schema tables defined but zero implementation |

### Most Critical Gaps (Updated)

1. **Payment Processing**: All 5 payment gateways (Stripe, Asaas, MercadoPago, PagarMe, PagSeguro) are mocked. No real payments can be processed. *(unchanged)*

2. ~~**Reports**: All 11 report pages under `/admin/relatorios/` are empty skeletons. No reporting functionality exists.~~ ✅ **RESOLVED** — Financial reports now fully functional (revenue by course, payment methods, defaulters, teacher analysis, accounting: balancete/DRE/balanço). Most report pages wired to APIs.

3. **192 Unused Schema Tables**: 60% of the database schema is never touched by any code. *(unchanged)*

4. **~60 Uncalled API Routes**: 23% of API routes have no frontend consumer, including complete subsystems (auditor, GDPR rights, knowledge graph, procedures). *(slightly improved — /api/reports/financial now called)*

5. **15 Empty Modules**: Every module under `src/modules/` exports only TypeScript interfaces with zero runtime logic. *(unchanged)*

6. **AI UI**: The AI chat page (`/admin/ai/chat`) still uses hardcoded mock messages. Other AI admin pages (uso, analises, geradores) are now LIVE. *(partially improved)*

7. **Parent Portal**: API routes for parent/child context exist but none are called from the parent frontend. *(unchanged)*

8. **Main Dashboard**: The `/dashboard` student landing page still uses fully hardcoded mock data (USER, MODULES, BADGES, WEEKLY_ACTIVITY). *(unchanged — new finding)*

---

## Appendix: File Counts

| Directory | Files |
|-----------|-------|
| src/app/api/ (route.ts) | **257+** *(was 251)* |
| src/app/ (page.tsx) | ~260 |
| src/components/ | ~50 dirs |
| src/modules/ | 15 modules (30 files, types only) |
| src/lib/ | **19 subdirectories** *(was 17 — added genesis/, esign.ts, notifications.ts)* |
| src/hooks/ | 4 files |
| src/types/ | **2 files** *(added domain.ts)* |
| src/lib/db/schema.ts | **~15,400 lines** *(was 14,124)*, 319 tables |

### Identity Architecture *(NEW)*

```
Clerk Session → clerkUserId
    ↓
users table → bridges clerkUserId → personId
    ↓
persons table → CANONICAL IDENTITY (all 236 API files use this)
    ↓
organizationMemberships → roles per org (multi-tenant)
```

- **236 API files** use `personId` (new canonical)
- **4 API files** still use legacy `userId` (communicator/contacts, meetings, permissions, user-overrides)
