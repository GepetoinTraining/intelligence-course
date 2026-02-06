# Ethics & Privacy Policy

## Overview

This document outlines the ethical framework and privacy architecture governing the relationship between students and their AI Companions at Node Zero / Eco Escola.

**Compliance**: LGPD (Lei 13.709/2018), ECA (Estatuto da Criança e Adolescente), Marco Civil da Internet

---

## Core Principles

### 1. Student Data Sovereignty

All memories, contexts, and conversation history generated in the student-AI interaction **belong to the student**. The institution acts as custodian, not owner.

### 2. Pedagogical Relationship Privacy

Conversations between student and AI Companion are treated with the same confidentiality as traditional pedagogical counseling sessions.

### 3. Architectural Transparency

Students and guardians have the right to understand how their data is stored, processed, and protected.

### 4. Ethical Supervision

Safety mechanisms exist to protect students from harmful content, without violating the privacy of the pedagogical relationship.

### 5. Memory Integrity

Modifications to AI Companion memories are audited and protected against unauthorized manipulation.

---

## Three-Domain Data Architecture

Data is segregated into three distinct domains with different access levels:

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA DOMAINS                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │  INSTITUTIONAL  │  │  RELATIONAL  │  │  SUPERVISION  │   │
│  │                 │  │  (Encrypted) │  │               │   │
│  │  • Grades       │  │  • Memories  │  │  • Metadata   │   │
│  │  • Attendance   │  │  • History   │  │  • Alerts     │   │
│  │  • Certificates │  │  • Profile   │  │  • Audit log  │   │
│  │  • Progress     │  │              │  │  • Wellbeing  │   │
│  │                 │  │              │  │               │   │
│  │  ACCESS:        │  │  ACCESS:     │  │  ACCESS:      │   │
│  │  Teachers       │  │  Student     │  │  AI Auditor   │   │
│  │  Parents        │  │  only        │  │  Coordinators │   │
│  │  Staff          │  │  (decrypts)  │  │  (protocol)   │   │
│  └─────────────────┘  └──────────────┘  └───────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Domain Details

| Domain | Content | Encryption | Access |
|--------|---------|------------|--------|
| **Institutional** | Grades, attendance, certificates, curricular progress | None | Institution, teachers, parents/guardians |
| **Relational** | AI memories, conversation history, learning profile | Student-derived key | Student (owner), AI Companion |
| **Supervision** | Aggregated metadata, safety alerts, audit logs | None (metadata only) | AI Auditor (external), pedagogical coordination (under protocol) |

---

## Encryption & Custody

Relational Domain data is encrypted with a key derived from the student's credentials:

```typescript
// Key derivation
const key = deriveKey(studentPassword, INSTITUTION_SALT);

// The institution cannot access content without student participation
const encrypted = encrypt(chatMessage, key);
```

### Key Properties

| Property | Implementation |
|----------|----------------|
| **Encryption key** | Derived from student password + institutional salt |
| **Recovery** | Only possible via in-person identity verification |
| **Export** | Student can export all data at any time |
| **Portability** | Open format allows migration to other systems |

---

## AI Auditor System (Outsider AI)

To ensure safety without compromising privacy, we implement an external AI supervision system—an independent AI that does not participate in pedagogical conversations but monitors risk patterns.

### Auditor Capabilities

**Security Monitoring**: The AI Auditor analyzes metadata and aggregated patterns to identify potential risk situations:

| Risk Type | Detection Method |
|-----------|------------------|
| Severe emotional distress | Aggregated sentiment patterns |
| Self-harm or suicidal ideation | Keyword density in metadata |
| Signs of abuse or neglect | Behavioral pattern anomalies |
| Anomalous usage patterns | Session frequency/duration outliers |
| System manipulation attempts | Integrity hash mismatches |

**Integrity Verification**: The system maintains cryptographic hashes of AI Companion memories:

- Hash verified each session
- Legitimate changes logged with timestamp and context
- Suspicious modifications trigger human review alert
- Immutable log of all memory operations

### Auditor Limitations

The AI Auditor operates under rigorous restrictions to preserve pedagogical privacy:

| ❌ Cannot | ✅ Can |
|-----------|--------|
| Read full conversation content | Analyze session timestamps |
| Access specific memories | View aggregated sentiment scores |
| Reveal conversation details | Detect pattern anomalies |
| Store content beyond metadata | Verify integrity hashes |

---

## Parent/Guardian Access

We recognize the right and duty of parents/guardians to monitor their minor children's educational development. Simultaneously, we recognize that some degree of privacy is essential for healthy development and pedagogical relationship effectiveness.

### Parent Consultation Interface

Parents can query the AI Auditor about their children's wellbeing and progress:

**✅ Available Information**:
- General engagement level (session frequency, duration)
- Curricular competency progress
- Aggregated emotional wellbeing indicators
- Concern alerts (when applicable)
- Follow-up recommendations

**🔒 Protected Information**:
- Specific conversation content
- Student confessions or venting
- Personal issue details discussed
- AI Companion specific memories

---

## Escalation Protocol

When risk is identified, the system follows an escalation protocol that prioritizes student safety:

### Alert Levels

