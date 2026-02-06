# SCHOOL.md - Node Zero School Operations

> Extends the Intelligence Course platform into a full school management system for Node Zero language school. Replaces franchise SaaS.

---

## Overview

Node Zero needs:
1. **Course delivery** (already built for Intelligence course)
2. **School operations** (scheduling, attendance, rooms)
3. **Financial** (billing, payments, teacher payroll)
4. **CRM & Marketing** (leads, campaigns, enrollment funnel)
5. **Communication** (parent/student/teacher messaging)

---

## Schema Extensions

### 1. SCHOOL OPERATIONS

```sql
-- ============================================================================
-- PHYSICAL SPACES
-- ============================================================================

CREATE TABLE rooms (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    name            TEXT NOT NULL,           -- "Sala 1", "Lab", "Online"
    capacity        INTEGER DEFAULT 15,
    
    -- Type
    room_type       TEXT DEFAULT 'classroom' CHECK (room_type IN (
        'classroom', 'lab', 'auditorium', 'online', 'external'
    )),
    
    -- For online rooms
    default_meet_url TEXT,                   -- Google Meet / Zoom link
    
    -- Location details
    floor           TEXT,
    building        TEXT,
    
    -- Amenities as JSON
    amenities       TEXT DEFAULT '[]',       -- ["projector", "whiteboard", "ac"]
    
    is_active       INTEGER DEFAULT 1,
    created_at      INTEGER DEFAULT (unixepoch())
);

-- ============================================================================
-- TERMS / ENROLLMENT PERIODS
-- ============================================================================

CREATE TABLE terms (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    name            TEXT NOT NULL,           -- "2026.1", "Verão 2026"
    
    -- Dates
    enrollment_opens  INTEGER,               -- When people can sign up
    enrollment_closes INTEGER,
    classes_start     INTEGER,
    classes_end       INTEGER,
    
    -- Status
    status          TEXT DEFAULT 'planning' CHECK (status IN (
        'planning', 'enrollment', 'active', 'completed'
    )),
    
    is_current      INTEGER DEFAULT 0,       -- Only one active at a time
    
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_terms_org ON terms(organization_id);
CREATE INDEX idx_terms_current ON terms(organization_id, is_current) WHERE is_current = 1;

-- ============================================================================
-- COURSE TYPES & LEVELS (Language School Specific)
-- ============================================================================

-- Extend courses table concept
CREATE TABLE course_types (
    id              TEXT PRIMARY KEY,        -- 'english', 'spanish', 'ai_literacy', 'workshop'
    name            TEXT NOT NULL,
    
    -- Structure
    has_levels      INTEGER DEFAULT 0,       -- Language courses have A1-C2
    has_modules     INTEGER DEFAULT 1,       -- Most courses have modules
    
    -- Scheduling defaults
    default_duration_weeks  INTEGER DEFAULT 24,
    default_hours_per_week  REAL DEFAULT 2,
    
    -- Pricing defaults
    default_monthly_price   INTEGER,         -- In cents (R$)
    
    created_at      INTEGER DEFAULT (unixepoch())
);

INSERT INTO course_types (id, name, has_levels, default_duration_weeks, default_hours_per_week) VALUES
('english', 'Inglês', 1, 24, 2),
('spanish', 'Espanhol', 1, 24, 2),
('ai_literacy', 'Inteligência', 0, 16, 2),
('workshop', 'Workshop', 0, 1, 3),
('private', 'Aula Particular', 0, NULL, 1);

CREATE TABLE levels (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    course_type_id  TEXT NOT NULL REFERENCES course_types(id),
    
    code            TEXT NOT NULL,           -- "A1", "A2", "B1", "B2", "C1", "C2"
    name            TEXT NOT NULL,           -- "Básico 1", "Intermediário"
    
    order_index     INTEGER NOT NULL,
    
    -- Prerequisites
    prerequisite_level_id TEXT REFERENCES levels(id),
    
    -- Duration
    estimated_hours INTEGER,
    
    UNIQUE(course_type_id, code)
);

-- Seed CEFR levels for English
INSERT INTO levels (id, course_type_id, code, name, order_index, estimated_hours) VALUES
('en-a1', 'english', 'A1', 'Básico 1', 1, 60),
('en-a2', 'english', 'A2', 'Básico 2', 2, 60),
('en-b1', 'english', 'B1', 'Intermediário 1', 3, 80),
('en-b2', 'english', 'B2', 'Intermediário 2', 4, 80),
('en-c1', 'english', 'C1', 'Avançado', 5, 100),
('en-c2', 'english', 'C2', 'Proficiente', 6, 100);

-- ============================================================================
-- SCHEDULING
-- ============================================================================

CREATE TABLE schedules (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    class_id        TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    room_id         TEXT REFERENCES rooms(id),
    
    -- Recurrence
    day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time      TEXT NOT NULL,           -- "19:00" (24h format)
    end_time        TEXT NOT NULL,           -- "20:30"
    
    -- Validity period (for term-based scheduling)
    valid_from      INTEGER,
    valid_until     INTEGER,
    
    -- Exceptions handled separately
    is_active       INTEGER DEFAULT 1,
    
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_schedules_class ON schedules(class_id) WHERE is_active = 1;
CREATE INDEX idx_schedules_room ON schedules(room_id, day_of_week) WHERE is_active = 1;

-- Schedule exceptions (holidays, makeups, cancellations)
CREATE TABLE schedule_exceptions (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    schedule_id     TEXT REFERENCES schedules(id),
    class_id        TEXT REFERENCES classes(id),
    
    -- The affected date
    exception_date  INTEGER NOT NULL,        -- Unix timestamp (date only)
    
    -- Type
    exception_type  TEXT NOT NULL CHECK (exception_type IN (
        'cancelled',     -- No class
        'rescheduled',   -- Moved to different time
        'makeup',        -- Extra class
        'holiday',       -- School-wide closure
        'room_change'    -- Different room
    )),
    
    -- For rescheduled/makeup
    new_room_id     TEXT REFERENCES rooms(id),
    new_start_time  TEXT,
    new_end_time    TEXT,
    
    reason          TEXT,
    
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_exceptions_date ON schedule_exceptions(exception_date);
CREATE INDEX idx_exceptions_class ON schedule_exceptions(class_id);

-- ============================================================================
-- ATTENDANCE
-- ============================================================================

CREATE TABLE class_sessions (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    class_id        TEXT NOT NULL REFERENCES classes(id),
    schedule_id     TEXT REFERENCES schedules(id),
    
    -- When
    session_date    INTEGER NOT NULL,
    start_time      TEXT NOT NULL,
    end_time        TEXT NOT NULL,
    
    -- Where
    room_id         TEXT REFERENCES rooms(id),
    
    -- Status
    status          TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'cancelled'
    )),
    
    -- Content covered (optional)
    lesson_id       TEXT REFERENCES lessons(id),
    notes           TEXT,
    
    -- Teacher (can differ from class.teacher_id for subs)
    teacher_id      TEXT REFERENCES users(id),
    
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_sessions_class ON class_sessions(class_id, session_date DESC);
CREATE INDEX idx_sessions_date ON class_sessions(session_date);
CREATE INDEX idx_sessions_teacher ON class_sessions(teacher_id, session_date);

CREATE TABLE attendance (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id      TEXT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id),
    
    -- Status
    status          TEXT NOT NULL CHECK (status IN (
        'present', 'absent', 'late', 'excused', 'makeup'
    )),
    
    -- Timing
    arrived_at      INTEGER,                 -- Actual arrival time
    left_at         INTEGER,
    
    -- Notes
    notes           TEXT,
    excuse_reason   TEXT,
    
    -- Who marked it
    marked_by       TEXT REFERENCES users(id),
    marked_at       INTEGER DEFAULT (unixepoch()),
    
    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_user ON attendance(user_id, status);

-- ============================================================================
-- PLACEMENT TESTS
-- ============================================================================

CREATE TABLE placement_tests (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    course_type_id  TEXT NOT NULL REFERENCES course_types(id),
    
    name            TEXT NOT NULL,
    description     TEXT,
    
    -- Test content (JSON structure)
    sections        TEXT NOT NULL,           -- JSON: [{name, questions: [...]}]
    
    -- Scoring
    max_score       INTEGER NOT NULL,
    level_thresholds TEXT NOT NULL,          -- JSON: {"A1": 0, "A2": 20, "B1": 40, ...}
    
    is_active       INTEGER DEFAULT 1,
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE TABLE placement_results (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    test_id         TEXT NOT NULL REFERENCES placement_tests(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    
    -- Results
    score           INTEGER NOT NULL,
    max_score       INTEGER NOT NULL,
    
    -- Assigned level
    recommended_level_id TEXT REFERENCES levels(id),
    
    -- Section breakdown
    section_scores  TEXT,                    -- JSON: {"listening": 15, "reading": 20, ...}
    
    -- Override
    final_level_id  TEXT REFERENCES levels(id),
    override_reason TEXT,
    overridden_by   TEXT REFERENCES users(id),
    
    taken_at        INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_placement_user ON placement_results(user_id);
```

