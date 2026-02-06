'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    Alert,
    Loader,
    Menu,
    Progress,
} from '@mantine/core';
import {
    IconBrowserCheck,
    IconPlus,
    IconEye,
    IconEdit,
    IconTrash,
    IconAlertCircle,
    IconExternalLink,
    IconCopy,
    IconDotsVertical,
    IconChartBar,
    IconUsers,
    IconClick,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface LandingPage {
    id: string;
    name: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    views: number;
    conversions: number;
    campaignId?: string;
    createdAt: string;
}

// Mock data for landing pages since there's no specific API
const mockLandingPages: LandingPage[] = [
    { id: '1', name: 'Matrícula 2026', slug: 'matricula-2026', status: 'published', views: 1250, conversions: 87, createdAt: '2026-01-15' },
    { id: '2', name: 'Curso de Inglês Kids', slug: 'ingles-kids', status: 'published', views: 890, conversions: 45, createdAt: '2026-01-20' },
    { id: '3', name: 'Promoção Verão', slug: 'promo-verao', status: 'archived', views: 2100, conversions: 156, createdAt: '2025-12-01' },
    { id: '4', name: 'Business English', slug: 'business-english', status: 'published', views: 650, conversions: 32, createdAt: '2026-01-25' },
    { id: '5', name: 'Aulas Particulares', slug: 'aulas-particulares', status: 'draft', views: 0, conversions: 0, createdAt: '2026-02-01' },
];

const statusColors: Record<string, string> = {
    draft: 'gray',
    published: 'green',
    archived: 'orange',
};

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    published: 'Publicada',
    archived: 'Arquivada',
};

export default function LandingPagesPage() {
    const router = useRouter();
    const [pages] = useState<LandingPage[]>(mockLandingPages);

    const totalViews = pages.reduce((acc, p) => acc + p.views, 0);
    const totalConversions = pages.reduce((acc, p) => acc + p.conversions, 0);
    const avgConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
    const publishedCount = pages.filter(p => p.status === 'published').length;

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Marketing</Text>
                    <Title order={2}>Landing Pages</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Landing Page
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconBrowserCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Páginas Ativas</Text>
                            <Text fw={700} size="xl">{publishedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconEye size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total de Visualizações</Text>
                            <Text fw={700} size="xl">{totalViews.toLocaleString('pt-BR')}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conversões</Text>
                            <Text fw={700} size="xl">{totalConversions}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconClick size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Taxa de Conversão</Text>
                            <Text fw={700} size="xl">{avgConversionRate.toFixed(1)}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todas as Landing Pages</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nome</Table.Th>
                            <Table.Th>URL</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Visualizações</Table.Th>
                            <Table.Th>Conversões</Table.Th>
                            <Table.Th>Taxa</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {pages.map((page) => {
                            const conversionRate = page.views > 0 ? (page.conversions / page.views) * 100 : 0;
                            return (
                                <Table.Tr key={page.id}>
                                    <Table.Td>
                                        <Text fw={500}>{page.name}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Text size="sm" c="dimmed">/{page.slug}</Text>
                                            <ActionIcon variant="subtle" size="sm" color="gray">
                                                <IconCopy size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={statusColors[page.status]} variant="light">
                                            {statusLabels[page.status]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{page.views.toLocaleString('pt-BR')}</Table.Td>
                                    <Table.Td>{page.conversions}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Progress
                                                value={conversionRate}
                                                size="sm"
                                                w={50}
                                                color={conversionRate > 10 ? 'green' : conversionRate > 5 ? 'yellow' : 'red'}
                                            />
                                            <Text size="sm">{conversionRate.toFixed(1)}%</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconExternalLink size={14} />}>Abrir Página</Menu.Item>
                                                <Menu.Item leftSection={<IconChartBar size={14} />}>Ver Métricas</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                <Menu.Item leftSection={<IconCopy size={14} />}>Duplicar</Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item leftSection={<IconTrash size={14} />} color="red">Arquivar</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

