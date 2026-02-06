'use client';

import { useState, ReactNode } from 'react';
import {
    Box, Paper, Card, Text, Group, Stack, Badge, Avatar, ActionIcon, Menu, Button,
    ThemeIcon, Timeline as MantineTimeline, Divider, Modal, TextInput, Textarea,
    Select, SimpleGrid, Progress, Tooltip, ScrollArea, Tabs
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconDots, IconPlus, IconPhone, IconMail, IconMessage, IconNote, IconCalendar,
    IconCash, IconCheck, IconX, IconArrowRight, IconUser, IconSchool, IconTrophy,
    IconAlertCircle, IconChevronRight, IconEdit, IconTrash, IconEye, IconStar,
    IconGift, IconHeartHandshake, IconClock, IconCurrencyReal, IconChartLine,
    IconUserPlus, IconUserCheck, IconMedal, IconHistory
} from '@tabler/icons-react';

// ----------------------------------------
// Types
// ----------------------------------------

export type LifecycleStage = 'lead' | 'trial' | 'student' | 'alumnus' | 'churned';

export type OcurrenceType =
    | 'note' | 'call' | 'email' | 'whatsapp' | 'meeting'
    | 'payment' | 'enrollment' | 'lesson' | 'trial'
    | 'conversion' | 'graduation' | 'referral' | 'complaint'
    | 'milestone' | 'system';

export interface Ocurrence {
    id: string;
    type: OcurrenceType;
    title: string;
    description?: string;
    timestamp: number;
    userId?: string;
    userName?: string;
    metadata?: Record<string, any>;
    status?: 'success' | 'warning' | 'error' | 'info';
}

export interface LifecycleMetrics {
    cacCents?: number;          // Customer Acquisition Cost
    ltvCents?: number;          // Lifetime Value
    monthsActive?: number;      // Months as customer
    totalPaidCents?: number;    // Total amount paid
    referralsCount?: number;    // Number of referrals made
    attendanceRate?: number;    // Attendance percentage (0-100)
    lastPaymentDate?: number;   // Last payment timestamp
    nextPaymentDate?: number;   // Next expected payment
}

export interface LifecycleContact {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    stage: LifecycleStage;
    createdAt: number;
    convertedAt?: number;     // When became student
    graduatedAt?: number;     // When became alumnus
    churnedAt?: number;       // When churned
    source?: string;          // Lead source (website, referral, etc.)
    assignedTo?: string;      // Staff assigned
    tags?: string[];
    metrics: LifecycleMetrics;
    ocurrences: Ocurrence[];
}

// ----------------------------------------
// Config
// ----------------------------------------

const STAGE_CONFIG: Record<LifecycleStage, {
    label: string;
    color: string;
    icon: typeof IconUser;
    description: string;
}> = {
    lead: {
        label: 'Lead',
        color: 'yellow',
        icon: IconUserPlus,
        description: 'Prospect interessado',
    },
    trial: {
        label: 'Em Trial',
        color: 'orange',
        icon: IconCalendar,
        description: 'Aula experimental agendada/realizada',
    },
    student: {
        label: 'Aluno',
        color: 'blue',
        icon: IconSchool,
        description: 'Matriculado e ativo',
    },
    alumnus: {
        label: 'Ex-Aluno',
        color: 'green',
        icon: IconUserCheck,
        description: 'Completou o ciclo',
    },
    churned: {
        label: 'Perdido',
        color: 'red',
        icon: IconX,
        description: 'Cancelou ou desistiu',
    },
};

const OCURRENCE_CONFIG: Record<OcurrenceType, {
    label: string;
    icon: typeof IconNote;
    color: string;
}> = {
    note: { label: 'Anotação', icon: IconNote, color: 'gray' },
    call: { label: 'Ligação', icon: IconPhone, color: 'blue' },
    email: { label: 'E-mail', icon: IconMail, color: 'cyan' },
    whatsapp: { label: 'WhatsApp', icon: IconMessage, color: 'green' },
    meeting: { label: 'Reunião', icon: IconCalendar, color: 'violet' },
    payment: { label: 'Pagamento', icon: IconCash, color: 'green' },
    enrollment: { label: 'Matrícula', icon: IconUser, color: 'blue' },
    lesson: { label: 'Aula', icon: IconSchool, color: 'violet' },
    trial: { label: 'Aula Experimental', icon: IconStar, color: 'orange' },
    conversion: { label: 'Conversão', icon: IconCheck, color: 'green' },
    graduation: { label: 'Formatura', icon: IconTrophy, color: 'gold' },
    referral: { label: 'Indicação', icon: IconGift, color: 'pink' },
    complaint: { label: 'Reclamação', icon: IconAlertCircle, color: 'red' },
    milestone: { label: 'Marco', icon: IconMedal, color: 'blue' },
    system: { label: 'Sistema', icon: IconClock, color: 'gray' },
};

