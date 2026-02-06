# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Student   │  │   Teacher   │  │    Parent   │  │    Staff    │     │
│  │   (Web/PWA) │  │   (Web)     │  │   (Web/PWA) │  │   (Web)     │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
└─────────┼────────────────┼────────────────┼────────────────┼────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APPLICATION                              │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        APP ROUTER                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │  Dashboard  │  │   API       │  │ Onboarding  │               │  │
│  │  │  Pages      │  │   Routes    │  │   Flow      │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐   │
│  │        COMPONENTS               │  │          LIB                │   │
│  │  • AppLayout                    │  │  • Drizzle DB client       │   │
│  │  • KanbanBoard                  │  │  • AI Companion engine     │   │
│  │  • RichTextEditor               │  │  • AI Auditor              │   │
│  │  • Constellation3D              │  │  • Auth helpers            │   │
│  │  • TodoCube3D                   │  │  • Encryption              │   │
│  └─────────────────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                                        │
          ▼                                        ▼
┌─────────────────────────┐          ┌─────────────────────────────────────┐
│      CLERK AUTH         │          │           EXTERNAL SERVICES          │
│  • User management      │          │  ┌─────────────┐  ┌─────────────┐   │
│  • Organization/tenant  │          │  │  Anthropic  │  │   Resend    │   │
│  • Role sync            │          │  │  Claude API │  │   Email     │   │
└─────────────────────────┘          │  └─────────────┘  └─────────────┘   │
                                     │  ┌─────────────┐  ┌─────────────┐   │
                                     │  │   Stripe    │  │   Asaas     │   │
                                     │  │   Cards     │  │   PIX       │   │
                                     │  └─────────────┘  └─────────────┘   │
                                     └─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           TURSO DATABASE                                 │
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌───────────────────┐  │
│  │   INSTITUTIONAL    │  │     RELATIONAL     │  │   SUPERVISION     │  │
│  │                    │  │    (Encrypted)     │  │                   │  │
│  │  • users           │  │  • memory_graphs   │  │  • safety_alerts  │  │
│  │  • enrollments     │  │  • memory_nodes    │  │  • audit_log      │  │
│  │  • progress        │  │  • memory_ledger   │  │  • wellbeing      │  │
│  │  • attendance      │  │  • chat_messages   │  │  • integrity_hash │  │
│  │  • invoices        │  │                    │  │                   │  │
│  └────────────────────┘  └────────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Role-Based Everything

Every feature is designed around the 6 user roles:

```typescript
type UserRole = 'student' | 'teacher' | 'parent' | 'staff' | 'school' | 'owner';
```

- **Navigation** adapts to role
- **API routes** enforce role-based access
- **Data queries** filter by role permissions

### 2. Data Domain Separation (Ethics-First)

Following the Ethics Policy, data is strictly separated:

| Domain | Encryption | Who Can Access |
|--------|------------|----------------|
| Institutional | None (plaintext) | Teachers, parents, staff |
| Relational | Student-derived key | Student only |
| Supervision | None (metadata only) | AI Auditor, coordinators |

### 3. Memory as Topology

AI Companion memories use graph structure, not raw storage:

```
┌─────────────────────────────────────────────────────────┐
│                    MEMORY GRAPH                          │
│                                                          │
│    ┌──────┐  CAUSES   ┌──────┐  REMINDS_OF  ┌──────┐   │
│    │ Node ├───────────► Node ├──────────────► Node │   │
│    │ g=.8 │           │ g=.6 │              │ g=.3 │   │
│    └──────┘           └──────┘              └──────┘   │
│                           │                             │
│                     ABOUT │                             │
│                           ▼                             │
│                       ┌──────┐                          │
│                       │Entity│                          │
│                       └──────┘                          │
└─────────────────────────────────────────────────────────┘

g = gravity (importance weight, decays over time)
```

### 4. Progressive Feature Unlock

Student tools unlock as they progress through curriculum:

- **Module 1**: Basic prompts, journal
- **Module 2**: Graveyard, 5 Whys
- **Module 3**: Constellation (2D)
- **Advanced**: Todo Cube 3D, Constellation 3D

---

## Technology Decisions

### Why Next.js 15 App Router?

- **Server Components**: Reduce client bundle size
- **API Routes**: Colocated backend logic
- **Streaming**: AI response streaming built-in
- **Layouts**: Role-based layout composition

### Why Mantine UI?

- **Complete**: 100+ components out of box
- **Accessible**: WCAG compliant
- **Customizable**: CSS-in-JS with theme
- **Maintained**: Active development

### Why Turso/LibSQL?

- **Edge-ready**: Global replication
- **SQLite**: Simple, reliable, fast
- **Drizzle**: Type-safe ORM
- **Cost**: Generous free tier

### Why Clerk for Auth?

- **Organizations**: Multi-tenant ready
- **Role sync**: Metadata syncs to our DB
- **Middleware**: Route protection built-in
- **UI**: Pre-built sign-in/up pages

---

## Multi-Tenancy

Each school operates as a Clerk Organization:

```typescript
// All queries filter by organizationId
const students = await db.query.users.findMany({
  where: and(
    eq(users.organizationId, currentOrgId),
    eq(users.role, 'student')
  )
});
```

### Tenant Isolation

- Database queries always include `organizationId`
- API routes validate organization membership
- File storage uses org-prefixed paths
- Memory graphs are per-student, per-organization

---

## Security Model

### API Security

```typescript
// Every API route pattern
export async function GET(request: Request) {
  // 1. Authenticate
  const { userId, orgId } = auth();
  if (!userId) return unauthorized();
  
  // 2. Authorize
  const user = await getUser(userId);
  if (!hasRole(user, ['teacher', 'school'])) return forbidden();
  
  // 3. Scope to organization
  const data = await db.query.students.findMany({
    where: eq(students.organizationId, orgId)
  });
  
  return Response.json(data);
}
```

### Encryption

```typescript
// Student-derived key for relational data
const key = deriveKey(studentPassword, institutionSalt);
const encrypted = encrypt(chatMessage, key);

// Institution cannot read without student participation
```

### AI Auditor Limitations

The AI Auditor can **ONLY** access:
- ✅ Session timestamps and duration
- ✅ Aggregated emotional indicators
- ✅ Usage patterns (frequency, length)
- ✅ Memory integrity hashes

The AI Auditor **CANNOT** access:
- ❌ Actual conversation content
- ❌ Specific memory node contents
- ❌ Student confessions or venting
- ❌ Decryption keys

---

## Performance Considerations

### Memory Compression

To prevent unbounded memory growth:

```
SNR < 100    → Store raw (not worth compressing)
SNR 100-400  → 1 compression pass
SNR 400-800  → 2 compression passes  
SNR 800+     → 3 compression passes (dense, important content)
```

### Database Indexes

Critical indexes for performance:

```sql
idx_memory_nodes_gravity    -- Fast retrieval of high-gravity memories
idx_memory_edges_type       -- Edge traversal by relationship type
idx_memory_ledger_category  -- Quick ledger lookups
idx_safety_alerts_level     -- Escalation protocol queries
```

### Caching Strategy

- **React Query**: Client-side cache for API responses
- **Memory Context**: Build once per chat session
- **World Overlay**: Cache student's perspective

---

## Monitoring & Observability

### Logging

```typescript
// Structured logging
logger.info('memory.node.created', {
  studentId,
  graphId,
  nodeId,
  modality: 'episodic',
  gravity: 0.8
});
```

### Metrics

- API response times (P50, P95, P99)
- AI token usage per student
- Memory graph sizes
- Compression effectiveness
- Alert escalation rates

### Audit Trail

All memory operations are logged:

```sql
INSERT INTO memory_audit_log (operation, entity_id, actor, details, timestamp)
VALUES ('node.created', 'node_123', 'system', '{"gravity": 0.8}', NOW());
```

---

*Last updated: 2026-02-03*
