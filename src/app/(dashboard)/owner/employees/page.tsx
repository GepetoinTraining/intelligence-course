'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Modal, Loader, Center, Table, Avatar, ActionIcon,
    Menu, ThemeIcon, Select, SimpleGrid, Tabs, NumberInput, Textarea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DateInput, TimeInput } from '@mantine/dates';
import {
    IconPlus, IconSearch, IconDots, IconEdit, IconTrash, IconCheck,
    IconUsers, IconBriefcase, IconClock, IconCalendar, IconFilter,
    IconUser, IconMail, IconPhone, IconShield
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

interface Staff {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    jobTitle: string;
    department: string;
    contractType: string;
    accessLevel: string;
    weeklyHours: number;
    status: 'active' | 'on_leave' | 'suspended' | 'terminated';
    startsAt: number;
}

const departmentConfig: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrativo', color: 'blue' },
    reception: { label: 'Recepção', color: 'cyan' },
    marketing: { label: 'Marketing', color: 'pink' },
    finance: { label: 'Financeiro', color: 'green' },
    maintenance: { label: 'Manutenção', color: 'orange' },
    it: { label: 'TI', color: 'violet' },
    management: { label: 'Gerência', color: 'indigo' },
    other: { label: 'Outros', color: 'gray' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'green' },
    on_leave: { label: 'Afastado', color: 'yellow' },
    suspended: { label: 'Suspenso', color: 'orange' },
    terminated: { label: 'Desligado', color: 'red' },
};

const accessLevelConfig: Record<string, { label: string; color: string }> = {
    basic: { label: 'Básico', color: 'gray' },
    standard: { label: 'Padrão', color: 'blue' },
    admin: { label: 'Admin', color: 'violet' },
    super_admin: { label: 'Super Admin', color: 'red' },
};

const contractTypeConfig: Record<string, string> = {
    clt: 'CLT',
    pj: 'PJ',
    freelance: 'Freelance',
    intern: 'Estagiário',
    volunteer: 'Voluntário',
};

const MOCK_STAFF: Staff[] = [];

const weekDays = [
    { key: 'mon', label: 'Seg' },
    { key: 'tue', label: 'Ter' },
    { key: 'wed', label: 'Qua' },
    { key: 'thu', label: 'Qui' },
    { key: 'fri', label: 'Sex' },
    { key: 'sat', label: 'Sáb' },
];

