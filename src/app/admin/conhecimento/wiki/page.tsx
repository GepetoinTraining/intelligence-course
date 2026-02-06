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
    Loader,
    Alert,
    Center,
    TextInput,
} from '@mantine/core';
import {
    IconBook,
    IconPlus,
    IconSearch,
    IconEye,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface WikiArticle {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    status: 'draft' | 'review' | 'published' | 'archived';
    viewCount: number;
    helpfulCount: number;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    review: 'Em Revisão',
    published: 'Publicado',
    archived: 'Arquivado',
};

export default function WikiPage() {
    const { data: articles, isLoading, error, refetch } = useApi<WikiArticle[]>('/api/wiki/articles');

    const stats = {
        total: articles?.length || 0,
        published: articles?.filter(a => a.status === 'published').length || 0,
        totalViews: articles?.reduce((sum, a) => sum + (a.viewCount || 0), 0) || 0,
    };

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Conhecimento</Text>
                    <Title order={2}>Wiki</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Artigo
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Artigos</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Publicados</Text>
                            <Text fw={700} size="lg">{stats.published}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconEye size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Visualizações</Text>
                            <Text fw={700} size="lg">{stats.totalViews}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Search */}
            <TextInput
                placeholder="Buscar artigos..."
                leftSection={<IconSearch size={16} />}
            />

            {/* Articles Table */}
            <Card withBorder p="md">
                {articles && articles.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Título</Table.Th>
                                <Table.Th>Tags</Table.Th>
                                <Table.Th>Views</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Atualizado</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {articles.map((article) => (
                                <Table.Tr key={article.id}>
                                    <Table.Td>
                                        <Text fw={500}>{article.title}</Text>
                                        {article.summary && (
                                            <Text size="xs" c="dimmed" lineClamp={1}>{article.summary}</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {article.tags?.slice(0, 2).map((tag, i) => (
                                                <Badge key={i} variant="light" size="xs">{tag}</Badge>
                                            ))}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>{article.viewCount}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                article.status === 'published' ? 'green' :
                                                    article.status === 'review' ? 'yellow' :
                                                        article.status === 'archived' ? 'gray' : 'blue'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[article.status] || article.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(article.updatedAt)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBook size={48} color="gray" />
                            <Text c="dimmed">Nenhum artigo encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Criar artigo
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

