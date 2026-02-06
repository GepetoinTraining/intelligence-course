# Menu Bundle Architecture v2

> Final 14-bundle structure for Intelligence Course platform

---

## Navigation Header Elements

The main navigation includes these top-level elements:

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏫 [School Logo]                                    [+] 🌙 👤      │
│                                                                     │
│  Theme Toggle:     Profile Menu:      Add View:                     │
│  🎨 Brand Color    👤 Avatar          [+] Pin favorite              │
│  ☀️ Light Mode     📧 user@email          pages to nav              │
│  🌙 Dark Mode      ⚙️ Settings                                       │
│                    🚪 Logout                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Theme Modes

```typescript
interface ThemeConfig {
  mode: 'brand' | 'light' | 'dark';
  brandColor: string; // from org.primaryColor
}

// Brand Mode: Dark theme with accent colors from brandColor
// Light Mode: Standard light theme
// Dark Mode: Standard dark theme
```

### Profile Menu

```typescript
{
  id: 'profile-menu',
  position: 'top-right',
  items: [
    { id: 'avatar', component: 'UserAvatar' },
    { id: 'name', component: 'UserName', role: 'display' },
    { id: 'email', component: 'UserEmail', role: 'display' },
    { divider: true },
    { id: 'my-profile', label: 'Meu Perfil', href: '/admin/perfil', icon: 'IconUser' },
    { id: 'my-preferences', label: 'Preferências', href: '/admin/preferencias', icon: 'IconAdjustments' },
    { id: 'my-notifications', label: 'Notificações', href: '/admin/notificacoes', icon: 'IconBell' },
    { divider: true },
    { id: 'switch-org', label: 'Trocar Escola', action: 'switchOrg', icon: 'IconBuilding' },
    { id: 'logout', label: 'Sair', action: 'logout', icon: 'IconLogout' },
  ]
}
```

### Custom Views (+)

Users can pin frequently used pages to the main nav for quick access.

```typescript
interface CustomView {
  id: string;
  userId: string;
  label: string;
  href: string;
  icon?: string;
  order: number;
}

// API: GET/POST /api/{org}/settings/custom-views
// Stored per-user, synced across devices
```

**Add View Modal:**
- Search all available pages
- Pick icon (optional)
- Custom label (optional)
- Drag to reorder pinned views

---

## Complete Bundle Structure

```
📊 Dashboard              # Overview

├── 📣 Marketing          # Lead generation, campaigns, content
├── 💼 Comercial          # Sales pipeline, negotiations, proposals
├── 🎯 Operacional        # Check-in, enrollments, contracts
├── 📚 Pedagógico         # Courses, classes, grades, curriculum
├── 💰 Financeiro         # Receivables, payments, billing
├── 👥 RH & Pessoas       # Employees, payroll, commissions
├── 💬 Comunicação        # Internal messages + Communicator
├── 📅 Agenda             # Hierarchical calendar system
├── 📊 Relatórios & BI    # Reports and Business Intelligence
├── 📒 Contábil           # Accounting, fiscal, SPED
├── 📖 Conhecimento       # Internal knowledge base/wiki
├── 🤖 Assistente IA      # AI-powered tools
├── 🔄 Kaizen             # Continuous improvement
└── ⚙️ Configurações      # Settings
```

---

## Bundle Specifications

### 1. 📣 Marketing

**Purpose:** Lead generation, brand awareness, content marketing

