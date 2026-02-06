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
    Tabs,
} from '@mantine/core';
import {
    IconArticle,
    IconPlus,
    IconEye,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconPhoto,
    IconVideo,
    IconFileText,
    IconCalendar,
    IconBrandInstagram,
    IconBrandFacebook,
    IconMail,
} from '@tabler/icons-react';

interface Content {
    id: string;
    title: string;
    type: 'post' | 'video' | 'image' | 'email' | 'story';
    channel: 'instagram' | 'facebook' | 'email' | 'blog' | 'youtube';
    status: 'draft' | 'scheduled' | 'published';
    scheduledFor?: string;
    publishedAt?: string;
    engagement: number;
    createdAt: string;
}

// Mock data for content calendar
const mockContent: Content[] = [
    { id: '1', title: 'Dicas de pronúncia em inglês', type: 'video', channel: 'instagram', status: 'published', publishedAt: '2026-02-01', engagement: 234, createdAt: '2026-01-28' },
    { id: '2', title: 'Matrículas abertas 2026', type: 'post', channel: 'facebook', status: 'published', publishedAt: '2026-02-02', engagement: 189, createdAt: '2026-01-30' },
    { id: '3', title: 'Newsletter Fevereiro', type: 'email', channel: 'email', status: 'scheduled', scheduledFor: '2026-02-10', engagement: 0, createdAt: '2026-02-03' },
    { id: '4', title: 'Carrossel: Phrasal Verbs', type: 'post', channel: 'instagram', status: 'draft', engagement: 0, createdAt: '2026-02-04' },
    { id: '5', title: 'Story: Bastidores da aula', type: 'story', channel: 'instagram', status: 'published', publishedAt: '2026-02-05', engagement: 567, createdAt: '2026-02-05' },
];

const channelIcons: Record<string, React.ReactNode> = {
    instagram: <IconBrandInstagram size={16} />,
    facebook: <IconBrandFacebook size={16} />,
    email: <IconMail size={16} />,
    blog: <IconFileText size={16} />,
    youtube: <IconVideo size={16} />,
};

const channelColors: Record<string, string> = {
    instagram: 'grape',
    facebook: 'blue',
    email: 'yellow',
    blog: 'gray',
    youtube: 'red',
};

const typeIcons: Record<string, React.ReactNode> = {
    post: <IconFileText size={16} />,
    video: <IconVideo size={16} />,
    image: <IconPhoto size={16} />,
    email: <IconMail size={16} />,
    story: <IconPhoto size={16} />,
};

const statusColors: Record<string, string> = {
    draft: 'gray',
    scheduled: 'blue',
    published: 'green',
};

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    scheduled: 'Agendado',
    published: 'Publicado',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function ConteudoPage() {
    const [content] = useState<Content[]>(mockContent);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const filteredContent = activeTab === 'all'
        ? content
        : content.filter(c => c.status === activeTab);

    const publishedCount = content.filter(c => c.status === 'published').length;
    const scheduledCount = content.filter(c => c.status === 'scheduled').length;
    const draftCount = content.filter(c => c.status === 'draft').length;
    const totalEngagement = content.reduce((acc, c) => acc + c.engagement, 0);

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Marketing</Text>
                    <Title order={2}>Conteúdo</Title>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconCalendar size={16} />}>
                        Ver Calendário
                    </Button>
                    <Button leftSection={<IconPlus size={16} />}>
                        Novo Conteúdo
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconArticle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Publicados</Text>
                            <Text fw={700} size="xl">{publishedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Agendados</Text>
                            <Text fw={700} size="xl">{scheduledCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="gray" size="lg" radius="md">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Rascunhos</Text>
                            <Text fw={700} size="xl">{draftCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="pink" size="lg" radius="md">
                            <IconEye size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Engajamento Total</Text>
                            <Text fw={700} size="xl">{totalEngagement.toLocaleString('pt-BR')}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="all">Todos ({content.length})</Tabs.Tab>
                        <Tabs.Tab value="published">Publicados ({publishedCount})</Tabs.Tab>
                        <Tabs.Tab value="scheduled">Agendados ({scheduledCount})</Tabs.Tab>
                        <Tabs.Tab value="draft">Rascunhos ({draftCount})</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Título</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Canal</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Data</Table.Th>
                            <Table.Th>Engajamento</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredContent.map((item) => (
                            <Table.Tr key={item.id}>
                                <Table.Td>
                                    <Group gap="xs">
                                        {typeIcons[item.type]}
                                        <Text fw={500}>{item.title}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" tt="capitalize">{item.type}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        color={channelColors[item.channel]}
                                        variant="light"
                                        leftSection={channelIcons[item.channel]}
                                    >
                                        {item.channel}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[item.status]} variant="light">
                                        {statusLabels[item.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">
                                        {item.publishedAt
                                            ? formatDate(item.publishedAt)
                                            : item.scheduledFor
                                                ? formatDate(item.scheduledFor)
                                                : '-'}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{item.engagement > 0 ? item.engagement.toLocaleString('pt-BR') : '-'}</Text>
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

