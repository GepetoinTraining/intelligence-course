# Commercial Module - Sales Operations Architecture

> **Version**: 1.0 | **Status**: Schema Complete ✅

---

## Overview

The Commercial Module supports **two distinct sales operation models**:

### 🔇 Passive Sales Team (Inside Sales)
- **Focus**: Phone, messaging (WhatsApp), content nurturing
- **Roles**: Pre-sales (SDR) + Closer
- **Activities**: Follow-ups, presentations, proposals, closing
- **Location**: Mostly in-office, occasional company visits

### 📣 Active Sales Team (Field Sales)
- **Focus**: Brand activations, events, door-to-door, partnerships
- **Roles**: Activators + Pre-sales + Closer
- **Activities**: Sweepstakes, coupon distribution, demos, flyering
- **Location**: Field operations at malls, events, partners, schools

---

## 🗄️ Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMMERCIAL MODULE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   salesTeams    │───▶│salesTeamMembers │◀───│     users       │         │
│  │ passive/active  │    │ role, targets   │    │                 │         │
│  └────────┬────────┘    └─────────────────┘    └─────────────────┘         │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  salesCalendar  │───▶│  salesActions   │───▶│  salesPipeline  │         │
│  │  team events    │    │  individual     │    │  lead journey   │         │
│  └────────┬────────┘    │  tasks          │    └────────┬────────┘         │
│           │             └─────────────────┘             │                   │
│           ▼                                             ▼                   │
│  ┌─────────────────┐                        ┌─────────────────────┐        │
│  │brandActivations │                        │   salesTouches      │        │
│  │ sweepstakes    │                        │   contact log       │        │
│  │ coupons, demos │                        └─────────────────────┘        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│     ┌─────┴─────┐                                                           │
│     ▼           ▼                                                           │
│  ┌───────┐  ┌──────────────────┐                                           │
│  │coupons│  │sweepstakesEntries│                                           │
│  └───────┘  └──────────────────┘                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Tables Reference

### Team Management

| Table | Purpose |
|-------|---------|
| `salesTeams` | Teams with type (passive/active/hybrid), leader, targets |
| `salesTeamMembers` | User↔Team with role (pre_sales, closer, activator) |

### Planning & Coordination

| Table | Purpose |
|-------|---------|
| `salesCalendar` | Team calendar with all event types, locations, materials |
| `salesActions` | Individual tasks assigned to team members |

### Pipeline Tracking

| Table | Purpose |
|-------|---------|
| `salesPipeline` | Lead's journey: new → contacted → qualified → trial → won/lost |
| `pipelineStageHistory` | Stage change audit trail |
| `salesTouches` | Every interaction (call, WhatsApp, email, meeting) |

### Field Operations

| Table | Purpose |
|-------|---------|
| `brandActivations` | Sweepstakes, demos, stands, flyering events |
| `coupons` | Discount codes with usage tracking |
| `couponRedemptions` | Individual redemption records |
| `sweepstakesEntries` | Contest participants and winners |

### Analytics

| Table | Purpose |
|-------|---------|
| `salesTeamDailyMetrics` | Daily activity and results per team/person |

---

## 👥 Team Roles

### Pre-Sales (SDR)
```
Responsibilities:
├── Initial lead contact
├── Qualification (fit/budget/timing)
├── Information gathering (3x3 insights)
├── Trial class scheduling
└── Nurturing until qualified

KPIs:
├── Leads contacted
├── Qualification rate
├── Trials scheduled
└── Handoff quality score
```

### Closer (Account Executive)
```
Responsibilities:
├── Sales presentations
├── Proposal generation
├── Price negotiation
├── Objection handling
└── Deal closing

KPIs:
├── Proposals sent
├── Win rate
├── Average deal size
├── Time to close
└── Revenue generated
```

### Activator (Field Agent)
```
Responsibilities:
├── Brand activation execution
├── Coupon distribution
├── Sweepstakes management
├── Lead collection in field
└── Partner relationship

KPIs:
├── Contacts collected
├── Leads generated
├── Coupons distributed
├── Activation ROI
└── Partner satisfaction
```

