# Claude Code's Implementation Analysis
## Response to the Unified Lifecycle Engine Vision

**From:** Claude Code (Implementation Agent — the one who lives in the codebase)
**To:** Claude Web + Pedro (Conceptual Architects)
**Date:** 2026-02-09

---

## Context

I've just completed a full audit of every kanban board, pipeline view, procedural map, kaizen system, and churn-related component in the NodeZero codebase. Pedro asked me to review the "Unified Lifecycle Engine" vision document that you (Claude Web) and he co-authored, and cross-reference it against what actually exists in the code.

Here's what I found.

---

## 1. The Crucial Insight Pedro Made

Pedro's observation is correct and important: **the Procedural Map system and the Pipeline Engine from the vision are architecturally almost identical — but they serve different cognitive modes.**

The current `procedure_templates` system thinks in terms of:
- Steps (nodes in a directed graph)
- Transitions (edges with conditions)
- Executions (instances running through the graph)

The vision's Pipeline Engine thinks in terms of:
- Stages (ordered positions in a journey)
- Transitions (movement events between stages)
- Instances (people moving through the journey)

**Same data model. Different metaphor.** The procedures system is engineer-brain: DAGs, step types, Mermaid diagrams. The pipeline vision is operator-brain: "this person is HERE, they need to go THERE."

So we don't need to choose between them — we need **one data layer with multiple view layers**:
- **Architect View** = the procedural map (full directed graph, flowcharts, analytics)
- **Operator View** = the pipeline kanban (stages as columns, people as cards)
- **Spatial View** = the R3F 3D topology (particles on trajectories)
- **Timeline View** = the lifecycle timeline (per-person journey history)

All reading from the same tables.

---

## 2. What Exists Today (Code-Level Inventory)

### Database Schema (all in `src/lib/db/schema.ts`)

**Pipeline/Procedure Engine (lines 11302-11550):**
```
procedure_templates     — Template definitions with category, entityType, SLA, wiki link
procedure_steps         — 16 step types (decision, action, communication, approval, wait, etc.)
procedure_transitions   — Directed edges with labels, conditions, analytics (transition %)
procedure_executions    — Running instances: status, currentStepIds (supports parallel), progress %, SLA tracking
```

**Kaizen System:**
```
kaizen_suggestions      — Bottom-up improvement proposals with problemType, impact, procedureId link
kaizen_votes            — Democratic voting (upvote/downvote per person)
```

**Student Lifecycle:**
```
enrollments             — Student enrollment records with status
contracts               — Contract lifecycle tracking
course_types            — Course definitions
course_modules          — Ordered modules within courses (has orderIndex, prerequisites)
levels                  — Academic level progression
attendance              — Per-session attendance records
class_sessions          — Scheduled class sessions
```

**Identity:**
```
persons                 — Universal identity hub
users                   — Auth bridge (person → organization membership)
organizations           — Multi-tenant institutions
```

### API Endpoints

| Endpoint | Status | What It Does |
|---|---|---|
| `GET/POST /api/procedures` | ✅ Production | CRUD templates with enriched step counts + execution analytics |
| `GET/POST /api/procedures/[id]/steps` | ✅ Production | CRUD steps with Mermaid generation |
| `POST /api/procedures/[id]/execute` | ✅ Production | Start an execution instance |
| `PATCH /api/procedures/executions/[executionId]` | ✅ Production | Complete steps, advance executions |
| `GET/POST /api/kaizen/suggestions` | ✅ Production | Full CRUD + voting + pagination |
| `GET/PATCH /api/kaizen/suggestions/[id]` | ✅ Production | Detail + status updates |
| `GET/POST /api/classes` | ✅ Production | Class management |
| `GET/POST /api/enrollments` | ✅ Production | Enrollment management |
| `GET/POST /api/attendance` | ✅ Production | Attendance records |
| `GET /api/schedules` | ✅ Production | Schedule entries |
| `GET /api/lessons` | ✅ Production | Lesson management |

### Frontend Components

| Component | Location | Purpose |
|---|---|---|
| `KanbanBoard` | `components/shared/KanbanBoard.tsx` | Generic kanban with columns, cards, priorities, avatars, card actions, column actions, custom card renderer |
| `LifecycleTimeline` | `components/shared/LifecycleTimeline.tsx` | Per-contact timeline + lifecycle kanban + occurrence tracking |
| `LifecycleCard` | Same file | Contact card with metrics (CAC, LTV, attendance rate) |
| `LifecycleKanban` | Same file | Board view of contacts by lifecycle stage |
| `SCRMProfileModal` | `components/scrm/SCRMProfileModal.tsx` | 12-stage funnel profile (TOFU→MOFU→BOFU→LTV) with sentiment |

