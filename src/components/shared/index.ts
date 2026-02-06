// Shared UI Components
export { UserAvatar } from './UserAvatar';
export { StatusBadge } from './StatusBadge';
export { EmptyState } from './EmptyState';
export { ConfirmModal } from './ConfirmModal';
export { DateRangePicker } from './DateRangePicker';
export { FileUpload } from './FileUpload';
export { Timeline } from './Timeline';
export { StatsCard } from './StatsCard';
export { PageHeader } from './PageHeader';
export { SectionCard } from './SectionCard';
export { KanbanBoard } from './KanbanBoard';
export type { KanbanColumn, KanbanItem, KanbanCardAction, KanbanColumnAction } from './KanbanBoard';
export { RichTextEditor, Latex, LATEX_EXAMPLES } from './RichTextEditor';
export { ExportButton, ExportModal, QuickExportButtons } from './ExportButton';
export type { ExportButtonProps, ExportModalProps } from './ExportButton';

// Layout Components
export { TabLayout, VerticalTabCards } from './TabLayout';
export type { TabItem, TabLayoutProps, VerticalTabCardItem, VerticalTabCardsProps } from './TabLayout';
export { WizardLayout, CompactWizard } from './WizardLayout';
export type { WizardStep, WizardLayoutProps, CompactWizardStep, CompactWizardProps } from './WizardLayout';

// 3D Visualization
export { OrbitScene, OrbitScenePreview } from './OrbitScene';
export type { OrbitNode, OrbitConnection, OrbitSceneProps } from './OrbitScene';

// CRM Lifecycle
export {
    LifecycleCard,
    LifecycleKanban,
    AddOcurrenceModal,
    STAGE_CONFIG,
    OCURRENCE_CONFIG
} from './LifecycleTimeline';
export type {
    LifecycleStage,
    OcurrenceType,
    Ocurrence,
    LifecycleContact,
    LifecycleMetrics,
    LifecycleCardProps,
    LifecycleKanbanProps,
    AddOcurrenceModalProps
} from './LifecycleTimeline';