// ----------------------------------------
// Sub-Components
// ----------------------------------------

interface StageProgressProps {
    stage: LifecycleStage;
}

function StageProgress({ stage }: StageProgressProps) {
    const stages: LifecycleStage[] = ['lead', 'trial', 'student', 'alumnus'];
    const currentIndex = stages.indexOf(stage);

    // Handle churned separately
    if (stage === 'churned') {
        return (
            <Group gap="xs" wrap="nowrap">
                {stages.map((s, idx) => (
                    <Box key={s} style={{ flex: 1 }}>
                        <Progress
                            value={100}
                            size="xs"
                            color="red"
                            style={{ opacity: 0.3 }}
                        />
                    </Box>
                ))}
            </Group>
        );
    }

    return (
        <Group gap="xs" wrap="nowrap">
            {stages.map((s, idx) => {
                const config = STAGE_CONFIG[s];
                const isCompleted = idx < currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                    <Tooltip key={s} label={config.label}>
                        <Box style={{ flex: 1 }}>
                            <Progress
                                value={isCompleted || isCurrent ? 100 : 0}
                                size="xs"
                                color={isCurrent ? config.color : isCompleted ? 'green' : 'gray'}
                                animated={isCurrent}
                            />
                        </Box>
                    </Tooltip>
                );
            })}
        </Group>
    );
}

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: ReactNode;
    color?: string;
    suffix?: string;
}

function MetricCard({ label, value, icon, color = 'blue', suffix }: MetricCardProps) {
    return (
        <Paper p="xs" radius="md" withBorder>
            <Group gap="xs" wrap="nowrap">
                <ThemeIcon size="sm" variant="light" color={color}>
                    {icon}
                </ThemeIcon>
                <div>
                    <Text size="xs" c="dimmed">{label}</Text>
                    <Text size="sm" fw={600}>
                        {value}{suffix}
                    </Text>
                </div>
            </Group>
        </Paper>
    );
}

interface OcurrenceTimelineProps {
    ocurrences: Ocurrence[];
    maxItems?: number;
    onAddOcurrence?: () => void;
}

function OcurrenceTimeline({ ocurrences, maxItems, onAddOcurrence }: OcurrenceTimelineProps) {
    const displayItems = maxItems ? ocurrences.slice(0, maxItems) : ocurrences;

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    return (
        <Stack gap="xs">
            {onAddOcurrence && (
                <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={onAddOcurrence}
                    fullWidth
                >
                    Nova Ocorrência
                </Button>
            )}

            <MantineTimeline bulletSize={24} lineWidth={2}>
                {displayItems.map((item) => {
                    const config = OCURRENCE_CONFIG[item.type] || OCURRENCE_CONFIG.note;
                    const Icon = config.icon;

                    return (
                        <MantineTimeline.Item
                            key={item.id}
                            bullet={
                                <ThemeIcon size={24} variant="light" color={config.color} radius="xl">
                                    <Icon size={12} />
                                </ThemeIcon>
                            }
                        >
                            <Group justify="space-between" wrap="nowrap" gap="xs">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text size="sm" fw={500} lineClamp={1}>{item.title}</Text>
                                    {item.description && (
                                        <Text size="xs" c="dimmed" lineClamp={2}>{item.description}</Text>
                                    )}
                                    {item.userName && (
                                        <Text size="xs" c="dimmed">por {item.userName}</Text>
                                    )}
                                </div>
                                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                    {formatTime(item.timestamp)}
                                </Text>
                            </Group>
                        </MantineTimeline.Item>
                    );
                })}
            </MantineTimeline>

            {maxItems && ocurrences.length > maxItems && (
                <Button variant="subtle" size="xs" fullWidth>
                    Ver mais {ocurrences.length - maxItems} ocorrências
                </Button>
            )}
        </Stack>
    );
}

// ----------------------------------------
// Lifecycle Card
// ----------------------------------------

export interface LifecycleCardProps {
    contact: LifecycleContact;
    compact?: boolean;
    onView?: () => void;
    onEdit?: () => void;
    onAddOcurrence?: () => void;
    onAdvanceStage?: () => void;
}