```typescript
{
  id: 'marketing',
  label: 'Marketing',
  icon: 'IconSpeakerphone',
  color: 'pink',
  module: 'marketing',
  requiredPermission: 'marketing:view',
  items: [
    { id: 'campaigns', label: 'Campanhas', href: '/admin/marketing/campanhas', icon: 'IconFlag' },
    { id: 'leads', label: 'Leads', href: '/admin/marketing/leads', icon: 'IconUserPlus' },
    { id: 'sources', label: 'Origens', href: '/admin/marketing/origens', icon: 'IconRoute' },
    { id: 'landing-pages', label: 'Landing Pages', href: '/admin/marketing/landing-pages', icon: 'IconBrowserCheck' },
    { id: 'content', label: 'Conteúdo', href: '/admin/marketing/conteudo', icon: 'IconArticle' },
    { id: 'referrals', label: 'Indicações', href: '/admin/marketing/indicacoes', icon: 'IconShare' },
    { id: 'analytics', label: 'Analytics', href: '/admin/marketing/analytics', icon: 'IconChartBar' },
  ]
}
```

**API Routes:** `/api/{org}/marketing/*`
- `GET/POST /campaigns` - Campaign management
- `GET/POST /leads` - Lead capture & tracking
- `GET/POST /sources` - UTM sources, channels
- `GET/POST /landing-pages` - Landing page builder
- `GET/POST /content` - Content calendar
- `GET/POST /referrals` - Referral program
- `GET /analytics` - Marketing metrics

---

### 2. 💼 Comercial

**Purpose:** Sales pipeline, negotiations, closing deals

```typescript
{
  id: 'comercial',
  label: 'Comercial',
  icon: 'IconBriefcase',
  color: 'blue',
  module: 'sales',
  requiredPermission: 'sales:view',
  badge: { type: 'count', source: 'opportunities.hot' },
  items: [
    { id: 'pipeline', label: 'Pipeline', href: '/admin/comercial/pipeline', icon: 'IconTimeline' },
    { id: 'opportunities', label: 'Oportunidades', href: '/admin/comercial/oportunidades', icon: 'IconTarget' },
    { id: 'proposals', label: 'Propostas', href: '/admin/comercial/propostas', icon: 'IconFileText' },
    { id: 'negotiations', label: 'Negociações', href: '/admin/comercial/negociacoes', icon: 'IconScale' },
    { id: 'follow-ups', label: 'Follow-ups', href: '/admin/comercial/followups', icon: 'IconPhoneCall' },
    { id: 'targets', label: 'Metas', href: '/admin/comercial/metas', icon: 'IconChartArrowsVertical' },
    { id: 'performance', label: 'Desempenho', href: '/admin/comercial/desempenho', icon: 'IconTrophy' },
  ]
}
```

**API Routes:** `/api/{org}/sales/*`
- `GET/POST /pipeline` - Pipeline stages & cards
- `GET/POST /opportunities` - Opportunity CRUD
- `GET/POST /proposals` - Proposal generation
- `GET/POST /negotiations` - Negotiation tracking
- `GET/POST /follow-ups` - Follow-up tasks
- `GET/PUT /targets` - Sales targets
- `GET /performance` - Sales team metrics

---

### 3. 🎯 Operacional

**Purpose:** Check-in, enrollment process, contract management

```typescript
{
  id: 'operacional',
  label: 'Operacional',
  icon: 'IconClipboardCheck',
  color: 'teal',
  module: 'operations',
  requiredPermission: 'operations:view',
  items: [
    { id: 'checkin', label: 'Check-in', href: '/admin/operacional/checkin', icon: 'IconLogin' },
    { id: 'enrollments', label: 'Matrículas', href: '/admin/operacional/matriculas', icon: 'IconUserCheck' },
    { id: 'students', label: 'Alunos', href: '/admin/operacional/alunos', icon: 'IconSchool' },
    { id: 'guardians', label: 'Responsáveis', href: '/admin/operacional/responsaveis', icon: 'IconUsers' },
    { id: 'contracts', label: 'Contratos', href: '/admin/operacional/contratos', icon: 'IconFileSignature' },
    { id: 'renewals', label: 'Renovações', href: '/admin/operacional/renovacoes', icon: 'IconRefresh' },
    { id: 'cancellations', label: 'Cancelamentos', href: '/admin/operacional/cancelamentos', icon: 'IconUserOff' },
    { id: 'transfers', label: 'Transferências', href: '/admin/operacional/transferencias', icon: 'IconArrowsExchange' },
  ]
}
```

