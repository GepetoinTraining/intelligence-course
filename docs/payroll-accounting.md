# Payroll & Accounting System

## Overview

The Payroll & Accounting system provides enterprise-grade financial infrastructure for Brazilian businesses, with full compliance with **Lucro Real** accounting requirements. This module enables:

- **Staff Payroll Management** - Salaries, hourly wages, bonuses, commissions
- **Split Payment Processing** - Multiple payment methods per payroll
- **Double-Entry Bookkeeping** - Proper accounting with journal entries
- **Chart of Accounts (Plano de Contas)** - Brazilian classification hierarchy
- **Cost Center Tracking** - Departmental budget management
- **Fiscal Document Management** - NF-e, NFS-e, CT-e integration-ready
- **Tax Withholdings (DIRF)** - IRRF, PIS, COFINS, CSLL, INSS, ISS

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        PAYROLL MODULE                            │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │  Staff Payroll  │───►│Payroll Payments │───►│   Payment    │  │
│  │   (receivable)  │    │ (split support) │    │   Methods    │  │
│  └────────┬────────┘    └────────┬────────┘    └──────────────┘  │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    ACCOUNTING MODULE                        │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐  │ │
│  │  │ Chart of       │  │ Journal Entries │  │    Cost      │  │ │
│  │  │ Accounts       │  │ (double-entry)  │  │   Centers    │  │ │
│  │  └───────┬────────┘  └────────┬────────┘  └──────────────┘  │ │
│  │          │                    │                              │ │
│  │          ▼                    ▼                              │ │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐  │ │
│  │  │    Fiscal      │  │ Tax Withholdings│  │  Financial   │  │ │
│  │  │   Documents    │  │    (DIRF)       │  │   Reports    │  │ │
│  │  └────────────────┘  └─────────────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Payroll Tables

#### staff_payroll
Staff payroll receivables (what employees are owed).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | ULID |
| organization_id | TEXT FK | Organization |
| contract_id | TEXT FK | Staff contract reference |
| user_id | TEXT FK | Employee |
| period_start | INTEGER | Period start timestamp |
| period_end | INTEGER | Period end timestamp |
| payment_due_date | INTEGER | Payment deadline |
| payroll_type | TEXT | salary, hourly, bonus, commission, reimbursement, advance, other |
| hours_worked | REAL | For hourly payroll |
| hourly_rate_cents | INTEGER | Rate if hourly |
| gross_amount_cents | INTEGER | Before deductions |
| deductions | JSON | Breakdown of deductions |
| total_deductions_cents | INTEGER | Sum of deductions |
| additions | JSON | Breakdown of additions |
| total_additions_cents | INTEGER | Sum of additions |
| net_amount_cents | INTEGER | Final payable amount |
| paid_amount_cents | INTEGER | Amount paid so far |
| status | TEXT | draft, pending_approval, approved, scheduled, partially_paid, paid, cancelled, disputed |
| approved_by | TEXT FK | Who approved |
| approved_at | INTEGER | Approval timestamp |
| calculated_by | TEXT FK | Who calculated |
| calculated_at | INTEGER | Calculation timestamp |
| paid_at | INTEGER | Full payment timestamp |
| notes | TEXT | Internal notes |
| created_at | INTEGER | |
| updated_at | INTEGER | |

#### payroll_payments
Individual payments against payroll (supports split payments).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| payroll_id | TEXT FK | Parent payroll |
| user_id | TEXT FK | Employee receiving |
| amount_cents | INTEGER | Payment amount |
| method_type | TEXT | bank_transfer, pix, cash, credit_card, debit_card, digital_wallet, check |
| payment_method_id | TEXT FK | Payment method used |
| reference_code | TEXT | Transaction reference |
| scheduled_for | INTEGER | Scheduled date |
| processed_at | INTEGER | When processed |
| failed_at | INTEGER | If failed |
| failure_reason | TEXT | Error message |
| status | TEXT | pending, processing, completed, failed, cancelled, refunded |
| notes | TEXT | |
| paid_by | TEXT FK | Who processed |
| created_at | INTEGER | |
| updated_at | INTEGER | |

