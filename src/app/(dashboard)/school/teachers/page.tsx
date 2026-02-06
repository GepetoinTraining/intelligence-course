'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Table, Modal, TextInput, Select,
    NumberInput, Grid, Avatar, Tabs, Progress
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconUser, IconClock,
    IconCurrencyDollar, IconCalendar, IconBook, IconEye
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Teacher {
    id: string;
    name: string;
    email: string;
    phone: string;
    specializations: string[];
    contractType: 'clt' | 'pj' | 'freelancer';
    hourlyRate: number;
    hoursThisMonth: number;
    classCount: number;
    status: 'active' | 'on_leave' | 'inactive';
    joinedAt: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const CONTRACT_TYPES = [
    { value: 'clt', label: 'CLT' },
    { value: 'pj', label: 'PJ' },
    { value: 'freelancer', label: 'Freelancer' },
];

const SPECIALIZATIONS = [
    { value: 'ai_literacy', label: 'Alfabetização em IA' },
    { value: 'kids', label: 'Kids' },
    { value: 'teens', label: 'Teens' },
    { value: 'adults', label: 'Adultos' },
];

const MOCK_TEACHERS: Teacher[] = [
    { id: '1', name: 'Maria Silva', email: 'maria@escola.com', phone: '(11) 99999-1111', specializations: ['ai_literacy', 'adults'], contractType: 'clt', hourlyRate: 80, hoursThisMonth: 40, classCount: 3, status: 'active', joinedAt: '2024-03-01' },
    { id: '2', name: 'João Santos', email: 'joao@escola.com', phone: '(11) 99999-2222', specializations: ['ai_literacy', 'teens'], contractType: 'pj', hourlyRate: 100, hoursThisMonth: 32, classCount: 2, status: 'active', joinedAt: '2024-06-15' },
    { id: '3', name: 'Ana Costa', email: 'ana@escola.com', phone: '(11) 99999-3333', specializations: ['kids'], contractType: 'freelancer', hourlyRate: 70, hoursThisMonth: 16, classCount: 1, status: 'active', joinedAt: '2025-01-10' },
    { id: '4', name: 'Pedro Oliveira', email: 'pedro@escola.com', phone: '(11) 99999-4444', specializations: ['adults'], contractType: 'clt', hourlyRate: 85, hoursThisMonth: 0, classCount: 0, status: 'on_leave', joinedAt: '2023-08-01' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function TeacherManagementPage() {
    const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('active');

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [detailModal, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

    const handleViewDetails = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        openDetailModal();
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
            active: { color: 'green', label: 'Ativo' },
            on_leave: { color: 'orange', label: 'Afastado' },
            inactive: { color: 'gray', label: 'Inativo' },
        };
        return map[status] || map.active;
    };

    const getContractColor = (type: string) => {
        const map: Record<string, string> = {
            clt: 'blue',
            pj: 'violet',
            freelancer: 'orange',
        };
        return map[type] || 'gray';
    };

    const filteredTeachers = activeTab === 'all'
        ? teachers
        : teachers.filter(t => t.status === activeTab);

    const totalHours = teachers.reduce((acc, t) => acc + t.hoursThisMonth, 0);
    const totalPayroll = teachers.reduce((acc, t) => acc + (t.hoursThisMonth * t.hourlyRate), 0);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/school" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Gestão de Professores 👨‍🏫</Title>
                        <Text c="dimmed">Contratos, horas e pagamentos</Text>
                    </div>
                </Group>
                <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
                    Novo Professor
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{teachers.length}</Text>
                            <Text size="sm" c="dimmed">Professores</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconUser size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">{teachers.filter(t => t.status === 'active').length}</Text>
                            <Text size="sm" c="dimmed">Ativos</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconUser size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{totalHours}h</Text>
                            <Text size="sm" c="dimmed">Horas/Mês</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconClock size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>R$ {totalPayroll.toLocaleString('pt-BR')}</Text>
                            <Text size="sm" c="dimmed">Folha/Mês</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="orange">
                            <IconCurrencyDollar size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="active">Ativos ({teachers.filter(t => t.status === 'active').length})</Tabs.Tab>
                    <Tabs.Tab value="on_leave">Afastados ({teachers.filter(t => t.status === 'on_leave').length})</Tabs.Tab>
                    <Tabs.Tab value="all">Todos</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Teacher Cards */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {filteredTeachers.map(teacher => {
                    const statusInfo = getStatusInfo(teacher.status);
                    const monthlyPay = teacher.hoursThisMonth * teacher.hourlyRate;

                    return (
                        <Card key={teacher.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <Avatar size="lg" radius="xl" color="blue">
                                            {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </Avatar>
                                        <div>
                                            <Text fw={600}>{teacher.name}</Text>
                                            <Text size="sm" c="dimmed">{teacher.email}</Text>
                                        </div>
                                    </Group>
                                    <Stack gap={4} align="flex-end">
                                        <Badge color={statusInfo.color} variant="light">
                                            {statusInfo.label}
                                        </Badge>
                                        <Badge color={getContractColor(teacher.contractType)} variant="outline" size="xs">
                                            {CONTRACT_TYPES.find(c => c.value === teacher.contractType)?.label}
                                        </Badge>
                                    </Stack>
                                </Group>

                                {/* Specializations */}
                                <Group gap={4}>
                                    {teacher.specializations.map(s => (
                                        <Badge key={s} size="sm" variant="light">
                                            {SPECIALIZATIONS.find(sp => sp.value === s)?.label}
                                        </Badge>
                                    ))}
                                </Group>

                                {/* Stats */}
                                <Grid>
                                    <Grid.Col span={4}>
                                        <Paper p="sm" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{teacher.classCount}</Text>
                                            <Text size="xs" c="dimmed">Turmas</Text>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <Paper p="sm" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{teacher.hoursThisMonth}h</Text>
                                            <Text size="xs" c="dimmed">Este Mês</Text>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <Paper p="sm" bg="green.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700} c="green">R$ {monthlyPay.toLocaleString('pt-BR')}</Text>
                                            <Text size="xs" c="dimmed">A Pagar</Text>
                                        </Paper>
                                    </Grid.Col>
                                </Grid>

                                {/* Actions */}
                                <Group>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        leftSection={<IconEye size={14} />}
                                        onClick={() => handleViewDetails(teacher)}
                                        flex={1}
                                    >
                                        Ver Detalhes
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        color="violet"
                                        leftSection={<IconEdit size={14} />}
                                    >
                                        Editar
                                    </Button>
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {/* Teacher Detail Modal */}
            <Modal
                opened={detailModal}
                onClose={closeDetailModal}
                title={
                    <Group>
                        <Avatar size="md" radius="xl" color="blue">
                            {selectedTeacher?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </Avatar>
                        <div>
                            <Text fw={600}>{selectedTeacher?.name}</Text>
                            <Text size="sm" c="dimmed">Desde {selectedTeacher && new Date(selectedTeacher.joinedAt).toLocaleDateString('pt-BR')}</Text>
                        </div>
                    </Group>
                }
                centered
                size="lg"
            >
                {selectedTeacher && (
                    <Stack gap="lg">
                        {/* Contract Info */}
                        <Paper p="md" bg="gray.0" radius="md">
                            <Grid>
                                <Grid.Col span={6}>
                                    <Text size="sm" c="dimmed">Tipo de Contrato</Text>
                                    <Badge color={getContractColor(selectedTeacher.contractType)} variant="light" size="lg">
                                        {CONTRACT_TYPES.find(c => c.value === selectedTeacher.contractType)?.label}
                                    </Badge>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="sm" c="dimmed">Valor/Hora</Text>
                                    <Text size="lg" fw={700}>R$ {selectedTeacher.hourlyRate.toFixed(2)}</Text>
                                </Grid.Col>
                            </Grid>
                        </Paper>

                        {/* Contact Info */}
                        <Paper p="md" withBorder radius="md">
                            <Text size="sm" fw={500} mb="sm">Contato</Text>
                            <Stack gap="xs">
                                <Text size="sm">📧 {selectedTeacher.email}</Text>
                                <Text size="sm">📱 {selectedTeacher.phone}</Text>
                            </Stack>
                        </Paper>

                        {/* This Month Summary */}
                        <Paper p="md" bg="green.0" radius="md">
                            <Text size="sm" fw={500} mb="sm">Resumo do Mês</Text>
                            <Grid>
                                <Grid.Col span={4}>
                                    <Text size="sm" c="dimmed">Turmas</Text>
                                    <Text size="xl" fw={700}>{selectedTeacher.classCount}</Text>
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <Text size="sm" c="dimmed">Horas</Text>
                                    <Text size="xl" fw={700}>{selectedTeacher.hoursThisMonth}h</Text>
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <Text size="sm" c="dimmed">Total</Text>
                                    <Text size="xl" fw={700} c="green">
                                        R$ {(selectedTeacher.hoursThisMonth * selectedTeacher.hourlyRate).toLocaleString('pt-BR')}
                                    </Text>
                                </Grid.Col>
                            </Grid>
                        </Paper>

                        <Button fullWidth variant="light" onClick={closeDetailModal}>
                            Fechar
                        </Button>
                    </Stack>
                )}
            </Modal>

            {/* New Teacher Modal (simplified) */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title="Novo Professor"
                centered
            >
                <Stack gap="md">
                    <TextInput label="Nome Completo" placeholder="Ex: Maria Silva" required />
                    <TextInput label="Email" placeholder="email@escola.com" required />
                    <TextInput label="Telefone" placeholder="(11) 99999-9999" />
                    <Select
                        label="Tipo de Contrato"
                        placeholder="Selecione..."
                        data={CONTRACT_TYPES}
                        required
                    />
                    <NumberInput
                        label="Valor/Hora (R$)"
                        placeholder="80.00"
                        min={0}
                        decimalScale={2}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={closeModal}>Criar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

