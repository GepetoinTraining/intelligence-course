# Node Zero - Development Checklists

> Last updated: 2026-02-05

---

## 🏗️ v0.1 ARCHITECTURE (Launch Day)

### ✅ Person Normalization (COMPLETED)

The identity system has been normalized to support multi-role persons:

```
persons (canonical identity)
    ├── users (Clerk auth link)
    ├── personContacts (multiple emails/phones)
    ├── personLattice (skill/value topology from AI interview)
    └── personBankAccounts (for payouts)

Role Junction Tables:
    ├── studentRoles (enrolled students)
    ├── parentRoles (guardian → student relationships)
    ├── teacherRoles (instructors)
    ├── staffRoles (employees - full CLT/PJ compensation)
    ├── leadRoles (CRM prospects)
    └── ownerRoles (organization owners)
```

### ✅ Multi-Tenant Foundation (COMPLETED)

Organizations with platform/school hierarchy:

```
NodeZero (Platform) ← Dev team, manages all schools
    └── Schools (Tenants) ← Customers
        ├── Intelligence Course (your school)
        ├── Future School B
        └── ...
```

**Schema Added:**
- `organizations` - Full tenant entity with branding, legal (CNPJ), SaaS plan, limits
- `organizationMemberships` - Links persons to orgs with roles

**URL Structure:**
- `/` - Platform landing
- `/[orgSlug]/` - School public pages
- `/[orgSlug]/portal/...` - Protected dashboards


**Key Features:**
- ✅ Same person can be parent + teacher + staff
- ✅ Lead conversion tracked (leadRoles → studentRoles/parentRoles)
- ✅ Everyone gets Lattice interview on first AI conversation
- ✅ Full CLT compensation (FGTS, INSS, IRRF, 13th, vacation, benefits)
- ✅ PJ alternative structure (CNPJ, ISS retention)
- ✅ Person bank accounts normalized (no more duplication)
- ✅ **Cargo de Confiança (CLT Art. 62):** 40% gratificação, journey exempt, 90-day leadership trial, 2 mandatory feedback meetings
- ✅ **Dissídio tracking:** Annual obligatory raises with category codes
- ✅ **SCRM 3x3 Insights for Staff:** Dreams, Hobbies, Aspirations for turnover prediction
- ✅ **Staff retention metrics:** Turnover risk, engagement score, sentiment history
- ✅ **Training records:** Linked to aspirations for retention analysis

**Schema Changes:**
- Added `persons` table as canonical identity
- Added `personContacts` for multiple contact methods
- Added `personLattice` for universal skill mapping
- Added `personBankAccounts` for payout accounts
- Added role junction tables (studentRoles, parentRoles, etc.)
- Enhanced `staffRoles` with full CLT/PJ compensation + cargo de confiança
- Added `staffSalaryHistory` for all raises including dissídio
- Added `staffSentimentHistory` for emotional trajectory (SCRM-style)
- Added `staffInsightCommunications` for dream/hobby/aspiration conversations
- Added `staffTrainingRecords` linked to aspirations
- `users.role` deprecated → use role junction tables
- `users.personId` links to canonical identity
- `users.latticeInterviewPending` flags first-chat interview

### ✅ Lattice Interview System (COMPLETED)

**Flow:**
1. New user signs up → `users.latticeInterviewPending = 1`
2. First AI conversation → detects pending interview
3. Synapse uses `LATTICE_INTERVIEW_SYSTEM_PROMPT` instead of normal prompt
4. Conducts natural conversation to discover:
   - Dreams (3 - future-pull)
   - Hobbies (3 - present-choice)
   - Aspirations (3 - identity-vector)
   - Skills (from 45-skill framework)
   - Communication style (analytical/expressive/driver/amiable)
   - Learning style (visual/auditory/kinesthetic/reading)
5. AI calls `complete_lattice_interview` tool when ready
6. Creates `personLattice` record → enables talent matching
7. Clears `latticeInterviewPending` → normal AI mode

**Files:**
- `src/lib/ai/lattice-interview.ts` - Interview system
- `src/app/api/communicator/conversations/[id]/messages/route.ts` - Integration


## 📋 TO CODE LIST

Everything that needs to be built from scratch or completed.

---

### A. STUDENT EXPERIENCE

#### A1. Student Toolbox Pages (Remaining)

- [x] **Technique Tracker** `/student/techniques` ✅
  - [x] Mastery bars per technique (orbit, slingshot, black_hole, constellation)
  - [x] Usage history chart
  - [x] Drill-down into technique details
  - [x] Badge progress for each technique

- [x] **To-Do Cube** `/student/todo` ✅
  - [x] Phase 1: 2D Eisenhower grid (urgent/important)
  - [x] Phase 2: 3D cube with depth axis (R3F) - effort dimension
  - [x] Interactive task spheres with hover labels
  - [x] Orbit controls for 3D navigation
  - [x] Toggle between 2D/3D views
  - [ ] Phase 3: 4D with time dimension (future)
  - [x] Progressive unlock based on module completion
  - [x] Integration with lesson tasks

- [x] **Knowledge Constellation** `/student/constellation` ✅
  - [x] R3F 3D scene setup with stars background
  - [x] Node rendering (animated spheres with labels)
  - [x] Edge rendering (curved lines)
  - [x] Camera controls (orbit, zoom, auto-rotate)
  - [x] Node creation from insights
  - [x] Edge creation by linking nodes
  - [x] Search/filter nodes
  - [x] Module-colored clusters

- [x] **Problem Workshop** `/student/workshop` ✅
  - [x] 6-step wizard UI
  - [x] Step 1: Problem capture (free text)
  - [x] Step 2: 5 Whys drill-down
  - [x] Step 3: Root cause identification
  - [x] Step 4: Sign definition (what would solved look like?)
  - [x] Step 5: First action definition
  - [x] Step 6: Review & save
  - [ ] AI assistant for each step

- [x] **Challenge Board** `/student/challenges` ✅
  - [x] Browse challenges from classmates
  - [x] Create new challenge
  - [x] Attempt challenge flow
  - [x] Voting on best solutions
  - [x] Leaderboard

- [x] **Capstone Page** `/student/capstone` ✅
  - [x] Module-based submission cards
  - [x] 3-step submission flow (description, self-assessment, reflection)
  - [x] Self-assessment rubric with star ratings
  - [x] Optional reflection/feedback (encouraged)
  - [x] Status tracking (draft, submitted, graded)
  - [x] View final grade breakdown (self/teacher/peer)

- [x] **Peer Review Page** `/student/review` ✅
  - [x] Anonymized peer submissions
  - [x] Rubric-based scoring with guiding questions
  - [x] Optional written feedback (encouraged with positive messaging)
  - [x] Progress tracking
  - [x] View submitted reviews

#### A2. Student Dashboard Enhancements ✅

- [x] Next lesson CTA with progress ring
- [x] Weekly streak visualization (7-day grid with flame icons)
- [x] XP/points display (ring progress, level system)
- [x] Recent badges carousel (tooltips, icons)
- [x] Upcoming deadlines widget (color-coded by urgency)
- [x] Toolbox quick access grid
- [x] Module progress cards with ring progress

#### A3. Lesson Viewer Enhancements ✅

- [x] Task completion checkmarks (with local storage persistence)
- [x] Auto-save prompt drafts (debounced auto-save)
- [x] Side-by-side playground mode
- [x] Print-friendly view for QR code handoff
- [x] Progress bar with points tracking
- [ ] MDX content rendering (future)

---

### B. PARENT EXPERIENCE

#### B1. Parent Dashboard Enhancements ✅

- [x] Progress/grades tabs per child
- [x] Ring progress for module completion
- [x] Upcoming deadlines with urgency colors
- [x] XP/Streak/Badge quick stats
- [x] Direct message to teacher button
- [x] Report card modal with PDF download
- [x] Quick action cards (Financial, Messages, Calendar, Notices)
- [x] Attendance calendar per child

#### B2. Financial Portal `/parent/billing` ✅

- [x] Invoice list with status
- [x] Pending invoices highlight
- [x] Payment modal (PIX, Card, Boleto, Cash)
- [x] Invoice PDF preview modal
- [x] Invoice PDF download
- [x] Auto-pay enrollment toggle
- [x] Email send option
- [x] Payment history export

---

### C. TEACHER EXPERIENCE

#### C1. Teacher Dashboard `/teacher` ✅

- [x] Today's schedule view
- [x] Quick attendance entry (in-line badges)
- [x] Class roster with avatars
- [x] Progress heatmap per class
- [x] Message parents/students

#### C2. Attendance Page `/teacher/attendance` ✅