---

### 2. FINANCIAL

```sql
-- ============================================================================
-- PRICING & PRODUCTS
-- ============================================================================

CREATE TABLE products (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    name            TEXT NOT NULL,
    description     TEXT,
    
    -- Type
    product_type    TEXT NOT NULL CHECK (product_type IN (
        'tuition',       -- Monthly course fee
        'enrollment',    -- One-time enrollment fee
        'material',      -- Books, workbooks
        'exam',          -- Certification exams
        'workshop',      -- One-off workshops
        'private',       -- Private lesson packages
        'other'
    )),
    
    -- Pricing
    price_cents     INTEGER NOT NULL,        -- In centavos (R$)
    currency        TEXT DEFAULT 'BRL',
    
    -- Recurrence
    is_recurring    INTEGER DEFAULT 0,
    recurrence_interval TEXT,                -- 'monthly', 'quarterly', 'yearly'
    
    -- Linkage
    course_id       TEXT REFERENCES courses(id),
    course_type_id  TEXT REFERENCES course_types(id),
    level_id        TEXT REFERENCES levels(id),
    
    is_active       INTEGER DEFAULT 1,
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_products_org ON products(organization_id) WHERE is_active = 1;
CREATE INDEX idx_products_type ON products(product_type) WHERE is_active = 1;

-- ============================================================================
-- DISCOUNTS & PROMOTIONS
-- ============================================================================

CREATE TABLE discounts (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    name            TEXT NOT NULL,
    code            TEXT UNIQUE,             -- Promo code (optional)
    
    -- Type
    discount_type   TEXT NOT NULL CHECK (discount_type IN (
        'percentage',    -- 10% off
        'fixed',         -- R$50 off
        'family',        -- Second child discount
        'early_bird',    -- Early enrollment
        'referral',      -- Referred by existing student
        'scholarship',   -- Need-based
        'loyalty'        -- Returning student
    )),
    
    -- Value
    percentage      REAL,                    -- For percentage discounts (0.10 = 10%)
    fixed_amount    INTEGER,                 -- For fixed discounts (in cents)
    
    -- Conditions
    min_purchase    INTEGER,                 -- Minimum purchase to apply
    applies_to      TEXT DEFAULT '[]',       -- JSON: ["tuition", "material"] or [] for all
    
    -- Limits
    max_uses        INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    current_uses    INTEGER DEFAULT 0,
    
    -- Validity
    valid_from      INTEGER,
    valid_until     INTEGER,
    
    is_active       INTEGER DEFAULT 1,
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_discounts_code ON discounts(code) WHERE code IS NOT NULL AND is_active = 1;

-- ============================================================================
-- INVOICES (Enhanced from existing)
-- ============================================================================

-- Note: This extends the existing invoices table with invoice_items

CREATE TABLE invoice_items (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    invoice_id      TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- What
    description     TEXT NOT NULL,
    product_id      TEXT REFERENCES products(id),
    
    -- Pricing
    quantity        INTEGER DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_cents     INTEGER NOT NULL,
    
    -- Period (for recurring items)
    period_start    INTEGER,
    period_end      INTEGER,
    
    -- Linkage
    class_id        TEXT REFERENCES classes(id),
    
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_invoice_items ON invoice_items(invoice_id);

-- ============================================================================
-- TEACHER PAYROLL
-- ============================================================================

CREATE TABLE teacher_contracts (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    teacher_id      TEXT NOT NULL REFERENCES users(id),
    
    -- Contract type
    contract_type   TEXT NOT NULL CHECK (contract_type IN (
        'clt',           -- Full employment
        'pj',            -- Contractor
        'freelance',     -- Per-class
        'volunteer'
    )),
    
    -- Compensation
    base_salary_cents INTEGER,               -- For CLT/PJ
    hourly_rate_cents INTEGER,               -- For freelance
    commission_rate   REAL,                  -- Percentage of tuition
    
    -- Hours
    min_hours_week  REAL,
    max_hours_week  REAL,
    
    -- Validity
    starts_at       INTEGER NOT NULL,
    ends_at         INTEGER,
    
    -- Status
    status          TEXT DEFAULT 'active' CHECK (status IN (
        'draft', 'active', 'suspended', 'terminated'
    )),
    
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_contracts_teacher ON teacher_contracts(teacher_id) WHERE status = 'active';
```