**API Routes:** `/api/{org}/operations/*`
- `GET/POST /checkin` - Daily check-in/out
- `GET/POST /enrollments` - Enrollment workflow
- `GET/POST /students` - Student management
- `GET/POST /guardians` - Guardian management
- `GET/POST /contracts` - Contract generation & signing
- `GET/POST /renewals` - Renewal tracking
- `POST /cancellations` - Cancellation process
- `POST /transfers` - Class/course transfers

---

### 4. 📚 Pedagógico

**Purpose:** Courses, classes, grades, curriculum management

```typescript
{
  id: 'pedagogico',
  label: 'Pedagógico',
  icon: 'IconBook',
  color: 'purple',
  module: 'academic',
  requiredPermission: 'academic:view',
  items: [
    { id: 'courses', label: 'Cursos', href: '/admin/pedagogico/cursos', icon: 'IconBooks' },
    { id: 'classes', label: 'Turmas', href: '/admin/pedagogico/turmas', icon: 'IconUsersGroup' },
    { id: 'curriculum', label: 'Grade Curricular', href: '/admin/pedagogico/grade', icon: 'IconListDetails' },
    { id: 'lessons', label: 'Aulas', href: '/admin/pedagogico/aulas', icon: 'IconPresentation' },
    { id: 'materials', label: 'Materiais', href: '/admin/pedagogico/materiais', icon: 'IconFiles' },
    { id: 'attendance', label: 'Presença', href: '/admin/pedagogico/presenca', icon: 'IconCheckbox' },
    { id: 'grades', label: 'Notas', href: '/admin/pedagogico/notas', icon: 'IconReportCard' },
    { id: 'assessments', label: 'Avaliações', href: '/admin/pedagogico/avaliacoes', icon: 'IconClipboardText' },
    { id: 'certificates', label: 'Certificados', href: '/admin/pedagogico/certificados', icon: 'IconCertificate' },
  ]
}
```

**API Routes:** `/api/{org}/academic/*`
- `GET/POST /courses` - Course CRUD
- `GET/POST /classes` - Class/turma management
- `GET/PUT /curriculum` - Curriculum structure
- `GET/POST /lessons` - Lesson planning
- `GET/POST /materials` - Learning materials
- `GET/POST /attendance` - Attendance records
- `GET/POST /grades` - Grade management
- `GET/POST /assessments` - Assessment creation
- `GET/POST /certificates` - Certificate generation

---

### 5. 💰 Financeiro

**Purpose:** Receivables, payments, billing, cash flow

```typescript
{
  id: 'financeiro',
  label: 'Financeiro',
  icon: 'IconCash',
  color: 'green',
  module: 'financial',
  requiredPermission: 'financial:view',
  badge: { type: 'count', source: 'receivables.overdue' },
  items: [
    { id: 'receivables', label: 'Recebíveis', href: '/admin/financeiro/recebiveis', icon: 'IconCurrencyDollar' },
    { id: 'payments', label: 'Pagamentos Recebidos', href: '/admin/financeiro/pagamentos', icon: 'IconReceiptCheck' },
    { id: 'billing', label: 'Faturamento', href: '/admin/financeiro/faturamento', icon: 'IconReceipt' },
    { id: 'delinquency', label: 'Inadimplência', href: '/admin/financeiro/inadimplencia', icon: 'IconAlertTriangle' },
    { id: 'bank-accounts', label: 'Contas Bancárias', href: '/admin/financeiro/contas', icon: 'IconBuildingBank' },
    { id: 'reconciliation', label: 'Conciliação', href: '/admin/financeiro/conciliacao', icon: 'IconChecks' },
    { id: 'cashflow', label: 'Fluxo de Caixa', href: '/admin/financeiro/fluxo-caixa', icon: 'IconArrowsTransferUp' },
    { id: 'payables', label: 'Contas a Pagar', href: '/admin/financeiro/contas-pagar', icon: 'IconFileInvoice' },
  ]
}
```

