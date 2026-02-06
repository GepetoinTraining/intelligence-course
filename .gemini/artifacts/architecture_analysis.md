# Intelligence Course - Architecture Analysis

## Executive Summary

This document analyzes the current architecture of the Intelligence Course platform to answer:
1. Should we modularize differently?
2. Are there duplicated models/data across modules?
3. Can we normalize them?
4. Business Model Canvas-style process map

---

## Current Domain Structure (Schema Analysis)

The database schema (5,933 lines, 150+ tables) is organized into these sections:

### 1. IDENTITY & AUTH (Core)
- `organizations`, `users`, `userApiKeys`

### 2. CURRICULUM STRUCTURE (Education Core)
- `courses`, `modules`, `lessons`, `tasks`
- `courseTypes`, `levels`, `terms`

### 3. PROMPTS SYSTEM (AI Literacy)
- `prompts`, `promptDeltas`, `promptRuns`
- `aiProviders`

### 4. STUDENT TOOLBOX (10 subsections)
- Prompt Library (`studentPrompts`)
- Run Journal (`runAnnotations`)
- Character Graveyard (`graveyardEntries`)
- Technique Tracker (`techniqueUsage`)
- To-Do Cube (`todoItems`)
- Problem Workshop (`problemWorkshops`)
- Capstone Submissions (`capstoneSubmissions`, `peerReviews`)
- Challenge Board (`challenges`, `challengeAttempts`)
- Knowledge Graph (`knowledgeNodes`, `knowledgeEdges`)
- Badges & Achievements (`badges`, `userBadges`)

### 5. FINANCIAL (Complex, Multi-section)
- Teacher Profiles (`teacherProfiles`)
- Course Pricing (`coursePricing`)
- School Services (`schoolServices`)
- Invoices (`invoices`, `invoiceItems`)
- Transactions (`transactions`)
- Teacher Payouts (`teacherPayouts`)
- Payables (`payables`)
- Products (`products`)
- Discounts (`discounts`)
- Teacher Contracts (`teacherContracts`)
- Bank Accounts (`bankAccounts`)

### 6. ACCOUNTING (Brazilian Lucro Real)
- Chart of Accounts (`chartOfAccounts`)
- Cost Centers (`costCenters`)
- Journal Entries (`journalEntries`, `journalEntryLines`)
- Fiscal Documents (`fiscalDocuments`, `fiscalTaxWithholdings`, `fiscalTransactions`, `fiscalTransactionDocuments`)

### 7. HR & PAYROLL
- Staff Contracts (`staffContracts`)
- Staff Leave (`staffLeave`)
- Staff Payroll (`staffPayroll`)
- Payment Methods (`paymentMethods`)
- Payroll Payments (`payrollPayments`)

### 8. SCHOOL OPERATIONS
- Rooms (`rooms`)
- Terms (`terms`)
- Classes (`classes`)
- Schedules (`schedules`, `scheduleExceptions`)
- Class Sessions & Attendance (`classSessions`, `attendance`)
- Placement Tests (`placementTests`, `placementResults`)

### 9. CRM & SALES
- Leads (`leads`, `leadInteractions`, `leadCourseInterests`, `leadFunnelHistory`, `leadInsights`, `leadPersonas`, `leadSentimentHistory`)
- Trials (`trialClasses`)
- Enrollments (`enrollments`)
- Referrals (`referrals`)
- Waitlist (`waitlist`)
- Audit Log (`crmAuditLog`, `crmStageHistory`)

### 10. SCRM (Relationship Intelligence) 
- Family Links (`familyLinks`)
- Insights (`insightCommunications`)
- Stakeholder Lifecycles (`stakeholderLifecycles`)
- Wellbeing Snapshots (`wellbeingSnapshots`)

### 11. MARKETING
- Campaigns (`campaigns`, `campaignLeads`)
- Email Templates (`emailTemplates`)
- Communication Templates (`communicationTemplates`)

### 12. COMMUNICATOR (Messaging)
- Conversations (`conversations`, `conversationParticipants`)
- Messages (`messages`, `messageAttachments`, `messageReadReceipts`)
- Typing Indicators (`typingIndicators`)
- Chat Sessions (`chatSessions`, `chatMessages`)

