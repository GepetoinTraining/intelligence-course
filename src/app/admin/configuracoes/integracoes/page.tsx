'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Button, Switch, Loader, Alert, Center,
} from '@mantine/core';
import {
    IconPlugConnected, IconBrandStripe, IconMail, IconCloudDataConnection,
    IconAlertCircle, IconBrandWhatsapp, IconBrandAsana,
} from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

const ICON_MAP: Record<string, any> = {
    stripe: IconBrandStripe,
    resend: IconMail,
    clerk: IconCloudDataConnection,
    whatsapp: IconBrandWhatsapp,
    asaas: IconBrandAsana,
};

interface Integration {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    configured: boolean;
    provider?: string;
}

const DEFAULT_INTEGRATIONS: Integration[] = [
    { id: 'stripe', name: 'Stripe', description: 'Processamento de pagamentos', enabled: true, configured: true },
    { id: 'resend', name: 'Resend', description: 'Envio de e-mails transacionais', enabled: true, configured: true },
    { id: 'clerk', name: 'Clerk', description: 'Autenticação e gerenciamento de usuários', enabled: true, configured: true },
    { id: 'whatsapp', name: 'WhatsApp Business', description: 'Mensagens automáticas', enabled: false, configured: false },
    { id: 'asaas', name: 'Asaas', description: 'Cobrança e boletos', enabled: true, configured: true },
];

export default function IntegracoesPage() {
    const { data: apiData, isLoading, error, refetch } = useApi<any[]>('/api/api-keys');

    const integrations = useMemo(() => {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            return apiData.map((item: any) => ({
                id: item.id || item.provider,
                name: item.name || item.provider,
                description: item.description || '',
                enabled: item.enabled ?? item.isActive ?? true,
                configured: item.configured ?? true,
                provider: item.provider,
            }));
        }
        return DEFAULT_INTEGRATIONS;
    }, [apiData]);

    const [toggles, setToggles] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const initial: Record<string, boolean> = {};
        integrations.forEach(i => { initial[i.id] = i.enabled; });
        setToggles(initial);
    }, [integrations]);

    const handleToggle = async (id: string, checked: boolean) => {
        setToggles(prev => ({ ...prev, [id]: checked }));
        try {
            await fetch('/api/api-keys', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled: checked }),
            });
            refetch();
        } catch (e) { console.error(e); }
    };

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle />} color="red" title="Erro">{String(error)}</Alert>;

    const activeCount = Object.values(toggles).filter(Boolean).length;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Configurações</Text>
                <Title order={2}>Integrações</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconPlugConnected size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{integrations.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconPlugConnected size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{activeCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {integrations.map((integration) => {
                    const IconComp = ICON_MAP[integration.id] || ICON_MAP[integration.provider || ''] || IconPlugConnected;
                    return (
                        <Card key={integration.id} withBorder p="md">
                            <Group justify="space-between" mb="sm">
                                <Group>
                                    <ThemeIcon variant="light" color="blue" size="lg">
                                        <IconComp size={24} />
                                    </ThemeIcon>
                                    <div>
                                        <Text fw={600}>{integration.name}</Text>
                                        <Text size="xs" c="dimmed">{integration.description}</Text>
                                    </div>
                                </Group>
                            </Group>
                            <Group justify="space-between">
                                <Badge
                                    color={integration.configured ? 'green' : 'yellow'}
                                    variant="light"
                                >
                                    {integration.configured ? 'Configurado' : 'Pendente'}
                                </Badge>
                                <Switch
                                    checked={toggles[integration.id] ?? integration.enabled}
                                    onChange={(e) => handleToggle(integration.id, e.currentTarget.checked)}
                                />
                            </Group>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
}