**API Routes:** `/api/{org}/financial/*`
- `GET/POST /receivables` - Receivables CRUD
- `GET/POST /payments` - Payment records
- `GET/POST /billing` - Invoice generation
- `GET /delinquency` - Overdue tracking
- `GET/POST /bank-accounts` - Bank account management
- `POST /reconciliation` - Bank reconciliation
- `GET /cashflow` - Cash flow projections
- `GET/POST /payables` - Payables management

---

### 6. 👥 RH & Pessoas

**Purpose:** Employee management, payroll, HR operations

```typescript
{
  id: 'rh',
  label: 'RH & Pessoas',
  icon: 'IconUserCog',
  color: 'orange',
  module: 'hr',
  requiredPermission: 'hr:view',
  items: [
    { id: 'employees', label: 'Colaboradores', href: '/admin/rh/colaboradores', icon: 'IconUsers' },
    { id: 'work-contracts', label: 'Contratos de Trabalho', href: '/admin/rh/contratos', icon: 'IconFileText' },
    { id: 'payroll', label: 'Folha de Pagamento', href: '/admin/rh/folha', icon: 'IconCoin' },
    { id: 'commissions', label: 'Comissões', href: '/admin/rh/comissoes', icon: 'IconPercentage' },
    { id: 'goals', label: 'Metas', href: '/admin/rh/metas', icon: 'IconTarget' },
    { id: 'timesheet', label: 'Ponto', href: '/admin/rh/ponto', icon: 'IconClock' },
    { id: 'leave', label: 'Férias e Afastamentos', href: '/admin/rh/ferias', icon: 'IconPlaneDeparture' },
    { id: 'training', label: 'Treinamentos', href: '/admin/rh/treinamentos', icon: 'IconSchool' },
    { id: 'careers', label: 'Vagas', href: '/admin/rh/vagas', icon: 'IconBriefcase' },
    { id: 'org-chart', label: 'Organograma', href: '/admin/rh/organograma', icon: 'IconHierarchy' },
  ]
}
```

**API Routes:** `/api/{org}/hr/*`
- `GET/POST /employees` - Employee CRUD
- `GET/POST /contracts` - Work contracts
- `GET/POST /payroll` - Payroll processing
- `GET/POST /commissions` - Commission calculation
- `GET/PUT /goals` - Goal management
- `GET/POST /timesheet` - Time tracking
- `GET/POST /leave` - Leave management
- `GET/POST /training` - Training records
- `GET/POST /careers` - Job postings
- `GET /org-chart` - Organization chart

---

### 7. 💬 Comunicação

**Purpose:** Internal messaging (email-style) + real-time communicator

```typescript
{
  id: 'comunicacao',
  label: 'Comunicação',
  icon: 'IconMessageCircle',
  color: 'cyan',
  module: 'communication',
  requiredPermission: 'communication:view',
  badge: { type: 'count', source: 'messages.unread' },
  items: [
    // Internal Email-Style
    { id: 'inbox', label: 'Caixa de Entrada', href: '/admin/comunicacao/inbox', icon: 'IconInbox' },
    { id: 'sent', label: 'Enviados', href: '/admin/comunicacao/enviados', icon: 'IconSend' },
    { id: 'drafts', label: 'Rascunhos', href: '/admin/comunicacao/rascunhos', icon: 'IconPencil' },
    { id: 'announcements', label: 'Avisos', href: '/admin/comunicacao/avisos', icon: 'IconBell' },
    
    // Communicator (Real-time)
    { id: 'communicator', label: 'Comunicador', href: '/admin/comunicacao/comunicador', icon: 'IconMessages', 
      badge: { type: 'count', source: 'chat.unread' } },
    
    // WhatsApp
    { id: 'whatsapp', label: 'WhatsApp', href: '/admin/comunicacao/whatsapp', icon: 'IconBrandWhatsapp' },
    
    // Templates
    { id: 'templates', label: 'Templates', href: '/admin/comunicacao/templates', icon: 'IconTemplate' },
  ]
}
```

