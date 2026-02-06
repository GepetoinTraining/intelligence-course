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
    TextInput,
} from '@mantine/core';
import {
    IconListCheck,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconSearch,
    IconFileText,
    IconUsers,
} from '@tabler/icons-react';

interface Procedure {
    id: string;
    code: string;
    title: string;
    department: string;
    version: string;
    lastUpdated: string;
    status: 'active' | 'draft' | 'archived';
    viewCount: number;
}

// Mock data
const mockProcedures: Procedure[] = [
    { id: '1', code: 'POP-001', title: 'Matrícula de Novos Alunos', department: 'Operacional', version: '3.0', lastUpdated: '2026-01-15', status: 'active', viewCount: 156 },
    { id: '2', code: 'POP-002', title: 'Cancelamento de Matrícula', department: 'Operacional', version: '2.1', lastUpdated: '2025-11-20', status: 'active', viewCount: 89 },
    { id: '3', code: 'POP-003', title: 'Atendimento ao Cliente', department: 'Comercial', version: '1.5', lastUpdated: '2025-12-10', status: 'active', viewCount: 234 },
    { id: '4', code: 'POP-004', title: 'Emissão de Certificados', department: 'Acadêmico', version: '1.0', lastUpdated: '2026-02-01', status: 'draft', viewCount: 12 },
    { id: '5', code: 'POP-005', title: 'Processo de Admissão', department: 'RH', version: '2.0', lastUpdated: '2025-10-15', status: 'active', viewCount: 67 },
];

const statusColors: Record<string, string> = {
    active: 'green',
    draft: 'yellow',
    archived: 'gray',
};

const statusLabels: Record<string, string> = {
    active: 'Ativo',
    draft: 'Rascunho',
    archived: 'Arquivado',
};

export default function ProcedimentosPage() {
    const [procedures] = useState<Procedure[]>(mockProcedures);
    const [search, setSearch] = useState('');

    const filtered = procedures.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = procedures.filter(p => p.status === 'active').length;
    const draftCount = procedures.filter(p => p.status === 'draft').length;
    const totalViews = procedures.reduce((acc, p) => acc + p.viewCount, 0);

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Conhecimento</Text>
                    <Title order={2}>Procedimentos (POPs)</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Procedimento
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconListCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total POPs</Text>
                            <Text fw={700} size="xl">{procedures.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="xl">{activeCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="yellow" size="lg" radius="md">
                            <IconEdit size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Revisão</Text>
                            <Text fw={700} size="xl">{draftCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Visualizações</Text>
                            <Text fw={700} size="xl">{totalViews}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Group justify="space-between" mb="md">
                    <Title order={4}>Todos os Procedimentos</Title>
                    <TextInput
                        placeholder="Buscar..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        w={250}
                    />
                </Group>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Título</Table.Th>
                            <Table.Th>Departamento</Table.Th>
                            <Table.Th>Versão</Table.Th>
                            <Table.Th>Atualizado</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((proc) => (
                            <Table.Tr key={proc.id}>
                                <Table.Td>
                                    <Text fw={500}>{proc.code}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{proc.title}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light" color="gray">{proc.department}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="outline" size="sm">v{proc.version}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{new Date(proc.lastUpdated).toLocaleDateString('pt-BR')}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[proc.status]} variant="light">
                                        {statusLabels[proc.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDotsVertical size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Visualizar</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