- [x] Session selector (today's sessions)
- [x] Student list with quick status buttons
- [x] Late arrival time entry
- [x] Excuse reason input
- [x] Bulk mark present
- [x] Session notes (per student)

#### C3. Gradebook Page `/teacher/grades` ✅

- [x] Class selector
- [x] Assignment/capstone list
- [x] 360° grading methodology (Self:1 + Teacher:2 + Peers:1)
- [x] Rubric-based grade entry with star ratings
- [x] Weighted final score calculation
- [x] Grade export (CSV/PDF)
- [x] Progress report generation

#### C4. Student Detail `/teacher/student/[id]` ✅

- [x] Progress timeline (activity)
- [x] Attendance history (visual grid)
- [x] Grades history
- [x] Parent contact info
- [x] Notes/flags

---

### D. STAFF EXPERIENCE

#### D1. Staff Dashboard `/staff` ✅

- [x] Lead pipeline overview (funnel chart)
- [x] Today's trials
- [x] Pending follow-ups
- [x] Recent lead activity feed
- [x] Quick stats (new leads, conversions)

#### D2. Lead Pipeline `/staff/leads` ✅

- [x] Kanban board view (new → contacted → qualified → enrolled)
- [x] Lead cards with key info
- [x] Drag-and-drop status change (native HTML5 DnD)
- [x] Filter by source, assignee, date
- [x] Bulk actions (assign, tag, delete with multi-select)

#### D3. Lead Detail `/staff/leads/[id]` ✅

- [x] Contact info display/edit
- [x] Interaction timeline
- [x] Add interaction (call, email, WhatsApp, note)
- [x] Schedule trial modal
- [x] Convert to student modal
- [x] Referral tracking (referrer info, credit status, chain visualization)

#### D4. Trial Management `/staff/trials` ✅

- [x] List view by date (today/upcoming/past)
- [x] Trial cards with key info
- [x] Record outcome modal
- [x] Calendar view (monthly overview with color-coded events)
- [x] No-show follow-up workflow (dedicated tab, action modal, tracking)

#### D5. Front Desk `/staff/checkin` ✅

- [x] Today's sessions list
- [x] Student search
- [x] Quick check-in button
- [x] Walk-in lead capture form (modal)

---

### E. SCHOOL ADMIN EXPERIENCE

#### E1. Admin Dashboard Enhancements ✅

- [x] Revenue breakdown chart (by course type with colored bars)
- [x] Enrollment trends chart (6-month bar chart with net growth)
- [x] Campaign ROI summary (table with leads, conversions, revenue, ROI %)
- [x] Teacher workload distribution (progress bars with utilization %)
- [x] Room utilization heatmap (progress bars with booking stats)

#### E1.5. Curriculum Management (NEW) ✅

- [x] **Course Builder** `/school/courses` ✅
  - [x] Course list with demographic targets
  - [x] Course CRUD with audience selection (age groups, skill levels)
  - [x] Pricing tiers per demographic
  - [x] Status management (draft/active/archived)

- [x] **Module Builder** `/school/modules` ✅
  - [x] Modules grouped by course
  - [x] Learning objectives definition
  - [x] Module ordering (up/down)
  - [x] Duration estimates
  - [x] Status management (draft/published)

- [x] **Lesson Editor** `/school/lessons` ✅
  - [x] Lessons grouped by module
  - [x] Activity builder (prompts, exercises, discussions, quizzes, reflections)
  - [x] AI integration toggles per activity
  - [x] Duration and prerequisite settings
  - [x] Status management (draft/published)

#### E2. Room Management `/school/rooms` ✅

- [x] Room list with capacity, amenities
- [x] Room CRUD modal
- [x] Room schedule view (via Schedule Builder)
- [x] Conflict detection (via Schedule Builder)

#### E3. Schedule Builder `/school/schedules` ✅

- [x] Weekly calendar grid (visual time slots)
- [x] Click-to-create time slots
- [x] Room assignment
- [x] Teacher assignment
- [x] Class/turma selector
- [x] Conflict detection (teacher & room overlaps)
- [x] Conflict warnings (visual + list)
- [x] Filter by class/teacher/room
- [x] Slot editing & deletion
- [x] Color-coded by class
- [x] Statistics (total classes, hours/week)

#### E4. Term Management `/school/terms` ✅

- [x] Term list (past, current, future)
- [x] Term CRUD form
- [x] Set current term
- [x] Enrollment window management

#### E5. Class Management `/school/classes` ✅

- [x] Class list with filters
- [x] Class CRUD form
- [x] Assign teacher
- [x] View enrolled students
- [x] Capacity indicator

#### E6. Teacher Management `/school/teachers` ✅

- [x] Teacher list with stats
- [x] Contract details view
- [x] Hours worked this month
- [x] Edit contract
- [x] Payout history

#### E7. Enrollment Management `/school/enrollments` ✅

- [x] Enrollment list with filters
- [x] Enrollment CRUD
- [x] Transfer student flow
- [x] Drop student flow
- [x] Waitlist management

#### E8. Discount/Promo Management `/school/discounts` ✅

- [x] Discount list
- [x] Create discount modal
- [x] Usage tracking
- [x] Expiration warnings

#### E9. Product Catalog `/school/products` ✅

- [x] Product list (tuition, materials, etc.)
- [x] Product CRUD form
- [x] Link to course/level
- [x] Pricing tiers (monthly, semestral, annual with features)

---

### F. CRM / MARKETING

#### F1. Campaign Builder `/marketing/campaigns` ✅

- [x] Campaign list with status
- [x] Campaign CRUD wizard
- [x] Goal setting
- [x] Channel selection (Email, WhatsApp, Instagram, Facebook, Referral)
- [x] Audience targeting (demographics from course setup)
- [x] Budget tracking (ring progress, spent vs budget)
- [x] Performance dashboard (impressions, clicks, leads, conversions)
- [x] Multi-step wizard creation flow
- [x] Campaign status management (draft/active/paused/completed)

#### F2. Email Templates `/marketing/templates` ✅

- [x] Template list with categories
- [x] Template editor with variable panel
- [x] Variable insertion (copy-to-clipboard)
- [x] Preview mode with example data
- [x] Usage tracking (send count, last used)

#### F3. Referral Program `/marketing/referrals` ✅

- [x] Active referrers list
- [x] Referral stats (leads, conversions, rates)
- [x] Tier system (Bronze/Silver/Gold/Platinum)
- [x] Top referrers leaderboard
- [x] Reward tracking (pending/paid)
- [x] Payout management

#### F4. Lead Capture Form `/form/[slug]` ✅

- [x] Dynamic form component per course type
- [x] Configurable fields (age, job, parent, etc.)
- [x] Course-specific branding (gradients, badges)
- [x] Consent checkbox
- [x] Success confirmation page
- [x] Trust badges

#### F5. Public Pages & Landing Pages ✅

- [x] **Home Landing Page** `/` ✅
  - [x] Hero section with animated gradient
  - [x] Stats counter (alunos, avaliação, satisfação)
  - [x] Course cards carousel with hover effects
  - [x] Features section (6 benefits grid)
  - [x] Testimonials carousel
  - [x] FAQ accordion
  - [x] CTA section (WhatsApp integration)
  - [x] Footer with social links and contact

- [x] **Course Landing Pages** `/courses/[courseId]` ✅
  - [x] Dynamic hero with course color/gradient
  - [x] Pricing card with availability indicator
  - [x] Schedule display (available times)
  - [x] Curriculum accordion (modules with topics)
  - [x] Learning outcomes list
  - [x] Prerequisites section
  - [x] Course testimonials
  - [x] Course-specific FAQ
  - [x] CTA with WhatsApp integration

- [x] **Landing Page Builder** `/staff/landing-builder` ✅
  - [x] Tab-based editor (Basic, Details, Pricing, Content, Social, Settings)
  - [x] Basic info (name, subtitle, tagline, description, color, icon)
  - [x] Details (ages, duration, class info, schedules)
  - [x] Pricing (monthly, enrollment fee, discounts)
  - [x] Content (modules with topics, outcomes, requirements)
  - [x] Social proof (testimonials, FAQs)
  - [x] Settings (URL slug, visibility, media)
  - [x] Live preview panel with checklist
  - [x] Full preview modal

---

### G. OWNER EXPERIENCE

#### G1. Owner Dashboard `/owner` ✅

- [x] P&L summary
- [x] Revenue vs expenses chart
- [x] Payroll summary
- [x] Year-over-year comparison (monthly/quarterly/annual views)
- [x] Cash flow projection (3-month outlook with inflows/outflows)

#### G2. Payroll Management `/owner/payroll` ✅

- [x] Monthly payout list
- [x] Approve/dispute payouts
- [x] Payout details breakdown
- [ ] Export for accounting

#### G3. Financial Reports `/owner/reports` ✅

- [x] Revenue by period
- [x] Revenue by course type
- [x] Revenue by payment method
- [x] Defaulter aging report
- [x] Teacher cost analysis (efficiency ratios, cost breakdown, trends)

#### G4. Payables / Accounts Payable `/owner/payables` ✅

- [x] Payables list with status (pending/paid/overdue)
- [x] Upload vendor invoice (PDF/image) - UI only
- [x] Create payable modal (vendor, amount, due date, category)
- [x] Category management (rent, utilities, supplies, marketing, etc.)
- [x] Payment recording (mark as paid)
- [x] Recurring payables setup
- [ ] Export for accounting
- [x] API integration (`/api/payables`, `/api/payables/[id]`)

#### G5. Staff/Employee Management `/owner/employees` ✅

- [x] Staff list with roles and status
- [x] Add staff modal (name, role, contact, access level)
- [x] Working hours/shift setup modal
- [x] Access permissions management (UI)
- [x] Staff contracts (non-teaching) - `/api/staff-contracts`
- [x] Leave/vacation tracking - `/api/staff-leave`
- [x] Staff payroll integration - `/api/staff-payroll`, `/api/payroll-payments`

#### G5.5. Permission Management `/owner/permissions` ✅ (NEW)

- [x] User list with role badges and override counts
- [x] User search/filter
- [x] Per-module CRUD toggles (Create/Read/Update/Delete)
- [x] Role defaults inherited from role configuration
- [x] User-specific overrides with visual indicator
- [x] Reset to role defaults button
- [x] Owner permissions locked (cannot modify)
- [x] Database tables: `role_permissions`, `user_permissions`
- [x] APIs: `/api/permissions`, `/api/permissions/check`
- [x] Permission hooks: `usePermission`, `usePermissions`
- [x] Components: `RequirePermission`, `AccessDenied`

#### G6. Payroll & Split Payments System ✅

- [x] Payroll records (salary, hourly, bonus, commission) - `staffPayroll` table
- [x] Split payment tracking - `payrollPayments` table
- [x] Payment methods (bank, PIX, card, cash, wallet) - `paymentMethods` table
- [x] Partial payment support with auto-status updates
- [x] APIs: `/api/staff-payroll`, `/api/payroll-payments`, `/api/payment-methods`

#### G7. Accounting Infrastructure (Lucro Real Ready) ✅

- [x] Chart of Accounts (Plano de Contas) - `chartOfAccounts` table
- [x] Cost Centers (Centros de Custo) - `costCenters` table
- [x] Journal Entries (Lançamentos Contábeis) - `journalEntries`, `journalEntryLines` tables
- [x] Fiscal Documents (NF-e, NFS-e) - `fiscalDocuments` table
- [x] Tax Withholdings (DIRF) - `taxWithholdings` table
- [x] Accounting APIs:
  - [x] `/api/chart-of-accounts` - Plano de contas with hierarchy & balance calculation
  - [x] `/api/cost-centers` - Centros de custo with budget tracking
  - [x] `/api/journal-entries` - Double-entry validation, auto-numbering, reversal entries
  - [x] `/api/fiscal-documents` - NF-e/NFS-e lifecycle management
- [x] Financial Reports (Balancete, DRE, Balanço)

#### G8. Export System ✅

- [x] Export Service Library (`lib/export/exportService.ts`)
  - [x] CSV export with proper encoding
  - [x] JSON export with metadata
  - [x] Excel export (xlsx) with dynamic import fallback
  - [x] PDF export (HTML template for print/server rendering)
  - [x] Value formatters (currency, date, percentage)
  - [x] Predefined report templates (8 templates)
- [x] ExportButton Component
  - [x] Format selection dropdown (CSV, Excel, PDF, JSON)
  - [x] Date range picker option
  - [x] Loading states
  - [x] Data fetch callback support
- [x] ExportModal Component
  - [x] Report type selection
  - [x] Format grid selection
  - [x] Date range picker
  - [x] Error handling
- [x] Export API (`/api/export`)
  - [x] Chart of accounts export
  - [x] Journal entries export
  - [x] Fiscal documents export
  - [x] Payroll export
  - [ ] Tax withholdings export (schema adjustment needed)
  - [ ] Invoices export (schema adjustment needed)
  - [ ] Transactions export (schema adjustment needed)

#### G9. Accountant Portal `/accountant` ✅

- [x] Portal page with tabbed interface
- [x] Report cards grid
  - [x] Category filters (Financial, Tax, Operational)
  - [x] Quick export buttons per report
  - [x] Report descriptions
- [x] Export history tab (mock data)
- [x] SPED obligations tab
  - [x] SPED Contribuições status
  - [x] EFD ICMS/IPI status
  - [x] ECD (SPED Contábil) status
  - [x] ECF status
  - [x] Due date tracking
  - [ ] Actual SPED file generation
- [x] Accountant role in AppLayout
  - [x] Role configuration (color, label, avatar)
  - [x] Navigation menu
  - [x] Role switcher icon

#### G10. SPED Fiscal Schemas ✅

- [x] Zod validation schemas (`lib/schemas/fiscal/`)
  - [x] `common.ts` - CPF, CNPJ, Money, Percentage, enums
  - [x] `tax-withholdings.ts` - IRRF, INSS, ISS, PIS, COFINS, CSLL
  - [x] `invoices.ts` - NFS-e, service items, withholdings
  - [x] `transactions.ts` - Bank reconciliation, accounting entries
  - [x] `index.ts` - Re-exports
- [x] Brazilian formatters (`lib/export/formatters.ts`)
  - [x] formatBRL (centavos → "R$ 1.234,56")
  - [x] formatCPF / formatCNPJ with validation
  - [x] formatDateBR (DD/MM/YYYY)
  - [x] formatPercentage (basis points → "15,00%")
  - [x] formatCompetency (YYYY-MM → MM/YYYY)
  - [x] SPED formatters (formatSPEDLine, formatSPEDValue)
- [x] Database tables (`lib/db/schema.ts`)
  - [x] `bankAccounts` - Bank accounts for reconciliation
  - [x] `fiscalTaxWithholdings` - Tax withholding records
  - [x] `fiscalTransactions` - Financial movements with categories
  - [x] `fiscalTransactionDocuments` - Junction table for documents
- [ ] SPED file generators (ECD, ECF text files)
- [ ] API routes for new fiscal entities


---


### H. SHARED COMPONENTS

#### H1. UI Components ✅

- [x] `<UserAvatar />` - with role indicator and initials
- [x] `<StatusBadge />` - colored status pills with 25+ predefined statuses
- [x] `<EmptyState />` - consistent empty states with actions
- [x] `<ConfirmModal />` - for destructive actions (danger/warning/info)
- [x] `<DateRangePicker />` - for reports with presets
- [x] `<FileUpload />` - with drag-drop, preview, progress
- [x] `<Timeline />` - activity timeline with typed events
- [x] `<StatsCard />` - metric display with trends and progress
- [x] `<RichTextEditor />` - Tiptap-based editor with KaTeX LaTeX support
  - Inline and block LaTeX formulas with live preview
  - Common formula templates (fractions, integrals, matrices, etc.)
  - HTML export with embedded KaTeX CSS
  - Code blocks with syntax highlighting (lowlight)
- [x] `<Latex />` - standalone LaTeX rendering component
- [x] `<KanbanBoard />` - reusable kanban with WIP limits, value totals, priorities, and custom cards
  - Lead Funnel (new → contacted → qualified → trial)
  - Sales Funnel (proposal → negotiation → closing → won/lost)
  - Student Funnel (onboarding → active → at-risk → churning)
  - Post-Sale Funnel (identify → approach → present → upsold/renewed)

#### H2. 3D Components (R3F) ✅

- [x] `<Constellation3D />` - knowledge graph
- [x] `<TodoCube3D />` - 3D priority cube with effort axis
- [x] `<OrbitScene />` - interactive module visualization with rings, nodes, and connections
- [x] `<OrbitControls />` - using @react-three/drei

#### H3. Layout Components ✅

- [x] `<PageHeader />` - consistent page headers with breadcrumbs
- [x] `<SectionCard />` - content sections with title/actions
- [x] `<TabLayout />` - tabbed pages with badges and vertical card variant
- [x] `<VerticalTabCards />` - card-style vertical tabs for complex navigation
- [x] `<WizardLayout />` - multi-step flows with validation and progress
- [x] `<CompactWizard />` - inline horizontal wizard variant

#### H4. CRM Components ✅

- [x] `<LifecycleCard />` - Lead→Trial→Student→Alumnus progression card
- [x] `<LifecycleKanban />` - full LTV:CAC ratio kanban board by stage
- [x] `<AddOcurrenceModal />` - add timeline events (calls, meetings, payments, etc.)
- [x] Ocorrências timeline with 15 event types (note, call, email, whatsapp, meeting, payment, enrollment, lesson, trial, conversion, graduation, referral, complaint, milestone, system)
- [x] Stage progress visualization with progress bars
- [x] LTV:CAC ratio calculation per contact and per stage

#### H5. Global Navigation & Layout ✅

- [x] `<AppLayout />` - main sidebar with role-based navigation
  - [x] 6 user roles (Student, Teacher, Parent, Staff, School, Owner)
  - [x] Role switcher (dev mode)
  - [x] Theme toggle (light/dark)
  - [x] User dropdown menu with profile/logout
  - [x] Scrollable nav sections
  - [x] All routes integrated into sidebar

#### H5. User Profile `/profile` ✅

- [x] Personal info tab (name, email, CPF, birthdate)
- [x] Contact tab (phone, WhatsApp, emergency contact)
- [x] Address tab (main address + billing address)
- [x] Same-as-billing toggle
- [x] Payment methods tab (card list, add/remove, set default)
- [x] Payment history table
- [x] Preferences tab (notifications, language, timezone)
- [x] Security tab (password change, 2FA, sessions, danger zone)
- [x] Children list for parent accounts

#### H6. QR Onboarding `/onboarding` ✅

- [x] Multi-step account creation wizard
- [x] Account type selection (parent/student)
- [x] Credentials step (email, password)
- [x] Personal info step (name, phone, CPF)
- [x] Child info for parents
- [x] Address step with CEP auto-fill
- [x] Terms acceptance step
- [x] Completion screen with next steps

#### H7. Export Utilities ✅

- [x] CSV export utility function (`lib/export/exportService.ts`)
- [x] PDF generation (via ExportButton component)
- [x] Export buttons wiring:
  - [x] `/teacher/grades` - Export grades to CSV/XLSX/PDF
  - [x] `/teacher/attendance` - Export attendance to CSV/XLSX/PDF
  - [x] `/teacher/classes/[classId]` - Export roster
  - [x] `/school/students` - Export students to CSV/XLSX/PDF
  - [x] `/owner/reports` - Export reports by tab
  - [x] `/owner/payroll` - Export payroll to CSV/XLSX/PDF
  - [x] `/owner/payables` - Export payables to CSV/XLSX/PDF
  - [x] `/owner/employees` - Export employees to CSV/XLSX/PDF

---

## 🔌 TO WIRE UP LIST

Everything that needs to be connected, integrated, or configured.

---

### A. DATABASE

#### A1. Drizzle Setup

- [ ] Run `drizzle-kit generate:sqlite` to create migrations
- [ ] Run `drizzle-kit push:sqlite` to apply schema
- [ ] Verify all tables created in Turso
- [ ] Add seed data for course_types
- [ ] Add seed data for levels (CEFR)
- [ ] Add seed data for ai_providers

#### A2. Database Connections

- [ ] Create `src/lib/db/index.ts` - Drizzle client
- [ ] Configure Turso connection URL
- [ ] Add connection pooling
- [ ] Add query logging (dev mode)

#### A3. Memory Topology Tables (NEW) ✅

Per Memory Topology Plan:

- [x] `memory_graphs` - main container (student_id, snr, compression_passes, loss_vector)
- [x] `memory_nodes` - nodes with content, gravity, salience, modality, embedding BLOB
- [x] `memory_edges` - edges with type, direction, weight, valence
- [x] `memory_contradictions` - conflicting beliefs (node_a, node_b, resolved, strategy)
- [x] `memory_ledger` - lossless facts (category, importance, triggers, source)
- [x] `student_world_overlay` - fog of war perspective (known_nodes, known_edges, attitudes)

Indexes:
- [x] `idx_memory_graphs_student` on `memory_graphs(student_id)`
- [x] `idx_memory_nodes_graph` on `memory_nodes(graph_id)`
- [x] `idx_memory_nodes_gravity` on `memory_nodes(gravity)`
- [x] `idx_memory_edges_type` on `memory_edges(type)`
- [x] `idx_memory_ledger_category` on `memory_ledger(category)`

#### A4. Ethics & Supervision Tables (NEW) ✅

Per Ethics Policy:

- [x] `chat_sessions` - conversation sessions (student_id, started_at, ended_at, metadata)
- [x] `chat_messages` - encrypted messages (session_id, role, content_encrypted, timestamp)
- [x] `memory_integrity_hashes` - hash snapshots (student_id, hash, created_at)
- [x] `memory_audit_log` - all memory operations (operation, entity_id, actor, timestamp)
- [x] `safety_alerts` - escalation alerts (student_id, level, reason, detected_at, resolved_at)
- [x] `alert_acknowledgments` - staff acknowledgments (alert_id, acknowledged_by, timestamp)
- [x] `wellbeing_snapshots` - aggregated indicators (student_id, engagement, emotional_score, date)

Encryption:
- [x] Student-derived key encryption for `chat_messages.content_encrypted`
- [ ] Institution salt stored separately from student password
- [x] Key derivation using PBKDF2 or Argon2

---

### B. API ROUTES

#### B1. Core CRUD APIs ✅

- [x] `POST/GET/PATCH/DELETE /api/users`
- [x] `POST/GET/PATCH/DELETE /api/courses`
- [x] `POST/GET/PATCH/DELETE /api/modules`
- [x] `POST/GET/PATCH/DELETE /api/lessons`
- [x] `POST/GET/PATCH/DELETE /api/prompts`
- [x] `POST /api/prompts/[id]/run` - execute prompt
- [x] `GET/POST /api/progress`

#### B2. Student Toolbox APIs ✅

- [x] `CRUD /api/student-prompts`
- [x] `CRUD /api/annotations`
- [x] `CRUD /api/graveyard`
- [x] `CRUD /api/techniques`
- [x] `CRUD /api/todos`
- [x] `CRUD /api/workshops`
- [x] `CRUD /api/capstones`
- [x] `CRUD /api/reviews`
- [x] `CRUD /api/challenges`
- [x] `CRUD /api/knowledge-nodes`
- [x] `CRUD /api/knowledge-edges`

#### B3. School Operations APIs ✅

- [x] `CRUD /api/rooms`
- [x] `CRUD /api/terms`
- [x] `CRUD /api/classes`
- [x] `CRUD /api/schedules`
- [x] `CRUD /api/sessions`
- [x] `CRUD /api/attendance`
- [x] `CRUD /api/placements`

#### B4. Financial APIs ✅

- [x] `CRUD /api/products`
- [x] `CRUD /api/discounts`
- [x] `CRUD /api/invoices`
- [x] `POST /api/invoices/[id]/pay`
- [x] `CRUD /api/transactions`
- [x] `CRUD /api/teacher-contracts`
- [x] `GET/POST /api/payouts`
- [x] `POST /api/payouts/[id]/approve`

#### B5. CRM APIs ✅

- [x] `CRUD /api/leads`
- [x] `POST /api/leads/[id]/interact`
- [x] `POST /api/leads/[id]/convert`
- [x] `CRUD /api/trials`
- [x] `CRUD /api/campaigns`
- [x] `CRUD /api/templates`
- [x] `CRUD /api/referrals`

#### B6. Enrollment APIs ✅

- [x] `CRUD /api/enrollments`
- [x] `POST /api/enrollments/[id]/transfer`
- [x] `POST /api/enrollments/[id]/drop`
- [x] `CRUD /api/waitlist`
- [x] `CRUD /api/family-links`


#### B7. AI Companion APIs (Memory Topology) ✅

Memory Graph operations (per-student AI memory):

- [x] `POST /api/memory/graph` - create memory graph for student
- [x] `GET /api/memory/graph/[studentId]` - get student's memory graph
- [x] `POST /api/memory/nodes` - add memory node
- [x] `GET /api/memory/nodes` - query nodes (filter by gravity, modality, etc.)
- [x] `PATCH /api/memory/nodes/[id]/gravity` - update node gravity
- [x] `DELETE /api/memory/nodes/[id]` - remove node (student right)
- [x] `POST /api/memory/edges` - add edge between nodes
- [x] `GET /api/memory/edges` - query edges (filter by type, weight)
- [x] `DELETE /api/memory/edges/[id]` - remove edge

Ledger operations (lossless critical facts):

- [x] `POST /api/memory/ledger` - add ledger entry (promise, secret, debt, threat)
- [x] `GET /api/memory/ledger` - list ledger entries (filter by category, importance)
- [x] `DELETE /api/memory/ledger/[id]` - remove entry (student right, with limitations)
- [x] `POST /api/memory/ledger/trigger` - trigger-based retrieval for context

Compression operations:

- [x] `POST /api/memory/compress/[studentId]` - run compression pass
- [x] `GET /api/memory/compress/stats/[studentId]` - get compression stats
- [x] `GET /api/memory/snr` - calculate SNR for content

Contradiction tracking:

- [x] `GET /api/memory/contradictions` - list detected contradictions
- [x] `POST /api/memory/contradictions/[id]/resolve` - resolve contradiction

World Overlay (student's perspective on shared knowledge):

- [x] `GET /api/memory/overlay/[studentId]` - get student's world overlay
- [x] `PATCH /api/memory/overlay/[studentId]` - update fog of war, attitudes

#### B8. AI Chat APIs ✅

- [x] `POST /api/chat/sessions` - create new chat session
- [x] `GET /api/chat/sessions` - list chat sessions
- [x] `GET /api/chat/sessions/[id]/messages` - get conversation history (encrypted)
- [x] `POST /api/chat/sessions/[id]/messages` - add message to session
- [x] `POST /api/chat/message` - send message to AI Companion
- [x] `POST /api/chat/stream` - streaming chat response
- [x] `GET /api/chat/context/[studentId]` - build context with memories

#### B9. Ethics & Supervision APIs (AI Auditor) ✅

Data Domain Separation:

- [x] `GET /api/domains/institutional/[studentId]` - grades, attendance, certificates (teachers/parents)
- [x] `GET /api/domains/relational/[studentId]` - encrypted memories (student-only decrypt)
- [x] `GET /api/domains/supervision/[studentId]` - metadata for AI Auditor

AI Auditor operations:

- [x] `GET /api/auditor/wellbeing/[studentId]` - aggregated wellbeing indicators
- [x] `GET /api/auditor/engagement/[studentId]` - session frequency, duration
- [x] `POST /api/auditor/analyze` - run safety analysis on metadata
- [x] `GET /api/auditor/alerts` - list alerts (filtered by level)
- [x] `POST /api/auditor/verify-integrity/[studentId]` - verify memory hash

Escalation Protocol:

- [x] `POST /api/alerts` - create alert (Green/Yellow/Orange/Red)
- [x] `GET /api/alerts` - list alerts (filter by student, level, status)
- [x] `PATCH /api/alerts/[id]/acknowledge` - staff acknowledges alert
- [x] `PATCH /api/alerts/[id]/resolve` - resolve alert
- [x] `POST /api/alerts/[id]/escalate` - escalate to next level
- [ ] Webhook: notify parents (Yellow+), coordinators (Orange+), authorities (Red ECA)

Memory Integrity:

- [x] `GET /api/integrity/hash/[studentId]` - get current memory hash
- [x] `POST /api/integrity/verify` - verify hash matches content
- [x] `GET /api/integrity/log/[studentId]` - audit log of memory operations
- [x] `POST /api/integrity/report` - report suspected tampering

#### B10. Parent Consultation APIs ✅

Parent interface to AI Auditor (privacy-preserving):

- [x] `GET /api/parent/child/[childId]/engagement` - session frequency, duration
- [x] `GET /api/parent/child/[childId]/progress` - curricular progress
- [x] `GET /api/parent/child/[childId]/wellbeing` - aggregated emotional indicators
- [x] `GET /api/parent/child/[childId]/alerts` - alerts relevant to this child
- [x] `GET /api/parent/child/[childId]/recommendations` - AI-suggested interventions

Protected (not accessible to parents):

- ❌ Conversation content
- ❌ Specific memory details
- ❌ AI Companion's private notes
- ❌ Student confessions/venting

#### B11. Student Rights APIs (LGPD Compliance) ✅

- [x] `GET /api/rights/access/[studentId]` - view all stored data
- [x] `POST /api/rights/rectify` - request data correction
- [x] `POST /api/rights/forget` - request memory deletion (with safety limits)
- [x] `GET /api/rights/export/[studentId]` - export all data (JSON + readable)
- [x] `POST /api/rights/portability` - package data for migration
- [x] `POST /api/rights/negotiate` - student-AI agreement on remembering

#### B12. Profile & Onboarding APIs ✅

- [x] `GET/PATCH /api/profile` - current user's profile
- [x] `GET/PATCH /api/profile/address` - addresses (main + billing)
- [x] `GET/POST/DELETE /api/profile/payment-methods` - card management
- [x] `GET /api/profile/payment-history` - payment records
- [x] `PATCH /api/profile/preferences` - notification, language settings
- [x] `POST /api/profile/password` - change password
- [x] `GET /api/profile/sessions` - active sessions
- [x] `DELETE /api/profile/sessions/[id]` - end session
- [x] `POST /api/onboarding/register` - QR code account creation
- [x] `POST /api/onboarding/verify-email` - email verification
- [x] `POST /api/onboarding/complete` - finalize onboarding

---

### C. AUTHENTICATION

#### C1. Clerk Setup ✅

- [x] Configure Clerk middleware (proxy.ts)
- [ ] Set up organization support
- [x] Configure role sync (Clerk → DB via onboarding)
- [x] Add sign-in page customization
- [x] Add sign-up page customization
- [ ] Configure email templates in Clerk

#### C2. Role-Based Access ✅

- [x] Create role definitions in `useUser.tsx`
- [x] Create `useUserContext()` hook with role
- [x] Create `AuthGuard` component for protected routes
- [x] Add role-based redirect (`/go` smart redirect)
- [x] Add role-based menu filtering (AppLayout sidebar)
- [ ] Add role checks to all API routes (partial)

#### C3. Organization Multi-Tenancy

- [ ] Filter all queries by organizationId
- [ ] Add organization switcher (for owners)
- [ ] Tenant data isolation validation

---

### D. AI INTEGRATION

#### D1. Anthropic SDK

- [ ] Configure Anthropic SDK
- [ ] BYOK encryption/decryption
- [ ] Token counting
- [ ] Rate limiting
- [ ] Error handling
- [ ] Streaming responses

#### D2. Playground Integration

- [ ] Wire up run button to API
- [ ] Display streaming response
- [ ] Save run to prompt_runs
- [ ] Character evaluation (held/broke)
- [ ] Auto-create annotation option

#### D3. AI Helpers

- [ ] 5 Whys assistant
- [ ] Prompt critique assistant
- [ ] Challenge evaluation assistant

#### D4. AI Companion System (Memory Topology) ✅

Core Memory Engine:

- [x] `src/lib/ai/memory.ts` - Zod schemas (MemoryNode, MemoryEdge, MemoryGraph, LedgerEntry)
- [x] `src/lib/ai/memory-queries.ts` - CRUD for memory nodes/edges/ledger
- [x] `src/lib/ai/compression.ts` - SNR-based double-layer compression
  - [x] Layer 1: Prune low-gravity nodes, track entropy loss
  - [x] Layer 2: Spectral clustering, node merging
  - [x] φ constants: 0.382 (noise floor), 0.618 (density), 1.618 (phi)
- [x] `src/lib/ai/context-builder.ts` - Build context with relevant memories
  - [x] Load memory graph
  - [x] Query relevant nodes by embedding similarity
  - [x] Trigger ledger entries by context
  - [x] Format for prompt injection (narrative/structured/minimal)

Memory Operations:

- [x] `formMemory(interaction)` - Create nodes/edges after chat
- [x] `evaluateForLedger(content)` - Decide if content is ledger-worthy
- [x] `decayNodes(halfLife)` - Time-based gravity decay
- [x] `resolveContradiction(nodeA, nodeB)` - Handle conflicting beliefs
- [x] `getWorldOverlay(studentId)` - Get student's fog of war

Compression Triggers:

- [x] End of session (batch compression)
- [x] Node count exceeds threshold
- [x] Manual trigger by student

Additional Implementations:

- [x] `src/lib/ai/index.ts` - Main exports with convenience wrappers
- [x] `runMemorySession()` - Complete session lifecycle
- [x] `getContextForMessage()` - Quick context retrieval
- [x] `initializeStudentMemory()` - New student setup
- [x] Privacy levels: public/family/private/sacred
- [x] LGPD compliance: export/delete memory functions

MCP Integration (Synapse Bridge):

- [x] `src/lib/ai/mcp-memory-bridge.ts` - MCP tool definitions and executor
- [x] `MEMORY_MCP_TOOLS` - 7 memory tools for Claude access
  - [x] query_memories - Semantic search with embedding similarity
  - [x] remember - Store new memories with type/gravity
  - [x] get_ledger - Retrieve significant events
  - [x] add_ledger_entry - Add milestones, promises, dreams
  - [x] reinforce_memory - Strengthen/weaken node gravity
  - [x] get_world_overlay - Summary of what AI knows
  - [x] get_memory_stats - Graph statistics
- [x] `src/lib/ai/synapse-executor-v2.ts` - Enhanced executor with topology
  - [x] Bridges legacy DB system with new Memory Topology
  - [x] `useTopology` flag for switching implementations
  - [x] Session-aware tool execution
- [x] Context injection in conversation route
  - [x] `getMemoryContextForPrompt()` for system prompt
  - [x] Memory formation from interactions
  - [x] Session lifecycle management

#### D5. AI Auditor System (Ethics Policy) ✅

Outsider AI (reads metadata only, not content):

- [x] `src/lib/ai/auditor.ts` - Auditor implementation
- [x] Pattern analysis on metadata (not content):
  - [x] Session frequency and duration
  - [x] Emotional indicator trends (aggregated)
  - [x] Usage anomalies
- [x] Risk detection patterns:
  - [x] Indicators of severe emotional distress
  - [x] Self-harm or suicidal ideation signals
  - [x] Signs of abuse or neglect
  - [x] System manipulation attempts
- [x] Memory integrity verification:
  - [x] Hash verification per session
  - [x] Detect unauthorized modifications
  - [x] Immutable audit log

Escalation Protocol Implementation:

- [x] 🟢 Green: Normal operation, standard parent reports
- [x] 🟡 Yellow: Attention needed, notify parents + coordinators
- [x] 🟠 Orange: Significant concern, schedule meeting, suggest professional support
- [x] 🔴 Red: Imminent risk, immediate contact, ECA notification if required

Parent Interface:

- [x] Aggregated wellbeing indicators
- [x] Engagement metrics
- [x] Progress summaries
- [x] Alert notifications (privacy-preserved)
- [x] ❌ No access to: conversation content, specific memories, confessions

Implementation Details:

- [x] `AIAuditor` class with full session metadata collection
- [x] 7 risk detection patterns (distress, self-harm, isolation, behavioral change, manipulation)
- [x] `onSessionEnd()` hook for automatic analysis
- [x] `generateStudentWellbeingReport()` for parent reports
- [x] `verifyStudentMemoryIntegrity()` for hash chain verification
- [x] Privacy-preserving sanitization (never exposes content)
- [x] Zod schemas for all data structures


#### D6. Encryption & Student Rights (LGPD) ✅

Data Domain Separation:

- [x] Institutional domain (grades, attendance) - teachers/parents access
- [x] Relational domain (memories, conversations) - student-only decrypt
- [x] Supervision domain (metadata, alerts) - auditor access

Student Rights (LGPD):

- [x] Right of Access: view all stored data (`exerciseRightOfAccess`)
- [x] Right of Rectification: correct inaccuracies (`exerciseRightOfRectification`)
- [x] Right of Deletion: remove memories with safety limits (`exerciseRightOfDeletion`)
- [x] Right of Portability: export in open format (`exerciseRightOfPortability`)
- [x] Right of Negotiation: agreements on remembering (`updateRememberingAgreement`)

Encryption:

- [x] Derive key from student password + institutional salt (PBKDF2, 250k iterations)
- [x] Encrypt relational domain content (AES-GCM 256-bit)
- [x] Recovery via presential identity verification (`initiateKeyRecovery`)
- [x] Export in decrypted format on demand

Implementation Details:

- [x] `src/lib/ai/student-rights.ts` - Complete LGPD system
- [x] `StudentRights` - Grouped export for all rights
- [x] `Encryption` - deriveKey, generateStudentKey, encrypt/decrypt
- [x] `Recovery` - initiateKeyRecovery, completeKeyRecovery
- [x] `DomainAccess` - canAccessDomain, filterByDomainAccess
- [x] `Consent` - recordParentConsent, hasValidConsent
- [x] Zod schemas for all data structures
- [x] 72-hour cooldown for deletion requests
- [x] Safety blocks during active escalation


### E. PAYMENT INTEGRATION (`/staff/payments`)

#### E1. Multi-Provider Setup ✅

- [x] **Stripe** - International + PIX support (`/api/webhooks/stripe`)
- [x] **Asaas** - PIX, Boleto, Credit Card (`/api/webhooks/asaas`)
- [x] **Mercado Pago** - Most popular in LATAM (`/api/webhooks/mercadopago`)
- [x] **PagSeguro** - Traditional Brazilian provider (`/api/webhooks/pagseguro`)
- [x] **Pagar.me** - Developer-friendly by Stone (`/api/webhooks/pagarme`)

#### E2. PIX Integration ✅

- [x] Configure PIX API credentials (all providers)
- [x] Generate PIX code on invoice creation (`src/lib/payments/providers.ts`)
- [x] QR code generation (provider APIs)
- [x] Webhook for payment confirmation (all providers)
- [x] Transaction status updates

#### E3. Credit Card Integration ✅

- [x] Configure Stripe/Asaas/Mercado Pago keys
- [x] Payment intent creation (provider library)
- [x] Webhook for payment events
- [x] Refund handling in webhooks

#### E4. Boleto Integration ✅

- [x] Configure boleto API (Asaas, Mercado Pago, PagSeguro, Pagar.me)
- [x] Boleto generation (provider library)
- [x] Payment confirmation webhook
- [x] Expiration handling

#### E5. Payments Dashboard (`/staff/payments`) ✅

- [x] Invoice management table with filters
- [x] Transaction history with fees
- [x] Provider comparison table
- [x] Create invoice modal
- [x] PIX/Boleto copy buttons
- [x] WhatsApp/Email reminder buttons

#### E6. Provider Settings (`/staff/payments/settings`) ✅

- [x] API key management per provider
- [x] Webhook URL display with copy
- [x] Test mode toggle
- [x] Connection testing
- [x] Quick setup guide

#### E7. Invoice Generation (Planned)

- [ ] Auto-generate monthly invoices
- [ ] Invoice PDF generation
- [ ] Email invoice to payer
- [ ] Payment reminders (3 days before)
- [ ] Overdue notifications

#### E8. Bank Integration Library (`src/lib/payments/banks.ts`) ✅

- [x] **10 Brazilian Banks Integrated:**
  - [x] Banco do Brasil (developers.bb.com.br)
  - [x] Itaú Unibanco (developer.itau.com.br)
  - [x] Bradesco (api.bradesco)
  - [x] Santander Brasil (developer.santander.com.br)
  - [x] Nubank (nubank.com.br/open-finance)
  - [x] Caixa Econômica (caixadesenvolvedor.com.br)
  - [x] Banco Inter (developers.inter.co)
  - [x] Sicoob (developers.sicoob.com.br)
  - [x] Sicredi (developer.sicredi.com.br)
  - [x] Banco Safra (developer.safra.com.br)
- [x] Open Finance Brasil endpoints
- [x] FAPI security (OAuth 2.0 + OpenID Connect)
- [x] PIX operations (initiate, status, QR code)
- [x] Account operations (balance, transactions)
- [x] Boleto generation
- [x] Bank reconciliation algorithm

#### E9. Business Settings (`/owner/business-settings`) ✅

- [x] Payment providers tab with fee comparison
- [x] Banks tab with Open Finance info
- [x] Business data form (company, CNPJ, address)
- [x] PIX key management
- [x] Invoicing settings (due days, default method)
- [x] Auto-reminder configuration (WhatsApp + Email)
- [x] Webhook URL display for all providers

---

### F. EMAIL INTEGRATION

#### F1. Resend Setup

- [ ] Configure Resend API key
- [ ] Create email templates
- [ ] Sender domain verification
- [ ] Email logging

#### F2. Transactional Emails

- [ ] Invoice created
- [ ] Payment received
- [ ] Payment reminder
- [ ] Class reminder (24h before)
- [ ] Capstone deadline
- [ ] Welcome email

#### F3. Marketing Emails

- [ ] Campaign blast
- [ ] Referral invite
- [ ] Re-enrollment reminder

---

### G. WHATSAPP INTEGRATION

#### G1. WhatsApp Business API

- [ ] Configure API credentials
- [ ] Template message approval
- [ ] Send message function
- [ ] Webhook for incoming messages
- [ ] Message logging

#### G2. Automated Messages

- [ ] Lead welcome
- [ ] Trial reminder
- [ ] Class reminder
- [ ] Payment reminder

---

### H. FILE STORAGE

#### H1. Cloudflare R2 / S3

- [ ] Configure storage credentials
- [ ] Upload function
- [ ] Signed URL generation
- [ ] File size limits
- [ ] Allowed file types

#### H2. Use Cases

- [ ] Capstone evidence uploads
- [ ] Profile avatars
- [ ] Invoice PDFs
- [ ] Email attachments
- [ ] Workbook scans

---

### I. REAL-TIME FEATURES

#### I1. Pusher/WebSockets

- [ ] Configure Pusher
- [ ] Inbox real-time updates
- [ ] Playground streaming
- [ ] Notification toasts

---

### J. CALENDAR INTEGRATION

#### J1. Google Calendar

- [ ] OAuth flow for teachers
- [ ] Sync class schedules
- [ ] Create calendar events

#### J2. iCal Export

- [ ] Generate iCal feed per user
- [ ] Include class schedule
- [ ] Include deadlines

---

### K. ANALYTICS

#### K1. Internal Analytics

- [ ] Track page views
- [ ] Track prompt runs
- [ ] Track conversions (lead → student)
- [ ] Track revenue metrics

#### K2. External Analytics

- [ ] Google Analytics 4
- [ ] Meta Pixel
- [ ] UTM tracking preservation

---

### L. DEPLOYMENT

#### L1. Vercel Setup

- [ ] Configure environment variables
- [ ] Set up preview deployments
- [ ] Configure custom domain
- [ ] SSL certificate

#### L2. Database (Turso) ✅

- [x] Create production database (nodezero-gepetointraining)
- [x] Configure connection in drizzle.config.ts
- [x] Push schema to cloud database
- [ ] Configure replication
- [ ] Backup schedule

#### L3. Monitoring

- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Log aggregation

---

## 📊 SUMMARY

| Category | To Code | To Wire Up |
|----------|---------|------------|
| Student Tools | 9 pages | 11 API sets |
| Parent | 2 enhancements | 2 integrations |
| Teacher | 4 pages | 3 API sets |
| Staff | 5 pages | 4 API sets |
| School Admin | 9 pages | 7 API sets |
| CRM | 4 pages | 5 API sets |
| Owner | 3 pages | 3 API sets |
| Components | 14 components | - |
| Auth | - | 6 items |
| Payments | - | 12 items |
| Email/WhatsApp | - | 8 items |
| Infrastructure | - | 10 items |
| **AI Companion** 🆕 | **Memory engine** | **~30 APIs** |
| **Ethics/Auditor** 🆕 | **Auditor system** | **~25 APIs** |
| **TOTAL** | **~50 pages + 2 engines** | **~130 wire-ups** |

---

## 🎯 RECOMMENDED BUILD ORDER

### Phase 1: Foundation (Week 1-2)
1. Database migrations & seeding (including memory tables)
2. Core API routes (CRUD)
3. Clerk authentication wiring
4. Role-based access control
5. Profile & Onboarding APIs

### Phase 2: AI Foundation (Week 3-4) 🆕
1. Memory Topology Zod schemas
2. Memory Graph CRUD APIs
3. Ledger CRUD APIs
4. Basic memory formation after chat
5. Context builder (retrieve relevant memories)

### Phase 3: Ethics & Supervision (Week 5-6) 🆕
1. Data domain separation (institutional/relational/supervision)
2. Encryption for relational domain
3. AI Auditor metadata analysis
4. Escalation protocol (Green → Yellow → Orange → Red)
5. Parent consultation interface
6. Student rights APIs (access, export, forget)

### Phase 4: Staff & CRM (Week 7-8)
1. Lead pipeline page
2. Lead detail page
3. Trial management
4. Front desk check-in
5. Lead/trial APIs

### Phase 5: School Ops (Week 9-10)
1. Room management
2. Class management
3. Schedule builder
4. Attendance entry
5. Term management

### Phase 6: Financial (Week 11-12)
1. Invoice APIs
2. PIX integration
3. Payment webhooks
4. Payroll management
5. PDF generation

### Phase 7: Student Tools (Week 13-14)
1. Technique tracker wiring
2. To-Do wiring
3. Challenge board
4. Capstone flow
5. AI chat interface

### Phase 8: Memory & Compression (Week 15-16) 🆕
1. SNR-based compression passes
2. Spectral clustering for node merging
3. Contradiction detection & resolution
4. World overlay (fog of war)
5. Memory decay over time

### Phase 9: 3D & Polish (Week 17-18)
1. To-Do Cube 3D
2. Knowledge Constellation 3D
3. Email templates
4. WhatsApp integration
5. Analytics & monitoring

---

## 🎯 LATTICE HR: TOPOLOGICAL TALENT MATCHING

> Evidence-based skill lattices that replace CVs, interviews, and personality assessments with mathematically projected skill topologies.

### L1. Database Schema (Priority: HIGH) ✅

#### L1.1 Core Tables

- [x] `lattice_evidence` table - Lattice evidence points
  ```
  id, person_id, content, context, source_type, 
  embedding (vector 768), captured_at, status
  ```
- [x] `lattice_projections` table - Reusable query lenses
  ```
  id, name, query_text, query_embedding (vector 768), 
  organization_id, created_at
  ```
- [x] `lattice_shares` table - Consent-based sharing
  ```
  id, owner_id, grantee_id, projection_id, 
  can_see_shape, can_see_points, expires_at
  ```
- [x] `lattice_skill_assessments` table - Calculated skill positions
  ```
  id, person_id, skill_id, category, position (-2 to +2),
  confidence, evidence_count, last_calculated
  ```

#### L1.2 Supporting Tables

- [x] `lattice_skill_definitions` table - 9 categories, 45 skills
  ```
  id, category, skill_name, description, 
  adjacent_skills (for shadow casting)
  ```
- [x] `lattice_projection_results` table - Cached projections
  ```
  id, person_id, projection_id, shape_data (JSON),
  shadow_regions, calculated_at
  ```

### L2. Embedding Infrastructure (Priority: HIGH) ✅

#### L2.1 Google Gemini Integration

- [x] `src/lib/embeddings/gemini.ts` - Google embedding client
  - [x] `embed(text: string): Promise<number[]>` - text-embedding-004 (768 dim)
  - [x] `embedBatch(texts: string[]): Promise<number[][]>` - batch embedding
  - [x] Rate limiting (1500 RPM for text-embedding-004)
  - [x] Error handling with exponential backoff
  - [x] Caching layer for repeated embeddings

#### L2.2 Fallback (Ollama)

- [ ] `src/lib/embeddings/ollama.ts` - Local fallback
  - [ ] Nomic v2 embedding (768 dim compatible)
  - [ ] Auto-switch when Gemini unavailable
  - [ ] Embedding dimension normalization

#### L2.3 Vector Operations ✅

- [x] `src/lib/embeddings/vector.ts` - Vector math utilities
  - [x] `cosineSimilarity(a, b): number`
  - [x] `euclideanDistance(a, b): number`
  - [x] `normalize(v): number[]`
  - [x] `centroid(vectors): number[]`
  - [x] `kMeansCluster(vectors, k): ClusterResult`
  - [x] `findMostSimilar(query, vectors, topK)`

#### L2.3 Vector Operations (duplicate, see above)

### L3. Skill Topology Framework (Priority: HIGH) ✅

#### L3.1 Skill Definitions

- [x] `src/lib/lattice/skills.ts` - 9 categories, 45 skills
  - [x] **Communication** (6): verbal, written, non-verbal, assertive, digital, effective
  - [x] **Adaptability** (5): change embrace, pivoting, creative problem-solving, critical thinking, resilience
  - [x] **Diversity Understanding** (4): cross-cultural, generational bridging, inclusive communication, organizational navigation
  - [x] **Social Media & Digital** (5): personal branding, reputation, networking, privacy, content
  - [x] **Emotional Intelligence** (5): self-awareness, regulation, empathy, social skills, conflict transformation
  - [x] **Time Management** (5): prioritization, goal-setting, focus, interruption handling, procrastination management
  - [x] **Networking** (5): relationship building, mentorship, cultivation, partnerships, recognition
  - [x] **Continuous Learning** (5): trend awareness, feedback acceptance, self-evaluation, learning plans, adaptation
  - [x] **Logic & Reasoning** (5): traversal, decomposition, abstraction, analogy, sequencing

#### L3.2 Position Scale (Shadow Model)

- [x] `src/lib/lattice/skills.ts` - Position types and logic (in same file)
  - [x] Position enum: CORE (+2), DEEP (+1), MID (0), SURFACE (-1), SHADOW (-2)
  - [x] `calculateShadowImpact(skill, position): SkillImpact[]`
  - [x] Shadow casting formula for adjacent skills
  - [x] `getPositionName(position): string`

#### L3.3 Zod Schemas

- [x] `src/lib/lattice/schemas.ts` - Type definitions
  - [x] `EvidenceSchema` - evidence point validation
  - [x] `ProjectionSchema` - query lens validation
  - [x] `ShareSchema` - sharing permissions
  - [x] `SkillAssessmentSchema` - calculated positions
  - [x] `ShapeDataSchema` - projected shape structure
  - [x] `MatchResultSchema` - matching results

### L4. Evidence Collection (Priority: HIGH) ✅

#### L4.1 Evidence Sources

- [ ] `src/lib/lattice/collectors/` - Evidence collectors
  - [ ] `chat-collector.ts` - AI conversations
  - [ ] `peer-feedback-collector.ts` - Peer interactions
  - [ ] `reflection-collector.ts` - Self-reflections
  - [ ] `workshop-collector.ts` - Problem-solving moments
  - [ ] `collaboration-collector.ts` - Group work patterns
  - [ ] `conflict-collector.ts` - Conflict resolution

#### L4.2 Evidence Processing

- [x] `src/lib/lattice/evidence.ts` - Evidence engine
  - [x] `captureEvidence(content, context, sourceType): Evidence`
  - [x] Auto-generate embedding via Gemini
  - [x] `calculateSkillRelevance(evidence): SkillScores`
  - [x] `queryEvidence()` with filters
  - [x] `findSimilarEvidence()` - similarity search
  - [x] `contestEvidence()` / `removeEvidence()`
  - [x] `getEvidenceStats(personId)` - statistics

#### L4.3 APIs

- [x] `POST /api/lattice/evidence` - Capture new evidence
- [x] `GET /api/lattice/evidence` - Query evidence points
- [x] `GET /api/lattice/evidence/[id]` - Get single evidence
- [x] `DELETE /api/lattice/evidence/[id]` - Remove evidence (with audit)
- [x] `POST /api/lattice/evidence/[id]` - Contest evidence point

### L5. Projection Engine (Priority: MEDIUM) ✅

#### L5.1 Projection Core

- [x] `src/lib/lattice/projection.ts` - Projection engine
  - [x] `createProjection(queryText): Projection`
  - [x] `projectLattice(personId, projectionId): ShapeData`
  - [x] `compareShapes(shapeA, shapeB): ShapeComparison`
  - [x] `findMatches(projectionId, candidateIds): MatchResult[]`

#### L5.2 Shape Analysis

- [x] `src/lib/lattice/projection.ts` - Shape analysis (in same file)
  - [x] `calculateSkillPositions()` - aggregate evidence to positions
  - [x] `calculateCategoryScores()` - category-level aggregates
  - [x] `detectShadowRegions()` - identify shadow areas
  - [x] `calculateOverallScore()` - 0-100 fit score
  - [x] `calculateShapeBounds()` - for 3D visualization

#### L5.3 APIs

- [x] `POST /api/lattice/projections` - Create projection
- [x] `GET /api/lattice/projections` - List projections
- [x] `GET /api/lattice/projections/[id]` - Get projection
- [x] `POST /api/lattice/projections/[id]` - Project a person (action: 'project')
- [x] `POST /api/lattice/projections/[id]` - Find matches (action: 'match')
- [x] `DELETE /api/lattice/projections/[id]` - Delete projection

### L6. Sharing & Privacy (Priority: MEDIUM)

#### L6.1 Consent System

- [ ] `src/lib/lattice/sharing.ts` - Sharing management
  - [ ] `grantAccess(ownerId, granteeId, permissions): LatticeShare`
  - [ ] `revokeAccess(shareId): void`
  - [ ] `checkAccess(ownerId, granteeId, projectionId): Permission`
  - [ ] `listShares(ownerId): LatticeShare[]`

#### L6.2 Privacy Levels

- [ ] Shape-only view (topological outline)
- [ ] Points visible (individual evidence)
- [ ] Projection-locked (specific projection only)
- [ ] Time-limited access (auto-expiry)

#### L6.3 APIs

- [ ] `POST /api/lattice/shares` - Grant access
- [ ] `GET /api/lattice/shares` - List my shares
- [ ] `DELETE /api/lattice/shares/[id]` - Revoke access
- [ ] `GET /api/lattice/shared-with-me` - Lattices shared with me
- [ ] `POST /api/lattice/shares/[id]/extend` - Extend expiry

### L7. Matching Use Cases (Priority: MEDIUM)

#### L7.1 Hiring Flow

- [ ] `src/lib/lattice/matching/hiring.ts`
  - [ ] `createRoleProfile(jobDescription): Projection`
  - [ ] `matchCandidates(projectionId, candidatePool): Match[]`
  - [ ] `checkShadowExclusions(shape, exclusions): Exclusion[]`
  - [ ] `generateFitReport(match): FitReport`

#### L7.2 Teacher-Course Matching (Education)

- [ ] `src/lib/lattice/matching/teacher.ts`
  - [ ] `deriveIdealTeacher(courseRequest): Projection`
  - [ ] `matchTeachers(projectionId, teacherPool): Match[]`
  - [ ] `checkCriticalShadows(shape): CriticalShadow[]`

#### L7.3 Team Composition

- [ ] `src/lib/lattice/matching/team.ts`
  - [ ] `analyzeTeamComposition(memberIds): TeamAnalysis`
  - [ ] `findComplementaryMember(team, need): Match[]`
  - [ ] `identifyTeamShadows(team): TeamShadow[]`

### L8. 3D Visualization (Priority: LOWER) ✅

#### L8.1 Point Cloud Renderer

- [x] `src/components/lattice/LatticeViewer.tsx` - R3F component
  - [x] Point cloud rendering (Three.js Points)
  - [x] Color-coded by skill category (9 distinct colors)
  - [x] Size by position value (larger = more extreme)
  - [x] Floating animation on load
  - [x] Hover labels with skill name, category, position
  - [x] Orbit controls (zoom, pan, rotate)
  - [x] Stars background for premium feel
  - [x] Position axis with CORE→SHADOW labels

#### L8.2 Shape Visualization

- [x] `src/components/lattice/SkillRadar.tsx` - 2D radar chart
  - [x] SVG radar with category breakdown
  - [x] Category labels with scores
  - [x] Gradient fill with glow effect
  - [x] Data point highlights
  - [x] Center score display
  - [x] Grid rings and spokes

#### L8.3 CV Export

- [x] `src/components/lattice/LatticeCV.tsx` - Downloadable CV
  - [x] Header with name, title, bio
  - [x] Mini radar chart
  - [x] Score & evidence count
  - [x] Top strengths badges
  - [x] Growth opportunities badges
  - [x] Category breakdown cards (9 cards)
  - [x] Evidence timeline
  - [x] Print/PDF export support
  - [x] Share functionality hook

#### L8.4 Demo Page

- [x] `/lattice/demo` - Interactive demo
  - [x] 3D / Radar / CV view toggle
  - [x] Customizable person name/title/bio
  - [x] Sample data visualization
  - [x] How-it-works section

### L9. Integration Points

#### L9.1 Existing System Hooks

- [ ] After AI chat → `captureEvidence()`
- [ ] After peer review → `captureEvidence()`
- [ ] After workshop completion → `captureEvidence()`
- [ ] After capstone submission → `captureEvidence()`
- [ ] After challenge attempt → `captureEvidence()`

#### L9.2 Dashboard Widgets

- [ ] Student: "My Lattice" mini-view
- [ ] Teacher: "Class Lattice Overview"
- [ ] School: "Teacher-Course Fit Matrix"
- [ ] Owner: "Hiring Pipeline with Lattice Matching"

### L10. Implementation Order

```
Week 1: L1 (Schema) + L2 (Embeddings)
   └── Add tables, set up Gemini embedding client
   
Week 2: L3 (Skills Framework) + L4 (Evidence Collection)
   └── Define skills, build collectors, evidence APIs
   
Week 3: L5 (Projection Engine)
   └── Core projection logic, shape calculation
   
Week 4: L6 (Sharing) + L7 (Matching)
   └── Privacy system, hiring/teacher matching
   
Week 5: L8 (3D Visualization) + L9 (Integration)
   └── Point cloud UI, system hooks
```

---

## 🤖 SYNAPSE COMMUNICATOR (Implemented 2026-02-04)

> AI Companion chat system with multi-tenant support

### SC1. Core Widget ✅

- [x] `CommunicatorWidget.tsx` - Floating chat bubble
  - [x] Chat/Contacts/History tabs
  - [x] Synapse AI always visible as first contact
  - [x] Message composition with multimedia support icons
  - [x] Markdown rendering for AI responses
  - [x] Memory access modal (placeholder)
  - [x] Fallback behavior when auth fails

### SC2. Conversation APIs ✅

- [x] `GET /api/communicator/contacts` - List contacts (Synapse + humans)
  - [x] Gets orgId from user's database record (not Clerk)
  - [x] Role-based visibility (CONTACT_VISIBILITY matrix)
  - [x] Synapse always returns, even on error
- [x] `GET/POST /api/communicator/conversations` - List/create conversations
  - [x] Auto-create personal org for users without one
  - [x] AI assistant conversation type
  - [x] Direct/group/broadcast/meeting/problem types
- [x] `GET/POST /api/communicator/conversations/[id]/messages` - Messages
  - [x] Anthropic SDK integration
  - [x] System prompt with Portuguese instructions
  - [x] AI response generation and storage

### SC3. Auth Fixes ✅

- [x] Removed Clerk `orgId` requirement from communicator APIs
- [x] Gets user's `organizationId` from database instead
- [x] Auto-creates personal organization on first conversation
- [x] Graceful fallback when user not in database

### SC4. Pending Improvements

- [x] MCP tools for memory operations ✅
  - [x] `query_memory` - Semantic search with embedding similarity
  - [x] `get_ledger` - Critical facts retrieval
  - [x] `remember` - Store new memory nodes
  - [x] `add_to_ledger` - Store permanent facts
  - [x] `reinforce_memory` - Adjust memory gravity
  - [x] `get_memory_stats` - Graph statistics
- [x] Tool executor with Anthropic tool_use loop ✅
- [x] Enhanced system prompt with memory guidelines ✅
- [ ] Tiered access (Platform Synapse vs BYOK)
- [ ] Real-time message notifications
- [ ] Typing indicators
- [ ] Read receipts
- [ ] File attachments

---

## 👥 TEAM & ROLE MANAGEMENT (Roadmap)

> Hierarchical organization structure with role-based access

### TM1. Team Manager `/admin/teams`

- [ ] Team CRUD (name, description, parent team)
- [ ] Team hierarchy visualization (tree view)
- [ ] Team member assignment
- [ ] Team lead designation
- [ ] Cross-team permissions
- [ ] Team-based data isolation

### TM2. Role Manager `/admin/roles`

- [ ] Role CRUD (name, permissions, hierarchy level)
- [ ] Permission matrix editor
- [ ] Role inheritance (child roles inherit parent)
- [ ] Custom permission overrides
- [ ] Role audit log
- [ ] Default role for new users

### TM3. Database Schema

- [ ] `teams` table (id, name, parent_id, lead_id, org_id)
- [ ] `team_members` table (team_id, user_id, joined_at)
- [ ] `role_hierarchy` table (parent_role, child_role)
- [ ] Indexes for hierarchy queries

### TM4. APIs

- [ ] `CRUD /api/teams`
- [ ] `POST /api/teams/[id]/members`
- [ ] `DELETE /api/teams/[id]/members/[userId]`
- [ ] `GET /api/teams/[id]/tree` - Get team hierarchy
- [ ] `CRUD /api/roles`
- [ ] `GET /api/roles/[id]/permissions`
- [ ] `PATCH /api/roles/[id]/permissions`

---

## 📱 SOCIALCRM-CLAUDE (Planned)

> AI-powered CRM enhancement for social media lead nurturing

### SCRM1. Social Listening

- [ ] Instagram DM integration
- [ ] Facebook Messenger integration
- [ ] WhatsApp Business API
- [ ] Twitter/X DM integration
- [ ] Unified inbox for all channels

### SCRM2. Lead Intelligence

- [ ] AI-powered lead scoring
- [ ] Sentiment analysis on messages
- [ ] Intent detection (inquiry, complaint, purchase)
- [ ] Conversation summarization
- [ ] Follow-up recommendation engine

### SCRM3. Automation

- [ ] Auto-response templates with AI personalization
- [ ] Lead routing rules
- [ ] Escalation triggers
- [ ] Appointment scheduling automation
- [ ] Reminder sequences

### SCRM4. Analytics

- [ ] Response time metrics
- [ ] Conversion funnel by channel
- [ ] Agent performance dashboard
- [ ] Customer satisfaction scoring
- [ ] Revenue attribution by source

---

## 📈 MKTING-CLAUDE (Planned)

> AI-powered marketing campaign management and optimization

### MKT1. Campaign Intelligence

- [ ] AI campaign idea generator
- [ ] A/B test creation wizard
- [ ] Copy optimization suggestions
- [ ] Audience targeting recommendations
- [ ] Budget allocation optimizer

### MKT2. Content Generation

- [ ] Email template AI writer
- [ ] Social post generator (multi-platform)
- [ ] Landing page copy assistant
- [ ] Ad copy variations
- [ ] Blog post outline generator

### MKT3. Performance Analysis

- [ ] Real-time campaign monitoring
- [ ] Anomaly detection (dips, spikes)
- [ ] Competitor analysis integration
- [ ] ROI prediction model
- [ ] Channel performance comparison

### MKT4. Automation & Triggers

- [ ] Behavioral trigger campaigns
- [ ] Lead nurturing sequences
- [ ] Retargeting automation
- [ ] Win-back campaigns
- [ ] Referral program automation

---

## 📋 AUDIT LOG (2026-02-04)

### Completed Today

1. ✅ Fixed Synapse Communicator 401 errors
2. ✅ Removed Clerk organization dependency from APIs
3. ✅ Auto-create personal org for users without one
4. ✅ Synapse AI chat now working end-to-end
5. ✅ Message sending and AI response generation functional
6. ✅ **MCP Memory Tools** - Full memory integration for Synapse
   - `synapse-tools.ts` - 6 MCP-compatible tool definitions
   - `synapse-executor.ts` - Tool executor with DB integration
   - Tool use loop in messages API handler
   - Enhanced system prompt with memory guidelines

### Known Issues Resolved

- ~~401 on contacts API~~ → Now gets orgId from user DB record
- ~~404 on messages POST~~ → Turbopack cache issue (restart fixed)
- ~~500 on conversations~~ → Foreign key on org_id (auto-create org)

### Files Created/Modified

- `src/lib/ai/synapse-tools.ts` - MCP tool schemas and definitions
- `src/lib/ai/synapse-executor.ts` - Tool execution logic
- `src/app/api/communicator/conversations/[id]/messages/route.ts` - Tool integration

### Next Priorities

1. ✅ ~~MCP Server for Synapse memory access~~ (DONE!)
2. ✅ ~~Knowledge Wiki & Kaizen systems~~ (DONE!)
3. 🔹 Team & Role Management system
4. 🔹 Tiered access (Platform Synapse vs BYOK)
5. 🔹 SocialCRM-CLAUDE integration planning
6. 🔹 MKTING-CLAUDE integration planning

---

## 📚 KNOWLEDGE WIKI (Implemented 2026-02-04)

> Internal knowledge base with version control and semantic search

### WK1. Database Schema ✅

- [x] `wiki_categories` - Hierarchical category tree
  - [x] Nested categories (parentId)
  - [x] Access control (visibility, allowedRoles)
  - [x] Visual metadata (icon, color)
- [x] `wiki_articles` - Knowledge articles
  - [x] Markdown content with version tracking
  - [x] Status workflow (draft → review → published)
  - [x] Metrics (viewCount, helpfulCount)
  - [x] Semantic embedding for search
  - [x] Links to procedures
- [x] `wiki_article_versions` - Version history
- [x] `wiki_article_feedback` - User reactions

### WK2. API Routes ✅

- [x] `GET/POST /api/wiki/categories` - List/create categories
- [x] `GET/POST /api/wiki/articles` - List/create articles
- [x] `GET/PUT/DELETE /api/wiki/articles/[slug]` - Single article CRUD
- [x] `POST /api/wiki/articles/[slug]?action=feedback` - Rate article

### WK3. UI ✅

- [x] `/wiki` - Wiki home with category tree
- [x] `/wiki/categories/[category]` - Category view
- [x] `/wiki/articles/[slug]` - Article viewer with feedback
- [x] `/wiki/new` - Article editor with markdown preview
- [x] `/wiki/articles/[slug]/edit` - Edit article
- [x] Navigation links for Staff, School, Owner roles
- [ ] Version diff viewer
- [ ] Semantic search integration

---

## 🛠️ KAIZEN SYSTEM (Implemented 2026-02-04)

> Toyota-style bottom-up improvement suggestions

### KZ1. Database Schema ✅

- [x] `kaizen_suggestions` - Improvement proposals
  - [x] Problem types (inefficiency, bottleneck, waste, etc.)
  - [x] Impact estimation (time, cost, quality, etc.)
  - [x] Status workflow (submitted → approved → implemented)
  - [x] Anonymous submission option
  - [x] Voting (upvotes/downvotes)
  - [x] Links to procedures, steps, wiki articles
- [x] `kaizen_votes` - User votes tracking
- [x] `kaizen_comments` - Discussion threads
- [x] `kaizen_metrics` - Before/after measurements

### KZ2. API Routes ✅

- [x] `GET/POST /api/kaizen/suggestions` - List/create suggestions
- [x] `GET/PUT /api/kaizen/suggestions/[id]` - Single suggestion CRUD
- [x] `POST /api/kaizen/suggestions/[id]?action=vote` - Vote up/down
- [x] `POST /api/kaizen/suggestions/[id]?action=review` - Staff review
- [x] `POST /api/kaizen/suggestions/[id]?action=implement` - Mark implemented
- [x] `POST /api/kaizen/suggestions/[id]?action=comment` - Add comment
- [x] `POST /api/kaizen/suggestions/[id]?action=metric` - Record measurement

### KZ3. UI ✅

- [x] `/kaizen` - Suggestion board with voting, filtering, stats
- [x] `/kaizen/new` - Submit suggestion form with problem types & impact
- [x] `/kaizen/[id]` - Suggestion detail with voting, comments, review
- [x] Navigation links for Staff, School, Owner roles
- [ ] Analytics dashboard (top contributors, impact metrics)
- [ ] Integration with process flowcharts

### KZ4. Kaizen Workflow

```
1. Anyone → Submits suggestion
2. Community → Votes (endorsement)
3. Staff+ → Reviews (approve/reject/defer)
4. Implementer → Works on approved items
5. Completion → Measures before/after metrics
6. Celebration → Recognize contributors
```

---

## 🔐 ROLE ACCESS MANAGEMENT (SAP-Style Organizational Structure)

### RAM1. Database Schema ✅

- [x] `teams` - Organizational units (department, squad, chapter, guild, tribe, project, committee)
- [x] `team_positions` - Roles/positions within teams (Manager, Lead, Member, etc.)
- [x] `team_members` - User assignments to teams with positions
- [x] `action_types` - Granular permissions/actions (wiki.article.create, kaizen.approve, etc.)
- [x] `position_permissions` - Links positions to action types with scope
- [x] `user_permission_overrides` - Individual user permission grants/revocations
- [x] `permission_groups` - Bundles of permissions (Finance Admin, Content Editor)
- [x] `permission_group_actions` - Links groups to action types
- [x] `user_group_assignments` - Assigns users to permission groups
- [x] `permission_audit_log` - Track all permission changes

### RAM2. API Layer ✅

- [x] `/api/teams` - CRUD for teams
- [x] `/api/teams/[id]` - Single team with members
- [x] `/api/positions` - CRUD for positions
- [x] `/api/actions` - Action types with seeding

### RAM3. UI Pages ✅

- [x] `/teams` - Teams list with tabs (Teams, Organograma, Positions, Permissions)
- [x] `/teams/[id]` - Team detail with member management
- [x] `/teams/permissions` - Permission matrix for positions
- [x] Org chart tab with hierarchical tree visualization + member cards
- [x] Navigation links for Staff, School, Owner roles

### RAM4. Advanced Features

**Completed:**
- [x] `hasPermission(userId, actionCode, scope?)` utility function (`/lib/permissions.ts`)
- [x] Permission check middleware for API routes (`/lib/permission-middleware.ts`)
- [x] Position permissions API (`/api/position-permissions`)
- [x] User permission overrides API (`/api/user-overrides`)
- [x] Permission groups API (`/api/permission-groups`)
- [x] Org chart visualization (SVG-based tree layout)
- [x] Audit logging for all permission changes

**Remaining:**
- [x] Automatic permission sync when position changes (`/api/members/[id]` PUT)
- [x] Bulk permission assignment UI (`/teams/permissions` with auto-save)
- [x] Permission inheritance from parent teams (in `hasPermission`)
- [x] Permission delegation workflow (`/api/delegation`)
- [x] Time-based permission expiry notifications (`/api/permission-expiry`)
- [x] Team capacity planning view (`/teams/capacity`)
- [x] Reporting structure diagram (`/teams/reporting`)

### RAM5. Permission Scopes Explained

```
own          → Can only affect own resources
team         → Can affect resources within same team
department   → Can affect resources in team + child teams
organization → Can affect all resources in organization
global       → System-wide (super admin)
```

---

## SCRM - Social CRM Integration

> Relationship Topology Engine implementing the 11-stage funnel with 3x3 Insights

### SCRM1. Database Schema ✅

**Completed:**
- [x] Extended `leads` table with SCRM fields (`funnelStage`, `funnelSegment`, `currentSentiment`, cached insights)
- [x] `leadInsights` table for 3x3 Dreams/Hobbies/Aspirations (max 3 each)
- [x] `insightCommunications` table for conversation anchoring
- [x] `leadCourseInterests` table for course interest tracking
- [x] `leadSentimentHistory` table for emotional trajectory
- [x] `leadPersonas` table for AI-generated relationship intelligence
- [x] `leadFunnelHistory` table for stage transition tracking

### SCRM2. API Endpoints ✅

**Lead Management:**
- [x] `GET /api/scrm/leads` - List leads with SCRM enrichment, segment/stage filtering
- [x] `POST /api/scrm/leads` - Create lead with initial SCRM data
- [x] `GET /api/scrm/leads/[id]` - Get lead with full enrichment (insights, persona, history)
- [x] `PUT /api/scrm/leads/[id]` - Update lead with funnel/sentiment tracking
- [x] `DELETE /api/scrm/leads/[id]` - Archive to Lost stage (soft delete)

**3x3 Insights:**
- [x] `GET /api/scrm/insights/[leadId]` - Get all insights grouped by type
- [x] `POST /api/scrm/insights/[leadId]` - Add insight (max 3 per type)
- [x] `DELETE /api/scrm/insights/[leadId]?insightId=xxx` - Remove insight

**AI Features:**
- [x] `GET /api/scrm/persona/generate?leadId=xxx` - Get existing persona
- [x] `POST /api/scrm/persona/generate` - Generate AI persona from insights (Claude)
- [x] `GET /api/scrm/sentiment/analyze?leadId=xxx` - Get sentiment history
- [x] `POST /api/scrm/sentiment/analyze` - AI sentiment analysis (Claude)
- [x] `PUT /api/scrm/sentiment/analyze` - Manual sentiment update

**CRM Analytics:**
- [x] `GET /api/scrm/crm-insights` - Funnel analytics, bottleneck detection, recommendations
- [x] `POST /api/scrm/crm-insights` - Generate AI-powered pipeline insights (Claude)

### SCRM3. UI Pages ✅

**Completed:**
- [x] `/staff/scrm` - 11-stage pipeline Kanban with segment filtering
- [x] `/staff/scrm/insights` - CRM analytics dashboard with AI insights
- [x] Navigation from Staff Dashboard to SCRM Pipeline

**UI Features:**
- [x] TOFU/MOFU/BOFU/Outcome segment KPIs
- [x] Sentiment indicators on lead cards
- [x] 3x3 Insights preview badges
- [x] Lead detail modal with insights accordion
- [x] New lead creation with funnel stage selection
- [x] Search and filtering

### SCRM4. 11-Stage Funnel

```
TOFU (Awareness Field):
  1. small_engagement     - Pequenos Engajamentos
  2. comments_conversations - Comentários/Conversas
  3. interested           - Interessados

MOFU (Consideration Field):
  4. qualifying           - Qualificando
  5. more_information     - Mais Informações
  6. events_invitations   - Eventos/Convites

BOFU (Decision Field):
  7. appointments         - Agendamentos
  8. negotiation          - Negociação
  9. counters             - Contrapropostas

Outcomes:
  10. won                 - Ganho ✅
  11. lost                - Pausado 🔄 (not deleted, frozen for future)
```

---

## COMMERCIAL OPS - Unified CRM + Sales + Marketing

> Integration of SCRM (Relationship Topology) + MarketingOS (Behavioral Intelligence) into unified Commercial Operations

### CO1. Role Architecture

**Commercial Roles (Position-based permissions):**

| Role | Primary View | Focus Area | Key Actions |
|------|-------------|------------|-------------|
| **Pre-Sales Rep** | Funnel TOFU/MOFU | Lead warming & qualification | Capture 3x3 insights, sentiment tracking |
| **Sales Rep** | Funnel MOFU/BOFU | Conversion & negotiation | Appointments, proposals, close deals |
| **Sales Manager** | Pipeline Analytics | Team performance, rules | Create funnels, automations, targets |
| **Marketing Creative** | Content Studio | Creative production | Design campaigns, landing pages, assets |
| **Marketing Analytics** | Performance Dash | Data & attribution | CAC/LTV, A/B tests, ROAS analysis |
| **Marketing Manager** | Campaign Command | Strategy & budget | Campaign orchestration, brand voice |
| **Client Success** | Portfolio View | Retention & upsell | NPS, renewal, course interests |

### CO2. Unified Pipeline Architecture

**Three Integrated Funnels:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MARKETING FUNNEL (Visitor → Lead)                  │
│  Anonymous Visitors → Sessions → Events → Identity Resolution → Lead        │
│  [Marketing Creative + Analytics]                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCRM FUNNEL (Lead → Sale)                          │
│  TOFU → MOFU → BOFU → Won/Lost                                               │
│  [Pre-Sales → Sales Rep → Sales Manager]                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LTV FUNNEL (Student → Champion)                    │
│  Onboarding → Active → At-Risk → Churning → Renewal → Upsell → Referral     │
│  [Client Success + Operations]                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### CO3. Database Schema (MarketingOS Integration)

**Phase 1 - Visitor Intelligence:**
- [ ] `visitors` table (fingerprint, firstSource, firstMedium, firstCampaign)
- [ ] `sessions` table (device, geo, referrer, landingPage, courseId)
- [ ] `behaviorEvents` table (page_view, scroll_depth, video_play, form_start, form_submit)
- [ ] Link visitors → leads on identity resolution

**Phase 2 - Landing Pages & A/B Testing:**
- [ ] `coursePages` table (slug, type, parentPageId, isVariant, trafficAllocation)
- [ ] `abTestAssignments` (visitorId, originalPageId, variantId, converted, value)
- [ ] `pageMetrics` daily aggregation (visitors, pageViews, avgTime, scrollDepth, bounceRate, CVR)

**Phase 3 - Attribution Layer:**
- [ ] Extend `leads` with firstTouch/lastTouch attribution fields
- [ ] Extend `enrollments` with attribution (firstTouchCampaign, lastTouchCampaign)
- [ ] CAC calculation per source/campaign
- [ ] LTV calculation per segment/cohort

**Phase 4 - Intelligence Engine:**
- [ ] `monitors` table (scope, metric, baseline, conditions, autoAnalyze)
- [ ] `monitorAlerts` table (triggeredCondition, analysis, diagnosis, recommendations)
- [ ] `aiInsights` table (entityType, entityId, type, confidence, recommendations)
- [ ] `heartbeats` table (schedule, sections, synthesisPrompt, deliveryChannels)

**Phase 5 - Brand System:**
- [ ] `brandSettings` per course (colors, fonts, tokens, stylePreset)
- [ ] `brandVoice` per course (personality, toneAdjectives, preferredWords, exampleCopy)
- [ ] `brandAssets` (logos, images, templates with AI metadata)

### CO4. Sales Manager Dashboard ✅

**Page:** `/staff/sales-manager`

**Funnel Rules Engine:**
- [x] Define custom funnels per course/campaign (UI ready, mock data)
- [x] Stage transition rules (auto-promote based on engagement score)
- [x] SLA alerts (lead aging, follow-up overdue)
- [ ] Assignment rules (round-robin, capacity-based, persona-fit)

**Automation Templates:**
- [x] Rule creation modal with conditions and actions
- [x] Toggle rules active/inactive
- [x] Delete rules
- [ ] Welcome sequence (lead enters TOFU)
- [ ] Nurture sequence (moves to MOFU)
- [ ] Urgency sequence (BOFU stalled > 7 days)
- [ ] Re-engagement sequence (Lost > 30 days with high 3x3)
- [ ] Upsell triggers (post-enrollment milestones)

**Performance View:**
- [x] Team pipeline by rep (table view)
- [x] Stage velocity metrics
- [x] Conversion rates by source/campaign
- [ ] Predicted close rates (AI)

**Bottleneck Detection:**
- [x] Bottlenecks tab with alerts
- [x] Link to create automation from bottleneck

### CO5. Pre-Sales View (`/staff/presales`) ✅

**Layout:**
- [x] TOFU + MOFU stages Kanban (5 columns)
- [x] Lead cards with sentiment + 3x3 preview
- [x] Quick actions: WhatsApp, Call, Email, Log Insight
- [x] Insight capture modal (Dreams/Hobbies/Aspirations)
- [x] Sentiment update with reason
- [x] Stage promotion button
- [x] Search filter

**Metrics:**
- [x] Total Leads
- [x] TOFU count with ring progress
- [x] MOFU count with ring progress
- [x] 3x3 completion rate (leads with insights)
- [x] Positive sentiment count

### CO6. Sales View (`/staff/sales`) ✅

**Layout:**
- [x] MOFU + BOFU stages Kanban (5 columns)
- [x] Deal value visible on cards
- [x] AI Persona preview badge (click to view)
- [x] 3x3 insights summary for negotiation
- [x] Quick actions: WhatsApp, Call, Generate Persona
- [x] Close deal modal (Won/Lost)
- [x] Persona view modal with generation
- [x] Stage promotion and pause actions

**Metrics:**
- [x] Pipeline Total
- [x] BOFU count with ring progress
- [x] Appointments count
- [x] In Negotiation count
- [x] Pipeline Value (calculated)

### CO7. Marketing Command (`/staff/marketing`) ✅

**4 Tabs: Analytics, Campaigns, Creative, A/B Tests**

**Analytics Dashboard:**
- [x] Aggregate KPIs (Visitors, Leads, Enrollments, Spend, CAC)
- [x] Channel performance table with icons
- [x] Visitor → Lead → Enrollment funnel visualization
- [x] Attribution by channel (pie chart style)
- [x] AI Insights alerts (best ROI, high CAC, organic strength)

**Campaign Manager:**
- [x] Active campaigns list with status badges
- [x] Budget tracking (progress bar)
- [x] CAC and ROAS per campaign
- [x] Campaign creation modal
- [x] Email sequence performance (mock data in campaigns)
- [x] UTM builder + tracking (`/staff/marketing/utm-builder`)

**Creative Studio:**
- [x] Asset cards (Image, Video, Landing Page, Copy)
- [x] Performance score per asset
- [x] Status badges (Draft, Approved, Live)
- [x] AI copy generation (`/staff/marketing/copy-generator`)
- [x] Landing page builder (`/staff/marketing/landing-builder`)
- [x] Content calendar (`/staff/marketing/calendar`)

**A/B Testing:**
- [x] Test cards with Variant A vs B
- [x] Visitor and conversion counts
- [x] CVR comparison with improvement percentage
- [x] Confidence score
- [x] Winner declaration
- [x] Statistical significance display

### CO8. CAC-LTV Pipeline Integration

**CAC Tracking:**
- [x] Campaign spend by source (`/owner/unit-economics` - Channel Breakdown Table)
- [x] Cost per visitor, lead, trial, enrollment (Funnel Visualization)
- [x] Blended CAC vs channel CAC (Metric Cards + Table)
- [x] Payback period calculation (CAC-LTV Health Gauge)

**LTV Tracking:**
- [x] Cohort analysis (enrollment month) (Cohorts Tab)
- [x] Retention curves (M1-M12 retention percentages)
- [x] Expansion revenue (upsell, cross-sell) - Unit Economics "Expansão" tab
- [x] Churn prediction (AI) (Customer Health tab with risk distribution)
- [x] Customer health score (Health Score dashboard with at-risk monitoring)

**Unit Economics View:**
- [x] CAC:LTV ratio by segment (Health Gauge with ratio)
- [x] Break-even timeline (Payback months display)
- [x] Most valuable lead sources (sorted by ROAS)
- [x] Recommended budget reallocation (AI Insights section)

### CO9. Industry Knowledge (Moat Building) - `/owner/industry-knowledge`

**Cross-Course Learning:**
- [x] `industryKnowledge` data (benchmarks, best practices, patterns - mock)
- [x] Anonymous aggregation pipeline (simulated with mock data)
- [x] Benchmark comparisons (your CVR vs industry vs top quartile)
- [x] Winning copy patterns (Headlines, CTAs, WhatsApp with effectiveness scores)
- [x] Optimal send times by vertical (Email, Instagram, WhatsApp by day)

### CO10. Implementation Phases

```
Phase 1: Role Views (Current Sprint)
├── Pre-Sales view with SCRM focus
├── Sales view with deal management
├── Sales Manager dashboard with rules
└── Navigation + permissions

Phase 2: MarketingOS Foundation
├── Visitor tracking pixel
├── Session/event capture
├── Identity resolution
└── Basic attribution

Phase 3: Landing Pages + A/B
├── Course page builder
├── Variant testing
├── Daily metrics aggregation
└── Statistical significance engine

Phase 4: Intelligence Layer
├── Monitors + alerts
├── AI insights generation
├── Heartbeat reports
└── CRM-wide recommendations

Phase 5: Brand + Content
├── Brand settings per course
├── Voice training
├── Asset management
└── AI copywriting

Phase 6: Industry Knowledge
├── Aggregation pipeline
├── Benchmark calculations
├── Pattern extraction
└── Knowledge sharing UI
```

---