### 13. AI MEMORY (D4-D6)
- Memory Graphs (`memoryGraphs`)
- Memory Nodes (`memoryNodes`)
- Memory Edges (`memoryEdges`)
- Memory Ledger (`memoryLedger`)
- Memory Contradictions (`memoryContradictions`)
- Memory Audit Log (`memoryAuditLog`)
- Memory Integrity Hashes (`memoryIntegrityHashes`)
- Student World Overlay (`studentWorldOverlay`)

### 14. AI SUMMARIES & SAFETY
- AI Summaries (`aiSummaries`)
- Safety Alerts (`safetyAlerts`, `alertAcknowledgments`)

### 15. WIKI / KNOWLEDGE BASE
- Wiki Articles (`wikiArticles`, `wikiArticleVersions`, `wikiArticleFeedback`)
- Wiki Categories (`wikiCategories`)

### 16. KAIZEN (Continuous Improvement)
- Suggestions (`kaizenSuggestions`, `kaizenComments`, `kaizenVotes`, `kaizenMetrics`)

### 17. MEETINGS
- Meetings (`meetings`, `meetingParticipants`, `meetingNotes`, `meetingTranscripts`, `meetingTemplates`)

### 18. PROCEDURES (SOPs)
- Templates (`procedureTemplates`)
- Steps (`procedureSteps`)
- Transitions (`procedureTransitions`)
- Executions (`procedureExecutions`, `stepExecutions`)
- Analytics (`procedureAnalytics`)

### 19. ACTION ITEMS
- Items (`actionItems`, `actionItemComments`)
- Types (`actionItemTypes`)

### 20. LATTICE HR (Talent Topology)
- Evidence (`latticeEvidence`)
- Skill Definitions (`latticeSkillDefinitions`, `latticeSkillAssessments`)
- Projections (`latticeProjections`, `latticeProjectionResults`)
- Shares (`latticeShares`)
- Talent Profiles (`talentProfiles`)
- Gap Interviews (`talentGapInterviews`)
- Evidence Documents (`talentEvidenceDocuments`)

### 21. NOTIFICATIONS
- Queue (`notificationQueue`)

### 22. PERMISSIONS (Granular RAM)
- Roles (`organizationalRoles`, `roleRelationships`, `rolePermissions`)
- Teams (`teams`, `teamPositions`, `teamMembers`)
- Actions (`actionTypes`)
- Position Permissions (`positionPermissions`)
- User Overrides (`userPermissionOverrides`)
- Groups (`permissionGroups`, `permissionGroupActions`, `userGroupAssignments`)
- Audit Log (`permissionAuditLog`)

### 23. NOTES & ACTIVITIES
- Notes (`notes`)
- Activity Feed (`activityFeed`)

---

## 🔴 DUPLICATIONS & NORMALIZATION ISSUES

### Issue 1: Multiple "Knowledge Graph" Systems

| System | Tables | Purpose |
|--------|--------|---------|
| Student Toolbox Knowledge Graph | `knowledgeNodes`, `knowledgeEdges` | Personal constellation learning |
| AI Memory Graph | `memoryNodes`, `memoryEdges` | AI companion memory |
| Lattice HR Evidence | `latticeEvidence`, `latticeSkillAssessments` | Talent topology |

**Problem**: Three separate graph implementations with similar node/edge patterns.
**Recommendation**: Create a **unified graph substrate** with `type` discriminators.

### Issue 2: Multiple "Chat" Systems

| System | Tables | Purpose |
|--------|--------|---------|
| Communicator | `conversations`, `messages` | Parent-teacher messaging |
| Chat Sessions | `chatSessions`, `chatMessages` | AI playground |
| AI Memory Sessions | `memorySessions` (in-memory) | D4 session tracking |

**Problem**: Three messaging systems with overlapping features.
**Recommendation**: Consolidate into single `conversations` + `messages` with `type` field.

### Issue 3: Audit Logs Scattered

| Log | Table | Purpose |
|-----|-------|---------|
| CRM Audit | `crmAuditLog` | Lead changes |
| Permission Audit | `permissionAuditLog` | Permission changes |
| Memory Audit | `memoryAuditLog` | AI memory changes |

**Recommendation**: Consider unified `auditLog` with `domain` discriminator.

### Issue 4: User/Person Concepts Split

