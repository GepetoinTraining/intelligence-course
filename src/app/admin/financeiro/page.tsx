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
    IconAlertTriangle,
    IconArrowDown,
    IconArrowRight,
    IconArrowsExchange,
    IconBuildingBank,
    IconCash,
    IconCoin,
    IconReceipt,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

export default function FinanceiroHubPage() {
    const { data, isLoading, error, refetch } = useApi<any[]>('/api/invoices');
    const count = data?.length ?? 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>Financeiro</Title>
            </div>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Faturas</Text>
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
                    key="Recebíveis"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/financeiro/recebiveis'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconCoin size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Recebíveis</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Pagamentos"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/financeiro/pagamentos'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Pagamentos</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Faturamento"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/financeiro/faturamento'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconReceipt size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Faturamento</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Despesas"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/financeiro/despesas'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg" radius="md">
                            <IconArrowDown size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Despesas</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Inadimplência"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/financeiro/inadimplencia'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg" radius="md">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Inadimplência</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Contas"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/financeiro/contas'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="cyan" size="lg" radius="md">
                            <IconBuildingBank size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Contas</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Fluxo de Caixa"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/financeiro/fluxo-caixa'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                            <IconArrowsExchange size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Fluxo de Caixa</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}
