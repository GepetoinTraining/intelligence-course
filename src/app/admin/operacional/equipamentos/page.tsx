'use client';

import { useState } from 'react';
import {
    Card, Title, Text, Group, Badge, Table, Button, SimpleGrid,
    ThemeIcon, Tabs, Select, Loader, Alert, Center, Stack, Modal,
    TextInput, Textarea, NumberInput, Divider, ActionIcon, Menu,
    TagsInput, Switch, JsonInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconDeviceDesktop, IconPlus, IconSpeakerphone, IconAlertCircle,
    IconTools, IconCheck, IconX, IconClock, IconMapPin,
    IconCalendar, IconDotsVertical, IconCamera, IconMusic,
    IconBallFootball, IconFlask, IconPrinter, IconSchool,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Equipment {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    imageUrl: string | null;
    category: string;
    subcategory: string | null;
    brand: string | null;
    model: string | null;
    capabilities: string[];
    rules: Record<string, any>;
    defaultLocation: string | null;
    isPortable: boolean;
    quantity: number;
    condition: string;
    status: string;
    createdAt: number;
}

interface Booking {
    id: string;
    equipmentId: string;
    equipmentName: string;
    equipmentCategory: string;
    requestedBy: string;
    startTime: number;
    endTime: number;
    purpose: string | null;
    status: string;
    notes: string | null;
    createdAt: number;
}

// ============================================================================
// CONFIG
// ============================================================================

const CATEGORIES = [
    { value: 'hardware', label: '💻 Hardware', icon: IconDeviceDesktop, color: 'blue' },
    { value: 'multimedia', label: '📽️ Multimídia', icon: IconSpeakerphone, color: 'violet' },
    { value: 'furniture', label: '🪑 Mobiliário', icon: IconSchool, color: 'orange' },
    { value: 'sports', label: '⚽ Esportes', icon: IconBallFootball, color: 'green' },
    { value: 'lab', label: '🔬 Laboratório', icon: IconFlask, color: 'teal' },
    { value: 'office', label: '🖨️ Escritório', icon: IconPrinter, color: 'gray' },
    { value: 'musical', label: '🎵 Musical', icon: IconMusic, color: 'grape' },
    { value: 'educational', label: '📚 Educacional', icon: IconSchool, color: 'cyan' },
];

const CONDITIONS = [
    { value: 'excellent', label: 'Excelente', color: 'green' },
    { value: 'good', label: 'Bom', color: 'blue' },
    { value: 'fair', label: 'Regular', color: 'yellow' },
    { value: 'needs_repair', label: 'Precisa Reparo', color: 'orange' },
    { value: 'broken', label: 'Quebrado', color: 'red' },
];

const STATUS_COLORS: Record<string, string> = {
    available: 'green', in_use: 'blue', maintenance: 'yellow', retired: 'gray', lost: 'red',
};
const STATUS_LABELS: Record<string, string> = {
    available: 'Disponível', in_use: 'Em Uso', maintenance: 'Manutenção', retired: 'Aposentado', lost: 'Perdido',
};

const BOOKING_STATUS: Record<string, { color: string; label: string }> = {
    pending: { color: 'yellow', label: 'Pendente' },
    approved: { color: 'green', label: 'Aprovada' },
    in_use: { color: 'blue', label: 'Em Uso' },
    returned: { color: 'gray', label: 'Devolvido' },
    cancelled: { color: 'red', label: 'Cancelada' },
    overdue: { color: 'orange', label: 'Atrasada' },
};

const CAPABILITY_SUGGESTIONS = [
    'hdmi', 'bluetooth', 'wifi', 'usb-c', 'usb-a', 'vga', 'aux',
    '4k', '1080p', 'touch', 'batteries', 'rechargeable',
    'microphone', 'speaker', 'webcam', 'sd-card', 'nfc',
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function EquipamentosPage() {
    const { data: equipmentData, isLoading: loading, refetch } = useApi<any>('/api/equipment');
    const { data: bookingsData, refetch: refetchBookings } = useApi<any>('/api/equipment/bookings?status=pending');

    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formCode, setFormCode] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formCategory, setFormCategory] = useState<string | null>('hardware');
    const [formSubcategory, setFormSubcategory] = useState('');
    const [formBrand, setFormBrand] = useState('');
    const [formModel, setFormModel] = useState('');
    const [formCapabilities, setFormCapabilities] = useState<string[]>([]);
    const [formRules, setFormRules] = useState('{}');
    const [formLocation, setFormLocation] = useState('');
    const [formPortable, setFormPortable] = useState(true);
    const [formQuantity, setFormQuantity] = useState<number | ''>(1);
    const [formCondition, setFormCondition] = useState<string | null>('good');

    const equipment: Equipment[] = equipmentData?.data || [];
    const bookings: Booking[] = bookingsData?.data || [];

    const filteredEquipment = activeTab === 'all'
        ? equipment
        : equipment.filter(e => e.category === activeTab);

    const stats = {
        total: equipment.length,
        available: equipment.filter(e => e.status === 'available').length,
        inUse: equipment.filter(e => e.status === 'in_use').length,
        pendingBookings: bookings.length,
    };

    const saveEquipment = async () => {
        setSaving(true);
        try {
            let rulesObj = {};
            try { rulesObj = JSON.parse(formRules); } catch { /* ignore */ }

            await fetch('/api/equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    code: formCode || undefined,
                    description: formDescription || undefined,
                    category: formCategory,
                    subcategory: formSubcategory || undefined,
                    brand: formBrand || undefined,
                    model: formModel || undefined,
                    capabilities: formCapabilities,
                    rules: rulesObj,
                    defaultLocation: formLocation || undefined,
                    isPortable: formPortable,
                    quantity: formQuantity || 1,
                    condition: formCondition || 'good',
                }),
            });
            refetch();
            setFormName(''); setFormCode(''); setFormDescription('');
            setFormSubcategory(''); setFormBrand(''); setFormModel('');
            setFormCapabilities([]); setFormRules('{}'); setFormLocation('');
            closeCreate();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const approveBooking = async (bookingId: string) => {
        await fetch('/api/equipment/bookings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, status: 'approved' }),
        });
        refetchBookings();
    };

    const cancelBooking = async (bookingId: string) => {
        await fetch('/api/equipment/bookings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, status: 'cancelled' }),
        });
        refetchBookings();
    };

    if (loading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Operacional</Text>
                    <Title order={2}>Equipamentos & Recursos</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                        Hardware, multimídia e materiais da escola — com reserva para professores
                    </Text>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                    Novo Equipamento
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconDeviceDesktop size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Disponíveis</Text>
                            <Text fw={700} size="lg">{stats.available}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Uso</Text>
                            <Text fw={700} size="lg">{stats.inUse}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Reservas Pendentes</Text>
                            <Text fw={700} size="lg">{stats.pendingBookings}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Equipment Tabs by Category */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todos</Tabs.Tab>
                    {CATEGORIES.map(cat => (
                        <Tabs.Tab key={cat.value} value={cat.value}>
                            {cat.label}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>

                <Tabs.Panel value={activeTab || 'all'} pt="lg">
                    {filteredEquipment.length > 0 ? (
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                            {filteredEquipment.map((eq) => {
                                const catInfo = CATEGORIES.find(c => c.value === eq.category);
                                const condInfo = CONDITIONS.find(c => c.value === eq.condition);
                                return (
                                    <Card key={eq.id} withBorder p="lg">
                                        <Group justify="space-between" mb="xs">
                                            <Group gap="xs">
                                                <ThemeIcon variant="light" color={catInfo?.color || 'gray'} size="md">
                                                    {catInfo ? <catInfo.icon size={16} /> : <IconTools size={16} />}
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={600} size="sm">{eq.name}</Text>
                                                    {eq.code && <Text size="xs" c="dimmed">#{eq.code}</Text>}
                                                </div>
                                            </Group>
                                            <Badge color={STATUS_COLORS[eq.status] || 'gray'} size="sm">
                                                {STATUS_LABELS[eq.status] || eq.status}
                                            </Badge>
                                        </Group>

                                        {eq.description && (
                                            <Text size="xs" c="dimmed" lineClamp={2} mb="xs">{eq.description}</Text>
                                        )}

                                        {/* Details */}
                                        <Stack gap={4}>
                                            {(eq.brand || eq.model) && (
                                                <Text size="xs">
                                                    {[eq.brand, eq.model].filter(Boolean).join(' ')}
                                                </Text>
                                            )}
                                            {eq.subcategory && (
                                                <Badge variant="outline" size="xs">{eq.subcategory}</Badge>
                                            )}
                                        </Stack>

                                        {/* Capabilities */}
                                        {eq.capabilities.length > 0 && (
                                            <Group gap={4} mt="xs">
                                                {eq.capabilities.map((cap: string) => (
                                                    <Badge key={cap} variant="light" size="xs" color="blue">
                                                        {cap}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        )}

                                        <Divider my="xs" />

                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <Badge variant="dot" color={condInfo?.color || 'gray'} size="xs">
                                                    {condInfo?.label || eq.condition}
                                                </Badge>
                                                {eq.quantity > 1 && (
                                                    <Text size="xs" c="dimmed">×{eq.quantity}</Text>
                                                )}
                                            </Group>
                                            {eq.defaultLocation && (
                                                <Group gap={4}>
                                                    <IconMapPin size={12} color="gray" />
                                                    <Text size="xs" c="dimmed">{eq.defaultLocation}</Text>
                                                </Group>
                                            )}
                                        </Group>

                                        {/* Rules summary */}
                                        {eq.rules && Object.keys(eq.rules).length > 0 && (
                                            <Alert variant="light" color="orange" p="xs" mt="xs">
                                                <Text size="xs">
                                                    {eq.rules.requiresTraining && '⚠️ Requer treinamento. '}
                                                    {eq.rules.fragile && '🔴 Frágil. '}
                                                    {eq.rules.maxBookingHours && `⏰ Máx ${eq.rules.maxBookingHours}h. `}
                                                    {eq.rules.notes && eq.rules.notes}
                                                </Text>
                                            </Alert>
                                        )}
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    ) : (
                        <Center py="xl">
                            <Stack align="center" gap="xs">
                                <IconTools size={48} color="gray" />
                                <Text c="dimmed">Nenhum equipamento nesta categoria</Text>
                                <Button size="xs" onClick={openCreate}>Adicionar equipamento</Button>
                            </Stack>
                        </Center>
                    )}
                </Tabs.Panel>
            </Tabs>

            {/* Pending Bookings */}
            {bookings.length > 0 && (
                <Card withBorder p="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Reservas Pendentes de Aprovação</Text>
                        <Badge color="yellow">{bookings.length} pendente(s)</Badge>
                    </Group>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Equipamento</Table.Th>
                                <Table.Th>Finalidade</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {bookings.map(b => (
                                <Table.Tr key={b.id}>
                                    <Table.Td>
                                        <Text fw={500} size="sm">{b.equipmentName}</Text>
                                        <Badge size="xs" variant="outline">{b.equipmentCategory}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{b.purpose || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs">
                                            {new Date(b.startTime * 1000).toLocaleDateString('pt-BR')}
                                            {' — '}
                                            {new Date(b.endTime * 1000).toLocaleDateString('pt-BR')}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon variant="light" color="green" size="sm"
                                                onClick={() => approveBooking(b.id)}>
                                                <IconCheck size={14} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="red" size="sm"
                                                onClick={() => cancelBooking(b.id)}>
                                                <IconX size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Create Equipment Modal */}
            <Modal opened={createOpened} onClose={closeCreate} title="Novo Equipamento" size="lg">
                <Stack gap="md">
                    <TextInput label="Nome" placeholder="Ex: Projetor Epson S41+"
                        value={formName} onChange={e => setFormName(e.target.value)} required />

                    <Group grow>
                        <TextInput label="Código / Patrimônio" placeholder="Ex: EQUIP-001"
                            value={formCode} onChange={e => setFormCode(e.target.value)} />
                        <Select label="Categoria" data={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                            value={formCategory} onChange={setFormCategory} />
                    </Group>

                    <Group grow>
                        <TextInput label="Subcategoria" placeholder="Ex: Projetor, Caixa de Som..."
                            value={formSubcategory} onChange={e => setFormSubcategory(e.target.value)} />
                        <Select label="Condição" data={CONDITIONS.map(c => ({ value: c.value, label: c.label }))}
                            value={formCondition} onChange={setFormCondition} />
                    </Group>

                    <Textarea label="Descrição" placeholder="Detalhes sobre o equipamento..."
                        value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />

                    <Divider label="Identificação" labelPosition="center" />

                    <Group grow>
                        <TextInput label="Marca" placeholder="Ex: Epson"
                            value={formBrand} onChange={e => setFormBrand(e.target.value)} />
                        <TextInput label="Modelo" placeholder="Ex: PowerLite S41+"
                            value={formModel} onChange={e => setFormModel(e.target.value)} />
                    </Group>

                    <Divider label="Capacidades & Regras" labelPosition="center" />

                    <TagsInput
                        label="Capacidades"
                        placeholder="Adicione: hdmi, bluetooth, wifi..."
                        data={CAPABILITY_SUGGESTIONS}
                        value={formCapabilities}
                        onChange={setFormCapabilities}
                    />

                    <JsonInput
                        label="Regras de Uso (JSON)"
                        placeholder='{"maxBookingHours": 4, "requiresTraining": false, "fragile": true, "notes": "Devolver ao armário 3"}'
                        value={formRules}
                        onChange={setFormRules}
                        formatOnBlur
                        autosize
                        minRows={3}
                        maxRows={6}
                    />

                    <Divider label="Localização" labelPosition="center" />

                    <Group grow>
                        <TextInput label="Localização Padrão" placeholder="Ex: Armário 3, Prateleira 2"
                            value={formLocation} onChange={e => setFormLocation(e.target.value)} />
                        <NumberInput label="Quantidade" value={formQuantity}
                            onChange={v => setFormQuantity(v as number)} min={1} max={100} />
                    </Group>

                    <Switch label="Equipamento portátil (pode ser levado para outra sala)"
                        checked={formPortable} onChange={e => setFormPortable(e.target.checked)} />

                    <Button onClick={saveEquipment} loading={saving} disabled={!formName}
                        size="md" fullWidth>
                        Cadastrar Equipamento
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