#### payment_methods
Stored payment methods for employees.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| user_id | TEXT FK | Owner |
| organization_id | TEXT FK | Organization |
| method_type | TEXT | bank_transfer, pix, cash, credit_card, debit_card, digital_wallet |
| label | TEXT | Display name (e.g., "Banco do Brasil - Conta Principal") |
| is_default | INTEGER | Primary method |
| is_active | INTEGER | Active/inactive |
| is_verified | INTEGER | Verification status |
| bank_code | TEXT | For bank transfers |
| bank_name | TEXT | |
| agency_number | TEXT | |
| account_number | TEXT | |
| account_type | TEXT | checking, savings |
| account_holder_name | TEXT | |
| account_holder_document | TEXT | CPF/CNPJ |
| pix_key_type | TEXT | cpf, cnpj, email, phone, random |
| pix_key | TEXT | |
| card_last_four | TEXT | For cards |
| card_brand | TEXT | visa, mastercard, etc. |
| card_expiry | TEXT | |
| wallet_provider | TEXT | For digital wallets |
| wallet_id | TEXT | |
| created_at | INTEGER | |
| updated_at | INTEGER | |

---

### Accounting Tables

#### chart_of_accounts
Plano de Contas with Brazilian classification hierarchy.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| code | TEXT | Account code (e.g., "1.1.01.001") |
| name | TEXT | Account name |
| description | TEXT | |
| account_type | TEXT | asset, liability, equity, revenue, expense |
| nature | TEXT | debit, credit |
| classification | TEXT | Brazilian: circulante, nao_circulante, resultado, patrimonio_liquido, custos, despesas_operacionais |
| parent_id | TEXT FK | Parent account |
| level | INTEGER | Hierarchy depth (1=root) |
| allows_posting | INTEGER | Can receive entries? |
| is_system | INTEGER | System-generated (protected) |
| is_active | INTEGER | |
| cofins_applicable | INTEGER | Subject to COFINS |
| pis_applicable | INTEGER | Subject to PIS |
| csll_applicable | INTEGER | Subject to CSLL |
| irpj_applicable | INTEGER | Subject to IRPJ |
| created_at | INTEGER | |
| updated_at | INTEGER | |

**Classification Reference (Lucro Real):**
- `circulante` - Current Assets/Liabilities
- `nao_circulante` - Non-current Assets/Liabilities
- `resultado` - Revenue/Expense Accounts
- `patrimonio_liquido` - Equity
- `custos` - Cost of Services/Goods
- `despesas_operacionais` - Operating Expenses

#### cost_centers
Centros de Custo for departmental tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| code | TEXT | Cost center code |
| name | TEXT | |
| description | TEXT | |
| parent_id | TEXT FK | Parent center |
| level | INTEGER | |
| center_type | TEXT | department, project, unit, branch |
| manager_id | TEXT FK | Responsible manager |
| annual_budget_cents | INTEGER | Annual budget |
| monthly_budget_cents | INTEGER | Monthly budget |
| is_active | INTEGER | |
| created_at | INTEGER | |
| updated_at | INTEGER | |

#### journal_entries
Lançamentos Contábeis header (double-entry bookkeeping).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| entry_number | INTEGER | Sequential per fiscal period |
| reference_date | INTEGER | Document date |
| posting_date | INTEGER | Posting date |
| fiscal_year | INTEGER | Fiscal year |
| fiscal_month | INTEGER | Fiscal month (1-12) |
| description | TEXT | Entry description |
| memo | TEXT | Internal notes |
| source_type | TEXT | payroll, invoice, payable, manual, adjustment, closing |
| source_id | TEXT | Reference to source document |
| status | TEXT | draft, posted, reversed, cancelled |
| is_reversal | INTEGER | Is this a reversal entry? |
| reverses_entry_id | TEXT FK | Entry being reversed |
| reversed_by_entry_id | TEXT FK | Entry that reversed this |
| created_by | TEXT FK | Who created |
| posted_by | TEXT FK | Who posted |
| posted_at | INTEGER | Posting timestamp |
| created_at | INTEGER | |
| updated_at | INTEGER | |

#### journal_entry_lines
Partidas (individual debit/credit lines).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| entry_id | TEXT FK | Parent journal entry |
| account_id | TEXT FK | Chart of Accounts reference |
| cost_center_id | TEXT FK | Optional cost center |
| amount_cents | INTEGER | Amount in cents |
| currency | TEXT | Currency code (default BRL) |
| entry_type | TEXT | debit, credit |
| description | TEXT | Line description |
| tax_code | TEXT | Tax code if applicable |
| tax_amount_cents | INTEGER | Tax amount if applicable |
| document_number | TEXT | Related document |
| document_date | INTEGER | Document date |
| line_number | INTEGER | Sort order |
| created_at | INTEGER | |
| updated_at | INTEGER | |

**Important:** Sum of debits MUST equal sum of credits for any journal entry.