---

### 3. CRM & MARKETING

```sql
-- ============================================================================
-- LEADS
-- ============================================================================

CREATE TABLE leads (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    -- Contact info
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    whatsapp        TEXT,
    
    -- Source tracking
    source          TEXT CHECK (source IN (
        'website', 'instagram', 'facebook', 'google', 'referral', 
        'walk_in', 'event', 'partner', 'other'
    )),
    source_detail   TEXT,                    -- Campaign name, referrer name, etc.
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    
    -- Interest
    interested_in   TEXT DEFAULT '[]',       -- JSON: ["english", "ai_literacy"]
    current_level   TEXT,                    -- Self-reported
    preferred_schedule TEXT,                 -- "evenings", "weekends", etc.
    
    -- Status
    status          TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'qualified', 'trial_scheduled', 
        'trial_completed', 'proposal_sent', 'enrolled', 
        'lost', 'inactive'
    )),
    
    -- Assignment
    assigned_to     TEXT REFERENCES users(id),
    
    -- For existing students' family
    referred_by_user_id TEXT REFERENCES users(id),
    
    -- Conversion
    converted_to_user_id TEXT REFERENCES users(id),
    converted_at    INTEGER,
    
    -- Notes
    notes           TEXT,
    
    -- Timestamps
    last_contact_at INTEGER,
    next_followup_at INTEGER,
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_leads_status ON leads(status) WHERE status NOT IN ('enrolled', 'lost');
CREATE INDEX idx_leads_assigned ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_leads_followup ON leads(next_followup_at) WHERE next_followup_at IS NOT NULL;

-- ============================================================================
-- LEAD INTERACTIONS
-- ============================================================================

CREATE TABLE lead_interactions (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    lead_id         TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Type
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'call', 'whatsapp', 'email', 'sms', 'visit', 'meeting', 'note'
    )),
    
    -- Direction
    direction       TEXT CHECK (direction IN ('inbound', 'outbound')),
    
    -- Content
    subject         TEXT,
    content         TEXT,
    
    -- Outcome
    outcome         TEXT,                    -- "interested", "callback requested", "not interested"
    
    -- Who
    created_by      TEXT REFERENCES users(id),
    
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_interactions_lead ON lead_interactions(lead_id, created_at DESC);

-- ============================================================================
-- TRIAL CLASSES
-- ============================================================================

CREATE TABLE trial_classes (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    lead_id         TEXT REFERENCES leads(id),
    
    -- If already a user
    user_id         TEXT REFERENCES users(id),
    
    -- What class to trial
    class_id        TEXT REFERENCES classes(id),
    session_id      TEXT REFERENCES class_sessions(id),
    
    -- Or schedule a dedicated trial
    scheduled_date  INTEGER,
    scheduled_time  TEXT,
    room_id         TEXT REFERENCES rooms(id),
    teacher_id      TEXT REFERENCES users(id),
    
    -- Status
    status          TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled'
    )),
    
    -- Feedback
    feedback_score  INTEGER CHECK (feedback_score BETWEEN 1 AND 5),
    feedback_notes  TEXT,
    teacher_notes   TEXT,
    
    -- Outcome
    outcome         TEXT CHECK (outcome IN (
        'enrolled', 'thinking', 'not_interested', 'wrong_level', 'schedule_conflict', 'price'
    )),
    
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_trials_lead ON trial_classes(lead_id);
CREATE INDEX idx_trials_date ON trial_classes(scheduled_date) WHERE status IN ('scheduled', 'confirmed');

-- ============================================================================
-- MARKETING CAMPAIGNS
-- ============================================================================

CREATE TABLE campaigns (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    name            TEXT NOT NULL,
    description     TEXT,
    
    -- Type
    campaign_type   TEXT NOT NULL CHECK (campaign_type IN (
        'enrollment',    -- New student acquisition
        'retention',     -- Keep existing students
        'reactivation',  -- Win back former students
        'upsell',        -- Additional courses/services
        'referral',      -- Student referral program
        'event',         -- Workshop, open house
        'seasonal'       -- Holiday, back to school
    )),
    
    -- Channels
    channels        TEXT DEFAULT '[]',       -- JSON: ["email", "whatsapp", "instagram"]
    
    -- Budget
    budget_cents    INTEGER,
    spent_cents     INTEGER DEFAULT 0,
    
    -- Dates
    starts_at       INTEGER,
    ends_at         INTEGER,
    
    -- Targeting
    target_audience TEXT,                    -- JSON: criteria for who to target
    
    -- Goals
    goal_leads      INTEGER,
    goal_enrollments INTEGER,
    goal_revenue_cents INTEGER,
    
    -- Results (updated periodically)
    actual_leads    INTEGER DEFAULT 0,
    actual_enrollments INTEGER DEFAULT 0,
    actual_revenue_cents INTEGER DEFAULT 0,
    
    -- Status
    status          TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
    )),
    
    created_by      TEXT REFERENCES users(id),
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_campaigns_status ON campaigns(status, starts_at);

-- Link leads to campaigns
CREATE TABLE campaign_leads (
    campaign_id     TEXT NOT NULL REFERENCES campaigns(id),
    lead_id         TEXT NOT NULL REFERENCES leads(id),
    
    -- Attribution
    attributed_at   INTEGER DEFAULT (unixepoch()),
    converted       INTEGER DEFAULT 0,
    
    PRIMARY KEY (campaign_id, lead_id)
);

-- ============================================================================
-- EMAIL TEMPLATES
-- ============================================================================

CREATE TABLE email_templates (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    name            TEXT NOT NULL,
    
    -- Type
    template_type   TEXT NOT NULL CHECK (template_type IN (
        'marketing',     -- Campaigns
        'transactional', -- Invoices, receipts
        'notification',  -- Reminders, alerts
        'system'         -- Password reset, etc.
    )),
    
    -- Trigger (for automated)
    trigger_event   TEXT,                    -- 'invoice_created', 'class_reminder', etc.
    
    -- Content
    subject         TEXT NOT NULL,
    body_html       TEXT NOT NULL,
    body_text       TEXT,
    
    -- Variables available
    variables       TEXT DEFAULT '[]',       -- JSON: ["student_name", "class_name", ...]
    
    is_active       INTEGER DEFAULT 1,
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

-- ============================================================================
-- REFERRAL PROGRAM
-- ============================================================================

CREATE TABLE referrals (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    -- Referrer (existing student)
    referrer_id     TEXT NOT NULL REFERENCES users(id),
    
    -- Referred (new lead/student)
    lead_id         TEXT REFERENCES leads(id),
    referred_user_id TEXT REFERENCES users(id),
    
    -- Status
    status          TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',       -- Lead created
        'qualified',     -- Lead qualified
        'enrolled',      -- Became student
        'rewarded'       -- Referrer got reward
    )),
    
    -- Rewards
    referrer_reward_type TEXT,               -- 'discount', 'credit', 'gift'
    referrer_reward_value INTEGER,           -- Amount in cents
    referrer_reward_applied INTEGER DEFAULT 0,
    
    referred_reward_type TEXT,
    referred_reward_value INTEGER,
    referred_reward_applied INTEGER DEFAULT 0,
    
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
```

