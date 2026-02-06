# Operational Staff Module - Reception & Front Desk

> **Version**: 1.0 | **Status**: Schema Complete ✅

---

## Overview

The Operational Staff Module (Atendimento/Recepção) handles all front-desk operations:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OPERATIONAL STAFF WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────┐     ┌──────────┐     ┌───────────┐     ┌───────────┐        │
│    │ Check-in│ ──▶ │  Intake  │ ──▶ │  Trial/   │ ──▶ │ Checkout  │        │
│    │ Visit   │     │ Interview│     │  Present  │     │  Process  │        │
│    └─────────┘     └──────────┘     └───────────┘     └─────┬─────┘        │
│                                                              │              │
│                                      ┌─────────────────┬─────┴─────┐        │
│                                      ▼                 ▼           ▼        │
│                               ┌──────────┐     ┌──────────┐  ┌──────────┐  │
│                               │ Contract │     │  Follow  │  │   Lost   │  │
│                               │ Signing  │     │   Up     │  │   ❌     │  │
│                               └────┬─────┘     └──────────┘  └──────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│                               ┌──────────┐                                  │
│                               │ Enrolled │                                  │
│                               │   ✅     │                                  │
│                               └──────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schema Tables (12 new tables)

| Category | Tables |
|----------|--------|
| **Cashier** | `cashiers`, `cashierSessions`, `cashTransactions` |
| **Reception** | `receptionVisits`, `intakeInterviews`, `checkoutRecords` |
| **Contracts** | `contracts` |
| **Collections** | `paymentReminders`, `lateFeeNegotiations` |
| **Scheduling** | `makeupClasses` |
| **Authority** | `staffAuthorityLevels` |

---

## 💰 Cashier Operations

### Cashier (Individual Register)
Each operational staff member has their own cashier:

```
┌──────────────────────────────────────────────────────────────┐
│                          CASHIER                              │
├──────────────────────────────────────────────────────────────┤
│  Name: "Caixa Maria"                                          │
│  User: Maria Silva                                            │
│  Status: OPEN ✅                                              │
├──────────────────────────────────────────────────────────────┤
│  Opening Balance:    R$ 200,00                                │
│  Expected Balance:   R$ 1.450,00                              │
│  Current Balance:    R$ 1.450,00                              │
│  Discrepancy:        R$ 0,00  ✓                               │
└──────────────────────────────────────────────────────────────┘
```

### Cashier Session (Daily Open/Close)

```
SESSION LIFECYCLE:

[OPEN] ──▶ [TRANSACTIONS] ──▶ [CLOSING] ──▶ [CLOSED] ──▶ [AUDITED]
   │                               │
   │                               ▼
   │                    ┌───────────────────┐
   │                    │ Discrepancy Check │
   │                    │ If ≠ 0: Note req. │
   │                    └───────────────────┘
   │
   ▼
┌──────────────────────┐
│ Transaction Types:   │
├──────────────────────┤
│ • payment_received   │
│ • refund_given       │
│ • sangria (withdraw) │
│ • suprimento (add)   │
│ • adjustment         │
└──────────────────────┘
```

### Transaction Flow

```typescript
// Example: Cash payment received
{
  transactionType: "payment_received",
  amountCents: 50000,         // R$ 500,00
  balanceAfterCents: 145000,  // R$ 1.450,00
  paymentMethod: "cash",
  enrollmentId: "enr_123",
  description: "Mensalidade Janeiro",
  receiptNumber: "REC-2026-0001",
  processedBy: "user_maria"
}
```

---

## 🚪 Reception Visits

### Visit Flow

```
[ARRIVAL] ──▶ [CHECK-IN] ──▶ [WAITING] ──▶ [BEING ATTENDED] ──▶ [COMPLETED]
    │              │             │               │
    │              │             │               └── Assigned to closer/teacher
    │              │             │
    │              │             └── Wait time tracked
    │              │
    │              └── Receptionist records visit purpose
    │
    └── Walk-in OR scheduled appointment
```

### Visit Purposes

| Purpose | Description | Next Step |
|---------|-------------|-----------|
| `first_visit` | First time visitor | Intake interview |
| `trial_class` | Here for trial | Assign to teacher |
| `presentation` | Sales presentation | Assign to closer |
| `enrollment` | Ready to enroll | Checkout → Contract |
| `payment` | Make payment | Cashier |
| `class` | Regular class | Check into class |
| `makeup_class` | Reposição | Assign to class |
| `meeting` | Meeting | Assign to staff |
| `pickup_materials` | Materials | Release materials |