export default function OwnerEmployeesPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [scheduleModalOpened, { open: openScheduleModal, close: closeScheduleModal }] = useDisclosure(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        department: 'admin',
        contractType: 'clt',
        accessLevel: 'basic',
        weeklyHours: 44,
        salaryCents: 0,
        startsAt: null as Date | null,
    });
    const [scheduleData, setScheduleData] = useState<Record<string, { start: string; end: string }>>({
        mon: { start: '09:00', end: '18:00' },
        tue: { start: '09:00', end: '18:00' },
        wed: { start: '09:00', end: '18:00' },
        thu: { start: '09:00', end: '18:00' },
        fri: { start: '09:00', end: '18:00' },
        sat: { start: '', end: '' },
    });

    // Fetch staff on mount
    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/staff-contracts');
            const json = await res.json();
            if (json.data) {
                setStaff(json.data.map((contract: any) => ({
                    id: contract.id,
                    name: contract.name || 'Nome não definido',
                    email: contract.email || '',
                    phone: null,
                    avatarUrl: contract.avatarUrl,
                    jobTitle: contract.jobTitle,
                    department: contract.department,
                    contractType: contract.contractType,
                    accessLevel: contract.accessLevel,
                    weeklyHours: contract.weeklyHours,
                    status: contract.status,
                    startsAt: contract.startsAt,
                })));
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingStaff(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            jobTitle: '',
            department: 'admin',
            contractType: 'clt',
            accessLevel: 'basic',
            weeklyHours: 44,
            salaryCents: 0,
            startsAt: null,
        });
        openModal();
    };

    const handleOpenEdit = (staffMember: Staff) => {
        setEditingStaff(staffMember);
        setFormData({
            name: staffMember.name,
            email: staffMember.email,
            phone: staffMember.phone || '',
            jobTitle: staffMember.jobTitle,
            department: staffMember.department,
            contractType: staffMember.contractType,
            accessLevel: staffMember.accessLevel,
            weeklyHours: staffMember.weeklyHours,
            salaryCents: 0,
            startsAt: new Date(staffMember.startsAt),
        });
        openModal();
    };

    const handleOpenSchedule = (staffMember: Staff) => {
        setEditingStaff(staffMember);
        openScheduleModal();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                name: formData.name,
                email: formData.email,
                jobTitle: formData.jobTitle,
                department: formData.department,
                contractType: formData.contractType,
                accessLevel: formData.accessLevel,
                weeklyHours: formData.weeklyHours,
                salaryCents: formData.salaryCents,
                startsAt: formData.startsAt?.getTime() || Date.now(),
            };

            if (editingStaff) {
                // Update existing
                await fetch(`/api/staff-contracts/${editingStaff.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                // Create new
                await fetch('/api/staff-contracts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            await fetchStaff();
            closeModal();
        } catch (error) {
            console.error('Error saving staff:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSchedule = async () => {
        if (!editingStaff) return;
        try {
            setSaving(true);
            await fetch(`/api/staff-contracts/${editingStaff.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workSchedule: scheduleData }),
            });
            closeScheduleModal();
        } catch (error) {
            console.error('Error saving schedule:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleTerminate = async (id: string) => {
        try {
            await fetch(`/api/staff-contracts/${id}`, { method: 'DELETE' });
            await fetchStaff();
        } catch (error) {
            console.error('Error terminating staff:', error);
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('pt-BR');
    };

    const filteredStaff = staff.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            s.jobTitle.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || s.status === statusFilter;
        const matchesDepartment = !departmentFilter || s.department === departmentFilter;
        const matchesTab = activeTab === 'all' || s.department === activeTab;
        return matchesSearch && matchesStatus && matchesDepartment && matchesTab;
    });

    const stats = {
        total: staff.length,
        active: staff.filter(s => s.status === 'active').length,
        onLeave: staff.filter(s => s.status === 'on_leave').length,
        byDepartment: Object.entries(departmentConfig).map(([key, { label }]) => ({
            key,
            label,
            count: staff.filter(s => s.department === key && s.status === 'active').length,
        })).filter(d => d.count > 0),
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Funcionários</Title>
                    <Text c="dimmed">Gerencie a equipe administrativa e operacional</Text>
                </div>
                <Group>
                    <ExportButton
                        data={filteredStaff.map(s => ({
                            name: s.name,
                            email: s.email,
                            phone: s.phone || '-',
                            jobTitle: s.jobTitle,
                            department: departmentConfig[s.department]?.label || s.department,
                            contractType: contractTypeConfig[s.contractType] || s.contractType,
                            accessLevel: accessLevelConfig[s.accessLevel]?.label || s.accessLevel,
                            weeklyHours: s.weeklyHours,
                            status: statusConfig[s.status]?.label || s.status,
                            startsAt: new Date(s.startsAt).toLocaleDateString('pt-BR'),
                        }))}
                        columns={[
                            { key: 'name', label: 'Nome' },
                            { key: 'email', label: 'E-mail' },
                            { key: 'phone', label: 'Telefone' },
                            { key: 'jobTitle', label: 'Cargo' },
                            { key: 'department', label: 'Departamento' },
                            { key: 'contractType', label: 'Tipo Contrato' },
                            { key: 'accessLevel', label: 'Nível Acesso' },
                            { key: 'weeklyHours', label: 'Horas/Semana' },
                            { key: 'status', label: 'Status' },
                            { key: 'startsAt', label: 'Data Início' },
                        ]}
                        title="Funcionários"
                        filename="funcionarios"
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar"
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
                        Novo Funcionário
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={4} mb="lg">
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconUsers size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.total}</Text>
                            <Text size="xs" c="dimmed">Total</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconCheck size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.active}</Text>
                            <Text size="xs" c="dimmed">Ativos</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="yellow">
                            <IconCalendar size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.onLeave}</Text>
                            <Text size="xs" c="dimmed">Afastados</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group wrap="wrap" gap={4}>
                        {stats.byDepartment.slice(0, 3).map(d => (
                            <Badge key={d.key} size="sm" variant="light" color={departmentConfig[d.key]?.color || 'gray'}>
                                {d.label}: {d.count}
                            </Badge>
                        ))}
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Tabs by Department */}
            <Tabs value={activeTab} onChange={setActiveTab} mb="lg">
                <Tabs.List>
                    <Tabs.Tab value="all">Todos</Tabs.Tab>
                    {Object.entries(departmentConfig).map(([key, { label }]) => {
                        const count = staff.filter(s => s.department === key).length;
                        if (count === 0) return null;
                        return (
                            <Tabs.Tab key={key} value={key}>
                                {label} ({count})
                            </Tabs.Tab>
                        );
                    })}
                </Tabs.List>
            </Tabs>

            {/* Filters */}
            <Group mb="lg">
                <TextInput
                    placeholder="Buscar funcionário..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1 }}
                />
                <Select
                    placeholder="Departamento"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                    data={Object.entries(departmentConfig).map(([value, { label }]) => ({ value, label }))}
                    w={180}
                />
                <Select
                    placeholder="Status"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={statusFilter}
                    onChange={setStatusFilter}
                    data={Object.entries(statusConfig).map(([value, { label }]) => ({ value, label }))}
                    w={150}
                />
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : filteredStaff.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                        <IconUsers size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Nenhum funcionário encontrado</Title>
                    <Text c="dimmed" mb="lg">
                        {staff.length === 0
                            ? 'Cadastre o primeiro funcionário'
                            : 'Tente ajustar os filtros'}
                    </Text>
                </Card>
            ) : (
                <Card withBorder p={0}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Funcionário</Table.Th>
                                <Table.Th>Cargo</Table.Th>
                                <Table.Th>Departamento</Table.Th>
                                <Table.Th>Contrato</Table.Th>
                                <Table.Th>Acesso</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredStaff.map((staffMember) => {
                                const department = departmentConfig[staffMember.department] || departmentConfig.other;
                                const status = statusConfig[staffMember.status];
                                const access = accessLevelConfig[staffMember.accessLevel] || accessLevelConfig.basic;
                                return (
                                    <Table.Tr key={staffMember.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar
                                                    size={32}
                                                    radius="xl"
                                                    src={staffMember.avatarUrl}
                                                    color="violet"
                                                >
                                                    {staffMember.name.charAt(0)}
                                                </Avatar>
                                                <div>
                                                    <Text fw={500} size="sm">{staffMember.name}</Text>
                                                    <Text size="xs" c="dimmed">{staffMember.email}</Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{staffMember.jobTitle}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={department.color} variant="light" size="sm">
                                                {department.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{contractTypeConfig[staffMember.contractType] || staffMember.contractType}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={access.color} variant="outline" size="sm">
                                                <Group gap={4}>
                                                    <IconShield size={10} />
                                                    {access.label}
                                                </Group>
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={status.color}>{status.label}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle">
                                                        <IconDots size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => handleOpenEdit(staffMember)}
                                                    >
                                                        Editar
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconClock size={14} />}
                                                        onClick={() => handleOpenSchedule(staffMember)}
                                                    >
                                                        Horários
                                                    </Menu.Item>
                                                    <Menu.Item leftSection={<IconShield size={14} />}>
                                                        Permissões
                                                    </Menu.Item>
                                                    <Menu.Divider />
                                                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleTerminate(staffMember.id)}>
                                                        Desligar
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                opened={modalOpened}
                onClose={closeModal}
                title={editingStaff ? 'Editar Funcionário' : 'Novo Funcionário'}
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome Completo"
                        placeholder="Nome do funcionário"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Group grow>
                        <TextInput
                            label="Email"
                            placeholder="email@escola.com"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <TextInput
                            label="Telefone"
                            placeholder="(11) 99999-9999"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </Group>
                    <Group grow>
                        <TextInput
                            label="Cargo"
                            placeholder="Ex: Recepcionista"
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            required
                        />
                        <Select
                            label="Departamento"
                            data={Object.entries(departmentConfig).map(([value, { label }]) => ({ value, label }))}
                            value={formData.department}
                            onChange={(v) => setFormData({ ...formData, department: v || 'admin' })}
                            required
                        />
                    </Group>
                    <Group grow>
                        <Select
                            label="Tipo de Contrato"
                            data={Object.entries(contractTypeConfig).map(([value, label]) => ({ value, label }))}
                            value={formData.contractType}
                            onChange={(v) => setFormData({ ...formData, contractType: v || 'clt' })}
                            required
                        />
                        <Select
                            label="Nível de Acesso"
                            data={Object.entries(accessLevelConfig).map(([value, { label }]) => ({ value, label }))}
                            value={formData.accessLevel}
                            onChange={(v) => setFormData({ ...formData, accessLevel: v || 'basic' })}
                            required
                        />
                    </Group>
                    <Group grow>
                        <NumberInput
                            label="Horas Semanais"
                            placeholder="44"
                            value={formData.weeklyHours}
                            onChange={(v) => setFormData({ ...formData, weeklyHours: Number(v) || 44 })}
                            min={0}
                            max={60}
                        />
                        <NumberInput
                            label="Salário (R$)"
                            placeholder="0,00"
                            value={formData.salaryCents / 100}
                            onChange={(v) => setFormData({ ...formData, salaryCents: (Number(v) || 0) * 100 })}
                            decimalScale={2}
                            fixedDecimalScale
                        />
                    </Group>
                    <DateInput
                        label="Data de Início"
                        placeholder="Selecione a data"
                        value={formData.startsAt}
                        onChange={(v) => setFormData({ ...formData, startsAt: v ? (typeof v === 'string' ? new Date(v) : v) : null })}
                        required
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave}>
                            {editingStaff ? 'Salvar' : 'Criar Funcionário'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Schedule Modal */}
            <Modal
                opened={scheduleModalOpened}
                onClose={closeScheduleModal}
                title={`Horários - ${editingStaff?.name || ''}`}
                size="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">Configure os horários de trabalho para cada dia da semana.</Text>
                    {weekDays.map(day => (
                        <Group key={day.key} grow>
                            <Text size="sm" fw={500} w={50}>{day.label}</Text>
                            <TextInput
                                placeholder="09:00"
                                value={scheduleData[day.key]?.start || ''}
                                onChange={(e) => setScheduleData({
                                    ...scheduleData,
                                    [day.key]: { ...scheduleData[day.key], start: e.target.value }
                                })}
                                size="sm"
                            />
                            <Text size="sm" c="dimmed">até</Text>
                            <TextInput
                                placeholder="18:00"
                                value={scheduleData[day.key]?.end || ''}
                                onChange={(e) => setScheduleData({
                                    ...scheduleData,
                                    [day.key]: { ...scheduleData[day.key], end: e.target.value }
                                })}
                                size="sm"
                            />
                        </Group>
                    ))}
                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeScheduleModal}>Cancelar</Button>
                        <Button onClick={handleSaveSchedule}>Salvar Horários</Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

