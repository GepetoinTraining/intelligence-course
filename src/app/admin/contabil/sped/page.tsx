'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    Select,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconFileExport,
    IconDownload,
    IconEye,
    IconDotsVertical,
    IconCheck,
    IconClock,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface SPEDExport {
    id: string;
    type: 'ECD' | 'ECF' | 'EFD';
    period: string;
    generatedAt?: string;
    status: 'pending' | 'generating' | 'ready' | 'error';
    fileSize?: string;
    hash?: string;
}

// Mock data
const mockExports: SPEDExport[] = [
    { id: '1', type: 'ECD', period: '2025', generatedAt: '2026-01-15', status: 'ready', fileSize: '2.4 MB', hash: 'ABC123...' },
    { id: '2', type: 'ECF', period: '2025', generatedAt: '2026-01-20', status: 'ready', fileSize: '1.8 MB', hash: 'DEF456...' },
    { id: '3', type: 'EFD', period: '01/2026', generatedAt: '2026-02-05', status: 'ready', fileSize: '0.5 MB', hash: 'GHI789...' },
    { id: '4', type: 'EFD', period: '02/2026', status: 'pending' },
];

const typeDescriptions: Record<string, string> = {
    ECD: 'Escrituração Contábil Digital',
    ECF: 'Escrituração Contábil e Fiscal',
    EFD: 'EFD-Contribuições',
};

const statusColors: Record<string, string> = {
    pending: 'gray',
    generating: 'blue',
    ready: 'green',
    error: 'red',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    generating: 'Gerando...',
    ready: 'Pronto',
    error: 'Erro',
};

export default function SPEDPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/fiscal-documents');

    const [exports] = useState<SPEDExport[]>(mockExports);

    const readyCount = exports.filter(e => e.status === 'ready').length;
    const pendingCount = exports.filter(e => e.status === 'pending').length;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Contábil</Text>
                    <Title order={2}>SPED</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Tipo"
                        data={[
                            { value: 'all', label: 'Todos os Tipos' },
                            { value: 'ECD', label: 'ECD' },
                            { value: 'ECF', label: 'ECF' },
                            { value: 'EFD', label: 'EFD-Contribuições' },
                        ]}
                        w={180}
                        defaultValue="all"
                    />
                    <Button leftSection={<IconFileExport size={16} />}>
                        Gerar Arquivo
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconFileExport size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Arquivos</Text>
                            <Text fw={700} size="xl">{exports.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Prontos</Text>
                            <Text fw={700} size="xl">{readyCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="gray" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="xl">{pendingCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconFileExport size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Último Envio</Text>
                            <Text fw={700} size="xl">05/02</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Arquivos SPED</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Período</Table.Th>
                            <Table.Th>Gerado em</Table.Th>
                            <Table.Th>Tamanho</Table.Th>
                            <Table.Th>Hash</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {exports.map((exp) => (
                            <Table.Tr key={exp.id}>
                                <Table.Td>
                                    <div>
                                        <Text fw={500}>{exp.type}</Text>
                                        <Text size="xs" c="dimmed">{typeDescriptions[exp.type]}</Text>
                                    </div>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{exp.period}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{exp.generatedAt || '-'}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{exp.fileSize || '-'}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">{exp.hash || '-'}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[exp.status]} variant="light">
                                        {statusLabels[exp.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        {exp.status === 'ready' && (
                                            <ActionIcon variant="light" color="blue" size="sm">
                                                <IconDownload size={14} />
                                            </ActionIcon>
                                        )}
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                    <IconDotsVertical size={14} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                                {exp.status === 'ready' && (
                                                    <Menu.Item leftSection={<IconDownload size={14} />}>Download</Menu.Item>
                                                )}
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

