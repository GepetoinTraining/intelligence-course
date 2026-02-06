# User Roles & Permissions

## Overview

Node Zero uses 6 distinct user roles, each with specific access patterns and navigation.

---

## Role Definitions

### 🎓 Student

**Who**: Enrolled students learning AI literacy

**Primary Functions**:
- Complete lessons and modules
- Use AI Companion for learning
- Manage personal toolbox (prompts, journal, graveyard)
- Track progress and earn badges
- Build knowledge constellation

**Dashboard Access**:
```
/dashboard          - Student home
/student/inbox      - Messages from AI and teachers
/student/playground - AI chat and prompt testing
/student/prompts    - Saved prompt library
/student/journal    - Annotations and reflections
/student/graveyard  - Failed ideas repository
/student/techniques - Technique mastery tracker
/student/todo       - Task management (2D/3D)
/student/constellation - Knowledge graph
/student/modules/*  - Curriculum content
/profile            - Personal settings
```

**Data Access**:
- ✅ Own profile, progress, toolbox
- ✅ AI Companion (encrypted, only they can decrypt)
- ✅ Curriculum content (unlocked modules)
- ❌ Other students' data
- ❌ Administrative functions

---

### 👨‍🏫 Teacher

**Who**: Instructors teaching classes

**Primary Functions**:
- View assigned classes and schedules
- Take attendance
- Monitor student progress
- Communicate with students

**Dashboard Access**:
```
/dashboard          - Teacher home
/teacher/inbox      - Messages
/teacher/schedule   - Personal schedule
/teacher/classes    - Assigned classes
/teacher/classes/:id - Class roster and progress
```

**Data Access**:
- ✅ Own profile, schedule, payouts
- ✅ Students in their classes (institutional data only)
- ✅ Attendance for their sessions
- ✅ Progress reports (aggregated)
- ❌ AI Companion conversations
- ❌ Student private memories
- ❌ Other teachers' classes

---

### 👨‍👩‍👧 Parent

**Who**: Parents/guardians of enrolled students

**Primary Functions**:
- Monitor children's progress
- Receive wellbeing alerts
- Manage billing and payments
- Communicate with school

**Dashboard Access**:
```
/parent/portal      - Parent home
/parent/inbox       - Messages from school
/parent/financial   - Invoices and payments
/parent/children    - List of enrolled children
/parent/children/:id - Child progress view
/profile            - Account settings
```

**Data Access**:
- ✅ Own profile, payment history
- ✅ Children's institutional data (grades, attendance)
- ✅ Aggregated wellbeing indicators
- ✅ Escalation alerts (Yellow+)
- ❌ AI conversation content
- ❌ Specific memory details
- ❌ Student confessions/private thoughts

---

### 📋 Staff

**Who**: Reception, sales, customer service

**Primary Functions**:
- Manage leads and CRM
- Handle check-ins and walk-ins
- Schedule trials
- Process basic enrollments

**Dashboard Access**:
```
/dashboard          - Staff home
/staff/leads        - Lead pipeline (Kanban)
/staff/leads/:id    - Lead detail
/staff/trials       - Trial management
/staff/checkin      - Front desk check-in
/staff/campaigns    - Marketing campaigns
/staff/templates    - Message templates
/staff/referrals    - Referral tracking
/staff/landing      - Landing page builder
```

**Data Access**:
- ✅ Leads, trials, campaigns
- ✅ Basic student info (for check-in)
- ✅ Class schedules
- ⚠️ Safety alerts (view only)
- ❌ Detailed student progress
- ❌ Financial details
- ❌ AI/Memory systems

---

### 🏫 School Admin

**Who**: School administrators and managers

**Primary Functions**:
- Full school operations management
- Academic administration
- Staff management
- Financial oversight

**Dashboard Access**:
```
/dashboard          - Admin home
/school/courses     - Course type management
/school/levels      - Level configuration
/school/schedule    - Master schedule builder
/school/students    - Student management
/school/teachers    - Teacher management
/school/classes     - Class management
/school/rooms       - Room configuration
/school/terms       - Academic terms
/school/products    - Products and pricing
/school/enrollments - Enrollment management
```

**Data Access**:
- ✅ All operational data
- ✅ All users (within organization)
- ✅ Financial data
- ✅ Safety alerts (acknowledge/resolve)
- ✅ Supervision domain (metadata)
- ❌ Encrypted conversation content
- ❌ Student memory details

---

### 👔 Owner

**Who**: Business owner(s), franchise operators

**Primary Functions**:
- Executive dashboard and KPIs
- Financial analytics
- Multi-school management (if applicable)
- Strategic reporting

**Dashboard Access**:
```
/dashboard          - Executive overview
/owner/executive    - KPI dashboard
/owner/cashflow     - Cash flow analysis
/owner/revenue      - Revenue breakdown
/owner/projections  - Financial projections
/owner/efficiency   - Staff efficiency metrics
/owner/scheduling   - Scheduling optimization
/owner/reports      - BI reports
```

