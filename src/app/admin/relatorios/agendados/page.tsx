'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Paper, Button, Select,
    TextInput, Switch,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconCalendarEvent, IconPlus, IconTrash, IconClock,
    IconMail, IconFileSpreadsheet,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface ScheduledReport {
    id: string;
    name: string;
    reportType: string;
    frequency: string;
    format: string;
    recipients: string;
    isActive: boolean;
    nextRun: string;
    lastRun?: string;
}

const FREQ_LABELS: Record<string, string> = {
    daily: 'Diário', weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal',
};
const REPORT_TYPES = [
    { value: 'financial', label: 'Financeiro' },
    { value: 'pedagogical', label: 'Pedagógico' },
    { value: 'hr', label: 'RH' },
    { value: 'commercial', label: 'Comercial' },
    { value: 'payroll', label: 'Folha de Pagamento' },
];

export default function AgendadosPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/schedules?type=report');

    const [reports, setReports] = useState<ScheduledReport[]>([]);
    const [name, setName] = useState('');
    const [type, setType] = useState<string | null>(null);
    const [freq, setFreq] = useState<string | null>('monthly');
    const [recipients, setRecipients] = useState('');

    const stats = useMemo(() => ({
        total: reports.length,
        active: reports.filter(r => r.isActive).length,
    }), [reports]);

    const handleAdd = () => {
        if (!name.trim() || !type || !freq) return;
        const entry: ScheduledReport = {
            id: crypto.randomUUID(),
            name: name.trim(),
            reportType: type,
            frequency: freq,
            format: 'CSV',
            recipients: recipients.trim() || '—',
            isActive: true,
            nextRun: new Date(Date.now() + 7 * 86400000).toLocaleDateString('pt-BR'),
        };
        setReports(p => [...p, entry]);
        setName(''); setType(null); setRecipients('');
    };

    const handleDelete = (id: string) => setReports(p => p.filter(r => r.id !== id));
    const handleToggle = (id: string) => setReports(p => p.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Relatórios</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Agendados</Text></Group>
                    <Title order={1}>Relatórios Agendados</Title>
                    <Text c="dimmed" mt="xs">Configure relatórios para geração e envio automáticos por e-mail.</Text>
                </div>

                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total</Text><Text size="xl" fw={700}>{stats.total}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue"><IconCalendarEvent size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ativos</Text><Text size="xl" fw={700} c="green">{stats.active}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green"><IconClock size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Formatos</Text><Text size="xl" fw={700}>CSV</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet"><IconFileSpreadsheet size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Envio</Text><Text size="xl" fw={700}>E-mail</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange"><IconMail size={24} /></ThemeIcon></Group>
                    </Card>
                </SimpleGrid>

                <Card withBorder padding="lg" radius="md">
                    <Text fw={600} mb="md">Novo Agendamento</Text>
                    <Group align="end" gap="md">
                        <TextInput label="Nome" placeholder="Relatório mensal" value={name} onChange={e => setName(e.currentTarget.value)} style={{ flex: 1 }} />
                        <Select label="Tipo" placeholder="Selecione" value={type} onChange={setType} data={REPORT_TYPES} w={160} />
                        <Select label="Frequência" value={freq} onChange={setFreq} data={Object.entries(FREQ_LABELS).map(([v, l]) => ({ value: v, label: l }))} w={140} />
                        <TextInput label="Destinatários" placeholder="email@exemplo.com" value={recipients} onChange={e => setRecipients(e.currentTarget.value)} style={{ flex: 1 }} />
                        <Button leftSection={<IconPlus size={16} />} onClick={handleAdd} disabled={!name.trim() || !type || !freq}>Criar</Button>
                    </Group>
                </Card>

                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md"><Text fw={600}>Agendamentos</Text><Badge variant="light">{reports.length}</Badge></Group>
                    {reports.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md"><IconCalendarEvent size={32} /></ThemeIcon>
                            <Title order={3} mb="xs">Nenhum agendamento</Title>
                            <Text c="dimmed">Crie um agendamento acima para gerar relatórios automaticamente.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr><Table.Th>Nome</Table.Th><Table.Th>Tipo</Table.Th><Table.Th>Frequência</Table.Th><Table.Th>Destinatários</Table.Th><Table.Th>Próximo Envio</Table.Th><Table.Th ta="center">Ativo</Table.Th><Table.Th ta="center">Ações</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {reports.map(r => (
                                    <Table.Tr key={r.id} style={{ opacity: r.isActive ? 1 : 0.6 }}>
                                        <Table.Td><Text size="sm" fw={500}>{r.name}</Text></Table.Td>
                                        <Table.Td><Badge size="sm" variant="light">{REPORT_TYPES.find(t => t.value === r.reportType)?.label || r.reportType}</Badge></Table.Td>
                                        <Table.Td><Text size="sm">{FREQ_LABELS[r.frequency] || r.frequency}</Text></Table.Td>
                                        <Table.Td><Text size="sm" c="dimmed">{r.recipients}</Text></Table.Td>
                                        <Table.Td><Group gap={4}><IconClock size={14} color="gray" /><Text size="sm">{r.nextRun}</Text></Group></Table.Td>
                                        <Table.Td ta="center"><Switch checked={r.isActive} onChange={() => handleToggle(r.id)} size="sm" /></Table.Td>
                                        <Table.Td ta="center"><Button size="xs" variant="light" color="red" onClick={() => handleDelete(r.id)}><IconTrash size={14} /></Button></Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