**API Routes:** `/api/{org}/communication/*`
- `GET/POST /messages` - Internal messages
- `GET /inbox` - Inbox messages
- `GET /sent` - Sent messages
- `GET/POST /drafts` - Draft messages
- `GET/POST /announcements` - Announcements
- `GET/POST /communicator` - Real-time chat
- `GET/POST /whatsapp` - WhatsApp integration
- `GET/POST /templates` - Message templates

---

### 8. 📅 Agenda

**Purpose:** Hierarchical calendar system from personal to total view

```typescript
{
  id: 'agenda',
  label: 'Agenda',
  icon: 'IconCalendar',
  color: 'yellow',
  module: 'scheduling',
  requiredPermission: 'scheduling:view',
  items: [
    // Hierarchical Views
    { id: 'personal', label: 'Minha Agenda', href: '/admin/agenda/pessoal', icon: 'IconUser' },
    { id: 'team', label: 'Agenda do Time', href: '/admin/agenda/time', icon: 'IconUsers' },
    { id: 'leaders', label: 'Agenda dos Líderes', href: '/admin/agenda/lideres', icon: 'IconCrown' },
    { id: 'director', label: 'Agenda da Direção', href: '/admin/agenda/direcao', icon: 'IconShield' },
    { id: 'total', label: 'Agenda Total', href: '/admin/agenda/total', icon: 'IconCalendarStats' },
    
    // Resources
    { id: 'rooms', label: 'Salas', href: '/admin/agenda/salas', icon: 'IconDoor' },
    { id: 'resources', label: 'Recursos', href: '/admin/agenda/recursos', icon: 'IconPackage' },
    { id: 'academic-calendar', label: 'Calendário Letivo', href: '/admin/agenda/letivo', icon: 'IconSchool' },
  ]
}
```

**Hierarchy Logic:**
```typescript
// Personal → only user's events
// Team → events of user's direct reports
// Leaders → events of all coordinators/managers
// Director/Owner → events of leadership team
// Total → all events (admin only)
```

**API Routes:** `/api/{org}/scheduling/*`
- `GET/POST /events` - Event CRUD
- `GET /calendar/{scope}` - Calendar by scope (personal, team, leaders, director, total)
- `GET /rooms` - Room availability
- `GET /resources` - Resource availability
- `POST /bookings` - Book room/resource
- `GET/PUT /academic-calendar` - Academic calendar

---

### 9. 📊 Relatórios & BI

**Purpose:** Reports, dashboards, business intelligence

```typescript
{
  id: 'relatorios',
  label: 'Relatórios & BI',
  icon: 'IconChartPie',
  color: 'indigo',
  module: 'analytics',
  requiredPermission: 'analytics:view',
  items: [
    { id: 'dashboards', label: 'Dashboards', href: '/admin/relatorios/dashboards', icon: 'IconLayoutDashboard' },
    { id: 'kpis', label: 'KPIs', href: '/admin/relatorios/kpis', icon: 'IconGauge' },
    
    // Report Categories
    { id: 'commercial', label: 'Comercial', href: '/admin/relatorios/comercial', icon: 'IconBriefcase' },
    { id: 'academic', label: 'Pedagógico', href: '/admin/relatorios/pedagogico', icon: 'IconBook' },
    { id: 'financial', label: 'Financeiro', href: '/admin/relatorios/financeiro', icon: 'IconCash' },
    { id: 'hr', label: 'RH', href: '/admin/relatorios/rh', icon: 'IconUsers' },
    
    // Tools
    { id: 'custom', label: 'Relatório Personalizado', href: '/admin/relatorios/personalizado', icon: 'IconFileAnalytics' },
    { id: 'scheduled', label: 'Agendados', href: '/admin/relatorios/agendados', icon: 'IconClockShare' },
    { id: 'exports', label: 'Exportações', href: '/admin/relatorios/exportar', icon: 'IconDownload' },
  ]
}
```