| Concept | Tables |
|---------|--------|
| Users | `users` |
| Leads | `leads` |
| Contacts | `leadPersonas` |
| Family | `familyLinks` |
| Teachers | `teacherProfiles` |
| Staff | `staffContracts` |
| Talent | `talentProfiles` |

**Problem**: A person can be multiple things (parent + lead + staff).
**Recommendation**: Consider `persons` table with role junction tables.

### Issue 5: Financial Account Fragmentation

Multiple places track financial identity:
- `teacherProfiles.pixKey`
- `paymentMethods.pixKey`
- `bankAccounts.pixKey`

**Recommendation**: Normalize to `bankAccounts` with polymorphic owner.

---

## ✅ Business Model Canvas Process Map

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           INTELLIGENCE COURSE PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        🎓 FRONTEND (School)                                  │   │
│  │                                                                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │  │   Student   │  │   Teacher   │  │   Parent    │  │   Public    │         │   │
│  │  │   Portal    │  │   Portal    │  │   Portal    │  │   (Careers) │         │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤         │   │
│  │  │ • Toolbox   │  │ • Classes   │  │ • Progress  │  │ • Jobs      │         │   │
│  │  │ • Prompts   │  │ • Grading   │  │ • Invoices  │  │ • Apply     │         │   │
│  │  │ • Progress  │  │ • Students  │  │ • Messages  │  │ • Talent    │         │   │
│  │  │ • Companion │  │ • Content   │  │ • Wellbeing │  │             │         │   │
│  │  │ • Capstones │  │ • Calendar  │  │             │  │             │         │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │   │
│  │                                                                              │   │
│  │  📊 Domains:                                                                 │   │
│  │  • CURRICULUM (courses, modules, lessons, tasks)                             │   │
│  │  • STUDENT TOOLBOX (prompts, graveyard, challenges, knowledge graph)        │   │
│  │  • PROGRESS (attendance, grades, capstones)                                  │   │
│  │  • AI COMPANION (memory system, auditor, student rights)                     │   │
│  │  • COMMUNICATOR (parent-school messaging)                                    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                            │
│                                        ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        🏢 MIDDLEWARE (Operations)                           │   │
│  │                                                                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │  │   Staff     │  │   Owner     │  │   Market-   │  │   Accoun-   │         │   │
│  │  │   Portal    │  │   Dashboard │  │     ing     │  │     tant    │         │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤         │   │
│  │  │ • CRM       │  │ • Analytics │  │ • Campaigns │  │ • DRE       │         │   │
│  │  │ • Enrolls   │  │ • Settings  │  │ • Leads     │  │ • Balance   │         │   │
│  │  │ • Invoicing │  │ • Teams     │  │ • A/B Test  │  │ • SPED      │         │   │
│  │  │ • Payments  │  │ • Roles     │  │ • Funnel    │  │ • DIRF      │         │   │
│  │  │ • Calendar  │  │ • Payroll   │  │ • Email     │  │ • Taxes     │         │   │
│  │  │ • Meetings  │  │ • HR        │  │ • UTM       │  │             │         │   │
│  │  │ • Kaizen    │  │ • Lattice   │  │             │  │             │         │   │
│  │  │ • SOPs      │  │             │  │             │  │             │         │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │   │
│  │                                                                              │   │
│  │  📊 Domains:                                                                 │   │
│  │  • CRM/SCRM (leads, interactions, insights, funnel)                         │   │
│  │  • FINANCIAL (invoices, payments, payouts, payables)                        │   │
│  │  • ACCOUNTING (chart of accounts, journal entries, fiscal)                  │   │
│  │  • HR/PAYROLL (contracts, leave, payroll, methods)                          │   │
│  │  • SCHOOL OPS (rooms, schedules, terms, placements)                         │   │
│  │  • KAIZEN (suggestions, procedures, action items)                           │   │
│  │  • MARKETING (campaigns, templates, UTM tracking)                           │   │
│  │  • PERMISSIONS (RAM, roles, teams, delegation)                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                            │
│                                        ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        🔧 BACKEND (Platform)                                │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                          Core Services                               │    │   │
│  │  │                                                                      │    │   │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐         │    │   │
│  │  │  │   Auth    │  │    DB     │  │  Embedder │  │  Payments │         │    │   │
│  │  │  │  (Clerk)  │  │ (SQLite+  │  │ (Gemini)  │  │   Multi-  │         │    │   │
│  │  │  │           │  │  Drizzle) │  │           │  │  Provider │         │    │   │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘         │    │   │
│  │  │                                                                      │    │   │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐         │    │   │
│  │  │  │   AI LLM  │  │  Memory   │  │  Auditor  │  │  Student  │         │    │   │
│  │  │  │(Anthropic)│  │ Topology  │  │   D5      │  │  Rights   │         │    │   │
│  │  │  │           │  │   D4      │  │           │  │   D6      │         │    │   │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘         │    │   │
│  │  │                                                                      │    │   │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐         │    │   │
│  │  │  │  Export   │  │  Fiscal   │  │  Notif.   │  │  Crypto   │         │    │   │
│  │  │  │  Engine   │  │  Brazil   │  │   Queue   │  │  (LGPD)   │         │    │   │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘         │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                              │   │
│  │  📊 Domains:                                                                 │   │
│  │  • IDENTITY (organizations, users, API keys)                                │   │
│  │  • AI PROVIDERS (models, configuration)                                     │   │
│  │  • AI MEMORY (graphs, nodes, edges, ledger)                                 │   │
│  │  • LATTICE HR (evidence, projections, skill topology)                       │   │
│  │  • WIKI (knowledge base articles)                                           │   │
│  │  • NOTIFICATIONS (queue, delivery)                                          │   │
│  │  • ACTIVITY (feed, audit trails)                                            │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                     🔄 POST-SALE & RETENTION                                │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                       Retention Engine                               │    │   │
│  │  │                                                                      │    │   │
│  │  │  • AI Companion: Memory-aware conversations (D4)                     │    │   │
│  │  │  • Wellbeing Monitoring: Auditor flags + parent reports (D5)         │    │   │
│  │  │  • Progress Tracking: Gamification (badges, challenges)              │    │   │
│  │  │  • Parent Engagement: SCRM insights + communicator                   │    │   │
│  │  │  • Referral Program: Incentivized word-of-mouth                      │    │   │
│  │  │  • Re-enrollment: Term management + waitlist                         │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                       Expansion Revenue                              │    │   │
│  │  │                                                                      │    │   │
│  │  │  • Course Upsell: Level progression → new enrollments                │    │   │
│  │  │  • Family Expansion: Sibling enrollments via familyLinks             │    │   │
│  │  │  • Material Sales: Products + books                                  │    │   │
│  │  │  • Teacher Services: External teacher platform fees                  │    │   │
│  │  │  • Talent Placement: Careers portal matching fees                    │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Recommended Module Restructure

