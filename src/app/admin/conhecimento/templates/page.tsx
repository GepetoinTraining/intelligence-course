'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    TextInput,
} from '@mantine/core';
import {
    IconTemplate,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconSearch,
    IconCopy,
    IconDownload,
} from '@tabler/icons-react';

interface Template {
    id: string;
    name: string;
    category: string;
    description: string;
    format: 'docx' | 'pdf' | 'xlsx' | 'pptx';
    downloads: number;
    lastUpdated: string;
}

// Mock data
const mockTemplates: Template[] = [
    { id: '1', name: 'Contrato de Matrícula', category: 'Contratos', description: 'Modelo padrão de contrato para matrículas', format: 'docx', downloads: 234, lastUpdated: '2026-01-20' },
    { id: '2', name: 'Atestado de Frequência', category: 'Declarações', description: 'Modelo de atestado de presença', format: 'docx', downloads: 189, lastUpdated: '2025-12-15' },
    { id: '3', name: 'Planilha de Notas', category: 'Acadêmico', description: 'Template para lançamento de notas', format: 'xlsx', downloads: 156, lastUpdated: '2026-01-10' },
    { id: '4', name: 'Apresentação Institucional', category: 'Marketing', description: 'Slides para apresentação da escola', format: 'pptx', downloads: 78, lastUpdated: '2025-11-30' },
    { id: '5', name: 'Certificado de Conclusão', category: 'Acadêmico', description: 'Modelo de certificado', format: 'pdf', downloads: 312, lastUpdated: '2026-02-01' },
];

const formatColors: Record<string, string> = {
    docx: 'blue',
    pdf: 'red',
    xlsx: 'green',
    pptx: 'orange',
};

export default function TemplatesPage() {
    const [templates] = useState<Template[]>(mockTemplates);
    const [search, setSearch] = useState('');

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );

    const totalDownloads = templates.reduce((acc, t) => acc + t.downloads, 0);
    const categories = [...new Set(templates.map(t => t.category))];

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Conhecimento</Text>
                    <Title order={2}>Templates</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Template
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconTemplate size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Templates</Text>
                            <Text fw={700} size="xl">{templates.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconDownload size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Downloads</Text>
                            <Text fw={700} size="xl">{totalDownloads}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconCopy size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Categorias</Text>
                            <Text fw={700} size="xl">{categories.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconTemplate size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Mais Usado</Text>
                            <Text fw={700} size="sm">Certificado</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Group justify="space-between" mb="md">
                    <Title order={4}>Todos os Templates</Title>
                    <TextInput
                        placeholder="Buscar..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        w={250}
                    />
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {filtered.map((template) => (
                        <Card key={template.id} withBorder p="md">
                            <Group justify="space-between" align="flex-start">
                                <div>
                                    <Badge color={formatColors[template.format]} size="xs" mb="xs">
                                        {template.format.toUpperCase()}
                                    </Badge>
                                    <Text fw={500}>{template.name}</Text>
                                    <Text size="xs" c="dimmed">{template.description}</Text>
                                </div>
                                <Menu position="bottom-end" withArrow>
                                    <Menu.Target>
                                        <ActionIcon variant="subtle" color="gray">
                                            <IconDotsVertical size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item leftSection={<IconDownload size={14} />}>Download</Menu.Item>
                                        <Menu.Item leftSection={<IconEye size={14} />}>Visualizar</Menu.Item>
                                        <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                            <Group justify="space-between" mt="md">
                                <Badge variant="light" color="gray">{template.category}</Badge>
                                <Text size="xs" c="dimmed">{template.downloads} downloads</Text>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            </Card>
        </div>
    );
}

