# Person Normalization Plan

## Problem Statement

Current architecture uses `users.role` as a single enum (`student | parent | teacher | staff | admin | owner | talent`), forcing a person into one box when reality is multi-dimensional:

```
❌ Current: Person → UserRecord (role: 'teacher')
   Problem: What if teacher is also a parent? Create duplicate account?

✅ Proposed: Person → Many Roles via Junction Tables
   Solution: Same person can be parent + teacher + staff
```

---

## Current Tables Affected

| Table | Current Purpose | Problem |
|-------|-----------------|---------|
| `users` | Auth identity + single role | Forces 1 role per person |
| `leads` | Potential customers | Separate from users (can't track conversion) |
| `teacherProfiles` | Teacher payment info | Tied to userId, not personId |
| `staffContracts` | Employment data | Tied to userId, not personId |
| `talentProfiles` | Job applicants | Can't link to existing users |
| `familyLinks` | Parent-student relationships | Uses userId pairs |

---

## Normalized Design

### Layer 1: Core Identity

```sql
-- The person themselves (canonical identity)
CREATE TABLE persons (
    id TEXT PRIMARY KEY,
    
    -- Identity
    firstName TEXT NOT NULL,
    lastName TEXT,
    displayName TEXT,  -- Computed or override
    
    -- Contact (can have multiple, but primary here)
    primaryEmail TEXT UNIQUE,
    primaryPhone TEXT,
    
    -- Brazilian tax
    taxId TEXT,  -- CPF or CNPJ
    taxIdType TEXT CHECK (taxIdType IN ('cpf', 'cnpj')),
    
    -- Demographics (LGPD: optional, encrypted)
    birthDate INTEGER,
    gender TEXT,
    
    -- Avatar
    avatarUrl TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'inactive', 'deceased')) DEFAULT 'active',
    
    -- Timestamps
    createdAt INTEGER DEFAULT (unixepoch()),
    updatedAt INTEGER DEFAULT (unixepoch()),
    archivedAt INTEGER
);

-- Contact methods (person can have multiple emails, phones)
CREATE TABLE personContacts (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),
    
    contactType TEXT CHECK (contactType IN ('email', 'phone', 'whatsapp', 'address')),
    contactValue TEXT NOT NULL,
    
    isPrimary INTEGER DEFAULT 0,
    isVerified INTEGER DEFAULT 0,
    verifiedAt INTEGER,
    
    -- For addresses
    addressLine1 TEXT,
    addressLine2 TEXT,
    city TEXT,
    state TEXT,
    postalCode TEXT,
    country TEXT DEFAULT 'BR',
    
    createdAt INTEGER DEFAULT (unixepoch())
);
```

### Layer 2: Auth Identity

```sql
-- Auth-linked wrapper (Clerk ID → Person)
CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- Clerk user_id (keeps compatibility)
    personId TEXT NOT NULL REFERENCES persons(id),
    
    -- Auth provider info
    authProvider TEXT DEFAULT 'clerk',
    externalId TEXT,  -- Clerk's external ID if any
    
    -- Organization context
    organizationId TEXT REFERENCES organizations(id),
    
    -- Preferences (JSON)
    preferences TEXT DEFAULT '{}',
    
    -- Session tracking
    lastSeenAt INTEGER,
    
    -- Timestamps
    createdAt INTEGER DEFAULT (unixepoch()),
    updatedAt INTEGER DEFAULT (unixepoch()),
    archivedAt INTEGER
);

-- NOTE: Removed 'role' enum - roles are now junction tables
```

### Layer 3: Role Junction Tables

```sql
-- Students (a person enrolled in courses)
CREATE TABLE studentRoles (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),
    organizationId TEXT REFERENCES organizations(id),
    
    -- Student-specific
    studentNumber TEXT,  -- School-assigned ID like "2024-0042"
    enrolledAt INTEGER DEFAULT (unixepoch()),
    graduatedAt INTEGER,
    
    -- Academic level
    currentLevelId TEXT REFERENCES levels(id),
    
    -- Status
    status TEXT CHECK (status IN ('active', 'graduated', 'withdrawn', 'suspended')) DEFAULT 'active',
    
    createdAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(personId, organizationId)  -- One student record per org
);

-- Parents/Guardians (linked to students they're responsible for)
CREATE TABLE parentRoles (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),  -- The parent
    studentPersonId TEXT NOT NULL REFERENCES persons(id),  -- The child
    organizationId TEXT REFERENCES organizations(id),
    
    -- Relationship
    relationship TEXT CHECK (relationship IN ('mother', 'father', 'guardian', 'grandparent', 'other')) DEFAULT 'guardian',
    
    -- Permissions
    isPrimaryContact INTEGER DEFAULT 0,
    canPickup INTEGER DEFAULT 1,
    canViewGrades INTEGER DEFAULT 1,
    canViewFinancial INTEGER DEFAULT 1,
    canApproveActivities INTEGER DEFAULT 1,
    receiveNotifications INTEGER DEFAULT 1,
    
    -- Financial responsibility
    isFinancialResponsible INTEGER DEFAULT 0,  -- Gets the invoices
    financialPercentage REAL DEFAULT 100,  -- For split billing
    
    createdAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(personId, studentPersonId)  -- One record per parent-child pair
);

-- Teachers (persons who teach)
CREATE TABLE teacherRoles (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),
    organizationId TEXT REFERENCES organizations(id),
    
    -- Teacher-specific
    hireDate INTEGER,
    
    -- Payment model
    paymentModel TEXT CHECK (paymentModel IN ('school_employee', 'hired_percentage', 'external_rental')) DEFAULT 'school_employee',
    revenuePercentage REAL DEFAULT 0,
    roomRentalFee REAL DEFAULT 0,
    
    -- Certifications
    certifications TEXT DEFAULT '[]',  -- JSON array
    
    -- Status
    status TEXT CHECK (status IN ('active', 'on_leave', 'terminated')) DEFAULT 'active',
    
    createdAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(personId, organizationId)
);

-- Staff (non-teaching employees)
CREATE TABLE staffRoles (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),
    organizationId TEXT REFERENCES organizations(id),
    
    -- Position
    positionTitle TEXT NOT NULL,
    department TEXT,  -- 'marketing', 'admin', 'finance', 'operations'
    
    -- Employment
    employmentType TEXT CHECK (employmentType IN ('clt', 'pj', 'contractor', 'intern')) DEFAULT 'clt',
    hireDate INTEGER,
    
    -- Salary
    baseSalary REAL,
    currency TEXT DEFAULT 'BRL',
    
    -- Status
    status TEXT CHECK (status IN ('active', 'on_leave', 'terminated')) DEFAULT 'active',
    terminatedAt INTEGER,
    
    createdAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(personId, organizationId, positionTitle)  -- Can have multiple positions
);

-- Leads (potential customers tracked in CRM)
CREATE TABLE leadRoles (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),
    organizationId TEXT REFERENCES organizations(id),
    
    -- Funnel position
    stage TEXT CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) DEFAULT 'new',
    
    -- Lead source
    source TEXT,
    campaign TEXT,
    utmSource TEXT,
    utmMedium TEXT,
    utmCampaign TEXT,
    
    -- Qualification
    temperature TEXT CHECK (temperature IN ('cold', 'warm', 'hot')) DEFAULT 'cold',
    leadScore INTEGER DEFAULT 0,
    
    -- Assignment
    assignedTo TEXT REFERENCES users(id),
    
    -- Conversion tracking
    convertedAt INTEGER,
    convertedToStudentId TEXT REFERENCES studentRoles(id),
    convertedToParentId TEXT REFERENCES parentRoles(id),
    
    -- Interests
    interestedCourses TEXT DEFAULT '[]',  -- JSON array of course IDs
    
    createdAt INTEGER DEFAULT (unixepoch()),
    updatedAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(personId, organizationId)
);

-- Talent/Applicants (job seekers via Careers portal)
CREATE TABLE talentRoles (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),
    
    -- Profile
    headline TEXT,
    bio TEXT,
    
    -- Lattice reference
    latticeId TEXT,  -- Links to Lattice HR projections
    
    -- Status
    status TEXT CHECK (status IN ('active', 'hired', 'inactive')) DEFAULT 'active',
    hiredAt INTEGER,
    hiredAsStaffId TEXT REFERENCES staffRoles(id),
    
    createdAt INTEGER DEFAULT (unixepoch())
);

-- Owners (special: full access to organization)
CREATE TABLE ownerRoles (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),
    organizationId TEXT NOT NULL REFERENCES organizations(id),
    
    -- Ownership
    ownershipPercentage REAL DEFAULT 100,
    isPrimaryOwner INTEGER DEFAULT 0,
    
    createdAt INTEGER DEFAULT (unixepoch()),
    UNIQUE(personId, organizationId)
);
```

### Layer 4: Bank Accounts (Normalized)

```sql
-- Unified bank accounts (no more duplication across profiles)
CREATE TABLE bankAccounts (
    id TEXT PRIMARY KEY,
    personId TEXT NOT NULL REFERENCES persons(id),
    
    -- Account details
    accountName TEXT,  -- "Conta Principal", "Conta PJ"
    
    bankCode TEXT,  -- Brazilian bank code (341 = Itaú, etc.)
    bankName TEXT,
    agency TEXT,
    accountNumber TEXT,
    accountType TEXT CHECK (accountType IN ('checking', 'savings', 'salary')),
    
    -- PIX
    pixKey TEXT,
    pixKeyType TEXT CHECK (pixKeyType IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
    
    -- Verification
    isVerified INTEGER DEFAULT 0,
    verifiedAt INTEGER,
    
    -- Usage
    isPrimary INTEGER DEFAULT 0,
    forPayroll INTEGER DEFAULT 1,  -- Use for salary payments
    forPayouts INTEGER DEFAULT 1,  -- Use for teacher/contractor payouts
    
    createdAt INTEGER DEFAULT (unixepoch())
);
```

---

## Migration Strategy

### Phase 1: Create New Tables (Non-Breaking)
1. Create `persons` table
2. Create role junction tables (`studentRoles`, `parentRoles`, etc.)
3. Create `bankAccounts` unified table
4. Keep old tables running

### Phase 2: Backfill
```typescript
// For each existing user
async function migrateUser(user) {
    // 1. Create person record
    const person = await db.insert(persons).values({
        id: generateUUID(),
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        primaryEmail: user.email,
    }).returning();
    
    // 2. Update user to reference person
    await db.update(users)
        .set({ personId: person.id })
        .where(eq(users.id, user.id));
    
    // 3. Create role record based on old role
    switch (user.role) {
        case 'student':
            await db.insert(studentRoles).values({
                personId: person.id,
                organizationId: user.organizationId,
            });
            break;
        case 'parent':
            // Need to also migrate familyLinks
            break;
        case 'teacher':
            // Merge with teacherProfiles
            break;
        // etc.
    }
}
```

### Phase 3: Update Queries
- Replace `users.role === 'teacher'` with `JOIN teacherRoles`
- Replace `familyLinks` with `parentRoles`
- Replace `teacherProfiles` with `teacherRoles` + `bankAccounts`

### Phase 4: Remove Old Columns
- Remove `users.role` enum column
- Remove `users.name`, `users.email`, `users.avatarUrl` (now in `persons`)
- Drop redundant tables

---

## Benefits

| Before | After |
|--------|-------|
| Person is one role | Person can be parent + teacher + staff |
| Lead is separate entity | Lead links to person (tracks conversion) |
| Duplicate bank accounts | Single `bankAccounts` table |
| `familyLinks` is confusing | `parentRoles` is explicit |
| Role change = new account | Role change = add junction record |

---

## API Impact

### Before
```typescript
// Get user role
const user = await getUser(id);
if (user.role === 'teacher') { ... }
```

### After
```typescript
// Get all roles for a person
const roles = await getPersonRoles(personId);
if (roles.teacher) { ... }
if (roles.parent) { ... }
if (roles.staff?.department === 'marketing') { ... }

// Helper function
async function getPersonRoles(personId: string) {
    const [student, parent, teacher, staff, lead, talent, owner] = await Promise.all([
        db.query.studentRoles.findFirst({ where: eq(studentRoles.personId, personId) }),
        db.query.parentRoles.findMany({ where: eq(parentRoles.personId, personId) }),
        db.query.teacherRoles.findFirst({ where: eq(teacherRoles.personId, personId) }),
        db.query.staffRoles.findMany({ where: eq(staffRoles.personId, personId) }),
        db.query.leadRoles.findFirst({ where: eq(leadRoles.personId, personId) }),
        db.query.talentRoles.findFirst({ where: eq(talentRoles.personId, personId) }),
        db.query.ownerRoles.findFirst({ where: eq(ownerRoles.personId, personId) }),
    ]);
    
    return { student, parent, teacher, staff, lead, talent, owner };
}
```

---

## Files to Update

1. `src/lib/db/schema.ts` - Add new tables
2. `src/lib/db/migrations/` - Create migration scripts
3. `src/lib/permissions.ts` - Update role checks
4. `src/middleware.ts` - Update role-based routing
5. All API routes using `user.role`
6. All dashboard components using `user.role`

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Create new schema tables | 1 hour |
| Write backfill migration | 2 hours |
| Update permission system | 3 hours |
| Update API routes | 4 hours |
| Update frontend components | 4 hours |
| Testing | 2 hours |
| **Total** | **~16 hours** |

---

## Decision Points

1. **Should `persons` be separate from `users`?**
   - YES: Allows persons without auth accounts (e.g., children, deceased parents)
   - NO: Simpler but less flexible

2. **Should lead conversion delete the leadRole?**
   - Keep for history (recommended) OR soft-delete

3. **Should we migrate immediately or create abstraction layer first?**
   - Recomm: Abstraction layer first, then migrate behind it