---

## 📋 Intake Interview (2nd Interview)

The **intake interview** is a conversational process to understand the client:

### Information Collected

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTAKE INTERVIEW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STUDENT INFO                      AVAILABILITY                              │
│  ├── Name                          ├── Available days                        │
│  ├── Age/Birthdate                 ├── Time slots                           │
│  └── School (name, shift, hours)   └── Preferred frequency                  │
│                                                                              │
│  GOALS                             FAMILY (if minor)                         │
│  ├── Primary goal                  ├── Responsible name                      │
│  ├── Previous experience           ├── Responsible CPF                       │
│  └── Current level                 ├── Phone/Email                          │
│                                    └── Relationship                          │
│                                                                              │
│  3x3 INSIGHTS (discovered)         NOTES FOR CLOSER                          │
│  ├── Dreams                        ├── Recommended course                    │
│  ├── Hobbies                       ├── Recommended schedule                  │
│  └── Aspirations                   └── Potential objections                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### School Shift Options
- `morning` - Manhã
- `afternoon` - Tarde
- `full_time` - Integral
- `night` - Noite
- `homeschool` - Homeschool
- `not_applicable` - Adulto

---

## ✅ Checkout Process

When a visit ends, operational staff records the outcome:

### Checkout Outcomes

| Outcome | Description | Action |
|---------|-------------|--------|
| `enrolled` | Closed the deal! 🎉 | → Contract flow |
| `scheduling_trial` | Will schedule trial | → Schedule |
| `thinking` | Needs time | → Follow-up |
| `price_objection` | Price issue | → Follow-up |
| `timing_objection` | Timing issue | → Follow-up |
| `not_interested` | Not interested | → Mark lost |
| `competitor` | Going elsewhere | → Mark lost |
| `will_return` | Coming back later | → Follow-up |
| `payment_only` | Just paid | → Complete |
| `class_completed` | Attended class | → Complete |

### Checkout → Contract Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CHECKOUT → CONTRACT FLOW                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Closer feedback       "How did it go?"                               │
│         │                 Record closer's notes                          │
│         ▼                                                                │
│  2. Outcome recorded      → enrolled ✅                                  │
│         │                                                                │
│         ▼                                                                │
│  3. Contract generation   Create from template                           │
│         │                 Fill in: student, responsible, values          │
│         ▼                                                                │
│  4. Send for signature    Portal BR / D4Sign / DocuSign / etc.           │
│         │                                                                │
│         ▼                                                                │
│  5. Signed!               Store signed PDF                               │
│         │                                                                │
│         ▼                                                                │
│  6. Enrollment created    Student is enrolled                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Digital Contracts

### Signature Providers Supported

| Provider | Description |
|----------|-------------|
| `portal_br` | Portal BR - Brazilian e-signature |
| `d4sign` | D4Sign |
| `docusign` | DocuSign |
| `clicksign` | ClickSign |
| `zapsign` | ZapSign |
| `in_person` | In-person signing |

### Contract Lifecycle

```
[DRAFT] → [PENDING_GENERATION] → [GENERATED] → [SENT_FOR_SIGNATURE]
                                                        │
                                           ┌────────────┴────────────┐
                                           ▼                         ▼
                                  [PARTIALLY_SIGNED]              [EXPIRED]
                                           │                      [CANCELLED]
                                           ▼
                                       [SIGNED] ✅
                                           │
                                           ▼
                                  [Store signed PDF]
```

---

## 💳 Payment Reminders

### Reminder Escalation

| Type | Timing | Tone |
|------|--------|------|
| `upcoming` | 3 days before | Friendly reminder |
| `due_today` | Due date | Gentle nudge |
| `overdue_3_days` | +3 days | First follow-up |
| `overdue_7_days` | +7 days | Second follow-up |
| `overdue_15_days` | +15 days | Firm reminder |
| `overdue_30_days` | +30 days | Urgent |
| `overdue_60_days` | +60 days | Final notice |
| `final_notice` | Before action | Last chance |

### Channels
- WhatsApp (primary)
- SMS
- Email
- Phone call
- In-person

---

## 🤝 Late Fee Negotiations