#### fiscal_documents
NF-e, NFS-e, CT-e document tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| document_type | TEXT | nfe, nfse, cte, nfce, sped |
| document_number | TEXT | Document number |
| series | TEXT | Series |
| access_key | TEXT | 44-digit access key |
| verification_code | TEXT | Verification code |
| issue_date | INTEGER | Issue date |
| competence_date | INTEGER | Competence period |
| issuer_id | TEXT FK | Issuer user/org |
| issuer_document | TEXT | Issuer CNPJ |
| issuer_name | TEXT | |
| recipient_id | TEXT FK | Recipient user/org |
| recipient_document | TEXT | Recipient CPF/CNPJ |
| recipient_name | TEXT | |
| total_amount_cents | INTEGER | Total value |
| net_amount_cents | INTEGER | Net after deductions |
| iss_amount_cents | INTEGER | ISS value |
| iss_rate | REAL | ISS rate |
| pis_amount_cents | INTEGER | PIS value |
| cofins_amount_cents | INTEGER | COFINS value |
| ir_amount_cents | INTEGER | IR value |
| csll_amount_cents | INTEGER | CSLL value |
| inss_amount_cents | INTEGER | INSS value |
| iss_withheld | INTEGER | ISS retained |
| ir_withheld | INTEGER | IR retained |
| pis_withheld | INTEGER | PIS retained |
| cofins_withheld | INTEGER | COFINS retained |
| csll_withheld | INTEGER | CSLL retained |
| inss_withheld | INTEGER | INSS retained |
| service_code | TEXT | CNAE/LC 116 code |
| service_description | TEXT | |
| city_service_code | TEXT | Municipal code |
| status | TEXT | draft, pending, authorized, rejected, cancelled |
| cancelled_at | INTEGER | |
| cancellation_reason | TEXT | |
| external_id | TEXT | Provider ID |
| xml_url | TEXT | XML download URL |
| pdf_url | TEXT | PDF download URL |
| invoice_id | TEXT FK | Linked invoice |
| payable_id | TEXT FK | Linked payable |
| payroll_id | TEXT FK | Linked payroll |
| created_at | INTEGER | |
| updated_at | INTEGER | |

#### tax_withholdings
Tax withholding records for DIRF reporting.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | |
| organization_id | TEXT FK | |
| fiscal_document_id | TEXT FK | Related document |
| tax_type | TEXT | irrf, pis, cofins, csll, inss, iss |
| base_amount_cents | INTEGER | Calculation base |
| rate | REAL | Applied rate |
| amount_cents | INTEGER | Withheld amount |
| due_date | INTEGER | Payment deadline |
| paid_at | INTEGER | Payment date |
| payment_reference | TEXT | DARF/GPS number |
| status | TEXT | pending, paid, cancelled |
| period_start | INTEGER | Competence start |
| period_end | INTEGER | Competence end |
| beneficiary_document | TEXT | Beneficiary CPF/CNPJ |
| beneficiary_name | TEXT | |
| notes | TEXT | |
| created_at | INTEGER | |
| updated_at | INTEGER | |

---

## API Reference

### Payroll Management

#### Staff Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff-payroll` | List payroll records with filters |
| POST | `/api/staff-payroll` | Create new payroll entry |
| GET | `/api/staff-payroll/:id` | Get payroll with payments |
| PATCH | `/api/staff-payroll/:id` | Update status, approve, mark paid |
| DELETE | `/api/staff-payroll/:id` | Cancel payroll (if not paid) |

**Query Parameters (GET):**
- `status` - Filter by status
- `userId` - Filter by employee
- `startDate`, `endDate` - Period filter
- `limit`, `offset` - Pagination

**Create Request:**
```typescript
{
  contractId: string;
  userId: string;
  payrollType: 'salary' | 'hourly' | 'bonus' | 'commission' | 'reimbursement' | 'advance' | 'other';
  periodStart: number; // timestamp
  periodEnd: number;
  paymentDueDate: number;
  grossAmountCents: number;
  hoursWorked?: number;
  deductions?: Record<string, number>; // { "INSS": 50000, "IR": 25000 }
  additions?: Record<string, number>;
  notes?: string;
}
```

**Status Transitions:**
```
draft → pending_approval → approved → (partially_paid) → paid
         ↓                    ↓                           ↓
      cancelled            cancelled                  disputed
```

#### Payroll Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll-payments` | List payments |
| POST | `/api/payroll-payments` | Register payment (split supported) |
| GET | `/api/payroll-payments/:id` | Get payment details |
| PATCH | `/api/payroll-payments/:id` | Update status (complete, fail) |
| DELETE | `/api/payroll-payments/:id` | Cancel pending payment |

