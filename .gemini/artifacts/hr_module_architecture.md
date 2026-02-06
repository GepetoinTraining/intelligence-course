# HR Module Architecture (PeopleOS)

## Overview

The HR Module is the complete people management layer of NodeZero. It handles:
- **Staff Contracts** - CLT, PJ, intern, freelancer relationships
- **Time & Attendance** - GPS geo-fenced clock in/out
- **Org Chart** - Hierarchical position structure
- **Teams** - Cross-functional team management
- **Talent Pool** - Candidate tracking and hiring
- **Termination Planning** - "Plan to Fire" cost simulation
- **Labor Provisions** - Brazilian 13º, férias, FGTS reserves
- **Benefits** - VR, VA, VT, health plans

---

## Employment Types

### Contract Types

| Type | Portuguese | Description |
|------|------------|-------------|
| `clt` | CLT | Formal employment (Consolidação das Leis do Trabalho) |
| `pj` | PJ | Service provider (Pessoa Jurídica) |
| `freelance` | Freelance | Per-project contractor |
| `intern` | Estagiário | Internship |
| `volunteer` | Voluntário | Volunteer work |

### CLT vs PJ Comparison

| Aspect | CLT | PJ |
|--------|-----|-----|
| Employment Tax | 68%+ employer burden | ~15% on invoice |
| 13th Salary | ✅ Required | ❌ N/A |
| Vacation | ✅ 30 days + 1/3 | ❌ N/A |
| FGTS | ✅ 8% monthly | ❌ N/A |
| Dismissal Cost | High (40% FGTS + aviso) | Low (notice only) |
| Benefits | Often required | Negotiable |

---

## GPS Geo-fenced Time Logging

### How It Works

```
EMPLOYEE OPENS APP
    │
    ▼
┌────────────────────────────────────┐
│  1. GET GPS COORDINATES            │
│     latitude, longitude, accuracy  │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  2. FIND NEAREST LOCATION          │
│     Calculate distance to each org │
│     location using Haversine       │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  3. CHECK GEOFENCE                 │
│                                    │
│  distance <= geofenceRadius?       │
│  ├── YES → Clock in allowed        │
│  └── NO  → Check settings          │
│            ├── Allow outside: ⚠️   │
│            └── Block: ❌ Denied     │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  4. RECORD ENTRY                   │
│     - GPS coordinates              │
│     - Distance from location       │
│     - Device info                  │
│     - Optional: selfie photo       │
└────────────────────────────────────┘
```

### Location Configuration

```typescript
organizationLocations: {
    id: string;
    name: string;                    // "Escola Centro"
    
    // Geo-fence config
    latitude: number;                // -23.550520
    longitude: number;               // -46.633309
    geofenceRadiusMeters: number;    // 100 (default)
    
    allowClockInOutsideGeofence: boolean;  // For flexibility
}
```

### Clock Entry Types

| Type | Description |
|------|-------------|
| `clock_in` | Start of work |
| `clock_out` | End of work |
| `break_start` | Lunch/break start |
| `break_end` | Return from break |

### Distance Calculation (Haversine)

```typescript
function calculateDistance(lat1, lon1, lat2, lon2): number {
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
}
```

---

## Organization Chart

### Position Hierarchy

```
                    ┌─────────────────┐
                    │     Diretor     │  Level 0
                    │   (Owner/CEO)   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────┴─────┐     ┌─────┴─────┐     ┌─────┴─────┐
    │ Gerente   │     │ Gerente   │     │ Gerente   │  Level 1
    │ Comercial │     │ Pedagógico│     │Administrativo│
    └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
          │                 │                 │
    ┌─────┴─────┐     ┌─────┴─────┐     ┌─────┴─────┐
    │  Vendedor │     │  Professor│     │ Secretária│  Level 2
    └───────────┘     └───────────┘     └───────────┘
```

### Position Schema

```typescript
orgChartPositions: {
    id: string;
    title: string;              // "Diretor Pedagógico"
    parentPositionId?: string;  // Reports to
    level: number;              // 0 = top
    
    headcount: number;          // How many people
    minSalaryCents?: number;
    maxSalaryCents?: number;
    
    positionType: 'leadership' | 'management' | 'specialist' | 
                  'operational' | 'support' | 'intern' | 'contractor';
}
```

---

## Teams

Teams are cross-functional groups that may span multiple positions.

### Team Types

| Type | Description |
|------|-------------|
| `department` | Permanent department (Comercial, Pedagógico) |
| `squad` | Agile team |
| `chapter` | Skill-based group (Frontend, Backend) |
| `project` | Temporary project team |
| `committee` | Advisory/governance committee |

### Team vs Org Chart

| Org Chart | Teams |
|-----------|-------|
| Reporting structure | Collaboration structure |
| "Who answers to whom" | "Who works with whom" |
| Permanent hierarchy | Flexible groups |
| One position per person | Multiple teams per person |