Operational staff can negotiate late fees **within their authority level**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NEGOTIATION AUTHORITY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Staff: Maria                                                                │
│  ├── Can negotiate late fees: ✅                                            │
│  ├── Max discount: 50% OR R$ 50,00 (whichever is less)                      │
│  └── Above limit: Requires manager approval                                  │
│                                                                              │
│  EXAMPLE:                                                                    │
│  ├── Original: R$ 500,00                                                    │
│  ├── Late fee: R$ 60,00 (12%)                                               │
│  ├── Total due: R$ 560,00                                                   │
│  │                                                                          │
│  ├── Client requests discount                                                │
│  ├── Maria can reduce late fee by up to R$ 30,00 (50%)                      │
│  ├── Final: R$ 530,00                                                       │
│  └── ✅ Within authority - No approval needed                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Negotiation Reasons

- `financial_hardship` - Dificuldade financeira
- `long_time_client` - Cliente antigo
- `first_time_late` - Primeiro atraso
- `partial_payment` - Pagamento parcial
- `retention_risk` - Risco de cancelamento

---

## 📅 Makeup Classes (Reposições)

### Makeup Class Flow

```
[MISSED CLASS] → [PENDING] → [SCHEDULED] → [STATUS]
      │                           │              │
      │                           │         ┌────┴────┐
      │                           │         ▼         ▼
      │                           │    [COMPLETED] [NO_SHOW]
      │                           │         ✅
      │                           │
      │                           └── Before validUntil
      │
      ├── Reason tracked:
      │   • student_absence
      │   • teacher_absence
      │   • holiday
      │   • weather
      │   • emergency
      │
      └── Validity period (e.g., 30 days)
```

### Makeup Class Record

```javascript
{
  enrollmentId: "enr_123",
  userId: "user_456",
  originalDate: 1738800000,
  missedReason: "student_absence",
  scheduledDate: 1739404800,
  scheduledTime: "14:00",
  roomId: "room_2",
  teacherId: "teacher_001",
  validUntil: 1741392000,    // Must use within 30 days
  status: "scheduled"
}
```

---

## 👮 Staff Authority Levels

Defines what each operational staff member can do:

| Permission | Description | Default |
|------------|-------------|---------|
| `canNegotiateLateFees` | Can reduce late fees | ✅ |
| `maxLateFeeDiscountPercent` | Max % discount on late fees | 50% |
| `maxLateFeeDiscountCents` | Max R$ discount | R$ 50 |
| `canProcessRefunds` | Can issue refunds | ❌ |
| `maxRefundCents` | Max refund amount | R$ 0 |
| `canApplyDiscounts` | Can discount enrollment | ❌ |
| `maxDiscountPercent` | Max enrollment discount | 0% |
| `maxCashWithdrawal` | Max sangria/withdrawal | - |
| `canScheduleMakeupClasses` | Can schedule reposições | ✅ |
| `canRescheduleClasses` | Can reschedule classes | ✅ |
| `canSendContracts` | Can send contracts | ✅ |
| `canVoidContracts` | Can void contracts | ❌ |

---

## 📱 UI Pages Needed

| Page | Path | Purpose |
|------|------|---------|
| Reception Dashboard | `/staff/recepcao` | Today's visits, queue |
| Cashier | `/staff/recepcao/caixa` | Cash register |
| Visits | `/staff/recepcao/visitas` | Check-in/out |
| Intake Interview | `/staff/recepcao/entrevista/[id]` | Intake form |
| Checkout | `/staff/recepcao/checkout/[id]` | Process checkout |
| Contracts | `/staff/recepcao/contratos` | Contract management |
| Payment Reminders | `/staff/recepcao/cobranca` | Collections |
| Makeup Classes | `/staff/recepcao/reposicoes` | Reposição scheduling |

---

## 🔗 Integration with Other Modules

### Commercial → Operations Flow

```
[Lead arrives for trial]
       ↓
receptionVisits (check-in)
       ↓
intakeInterviews (2nd interview)
       ↓
[Trial or Presentation with Closer]
       ↓
checkoutRecords (record outcome)
       ↓
[If enrolled] → contracts → enrollment
```

### Financial → Operations Flow

```
[Payment due]
       ↓
paymentReminders (automated/manual)
       ↓
[If late]
       ↓
lateFeeNegotiations (within authority)
       ↓
cashTransactions (record payment)
```

---

*Operational Staff Module Schema Complete. Ready for API and UI implementation.*