**API Routes:** `/api/{org}/analytics/*`
- `GET /dashboards` - Dashboard configurations
- `GET /kpis` - KPI values
- `GET /reports/{category}` - Category reports
- `POST /reports/custom` - Custom report builder
- `GET/POST /reports/scheduled` - Scheduled reports
- `GET /exports` - Export data

---

### 10. 📒 Contábil

**Purpose:** Accounting, fiscal compliance, SPED

```typescript
{
  id: 'contabil',
  label: 'Contábil',
  icon: 'IconCalculator',
  color: 'lime',
  module: 'accounting',
  requiredPermission: 'accounting:view',
  items: [
    { id: 'chart-of-accounts', label: 'Plano de Contas', href: '/admin/contabil/plano-contas', icon: 'IconListDetails' },
    { id: 'journal', label: 'Lançamentos', href: '/admin/contabil/lancamentos', icon: 'IconReceipt' },
    { id: 'cost-centers', label: 'Centros de Custo', href: '/admin/contabil/centros-custo', icon: 'IconBuildingFactory' },
    
    // Fiscal
    { id: 'nfse', label: 'NFS-e', href: '/admin/contabil/nfse', icon: 'IconFileInvoice' },
    { id: 'fiscal-docs', label: 'Documentos Fiscais', href: '/admin/contabil/documentos', icon: 'IconFileText' },
    { id: 'sped', label: 'SPED', href: '/admin/contabil/sped', icon: 'IconFileExport' },
    
    // Reports
    { id: 'dre', label: 'DRE', href: '/admin/contabil/dre', icon: 'IconChartBar' },
    { id: 'balancete', label: 'Balancete', href: '/admin/contabil/balancete', icon: 'IconScale' },
    { id: 'balanco', label: 'Balanço', href: '/admin/contabil/balanco', icon: 'IconChartDonut' },
    
    // Integration
    { id: 'accountant-portal', label: 'Portal do Contador', href: '/admin/contabil/contador', icon: 'IconUserCircle' },
  ]
}
```

**API Routes:** `/api/{org}/accounting/*`
- `GET/POST /chart-of-accounts` - Chart of accounts
- `GET/POST /journal-entries` - Journal entries
- `GET/POST /cost-centers` - Cost centers
- `GET/POST /invoices` - NFS-e management
- `GET/POST /fiscal-documents` - Fiscal documents
- `GET /sped/{type}` - SPED exports (ECD, ECF, EFD)
- `GET /reports/{type}` - Accounting reports

---

### 11. 📖 Conhecimento Interno

**Purpose:** Internal knowledge base, wiki, documentation

```typescript
{
  id: 'conhecimento',
  label: 'Conhecimento',
  icon: 'IconLibrary',
  color: 'grape',
  module: 'knowledge',
  requiredPermission: 'knowledge:view',
  items: [
    { id: 'wiki', label: 'Wiki', href: '/admin/conhecimento/wiki', icon: 'IconArticle' },
    { id: 'procedures', label: 'Procedimentos', href: '/admin/conhecimento/procedimentos', icon: 'IconListCheck' },
    { id: 'policies', label: 'Políticas', href: '/admin/conhecimento/politicas', icon: 'IconShieldCheck' },
    { id: 'faq', label: 'FAQ', href: '/admin/conhecimento/faq', icon: 'IconQuestionMark' },
    { id: 'training-materials', label: 'Materiais de Treinamento', href: '/admin/conhecimento/treinamento', icon: 'IconSchool' },
    { id: 'templates', label: 'Templates', href: '/admin/conhecimento/templates', icon: 'IconTemplate' },
    { id: 'files', label: 'Arquivos', href: '/admin/conhecimento/arquivos', icon: 'IconFolders' },
  ]
}
```