---

## Talent Pool (Candidates)

Track job applicants through the hiring pipeline.

### Candidate Journey

```
NEW → SCREENING → INTERVIEWING → OFFER → HIRED
  ↓        ↓           ↓          ↓
REJECTED  REJECTED   REJECTED   WITHDRAWN
```

### Candidate Schema

```typescript
talentPoolCandidates: {
    id: string;
    name: string;
    email: string;
    phone: string;
    
    // Application
    desiredPositionId?: string;
    desiredRole?: string;
    desiredSalaryCents?: number;
    
    // Source tracking
    source: 'job_board' | 'referral' | 'direct' | 'linkedin' | 'agency';
    referredBy?: string;
    
    // Evaluation
    evaluationScore: number;    // 1-100
    skills: string[];           // JSON array
    
    status: 'new' | 'screening' | 'interviewing' | 'offer' | 
            'hired' | 'rejected' | 'withdrawn' | 'on_hold';
    
    // Conversion
    hiredAsUserId?: string;
    hiredAt?: number;
}
```

---

## Termination Planning ("Plan to Fire")

### Purpose

Before actually terminating an employee, create a "Plan to Fire" to:
1. **Calculate all costs** - Know exactly what termination will cost
2. **Get approval** - Require owner/manager approval
3. **Compare scenarios** - Dismissal with cause vs without cause
4. **Reserve funds** - Ensure cash is available

### Termination Types

| Type | Portuguese | FGTS Multiplier | Notice |
|------|------------|-----------------|--------|
| `dismissal_without_cause` | Demissão sem justa causa | 40% | 30+ days |
| `dismissal_with_cause` | Demissão por justa causa | 0% | None |
| `resignation` | Pedido de demissão | 0% | 30 days |
| `mutual_agreement` | Acordo | 20% | 15 days |
| `contract_end` | Fim de contrato | 0% | - |
| `retirement` | Aposentadoria | 40% | - |

### Cost Simulation

```
TERMINATION COST BREAKDOWN
─────────────────────────────────────────────────────────
Employee: João Silva
Type: Dismissal Without Cause
Salary: R$3.000/month
Time at company: 2 years, 4 months

COMPONENT                              VALUE
─────────────────────────────────────────────────────────
Aviso Prévio (33 days)              R$ 3.300,00
Férias Vencidas (4 months)          R$ 1.000,00
1/3 Férias                          R$   333,33
13º Proporcional (4/12)             R$ 1.000,00
FGTS Balance                        R$ 8.640,00
Multa FGTS (40%)                    R$ 3.456,00
─────────────────────────────────────────────────────────
TOTAL TERMINATION COST              R$17.729,33
─────────────────────────────────────────────────────────
Equivalent to 5.9 months of salary
```

### Termination Plan Workflow

```
DRAFT
  │
  ▼
SIMULATING ←─────────────────┐
  │                          │
  │ (recalculate)            │
  │                          │
  ▼                          │
PENDING_APPROVAL ────────────┘
  │
  │ (owner approves)
  ▼
APPROVED
  │
  │ (HR executes)
  ▼
EXECUTING
  │
  │ (completed)
  ▼
EXECUTED
```

---

## Brazilian Labor Provisions

### What Are Provisions?

Monthly reserves set aside to cover future obligations:
- **13th Salary** (Décimo Terceiro) - Paid in Nov/Dec
- **Vacation** (Férias + 1/3) - 30 days after 12 months
- **Termination** - FGTS penalty, notice period

### Provision Settings

```typescript
laborProvisionSettings: {
    organizationId: string;
    
    // 13th Salary
    provision13th: boolean;              // true
    provision13thPercent: number;        // 8.33% (1/12)
    
    // Vacation (1/12 + 1/3)
    provisionVacation: boolean;          // true
    provisionVacationPercent: number;    // 11.11%
    
    // Termination (optional)
    provisionTermination: boolean;       // false
    provisionTerminationPercent: number; // ~4%
    
    // FGTS (required by law)
    fgtsPercent: number;                 // 8%
    
    // INSS employer
    inssEmployerPercent: number;         // 20%
}
```

### Monthly Provision Calculation

For an employee earning R$3.000/month:

| Provision | Percentage | Monthly Value |
|-----------|------------|---------------|
| 13th Salary | 8.33% | R$249,90 |
| Vacation + 1/3 | 11.11% | R$333,30 |
| Termination Reserve | 4.00% | R$120,00 |
| FGTS | 8.00% | R$240,00 |
| **Total Monthly Reserve** | **31.44%** | **R$943,20** |

### Balance Tracking

```typescript
laborProvisionBalances: {
    userId: string;
    contractId: string;
    year: number;
    month: number;
    
    // Accrued amounts
    provision13thCents: number;
    provisionVacationCents: number;
    provisionTerminationCents: number;
    fgtsDepositedCents: number;
    
    // Vacation days
    vacationDaysAccrued: number;    // 2.5 days/month
    vacationDaysTaken: number;
}
```