| Level | Situation | Action |
|-------|-----------|--------|
| 🟢 **Green** | Normal operation, no concerns identified | Standard report available to parents |
| 🟡 **Yellow** | Patterns deserving attention (engagement drop, mild difficulty signs) | Notification suggesting conversation; pedagogical coordination informed |
| 🟠 **Orange** | Signs of significant distress or concerning behavior | Parent meeting convened with pedagogical team; professional support suggested |
| 🔴 **Red** | Imminent risk (self-harm, abuse, danger) | Immediate contact with guardians; protection protocols activated; possible notification to authorities per ECA |

### Escalation Flow

```
Detection → Classification → Notification → Acknowledgment → Resolution

🟢 Green:  No action required
🟡 Yellow: Parents notified, coordinator informed
🟠 Orange: Meeting scheduled, support offered
🔴 Red:    Immediate intervention, ECA protocol if needed
```

---

## Student Rights (LGPD Compliance)

In compliance with LGPD and our institutional ethical principles, students possess the following rights over their data and AI Companion relationship:

### Rights Catalog

| Right | Description | Implementation |
|-------|-------------|----------------|
| **Access** | View all memories and stored data | `/api/rights/access/:studentId` |
| **Rectification** | Request correction of incorrect information | `/api/rights/rectify` |
| **Deletion** | Request deletion of specific memories | `/api/rights/forget` (with safety limits) |
| **Portability** | Export all data in open, interoperable format | `/api/rights/export/:studentId` |
| **Negotiation** | Establish agreements with AI Companion about what will be remembered | `/api/rights/negotiate` |
| **Continuity** | Maintain AI Companion relationship throughout educational journey | Automatic |

### ⚠️ Deletion Limitation

The AI Companion **cannot be instructed to forget** information essential for protecting the student from harm. This is a bidirectional ethical responsibility in the relationship.

**Examples of protected information**:
- Disclosed experiences of abuse
- Expressions of self-harm ideation
- Safety-critical behavioral patterns

---

## Incident Response

### Data Breach

In case of security violation affecting student data:

1. **Immediate containment** and evidence preservation
2. **ANPD notification** within legal timeframe
3. **Communication to affected parties** within 72 hours
4. **Root cause investigation**
5. **Corrective measures implementation**

### Suspicious Memory Alteration

When the AI Auditor detects unauthorized memory alteration:

1. **Immediate isolation** of affected instance
2. **Restoration** from last verified state
3. **Forensic analysis** of incident
4. **Notification** to student and guardians (if applicable)
5. **Access control review**

---

## Governance & Review

This policy is reviewed annually or whenever there are significant changes in applicable legislation, employed technology, or institutional pedagogical practices.

### Oversight Bodies

| Body | Composition | Responsibility |
|------|-------------|----------------|
| **AI Ethics Committee** | Direction, faculty, parents, students (when appropriate) | Review complex cases, propose policy updates |
| **External Audit** | Independent entity | Annual compliance verification |
| **Complaint Channel** | Confidential mechanism | Receive violation reports from students, parents, staff, third parties |

---

## Technical Implementation

### Database Tables

```sql
-- Safety alerts table
safety_alerts (
  id, student_id, organization_id,
  level,              -- green, yellow, orange, red
  reason,             -- What triggered
  detected_by,        -- auditor, teacher, system
  detected_at,
  acknowledged_at, acknowledged_by,
  resolved_at, resolved_by,
  resolution_notes,
  notified_parents,   -- boolean
  notified_authorities -- boolean (ECA)
)

-- Wellbeing snapshots (for Auditor)
wellbeing_snapshots (
  id, student_id, date,
  engagement_score,     -- 0-1
  emotional_indicators, -- JSON (aggregated, not content)
  session_count,
  total_duration,
  anomaly_flags         -- JSON
)

-- Audit log (immutable)
memory_audit_log (
  id, student_id,
  operation,    -- node.created, node.deleted, etc.
  entity_type,  -- node, edge, ledger
  entity_id,
  actor,        -- system, student, compression
  details,      -- JSON
  timestamp
)

-- Integrity hashes
memory_integrity_hashes (
  id, student_id,
  graph_hash,
  ledger_hash,
  created_at
)
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/auditor/wellbeing/:studentId` | Aggregated wellbeing indicators |
| `GET /api/auditor/engagement/:studentId` | Session metrics |
| `POST /api/auditor/analyze` | Trigger safety analysis |
| `POST /api/auditor/verify-integrity/:studentId` | Hash verification |
| `GET /api/parent/child/:childId/wellbeing` | Parent-facing wellbeing |
| `GET /api/parent/child/:childId/alerts` | Parent-facing alerts |
| `GET /api/rights/access/:studentId` | LGPD data access |
| `POST /api/rights/forget` | LGPD deletion request |
| `GET /api/rights/export/:studentId` | LGPD data export |

---

## Glossary

| Term | Definition |
|------|------------|
| **AI Companion** | Artificial intelligence system designated to accompany the student on their educational journey, developing contextual memory and adapting to their learning profile |
| **AI Auditor (Outsider AI)** | Independent artificial intelligence system responsible for monitoring safety and integrity without accessing private conversation content |
| **Relational Domain** | Dataset comprising the student-AI Companion relationship, including memories, history, and learning profile |
| **Integrity Hash** | Cryptographic signature that verifies if data has been altered without revealing its content |
| **Metadata** | Information about conversations (frequency, duration, timestamps) without including message content |

---

*Document approved by Eco Escola e Coworking Educacional Board of Directors*

*February 2026*

---

*Last updated: 2026-02-03*
