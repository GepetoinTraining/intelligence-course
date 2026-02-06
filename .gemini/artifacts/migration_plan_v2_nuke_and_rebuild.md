# MIGRATION PLAN v2: Nuke & Rebuild Identity System

> **Context**: Pre-production, no real data. Database can be destroyed and rebuilt.
> **Goal**: Clean identity architecture where `persons` is the canonical identity, `users` is a thin Clerk auth bridge, and all 88 tables point to `persons.id` instead of `users.id`.
> **Owner Bootstrap**: Pedro (SaaS owner + school owner) must have an IN to the platform at all times.
> **Executor**: Claude Code (Antigravity, unlimited usage)

---

## TABLE OF CONTENTS

1. [Phase 0: Owner Bootstrap & Safety Net](#phase-0)
2. [Phase 1: Nuke the Database](#phase-1)
3. [Phase 2: Rebuild Schema — Identity Layer](#phase-2)
4. [Phase 3: Rebuild Schema — All 88 Tables](#phase-3)
5. [Phase 4: Rewire Auth Flow](#phase-4)
6. [Phase 5: Rewire All API Routes](#phase-5)
7. [Phase 6: Rewire All Client Hooks & Components](#phase-6)
8. [Phase 7: Remove Eco-Escola Hardcoding](#phase-7)
9. [Phase 8: Seed Script — Dynamic Multi-Tenant](#phase-8)
10. [Phase 9: Fix Middleware](#phase-9)
11. [Phase 10: Smoke Test Checklist](#phase-10)
12. [Appendix A: Complete Table Inventory (88 tables)](#appendix-a)
13. [Appendix B: Complete API Route Inventory (112+ files)](#appendix-b)
14. [Appendix C: Complete Client Hook/Component Inventory](#appendix-c)

---

## <a id="phase-0"></a> PHASE 0: Owner Bootstrap & Safety Net

### Goal
Pedro must NEVER be locked out. Before nuking anything, ensure the platform has a bootstrap mechanism.

### 0.1 Create Bootstrap Seed Script

Create `scripts/bootstrap-owner.ts`:

```typescript
/**
 * Bootstrap script: Creates the platform org (NodeZero) and the owner person/user.
 * Run after any database nuke: `npx tsx scripts/bootstrap-owner.ts`
 *
 * This script is ENVIRONMENT-AWARE:
 * - Reads OWNER_EMAIL, OWNER_NAME from .env (or defaults)
 * - Creates the 'platform' organization (NodeZero)
 * - Creates a person record for the owner
 * - Creates a user record linked to that person
 * - Assigns owner role via ownerRoles junction table
 * - Creates organizationMembership with role='owner'
 * - Optionally creates a second org (school) if BOOTSTRAP_SCHOOL_SLUG is set
 */
```

**Environment Variables** (add to `.env.example`):
```
# Bootstrap
BOOTSTRAP_OWNER_EMAIL=pedro@nodezero.com.br
BOOTSTRAP_OWNER_NAME=Pedro
BOOTSTRAP_OWNER_CLERK_ID=       # Fill after first Clerk sign-in
BOOTSTRAP_PLATFORM_SLUG=nodezero
BOOTSTRAP_SCHOOL_SLUG=           # Optional: e.g., eco-escola
BOOTSTRAP_SCHOOL_NAME=           # Optional: e.g., Eco Escola
```

**Script Logic:**
1. Check if platform org exists → skip or create
2. Generate person UUID for owner
3. Insert into `persons` (firstName, primaryEmail, status='active')
4. Insert into `users` (id=CLERK_ID or placeholder, personId=above, onboardingCompleted=true)
5. Insert into `ownerRoles` (personId, organizationId=platform, isPrimaryOwner=true)
6. Insert into `organizationMemberships` (personId, organizationId=platform, role='owner', status='active')
7. If BOOTSTRAP_SCHOOL_SLUG set:
   a. Insert school organization (type='school', parentOrganizationId=platform)
   b. Insert ownerRoles for school
   c. Insert organizationMemberships for school
8. Print: "Bootstrap complete. Owner: {email}, Platform: {slug}, School: {school_slug or 'none'}"

### 0.2 Dev Mode Escape Hatch

Update `src/lib/auth.ts` dev mode to use bootstrap data:

```typescript
// Instead of hardcoded 'dev-user-123', read from DB:
// 1. Find the owner user (role='owner' in organizationMemberships)
// 2. Return that user's ID and org
// Fallback: If DB is empty, return a clear error: "Run bootstrap-owner.ts first"
```

---

## <a id="phase-1"></a> PHASE 1: Nuke the Database

### Goal
Wipe Turso completely. Start fresh.

### 1.1 Drop Everything

```bash
# Option A: Turso CLI
turso db shell <db-name> "SELECT 'DROP TABLE IF EXISTS ' || name || ';' FROM sqlite_master WHERE type='table';" | turso db shell <db-name>

# Option B: If using local SQLite for dev
rm -f *.db *.db-journal

# Option C: Drizzle push (will recreate from schema)
npx drizzle-kit push --force
```

### 1.2 Verify Clean State

```bash
turso db shell <db-name> "SELECT name FROM sqlite_master WHERE type='table';"
# Should return: empty or just _drizzle_migrations
```

---

## <a id="phase-2"></a> PHASE 2: Rebuild Schema — Identity Layer

### Goal
Establish the clean identity model. This is the FOUNDATION everything else builds on.

### 2.1 The New Identity Model

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│    Clerk Auth    │     │     persons       │     │  organizationMemberships│
│   (external)     │     │  (canonical ID)   │     │  (org-scoped access)    │
│                  │     │                   │     │                         │
│  clerk_user_id ──┼──►  │  id (UUID)        │◄────│  personId               │
│                  │     │  firstName        │     │  organizationId         │
└─────────────────┘     │  lastName         │     │  role (enum)            │
         │               │  primaryEmail     │     │  status                 │
         │               │  primaryPhone     │     └─────────────────────────┘
         ▼               │  taxId            │
┌─────────────────┐     │  avatarUrl        │     ┌─────────────────────────┐
│     users        │     │  status           │     │  Role Junction Tables   │
│  (auth bridge)   │     └──────────────────┘     │  (business data)        │
│                  │              ▲                 │                         │
│  id (clerk_id)   │              │                 │  studentRoles           │
│  personId ───────┼──────────────┘                 │  parentRoles            │
│  onboarding*     │                                │  teacherRoles           │
│  preferences*    │                                │  staffRoles             │
│  lastSeenAt      │                                │  leadRoles              │
└─────────────────┘                                │  ownerRoles             │
                                                    └─────────────────────────┘
```

### 2.2 Changes to `users` Table

**REMOVE these columns:**
- `email` — use `persons.primaryEmail` via JOIN
- `name` — use `persons.firstName` + `persons.lastName` via JOIN
- `avatarUrl` — use `persons.avatarUrl` via JOIN
- `role` — use `organizationMemberships.role` or junction tables
- `organizationId` — use `organizationMemberships`

**KEEP these columns:**
- `id` (Clerk user_id — PK, string, NOT a UUID)
- `personId` (FK → persons.id, NOT NULL after migration)
- `onboardingCompleted` (auth-flow state)
- `latticeInterviewPending` (triggers interview)
- `preferences` (JSON — client-side prefs, theme, etc.)
- `createdAt`, `updatedAt`, `lastSeenAt`, `archivedAt`

### 2.3 Changes to `persons` Table

**No structural changes needed.** The persons table is already well-designed. Just ensure:
- `primaryEmail` has a UNIQUE constraint
- `status` defaults to `'active'`

### 2.4 Changes to `organizationMemberships` Table

**This becomes the CANONICAL role for authorization.** Ensure it has:
- `personId` (FK → persons.id, NOT NULL)
- `organizationId` (FK → organizations.id, NOT NULL)
- `role` (enum: owner | admin | teacher | student | parent | staff | accountant | support)
- `status` (enum: active | invited | suspended | left)
- `joinedAt`, `leftAt`
- UNIQUE constraint on (personId, organizationId, role) — a person can have MULTIPLE roles in the same org

**IMPORTANT**: Change the unique constraint. Currently it's (personId, organizationId) which means ONE role per org. A teacher who is also a parent needs TWO membership rows.

### 2.5 Role System — Final Architecture

```
Authorization Check: "Can this person do X in this org?"
  → Query organizationMemberships WHERE personId AND organizationId
  → Returns role(s): ['teacher', 'parent']
  → Check against permission matrix

Business Data: "What are this teacher's contract details?"
  → Query teacherRoles WHERE personId AND organizationId
  → Returns: hireDate, paymentModel, certifications, etc.
```

**Rule**: `organizationMemberships.role` = WHO YOU ARE (permissions).
**Rule**: Junction tables (studentRoles, teacherRoles, etc.) = WHAT YOU DO (business data).
**Rule**: `users.role` = DELETED. Gone. Nuked.

---

## <a id="phase-3"></a> PHASE 3: Rebuild Schema — All 88 Tables

### Goal
Change every `userId` FK to `personId` FK pointing to `persons.id`.

### 3.1 The Rename Rule

For EVERY table listed in Appendix A:

```
BEFORE: userId: text('user_id').notNull().references(() => users.id)
AFTER:  personId: text('person_id').notNull().references(() => persons.id)
```

For tables with OPTIONAL userId:
```
BEFORE: userId: text('user_id').references(() => users.id)
AFTER:  personId: text('person_id').references(() => persons.id)
```

For tables with secondary user references (e.g., `changedBy`, `markedBy`, `assignedBy`, `recordedBy`, `sentBy`, `revokedBy`, `invitedBy`):
```
BEFORE: markedBy: text('marked_by').references(() => users.id)
AFTER:  markedByPersonId: text('marked_by_person_id').references(() => persons.id)
```

### 3.2 Index Updates

Every index that included `userId` must be updated to `personId`:
```
BEFORE: idx_prompts_user: index on [userId]
AFTER:  idx_prompts_person: index on [personId]
```

### 3.3 Fix the 3 Schema Bugs

These three tables have `personId` columns that INCORRECTLY reference `users.id`:

1. **latticeEvidence** (~line 9881):
   ```
   BEFORE: personId: text('person_id').notNull().references(() => users.id, { onDelete: 'cascade' })
   AFTER:  personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' })
   ```

2. **latticeSkillAssessments** (~line 10014):
   ```
   BEFORE: personId: text('person_id').notNull().references(() => users.id, { onDelete: 'cascade' })
   AFTER:  personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' })
   ```

3. **latticeProjectionResults** (~line 10044):
   ```
   BEFORE: personId: text('person_id').notNull().references(() => users.id, { onDelete: 'cascade' })
   AFTER:  personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' })
   ```

### 3.4 Drizzle Relations Update

Every `relations()` block that references `users` for the old `userId` FK must be updated to reference `persons`:

```typescript
// BEFORE
export const promptsRelations = relations(prompts, ({ one }) => ({
  user: one(users, { fields: [prompts.userId], references: [users.id] }),
}))

// AFTER
export const promptsRelations = relations(prompts, ({ one }) => ({
  person: one(persons, { fields: [prompts.personId], references: [persons.id] }),
}))
```

### 3.5 Special Case: `messages.reactions`

The `messages` table stores reactions as JSON `{ emoji: [userId] }`. This should become `{ emoji: [personId] }`. Since it's JSON (not a FK), this is just a naming convention — but update any code that reads/writes this field.

### 3.6 Tables That Should KEEP userId

These tables legitimately need the Clerk user ID (not person ID):

- **`users`** itself (PK is Clerk ID)
- **`userApiKeys`** — These are per-auth-session API keys, could go either way. **Decision: Move to personId.** A person's API keys shouldn't change if they re-auth.

Actually, on reflection: **ZERO tables should keep userId as FK.** The `users` table is just a lookup bridge. Everything should point to `persons.id`.

---

## <a id="phase-4"></a> PHASE 4: Rewire Auth Flow

### Goal
Change how the app resolves "who is this person?" from the Clerk session.

### 4.1 New Auth Resolution Chain

```
Clerk session → clerk_user_id
  → SELECT personId FROM users WHERE id = clerk_user_id
  → personId is now the canonical identity for ALL queries
  → SELECT role FROM organizationMemberships WHERE personId = ? AND organizationId = ?
  → role determines permissions
```

### 4.2 Update `src/lib/auth.ts`

**Replace `getApiAuth()`:**

```typescript
export async function getApiAuth(): Promise<{
  personId: string | null;
  orgId: string | null;
  clerkUserId: string | null;
}> {
  if (isDevMode()) {
    // Read from DB: find the owner person
    const owner = await db.select()
      .from(users)
      .innerJoin(persons, eq(users.personId, persons.id))
      .innerJoin(organizationMemberships, eq(persons.id, organizationMemberships.personId))
      .where(eq(organizationMemberships.role, 'owner'))
      .limit(1);

    if (!owner.length) throw new Error('No owner found. Run: npx tsx scripts/bootstrap-owner.ts');

    return {
      personId: owner[0].persons.id,
      orgId: owner[0].organization_memberships.organizationId,
      clerkUserId: owner[0].users.id,
    };
  }

  const { userId: clerkUserId, orgId } = await auth();
  if (!clerkUserId) return { personId: null, orgId: null, clerkUserId: null };

  const user = await db.select({ personId: users.personId })
    .from(users)
    .where(eq(users.id, clerkUserId))
    .limit(1);

  if (!user.length || !user[0].personId) {
    return { personId: null, orgId, clerkUserId };
  }

  return { personId: user[0].personId, orgId, clerkUserId };
}
```

**Replace `getApiAuthWithOrg()`:**

```typescript
export async function getApiAuthWithOrg(): Promise<{
  personId: string;
  orgId: string;
  clerkUserId: string;
  roles: string[];  // All roles in this org
}> {
  const { personId, clerkUserId } = await getApiAuth();
  if (!personId || !clerkUserId) throw redirect('/sign-in');

  // Resolve active org (cookie → Clerk → first membership)
  const activeOrgId = await resolveActiveOrg(personId);
  if (!activeOrgId) throw redirect('/onboarding');

  // Get roles in this org
  const memberships = await db.select({ role: organizationMemberships.role })
    .from(organizationMemberships)
    .where(and(
      eq(organizationMemberships.personId, personId),
      eq(organizationMemberships.organizationId, activeOrgId),
      eq(organizationMemberships.status, 'active'),
    ));

  const roles = memberships.map(m => m.role);

  return { personId, orgId: activeOrgId, clerkUserId, roles };
}
```

### 4.3 Update `src/lib/auth/roles.ts`

**Replace `getCurrentUser()`:**

```typescript
export async function getCurrentUser() {
  const { personId, orgId } = await getApiAuthWithOrg();

  const person = await db.select()
    .from(persons)
    .where(eq(persons.id, personId))
    .limit(1);

  const memberships = await db.select()
    .from(organizationMemberships)
    .where(and(
      eq(organizationMemberships.personId, personId),
      eq(organizationMemberships.organizationId, orgId),
      eq(organizationMemberships.status, 'active'),
    ));

  return {
    person: person[0],
    roles: memberships.map(m => m.role),
    orgId,
    // Highest role for backward compat
    primaryRole: getHighestRole(memberships.map(m => m.role)),
  };
}
```

**Update `hasRole()`:**

```typescript
// BEFORE: hasRole(userRole: string, requiredRole: string)
// AFTER:  hasRole(roles: string[], requiredRole: string)
export function hasRole(roles: string[], requiredRole: string): boolean {
  return roles.some(r => ROLE_HIERARCHY[r] >= ROLE_HIERARCHY[requiredRole]);
}
```

### 4.4 Update `src/lib/permission-middleware.ts`

Every `withPermission()` call currently extracts `userId` from `auth()`. Change to:

```typescript
export function withPermission(options) {
  return async (req, context) => {
    const { personId, orgId, roles } = await getApiAuthWithOrg();
    // ... permission check using personId and roles
    return handler(req, { ...context, personId, orgId, roles });
  };
}
```

### 4.5 Update `src/lib/permissions.ts`

The full permission system uses `userId` throughout. Replace:
- `PermissionContext.userId` → `PermissionContext.personId`
- All queries: `eq(*.userId, userId)` → `eq(*.personId, personId)`
- `userPermissionOverrides.userId` → `userPermissionOverrides.personId`
- `teamMembers.userId` → `teamMembers.personId`
- `userGroupAssignments.userId` → `userGroupAssignments.personId`

### 4.6 Update `ensurePersonForUser()` in `src/lib/identity/person-helpers.ts`

This function is now CRITICAL — it's the bridge between Clerk sign-up and the persons table.

```typescript
export async function ensurePersonForUser(
  clerkUserId: string,
  email: string,
  name?: string,
  avatarUrl?: string,
): Promise<{ personId: string; isNew: boolean }> {
  // 1. Check if user already has a person linked
  const existingUser = await db.select({ personId: users.personId })
    .from(users)
    .where(eq(users.id, clerkUserId))
    .limit(1);

  if (existingUser.length && existingUser[0].personId) {
    return { personId: existingUser[0].personId, isNew: false };
  }

  // 2. Check if a person exists with this email (pre-created lead, etc.)
  const existingPerson = await db.select({ id: persons.id })
    .from(persons)
    .where(eq(persons.primaryEmail, email.toLowerCase()))
    .limit(1);

  let personId: string;
  let isNew = false;

  if (existingPerson.length) {
    personId = existingPerson[0].id;
  } else {
    // 3. Create new person
    personId = generateUUID();
    const [firstName, ...rest] = (name || '').split(' ');
    await db.insert(persons).values({
      id: personId,
      firstName: firstName || null,
      lastName: rest.join(' ') || null,
      primaryEmail: email.toLowerCase(),
      avatarUrl: avatarUrl || null,
      status: 'active',
      createdAt: unixNow(),
      updatedAt: unixNow(),
    });
    isNew = true;
  }

  // 4. Create or update user record
  await db.insert(users)
    .values({
      id: clerkUserId,
      personId,
      onboardingCompleted: false,
      createdAt: unixNow(),
      updatedAt: unixNow(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { personId, updatedAt: unixNow() },
    });

  return { personId, isNew };
}
```

---

## <a id="phase-5"></a> PHASE 5: Rewire All API Routes

### Goal
Change every API route from `userId` to `personId`.

### 5.1 The Pattern

Every API route currently does something like:

```typescript
// BEFORE
export async function GET(req: Request) {
  const { userId } = await getApiAuth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const data = await db.select().from(someTable)
    .where(eq(someTable.userId, userId));

  return Response.json(data);
}
```

Change to:

```typescript
// AFTER
export async function GET(req: Request) {
  const { personId, orgId } = await getApiAuthWithOrg();

  const data = await db.select().from(someTable)
    .where(eq(someTable.personId, personId));

  return Response.json(data);
}
```

### 5.2 For INSERT operations:

```typescript
// BEFORE
await db.insert(someTable).values({ userId, ... });

// AFTER
await db.insert(someTable).values({ personId, ... });
```

### 5.3 Scope

**112+ API route files need this change.** See Appendix B for the complete list.

The change is MECHANICAL: find `userId` → replace with `personId` in query contexts. The auth call at the top of each route changes from `getApiAuth()` → `getApiAuthWithOrg()` and destructures `personId` instead of `userId`.

### 5.4 Special Cases

Some routes need BOTH personId and clerkUserId:
- `POST /api/users` — Creates the user record (needs Clerk ID as PK)
- `POST /api/onboarding` — Links Clerk to person
- Webhook routes — Receive Clerk events with clerk_user_id

For these, use the full return: `const { personId, clerkUserId, orgId } = await getApiAuth();`

---

## <a id="phase-6"></a> PHASE 6: Rewire All Client Hooks & Components

### Goal
Client-side code currently passes `userId` around. Change to `personId`.

### 6.1 Update `src/hooks/useUser.tsx`

The `UserProvider` currently stores and exposes `user.id` (which is the Clerk ID). It needs to expose `personId` as the primary identifier.

```typescript
interface UserContextValue {
  // NEW primary identity
  personId: string | null;
  person: PersonData | null;

  // Auth metadata (still needed for Clerk operations)
  clerkUserId: string | null;

  // Org context
  activeOrgId: string | null;
  roles: string[];  // Roles in active org

  // State
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;

  // Actions
  switchOrg: (orgId: string) => Promise<void>;
  refetch: () => Promise<void>;
}
```

The fetch sequence becomes:
1. Clerk provides `clerkUserId`
2. Fetch `/api/me` (new endpoint) → returns `{ person, roles, activeOrg }`
3. Expose `personId` as primary identity

### 6.2 Create `/api/me` Endpoint

New endpoint that returns the current person's full context:

```typescript
// src/app/api/me/route.ts
export async function GET() {
  const { personId, orgId, roles } = await getApiAuthWithOrg();

  const person = await db.select().from(persons)
    .where(eq(persons.id, personId)).limit(1);

  return Response.json({
    person: person[0],
    activeOrgId: orgId,
    roles,
  });
}
```

### 6.3 Update `src/hooks/useRole.tsx`

Currently reads `user.role` (single value). Change to read from the context's `roles[]` array.

```typescript
export function useRole() {
  const { roles } = useUserContext();

  return {
    roles,
    primaryRole: getHighestRole(roles),
    hasRole: (required: string) => roles.some(r => HIERARCHY[r] >= HIERARCHY[required]),
    hasAnyRole: (allowed: string[]) => roles.some(r => allowed.includes(r)),
    isStudent: roles.includes('student'),
    isParent: roles.includes('parent'),
    isTeacher: roles.includes('teacher'),
    isStaff: roles.includes('staff'),
    isAdmin: roles.includes('admin'),
    isOwner: roles.includes('owner'),
  };
}
```

### 6.4 Update `src/components/layout/AppLayout.tsx`

The sidebar navigation currently switches on `user.role`. Change to use `useRole()` hook and the `primaryRole` or `roles[]` for multi-role navigation.

### 6.5 Update `src/components/auth/AuthGuard.tsx`

Currently checks `user.id`. Change to check `personId` from context.

---

## <a id="phase-7"></a> PHASE 7: Remove Eco-Escola Hardcoding

### Goal
Remove ALL hardcoded tenant-specific references. Make everything dynamic.

### 7.1 Files to Fix

| # | File | What to Change |
|---|------|---------------|
| 1 | `src/middleware.ts:28` | Remove `/eco-escola(.*)` from public routes. Replace with dynamic org slug resolution (all `[orgSlug]` public pages should be public by path pattern, not by slug name) |
| 2 | `scripts/seed-organizations.ts` | DELETE this file entirely. Replace with `scripts/bootstrap-owner.ts` (Phase 0) |
| 3 | `src/app/[orgSlug]/admin/setup/blueprint/page.tsx:19-27` | Replace `SCHOOL_CONTEXT` hardcoded object with a fetch from org context. Use `useOrg()` hook to get real org data. |
| 4 | `src/app/[orgSlug]/admin/setup/financial/page.tsx:21-48` | Replace `DEFAULT_ACCOUNTS` with empty defaults or org-context-aware defaults. Use `org.name`, `org.cnpj`, etc. |
| 5 | `src/app/(dashboard)/owner/business-settings/page.tsx:251-264` | Replace `DEFAULT_BUSINESS_SETTINGS` with empty/placeholder values. Use `org.name`, `org.cnpj`, etc. from context |
| 6 | `src/app/(dashboard)/owner/payables/page.tsx:55` | Replace mock CNPJ with generic placeholder |
| 7 | `src/lib/schemas/fiscal/tax-withholdings.ts:83-86` | **CRITICAL**: Remove hardcoded Joinville ISS rate. Add `issRate` and `issEducationRate` to `organizationFinancialSettings` table. Query from DB. |
| 8 | `src/lib/schemas/fiscal/invoices.ts:165-167` | **CRITICAL**: Remove hardcoded municipal code `802`. Add `municipalServiceCode` to `organizationFinancialSettings` table. Query from DB. |
| 9 | `README.md`, `docs/README.md`, `docs/ethics-privacy.md`, `ETHICS-POLICY.md` | Documentation references are OK to keep as examples, but replace any that imply eco-escola is the only tenant |

### 7.2 Fiscal Schema Changes

Add to `organizationFinancialSettings` table:

```typescript
// New columns
municipalServiceCode: text('municipal_service_code'),     // e.g., '802' for Joinville
issRate: integer('iss_rate'),                              // basis points, e.g., 200 = 2%
issEducationRate: integer('iss_education_rate'),           // basis points
municipalityIbgeCode: text('municipality_ibge_code'),     // IBGE code for NFS-e
```

### 7.3 Middleware Fix

```typescript
// BEFORE (src/middleware.ts)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding',
  '/platform(.*)',
  '/p/(.*)',
  '/cert/(.*)',
  '/c/(.*)',
  '/careers(.*)',
  '/lattice/demo',
  '/api/careers(.*)',
  '/api/onboarding(.*)',
  '/eco-escola(.*)',    // ← HARDCODED TENANT
])

// AFTER
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding',
  '/platform(.*)',
  '/p/(.*)',
  '/cert/(.*)',
  '/c/(.*)',
  '/careers(.*)',
  '/lattice/demo',
  '/api/careers(.*)',
  '/api/onboarding(.*)',
  '/api/public/(.*)',
  '/form/(.*)',           // Lead capture forms are public
  // NO hardcoded org slugs.
  // [orgSlug] public pages are handled by the [orgSlug] layout
  // which does its own auth check per-page.
])
```

The `[orgSlug]` routes that should be public (school landing page, course catalog, etc.) should be handled by the `[orgSlug]/layout.tsx` NOT checking auth for those specific sub-routes, or by creating a `[orgSlug]/(public)/` route group.

---

## <a id="phase-8"></a> PHASE 8: Seed Script — Dynamic Multi-Tenant

### Goal
Replace the hardcoded eco-escola seed with a proper bootstrap + optional school creation.

### 8.1 Delete `scripts/seed-organizations.ts`

This file is replaced by `scripts/bootstrap-owner.ts` from Phase 0.

### 8.2 Create `scripts/create-school.ts`

A utility script to create new school organizations:

```bash
npx tsx scripts/create-school.ts \
  --name "Eco Escola" \
  --slug "eco-escola" \
  --city "Joinville" \
  --state "SC" \
  --owner-email "pedro@nodezero.com.br"
```

This script:
1. Finds the person by email
2. Creates the school organization
3. Assigns the person as owner of that school
4. Creates branding defaults
5. Creates financial settings with municipality-specific data

---

## <a id="phase-9"></a> PHASE 9: Fix `src/lib/auth.ts` Dev Mode

### Goal
Remove hardcoded `DEV_ORG_ID` and `DEV_USER` constants.

### Current State
```typescript
const DEV_USER = { id: 'dev-user-123', ... };
const DEV_ORG_ID = 'dev-org-123';
```

### New State
```typescript
async function getDevAuth() {
  // Find the first owner in the database
  const ownerMembership = await db.select({
    personId: organizationMemberships.personId,
    orgId: organizationMemberships.organizationId,
  })
  .from(organizationMemberships)
  .where(eq(organizationMemberships.role, 'owner'))
  .limit(1);

  if (!ownerMembership.length) {
    throw new Error(
      'No owner found in database. Run: npx tsx scripts/bootstrap-owner.ts'
    );
  }

  // Find the user record for this person
  const user = await db.select()
    .from(users)
    .where(eq(users.personId, ownerMembership[0].personId))
    .limit(1);

  return {
    personId: ownerMembership[0].personId,
    orgId: ownerMembership[0].orgId,
    clerkUserId: user[0]?.id || 'dev-no-clerk',
  };
}
```

---

## <a id="phase-10"></a> PHASE 10: Smoke Test Checklist

After all changes, verify:

### Auth Flow
- [ ] `npx tsx scripts/bootstrap-owner.ts` runs without errors
- [ ] Dev mode: App loads, owner dashboard accessible
- [ ] Dev mode: Can switch roles in sidebar
- [ ] Dev mode: Can switch orgs
- [ ] Production: Clerk sign-up creates person + user
- [ ] Production: Onboarding flow works (role selection → approval)
- [ ] Production: Protected routes redirect to sign-in

### Data Integrity
- [ ] `npx drizzle-kit push` succeeds with no errors
- [ ] All 88+ tables have `personId` FK (not `userId`)
- [ ] `users` table has NO `email`, `name`, `avatarUrl`, `role`, `organizationId` columns
- [ ] `organizationMemberships` unique constraint is (personId, organizationId, role)
- [ ] 3 lattice tables reference `persons.id` (not `users.id`)

### API Routes
- [ ] `GET /api/me` returns person + roles + activeOrg
- [ ] `GET /api/prompts` filters by personId
- [ ] `POST /api/prompts` inserts with personId
- [ ] `GET /api/user/organizations` returns orgs for person

### Client
- [ ] `useUserContext()` exposes `personId`
- [ ] `useRole()` returns `roles[]` array
- [ ] Sidebar navigation works for all roles
- [ ] AuthGuard blocks unauthenticated access

### Eco-Escola Removal
- [ ] `grep -ri "eco.escola" src/` returns ZERO results
- [ ] `grep -ri "eco.escola" scripts/` returns ZERO results
- [ ] Middleware has NO hardcoded org slugs
- [ ] Fiscal tax rates come from DB, not constants
- [ ] Municipal codes come from DB, not constants

---

## <a id="appendix-a"></a> APPENDIX A: Complete Table Inventory — userId → personId Migration

**88 tables total.** Every one of these needs `userId` → `personId`.

### Learning & AI (15 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 1 | prompts | userId (required) | No | Prompt ownership |
| 2 | promptRuns | userId (required) | No | IMMUTABLE — never delete |
| 3 | progress | userId (required) | No | Unique: personId+classId+taskId |
| 4 | studentPrompts | userId (required) | CASCADE | Student's saved prompts |
| 5 | runAnnotations | userId (required) | No | Student reflections |
| 6 | graveyardEntries | userId (required) | CASCADE | Failed characters |
| 7 | techniqueUsage | userId (required) | No | Technique mastery |
| 8 | todoItems | userId (required) | CASCADE | Eisenhower matrix |
| 9 | problemWorkshops | userId (required) | CASCADE | Root cause analysis |
| 10 | capstoneSubmissions | userId (required) | No | Capstone projects |
| 11 | challengeAttempts | userId (required) | No | Challenge submissions |
| 12 | knowledgeNodes | userId (required) | CASCADE | Learning graph |
| 13 | knowledgeEdges | userId (required) | CASCADE | Learning graph edges |
| 14 | userBadges | userId (required) | CASCADE | Achievements |
| 15 | userApiKeys | userId (required) | CASCADE | AI provider keys |

### Academic (14 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 16 | classEnrollments | userId (required) | No | Unique: classGroupId+personId |
| 17 | attendanceRecords | userId + recordedBy | No | Two person refs |
| 18 | studentGrades | userId (required) | No | Unique: assessmentId+personId+attempt |
| 19 | gradebookEntries | userId (required) | No | Unique: classGroupId+personId |
| 20 | homeworkSubmissions | userId (required) | No | Unique: homeworkId+personId |
| 21 | studentProgressions | userId (required) | No | Level advancement |
| 22 | pedagogicalNotes | userId (required) | No | Notes about student |
| 23 | progressReports | userId (required) | No | Periodic reports |
| 24 | activityRegistrations | userId (required) | No | Unique: activityId+personId |
| 25 | studentCertificates | userId (required) | No | Completion records |
| 26 | studentLearningProfiles | userId (required) | No | VARK profiles |
| 27 | varkAssessmentResponses | userId (required) | No | Assessment data |
| 28 | generatedStudentMaterials | userId (required) | No | AI-generated content |
| 29 | materialSubmissions | userId (required) | No | Submitted work |

### Financial & Payroll (12 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 30 | transactions | userId (optional) | No | Payment records |
| 31 | splitRecipients | userId (optional) | No | Payout targets |
| 32 | commissionPayouts | userId (required) | No | Commission tracking |
| 33 | staffContracts | userId (required) | No | Employment contracts |
| 34 | staffLeave | userId (required) | No | Leave records |
| 35 | staffPayroll | userId (required) | No | Payroll calculation |
| 36 | paymentMethods | userId (required) | No | Bank/PIX/card info |
| 37 | payrollPayments | userId (required) | No | Payment disbursement |
| 38 | laborProvisionBalances | userId (required) | No | Accrual tracking |
| 39 | terminationPlans | userId (required) | No | Firing cost sim |
| 40 | employeeBenefits | userId (required) | No | VR/VA/VT etc |
| 41 | teacherProfiles | userId (required) | CASCADE | Teacher info |

### HR & Operations (10 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 42 | timeClockEntries | userId (required) | No | GPS clock |
| 43 | timeSheets | userId (required) | No | Period summaries |
| 44 | positionAssignments | userId (required) | No | Org chart |
| 45 | attendance | userId + markedBy | No | Two person refs |
| 46 | placementResults | userId (required) | No | Level tests |
| 47 | cashiers | userId (required) | No | Cash register |
| 48 | makeupClasses | userId (required) | No | Reposição |
| 49 | staffAuthorityLevels | userId (required) | No | Authorization limits |
| 50 | contracts | userId (optional) | No | Digital contracts |
| 51 | visitTracking | userId (optional) | No | Reception visits |

### CRM & Marketing (4 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 52 | leadContacts | userId (required) | No | Who contacted lead |
| 53 | enrollments | userId (required) | No | Enrollment records |
| 54 | waitlist | userId (optional) | No | Waiting list |
| 55 | salesTeamMembers | userId (required) | No | Sales team |

### Sales (2 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 56 | salesTeamDailyMetrics | userId (optional) | No | Performance |
| 57 | promotionRedemptions | userId (optional) | No | Coupon usage |

### Collections/Payments (3 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 58 | paymentReminders | userId + sentBy | No | Two person refs |
| 59 | overduePayments | userId (optional) | No | Delinquency |
| 60 | eventAttendees | userId (optional) | No | Event tracking |

### Lattice/Talent (5 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 61 | latticeEvidence | personId→users.id BUG | CASCADE | **FIX: → persons.id** |
| 62 | latticeSkillAssessments | personId→users.id BUG | CASCADE | **FIX: → persons.id** |
| 63 | latticeProjectionResults | personId→users.id BUG | CASCADE | **FIX: → persons.id** |
| 64 | talentProfiles | userId (required) | CASCADE | Talent data |
| 65 | talentEvidenceDocuments | userId (required) | CASCADE | Supporting docs |

### Permissions & Governance (6 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 66 | userPermissions | userId (required) | CASCADE | Module perms |
| 67 | userRoleAssignments | userId + assignedBy | CASCADE | Role assignment |
| 68 | userPermissionOverrides | userId + revokedBy | CASCADE | Override grants/revokes |
| 69 | userGroupAssignments | userId (required) | CASCADE | Permission groups |
| 70 | teamMembers | userId (required) | CASCADE | Team membership |
| 71 | branchStakeholders | userId (required) | No | Branch access |

### Communication (8 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 72 | conversationParticipants | userId + invitedBy | No | Chat members |
| 73 | meetingParticipants | userId (optional) | No | Meeting attendees |
| 74 | meetingNotes | userId (required) | No | Per-person notes |
| 75 | messageReadReceipts | userId (required) | No | Read tracking |
| 76 | typingIndicators | userId (required) | No | Typing status |
| 77 | userCalendarSettings | userId (required) | CASCADE | Calendar prefs |
| 78 | alertAcknowledgments | userId (required) | No | Alert dismissals |
| 79 | eventAttachments | userId (optional) | No | Calendar attachments |

### Knowledge & Wiki (3 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 80 | wikiArticleFeedback | userId (required) | No | Article ratings |
| 81 | trainingData | userId (optional) | No | Training source |
| 82 | kaizenVotes | userId (required) | No | Improvement votes |

### LGPD/Privacy (3 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 83 | privacyConsents | userId (required) | No | Consent records |
| 84 | dataExportRequests | userId (required) | No | LGPD export |
| 85 | dataDeletionRequests | userId (required) | No | LGPD deletion |

### Customer Journey (1 table)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 86 | customerJourneys | userId (optional) | No | Journey tracking |

### Misc (2 tables)
| # | Table | userId Column | Cascade? | Notes |
|---|-------|--------------|----------|-------|
| 87 | drafts | userId (required) | CASCADE | Auto-saved drafts |
| 88 | promptDeltas | changedBy | No | **Rename: changedByPersonId** |

---

## <a id="appendix-b"></a> APPENDIX B: API Route Files Requiring Changes

**Every file under `src/app/api/` that calls `getApiAuth()`, `getApiAuthWithOrg()`, `getAuthUserId()`, or `auth()` and then uses `userId` in a query.**

The change pattern is identical for all:
1. Replace `const { userId } = await getApiAuth()` → `const { personId } = await getApiAuthWithOrg()`
2. Replace `eq(table.userId, userId)` → `eq(table.personId, personId)`
3. Replace `{ userId, ... }` in inserts → `{ personId, ... }`

**Search command to find all files:**
```bash
grep -rl "userId" src/app/api/ --include="*.ts" --include="*.tsx"
```

This will return 112+ files. Every one needs the mechanical replacement.

---

## <a id="appendix-c"></a> APPENDIX C: Client Hooks & Components Requiring Changes

### Hooks
| File | Change |
|------|--------|
| `src/hooks/useUser.tsx` | Expose `personId` instead of `user.id` as primary identity |
| `src/hooks/useRole.tsx` | Read from `roles[]` array instead of `user.role` string |

### Components
| File | Change |
|------|--------|
| `src/components/auth/AuthGuard.tsx` | Check `personId` existence |
| `src/components/layout/AppLayout.tsx` | Use `useRole().roles` for sidebar nav |
| `src/components/OrgContext.tsx` | No changes needed (already org-centric) |

### Client-side fetches
Any component that sends `userId` in request bodies or uses it to construct URLs needs to send `personId` instead. Search for:
```bash
grep -rl "userId" src/components/ src/hooks/ --include="*.ts" --include="*.tsx"
```

---

## EXECUTION ORDER SUMMARY

```
Phase 0  → Create bootstrap-owner.ts (SAFETY NET)
Phase 1  → Nuke the database
Phase 2  → Rebuild identity layer in schema.ts
Phase 3  → Rename userId → personId in ALL 88 tables in schema.ts
Phase 4  → Rewire auth.ts, roles.ts, permissions.ts, permission-middleware.ts
Phase 5  → Rewire ALL 112+ API route files
Phase 6  → Rewire client hooks and components
Phase 7  → Remove eco-escola hardcoding (9 files)
Phase 8  → Replace seed script with dynamic bootstrap
Phase 9  → Fix dev mode auth
Phase 10 → Smoke test everything
```

**Estimated scope**: ~250 files touched, ~13,700 lines of schema rewritten, ~112 API routes updated.

**Critical path**: Phase 0 (bootstrap) → Phase 2 (schema) → Phase 4 (auth) → Phase 5 (API routes). Everything else can be parallelized around this.

---

*Generated: 2026-02-06*
*For: Pedro (Node Zero)*
*Executor: Claude Code (Antigravity)*
