'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, Button, TextInput, PasswordInput, Switch, Alert,
    Tabs, ThemeIcon, Divider, Accordion, Code, CopyButton, ActionIcon, Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconArrowLeft, IconCheck, IconX, IconKey, IconTestPipe,
    IconCreditCard, IconQrcode, IconReceipt, IconSettings,
    IconCopy, IconEye, IconEyeOff, IconExternalLink, IconRefresh,
    IconShieldCheck, IconAlertTriangle
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

type PaymentProvider = 'stripe' | 'asaas' | 'mercado_pago' | 'pagseguro' | 'pagarme';

interface ProviderCredentials {
    id: PaymentProvider;
    name: string;
    logo: string;
    description: string;
    docUrl: string;
    enabled: boolean;
    testMode: boolean;
    credentials: {
        publicKey?: string;
        secretKey?: string;
        accessToken?: string;
        webhookSecret?: string;
        clientId?: string;
        clientSecret?: string;
    };
    webhookUrl: string;
    lastTested?: string;
    testResult?: 'success' | 'failed';
}

// ============================================================================
// CONFIG
// ============================================================================

const INITIAL_PROVIDERS: ProviderCredentials[] = [
    {
        id: 'stripe',
        name: 'Stripe',
        logo: '💳',
        description: 'Provedor internacional com suporte completo a cartões e PIX no Brasil',
        docUrl: 'https://stripe.com/docs/api',
        enabled: true,
        testMode: true,
        credentials: {
            publicKey: 'pk_test_xxxxxxxxxxxxxxxxxxxx',
            secretKey: 'sk_test_xxxxxxxxxxxxxxxxxxxx',
            webhookSecret: 'whsec_xxxxxxxxxxxxxxxxxxxx',
        },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nodezero.com'}/api/webhooks/stripe`,
        lastTested: '2026-02-04T10:30:00',
        testResult: 'success',
    },
    {
        id: 'asaas',
        name: 'Asaas',
        logo: '🅰️',
        description: 'Solução completa para PMEs com PIX, boleto e cartão',
        docUrl: 'https://docs.asaas.com',
        enabled: true,
        testMode: true,
        credentials: {
            accessToken: '$aact_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nodezero.com'}/api/webhooks/asaas`,
        lastTested: '2026-02-04T09:15:00',
        testResult: 'success',
    },
    {
        id: 'mercado_pago',
        name: 'Mercado Pago',
        logo: '🤝',
        description: 'O maior provedor de pagamentos da América Latina',
        docUrl: 'https://www.mercadopago.com.br/developers',
        enabled: true,
        testMode: false,
        credentials: {
            publicKey: 'APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            accessToken: 'APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx',
        },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nodezero.com'}/api/webhooks/mercadopago`,
        lastTested: '2026-02-03T14:20:00',
        testResult: 'success',
    },
    {
        id: 'pagseguro',
        name: 'PagSeguro',
        logo: '🔒',
        description: 'Provedor tradicional brasileiro com ampla cobertura',
        docUrl: 'https://dev.pagseguro.uol.com.br',
        enabled: false,
        testMode: true,
        credentials: {
            accessToken: '',
        },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nodezero.com'}/api/webhooks/pagseguro`,
    },
    {
        id: 'pagarme',
        name: 'Pagar.me',
        logo: '💰',
        description: 'API flexível e developer-friendly da Stone',
        docUrl: 'https://docs.pagar.me',
        enabled: false,
        testMode: true,
        credentials: {
            publicKey: '',
            secretKey: '',
        },
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nodezero.com'}/api/webhooks/pagarme`,
    },
];

// ============================================================================
// PROVIDER CONFIG CARD
// ============================================================================