---

### 4. ENROLLMENTS (Tying it all together)

```sql
-- ============================================================================
-- ENROLLMENTS
-- ============================================================================

CREATE TABLE enrollments (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    -- Who
    user_id         TEXT NOT NULL REFERENCES users(id),
    
    -- What
    class_id        TEXT NOT NULL REFERENCES classes(id),
    term_id         TEXT REFERENCES terms(id),
    
    -- From lead
    lead_id         TEXT REFERENCES leads(id),
    trial_id        TEXT REFERENCES trial_classes(id),
    
    -- Status
    status          TEXT DEFAULT 'active' CHECK (status IN (
        'pending',       -- Awaiting payment
        'active',        -- Currently enrolled
        'paused',        -- Temporary hold
        'completed',     -- Finished the course
        'dropped',       -- Left mid-term
        'transferred'    -- Moved to different class
    )),
    
    -- Dates
    enrolled_at     INTEGER DEFAULT (unixepoch()),
    starts_at       INTEGER,
    ends_at         INTEGER,
    dropped_at      INTEGER,
    
    -- Drop info
    drop_reason     TEXT,
    
    -- Transferred
    transferred_to_enrollment_id TEXT REFERENCES enrollments(id),
    
    -- Notes
    notes           TEXT,
    
    created_at      INTEGER DEFAULT (unixepoch()),
    updated_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id, status);
CREATE INDEX idx_enrollments_class ON enrollments(class_id, status);
CREATE INDEX idx_enrollments_term ON enrollments(term_id);

-- ============================================================================
-- WAITING LISTS
-- ============================================================================

CREATE TABLE waitlist (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Who
    user_id         TEXT REFERENCES users(id),
    lead_id         TEXT REFERENCES leads(id),
    
    -- For what
    class_id        TEXT REFERENCES classes(id),
    course_type_id  TEXT REFERENCES course_types(id),
    level_id        TEXT REFERENCES levels(id),
    preferred_schedule TEXT,                 -- "Monday evenings"
    
    -- Status
    status          TEXT DEFAULT 'waiting' CHECK (status IN (
        'waiting', 'notified', 'enrolled', 'expired', 'cancelled'
    )),
    
    -- When notified
    notified_at     INTEGER,
    expires_at      INTEGER,                 -- How long they have to respond
    
    position        INTEGER,                 -- Queue position
    
    created_at      INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_waitlist_class ON waitlist(class_id, position) WHERE status = 'waiting';

-- ============================================================================
-- FAMILY LINKS
-- ============================================================================

CREATE TABLE family_links (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    parent_id       TEXT NOT NULL REFERENCES users(id),
    student_id      TEXT NOT NULL REFERENCES users(id),
    
    -- Relationship
    relationship    TEXT DEFAULT 'parent' CHECK (relationship IN (
        'parent', 'guardian', 'grandparent', 'sibling', 'other'
    )),
    
    -- Permissions
    can_view_progress   INTEGER DEFAULT 1,
    can_view_grades     INTEGER DEFAULT 1,
    can_pay_invoices    INTEGER DEFAULT 1,
    can_communicate     INTEGER DEFAULT 1,
    is_primary_contact  INTEGER DEFAULT 0,
    
    created_at      INTEGER DEFAULT (unixepoch()),
    
    UNIQUE(parent_id, student_id)
);

CREATE INDEX idx_family_parent ON family_links(parent_id);
CREATE INDEX idx_family_student ON family_links(student_id);
```