Based on the analysis, I recommend reorganizing into **7 bounded contexts**:

### 1. **IDENTITY** (Core)
Tables: `organizations`, `users`, `userApiKeys`, `persons` (new)
Files: `src/lib/auth`, `src/lib/permissions`

### 2. **CURRICULUM** (Education)
Tables: courses → tasks, progress, prompts, toolbox
Files: `src/lib/curriculum`

### 3. **FINANCE** (Money)
Tables: invoices, transactions, payables, payroll, chart of accounts
Files: `src/lib/financial` (merge with `src/lib/payments`)

### 4. **OPERATIONS** (School)
Tables: rooms, schedules, classes, attendance, terms
Files: `src/lib/operations`

### 5. **COMMERCIAL** (Sales + Marketing)
Tables: leads, CRM, campaigns, referrals, enrollments
Files: `src/lib/commercial` (merge CRM + Marketing)

### 6. **AI COMPANION** (D4-D6)
Tables: memory*, auditor, studentRights
Files: `src/lib/ai` ✅ (already organized)

### 7. **LATTICE HR** (Talent)
Tables: lattice*, talent*, careers*
Files: `src/lib/lattice` ✅ (already organized)

### Cross-cutting:
- **COMMUNICATION**: conversations, messages (used by all)
- **NOTIFICATIONS**: queues, delivery
- **WIKI**: knowledge base
- **KAIZEN**: improvement system

---

## Next Steps

1. **Create normalized `persons` table** to unify user concepts
2. **Merge chat systems** into single `conversations` + `messages`
3. **Consolidate audit logs** with domain discriminator
4. **Split schema.ts** into domain-specific schema files
5. **Update checklist** with new organizational structure