**Data Access**:
- ✅ All aggregated analytics
- ✅ Financial summaries
- ✅ Operational metrics
- ✅ Cross-organization data (if multi-tenant owner)
- ❌ Individual student details
- ❌ Operational management functions

---

## Permission Matrix

| Resource | Student | Teacher | Parent | Staff | School | Owner |
|----------|---------|---------|--------|-------|--------|-------|
| **Own Profile** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Lessons/Modules** | ✅ read | ✅ read | ❌ | ❌ | ✅ CRUD | ✅ read |
| **AI Companion** | ✅ full | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Own Progress** | ✅ | - | - | - | - | - |
| **Student Progress** | - | ✅ class | ✅ child | ❌ | ✅ all | ✅ agg |
| **Classes** | ✅ enrolled | ✅ assigned | ❌ | ✅ read | ✅ CRUD | ✅ read |
| **Attendance** | ✅ own | ✅ CRUD | ✅ child | ✅ read | ✅ CRUD | ✅ agg |
| **Leads** | ❌ | ❌ | ❌ | ✅ CRUD | ✅ CRUD | ✅ read |
| **Trials** | ❌ | ❌ | ❌ | ✅ CRUD | ✅ CRUD | ✅ read |
| **Invoices** | ❌ | ❌ | ✅ own | ❌ | ✅ CRUD | ✅ read |
| **Products** | ❌ | ❌ | ❌ | ❌ | ✅ CRUD | ✅ read |
| **Payouts** | ❌ | ✅ own | ❌ | ❌ | ✅ CRUD | ✅ read |
| **Rooms/Terms** | ❌ | ✅ read | ❌ | ✅ read | ✅ CRUD | ✅ read |
| **Safety Alerts** | ❌ | ⚠️ create | ⚠️ receive | ✅ view | ✅ manage | ✅ view |
| **Audit Logs** | ❌ | ❌ | ❌ | ❌ | ✅ read | ✅ read |
| **Analytics** | ❌ | ❌ | ❌ | ❌ | ✅ limited | ✅ full |

Legend:
- ✅ = Full access
- ⚠️ = Limited access
- ❌ = No access
- CRUD = Create/Read/Update/Delete
- agg = Aggregated only

---

## Role Hierarchy

```
Owner
  └── School Admin
        ├── Teacher
        ├── Staff
        └── Parent
              └── Student (child relationship)
```

**Note**: Hierarchy doesn't imply inheritance. Each role has specific, designed access patterns.

---

## Multi-Role Support

A user can have multiple roles:
- A teacher who is also a parent
- An owner who is also school admin
- A staff member who is also a parent

The UI switches between role contexts via the role selector.

```typescript
// Example: Check if user has any of the required roles
const canManageClasses = hasAnyRole(user, ['teacher', 'school']);
const canViewFinancials = hasAnyRole(user, ['parent', 'school', 'owner']); 
```

---

## API Role Enforcement

Every API route enforces role-based access:

```typescript
// middleware/auth.ts
export function requireRoles(...allowedRoles: UserRole[]) {
  return async (req: Request) => {
    const user = await getUser();
    if (!user) throw new UnauthorizedError();
    if (!allowedRoles.includes(user.role)) throw new ForbiddenError();
    return user;
  };
}

// Usage in API route
export async function GET(req: Request) {
  const user = await requireRoles('teacher', 'school')(req);
  // ... only teachers and school admins reach here
}
```

---

## Role-Based Navigation

The sidebar navigation adapts based on active role:

```typescript
// AppLayout.tsx
const navigation: Record<UserRole, NavItem[]> = {
  student: [
    { href: '/dashboard', label: 'Início', icon: IconHome },
    { href: '/student/inbox', label: 'Caixa de Entrada', icon: IconInbox },
    { href: '/student/playground', label: 'Playground', icon: IconRocket },
    // ...
  ],
  teacher: [
    { href: '/dashboard', label: 'Início', icon: IconHome },
    { href: '/teacher/schedule', label: 'Agenda', icon: IconCalendar },
    // ...
  ],
  // ... other roles
};
```

---

## Special Access Patterns

### Parent-Child Access

Parents can only access data for their linked children:

```typescript
// Verify parent-child relationship
const isParentOf = await db.query.families.findFirst({
  where: and(
    eq(families.parentId, currentUserId),
    eq(families.childId, requestedChildId)
  )
});

if (!isParentOf) throw new ForbiddenError();
```

### Teacher-Class Access

Teachers can only access students enrolled in their assigned classes:

```typescript
// Verify teacher teaches this student's class
const teachesStudent = await db.query.classes.findFirst({
  where: and(
    eq(classes.teacherId, currentUserId),
    exists(
      db.select().from(enrollments)
        .where(and(
          eq(enrollments.classId, classes.id),
          eq(enrollments.userId, requestedStudentId)
        ))
    )
  )
});
```

### Organization Scoping

All queries are scoped to the current organization:

```typescript
// All data queries include organization filter
const students = await db.query.users.findMany({
  where: and(
    eq(users.organizationId, currentOrgId), // ALWAYS include this
    eq(users.role, 'student')
  )
});
```

---

*Last updated: 2026-02-03*
