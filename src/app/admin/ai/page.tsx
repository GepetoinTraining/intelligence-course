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
    IconBulb,
    IconChartDots,
    IconMessage,
    IconRobot,
    IconSettingsAutomation,
    IconSparkles,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

export default function AssistenteIAHubPage() {
    const { data, isLoading, error, refetch } = useApi<any[]>('/api/chat/sessions');
    const count = data?.length ?? 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>Assistente IA</Title>
            </div>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg" radius="md">
                            <IconRobot size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Sessões IA</Text>
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
                    key="Chat"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/ai/chat'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconMessage size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Chat</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Geradores"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/ai/geradores'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg" radius="md">
                            <IconSparkles size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Geradores</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Análises"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/ai/analises'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="cyan" size="lg" radius="md">
                            <IconChartDots size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Análises</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Insights"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/ai/insights'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                            <IconBulb size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Insights</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Automações"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/ai/automacoes'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                            <IconSettingsAutomation size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Automações</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}
