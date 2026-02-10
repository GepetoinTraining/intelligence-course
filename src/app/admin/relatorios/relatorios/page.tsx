'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    Table,
    ActionIcon,
    Select,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconFileAnalytics,
    IconPlus,
    IconDownload,
    IconEye,
    IconCalendar,
    IconClock,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// Demo reports
const reports = [
    { id: 1, name: 'Relatório de Matrículas', type: 'Operacional', frequency: 'Mensal', lastRun: '01/02/2026', status: 'ready' },
    { id: 2, name: 'Análise de Inadimplência', type: 'Financeiro', frequency: 'Semanal', lastRun: '03/02/2026', status: 'ready' },
    { id: 3, name: 'Performance de Campanhas', type: 'Marketing', frequency: 'Diário', lastRun: '05/02/2026', status: 'ready' },
    { id: 4, name: 'Frequência por Turma', type: 'Pedagógico', frequency: 'Semanal', lastRun: '03/02/2026', status: 'ready' },
    { id: 5, name: 'DRE Mensal', type: 'Contábil', frequency: 'Mensal', lastRun: '01/02/2026', status: 'ready' },
    { id: 6, name: 'Taxa de Conversão', type: 'Comercial', frequency: 'Semanal', lastRun: '03/02/2026', status: 'running' },
];

export default function RelatoriosListPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/reports/financial');


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Relatórios & BI</Text>
                    <Title order={2}>Relatórios</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Filtrar por tipo"
                        data={['Todos', 'Operacional', 'Financeiro', 'Marketing', 'Pedagógico', 'Contábil', 'Comercial']}
                        w={180}
                    />
                    <Button leftSection={<IconPlus size={16} />}>
                        Novo Relatório
                    </Button>
                </Group>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconFileAnalytics size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Relatórios</Text>
                            <Text fw={700} size="lg">{reports.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Prontos</Text>
                            <Text fw={700} size="lg">{reports.filter(r => r.status === 'ready').length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Execução</Text>
                            <Text fw={700} size="lg">{reports.filter(r => r.status === 'running').length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Diários</Text>
                            <Text fw={700} size="lg">{reports.filter(r => r.frequency === 'Diário').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Reports Table */}
            <Card withBorder p="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Relatório</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Frequência</Table.Th>
                            <Table.Th>Última Execução</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Ações</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {reports.map((report) => (
                            <Table.Tr key={report.id}>
                                <Table.Td>
                                    <Text fw={500}>{report.name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light" size="sm">{report.type}</Badge>
                                </Table.Td>
                                <Table.Td>{report.frequency}</Table.Td>
                                <Table.Td>{report.lastRun}</Table.Td>
                                <Table.Td>
                                    <Badge
                                        color={report.status === 'ready' ? 'green' : 'yellow'}
                                        variant="light"
                                    >
                                        {report.status === 'ready' ? 'Pronto' : 'Executando'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <ActionIcon variant="subtle" size="sm">
                                            <IconEye size={16} />
                                        </ActionIcon>
                                        <ActionIcon variant="subtle" size="sm">
                                            <IconDownload size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}