---

## Role Extensions

The existing `users.role` field needs expansion:

| Role | Access |
|------|--------|
| `student` | Dashboard, courses, playground, own progress |
| `parent` | Children's progress, financial portal, messaging |
| `teacher` | Classes they teach, attendance, grades, student progress |
| `staff` | CRM, leads, front desk operations, limited financial |
| `admin` | Full school operations, reports, settings |
| `owner` | Everything, including financial reports, payroll |

---

## Dashboard Views by Role

### Student Dashboard
- Current classes & schedule
- Progress in each course
- Upcoming sessions
- Prompt playground access
- Assignments due

### Parent Dashboard  
- Children's cards (progress summary each)
- Attendance overview
- Financial summary (invoices, payments)
- Direct message to teacher
- Report cards

### Teacher Dashboard
- Today's classes
- Attendance entry
- Student list with progress
- Gradebook
- Message parents/students

### Staff Dashboard
- Lead pipeline (CRM)
- Trial schedule
- Front desk check-in
- Waitlist management
- Basic reports

### Admin Dashboard
- Revenue overview
- Enrollment stats
- Campaign performance
- Defaulters list
- Teacher workload
- Room utilization

### Owner Dashboard
- All admin features
- Payroll summary
- Profit/loss
- Year-over-year comparison
- Strategic reports