---

## Benefits Management

### Brazilian Benefits

| Type | Description | Tax Deductible |
|------|-------------|----------------|
| `vale_refeicao` | VR - Meal voucher | ✅ PAT |
| `vale_alimentacao` | VA - Grocery voucher | ✅ PAT |
| `vale_transporte` | VT - Transport voucher | ✅ |
| `plano_saude` | Health insurance | ✅ |
| `plano_odonto` | Dental plan | ✅ |
| `seguro_vida` | Life insurance | ✅ |
| `gympass` | Gym membership | ❌ |
| `auxilio_creche` | Daycare assistance | ✅ |
| `auxilio_educacao` | Education assistance | Limited |
| `participacao_lucros` | PLR - Profit sharing | Special tax |

### Benefit Schema

```typescript
employeeBenefits: {
    userId: string;
    benefitType: BenefitType;
    
    providerName?: string;       // "Alelo", "Sodexo"
    planName?: string;           // "Plano Gold"
    cardNumber?: string;
    
    valueCents: number;          // R$600
    employeeContributionCents: number; // R$0
    employerContributionCents: number; // R$600
    
    coversDependents: boolean;
    dependentCount: number;
    
    startsAt: number;
    endsAt?: number;
}
```

---

## Work Schedule Templates

### Predefined Templates

| Template | Hours | Schedule |
|----------|-------|----------|
| Commercial 8h | 44h/week | Mon-Fri 8:00-18:00 |
| Commercial 6h | 36h/week | Mon-Sat 8:00-14:00 |
| Part-time Morning | 20h/week | Mon-Fri 8:00-12:00 |
| Teacher Standard | 30h/week | Variable by class |
| Intern | 20h/week | Flexible |

### Schedule Schema

```typescript
workScheduleTemplates: {
    name: string;
    weeklyHours: number;
    
    weeklySchedule: {
        mon: { start: "08:00", end: "18:00", break: 60 },
        tue: { start: "08:00", end: "18:00", break: 60 },
        wed: { start: "08:00", end: "18:00", break: 60 },
        thu: { start: "08:00", end: "18:00", break: 60 },
        fri: { start: "08:00", end: "18:00", break: 60 },
        sat: null,
        sun: null
    }
}
```

---

## API Endpoints

### Time & Attendance
- `POST /api/[orgSlug]/hr/time-clock` - Clock in/out with GPS
- `GET /api/[orgSlug]/hr/time-clock/current` - Current status
- `GET /api/[orgSlug]/hr/timesheets` - List timesheets
- `POST /api/[orgSlug]/hr/timesheets/:id/approve` - Approve

### Org Chart
- `GET /api/[orgSlug]/hr/org-chart` - Full tree
- `GET /api/[orgSlug]/hr/positions` - List positions
- `POST /api/[orgSlug]/hr/positions/:id/assign` - Assign user

### Termination Planning
- `POST /api/[orgSlug]/hr/termination-plans` - Create plan
- `POST /api/[orgSlug]/hr/termination-plans/:id/simulate` - Calculate costs
- `POST /api/[orgSlug]/hr/termination-plans/:id/approve` - Approve
- `POST /api/[orgSlug]/hr/termination-plans/:id/execute` - Execute

### Labor Provisions
- `GET /api/[orgSlug]/hr/provisions/settings` - Get settings
- `PUT /api/[orgSlug]/hr/provisions/settings` - Toggle provisions
- `GET /api/[orgSlug]/hr/provisions/balances` - All balances
- `POST /api/[orgSlug]/hr/provisions/calculate` - Run calculation

---

## Database Tables Summary

| Table | Purpose |
|-------|---------|
| `staffContracts` | Employment contracts (CLT/PJ) |
| `organizationLocations` | Geo-fenced locations |
| `timeClockEntries` | GPS clock in/out entries |
| `timeSheets` | Period summaries |
| `orgChartPositions` | Position hierarchy |
| `positionAssignments` | Who holds what position |
| `teams` | Team structure |
| `teamAssignments` | Team membership |
| `talentPoolCandidates` | Job candidates |
| `laborProvisionSettings` | Per-org provision config |
| `laborProvisionBalances` | Per-employee balances |
| `terminationPlans` | "Plan to Fire" documents |
| `workScheduleTemplates` | Schedule definitions |
| `employeeBenefits` | Benefit assignments |

---

## Integration with Financial Module

### Termination → Financial Impact

When a termination plan is executed:
1. Create `payables` for each termination cost component
2. Reserve cash from operating account
3. Schedule payments per legal timeline
4. Generate termination documents

### Provisions → Accounting

Monthly provision calculation flows to:
1. `journalEntries` - Debit expense, credit provision liability
2. `costCenters` - Allocate to appropriate department
3. `financialGoals` - Track against budget

---

*Last Updated: 2026-02-05*