### Frontend Pages Using Kanbans (ALL MOCK DATA)

| Page | Tabs/Boards | Mock Arrays |
|---|---|---|
| `staff/pipeline/page.tsx` | 5 tabs: Leads, Sales, Students, Post-sale, Contracts | `MOCK_LEADS`, `MOCK_SALES`, `MOCK_STUDENTS`, `MOCK_POSTSALE`, `MOCK_CONTRACTS` |
| `admin/kaizen/quadro/page.tsx` | Idea Board kanban | Placeholder ("Em Construção") |
| `admin/conhecimento/procedimentos/page.tsx` | Procedure table (not kanban) | `mockProcedures` array |

---

## 3. Gap Analysis: Vision vs. Reality

### What the Vision Needs That ALREADY EXISTS

| Vision Concept | Existing Implementation | Notes |
|---|---|---|
| Pipeline Template | `procedure_templates` table | Has name, category, entityType, version, status, SLA, learning mode |
| Pipeline Stage | `procedure_steps` table | Has stepCode, name, type, entry/exit conditions, role assignment, form schema |
| Stage Transition | `procedure_transitions` table | Has label, condition, priority, analytics (count, percentage, avg time) |
| Pipeline Instance | `procedure_executions` table | Has entityType+entityId, status, currentStepIds, progress %, SLA tracking |
| Stage Analytics | Built into steps + transitions | Median duration, p90 duration, completion rate, transition percentage |
| Template Versioning (partial) | `version` + `parentVersionId` fields | Fields exist but no versioning workflow |
| Wiki Integration | `wikiPageId` + `autoUpdateWiki` | Auto-creates and updates wiki pages per procedure |
| Kaizen→Procedure Link | `procedureId` + `stepId` on suggestions | Suggestions can target specific steps for improvement |
| Course Modules | `course_modules` table | Ordered modules with prerequisites — the raw material for Lifecycle Bridge |
| Attendance Signal | `attendance` table | Per-session records — the signal for dropoff detection |
| Roles/Permissions | `permissions.ts` + `organizationalRoles` table | Role-gated access exists |
| Notification System | `notifications.ts` + `/api/notifications` | Fire-and-forget, template-based |
| KanbanBoard Component | Fully generic, reusable | Columns, cards, custom renderers — ready to serve any view |

### What the Vision Needs That DOES NOT EXIST

| Vision Concept | Gap | Difficulty |
|---|---|---|
| `fallout_pipeline_id` per stage | Not on `procedure_steps` — this is the retention branching topology | Schema migration (1 column) |
| `auto_advance` per stage | Not on `procedure_steps` | Schema migration (1 column) |
| `required_actions[]` per stage | `exitConditions` exists as JSON but no formal action list | Could use existing exitConditions field |
| Stage Instance table | `procedure_executions` has `currentStepIds` but no per-step timing log | New table: `stage_instances` |
| Operator Queue view | Nothing — closest is KanbanBoard | New page + API |
| Cohort Assignment / A/B | Nothing | 2 new tables (`experiments`, `cohort_assignments`) + API |
| Event Bus | No pub/sub — notifications are direct calls | New table `pipeline_events` or in-process emitter |
| Lifecycle Bridge | Logic doesn't exist — course catalog + enrollment exist separately | New service layer |
| R3F Spatial View | Library installed, nothing built | Major new feature |
| Template Editor UI | No visual editor for procedure templates | New page |
| Metrics Dashboard | Data capture exists, visualization doesn't | New page |

---

## 4. The "Same Information, Different Views" Architecture

Here's how I propose we structure this based on Pedro's insight:

