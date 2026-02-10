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
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconFiles,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconSearch,
    IconDownload,
    IconTrash,
    IconFolder,
    IconFile,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    format?: string;
    size?: string;
    path: string;
    updatedAt: string;
    updatedBy: string;
}

// Mock data
const mockFiles: FileItem[] = [
    { id: '1', name: 'Materiais Didáticos', type: 'folder', path: '/materiais', updatedAt: '2026-02-05', updatedBy: 'Sistema' },
    { id: '2', name: 'Documentos Legais', type: 'folder', path: '/legal', updatedAt: '2026-01-20', updatedBy: 'Maria' },
    { id: '3', name: 'Relatório Anual 2025.pdf', type: 'file', format: 'pdf', size: '2.4 MB', path: '/relatorios', updatedAt: '2026-01-15', updatedBy: 'João' },
    { id: '4', name: 'Logo_HD.png', type: 'file', format: 'png', size: '450 KB', path: '/marketing', updatedAt: '2025-12-01', updatedBy: 'Ana' },
    { id: '5', name: 'Planilha_Turmas_2026.xlsx', type: 'file', format: 'xlsx', size: '1.2 MB', path: '/academico', updatedAt: '2026-02-01', updatedBy: 'Pedro' },
];

const formatColors: Record<string, string> = {
    pdf: 'red',
    docx: 'blue',
    xlsx: 'green',
    png: 'grape',
    jpg: 'grape',
    mp4: 'orange',
};

export default function ArquivosPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/templates?type=file');

    const [files] = useState<FileItem[]>(mockFiles);
    const [search, setSearch] = useState('');

    const filtered = files.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    const folderCount = files.filter(f => f.type === 'folder').length;
    const fileCount = files.filter(f => f.type === 'file').length;
    const totalSize = '45.6 MB';


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Conhecimento</Text>
                    <Title order={2}>Arquivos</Title>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconFolder size={16} />}>
                        Nova Pasta
                    </Button>
                    <Button leftSection={<IconPlus size={16} />}>
                        Upload
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconFiles size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Itens</Text>
                            <Text fw={700} size="xl">{files.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="yellow" size="lg" radius="md">
                            <IconFolder size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pastas</Text>
                            <Text fw={700} size="xl">{folderCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconFile size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Arquivos</Text>
                            <Text fw={700} size="xl">{fileCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconFiles size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Tamanho Total</Text>
                            <Text fw={700} size="xl">{totalSize}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Group justify="space-between" mb="md">
                    <Title order={4}>Navegador de Arquivos</Title>
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
                            <Table.Th>Nome</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Tamanho</Table.Th>
                            <Table.Th>Caminho</Table.Th>
                            <Table.Th>Atualizado</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((file) => (
                            <Table.Tr key={file.id}>
                                <Table.Td>
                                    <Group gap="sm">
                                        <ThemeIcon
                                            size="sm"
                                            color={file.type === 'folder' ? 'yellow' : formatColors[file.format || ''] || 'gray'}
                                            variant="light"
                                        >
                                            {file.type === 'folder' ? <IconFolder size={14} /> : <IconFile size={14} />}
                                        </ThemeIcon>
                                        <Text size="sm" fw={500}>{file.name}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    {file.type === 'folder' ? (
                                        <Badge color="yellow" variant="light">Pasta</Badge>
                                    ) : (
                                        <Badge color={formatColors[file.format || ''] || 'gray'} variant="light">
                                            {file.format?.toUpperCase()}
                                        </Badge>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{file.size || '-'}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">{file.path}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{new Date(file.updatedAt).toLocaleDateString('pt-BR')}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDotsVertical size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            {file.type === 'folder' ? (
                                                <Menu.Item leftSection={<IconFolder size={14} />}>Abrir</Menu.Item>
                                            ) : (
                                                <>
                                                    <Menu.Item leftSection={<IconEye size={14} />}>Visualizar</Menu.Item>
                                                    <Menu.Item leftSection={<IconDownload size={14} />}>Download</Menu.Item>
                                                </>
                                            )}
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Renomear</Menu.Item>
                                            <Menu.Divider />
                                            <Menu.Item leftSection={<IconTrash size={14} />} color="red">Excluir</Menu.Item>
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