**API Routes:** `/api/{org}/knowledge/*`
- `GET/POST /articles` - Wiki articles
- `GET/POST /procedures` - SOPs
- `GET/POST /policies` - Company policies
- `GET/POST /faq` - FAQ items
- `GET/POST /training` - Training materials
- `GET/POST /templates` - Document templates
- `GET/POST /files` - File storage

---

### 12. 🤖 Assistente IA

**Purpose:** AI-powered tools, generators, chat

```typescript
{
  id: 'ai',
  label: 'Assistente IA',
  icon: 'IconRobot',
  color: 'violet',
  module: 'ai',
  requiredPermission: 'ai:view',
  featureFlag: 'ai_enabled',
  items: [
    { id: 'chat', label: 'Chat', href: '/admin/ai/chat', icon: 'IconMessage' },
    { id: 'generators', label: 'Geradores', href: '/admin/ai/geradores', icon: 'IconWand',
      children: [
        { id: 'lesson-plans', label: 'Planos de Aula', href: '/admin/ai/geradores/plano-aula' },
        { id: 'content', label: 'Conteúdo', href: '/admin/ai/geradores/conteudo' },
        { id: 'assessments', label: 'Avaliações', href: '/admin/ai/geradores/avaliacoes' },
        { id: 'messages', label: 'Mensagens', href: '/admin/ai/geradores/mensagens' },
        { id: 'proposals', label: 'Propostas', href: '/admin/ai/geradores/propostas' },
      ]
    },
    { id: 'analyses', label: 'Análises', href: '/admin/ai/analises', icon: 'IconBrain' },
    { id: 'insights', label: 'Insights', href: '/admin/ai/insights', icon: 'IconBulb' },
    { id: 'usage', label: 'Uso & Custos', href: '/admin/ai/uso', icon: 'IconChartBar' },
  ]
}
```

**API Routes:** `/api/{org}/ai/*`
- `POST /chat` - Chat completion
- `POST /generate/{type}` - Content generators
- `POST /analyze/{type}` - Analysis endpoints
- `GET /insights` - AI-generated insights
- `GET /usage` - API usage stats

---

### 13. 🔄 Kaizen

**Purpose:** Continuous improvement, suggestions, feedback, retrospectives

```typescript
{
  id: 'kaizen',
  label: 'Kaizen',
  icon: 'IconRefreshDot',
  color: 'amber',
  module: 'kaizen',
  requiredPermission: 'kaizen:view',
  items: [
    { id: 'suggestions', label: 'Sugestões', href: '/admin/kaizen/sugestoes', icon: 'IconBulb' },
    { id: 'feedback', label: 'Feedback', href: '/admin/kaizen/feedback', icon: 'IconMessage2' },
    { id: 'retrospectives', label: 'Retrospectivas', href: '/admin/kaizen/retrospectivas', icon: 'IconHistory' },
    { id: 'improvements', label: 'Melhorias', href: '/admin/kaizen/melhorias', icon: 'IconTrendingUp' },
    { id: 'nps', label: 'NPS', href: '/admin/kaizen/nps', icon: 'IconMoodSmile' },
    { id: 'surveys', label: 'Pesquisas', href: '/admin/kaizen/pesquisas', icon: 'IconClipboardList' },
    { id: 'board', label: 'Quadro de Ideias', href: '/admin/kaizen/quadro', icon: 'IconLayoutKanban' },
  ]
}
```

**API Routes:** `/api/{org}/kaizen/*`
- `GET/POST /suggestions` - Improvement suggestions
- `GET/POST /feedback` - Feedback collection
- `GET/POST /retrospectives` - Team retrospectives
- `GET /improvements` - Improvement tracking
- `GET/POST /nps` - NPS surveys
- `GET/POST /surveys` - Custom surveys
- `GET/POST /board` - Idea board

---

### 14. ⚙️ Configurações

**Purpose:** System settings, users, permissions, integrations

