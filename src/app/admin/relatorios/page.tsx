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
    IconBook,
    IconBriefcase,
    IconCash,
    IconChartBar,
    IconDashboard,
    IconDownload,
    IconTrendingUp,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

export default function RelatriosBIHubPage() {
    const { data, isLoading, error, refetch } = useApi<any[]>('/api/reports/financial');
    const count = data?.length ?? 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>Relatórios & BI</Title>
            </div>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="pink" size="lg" radius="md">
                            <IconChartBar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Relatórios</Text>
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
                    key="Dashboards"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/relatorios/dashboards'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="pink" size="lg" radius="md">
                            <IconDashboard size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Dashboards</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="KPIs"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/relatorios/kpis'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>KPIs</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Comercial"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/relatorios/comercial'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconBriefcase size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Comercial</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Financeiro"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/relatorios/financeiro'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Financeiro</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Pedagógico"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/relatorios/pedagogico'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg" radius="md">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Pedagógico</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Exportações"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/relatorios/exportar'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg" radius="md">
                            <IconDownload size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Exportações</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}
