# Database Schema

## Overview

The database uses **Turso** (LibSQL/SQLite) with **Drizzle ORM** for type-safe queries.

```
Total Tables: ~45
├── Core (8)
├── Curriculum (6)
├── Student Toolbox (10)
├── School Operations (8)
├── Financial (6)
├── CRM (4)
├── AI Memory (6)
└── Ethics/Supervision (7)
```

---

## 📑 Quick Reference: Table Index

Jump to any table definition:

### Core Tables
| Table | Line | Description |
|-------|------|-------------|
| [organizations](#organizations) | ~45 | Multi-tenant school container |
| [users](#users) | ~57 | All users across roles |
| [addresses](#addresses) | ~78 | User addresses (main + billing) |
| [families](#families) | ~95 | Parent-child relationships |

### Curriculum Tables
| Table | Line | Description |
|-------|------|-------------|
| [course_types](#course_types) | ~111 | Types of courses offered |
| [levels](#levels) | ~124 | Proficiency levels (CEFR) |
| [modules](#modules) | ~135 | Curriculum modules |
| [lessons](#lessons) | ~149 | Individual lessons |
| [prompts](#prompts) | ~164 | Prompt templates |
| [badges](#badges) | ~178 | Achievement badges |

### Student Toolbox Tables
| Table | Line | Description |
|-------|------|-------------|
| [student_prompts](#student_prompts) | ~195 | Student-saved prompts |
| [prompt_runs](#prompt_runs) | ~211 | Execution history |
| [annotations](#annotations) | ~226 | Journal entries |
| [graveyard_ideas](#graveyard_ideas) | ~238 | Failed ideas repository |
| [techniques](#techniques) | ~251 | Technique mastery |
| [todos](#todos) | ~263 | Task management |
| [knowledge_nodes](#knowledge_nodes) | ~279 | Constellation graph nodes |
| [knowledge_edges](#knowledge_edges) | ~293 | Constellation graph edges |
| [user_badges](#user_badges) | ~305 | Badges earned |
| [user_progress](#user_progress) | ~316 | Lesson/module completion |

### School Operations Tables
| Table | Line | Description |
|-------|------|-------------|
| [rooms](#rooms) | ~333 | Physical classrooms |
| [terms](#terms) | ~344 | Academic terms |
| [classes](#classes) | ~356 | Class groups |
| [schedules](#schedules) | ~371 | Class meeting times |
| [sessions](#sessions) | ~382 | Individual class instances |
| [attendance](#attendance) | ~395 | Student attendance |
| [enrollments](#enrollments) | ~407 | Class enrollments |
| [placements](#placements) | ~419 | Placement test results |

### Financial Tables
| Table | Line | Description |
|-------|------|-------------|
| [products](#products) | ~436 | Purchasable items |
| [discounts](#discounts) | ~450 | Available discounts |
| [invoices](#invoices) | ~463 | Payment requests |
| [transactions](#transactions) | ~481 | Money movements |
| [teacher_contracts](#teacher_contracts) | ~495 | Teacher payment contracts |
| [payouts](#payouts) | ~508 | Staff payments |

### CRM Tables
| Table | Line | Description |
|-------|------|-------------|
| [leads](#leads) | ~527 | Prospective students |
| [lead_interactions](#lead_interactions) | ~548 | Communication history |
| [trials](#trials) | ~561 | Trial class bookings |
| [referrals](#referrals) | ~576 | Referral tracking |

### AI Memory Tables
| Table | Line | Description |
|-------|------|-------------|
| [memory_graphs](#memory_graphs) | ~593 | Student memory container |
| [memory_nodes](#memory_nodes) | ~613 | Memory graph nodes |
| [memory_edges](#memory_edges) | ~635 | Memory graph edges |
| [memory_ledger](#memory_ledger) | ~653 | Lossless critical facts |
| [memory_contradictions](#memory_contradictions) | ~677 | Conflicting beliefs |
| [student_world_overlay](#student_world_overlay) | ~692 | Fog-of-war perspective |

### Ethics/Supervision Tables
| Table | Line | Description |
|-------|------|-------------|
| [chat_sessions](#chat_sessions) | ~713 | AI conversation sessions |
| [chat_messages](#chat_messages) | ~725 | Encrypted messages |
| [memory_integrity_hashes](#memory_integrity_hashes) | ~737 | Tamper detection |
| [memory_audit_log](#memory_audit_log) | ~748 | Immutable operation log |
| [safety_alerts](#safety_alerts) | ~762 | Escalation alerts |
| [alert_acknowledgments](#alert_acknowledgments) | ~782 | Staff acknowledgments |
| [wellbeing_snapshots](#wellbeing_snapshots) | ~794 | Aggregated indicators |

### Payroll Tables
| Table | Line | Description |
|-------|------|-------------|
| [staff_payroll](#staff_payroll) | ~see payroll-accounting.md | Staff payroll receivables |
| [payroll_payments](#payroll_payments) | ~see payroll-accounting.md | Split payment records |
| [payment_methods](#payment_methods) | ~see payroll-accounting.md | Bank/PIX/card methods |

### Accounting Tables (Lucro Real)
| Table | Line | Description |
|-------|------|-------------|
| [chart_of_accounts](#chart_of_accounts) | ~see payroll-accounting.md | Plano de Contas hierarchy |
| [cost_centers](#cost_centers) | ~see payroll-accounting.md | Centros de Custo |
| [journal_entries](#journal_entries) | ~see payroll-accounting.md | Double-entry headers |
| [journal_entry_lines](#journal_entry_lines) | ~see payroll-accounting.md | Debit/credit lines |
| [fiscal_documents](#fiscal_documents) | ~see payroll-accounting.md | NF-e/NFS-e tracking |
| [tax_withholdings](#tax_withholdings) | ~see payroll-accounting.md | DIRF withholdings |

> 📖 For detailed payroll and accounting table schemas, see [payroll-accounting.md](./payroll-accounting.md)

---


## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐        ┌─────────────┐
│organizations│◄──────│    users    │───────►│  families   │
└─────────────┘       └──────┬──────┘        └─────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ enrollments │       │memory_graphs│       │   invoices  │
└──────┬──────┘       └──────┬──────┘       └─────────────┘
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│   classes   │       │memory_nodes │
└─────────────┘       └─────────────┘
```

---

## Core Tables

### organizations
Multi-tenant school/organization container.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | ULID |
| name | TEXT | School name |
| slug | TEXT UNIQUE | URL-safe identifier |
| clerk_org_id | TEXT | Clerk organization ID |
| settings | JSON | Org-level settings |
| created_at | TIMESTAMP | |

### users
All users across all roles.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | ULID |
| organization_id | TEXT FK | Tenant |
| clerk_user_id | TEXT | Clerk user ID |
| email | TEXT | |
| first_name | TEXT | |
| last_name | TEXT | |
| role | TEXT | student, teacher, parent, staff, school, owner |
| phone | TEXT | |
| whatsapp | TEXT | |
| cpf | TEXT | Brazilian ID |
| birth_date | DATE | |
| avatar_url | TEXT | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### addresses
User addresses (main + billing).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| type | TEXT | main, billing |
| street | TEXT | |
| number | TEXT | |
| complement | TEXT | |
| neighborhood | TEXT | |
| city | TEXT | |
| state | TEXT | |
| zip_code | TEXT | |
| created_at | TIMESTAMP | |

### families
Parent-child relationships.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| parent_id | TEXT FK | User (parent role) |
| child_id | TEXT FK | User (student role) |
| relationship | TEXT | mother, father, guardian, other |
| is_primary | BOOLEAN | Primary responsible |
| created_at | TIMESTAMP | |

---

## Curriculum Tables

### course_types
Types of courses offered.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| code | TEXT | english, spanish, intelligence |
| name | TEXT | Display name |
| description | TEXT | |
| color | TEXT | UI color |
| is_active | BOOLEAN | |

### levels
Proficiency levels (e.g., CEFR).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| course_type_id | TEXT FK | |
| code | TEXT | A1, A2, B1, B2, C1 |
| name | TEXT | Beginner, Intermediate, etc. |
| order | INTEGER | Sort order |

### modules
Curriculum modules within a level.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| level_id | TEXT FK | |
| code | TEXT | m1, m2, m3 |
| name | TEXT | The Orbit, The Slingshot, etc. |
| description | TEXT | |
| order | INTEGER | |
| points_required | INTEGER | Points to complete |
| badge_id | TEXT FK | Completion badge |

### lessons
Individual lessons within modules.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| module_id | TEXT FK | |
| title | TEXT | |
| content_mdx | TEXT | MDX content |
| order | INTEGER | |
| points | INTEGER | Points available |
| estimated_minutes | INTEGER | |
| objectives | JSON | Learning objectives |
| tasks | JSON | Lesson tasks |

### prompts
Prompt templates within lessons.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| lesson_id | TEXT FK | |
| title | TEXT | |
| system_prompt | TEXT | |
| user_template | TEXT | |
| character | TEXT | Role to embody |
| order | INTEGER | |
| technique | TEXT | orbit, slingshot, black_hole, constellation |

### badges
Achievement badges.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| name | TEXT | |
| description | TEXT | |
| icon | TEXT | Icon identifier |
| color | TEXT | |
| category | TEXT | module, technique, streak, special |

---

## Student Toolbox Tables

### student_prompts
Student-created prompts saved to library.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | Student |
| title | TEXT | |
| system_prompt | TEXT | |
| user_template | TEXT | |
| character | TEXT | |
| technique | TEXT | |
| tags | JSON | |
| is_favorite | BOOLEAN | |
| created_at | TIMESTAMP | |

### prompt_runs
Execution history of prompts.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| prompt_id | TEXT FK | Template used |
| student_prompt_id | TEXT FK | Or student prompt |
| input | TEXT | User input |
| output | TEXT | AI response |
| tokens_used | INTEGER | |
| character_held | BOOLEAN | Did AI hold character? |
| created_at | TIMESTAMP | |

### annotations
Journal/annotation entries.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| prompt_run_id | TEXT FK | Optional link |
| content | TEXT | Rich text |
| tags | JSON | |
| created_at | TIMESTAMP | |

### graveyard_ideas
Ideas that didn't work (learn from mistakes).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| idea | TEXT | What was tried |
| why_failed | TEXT | Analysis |
| learned | TEXT | Lesson extracted |
| autopsy_complete | BOOLEAN | |
| created_at | TIMESTAMP | |

### techniques
Technique mastery tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| technique | TEXT | orbit, slingshot, black_hole, constellation |
| usage_count | INTEGER | |
| mastery_level | REAL | 0-1 |
| last_used | TIMESTAMP | |

### todos
Student task management.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| title | TEXT | |
| description | TEXT | |
| urgency | INTEGER | 1-10 |
| importance | INTEGER | 1-10 |
| effort | INTEGER | 1-10 (3D axis) |
| due_date | DATE | |
| completed | BOOLEAN | |
| created_at | TIMESTAMP | |

### knowledge_nodes
Constellation graph nodes.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| label | TEXT | |
| category | TEXT | |
| size | REAL | Visual size |
| x, y, z | REAL | 3D position |
| color | TEXT | |
| created_at | TIMESTAMP | |

### knowledge_edges
Constellation graph edges.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| source_id | TEXT FK | From node |
| target_id | TEXT FK | To node |
| label | TEXT | Relationship type |
| strength | REAL | Visual thickness |

### user_badges
Badges earned by users.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| badge_id | TEXT FK | |
| earned_at | TIMESTAMP | |
| lesson_id | TEXT FK | Optional: which lesson earned it |

### user_progress
Track lesson/module completion.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| module_id | TEXT FK | |
| lesson_id | TEXT FK | |
| points_earned | INTEGER | |
| completed_at | TIMESTAMP | |
| tasks_completed | JSON | Which tasks done |

---

## School Operations Tables

### rooms
Physical classroom locations.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| name | TEXT | Sala 1, Lab, etc. |
| capacity | INTEGER | |
| is_active | BOOLEAN | |

### terms
Academic terms/semesters.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| name | TEXT | 2026/1, Summer 2026 |
| start_date | DATE | |
| end_date | DATE | |
| is_current | BOOLEAN | |

### classes
Class groups.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| term_id | TEXT FK | |
| level_id | TEXT FK | |
| teacher_id | TEXT FK | Primary teacher |
| room_id | TEXT FK | |
| name | TEXT | Inglês A1 - Manhã |
| max_students | INTEGER | |
| is_active | BOOLEAN | |

### schedules
Class meeting times.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| class_id | TEXT FK | |
| day_of_week | INTEGER | 0=Sunday, 6=Saturday |
| start_time | TIME | |
| end_time | TIME | |

### sessions
Individual class sessions (instances).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| class_id | TEXT FK | |
| date | DATE | |
| start_time | TIME | |
| end_time | TIME | |
| status | TEXT | scheduled, in_progress, completed, cancelled |
| notes | TEXT | |

### attendance
Student attendance per session.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| session_id | TEXT FK | |
| user_id | TEXT FK | Student |
| status | TEXT | present, absent, late, excused |
| checked_in_at | TIMESTAMP | |
| notes | TEXT | |

### enrollments
Student enrollment in classes.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | Student |
| class_id | TEXT FK | |
| enrolled_at | TIMESTAMP | |
| dropped_at | TIMESTAMP | |
| status | TEXT | active, dropped, completed, transferred |

### placements
Placement test results.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | |
| course_type_id | TEXT FK | |
| recommended_level_id | TEXT FK | |
| score | INTEGER | |
| tested_at | TIMESTAMP | |
| notes | TEXT | |

---

## Financial Tables

### products
Things that can be purchased.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| name | TEXT | |
| description | TEXT | |
| price | REAL | |
| type | TEXT | tuition, material, enrollment, other |
| recurrence | TEXT | monthly, once, yearly |
| is_active | BOOLEAN | |

### discounts
Available discounts.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| name | TEXT | Sibling, Early Payment |
| type | TEXT | percentage, fixed |
| value | REAL | |
| conditions | JSON | |
| is_active | BOOLEAN | |

### invoices
Payment requests.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| payer_id | TEXT FK | User responsible |
| student_id | TEXT FK | Student if applicable |
| amount | REAL | |
| discount_amount | REAL | |
| due_date | DATE | |
| paid_at | TIMESTAMP | |
| status | TEXT | pending, paid, overdue, cancelled |
| payment_method | TEXT | pix, card, boleto, cash |
| external_id | TEXT | Payment gateway ID |
| items | JSON | Line items |

### transactions
Actual money movements.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| invoice_id | TEXT FK | |
| amount | REAL | |
| type | TEXT | income, expense, refund |
| method | TEXT | pix, card, boleto, cash |
| external_id | TEXT | Gateway transaction ID |
| processed_at | TIMESTAMP | |

### teacher_contracts
Teacher payment contracts.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | Teacher |
| organization_id | TEXT FK | |
| payment_model | TEXT | hourly, per_class, fixed |
| rate | REAL | |
| start_date | DATE | |
| end_date | DATE | |

### payouts
Teacher/staff payments.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | Recipient |
| organization_id | TEXT FK | |
| amount | REAL | |
| period_start | DATE | |
| period_end | DATE | |
| status | TEXT | pending, approved, paid |
| approved_by | TEXT FK | |
| paid_at | TIMESTAMP | |

---

## CRM Tables

### leads
Prospective students/families.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| name | TEXT | |
| email | TEXT | |
| phone | TEXT | |
| source | TEXT | website, referral, walk_in, ad |
| status | TEXT | new, contacted, qualified, trial, enrolled, lost |
| interest | TEXT | Course type interested in |
| assigned_to | TEXT FK | Staff member |
| last_contact | TIMESTAMP | |
| notes | TEXT | |
| utm_source | TEXT | |
| utm_medium | TEXT | |
| utm_campaign | TEXT | |
| created_at | TIMESTAMP | |

### lead_interactions
Communication history with leads.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| lead_id | TEXT FK | |
| user_id | TEXT FK | Staff member |
| type | TEXT | call, email, whatsapp, meeting, note |
| content | TEXT | |
| outcome | TEXT | |
| created_at | TIMESTAMP | |

### trials
Trial class bookings.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| lead_id | TEXT FK | |
| class_id | TEXT FK | |
| session_id | TEXT FK | |
| scheduled_at | TIMESTAMP | |
| status | TEXT | scheduled, confirmed, completed, no_show, cancelled |
| attended | BOOLEAN | |
| feedback | TEXT | |
| follow_up_at | TIMESTAMP | |

### referrals
Referral tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| referrer_id | TEXT FK | User who referred |
| referred_lead_id | TEXT FK | Lead created |
| converted | BOOLEAN | Did lead enroll? |
| reward_given | BOOLEAN | |
| reward_type | TEXT | discount, credit, gift |
| created_at | TIMESTAMP | |

---

## AI Memory Tables

### memory_graphs
Main container for a student's memory topology.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| student_id | TEXT FK | |
| organization_id | TEXT FK | |
| snr | REAL | Signal-to-noise ratio |
| compression_passes | INTEGER | Times compressed |
| loss_vector | BLOB | Entropy loss tracking |
| node_count | INTEGER | |
| edge_count | INTEGER | |
| oldest_memory | TIMESTAMP | |
| newest_memory | TIMESTAMP | |
| version | INTEGER | |
| last_compressed | TIMESTAMP | |
| last_accessed | TIMESTAMP | |
| created_at | TIMESTAMP | |

### memory_nodes
Nodes in the memory graph.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| graph_id | TEXT FK | |
| content | TEXT | Memory content |
| content_hash | TEXT | For integrity checks |
| gravity | REAL | Importance weight (decays) |
| salience | REAL | Initial importance |
| confidence | REAL | How certain |
| modality | TEXT | episodic, semantic, procedural, emotional, sensory |
| sequence | INTEGER | Temporal order |
| timestamp | TIMESTAMP | When memory formed |
| strength | REAL | Connection strength |
| last_accessed | TIMESTAMP | |
| source_type | TEXT | chat, lesson, system |
| source_id | TEXT | |
| embedding | BLOB | Vector for similarity search |
| created_at | TIMESTAMP | |

### memory_edges
Edges connecting memory nodes.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| graph_id | TEXT FK | |
| source_id | TEXT FK | From node |
| target_id | TEXT FK | To node |
| type | TEXT | CAUSES, RELATES_TO, EVOKES, ABOUT, etc. |
| direction | TEXT | forward, backward, bidirectional |
| weight | REAL | |
| valence | REAL | Emotional coloring (-1 to 1) |
| reverse_weight | REAL | |
| sequence | INTEGER | |
| strength | REAL | |
| created_at | TIMESTAMP | |

### memory_ledger
Lossless critical facts (never compressed).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| graph_id | TEXT FK | |
| content | TEXT | Full content |
| summary | TEXT | Short version |
| category | TEXT | promise, secret, debt, threat, fact, instruction, observation |
| importance | REAL | 0-1 |
| trigger_threshold | REAL | When to surface |
| linked_nodes | JSON | Related node IDs |
| triggers | JSON | Keywords/phrases |
| trigger_entities | JSON | People/places |
| source_type | TEXT | |
| source_entity | TEXT | Who/what |
| source_date | TIMESTAMP | |
| is_active | BOOLEAN | |
| expires_at | TIMESTAMP | |
| access_count | INTEGER | |
| last_accessed | TIMESTAMP | |
| created_at | TIMESTAMP | |

### memory_contradictions
Detected conflicting beliefs.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| graph_id | TEXT FK | |
| node_a | TEXT FK | First node |
| node_b | TEXT FK | Second node |
| resolved | BOOLEAN | |
| resolved_to | TEXT FK | Which node won |
| strategy | TEXT | newer_wins, stronger_wins, manual |
| detected_at | TIMESTAMP | |
| resolved_at | TIMESTAMP | |

### student_world_overlay
Student's fog-of-war perspective on shared knowledge.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| student_id | TEXT FK | |
| graph_id | TEXT FK | |
| known_nodes | JSON | Set of node IDs they know |
| known_edges | JSON | Set of edge IDs they know |
| node_overrides | JSON | Attitudes, familiarity per node |
| relationship_cache | JSON | |
| stats | JSON | |
| version | INTEGER | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## Ethics/Supervision Tables

### chat_sessions
AI Companion conversation sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| student_id | TEXT FK | |
| started_at | TIMESTAMP | |
| ended_at | TIMESTAMP | |
| message_count | INTEGER | |
| metadata | JSON | Duration, etc. (not content) |

### chat_messages
Encrypted conversation messages.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| session_id | TEXT FK | |
| role | TEXT | user, assistant, system |
| content_encrypted | BLOB | Encrypted with student key |
| timestamp | TIMESTAMP | |
| tokens_used | INTEGER | |

### memory_integrity_hashes
Hash snapshots for tamper detection.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| student_id | TEXT FK | |
| graph_hash | TEXT | Hash of entire graph |
| ledger_hash | TEXT | Hash of ledger |
| created_at | TIMESTAMP | |

### memory_audit_log
Immutable log of all memory operations.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| student_id | TEXT FK | |
| operation | TEXT | node.created, node.deleted, ledger.added, etc. |
| entity_type | TEXT | node, edge, ledger |
| entity_id | TEXT | |
| actor | TEXT | system, student, compression |
| details | JSON | |
| timestamp | TIMESTAMP | |

### safety_alerts
Escalation protocol alerts.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| student_id | TEXT FK | |
| organization_id | TEXT FK | |
| level | TEXT | green, yellow, orange, red |
| reason | TEXT | What triggered |
| detected_by | TEXT | auditor, teacher, system |
| detected_at | TIMESTAMP | |
| acknowledged_at | TIMESTAMP | |
| acknowledged_by | TEXT FK | |
| resolved_at | TIMESTAMP | |
| resolved_by | TEXT FK | |
| resolution_notes | TEXT | |
| notified_parents | BOOLEAN | |
| notified_authorities | BOOLEAN | |

### alert_acknowledgments
Staff acknowledgment of alerts.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| alert_id | TEXT FK | |
| user_id | TEXT FK | Staff member |
| action_taken | TEXT | |
| notes | TEXT | |
| timestamp | TIMESTAMP | |

### wellbeing_snapshots
Aggregated wellbeing indicators (for AI Auditor).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| student_id | TEXT FK | |
| date | DATE | |
| engagement_score | REAL | 0-1 |
| emotional_indicators | JSON | Aggregated (not content) |
| session_count | INTEGER | |
| total_duration | INTEGER | Minutes |
| anomaly_flags | JSON | Detected anomalies |

---

## Indexes

### Performance-Critical

```sql
-- Memory graph traversal
CREATE INDEX idx_memory_nodes_graph ON memory_nodes(graph_id);
CREATE INDEX idx_memory_nodes_gravity ON memory_nodes(gravity DESC);
CREATE INDEX idx_memory_edges_graph ON memory_edges(graph_id);
CREATE INDEX idx_memory_edges_source ON memory_edges(source_id);
CREATE INDEX idx_memory_edges_target ON memory_edges(target_id);
CREATE INDEX idx_memory_edges_type ON memory_edges(type);

-- Ledger retrieval
CREATE INDEX idx_memory_ledger_graph ON memory_ledger(graph_id);
CREATE INDEX idx_memory_ledger_category ON memory_ledger(category);
CREATE INDEX idx_memory_ledger_importance ON memory_ledger(importance DESC);

-- Safety alerts
CREATE INDEX idx_safety_alerts_student ON safety_alerts(student_id);
CREATE INDEX idx_safety_alerts_level ON safety_alerts(level);
CREATE INDEX idx_safety_alerts_unresolved ON safety_alerts(resolved_at) WHERE resolved_at IS NULL;

-- Common queries
CREATE INDEX idx_users_org_role ON users(organization_id, role);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_invoices_payer ON invoices(payer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

---

*Last updated: 2026-02-03*
