# Multi-Tenant Architecture (Slug System)

> Foundation for SaaS multi-organization support

---

## Overview

Before refactoring modules, we need the multi-tenant foundation:

```
URL Structure:
┌─────────────────────────────────────────────────────────────────────┐
│ PUBLIC PAGES (No auth required)                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /                           → Platform landing page                 │
│  /[orgSlug]                  → School landing page (public)          │
│  /[orgSlug]/careers          → Careers portal (public)               │
│  /[orgSlug]/careers/[jobId]  → Job posting (public)                  │
│  /[orgSlug]/form/[formSlug]  → Lead capture form (public)            │
│  /[orgSlug]/cert/[certId]    → Certificate verification (public)     │
│  /[orgSlug]/go/[shortCode]   → Short link redirect (public)          │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ PROTECTED PAGES (Auth required)                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /[orgSlug]/portal/owner/...     → Owner dashboard                   │
│  /[orgSlug]/portal/teacher/...   → Teacher dashboard                 │
│  /[orgSlug]/portal/student/...   → Student dashboard                 │
│  /[orgSlug]/portal/parent/...    → Parent dashboard                  │
│  /[orgSlug]/portal/staff/...     → Staff dashboard                   │
│  /[orgSlug]/portal/accountant/.. → Accountant dashboard              │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ PLATFORM PAGES (No org context)                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /sign-in                    → Clerk sign in                         │
│  /sign-up                    → Clerk sign up                         │
│  /onboarding                 → Post-signup org selection             │
│  /accept-invite/[token]      → Accept organization invitation        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Additions

### 1. Organizations Table

```sql
CREATE TABLE organizations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Identity
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,  -- URL slug (e.g., "minhaescola")
    display_name TEXT,           -- "Minha Escola de IA"
    
    -- Clerk integration
    clerk_org_id TEXT UNIQUE,    -- If using Clerk Organizations
    
    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#7048e8',
    secondary_color TEXT,
    
    -- Contact
    email TEXT,
    phone TEXT,
    website TEXT,
    
    -- Address
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'BR',
    
    -- Brazilian legal
    cnpj TEXT,
    razao_social TEXT,
    nome_fantasia TEXT,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    regime_tributario TEXT,  -- 'simples', 'lucro_presumido', 'lucro_real'
    
    -- SaaS tier
    plan TEXT DEFAULT 'essentials',  -- 'essentials', 'professional', 'enterprise'
    plan_started_at INTEGER,
    plan_expires_at INTEGER,
    
    -- Feature flags (JSON of enabled modules)
    enabled_modules TEXT DEFAULT '["management","pedagogical","payments","communications"]',
    module_config TEXT DEFAULT '{}',  -- JSON config per module
    
    -- Limits
    max_students INTEGER DEFAULT 100,
    max_staff INTEGER DEFAULT 10,
    max_storage_mb INTEGER DEFAULT 1024,
    
    -- Status
    status TEXT DEFAULT 'active',  -- 'active', 'trial', 'suspended', 'cancelled'
    trial_ends_at INTEGER,
    
    -- Settings
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    locale TEXT DEFAULT 'pt-BR',
    currency TEXT DEFAULT 'BRL',
    
    -- Timestamps
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX idx_orgs_slug ON organizations(slug);
CREATE UNIQUE INDEX idx_orgs_clerk ON organizations(clerk_org_id);
CREATE INDEX idx_orgs_status ON organizations(status);
```

### 2. Organization Membership

```sql
CREATE TABLE organization_memberships (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    person_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    
    -- Role in this org (can have multiple)
    role TEXT NOT NULL,  -- 'owner', 'admin', 'teacher', 'student', 'parent', 'staff'
    
    -- Role-specific data reference
    role_record_id TEXT,  -- Points to staffRoles, teacherRoles, etc.
    
    -- Status
    status TEXT DEFAULT 'active',  -- 'active', 'invited', 'suspended'
    invited_at INTEGER,
    joined_at INTEGER,
    invited_by TEXT,
    
    -- Settings
    is_default_org INTEGER DEFAULT 0,  -- Default org for this person
    notification_preferences TEXT DEFAULT '{}',
    
    -- Timestamps
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    
    UNIQUE(organization_id, person_id, role)
);

CREATE INDEX idx_org_members_org ON organization_memberships(organization_id);
CREATE INDEX idx_org_members_person ON organization_memberships(person_id);
CREATE INDEX idx_org_members_role ON organization_memberships(role);
```

### 3. Update Existing Tables

All entity tables need an `organization_id` column:

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN default_org_id TEXT REFERENCES organizations(id);

-- Role tables already have this implicitly through person
-- But need org context for multi-school scenarios
ALTER TABLE student_roles ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE teacher_roles ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE staff_roles ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE parent_roles ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE lead_roles ADD COLUMN organization_id TEXT REFERENCES organizations(id);

-- Content tables
ALTER TABLE courses ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE prompts ADD COLUMN organization_id TEXT REFERENCES organizations(id);
-- ... etc for all content tables
```

---

## Middleware Update

