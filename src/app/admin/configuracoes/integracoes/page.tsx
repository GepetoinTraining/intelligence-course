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
    Loader,
    Center,
    Alert,
    Button,
    Switch,
} from '@mantine/core';
import {
    IconPlugConnected,
    IconBrandStripe,
    IconMail,
    IconCloudDataConnection,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useState } from 'react';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
    configured: boolean;
}

export default function IntegracoesPage() {
    const [integrations] = useState<Integration[]>([
        {
            id: 'stripe',
            name: 'Stripe',
            description: 'Processamento de pagamentos',
            icon: <IconBrandStripe size={24} />,
            enabled: true,
            configured: true,
        },
        {
            id: 'resend',
            name: 'Resend',
            description: 'Envio de e-mails transacionais',
            icon: <IconMail size={24} />,
            enabled: true,
            configured: true,
        },
        {
            id: 'clerk',
            name: 'Clerk',
            description: 'Autenticação e gerenciamento de usuários',
            icon: <IconCloudDataConnection size={24} />,
            enabled: true,
            configured: true,
        },
    ]);

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Configurações</Text>
                <Title order={2}>Integrações</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconPlugConnected size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{integrations.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconPlugConnected size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{integrations.filter(i => i.enabled).length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {integrations.map((integration) => (
                    <Card key={integration.id} withBorder p="md">
                        <Group justify="space-between" mb="sm">
                            <Group>
                                <ThemeIcon variant="light" color="blue" size="lg">
                                    {integration.icon}
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
                            <Switch checked={integration.enabled} readOnly />
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    );
}

