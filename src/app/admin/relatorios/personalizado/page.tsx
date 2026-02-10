'use client';

import { useState, useCallback } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Select, Button, Paper, Table, Checkbox,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconReportAnalytics, IconDownload, IconTable,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface ReportField { id: string; label: string; category: string; selected: boolean; }

const FIELDS: ReportField[] = [
    { id: 'name', label: 'Nome', category: 'aluno', selected: true },
    { id: 'email', label: 'E-mail', category: 'aluno', selected: false },
    { id: 'phone', label: 'Telefone', category: 'aluno', selected: false },
    { id: 'class', label: 'Turma', category: 'acadêmico', selected: true },
    { id: 'course', label: 'Curso', category: 'acadêmico', selected: true },
    { id: 'status', label: 'Status Matrícula', category: 'acadêmico', selected: true },
    { id: 'enrollment_date', label: 'Data Matrícula', category: 'acadêmico', selected: false },
    { id: 'gross_amount', label: 'Valor Bruto', category: 'financeiro', selected: false },
    { id: 'net_amount', label: 'Valor Líquido', category: 'financeiro', selected: false },
    { id: 'payment_status', label: 'Status Pagamento', category: 'financeiro', selected: false },
    { id: 'department', label: 'Departamento', category: 'rh', selected: false },
    { id: 'hire_date', label: 'Data Admissão', category: 'rh', selected: false },
];

const TEMPLATES = [
    { id: 'students', label: 'Alunos Ativos', fields: ['name', 'email', 'class', 'course', 'status'] },
    { id: 'financial', label: 'Resumo Financeiro', fields: ['name', 'class', 'gross_amount', 'net_amount', 'payment_status'] },
    { id: 'staff', label: 'Equipe', fields: ['name', 'email', 'department', 'hire_date'] },
    { id: 'enrollments', label: 'Matrículas', fields: ['name', 'course', 'class', 'status', 'enrollment_date'] },
];

export default function PersonalizadoPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/reports/financial');

    const [fields, setFields] = useState<ReportField[]>(FIELDS);
    const [source, setSource] = useState<string | null>('enrollments');
    const [generating, setGenerating] = useState(false);
    const [preview, setPreview] = useState<string[][] | null>(null);

    const selected = fields.filter(f => f.selected);
    const categories = [...new Set(fields.map(f => f.category))];

    const toggle = (id: string) => setFields(p => p.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
    const applyTemplate = (tid: string) => {
        const t = TEMPLATES.find(x => x.id === tid);
        if (t) setFields(p => p.map(f => ({ ...f, selected: t.fields.includes(f.id) })));
    };
    const handleGenerate = useCallback(async () => {
        setGenerating(true);
        await new Promise(r => setTimeout(r, 600));
        setPreview([selected.map(f => f.label), ...Array.from({ length: 3 }, () => selected.map(() => '—'))]);
        setGenerating(false);
    }, [selected]);


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Relatórios</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Personalizado</Text></Group>
                    <Title order={1}>Relatório Personalizado</Title>
                    <Text c="dimmed" mt="xs">Monte relatórios sob medida escolhendo campos e fontes de dados.</Text>
                </div>

                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Templates Rápidos</Text>
                        <SimpleGrid cols={2}>
                            {TEMPLATES.map(t => (
                                <Paper key={t.id} withBorder p="md" radius="md" style={{ cursor: 'pointer' }} onClick={() => applyTemplate(t.id)}>
                                    <Group gap="sm"><ThemeIcon size={32} radius="md" variant="light" color="blue"><IconTable size={16} /></ThemeIcon>
                                        <div><Text size="sm" fw={500}>{t.label}</Text><Text size="xs" c="dimmed">{t.fields.length} campos</Text></div></Group>
                                </Paper>
                            ))}
                        </SimpleGrid>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Fonte de Dados</Text>
                        <Select label="Fonte" value={source} onChange={setSource} mb="md"
                            data={[{ value: 'enrollments', label: 'Matrículas' }, { value: 'students', label: 'Alunos' }, { value: 'staff', label: 'Colaboradores' }, { value: 'payments', label: 'Pagamentos' }]} />
                        <Badge variant="light" size="lg">{selected.length} campos selecionados</Badge>
                    </Card>
                </SimpleGrid>

                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Selecionar Campos</Text>
                        <Group gap="xs">
                            <Button size="xs" variant="subtle" onClick={() => setFields(p => p.map(f => ({ ...f, selected: true })))}>Todos</Button>
                            <Button size="xs" variant="subtle" color="gray" onClick={() => setFields(p => p.map(f => ({ ...f, selected: false })))}>Limpar</Button>
                        </Group>
                    </Group>
                    {categories.map(cat => (
                        <div key={cat} style={{ marginBottom: 16 }}>
                            <Badge variant="light" mb="xs" tt="capitalize">{cat}</Badge>
                            <Group gap="md">{fields.filter(f => f.category === cat).map(f => <Checkbox key={f.id} label={f.label} checked={f.selected} onChange={() => toggle(f.id)} />)}</Group>
                        </div>
                    ))}
                </Card>

                <Group>
                    <Button leftSection={<IconReportAnalytics size={16} />} onClick={handleGenerate} loading={generating} disabled={selected.length === 0}>Gerar</Button>
                    <Button leftSection={<IconDownload size={16} />} variant="light" disabled={!preview}>Exportar CSV</Button>
                </Group>

                {preview && (
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="md"><Text fw={600}>Pré-visualização</Text><Badge variant="light" color="green">Gerado</Badge></Group>
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr>{preview[0]?.map((h, i) => <Table.Th key={i}>{h}</Table.Th>)}</Table.Tr></Table.Thead>
                            <Table.Tbody>{preview.slice(1).map((row, i) => <Table.Tr key={i}>{row.map((c, j) => <Table.Td key={j}><Text size="sm" c="dimmed">{c}</Text></Table.Td>)}</Table.Tr>)}</Table.Tbody>
                        </Table>
                        <Text size="xs" c="dimmed" mt="md" ta="center">Pré-visualização com dados de exemplo.</Text>
                    </Card>
                )}
            </Stack>
        </Container>
    );
}