function ProviderConfigCard({
    provider,
    onUpdate,
    onTest,
}: {
    provider: ProviderCredentials;
    onUpdate: (id: PaymentProvider, updates: Partial<ProviderCredentials>) => void;
    onTest: (id: PaymentProvider) => void;
}) {
    const [showSecrets, setShowSecrets] = useState(false);
    const [editing, setEditing] = useState(false);
    const [localCredentials, setLocalCredentials] = useState(provider.credentials);

    const handleSave = () => {
        onUpdate(provider.id, { credentials: localCredentials });
        setEditing(false);
        notifications.show({
            title: 'Salvo!',
            message: 'Credenciais atualizadas com sucesso',
            color: 'green',
        });
    };

    const handleToggleEnabled = (enabled: boolean) => {
        onUpdate(provider.id, { enabled });
    };

    const handleToggleTestMode = (testMode: boolean) => {
        onUpdate(provider.id, { testMode });
    };

    const renderCredentialField = (label: string, key: keyof typeof localCredentials, isSecret = false) => {
        const value = localCredentials[key] || '';

        if (editing) {
            if (isSecret) {
                return (
                    <PasswordInput
                        label={label}
                        value={value}
                        onChange={(e) => setLocalCredentials({ ...localCredentials, [key]: e.target.value })}
                        visible={showSecrets}
                        onVisibilityChange={setShowSecrets}
                        placeholder={`Digite sua ${label}`}
                    />
                );
            }
            return (
                <TextInput
                    label={label}
                    value={value}
                    onChange={(e) => setLocalCredentials({ ...localCredentials, [key]: e.target.value })}
                    placeholder={`Digite sua ${label}`}
                />
            );
        }

        return (
            <div>
                <Text size="xs" fw={500} c="dimmed" mb={4}>{label}</Text>
                <Group gap="xs">
                    <Code style={{ flex: 1 }}>
                        {value ? (showSecrets || !isSecret ? value : '••••••••••••••••') : '(não configurado)'}
                    </Code>
                    {value && (
                        <CopyButton value={value}>
                            {({ copied, copy }) => (
                                <Tooltip label={copied ? 'Copiado!' : 'Copiar'}>
                                    <ActionIcon variant="light" color={copied ? 'green' : 'gray'} size="sm" onClick={copy}>
                                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </CopyButton>
                    )}
                </Group>
            </div>
        );
    };

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            {/* Header */}
            <Group justify="space-between" mb="md">
                <Group gap="sm">
                    <Text size="2rem">{provider.logo}</Text>
                    <div>
                        <Group gap="xs">
                            <Text fw={600}>{provider.name}</Text>
                            {provider.testResult === 'success' && (
                                <ThemeIcon color="green" variant="light" size="sm" radius="xl">
                                    <IconCheck size={12} />
                                </ThemeIcon>
                            )}
                            {provider.testResult === 'failed' && (
                                <ThemeIcon color="red" variant="light" size="sm" radius="xl">
                                    <IconX size={12} />
                                </ThemeIcon>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed">{provider.description}</Text>
                    </div>
                </Group>
                <Switch
                    checked={provider.enabled}
                    onChange={(e) => handleToggleEnabled(e.currentTarget.checked)}
                    color="green"
                    label={provider.enabled ? 'Ativo' : 'Inativo'}
                    labelPosition="left"
                />
            </Group>

            {/* Test Mode Toggle */}
            <Group justify="space-between" mb="md">
                <Group gap="xs">
                    <ThemeIcon variant="light" color={provider.testMode ? 'yellow' : 'green'} size="sm">
                        <IconTestPipe size={14} />
                    </ThemeIcon>
                    <Text size="sm">Modo de Teste</Text>
                </Group>
                <Switch
                    checked={provider.testMode}
                    onChange={(e) => handleToggleTestMode(e.currentTarget.checked)}
                    color="yellow"
                    size="sm"
                />
            </Group>

            {provider.testMode && (
                <Alert color="yellow" variant="light" mb="md" icon={<IconAlertTriangle size={16} />}>
                    <Text size="xs">Modo de teste ativo. Pagamentos não serão processados de verdade.</Text>
                </Alert>
            )}

            <Divider my="md" />

            {/* Credentials */}
            <Stack gap="md">
                <Group justify="space-between">
                    <Text size="sm" fw={500}>Credenciais</Text>
                    <Group gap="xs">
                        {!editing && (
                            <ActionIcon
                                variant="light"
                                color="gray"
                                size="sm"
                                onClick={() => setShowSecrets(!showSecrets)}
                            >
                                {showSecrets ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                            </ActionIcon>
                        )}
                        {editing ? (
                            <Group gap={4}>
                                <Button size="xs" variant="light" onClick={() => setEditing(false)}>
                                    Cancelar
                                </Button>
                                <Button size="xs" onClick={handleSave}>
                                    Salvar
                                </Button>
                            </Group>
                        ) : (
                            <Button size="xs" variant="light" onClick={() => setEditing(true)}>
                                Editar
                            </Button>
                        )}
                    </Group>
                </Group>

                {/* Provider-specific fields */}
                {provider.id === 'stripe' && (
                    <Stack gap="sm">
                        {renderCredentialField('Publishable Key', 'publicKey')}
                        {renderCredentialField('Secret Key', 'secretKey', true)}
                        {renderCredentialField('Webhook Secret', 'webhookSecret', true)}
                    </Stack>
                )}

                {provider.id === 'asaas' && (
                    <Stack gap="sm">
                        {renderCredentialField('Access Token', 'accessToken', true)}
                    </Stack>
                )}

                {provider.id === 'mercado_pago' && (
                    <Stack gap="sm">
                        {renderCredentialField('Public Key', 'publicKey')}
                        {renderCredentialField('Access Token', 'accessToken', true)}
                    </Stack>
                )}

                {provider.id === 'pagseguro' && (
                    <Stack gap="sm">
                        {renderCredentialField('Access Token', 'accessToken', true)}
                    </Stack>
                )}

                {provider.id === 'pagarme' && (
                    <Stack gap="sm">
                        {renderCredentialField('Public Key', 'publicKey')}
                        {renderCredentialField('Secret Key', 'secretKey', true)}
                    </Stack>
                )}
            </Stack>

            <Divider my="md" />

            {/* Webhook URL */}
            <div>
                <Text size="xs" fw={500} c="dimmed" mb={4}>Webhook URL</Text>
                <Group gap="xs">
                    <Code style={{ flex: 1, fontSize: 11 }}>{provider.webhookUrl}</Code>
                    <CopyButton value={provider.webhookUrl}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copiado!' : 'Copiar'}>
                                <ActionIcon variant="light" color={copied ? 'green' : 'gray'} size="sm" onClick={copy}>
                                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                </Group>
            </div>

            <Divider my="md" />

            {/* Actions */}
            <Group justify="space-between">
                <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconExternalLink size={14} />}
                    component="a"
                    href={provider.docUrl}
                    target="_blank"
                >
                    Documentação
                </Button>
                <Group gap="xs">
                    {provider.lastTested && (
                        <Text size="xs" c="dimmed">
                            Testado: {new Date(provider.lastTested).toLocaleString('pt-BR')}
                        </Text>
                    )}
                    <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconTestPipe size={14} />}
                        onClick={() => onTest(provider.id)}
                        disabled={!provider.enabled}
                    >
                        Testar Conexão
                    </Button>
                </Group>
            </Group>
        </Card>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PaymentSettingsPage() {
    const [providers, setProviders] = useState<ProviderCredentials[]>(INITIAL_PROVIDERS);
    const [testing, setTesting] = useState<PaymentProvider | null>(null);

    const handleUpdateProvider = (id: PaymentProvider, updates: Partial<ProviderCredentials>) => {
        setProviders(providers.map(p =>
            p.id === id ? { ...p, ...updates } : p
        ));
    };

    const handleTestProvider = async (id: PaymentProvider) => {
        setTesting(id);

        // Simulate API test
        await new Promise(resolve => setTimeout(resolve, 2000));

        const success = Math.random() > 0.2; // 80% success rate for demo

        handleUpdateProvider(id, {
            lastTested: new Date().toISOString(),
            testResult: success ? 'success' : 'failed',
        });

        setTesting(null);

        notifications.show({
            title: success ? 'Conexão OK!' : 'Falha na Conexão',
            message: success
                ? `${providers.find(p => p.id === id)?.name} conectado com sucesso`
                : 'Verifique suas credenciais e tente novamente',
            color: success ? 'green' : 'red',
        });
    };

    const enabledCount = providers.filter(p => p.enabled).length;
    const activeCount = providers.filter(p => p.enabled && p.testResult === 'success').length;

    return (
        <Container fluid px="lg" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Group gap="md" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            component={Link}
                            href="/staff/payments"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>⚙️ Configuração de Provedores</Title>
                    <Text c="dimmed">Gerencie credenciais e webhooks dos gateways de pagamento</Text>
                </div>
                <Group>
                    <Badge color="green" size="lg" variant="light">
                        {activeCount} ativos
                    </Badge>
                    <Badge color="gray" size="lg" variant="light">
                        {enabledCount} habilitados
                    </Badge>
                </Group>
            </Group>

            {/* Status Alert */}
            {activeCount === enabledCount && enabledCount > 0 ? (
                <Alert color="green" variant="light" mb="lg" icon={<IconShieldCheck size={20} />}>
                    <Text size="sm">
                        Todos os provedores habilitados estão funcionando corretamente.
                    </Text>
                </Alert>
            ) : enabledCount > activeCount ? (
                <Alert color="orange" variant="light" mb="lg" icon={<IconAlertTriangle size={20} />}>
                    <Text size="sm">
                        Alguns provedores precisam de atenção. Verifique as credenciais e teste novamente.
                    </Text>
                </Alert>
            ) : (
                <Alert color="blue" variant="light" mb="lg" icon={<IconCreditCard size={20} />}>
                    <Text size="sm">
                        Configure pelo menos um provedor para começar a receber pagamentos.
                    </Text>
                </Alert>
            )}

            {/* Quick Setup Guide */}
            <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
                <Accordion>
                    <Accordion.Item value="setup">
                        <Accordion.Control icon={<IconKey size={16} />}>
                            <Text fw={500}>Guia Rápido de Configuração</Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="md">
                                <div>
                                    <Text fw={500} size="sm" mb="xs">1. Escolha seus provedores</Text>
                                    <Text size="xs" c="dimmed">
                                        Recomendamos ter pelo menos 2 provedores ativos para redundância.
                                        Asaas + Stripe é uma combinação popular.
                                    </Text>
                                </div>
                                <div>
                                    <Text fw={500} size="sm" mb="xs">2. Configure as credenciais</Text>
                                    <Text size="xs" c="dimmed">
                                        Acesse o painel de desenvolvedor de cada provedor para obter as chaves de API.
                                        Comece sempre no modo de teste.
                                    </Text>
                                </div>
                                <div>
                                    <Text fw={500} size="sm" mb="xs">3. Configure os webhooks</Text>
                                    <Text size="xs" c="dimmed">
                                        Copie a URL do webhook e configure no painel do provedor.
                                        Isso permite receber notificações de pagamento em tempo real.
                                    </Text>
                                </div>
                                <div>
                                    <Text fw={500} size="sm" mb="xs">4. Teste a conexão</Text>
                                    <Text size="xs" c="dimmed">
                                        Use o botão "Testar Conexão" para verificar se as credenciais estão corretas.
                                        Quando estiver funcionando, desative o modo de teste para produção.
                                    </Text>
                                </div>
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Card>

            {/* Provider Cards */}
            <SimpleGrid cols={{ base: 1, lg: 2 }}>
                {providers.map(provider => (
                    <ProviderConfigCard
                        key={provider.id}
                        provider={provider}
                        onUpdate={handleUpdateProvider}
                        onTest={handleTestProvider}
                    />
                ))}
            </SimpleGrid>

            {/* Security Note */}
            <Alert color="gray" variant="light" mt="lg" icon={<IconShieldCheck size={16} />}>
                <Text size="xs">
                    <strong>Segurança:</strong> Suas chaves secretas são criptografadas antes de serem armazenadas.
                    Nunca compartilhe suas credenciais. Use variáveis de ambiente em produção.
                </Text>
            </Alert>
        </Container>
    );
}