export function LifecycleCard({
    contact,
    compact = false,
    onView,
    onEdit,
    onAddOcurrence,
    onAdvanceStage,
}: LifecycleCardProps) {
    const stage = STAGE_CONFIG[contact.stage];
    const StageIcon = stage.icon;

    const formatCurrency = (cents?: number) => {
        if (!cents) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(cents / 100);
    };

    const ltvCacRatio = contact.metrics.ltvCents && contact.metrics.cacCents
        ? (contact.metrics.ltvCents / contact.metrics.cacCents).toFixed(1)
        : null;

    if (compact) {
        return (
            <Paper p="sm" radius="md" withBorder>
                <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                        <Avatar size="sm" radius="xl" color={stage.color}>
                            {contact.name.charAt(0)}
                        </Avatar>
                        <div>
                            <Text size="sm" fw={500}>{contact.name}</Text>
                            <Text size="xs" c="dimmed">{stage.label}</Text>
                        </div>
                    </Group>
                    <Group gap="xs">
                        {ltvCacRatio && (
                            <Badge size="sm" variant="light" color={parseFloat(ltvCacRatio) >= 3 ? 'green' : 'yellow'}>
                                LTV:CAC {ltvCacRatio}x
                            </Badge>
                        )}
                        <ActionIcon variant="subtle" onClick={onView}>
                            <IconChevronRight size={16} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Paper>
        );
    }

    return (
        <Card shadow="sm" padding="md" radius="md" withBorder>
            {/* Header */}
            <Group justify="space-between" mb="sm">
                <Group gap="sm">
                    <Avatar size="md" radius="xl" color={stage.color} src={contact.avatarUrl}>
                        {contact.name.charAt(0)}
                    </Avatar>
                    <div>
                        <Text fw={600}>{contact.name}</Text>
                        <Group gap="xs">
                            <Badge size="sm" color={stage.color} leftSection={<StageIcon size={10} />}>
                                {stage.label}
                            </Badge>
                            {contact.tags?.map(tag => (
                                <Badge key={tag} size="xs" variant="outline">{tag}</Badge>
                            ))}
                        </Group>
                    </div>
                </Group>
                <Menu>
                    <Menu.Target>
                        <ActionIcon variant="subtle">
                            <IconDots size={16} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size={14} />} onClick={onView}>
                            Ver Detalhes
                        </Menu.Item>
                        <Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>
                            Editar
                        </Menu.Item>
                        <Menu.Item leftSection={<IconPlus size={14} />} onClick={onAddOcurrence}>
                            Nova Ocorrência
                        </Menu.Item>
                        {contact.stage !== 'alumnus' && contact.stage !== 'churned' && (
                            <>
                                <Menu.Divider />
                                <Menu.Item
                                    leftSection={<IconArrowRight size={14} />}
                                    color="green"
                                    onClick={onAdvanceStage}
                                >
                                    Avançar Estágio
                                </Menu.Item>
                            </>
                        )}
                    </Menu.Dropdown>
                </Menu>
            </Group>

            {/* Stage Progress */}
            <Box mb="md">
                <StageProgress stage={contact.stage} />
            </Box>

            {/* Metrics */}
            <SimpleGrid cols={2} spacing="xs" mb="md">
                {contact.metrics.ltvCents !== undefined && (
                    <MetricCard
                        label="LTV"
                        value={formatCurrency(contact.metrics.ltvCents)}
                        icon={<IconChartLine size={12} />}
                        color="green"
                    />
                )}
                {contact.metrics.cacCents !== undefined && (
                    <MetricCard
                        label="CAC"
                        value={formatCurrency(contact.metrics.cacCents)}
                        icon={<IconCurrencyReal size={12} />}
                        color="orange"
                    />
                )}
                {ltvCacRatio && (
                    <MetricCard
                        label="LTV:CAC"
                        value={ltvCacRatio}
                        suffix="x"
                        icon={<IconChartLine size={12} />}
                        color={parseFloat(ltvCacRatio) >= 3 ? 'green' : 'yellow'}
                    />
                )}
                {contact.metrics.monthsActive !== undefined && (
                    <MetricCard
                        label="Meses Ativo"
                        value={contact.metrics.monthsActive}
                        icon={<IconClock size={12} />}
                        color="blue"
                    />
                )}
            </SimpleGrid>

            <Divider my="sm" />

            {/* Recent Ocurrences */}
            <Text size="sm" fw={600} mb="xs">Histórico</Text>
            <OcurrenceTimeline
                ocurrences={contact.ocurrences}
                maxItems={3}
                onAddOcurrence={onAddOcurrence}
            />
        </Card>
    );
}

// ----------------------------------------
// Lifecycle Kanban
// ----------------------------------------