---

## Marketing Features

### 1. Lead Capture Forms
- Embeddable forms for website
- Instagram bio link page
- WhatsApp auto-response integration

### 2. Automated Sequences
```
New Lead → Welcome email (immediate)
         → WhatsApp intro (1 hour)
         → Trial invite (24 hours)
         → Followup call task (3 days)
```

### 3. Campaign Analytics
- Lead source attribution
- Cost per lead
- Conversion rates by source
- ROI per campaign

### 4. Referral Program
- Unique referral codes per student
- Track referral → enrollment
- Automated rewards (discount on next invoice)

### 5. Re-enrollment Campaigns
- Identify students nearing term end
- Automated renewal reminders
- Early bird discounts

---

## Integration Points

### Payment Gateways
- **Stripe** - Credit cards, recurring
- **Pagar.me / Asaas** - PIX, Boleto (Brazil-specific)
- Manual entry for cash/transfer

### Communication
- **Resend** - Transactional email
- **WhatsApp Business API** - Messaging
- **Push notifications** - Mobile app (future)

### Calendar
- Google Calendar sync for schedules
- iCal export for students

---

## Summary

This extends the platform from "AI literacy course" to "full school management":

| Module | Tables Added |
|--------|-------------|
| School Ops | rooms, terms, schedules, schedule_exceptions, class_sessions, attendance, placement_tests, placement_results |
| Financial | products, discounts, invoice_items, teacher_contracts |
| CRM | leads, lead_interactions, trial_classes, campaigns, campaign_leads, email_templates, referrals |
| Enrollment | enrollments, waitlist, family_links |
| Course Types | course_types, levels |

**Total new tables: ~25**
**Combined with existing: ~55 tables**

This handles everything a language school needs to operate without the franchise SaaS.