```
                    ┌─────────────────────────┐
                    │     DATA LAYER           │
                    │  (One set of tables)     │
                    │                          │
                    │  pipeline_templates      │
                    │  pipeline_stages         │
                    │  pipeline_transitions    │
                    │  pipeline_instances      │
                    │  stage_instances         │
                    │  pipeline_events         │
                    │                          │
                    └──────────┬──────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
    │  VIEW LAYER 1   │ │ VIEW LAYER 2 │ │  VIEW LAYER 3    │
    │  KANBAN BOARD    │ │ OPERATOR Q   │ │  ARCHITECT MAP   │
    │  (Board view)    │ │ (Task list)  │ │  (Graph/3D)      │
    │                  │ │              │ │                   │
    │  For: Staff who  │ │ For: Front-  │ │  For: Owners &   │
    │  think in boards │ │ desk, teachers│ │  directors who   │
    │  and columns     │ │ who need     │ │  think in systems│
    │                  │ │ "do next"    │ │                   │
    │  Same data as    │ │ Same data as │ │  Same data as     │
    │  today's pipeline│ │ kanban but   │ │  kanban but       │
    │  page            │ │ filtered to  │ │  rendered as      │
    │                  │ │ MY tasks     │ │  directed graph   │
    │                  │ │              │ │  or 3D topology   │
    └─────────────────┘ └──────────────┘ └──────────────────┘
```

The key insight: **we're not building 3 systems. We're building 1 data engine with 3 rendering modes.**

The `KanbanBoard` component already exists and is generic. We add an `OperatorQueue` component and eventually an `ArchitectView` component. They all read from the same API endpoints.

---

## 5. Decisions Needed From You Two

### Decision 1: Naming Convention
Do we **rename** `procedure_templates` → `pipeline_templates` (and all related tables), or keep the current names and treat "pipeline" as a view-layer concept?

**My take:** Rename. The vision's language ("pipeline", "stage", "instance") is more intuitive for operators than "procedure", "step", "execution". The system IS a pipeline engine — the procedure terminology was a developer abstraction.

### Decision 2: Schema Evolution Strategy
Do we:
- **(A)** Add columns to existing `procedure_*` tables (less work, risk of confusion with old field meanings)
- **(B)** Create new `pipeline_*` tables and migrate (clean break, more work, cleaner result)

**My take:** (A) with rename migration. The schemas are 95% compatible. We'd add `fallout_pipeline_id`, `auto_advance`, `assignee_role`, and `operator_assignment_rule` to `procedure_steps`, rename the tables, and add the `stage_instances` + `pipeline_events` tables.

### Decision 3: Implementation Sequence
The vision proposes 6 phases. Given what exists, I'd reorder slightly:

1. **Phase 1 — Schema + Seed** (2-3 hours): Evolve procedure tables, add missing columns, create stage_instances + pipeline_events tables. Seed the SCRM 11-stage funnel as the first pipeline template.

2. **Phase 2 — Wire Pipeline Page** (3-4 hours): Replace the 5 mock arrays in `staff/pipeline/page.tsx` with API calls reading from pipeline_instances. Same KanbanBoard component, real data.

3. **Phase 3 — Operator Queue** (4-5 hours): New page showing role-filtered task list. "My Queue" for secretarias/teachers. This is the view that changes how people work daily.

4. **Phase 4 — Lifecycle Bridge** (3-4 hours): When enrollment completes → create pipeline instance from course modules. Connect attendance events to dropoff detection.

5. **Phase 5 — Retention Branching** (3-4 hours): Wire `fallout_pipeline_id`. Implement pause/resume mechanics. Test the full retention loop.

6. **Phase 6 — A/B Engine** (later): Template versioning + cohort assignment. Only after the base system is proven.

7. **Phase 7 — R3F Spatial** (later): The crown jewel. Build after everything else is stable.

### Decision 4: What to Build FIRST?
Given that the pipeline page currently shows 5 tabs of mock data, the highest-impact first step is:
- Schema evolution + seed the first template + wire the pipeline page to real data

This gives immediate visible progress while laying the foundation for everything else.

---

## 6. My Readiness Assessment

| Aspect | Ready? | Notes |
|---|---|---|
| Schema knowledge | ✅ Yes | I've read the full 14,000-line schema |
| API patterns | ✅ Yes | I know the auth patterns, Zod validation, Drizzle ORM conventions |
| Component library | ✅ Yes | KanbanBoard is generic and ready to reuse |
| Permission system | ✅ Yes | I know the role system and `getApiAuthWithOrg()` pattern |
| Course catalog | ✅ Yes | I know the `courseTypes` + `courseModules` + `levels` structure |
| Attendance system | ✅ Yes | I know the `attendance` + `classSessions` structure |
| Notification system | ✅ Yes | I know the template-based notification engine |

I can start building as soon as you two decide on the naming convention, schema strategy, and implementation sequence.

---

*Waiting for your call. — Claude Code*
