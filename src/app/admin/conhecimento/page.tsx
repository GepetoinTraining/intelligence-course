'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Group,
    ThemeIcon,
    Loader,
    Center,
    Alert,
    Button,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconArrowRight,
    IconBook2,
    IconBooks,
    IconClipboardList,
    IconQuestionMark,
    IconShield,
    IconTemplate,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

export default function ConhecimentoHubPage() {
    const { data, isLoading, error, refetch } = useApi<any[]>('/api/wiki/articles');
    const count = data?.length ?? 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>Conhecimento</Title>
            </div>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                            <IconBooks size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Artigos</Text>
                            <Text fw={700} size="xl">
                                {isLoading ? <Loader size="sm" /> : count}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                    Dados offline — {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Quick Links */}
            <Title order={4}>Acesso Rápido</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>

                <Card
                    key="Wiki"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/conhecimento/wiki'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                            <IconBook2 size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Wiki</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Procedimentos"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/conhecimento/procedimentos'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconClipboardList size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Procedimentos</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Políticas"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/conhecimento/politicas'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconShield size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Políticas</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="FAQ"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/conhecimento/faq'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="cyan" size="lg" radius="md">
                            <IconQuestionMark size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>FAQ</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Templates"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/conhecimento/templates'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg" radius="md">
                            <IconTemplate size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Templates</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}