```typescript
// src/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

// Public routes that don't need org context
const PLATFORM_ROUTES = [
    '/',
    '/sign-in',
    '/sign-up',
    '/onboarding',
    '/accept-invite',
];

// Public routes within org context
const ORG_PUBLIC_ROUTES = [
    '/careers',
    '/form',
    '/cert',
    '/go',
];

export default async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    
    // Platform-level routes (no org context)
    if (PLATFORM_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        if (isDevMode) return NextResponse.next();
        // Clerk auth for sign-in/sign-up only
        return handleClerkAuth(req, isPublic: true);
    }
    
    // Extract org slug from path
    const pathParts = pathname.split('/').filter(Boolean);
    const orgSlug = pathParts[0];
    
    if (!orgSlug) {
        return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Check if this is a valid org slug (could cache this)
    const org = await getOrgBySlug(orgSlug);
    if (!org) {
        return NextResponse.redirect(new URL('/404', req.url));
    }
    
    // Add org context to headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-org-id', org.id);
    requestHeaders.set('x-org-slug', org.slug);
    
    // Check if this is a public org route
    const subPath = '/' + pathParts.slice(1).join('/');
    const isOrgPublic = ORG_PUBLIC_ROUTES.some(route => subPath.startsWith(route));
    
    if (isOrgPublic) {
        return NextResponse.next({
            request: { headers: requestHeaders }
        });
    }
    
    // Protected routes - require auth
    if (isDevMode) {
        return NextResponse.next({
            request: { headers: requestHeaders }
        });
    }
    
    return handleClerkAuth(req, {
        isPublic: false,
        headers: requestHeaders,
    });
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
```

---

## Org Context Provider

```typescript
// src/lib/org-context.tsx

'use client';

import { createContext, useContext, ReactNode } from 'react';

interface OrgContext {
    id: string;
    slug: string;
    name: string;
    displayName: string;
    logoUrl?: string;
    primaryColor: string;
    plan: string;
    enabledModules: string[];
}

const OrgContext = createContext<OrgContext | null>(null);

export function OrgProvider({ 
    children, 
    org 
}: { 
    children: ReactNode; 
    org: OrgContext 
}) {
    return (
        <OrgContext.Provider value={org}>
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    const context = useContext(OrgContext);
    if (!context) {
        throw new Error('useOrg must be used within OrgProvider');
    }
    return context;
}

export function useOrgSlug() {
    return useOrg().slug;
}

export function useHasModule(module: string) {
    const org = useOrg();
    return org.enabledModules.includes(module);
}
```

---

## New Folder Structure

```
src/app/
├── (platform)/                      # No org context
│   ├── page.tsx                     # Landing page
│   ├── sign-in/[[...sign-in]]/
│   ├── sign-up/[[...sign-up]]/
│   ├── onboarding/
│   └── accept-invite/[token]/
│
├── [orgSlug]/                       # Org context
│   ├── layout.tsx                   # OrgProvider wrapper
│   ├── page.tsx                     # Org public landing
│   │
│   ├── (public)/                    # No auth required
│   │   ├── careers/
│   │   │   ├── page.tsx             # Job listings
│   │   │   └── [jobId]/page.tsx     # Job detail
│   │   ├── form/[formSlug]/page.tsx # Lead forms
│   │   ├── cert/[certId]/page.tsx   # Certificate verify
│   │   └── go/[shortCode]/page.tsx  # Short links
│   │
│   └── portal/                      # Auth required
│       ├── layout.tsx               # Auth check + Shell
│       ├── owner/...
│       ├── teacher/...
│       ├── student/...
│       ├── parent/...
│       ├── staff/...
│       └── accountant/...
│
└── api/
    ├── public/                      # Public APIs (no auth)
    │   ├── orgs/[slug]/
    │   ├── careers/
    │   └── forms/
    └── [orgSlug]/                   # Org-scoped APIs
        └── ...all protected APIs
```

---

## Implementation Checklist

### Phase 1: Schema & Migration
- [ ] Create `organizations` table in schema
- [ ] Create `organization_memberships` table
- [ ] Add `organizationId` to role junction tables
- [ ] Add `organizationId` to content tables (courses, prompts, etc.)
- [ ] Run migration

### Phase 2: Seed Data
- [ ] Create default organization for your school
- [ ] Migrate existing data to belong to this org
- [ ] Create org membership for existing users

### Phase 3: Middleware
- [ ] Update middleware for slug-based routing
- [ ] Add org header injection
- [ ] Create org lookup function (with caching)

### Phase 4: Context
- [ ] Create OrgProvider component
- [ ] Create useOrg hooks
- [ ] Create server-side getOrg helper

### Phase 5: File Structure
- [ ] Create `[orgSlug]/` route structure
- [ ] Move public pages under `(public)/`
- [ ] Move protected pages under `portal/`
- [ ] Update layouts to use OrgProvider

### Phase 6: API Updates
- [ ] Add org scoping to all API routes
- [ ] Create public API routes
- [ ] Update all queries to filter by org

### Phase 7: Testing
- [ ] Create second test organization
- [ ] Verify data isolation
- [ ] Test public route access
- [ ] Test protected route access

---

## Questions for Decision

1. **Subdomains vs. Path-based?**
   - Path: `/minhaescola/dashboard` (simpler)
   - Subdomain: `minhaescola.nodezero.com` (requires DNS)
   - Recommendation: Start with path, add subdomain later

2. **Clerk Organizations integration?**
   - Clerk has built-in Organizations
   - We could sync with our organizations table
   - Or use our own fully

3. **Default org for platform users?**
   - Users without org go to `/onboarding` to select/create
   - Or auto-assign to "demo" org for trial

4. **Cross-org access?**
   - Can a teacher work at multiple schools?
   - Yes - that's why we have person → membership → org