**Create Payment (Split Example):**
```typescript
// First payment via PIX
{
  payrollId: "pay_123",
  amountCents: 200000, // R$ 2.000
  methodType: "pix",
  status: "completed"
}

// Second payment via Bank Transfer
{
  payrollId: "pay_123",
  amountCents: 300000, // R$ 3.000
  methodType: "bank_transfer",
  status: "completed"
}
```

#### Payment Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payment-methods` | List user's payment methods |
| POST | `/api/payment-methods` | Register new method |
| GET | `/api/payment-methods/:id` | Get method (masked data) |
| PATCH | `/api/payment-methods/:id` | Update method |
| DELETE | `/api/payment-methods/:id` | Deactivate method |

---

### Accounting APIs

#### Chart of Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chart-of-accounts` | List accounts (flat or hierarchy) |
| POST | `/api/chart-of-accounts` | Create account |
| GET | `/api/chart-of-accounts/:id` | Get account with balance |
| PATCH | `/api/chart-of-accounts/:id` | Update account |
| DELETE | `/api/chart-of-accounts/:id` | Deactivate account |

**Query Parameters:**
- `type` - Filter by account_type
- `parentId` - Filter by parent (use "null" for root accounts)
- `hierarchy=true` - Return nested tree structure
- `activeOnly=false` - Include inactive accounts

**Hierarchy Response:**
```json
{
  "data": [
    {
      "id": "acc_1",
      "code": "1",
      "name": "ATIVO",
      "children": [
        {
          "id": "acc_2",
          "code": "1.1",
          "name": "ATIVO CIRCULANTE",
          "children": [
            {
              "id": "acc_3",
              "code": "1.1.01",
              "name": "Caixa e Bancos",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

**Account Balance Response:**
```json
{
  "data": {
    "id": "acc_3",
    "code": "1.1.01.001",
    "name": "Banco do Brasil C/C",
    "debitTotal": 10000000,
    "creditTotal": 7500000,
    "balance": 2500000 // Nature = debit, so debit - credit
  }
}
```

#### Journal Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journal-entries` | List journal entries |
| POST | `/api/journal-entries` | Create entry with lines |
| GET | `/api/journal-entries/:id` | Get entry with lines |
| PATCH | `/api/journal-entries/:id` | Post, reverse, or update draft |
| DELETE | `/api/journal-entries/:id` | Cancel draft entry |

**Query Parameters:**
- `year`, `month` - Fiscal period filter
- `status` - Filter by status
- `sourceType` - Filter by origin
- `startDate`, `endDate` - Reference date range

**Create Double-Entry:**
```typescript
{
  referenceDate: 1706918400000,
  description: "Pagamento de salário - João Silva",
  sourceType: "payroll",
  sourceId: "pay_123",
  autoPost: true, // Optionally post immediately
  lines: [
    {
      accountId: "acc_expense_salary", // Despesas com Pessoal
      amountCents: 500000,
      entryType: "debit",
      costCenterId: "cc_admin"
    },
    {
      accountId: "acc_inss_payable", // INSS a Recolher
      amountCents: 50000,
      entryType: "credit"
    },
    {
      accountId: "acc_ir_payable", // IR a Recolher
      amountCents: 25000,
      entryType: "credit"
    },
    {
      accountId: "acc_bank", // Banco
      amountCents: 425000,
      entryType: "credit"
    }
  ]
}
```

**Automatic Reversal:**
```typescript
// PATCH /api/journal-entries/:id
{
  status: "reversed",
  reversalReason: "Lançamento incorreto - valor errado"
}

// Response includes automatically created reversal entry
{
  "data": { /* original entry with status: reversed */ },
  "reversalEntry": {
    "id": "je_456",
    "description": "Estorno: Pagamento de salário - João Silva",
    "lines": [/* debits/credits swapped */]
  }
}
```

#### Cost Centers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cost-centers` | List cost centers |
| POST | `/api/cost-centers` | Create cost center |
| GET | `/api/cost-centers/:id` | Get with expense totals |
| PATCH | `/api/cost-centers/:id` | Update cost center |
| DELETE | `/api/cost-centers/:id` | Deactivate cost center |

**Budget Utilization Response:**
```json
{
  "data": {
    "id": "cc_marketing",
    "code": "MKT",
    "name": "Marketing",
    "monthlyBudgetCents": 5000000,
    "totalExpenses": 3250000,
    "budgetUtilization": 65.0
  }
}
```

#### Fiscal Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fiscal-documents` | List fiscal documents |
| POST | `/api/fiscal-documents` | Create document record |
| GET | `/api/fiscal-documents/:id` | Get with withholdings |
| PATCH | `/api/fiscal-documents/:id` | Update status/integration data |
| DELETE | `/api/fiscal-documents/:id` | Delete draft only |

