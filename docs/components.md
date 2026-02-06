# UI Components Library

## Overview

Node Zero uses a curated set of reusable components built on top of Mantine UI v7.

---

## Component Index

| Component | Location | Description |
|-----------|----------|-------------|
| [AppLayout](#applayout) | `components/layout/` | Main application shell |
| [PageHeader](#pageheader) | `components/shared/` | Consistent page headers |
| [SectionCard](#sectioncard) | `components/shared/` | Content sections |
| [KanbanBoard](#kanbanboard) | `components/shared/` | Drag-and-drop columns |
| [RichTextEditor](#richtexteditor) | `components/shared/` | TipTap-based editor |
| [MetricCard](#metriccard) | `components/shared/` | Dashboard metrics |
| [ProgressRing](#progressring) | `components/shared/` | Circular progress |
| [Constellation3D](#constellation3d) | `components/3d/` | Knowledge graph visualization |
| [TodoCube3D](#todocube3d) | `components/3d/` | 3D task management |

---

## Layout Components

### AppLayout

Main application shell with role-based navigation.

**Location**: `src/components/layout/AppLayout.tsx`

**Props**:
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}
```

**Features**:
- 6 user role navigation presets
- Role switcher (development mode)
- Theme toggle (light/dark)
- User dropdown menu
- Collapsible sidebar
- Breadcrumb support

**Usage**:
```tsx
// Used automatically in dashboard layout
// src/app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}
```

### PageHeader

Consistent headers with title, description, and actions.

**Location**: `src/components/shared/PageHeader.tsx`

**Props**:
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  backHref?: string;
}
```

**Usage**:
```tsx
<PageHeader
  title="Lead Pipeline"
  description="Manage prospective students through the sales funnel"
  breadcrumbs={[
    { label: 'Staff', href: '/staff' },
    { label: 'Leads' }
  ]}
  actions={
    <Button leftSection={<IconPlus />}>Add Lead</Button>
  }
/>
```

### SectionCard

Container for content sections.

**Location**: `src/components/shared/SectionCard.tsx`

**Props**:
```typescript
interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  padding?: MantineSize;
}
```

**Usage**:
```tsx
<SectionCard
  title="Personal Information"
  description="Update your profile details"
  actions={<Button variant="subtle">Edit</Button>}
>
  <TextInput label="Name" />
  <TextInput label="Email" />
</SectionCard>
```

---

## Data Display Components

### MetricCard

Dashboard metric display.

**Props**:
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: MantineColor;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}
```

**Usage**:
```tsx
<MetricCard
  title="Total Leads"
  value={247}
  subtitle="This month"
  icon={<IconUsers />}
  color="blue"
  trend={{ value: 12, direction: 'up' }}
/>
```

### ProgressRing

Circular progress indicator.

**Props**:
```typescript
interface ProgressRingProps {
  value: number;        // 0-100
  size?: number;
  thickness?: number;
  color?: MantineColor;
  label?: string;
  showValue?: boolean;
}
```

**Usage**:
```tsx
<ProgressRing
  value={75}
  size={120}
  color="green"
  label="Module Progress"
  showValue
/>
```

---

## Interactive Components

### KanbanBoard

Drag-and-drop kanban board using native DnD.

**Location**: `src/components/shared/KanbanBoard.tsx`

**Props**:
```typescript
interface KanbanColumn {
  id: string;
  title: string;
  color?: MantineColor;
  items: KanbanItem[];
}

interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onItemMove: (itemId: string, fromColumn: string, toColumn: string) => void;
  onItemClick?: (item: KanbanItem) => void;
  renderItem?: (item: KanbanItem) => React.ReactNode;
}
```

**Usage**:
```tsx
const [columns, setColumns] = useState(initialColumns);

<KanbanBoard
  columns={columns}
  onItemMove={(itemId, from, to) => {
    // Update item's column
    moveItem(itemId, from, to);
  }}
  onItemClick={(item) => {
    router.push(`/leads/${item.id}`);
  }}
/>
```

### RichTextEditor

TipTap-based rich text editor.

**Location**: `src/components/shared/RichTextEditor.tsx`

**Props**:
```typescript
interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: number;
  toolbar?: ('bold' | 'italic' | 'heading' | 'list' | 'link')[];
}
```

**Usage**:
```tsx
<RichTextEditor
  content={annotation}
  onChange={setAnnotation}
  placeholder="Write your reflection..."
  toolbar={['bold', 'italic', 'heading', 'list']}
/>
```

---

## 3D Components

### Constellation3D

3D knowledge graph visualization using React Three Fiber.

**Location**: `src/components/3d/Constellation3D.tsx`

**Props**:
```typescript
interface ConstellationNode {
  id: string;
  label: string;
  category: string;
  position: [number, number, number];
  size?: number;
  color?: string;
}

interface ConstellationEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  strength?: number;
}

interface Constellation3DProps {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  onNodeClick?: (node: ConstellationNode) => void;
  onEdgeClick?: (edge: ConstellationEdge) => void;
  enableOrbit?: boolean;
  showLabels?: boolean;
}
```

**Usage**:
```tsx
<Constellation3D
  nodes={knowledgeNodes}
  edges={knowledgeEdges}
  onNodeClick={(node) => setSelected(node)}
  enableOrbit
  showLabels
/>
```

**Features**:
- OrbitControls for navigation
- Hover effects on nodes
- Click selection
- Label sprites
- Line connections with opacity

### TodoCube3D

3D task visualization using Eisenhower matrix with depth.

**Location**: `src/components/3d/TodoCube3D.tsx`

**Props**:
```typescript
interface Todo3DItem {
  id: string;
  title: string;
  urgency: number;    // 1-10 (X axis)
  importance: number; // 1-10 (Y axis)
  effort: number;     // 1-10 (Z axis)
  completed?: boolean;
}

interface TodoCube3DProps {
  items: Todo3DItem[];
  onItemClick?: (item: Todo3DItem) => void;
  showAxes?: boolean;
  showGrid?: boolean;
  colorScheme?: 'urgency' | 'effort' | 'category';
}
```

**Usage**:
```tsx
<TodoCube3D
  items={todos}
  onItemClick={(todo) => openEditModal(todo)}
  showAxes
  showGrid
  colorScheme="urgency"
/>
```

**Features**:
- 3-axis positioning (urgency, importance, effort)
- Sphere size based on priority
- Color coding by urgency or effort
- Grid and axis visualization
- OrbitControls for navigation

---

## Form Components

### FormStepper

Multi-step form wizard.

**Props**:
```typescript
interface FormStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  validation?: () => boolean | Promise<boolean>;
}

interface FormStepperProps {
  steps: FormStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  allowSkip?: boolean;
}
```

**Usage**:
```tsx
<FormStepper
  steps={[
    { id: 'type', title: 'Account Type', content: <TypeSelection /> },
    { id: 'credentials', title: 'Credentials', content: <CredentialsForm /> },
    { id: 'personal', title: 'Personal Info', content: <PersonalForm /> },
  ]}
  currentStep={step}
  onStepChange={setStep}
  onComplete={handleSubmit}
/>
```

---

## Status Components

### StatusBadge

Colored status indicator.

**Props**:
```typescript
interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, MantineColor>;
  size?: MantineSize;
}
```

**Default Color Map**:
```typescript
const defaultColorMap = {
  new: 'blue',
  contacted: 'cyan',
  qualified: 'teal',
  trial: 'green',
  enrolled: 'lime',
  lost: 'gray',
  pending: 'yellow',
  paid: 'green',
  overdue: 'red',
  cancelled: 'gray',
};
```

**Usage**:
```tsx
<StatusBadge status="qualified" />
<StatusBadge status="custom" colorMap={{ custom: 'pink' }} />
```

### AlertLevelBadge

Escalation alert level indicator.

**Props**:
```typescript
interface AlertLevelBadgeProps {
  level: 'green' | 'yellow' | 'orange' | 'red';
  showLabel?: boolean;
}
```

**Usage**:
```tsx
<AlertLevelBadge level="yellow" showLabel />
// Renders: 🟡 Yellow - Attention Needed
```

---

## Design Tokens

### Colors

```css
:root {
  /* Role colors */
  --role-student: #228be6;   /* Blue */
  --role-teacher: #40c057;   /* Green */
  --role-parent: #fab005;    /* Yellow */
  --role-staff: #7950f2;     /* Violet */
  --role-school: #fd7e14;    /* Orange */
  --role-owner: #f03e3e;     /* Red */
  
  /* Alert colors */
  --alert-green: #40c057;
  --alert-yellow: #fab005;
  --alert-orange: #fd7e14;
  --alert-red: #f03e3e;
  
  /* Technique colors */
  --tech-orbit: #228be6;
  --tech-slingshot: #40c057;
  --tech-blackhole: #be4bdb;
  --tech-constellation: #fab005;
}
```

### Spacing

Mantine's spacing scale is used throughout:

| Token | Value |
|-------|-------|
| xs | 10px |
| sm | 12px |
| md | 16px |
| lg | 20px |
| xl | 32px |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Page title | 24px | 700 |
| Section title | 18px | 600 |
| Body text | 14px | 400 |
| Small text | 12px | 400 |
| Badge | 10px | 600 |

---

## Icon Usage

Icons are from `@tabler/icons-react`. Common icons:

| Icon | Usage |
|------|-------|
| `IconHome` | Dashboard |
| `IconUser` | Profile |
| `IconUsers` | Students/Leads |
| `IconCalendar` | Schedule |
| `IconBook` | Courses/Modules |
| `IconRocket` | Playground |
| `IconBrain` | AI/Intelligence |
| `IconChartBar` | Analytics |
| `IconSettings` | Settings |
| `IconLogout` | Sign out |
| `IconPlus` | Add/Create |
| `IconEdit` | Edit |
| `IconTrash` | Delete |
| `IconCheck` | Confirm/Complete |
| `IconX` | Cancel/Close |
| `IconAlertTriangle` | Warning |
| `IconAlertCircle` | Error |

---

## Best Practices

### 1. Consistent Layout Pattern

```tsx
export default function MyPage() {
  return (
    <>
      <PageHeader title="Page Title" />
      
      <Stack gap="lg">
        <SectionCard title="Section 1">
          {/* Content */}
        </SectionCard>
        
        <SectionCard title="Section 2">
          {/* Content */}
        </SectionCard>
      </Stack>
    </>
  );
}
```

### 2. Loading States

```tsx
if (isLoading) {
  return (
    <Center h={400}>
      <Loader size="lg" />
    </Center>
  );
}
```

### 3. Empty States

```tsx
if (items.length === 0) {
  return (
    <Center h={200}>
      <Stack align="center" gap="sm">
        <IconInbox size={48} stroke={1.5} opacity={0.5} />
        <Text c="dimmed">No items yet</Text>
        <Button variant="light">Add First Item</Button>
      </Stack>
    </Center>
  );
}
```

### 4. Error States

```tsx
if (error) {
  return (
    <Alert color="red" icon={<IconAlertCircle />}>
      {error.message}
    </Alert>
  );
}
```

---

*Last updated: 2026-02-03*