```typescript
{
  id: 'configuracoes',
  label: 'Configurações',
  icon: 'IconSettings',
  color: 'gray',
  module: 'settings',
  requiredPermission: 'settings:view',
  position: 'bottom',
  items: [
    { id: 'org', label: 'Escola', href: '/admin/configuracoes/escola', icon: 'IconBuilding' },
    { id: 'branding', label: 'Branding', href: '/admin/configuracoes/branding', icon: 'IconPalette' },
    { id: 'users', label: 'Usuários', href: '/admin/configuracoes/usuarios', icon: 'IconUsers' },
    { id: 'roles', label: 'Cargos & Permissões', href: '/admin/configuracoes/cargos', icon: 'IconShieldLock' },
    { id: 'integrations', label: 'Integrações', href: '/admin/configuracoes/integracoes', icon: 'IconPlugConnected' },
    { id: 'api-keys', label: 'API Keys', href: '/admin/configuracoes/api-keys', icon: 'IconKey' },
    { id: 'webhooks', label: 'Webhooks', href: '/admin/configuracoes/webhooks', icon: 'IconWebhook' },
    { id: 'audit', label: 'Auditoria', href: '/admin/configuracoes/auditoria', icon: 'IconHistory' },
    { id: 'backup', label: 'Backup', href: '/admin/configuracoes/backup', icon: 'IconDatabaseExport' },
  ]
}
```

**API Routes:** `/api/{org}/settings/*`
- `GET/PUT /org` - Organization settings
- `GET/PUT /branding` - Branding/theme
- `GET/POST /users` - User management
- `GET/POST /roles` - Role definitions
- `GET/PUT /integrations` - Integration configs
- `GET/POST /api-keys` - API key management
- `GET/POST /webhooks` - Webhook endpoints
- `GET /audit` - Audit log

---

## Complete Bundle → API Mapping

| # | Bundle | Module | API Route | Primary Entities |
|---|--------|--------|-----------|------------------|
| 1 | Marketing | marketing | `/api/{org}/marketing/*` | campaigns, leads, sources |
| 2 | Comercial | sales | `/api/{org}/sales/*` | opportunities, proposals, pipeline |
| 3 | Operacional | operations | `/api/{org}/operations/*` | enrollments, contracts, checkin |
| 4 | Pedagógico | academic | `/api/{org}/academic/*` | courses, classes, lessons, grades |
| 5 | Financeiro | financial | `/api/{org}/financial/*` | receivables, payments, cashflow |
| 6 | RH & Pessoas | hr | `/api/{org}/hr/*` | employees, payroll, commissions |
| 7 | Comunicação | communication | `/api/{org}/communication/*` | messages, announcements, chat |
| 8 | Agenda | scheduling | `/api/{org}/scheduling/*` | events, rooms, calendar |
| 9 | Relatórios & BI | analytics | `/api/{org}/analytics/*` | reports, dashboards, kpis |
| 10 | Contábil | accounting | `/api/{org}/accounting/*` | journal, nfse, sped |
| 11 | Conhecimento | knowledge | `/api/{org}/knowledge/*` | wiki, procedures, files |
| 12 | Assistente IA | ai | `/api/{org}/ai/*` | chat, generators, insights |
| 13 | Kaizen | kaizen | `/api/{org}/kaizen/*` | suggestions, feedback, nps |
| 14 | Configurações | settings | `/api/{org}/settings/*` | org, users, roles |

---

## Implementation Order

Based on dependencies and business priority:

```
Phase 1: Foundation
├── Setup/Onboarding (done!)
├── Configurações
└── Comunicação

Phase 2: Core Business
├── Marketing
├── Comercial
├── Operacional
└── Pedagógico

Phase 3: Finance & HR
├── Financeiro
├── Contábil
└── RH & Pessoas

Phase 4: Intelligence
├── Relatórios & BI
├── Conhecimento
├── Assistente IA
└── Kaizen

Phase 5: Optimization
├── Agenda
└── Cross-module integrations
```

---

*Last Updated: 2026-02-05*
