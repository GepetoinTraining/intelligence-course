'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Table, Modal, TextInput, Select,
    Grid, Tabs
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconCalendar,
    IconCheck, IconClock, IconPlayerPlay, IconPlayerStop
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Term {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    enrollmentStart: string;
    enrollmentEnd: string;
    status: 'upcoming' | 'current' | 'past';
    classCount: number;
    studentCount: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TERMS: Term[] = [];

// ============================================================================
// COMPONENT
// ============================================================================

export default function TermManagementPage() {
    const [terms, setTerms] = useState<Term[]>(MOCK_TERMS);
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('current');

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);

    // Form state
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [enrollmentStart, setEnrollmentStart] = useState<Date | null>(null);
    const [enrollmentEnd, setEnrollmentEnd] = useState<Date | null>(null);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedTerm(null);
        setName('');
        setStartDate(null);
        setEndDate(null);
        setEnrollmentStart(null);
        setEnrollmentEnd(null);
        openModal();
    };

    const handleEdit = (term: Term) => {
        setIsCreating(false);
        setSelectedTerm(term);
        setName(term.name);
        setStartDate(new Date(term.startDate));
        setEndDate(new Date(term.endDate));
        setEnrollmentStart(new Date(term.enrollmentStart));
        setEnrollmentEnd(new Date(term.enrollmentEnd));
        openModal();
    };

    const handleSave = () => {
        if (isCreating && startDate && endDate && enrollmentStart && enrollmentEnd) {
            const newTerm: Term = {
                id: `term-${Date.now()}`,
                name,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                enrollmentStart: enrollmentStart.toISOString().split('T')[0],
                enrollmentEnd: enrollmentEnd.toISOString().split('T')[0],
                status: 'upcoming',
                classCount: 0,
                studentCount: 0,
            };
            setTerms(prev => [...prev, newTerm]);
        } else if (selectedTerm && startDate && endDate && enrollmentStart && enrollmentEnd) {
            setTerms(prev => prev.map(t =>
                t.id === selectedTerm.id
                    ? {
                        ...t,
                        name,
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0],
                        enrollmentStart: enrollmentStart.toISOString().split('T')[0],
                        enrollmentEnd: enrollmentEnd.toISOString().split('T')[0],
                    }
                    : t
            ));
        }
        closeModal();
    };

    const handleSetCurrent = (id: string) => {
        setTerms(prev => prev.map(t => ({
            ...t,
            status: t.id === id ? 'current' : (t.status === 'current' ? 'past' : t.status)
        })));
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
            current: { color: 'green', label: 'Em Andamento', icon: <IconPlayerPlay size={14} /> },
            upcoming: { color: 'blue', label: 'Próximo', icon: <IconClock size={14} /> },
            past: { color: 'gray', label: 'Encerrado', icon: <IconPlayerStop size={14} /> },
        };
        return map[status] || map.past;
    };

    const filteredTerms = terms.filter(t => t.status === activeTab);
    const currentTerm = terms.find(t => t.status === 'current');

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
                        <Title order={2}>Gestão de Períodos 📅</Title>
                        <Text c="dimmed">Configure semestres e períodos de matrícula</Text>
                    </div>
                </Group>
                <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
                    Novo Período
                </Button>
            </Group>

            {/* Current Term Highlight */}
            {currentTerm && (
                <Paper p="lg" bg="green.0" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-green-4)' }}>
                    <Group justify="space-between">
                        <div>
                            <Group gap="xs" mb="xs">
                                <ThemeIcon size="sm" variant="filled" color="green">
                                    <IconPlayerPlay size={14} />
                                </ThemeIcon>
                                <Text size="sm" fw={500} c="green">Período Atual</Text>
                            </Group>
                            <Text size="lg" fw={700}>{currentTerm.name}</Text>
                            <Text size="sm" c="dimmed">
                                {new Date(currentTerm.startDate).toLocaleDateString('pt-BR')} - {new Date(currentTerm.endDate).toLocaleDateString('pt-BR')}
                            </Text>
                        </div>
                        <Group gap="xl">
                            <div style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700}>{currentTerm.classCount}</Text>
                                <Text size="xs" c="dimmed">Turmas</Text>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700}>{currentTerm.studentCount}</Text>
                                <Text size="xs" c="dimmed">Alunos</Text>
                            </div>
                        </Group>
                    </Group>
                </Paper>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="current" leftSection={<IconPlayerPlay size={14} />}>
                        Atual
                    </Tabs.Tab>
                    <Tabs.Tab value="upcoming" leftSection={<IconClock size={14} />}>
                        Próximos
                    </Tabs.Tab>
                    <Tabs.Tab value="past" leftSection={<IconPlayerStop size={14} />}>
                        Anteriores
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Term Cards */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {filteredTerms.map(term => {
                    const statusInfo = getStatusInfo(term.status);

                    return (
                        <Card key={term.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={600}>{term.name}</Text>
                                        <Text size="sm" c="dimmed">
                                            {new Date(term.startDate).toLocaleDateString('pt-BR')} - {new Date(term.endDate).toLocaleDateString('pt-BR')}
                                        </Text>
                                    </div>
                                    <Badge color={statusInfo.color} variant="light" leftSection={statusInfo.icon}>
                                        {statusInfo.label}
                                    </Badge>
                                </Group>

                                <Grid>
                                    <Grid.Col span={6}>
                                        <Paper p="sm" bg="gray.0" radius="md">
                                            <Text size="xs" c="dimmed">Período de Matrícula</Text>
                                            <Text size="sm" fw={500}>
                                                {new Date(term.enrollmentStart).toLocaleDateString('pt-BR')} - {new Date(term.enrollmentEnd).toLocaleDateString('pt-BR')}
                                            </Text>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={3}>
                                        <Paper p="sm" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{term.classCount}</Text>
                                            <Text size="xs" c="dimmed">Turmas</Text>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={3}>
                                        <Paper p="sm" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{term.studentCount}</Text>
                                            <Text size="xs" c="dimmed">Alunos</Text>
                                        </Paper>
                                    </Grid.Col>
                                </Grid>

                                {/* Actions */}
                                <Group>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        leftSection={<IconEdit size={14} />}
                                        onClick={() => handleEdit(term)}
                                        flex={1}
                                    >
                                        Editar
                                    </Button>
                                    {term.status === 'upcoming' && (
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="green"
                                            leftSection={<IconCheck size={14} />}
                                            onClick={() => handleSetCurrent(term.id)}
                                        >
                                            Definir como Atual
                                        </Button>
                                    )}
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {filteredTerms.length === 0 && (
                <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                        <IconCalendar size={32} />
                    </ThemeIcon>
                    <Text fw={500}>Nenhum período encontrado</Text>
                    <Text size="sm" c="dimmed">
                        {activeTab === 'upcoming' ? 'Crie um novo período para o próximo semestre.' : 'Não há períodos anteriores.'}
                    </Text>
                </Paper>
            )}

            {/* Term Modal */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title={isCreating ? 'Novo Período' : 'Editar Período'}
                centered
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome do Período"
                        placeholder="Ex: 2026.1 - Primeiro Semestre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Grid>
                        <Grid.Col span={6}>
                            <DateInput
                                label="Data de Início"
                                placeholder="Selecione..."
                                value={startDate}
                                onChange={(value) => setStartDate(value as Date | null)}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <DateInput
                                label="Data de Término"
                                placeholder="Selecione..."
                                value={endDate}
                                onChange={(value) => setEndDate(value as Date | null)}
                                required
                            />
                        </Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}>
                            <DateInput
                                label="Início das Matrículas"
                                placeholder="Selecione..."
                                value={enrollmentStart}
                                onChange={(value) => setEnrollmentStart(value as Date | null)}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <DateInput
                                label="Fim das Matrículas"
                                placeholder="Selecione..."
                                value={enrollmentEnd}
                                onChange={(value) => setEnrollmentEnd(value as Date | null)}
                                required
                            />
                        </Grid.Col>
                    </Grid>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave}>
                            {isCreating ? 'Criar' : 'Salvar'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