---

## 📅 Sales Calendar Event Types

### Passive Team Activities
| Event Type | Description |
|------------|-------------|
| `follow_up_block` | Scheduled follow-up time block |
| `call_block` | Phone call session |
| `content_session` | Content creation/nurturing |
| `meeting` | Internal team meeting |
| `presentation` | Online sales presentation |

### Active Team Activities
| Event Type | Description |
|------------|-------------|
| `brand_activation` | Field activation event |
| `door_to_door` | D2D sales operation |
| `flyering` | Flyer distribution |
| `partner_visit` | Visit partner location |
| `corporate_visit` | B2B company visit |
| `school_visit` | Visit potential school client |
| `event_attendance` | Attend external event |

### Both Teams
| Event Type | Description |
|------------|-------------|
| `trial_class` | Experimental class |
| `open_house` | School open house |
| `team_sync` | Team coordination meeting |

---

## 🎯 Sales Pipeline Stages

```
                        PRE-SALES (SDR)                    │        CLOSER
                                                           │
  ┌──────┐    ┌───────────┐    ┌───────────┐    ┌─────────┐│  ┌───────────────┐
  │ NEW  │───▶│ CONTACTED │───▶│ QUALIFIED │───▶│NURTURING││──▶│TRIAL_SCHEDULED│
  └──────┘    └───────────┘    └───────────┘    └─────────┘│  └───────┬───────┘
                                                           │          │
                                                           │          ▼
                                                           │  ┌───────────────┐
                                                           │  │TRIAL_COMPLETED│
                                                           │  └───────┬───────┘
                                                           │          │
                                                           │          ▼
                                                           │  ┌───────────────┐
                                                           │  │ PROPOSAL_SENT │
                                                           │  └───────┬───────┘
                                                           │          │
                                                           │          ▼
                                                           │  ┌───────────────┐
                                                           │  │  NEGOTIATING  │
                                                           │  └───────┬───────┘
                                                           │          │
                                                           │          ▼
                                                           │  ┌───────────────┐
                                                           │  │  VERBAL_YES   │
                                                           │  └───────┬───────┘
                                                           │          │
                                           ┌───────────────┴──────────┴────────────────┐
                                           │                                           │
                                           ▼                                           ▼
                                       ┌───────┐                                   ┌───────┐
                                       │  WON  │                                   │ LOST  │
                                       │ ✅    │                                   │ ❌    │
                                       └───────┘                                   └───────┘
                                                                                       │
                                                                                       ▼
                                                                                  ┌─────────┐
                                                                                  │ DORMANT │
                                                                                  │ (may    │
                                                                                  │ return) │
                                                                                  └─────────┘
```

---

## 🎰 Brand Activations

### Activation Types
| Type | Description | Typical Materials |
|------|-------------|-------------------|
| `sweepstakes` | Sorteio with prize | Forms, tablets, prizes |
| `coupon_distribution` | Discount code handout | Flyers with QR, tablets |
| `product_demo` | Live demonstration | Demo equipment, tablets |
| `experience` | Immersive experience | Full setup, staff |
| `popup_stand` | Temporary booth | Banner, table, flyers |
| `sampling` | Free samples/trials | Trial materials |
| `competition` | Challenge/contest | Props, prizes |
| `partnership_event` | Joint event with partner | Co-branded materials |

### Activation Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ACTIVATION LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [DRAFT] ──▶ [APPROVED] ──▶ [SCHEDULED] ──▶ [IN_PROGRESS] ──▶ [COMPLETED]   │
│                                     │                                        │
│                                     ▼                                        │
│                              ┌─────────────┐                                │
│                              │ QR Code     │                                │
│                              │ Generated   │                                │
│                              │ for tracking│                                │
│                              └──────┬──────┘                                │
│                                     │                                        │
│                                     ▼                                        │
│                         ┌───────────────────────┐                           │
│                         │ On-site Data Capture  │                           │
│                         ├───────────────────────┤                           │
│                         │ • Sweepstakes entries │                           │
│                         │ • Coupon scans        │                           │
│                         │ • Lead forms          │                           │
│                         │ • Contact collection  │                           │
│                         └───────────────────────┘                           │
│                                     │                                        │
│                                     ▼                                        │
│                              ┌─────────────┐                                │
│                              │  Results    │                                │
│                              │ tracked in  │                                │
│                              │ activation  │                                │
│                              │ record      │                                │
│                              └─────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎫 Coupon System