**Document Lifecycle:**
```
draft → pending → authorized
         ↓            ↓
      rejected    cancelled (with reason)
```

---

## UI Pages

### Owner Payroll Dashboard (`/owner/payroll`)

Features:
- **Stats Cards** - Total pending, paid this month, awaiting approval, active employees
- **Filter Tabs** - All, Pending, Partially Paid, Paid
- **Payroll Table** - Employee, period, type, net amount, progress bar, status, due date
- **Actions Menu** - View details, approve, register payment, download payslip, cancel
- **Create Modal** - Select employee, type, period, gross amount, deductions
- **Payment Modal** - Split payment registration with multiple methods

---

## Business Rules

### Payroll Rules

1. **Status Flow**
   - New payrolls start as `draft`
   - Require `approved` status before payment
   - Automatically becomes `partially_paid` when first payment registered
   - Automatically becomes `paid` when paid_amount >= net_amount

2. **Split Payments**
   - Multiple payments allowed per payroll
   - Each payment can use different method
   - Total payments cannot exceed remaining balance
   - Useful for: cash advance + bank deposit, PIX + card top-up

3. **Cancellation**
   - Only allowed for `draft`, `pending_approval`, `approved` status
   - Cannot cancel if any payment has been completed

### Accounting Rules

1. **Double-Entry Validation**
   - Total debits MUST equal total credits
   - API rejects entries that don't balance

2. **Entry Numbering**
   - Auto-incremented per organization per fiscal period
   - Format: sequential integer reset each month

3. **Reversal Rules**
   - Only `posted` entries can be reversed
   - Reversals create a new entry with swapped debits/credits
   - Original entry marked with reference to reversal
   - Never modify or delete posted entries

4. **System Accounts**
   - Cannot modify accounts where `is_system = 1`
   - Protected from deletion

### Fiscal Document Rules

1. **Deletion**
   - Only `draft` documents can be deleted
   - Authorized documents require cancellation flow

2. **Cancellation**
   - Requires cancellation reason
   - Records cancellation timestamp

---

## Integration Examples

### Automatic Payroll Journal Entry

When payroll is marked as paid, create a journal entry:

```typescript
// Triggered when payroll status → 'paid'
await createJournalEntry({
  sourceType: 'payroll',
  sourceId: payrollId,
  description: `Folha de Pagamento - ${employee.name} - ${period}`,
  lines: [
    // Debit: Expense account
    { accountId: salaryExpenseAccount, entryType: 'debit', amountCents: grossAmount },
    // Credit: Liability (INSS a Recolher)
    { accountId: inssPayableAccount, entryType: 'credit', amountCents: inssDeduction },
    // Credit: Liability (IR a Recolher)  
    { accountId: irPayableAccount, entryType: 'credit', amountCents: irDeduction },
    // Credit: Asset (Bank)
    { accountId: bankAccount, entryType: 'credit', amountCents: netAmount },
  ],
});
```

### Tax Withholding Calculation

When creating NFS-e for services:

```typescript
const nfse = await createFiscalDocument({
  documentType: 'nfse',
  totalAmountCents: 1000000, // R$ 10.000
  issRate: 5.0,
  issAmountCents: 50000, // R$ 500
  issWithheld: true,
  irWithheld: true,
  irAmountCents: 150000, // R$ 1.500 (15% IR)
  netAmountCents: 830000, // R$ 8.300 líquido
});

// Auto-create withholding records
await createTaxWithholding({
  fiscalDocumentId: nfse.id,
  taxType: 'iss',
  baseAmountCents: 1000000,
  rate: 5.0,
  amountCents: 50000,
});
```

---

## Lucro Real Compliance Checklist

✅ **Plano de Contas Referencial** compatible structure
✅ **Escrituração Digital (SPED)** compatible data model
✅ **NF-e/NFS-e** 44-character access key support
✅ **Tax withholdings** (IRRF, PIS, COFINS, CSLL, INSS, ISS)
✅ **Double-entry bookkeeping** with validation
✅ **Fiscal year/month** tracking
✅ **Reversal audit trail** - no deletion of posted entries
✅ **Cost center** departmental tracking
✅ **Document competence date** vs issue date separation

### Pending Implementation

- [ ] Balancete (Trial Balance) Report
- [ ] DRE (Income Statement) Report
- [ ] Balanço Patrimonial (Balance Sheet) Report
- [ ] SPED ECD/ECF Export
- [ ] Automatic NF-e/NFS-e Issuance (via eNotas, Nuvem Fiscal, etc.)
- [ ] CNAB 240 Bank File Generation

---

*Last updated: 2026-02-03*
