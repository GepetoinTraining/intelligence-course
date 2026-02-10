'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Table, Modal, TextInput, Select,
    Grid, Avatar, Tabs, Switch
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconUser,
    IconArrowsExchange, IconLogout, IconCheck, IconClock, IconAlertCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import type { SelectOption } from '@/types/domain';

// ============================================================================
// TYPES
// ============================================================================

interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    status: 'active' | 'transferred' | 'dropped' | 'completed' | 'waitlist';
    enrolledAt: string;
    droppedAt?: string;
    notes?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function EnrollmentManagementPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [classOptions, setClassOptions] = useState<SelectOption[]>([]);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('active');

    const [transferModal, { open: openTransferModal, close: closeTransferModal }] = useDisclosure(false);
    const [dropModal, { open: openDropModal, close: closeDropModal }] = useDisclosure(false);
    const [newModal, { open: openNewModal, close: closeNewModal }] = useDisclosure(false);

    const [targetClass, setTargetClass] = useState<string | null>(null);
    const [dropReason, setDropReason] = useState('');

    const fetchEnrollments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/enrollments');
            if (!res.ok) return;
            const json = await res.json();
            const rows = json.data || [];
            setEnrollments(rows.map((r: any) => ({
                id: r.id,
                studentId: r.studentId || '',
                studentName: r.studentName || 'Aluno',
                classId: r.classId || '',
                className: r.className || 'Turma',
                status: r.status || 'active',
                enrolledAt: r.enrolledAt ? new Date(r.enrolledAt * 1000).toISOString().split('T')[0] : '',
                droppedAt: r.droppedAt ? new Date(r.droppedAt * 1000).toISOString().split('T')[0] : undefined,
                notes: r.notes || '',
            })));
        } catch (err) {
            console.error('Failed to fetch enrollments', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEnrollments();
        fetch('/api/classes').then(r => r.json()).then(j => {
            setClassOptions((j.data || []).map((c: any) => ({ value: c.id, label: c.name || c.id })));
        }).catch(() => { });
    }, [fetchEnrollments]);

    const handleTransfer = (enrollment: Enrollment) => {
        setSelectedEnrollment(enrollment);
        setTargetClass(null);
        openTransferModal();
    };

    const handleDrop = (enrollment: Enrollment) => {
        setSelectedEnrollment(enrollment);
        setDropReason('');
        openDropModal();
    };

    const confirmTransfer = async () => {
        if (!selectedEnrollment || !targetClass) return;
        try {
            await fetch(`/api/enrollments/${selectedEnrollment.id}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetClassId: targetClass }),
            });
            fetchEnrollments();
        } catch (err) {
            console.error('Failed to transfer enrollment', err);
        }
        closeTransferModal();
    };

    const confirmDrop = async () => {
        if (!selectedEnrollment) return;
        try {
            await fetch(`/api/enrollments/${selectedEnrollment.id}/drop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: dropReason }),
            });
            fetchEnrollments();
        } catch (err) {
            console.error('Failed to drop enrollment', err);
        }
        closeDropModal();
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
            active: { color: 'green', label: 'Ativo', icon: <IconCheck size={14} /> },
            waitlist: { color: 'blue', label: 'Lista de Espera', icon: <IconClock size={14} /> },
            transferred: { color: 'violet', label: 'Transferido', icon: <IconArrowsExchange size={14} /> },
            dropped: { color: 'red', label: 'Cancelado', icon: <IconLogout size={14} /> },
            completed: { color: 'gray', label: 'Concluído', icon: <IconCheck size={14} /> },
        };
        return map[status] || map.active;
    };

    const filteredEnrollments = activeTab === 'all'
        ? enrollments
        : enrollments.filter(e => e.status === activeTab);

    const activeCount = enrollments.filter(e => e.status === 'active').length;
    const waitlistCount = enrollments.filter(e => e.status === 'waitlist').length;

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
                        <Title order={2}>Gestão de Matrículas 📝</Title>
                        <Text c="dimmed">Matrículas, transferências e cancelamentos</Text>
                    </div>
                </Group>
                <Button leftSection={<IconPlus size={16} />} onClick={openNewModal}>
                    Nova Matrícula
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{enrollments.length}</Text>
                            <Text size="sm" c="dimmed">Total</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconUser size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">{activeCount}</Text>
                            <Text size="sm" c="dimmed">Ativos</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconCheck size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="blue">{waitlistCount}</Text>
                            <Text size="sm" c="dimmed">Lista Espera</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconClock size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="red">{enrollments.filter(e => e.status === 'dropped').length}</Text>
                            <Text size="sm" c="dimmed">Cancelados</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="red">
                            <IconLogout size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="active" leftSection={<IconCheck size={14} />}>
                        Ativos ({activeCount})
                    </Tabs.Tab>
                    <Tabs.Tab value="waitlist" leftSection={<IconClock size={14} />}>
                        Lista de Espera ({waitlistCount})
                    </Tabs.Tab>
                    <Tabs.Tab value="transferred" leftSection={<IconArrowsExchange size={14} />}>
                        Transferidos
                    </Tabs.Tab>
                    <Tabs.Tab value="dropped" leftSection={<IconLogout size={14} />}>
                        Cancelados
                    </Tabs.Tab>
                    <Tabs.Tab value="all">Todos</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Enrollment Table */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Aluno</Table.Th>
                            <Table.Th>Turma</Table.Th>
                            <Table.Th ta="center">Status</Table.Th>
                            <Table.Th>Matriculado em</Table.Th>
                            <Table.Th>Observações</Table.Th>
                            <Table.Th ta="center">Ações</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredEnrollments.map(enrollment => {
                            const statusInfo = getStatusInfo(enrollment.status);

                            return (
                                <Table.Tr key={enrollment.id}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size="sm" radius="xl" color="blue">
                                                {enrollment.studentName.charAt(0)}
                                            </Avatar>
                                            <Text size="sm" fw={500}>{enrollment.studentName}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{enrollment.className}</Text>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Badge color={statusInfo.color} variant="light" leftSection={statusInfo.icon}>
                                            {statusInfo.label}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed" lineClamp={1}>{enrollment.notes || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        {enrollment.status === 'active' && (
                                            <Group gap={4} justify="center">
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    color="violet"
                                                    leftSection={<IconArrowsExchange size={14} />}
                                                    onClick={() => handleTransfer(enrollment)}
                                                >
                                                    Transferir
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    color="red"
                                                    leftSection={<IconLogout size={14} />}
                                                    onClick={() => handleDrop(enrollment)}
                                                >
                                                    Cancelar
                                                </Button>
                                            </Group>
                                        )}
                                        {enrollment.status === 'waitlist' && (
                                            <Button size="xs" variant="light" color="green">
                                                Matricular
                                            </Button>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Transfer Modal */}
            <Modal
                opened={transferModal}
                onClose={closeTransferModal}
                title="Transferir Aluno"
                centered
            >
                <Stack gap="md">
                    <Paper p="md" bg="gray.0" radius="md">
                        <Text size="sm" c="dimmed">Aluno</Text>
                        <Text fw={500}>{selectedEnrollment?.studentName}</Text>
                        <Text size="sm" c="dimmed" mt="xs">Turma Atual</Text>
                        <Text>{selectedEnrollment?.className}</Text>
                    </Paper>

                    <Select
                        label="Transferir para"
                        placeholder="Selecione a turma de destino"
                        data={classOptions.filter(c => c.value !== selectedEnrollment?.classId)}
                        value={targetClass}
                        onChange={setTargetClass}
                        required
                    />

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeTransferModal}>Cancelar</Button>
                        <Button color="violet" onClick={confirmTransfer} disabled={!targetClass}>
                            Confirmar Transferência
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Drop Modal */}
            <Modal
                opened={dropModal}
                onClose={closeDropModal}
                title="Cancelar Matrícula"
                centered
            >
                <Stack gap="md">
                    <Paper p="md" bg="red.0" radius="md">
                        <Group gap="xs" mb="xs">
                            <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
                            <Text size="sm" fw={500} c="red">Atenção</Text>
                        </Group>
                        <Text size="sm">
                            Você está prestes a cancelar a matrícula de <strong>{selectedEnrollment?.studentName}</strong>
                            na turma <strong>{selectedEnrollment?.className}</strong>.
                        </Text>
                    </Paper>

                    <TextInput
                        label="Motivo do cancelamento"
                        placeholder="Ex: Motivo pessoal, mudança de cidade..."
                        value={dropReason}
                        onChange={(e) => setDropReason(e.target.value)}
                    />

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeDropModal}>Voltar</Button>
                        <Button color="red" onClick={confirmDrop}>
                            Confirmar Cancelamento
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* New Enrollment Modal */}
            <Modal
                opened={newModal}
                onClose={closeNewModal}
                title="Nova Matrícula"
                centered
            >
                <Stack gap="md">
                    <TextInput label="Nome do Aluno" placeholder="Buscar aluno..." required />
                    <Select
                        label="Turma"
                        placeholder="Selecione..."
                        data={classOptions}
                        required
                    />
                    <DateInput
                        label="Data da Matrícula"
                        placeholder="Selecione..."
                        defaultValue={new Date()}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeNewModal}>Cancelar</Button>
                        <Button onClick={closeNewModal}>Matricular</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

