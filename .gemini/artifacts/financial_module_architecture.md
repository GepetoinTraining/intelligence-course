# Financial Module Architecture (FinanceOS)

## Overview

The Financial Module is the complete money management layer of NodeZero. It handles:
- **Receivables** - Student tuition installments from contracts
- **Payments** - Processing via Brazilian gateways (Pagar.me, Asaas, iugu)
- **Automatic Splits** - Direct payouts to recipients (teachers, salespeople, owners)
- **Money Flow Tracking** - Chain of custody for every BRL
- **Commissions & Prizes** - Sales incentives and bonuses
- **Financial Goals** - Budgets, targets, and projections
- **Cost Centers** - Expense categorization and tracking

---

## Money Management Modes

The system supports three operating modes per organization:

| Mode | Description | Use Case |
|------|-------------|----------|
| `direct_split` | Money goes **directly** to recipients via gateway split - never touches school account | Franchises, partnerships with contractual splits |
| `school_managed` | School receives all money, distributes manually | Traditional schools with manual accounting |
| `hybrid` | Some splits automatic (platform fee, teacher %), rest manual | Most common - balance control with automation |

---

## Payment Gateway Integration

### Supported Brazilian Gateways

| Provider | PIX | Boleto | Card | Split | API Docs |
|----------|-----|--------|------|-------|----------|
| **Pagar.me** | ✅ | ✅ | ✅ | ✅ | [docs.pagar.me](https://docs.pagar.me) |
| **Asaas** | ✅ | ✅ | ✅ | ✅ | [docs.asaas.com](https://docs.asaas.com) |
| **iugu** | ✅ | ✅ | ✅ | ✅ | [dev.iugu.com](https://dev.iugu.com) |
| **PagBank** | ✅ | ✅ | ✅ | ✅ | [dev.pagbank.com.br](https://dev.pagbank.com.br) |
| **Stripe** | ✅ | - | ✅ | ✅ | [stripe.com/docs](https://stripe.com/docs) |
| **Mercado Pago** | ✅ | ✅ | ✅ | ✅ | [developers.mercadopago.com](https://developers.mercadopago.com) |

### Split Payment Implementation

```
CUSTOMER PAYS R$1.000,00
        │
        ▼
   ┌────────────────────────────────────────┐
   │         PAYMENT GATEWAY                │
   │         (Pagar.me / Asaas)             │
   │                                        │
   │  ┌──────────────────────────────────┐  │
   │  │     SPLIT RULES EXECUTE          │  │
   │  │                                  │  │
   │  │  ├── 3.00% → Gateway Fee  R$30   │  │
   │  │  ├── 5.00% → Platform Fee R$50   │  │
   │  │  ├── 20.0% → Teacher PIX  R$200  │  │
   │  │  ├── 10.0% → Salesperson  R$100  │  │
   │  │  └── Remainder → School   R$620  │  │
   │  └──────────────────────────────────┘  │
   └────────────────────────────────────────┘
        │
        ▼
   ALL TRANSFERS EXECUTE AUTOMATICALLY
   (D+2 for PIX, D+30 for credit card)
```

### Gateway Configuration Schema

```typescript
paymentGateways: {
    id: string;
    organizationId: string;
    provider: 'pagarme' | 'asaas' | 'iugu' | 'pagbank' | 'stripe' | 'mercadopago' | 'manual';
    apiKeyEncrypted: string;      // Encrypted API key
    secretKeyEncrypted: string;   // Encrypted secret
    webhookSecret: string;
    accountId: string;            // Provider's account ID
    isProduction: boolean;
    isDefault: boolean;
    supportsPix: boolean;
    supportsBoleto: boolean;
    supportsCard: boolean;
    supportsSplit: boolean;
    // Fee tracking
    pixFeePercent: number;
    boletoFeeCents: number;
    cardFeePercent: number;
}
```

---

## Split Recipients

Recipients are bank accounts/wallets that receive automatic splits.

### Recipient Types

| Type | Description |
|------|-------------|
| `teacher` | Teacher commission on classes taught |
| `salesperson` | Sales commission on enrollments |
| `franchisor` | Franchise royalty fee |
| `partner` | Business partner payout |
| `platform` | NodeZero platform fee |
| `owner` | School owner distribution |
| `investor` | Investor dividend |
| `employee` | Employee bonus |

### Recipient Bank Details

```typescript
splitRecipients: {
    id: string;
    recipientType: RecipientType;
    userId?: string;               // If linked to a user
    name: string;
    
    // Gateway integration
    gatewayId: string;
    externalRecipientId: string;   // Pagar.me recipient_id / Asaas wallet_id
    
    // Bank account (backup/manual)
    bankCode: string;              // e.g., "001" = Banco do Brasil
    bankName: string;
    accountType: 'checking' | 'savings';
    branchNumber: string;
    accountNumber: string;
    accountDigit: string;
    holderName: string;
    holderDocument: string;        // CPF or CNPJ
    holderType: 'individual' | 'company';
    
    // PIX (preferred method)
    pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    pixKey: string;
    
    // Transfer settings
    automaticTransfer: boolean;
    transferDay?: number;          // Day of month
    minimumTransferCents?: number;
    
    isVerified: boolean;
}
```

---

## Split Rules

Configurable rules that define how payments are split.

### Rule Structure

```typescript
splitRules: {
    id: string;
    name: string;
    description?: string;
    
    triggerType: 
        | 'tuition'           // Monthly tuition
        | 'enrollment'        // Enrollment fee
        | 'material'          // Material purchase
        | 'exam'              // Exam fee
        | 'workshop'          // Workshop/event
        | 'all_revenue'       // Everything
        | 'specific_course'   // Specific course
        | 'specific_program'; // Specific program
    
    programId?: string;       // If specific program
    priority: number;         // For rule matching
    isActive: boolean;
}

splitRuleItems: {
    id: string;
    ruleId: string;
    recipientId: string;
    
    splitType: 'percentage' | 'fixed' | 'remainder';
    percentValue?: number;         // 0-100
    fixedAmountCents?: number;
    
    orderIndex: number;            // For remainder calc
    maxAmountCents?: number;       // Cap
    minAmountCents?: number;       // Floor
    
    chargeableOnPayment: boolean;  // Execute on payment
    transferImmediately: boolean;  // Or batch later
}
```

### Example Split Rule

**Rule: "Standard Tuition Split"**
| Order | Recipient | Type | Value | Result (R$1000) |
|-------|-----------|------|-------|-----------------|
| 1 | Platform (NodeZero) | Percentage | 5% | R$50 |
| 2 | Teacher Maria | Percentage | 20% | R$200 |
| 3 | Salesperson João | Fixed | R$50.00 | R$50 |
| 4 | School Owner | Remainder | - | R$700 |

---

## Receivables (Accounts Receivable)

Student tuition installments generated from contracts.

### Receivable Lifecycle

```
CONTRACT SIGNED
    │
    ▼
┌─────────────────────────────────────┐
│  GENERATE RECEIVABLES               │
│                                     │
│  Contract: R$12.000 / 12 months     │
│  ├── Installment 1:  R$1.000 (Feb)  │
│  ├── Installment 2:  R$1.000 (Mar)  │
│  ├── Installment 3:  R$1.000 (Apr)  │
│  └── ... 12 installments            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  GENERATE PAYMENT METHODS           │
│                                     │
│  ├── Boleto → Generated via gateway │
│  ├── PIX Code → QR code generated   │
│  └── Card Link → Payment link       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  PAYMENT RECEIVED (Webhook)         │
│                                     │
│  ├── Update receivable status       │
│  ├── Execute split rules            │
│  ├── Create money flow records      │
│  └── Generate NFS-e (if configured) │
└─────────────────────────────────────┘
```

### Receivable Schema

```typescript
receivables: {
    id: string;
    organizationId: string;
    
    // Source
    contractId?: string;
    enrollmentId?: string;
    invoiceId?: string;
    
    // Who
    payerUserId: string;       // Who pays (parent/guardian)
    studentUserId: string;     // The student
    
    // Installment
    installmentNumber: number;
    totalInstallments: number;
    description: string;
    referenceMonth: number;
    
    // Amounts (in cents)
    originalAmountCents: number;
    discountCents: number;
    interestCents: number;
    finesCents: number;
    netAmountCents: number;
    paidAmountCents: number;
    remainingAmountCents: number;
    
    // Dates
    dueDate: number;
    paymentDate?: number;
    competenceDate: number;
    
    // Status
    status: 'pending' | 'paid' | 'partial' | 'overdue' | 'negotiating' | 'cancelled' | 'refunded';
    
    // Payment
    paymentMethod?: 'pix' | 'boleto' | 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'check';
    paymentGatewayId?: string;
    externalPaymentId?: string;
    externalBoletoUrl?: string;
    externalPixCode?: string;
    
    // Split
    splitRuleId?: string;
    splitExecuted: boolean;
    splitExecutedAt?: number;
    
    // Dunning
    daysOverdue: number;
    remindersSent: number;
    lastReminderAt?: number;
}
```

---

## Money Flows (Chain of Custody)

Track every movement of money through the system.

### Flow Types

| Type | Direction | Description |
|------|-----------|-------------|
| `payment_received` | IN | Customer paid |
| `split_executed` | OUT | Money split to recipient |
| `transfer_out` | OUT | Money sent to bank account |
| `transfer_in` | IN | Money received from bank |
| `refund_issued` | OUT | Refund to customer |
| `fee_charged` | OUT | Gateway/platform fee |
| `commission_paid` | OUT | Commission payout |
| `prize_paid` | OUT | Prize/bonus payout |
| `advance_issued` | OUT | Salary advance |
| `adjustment` | IN/OUT | Manual adjustment |
| `opening_balance` | IN | Starting balance |

### Location States

| Location | Description |
|----------|-------------|
| `gateway_pending` | Waiting in gateway (processing) |
| `gateway_available` | Available in gateway balance |
| `school_bank` | In school's bank account |
| `recipient_pending` | Pending transfer to recipient |
| `recipient_paid` | Paid to recipient |
| `customer_refunded` | Returned to customer |

### Money Flow Example

```
TIME     FLOW TYPE          AMOUNT      LOCATION
─────────────────────────────────────────────────
09:00    payment_received   +R$1.000    gateway_pending
09:01    fee_charged        -R$30       gateway_pending → gateway (fee)
09:02    (payment confirmed) R$970      gateway_available
09:02    split_executed     -R$50       gateway_available → recipient_pending (Platform)
09:02    split_executed     -R$200      gateway_available → recipient_pending (Teacher)
09:02    split_executed     -R$100      gateway_available → recipient_pending (Sales)
09:02    (remainder)        R$620       gateway_available (School)
D+2      transfer_out       -R$620      gateway_available → school_bank
D+2      transfer_out       -R$50       recipient_pending → recipient_paid (Platform)
D+2      transfer_out       -R$200      recipient_pending → recipient_paid (Teacher)
D+2      transfer_out       -R$100      recipient_pending → recipient_paid (Sales)
```

---

## Commissions & Prizes

### Commission Types

| Type | Trigger | Calculation |
|------|---------|-------------|
| `enrollment` | New student | % of contract value |
| `renewal` | Student renews | % of renewal value |
| `material_sale` | Material sold | % of sale |
| `referral` | Referred student enrolls | Fixed amount |
| `class_taught` | Class completed | Per-class rate |
| `performance` | Goals achieved | Bonus structure |
| `prize` | Contest winner | Fixed amount |

### Commission Schema

```typescript
commissionPayouts: {
    id: string;
    userId: string;              // Who receives
    recipientId?: string;        // Split recipient link
    
    commissionType: CommissionType;
    
    // Source
    enrollmentId?: string;
    receivableId?: string;
    sourceDescription?: string;
    
    // Calculation
    baseAmountCents: number;     // What it's calculated on
    commissionPercent?: number;
    fixedAmountCents?: number;
    
    // Final
    grossAmountCents: number;
    deductionsCents: number;
    netAmountCents: number;
    
    // Status
    status: 'pending' | 'approved' | 'scheduled' | 'paid' | 'cancelled';
    
    approvedBy?: string;
    approvedAt?: number;
    
    paymentMethod?: 'split_automatic' | 'pix' | 'transfer' | 'payroll' | 'cash';
    paidAt?: number;
    paymentReference?: string;
}
```

---

## Financial Goals

### Goal Types

| Type | Metric | Example |
|------|--------|---------|
| `revenue` | Total revenue | R$100.000/month |
| `enrollments` | New enrollments count | 50 students/month |
| `renewals` | Renewal count | 80% retention |
| `collections` | Money collected | R$95.000/month |
| `expenses` | Expense budget | Max R$30.000/month |
| `profit` | Net profit | R$20.000/month |
| `student_count` | Active students | 500 students |
| `cost_center` | Specific cost center | Marketing < R$5.000 |
| `sales_target` | Per-salesperson | R$20.000/person |

### Goal Schema

```typescript
financialGoals: {
    id: string;
    organizationId: string;
    
    // Period
    year: number;
    month?: number;        // Null = annual
    quarter?: number;      // 1-4
    
    goalType: GoalType;
    name: string;
    description?: string;
    
    costCenterId?: string; // For cost center goals
    
    // Targets
    targetAmountCents?: number;
    targetCount?: number;
    targetPercent?: number;
    
    // Actuals (updated periodically)
    actualAmountCents?: number;
    actualCount?: number;
    actualPercent?: number;
    
    // Comparison
    previousPeriodAmountCents?: number;
    previousPeriodCount?: number;
    
    // Progress
    progressPercent: number;
    
    status: 'draft' | 'active' | 'achieved' | 'missed' | 'archived';
    
    alertThreshold?: number;
    alertSent: boolean;
}
```

---

## Financial Settings

Per-organization financial configuration.

```typescript
organizationFinancialSettings: {
    id: string;
    organizationId: string;
    
    // Money management
    moneyManagementMode: 'direct_split' | 'school_managed' | 'hybrid';
    defaultGatewayId?: string;
    defaultSplitRuleId?: string;
    
    // Late fees
    lateFeeType: 'none' | 'percentage' | 'fixed' | 'daily_percent';
    lateFeePercent: number;        // Default 2%
    lateFeeCents?: number;
    lateFeeInterestMonthly: number; // Mora mensal (default 1%)
    
    // Early payment discount
    earlyPaymentDiscountPercent?: number;
    earlyPaymentDays?: number;
    
    // Dunning
    reminderDays: number[];        // e.g., [3, 7, 15, 30]
    autoSendReminders: boolean;
    
    // Invoice settings
    invoiceDueDay: number;         // Day of month (default 10)
    invoicePrefix?: string;
    nextInvoiceNumber: number;
    
    // Bank account
    mainBankAccountId?: string;
}
```

---

## API Endpoints

### Gateway Configuration
- `GET /api/[orgSlug]/financial/gateways` - List gateways
- `POST /api/[orgSlug]/financial/gateways` - Add gateway
- `POST /api/[orgSlug]/financial/gateways/:id/test` - Test connection
- `GET /api/[orgSlug]/financial/gateways/:id/balance` - Get balance

### Split Management
- `GET /api/[orgSlug]/financial/split-recipients` - List recipients
- `POST /api/[orgSlug]/financial/split-recipients` - Create recipient
- `POST /api/[orgSlug]/financial/split-recipients/:id/verify` - Verify bank
- `GET /api/[orgSlug]/financial/split-rules` - List rules
- `POST /api/[orgSlug]/financial/split-rules/:id/simulate` - Simulate split

### Receivables
- `GET /api/[orgSlug]/financial/receivables` - List receivables
- `POST /api/[orgSlug]/financial/receivables/from-contract` - Generate from contract
- `POST /api/[orgSlug]/financial/receivables/:id/generate-boleto` - Generate boleto
- `POST /api/[orgSlug]/financial/receivables/:id/generate-pix` - Generate PIX

### Money Flow
- `GET /api/[orgSlug]/financial/money-flows` - List flows
- `GET /api/[orgSlug]/financial/money-flows/balance` - Balances by location
- `POST /api/[orgSlug]/financial/money-flows/reconcile` - Reconcile

### Commissions
- `GET /api/[orgSlug]/financial/commissions` - List commissions
- `POST /api/[orgSlug]/financial/commissions/calculate` - Calculate pending
- `POST /api/[orgSlug]/financial/commissions/:id/approve` - Approve
- `POST /api/[orgSlug]/financial/commissions/:id/pay` - Execute payout

### Goals
- `GET /api/[orgSlug]/financial/goals` - List goals
- `GET /api/[orgSlug]/financial/goals/dashboard` - Dashboard view
- `POST /api/[orgSlug]/financial/goals/:id/recalculate` - Update actuals

---

## Webhook Handling

### Payment Confirmation Flow

```
GATEWAY WEBHOOK RECEIVED
    │
    ▼
┌────────────────────────────────────┐
│  1. VERIFY WEBHOOK SIGNATURE       │
│     (using webhook_secret)         │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  2. FIND RECEIVABLE                │
│     (by external_payment_id)       │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  3. UPDATE RECEIVABLE STATUS       │
│     pending → paid                 │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  4. CREATE MONEY FLOW RECORDS      │
│     (chain of custody)             │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  5. EXECUTE SPLIT (if configured)  │
│     - Create split flow records    │
│     - API call to gateway split    │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  6. CALCULATE COMMISSIONS          │
│     (if applicable)                │
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  7. GENERATE NFS-e                 │
│     (if fiscal integration)        │
└────────────────────────────────────┘
```

---

## Database Tables Summary

| Table | Purpose |
|-------|---------|
| `paymentGateways` | Gateway configurations |
| `splitRecipients` | Bank accounts for splits |
| `splitRules` | Split rule definitions |
| `splitRuleItems` | Recipients/percentages per rule |
| `receivables` | Student installments |
| `receivablePayments` | Partial payments |
| `moneyFlows` | Chain of custody ledger |
| `commissionPayouts` | Commission tracking |
| `financialGoals` | Budgets and targets |
| `organizationFinancialSettings` | Per-org config |
| `costCenters` | Expense categories |
| `journalEntries` | Double-entry ledger |

---

*Last Updated: 2026-02-05*