export interface LifecycleKanbanProps {
    contacts: LifecycleContact[];
    onContactClick?: (contact: LifecycleContact) => void;
    onAddOcurrence?: (contact: LifecycleContact) => void;
    onAdvanceStage?: (contact: LifecycleContact) => void;
}

export function LifecycleKanban({
    contacts,
    onContactClick,
    onAddOcurrence,
    onAdvanceStage,
}: LifecycleKanbanProps) {
    const stages: LifecycleStage[] = ['lead', 'trial', 'student', 'alumnus'];

    const getStageContacts = (stage: LifecycleStage) =>
        contacts.filter(c => c.stage === stage);

    const getStageMetrics = (stage: LifecycleStage) => {
        const stageContacts = getStageContacts(stage);
        const totalLtv = stageContacts.reduce((sum, c) => sum + (c.metrics.ltvCents || 0), 0);
        const totalCac = stageContacts.reduce((sum, c) => sum + (c.metrics.cacCents || 0), 0);
        return {
            count: stageContacts.length,
            totalLtv,
            totalCac,
            avgLtvCac: totalCac > 0 ? (totalLtv / totalCac).toFixed(1) : null,
        };
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact',
        }).format(cents / 100);
    };

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {stages.map((stage) => {
                const config = STAGE_CONFIG[stage];
                const stageContacts = getStageContacts(stage);
                const metrics = getStageMetrics(stage);
                const StageIcon = config.icon;

                return (
                    <Paper key={stage} p="md" radius="md" withBorder>
                        {/* Column Header */}
                        <Group justify="space-between" mb="md">
                            <Group gap="xs">
                                <ThemeIcon size="md" variant="light" color={config.color}>
                                    <StageIcon size={16} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" fw={600}>{config.label}</Text>
                                    <Text size="xs" c="dimmed">{metrics.count} contatos</Text>
                                </div>
                            </Group>
                            {metrics.avgLtvCac && (
                                <Badge
                                    size="sm"
                                    color={parseFloat(metrics.avgLtvCac) >= 3 ? 'green' : 'yellow'}
                                >
                                    {metrics.avgLtvCac}x LTV:CAC
                                </Badge>
                            )}
                        </Group>

                        {/* Metrics Summary */}
                        {metrics.totalLtv > 0 && (
                            <Paper p="xs" mb="md" radius="sm" bg="var(--mantine-color-gray-light)">
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed">LTV Total</Text>
                                    <Text size="xs" fw={600} c="green">{formatCurrency(metrics.totalLtv)}</Text>
                                </Group>
                            </Paper>
                        )}

                        {/* Cards */}
                        <ScrollArea h={400} type="auto">
                            <Stack gap="xs">
                                {stageContacts.map((contact) => (
                                    <LifecycleCard
                                        key={contact.id}
                                        contact={contact}
                                        compact
                                        onView={() => onContactClick?.(contact)}
                                        onAddOcurrence={() => onAddOcurrence?.(contact)}
                                        onAdvanceStage={() => onAdvanceStage?.(contact)}
                                    />
                                ))}
                                {stageContacts.length === 0 && (
                                    <Text size="sm" c="dimmed" ta="center" py="xl">
                                        Nenhum contato
                                    </Text>
                                )}
                            </Stack>
                        </ScrollArea>
                    </Paper>
                );
            })}
        </SimpleGrid>
    );
}

// ----------------------------------------
// Add Ocurrence Modal
// ----------------------------------------

export interface AddOcurrenceModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (data: { type: OcurrenceType; title: string; description?: string }) => void;
    contactName?: string;
}

export function AddOcurrenceModal({ opened, onClose, onSubmit, contactName }: AddOcurrenceModalProps) {
    const [type, setType] = useState<OcurrenceType>('note');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit({ type, title, description: description || undefined });
        setType('note');
        setTitle('');
        setDescription('');
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`Nova Ocorrência${contactName ? ` - ${contactName}` : ''}`}
            size="md"
        >
            <Stack>
                <Select
                    label="Tipo"
                    data={Object.entries(OCURRENCE_CONFIG).map(([value, config]) => ({
                        value,
                        label: config.label,
                    }))}
                    value={type}
                    onChange={(v) => setType(v as OcurrenceType)}
                    required
                />
                <TextInput
                    label="Título"
                    placeholder="Resumo da ocorrência"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    required
                />
                <Textarea
                    label="Descrição"
                    placeholder="Detalhes adicionais..."
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value)}
                    rows={3}
                />
                <Group justify="flex-end">
                    <Button variant="subtle" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={!title.trim()}>
                        Adicionar
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}


export { STAGE_CONFIG, OCURRENCE_CONFIG };

export default LifecycleCard;