### Discount Types
| Type | Description | Example |
|------|-------------|---------|
| `percentage` | % off enrollment | 15% off |
| `fixed_amount` | Fixed $ amount off | R$ 200 off |
| `free_trial` | Free trial class | Trial grátis |
| `free_material` | Free materials | Apostila grátis |

### Coupon Lifecycle
```
[CREATE] ──▶ [DISTRIBUTE] ──▶ [REDEEM] ──▶ [TRACK]
   │              │              │            │
   │              │              │            ▼
   │              │              │     ┌──────────────┐
   │              │              │     │ Analytics:   │
   │              │              │     │ - Distributed│
   │              │              │     │ - Redeemed   │
   │              │              │     │ - Value saved│
   │              │              │     └──────────────┘
   │              │              │
   │              │              ▼
   │              │      [couponRedemptions]
   │              │      - Who redeemed
   │              │      - When
   │              │      - Value applied
   │              │
   │              ▼
   │      [Activation, Partner,
   │       Direct distribution]
   │
   ▼
[coupons]
- Code, discount
- Validity
- Max uses
```

---

## 📊 Metrics & KPIs

### Team-Level (Daily)
| Metric | Passive Team | Active Team |
|--------|--------------|-------------|
| Calls/Messages | ✅ | – |
| Contacts Collected | – | ✅ |
| Leads Qualified | ✅ | ✅ |
| Trials Scheduled | ✅ | ✅ |
| Proposals Sent | ✅ | – |
| Deals Won | ✅ | ✅ |
| Activations | – | ✅ |
| Coupons Distributed | – | ✅ |

### Individual Performance
```json
{
  "callsMade": 45,
  "callsConnected": 28,
  "messagesSent": 120,
  "leadsContacted": 35,
  "leadsQualified": 12,
  "trialsScheduled": 8,
  "dealsWon": 3,
  "revenueCents": 450000
}
```

---

## 🔗 Integration with Marketing Module

### Lead Flow
```
[Marketing]                          [Commercial]
                                     
visitors ──▶ leads ──────────────────▶ salesPipeline
    │           │                          │
    │           │                          │
    │     ┌─────┴─────┐              ┌─────┴─────┐
    │     │           │              │           │
    ▼     ▼           ▼              ▼           ▼
sessions  campaigns   qrScans    salesTouches  won/lost
          attribution             touchpoints   
```

### Activation ↔ QR ↔ Campaign
```
Campaign "Verão 2026"
    │
    ├──▶ brandActivation "Shopping Ibirapuera"
    │         │
    │         ├──▶ qrCode (tracks scans)
    │         │
    │         ├──▶ coupons (VERAO15)
    │         │
    │         └──▶ sweepstakesEntries
    │
    └──▶ Leads attributed to campaign
              │
              └──▶ salesPipeline tracking
```

---

## 📱 UI Pages Needed

| Page | Path | Purpose |
|------|------|---------|
| Sales Command | `/staff/comercial` | Team dashboard, today's agenda |
| Team Calendar | `/staff/comercial/calendario` | Calendar view with all events |
| Pipeline | `/staff/comercial/pipeline` | Kanban board of leads |
| Tasks | `/staff/comercial/tarefas` | Action items for user |
| Activations | `/staff/comercial/ativacoes` | Brand activation planning |
| Coupons | `/staff/comercial/cupons` | Coupon management |
| Team Management | `/admin/comercial/equipes` | Teams and members |
| Team Analytics | `/admin/comercial/metricas` | Performance reports |

---

*Commercial Module Schema Complete. Ready for API and UI implementation.*
