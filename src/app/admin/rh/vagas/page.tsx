'use client';

import { useState, useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon, Button,
    Table, Loader, Alert, Center, Select, Progress, Tooltip, Modal,
    TextInput, Textarea, Paper,
} from '@mantine/core';
import {
    IconBriefcase, IconPlus, IconAlertCircle, IconRefresh,
    IconUsers, IconSearch, IconArrowRight, IconCheck,
    IconUser, IconMail, IconPhone,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface TalentCandidate {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    desiredRole: string | null;
    source: string | null;
    status: string;
    evaluationScore: number | null;
    skills: string | null; // JSON array
    createdAt: number | null;
}

interface JobOpening {
    id: string;
    title: string;
    description: string | null;
    company: string;
    postedAt: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PIPELINE_STAGES: Record<string, { label: string; color: string; order: number }> = {
    new: { label: 'Novo', color: 'gray', order: 0 },
    screening: { label: 'Triagem', color: 'blue', order: 1 },
    interviewing: { label: 'Entrevista', color: 'violet', order: 2 },
    offer: { label: 'Proposta', color: 'orange', order: 3 },
    hired: { label: 'Contratado', color: 'green', order: 4 },
    rejected: { label: 'Rejeitado', color: 'red', order: 5 },
    withdrawn: { label: 'Desistiu', color: 'gray', order: 6 },
    on_hold: { label: 'Em Espera', color: 'yellow', order: 7 },
};

const SOURCE_LABELS: Record<string, string> = {
    job_board: 'Portal de Vagas', referral: 'Indicação', direct: 'Espontâneo',
    linkedin: 'LinkedIn', agency: 'Agência', internal: 'Interno', other: 'Outro',
};

function fmtDate(ts: number | null): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

function parseSkills(json: string | null): string[] {
    try { return json ? JSON.parse(json) : []; } catch { return []; }
}

// ============================================================================
// PAGE
// ============================================================================

export default function VagasPage() {
    const { data: talentData, isLoading: loadT, error: errT, refetch: refetchT } = useApi<TalentCandidate[]>('/api/talent');
    const { data: careersData, isLoading: loadC, error: errC, refetch: refetchC } = useApi<{ jobs: JobOpening[] }>('/api/careers');

    const [stageFilter, setStageFilter] = useState<string | null>(null);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    const isLoading = loadT || loadC;
    const error = errT || errC;
    const candidates = talentData || [];
    const jobs = careersData?.jobs || [];

    // Filtered candidates
    const filtered = useMemo(() => {
        return candidates.filter(c => {
            if (stageFilter && c.status !== stageFilter) return false;
            if (sourceFilter && c.source !== sourceFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                if (!c.name.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q) && !c.desiredRole?.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [candidates, stageFilter, sourceFilter, search]);

    // Pipeline stats (kanban counts)
    const pipeline = useMemo(() => {
        const counts: Record<string, number> = {};
        const activeStages = ['new', 'screening', 'interviewing', 'offer', 'hired'];
        activeStages.forEach(s => counts[s] = 0);
        candidates.forEach(c => {
            if (counts[c.status] !== undefined) counts[c.status]++;
        });
        const total = activeStages.reduce((s, k) => s + counts[k], 0);
        return { counts, total, activeStages };
    }, [candidates]);

    // Stats
    const stats = useMemo(() => {
        return {
            totalCandidates: candidates.length,
            openVacancies: jobs.length,
            inPipeline: candidates.filter(c => ['new', 'screening', 'interviewing', 'offer'].includes(c.status)).length,
            hired: candidates.filter(c => c.status === 'hired').length,
            avgScore: candidates.filter(c => c.evaluationScore).length > 0
                ? Math.round(candidates.filter(c => c.evaluationScore).reduce((s, c) => s + (c.evaluationScore || 0), 0) / candidates.filter(c => c.evaluationScore).length)
                : 0,
            conversionRate: candidates.length > 0
                ? Math.round((candidates.filter(c => c.status === 'hired').length / candidates.length) * 100)
                : 0,
        };
    }, [candidates, jobs]);

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
            {error}
            <Button size="xs" variant="light" ml="md" onClick={() => { refetchT(); refetchC(); }}>
                Tentar novamente
            </Button>
        </Alert>
    );

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">RH — Talentos</Text>
                    <Title order={2}>Vagas e Recrutamento</Title>
                    <Text size="xs" c="dimmed" mt={2}>
                        Pipeline de candidatos • Gestão de vagas • Talent Pool
                    </Text>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconRefresh size={16} />}
                        onClick={() => { refetchT(); refetchC(); }}>Atualizar</Button>
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setShowCreate(true)}>
                        Nova Vaga
                    </Button>
                </Group>
            </Group>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg"><IconBriefcase size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Vagas Abertas</Text>
                            <Text fw={700} size="lg">{stats.openVacancies}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Candidatos</Text>
                    <Text fw={700} size="lg">{stats.totalCandidates}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">No Pipeline</Text>
                    <Text fw={700} size="lg" c="blue.7">{stats.inPipeline}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Contratados</Text>
                    <Text fw={700} size="lg" c="green.7">{stats.hired}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Score Médio</Text>
                    <Text fw={700} size="lg">{stats.avgScore}/100</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Taxa Conversão</Text>
                    <Text fw={700} size="lg">{stats.conversionRate}%</Text>
                </Card>
            </SimpleGrid>

            {/* Pipeline Kanban */}
            <Card withBorder p="md">
                <Text fw={600} mb="md">Pipeline de Recrutamento</Text>
                <SimpleGrid cols={{ base: 2, sm: 5 }}>
                    {pipeline.activeStages.map(stage => {
                        const cfg = PIPELINE_STAGES[stage];
                        const count = pipeline.counts[stage];
                        const pct = pipeline.total > 0 ? (count / pipeline.total) * 100 : 0;
                        return (
                            <Paper key={stage} withBorder p="md" radius="md"
                                style={{ cursor: 'pointer', borderLeft: `3px solid var(--mantine-color-${cfg.color}-6)` }}
                                onClick={() => setStageFilter(stageFilter === stage ? null : stage)}
                            >
                                <Group justify="space-between" mb="xs">
                                    <Badge variant="light" size="sm" color={cfg.color}>{cfg.label}</Badge>
                                    <Text fw={700} size="lg">{count}</Text>
                                </Group>
                                <Progress value={pct} color={cfg.color} size="xs" />
                            </Paper>
                        );
                    })}
                </SimpleGrid>
            </Card>

            {/* Open Vacancies */}
            {jobs.length > 0 && (
                <Card withBorder p="md">
                    <Text fw={600} mb="md">Vagas Publicadas ({jobs.length})</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                        {jobs.map(job => (
                            <Card key={job.id} withBorder p="sm">
                                <Text fw={500} size="sm">{job.title}</Text>
                                {job.description && (
                                    <Text size="xs" c="dimmed" lineClamp={2} mt={4}>{job.description}</Text>
                                )}
                                <Group justify="space-between" mt="xs">
                                    <Badge variant="light" size="xs">{job.company}</Badge>
                                    <Text size="xs" c="dimmed">{fmtDate(job.postedAt)}</Text>
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Card>
            )}

            {/* Filters */}
            <Group>
                <TextInput
                    placeholder="Buscar candidato..." size="sm" w={250}
                    leftSection={<IconSearch size={14} />}
                    value={search} onChange={e => setSearch(e.target.value)}
                />
                <Select
                    placeholder="Etapa" clearable size="sm" w={160}
                    data={Object.entries(PIPELINE_STAGES).map(([v, c]) => ({ value: v, label: c.label }))}
                    value={stageFilter} onChange={setStageFilter}
                />
                <Select
                    placeholder="Origem" clearable size="sm" w={160}
                    data={Object.entries(SOURCE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                    value={sourceFilter} onChange={setSourceFilter}
                />
            </Group>

            {/* Candidates Table */}
            <Card withBorder p="md">
                <Text fw={600} mb="md">Candidatos ({filtered.length})</Text>
                {filtered.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Contato</Table.Th>
                                <Table.Th>Vaga Desejada</Table.Th>
                                <Table.Th>Origem</Table.Th>
                                <Table.Th>Score</Table.Th>
                                <Table.Th>Skills</Table.Th>
                                <Table.Th>Etapa</Table.Th>
                                <Table.Th>Data</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map(c => {
                                const stage = PIPELINE_STAGES[c.status] || { label: c.status, color: 'gray' };
                                const skills = parseSkills(c.skills);
                                return (
                                    <Table.Tr key={c.id}>
                                        <Table.Td>
                                            <Text fw={500} size="sm">{c.name}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={2}>
                                                {c.email && <Text size="xs" c="dimmed">{c.email}</Text>}
                                                {c.phone && <Text size="xs" c="dimmed">{c.phone}</Text>}
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{c.desiredRole || '—'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="outline" size="xs">
                                                {SOURCE_LABELS[c.source || ''] || c.source || '—'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {c.evaluationScore ? (
                                                <Tooltip label={`${c.evaluationScore}/100`} withArrow>
                                                    <Progress
                                                        value={c.evaluationScore} size="sm" w={60}
                                                        color={c.evaluationScore >= 70 ? 'green' : c.evaluationScore >= 40 ? 'yellow' : 'red'}
                                                    />
                                                </Tooltip>
                                            ) : <Text size="xs" c="dimmed">—</Text>}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {skills.slice(0, 3).map((s, i) => (
                                                    <Badge key={i} size="xs" variant="light">{s}</Badge>
                                                ))}
                                                {skills.length > 3 && (
                                                    <Text size="xs" c="dimmed">+{skills.length - 3}</Text>
                                                )}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={stage.color} variant="light" size="sm">{stage.label}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">{fmtDate(c.createdAt)}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUsers size={48} color="gray" />
                            <Text c="dimmed">Nenhum candidato encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Create Vacancy Modal */}
            <Modal opened={showCreate} onClose={() => setShowCreate(false)} title="Nova Vaga" size="md">
                <Stack gap="md">
                    <TextInput label="Título da Vaga" placeholder="Ex: Professor de Matemática" />
                    <Textarea label="Descrição" placeholder="Requisitos, responsabilidades..." minRows={3} />
                    <SimpleGrid cols={2}>
                        <Select label="Departamento"
                            data={['Administrativo', 'Recepção', 'Marketing', 'Financeiro', 'TI', 'Gerência'].map(d => ({ value: d.toLowerCase(), label: d }))} />
                        <Select label="Tipo de Contrato"
                            data={[
                                { value: 'clt', label: 'CLT' },
                                { value: 'pj', label: 'PJ' },
                                { value: 'intern', label: 'Estágio' },
                                { value: 'freelance', label: 'Freelancer' },
                            ]} />
                    </SimpleGrid>
                    <SimpleGrid cols={2}>
                        <TextInput label="Faixa Salarial (Mín)" placeholder="R$ 2.000,00" />
                        <TextInput label="Faixa Salarial (Máx)" placeholder="R$ 4.000,00" />
                    </SimpleGrid>
                    <Button fullWidth>Publicar Vaga</Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
