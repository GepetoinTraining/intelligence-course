'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, Select, Button, TextInput, PasswordInput, Switch, Alert,
    Tabs, ThemeIcon, Divider, Accordion, Code, CopyButton, ActionIcon, Tooltip,
    Progress, Modal, Stepper, Timeline, Table
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconArrowLeft, IconCheck, IconX, IconKey, IconTestPipe,
    IconCreditCard, IconBuildingBank, IconSettings, IconShieldCheck,
    IconCopy, IconEye, IconEyeOff, IconExternalLink, IconRefresh,
    IconAlertTriangle, IconPlugConnected, IconCurrencyReal, IconReceipt,
    IconFileInvoice, IconMail, IconBrandWhatsapp, IconWorld, IconLock,
    IconInfoCircle, IconDatabase, IconApi, IconWebhook
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

type PaymentProvider = 'stripe' | 'asaas' | 'mercado_pago' | 'pagseguro' | 'pagarme';
type BrazilianBank = 'bb' | 'itau' | 'bradesco' | 'santander' | 'nubank' | 'caixa' | 'inter' | 'sicoob' | 'sicredi' | 'safra';

interface ProviderConfig {
    id: PaymentProvider;
    name: string;
    logo: string;
    description: string;
    docUrl: string;
    enabled: boolean;
    testMode: boolean;
    connected: boolean;
    lastTested?: string;
    supportedMethods: string[];
}

interface BankConfig {
    id: BrazilianBank;
    name: string;
    logo: string;
    description: string;
    docUrl: string;
    enabled: boolean;
    connected: boolean;
    lastSync?: string;
    features: string[];
    openFinanceCompliant: boolean;
}

interface BusinessSettings {
    companyName: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    pixKey: string;
    pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    defaultPaymentMethod: string;
    defaultProvider: PaymentProvider;
    invoiceDueDays: number;
    autoReminders: boolean;
    reminderDays: number[];
}

// ============================================================================
// CONFIG
// ============================================================================

const PAYMENT_PROVIDERS: ProviderConfig[] = [
    {
        id: 'stripe',
        name: 'Stripe',
        logo: '💳',
        description: 'Plataforma global com PIX e cartões no Brasil',
        docUrl: 'https://stripe.com/docs',
        enabled: true,
        testMode: true,
        connected: true,
        lastTested: '2026-02-05T00:10:00',
        supportedMethods: ['PIX', 'Cartão Crédito', 'Cartão Débito'],
    },
    {
        id: 'asaas',
        name: 'Asaas',
        logo: '🅰️',
        description: 'Cobranças automatizadas para PMEs',
        docUrl: 'https://docs.asaas.com',
        enabled: true,
        testMode: true,
        connected: true,
        lastTested: '2026-02-05T00:08:00',
        supportedMethods: ['PIX', 'Boleto', 'Cartão Crédito'],
    },
    {
        id: 'mercado_pago',
        name: 'Mercado Pago',
        logo: '🤝',
        description: 'Maior provedor da América Latina',
        docUrl: 'https://www.mercadopago.com.br/developers',
        enabled: true,
        testMode: false,
        connected: true,
        lastTested: '2026-02-04T22:30:00',
        supportedMethods: ['PIX', 'Boleto', 'Cartão', 'Débito', 'Parcelado'],
    },
    {
        id: 'pagseguro',
        name: 'PagSeguro',
        logo: '🔒',
        description: 'Provedor tradicional brasileiro',
        docUrl: 'https://dev.pagseguro.uol.com.br',
        enabled: false,
        testMode: true,
        connected: false,
        supportedMethods: ['PIX', 'Boleto', 'Cartão'],
    },
    {
        id: 'pagarme',
        name: 'Pagar.me',
        logo: '💰',
        description: 'API developer-friendly by Stone',
        docUrl: 'https://docs.pagar.me',
        enabled: false,
        testMode: true,
        connected: false,
        supportedMethods: ['PIX', 'Boleto', 'Cartão'],
    },
];

const BRAZILIAN_BANKS: BankConfig[] = [
    {
        id: 'bb',
        name: 'Banco do Brasil',
        logo: '🏦',
        description: 'APIs para Pix, cobranças e extrato via portal developers',
        docUrl: 'https://developers.bb.com.br',
        enabled: true,
        connected: true,
        lastSync: '2026-02-05T00:00:00',
        features: ['PIX API', 'Cobranças', 'Extrato', 'Pagamentos em Lote'],
        openFinanceCompliant: true,
    },
    {
        id: 'itau',
        name: 'Itaú Unibanco',
        logo: '🟠',
        description: 'Portfolio completo: Pix, Cartões, Empréstimos, Garantias',
        docUrl: 'https://developer.itau.com.br',
        enabled: true,
        connected: true,
        lastSync: '2026-02-04T23:45:00',
        features: ['PIX API', 'Payment Initiation', 'Cartões', 'Crédito Consignado'],
        openFinanceCompliant: true,
    },
    {
        id: 'bradesco',
        name: 'Bradesco',
        logo: '🔴',
        description: 'APIs para Pix QR Code, transferências e débito em veículo',
        docUrl: 'https://api.bradesco',
        enabled: true,
        connected: false,
        features: ['PIX QR Code', 'Transferências', 'Cobranças', 'Pagamentos de Conta'],
        openFinanceCompliant: true,
    },
    {
        id: 'santander',
        name: 'Santander Brasil',
        logo: '🔴',
        description: 'Open Banking com saldos, extratos e iniciação de pagamentos',
        docUrl: 'https://developer.santander.com.br',
        enabled: false,
        connected: false,
        features: ['PIX', 'Saldos', 'Extratos', 'Payment Initiation'],
        openFinanceCompliant: true,
    },
    {
        id: 'nubank',
        name: 'Nubank',
        logo: '💜',
        description: 'Open Finance com FAPI security, OAuth 2.0 e OpenID Connect',
        docUrl: 'https://nubank.com.br/open-finance',
        enabled: true,
        connected: true,
        lastSync: '2026-02-05T00:05:00',
        features: ['Open Finance', 'Saldos', 'Histórico', 'Crédito Pessoal'],
        openFinanceCompliant: true,
    },
    {
        id: 'caixa',
        name: 'Caixa Econômica',
        logo: '🔵',
        description: 'APIs corporativas para boleto e Pix',
        docUrl: 'https://caixadesenvolvedor.com.br',
        enabled: false,
        connected: false,
        features: ['PIX', 'Boleto', 'FGTS API'],
        openFinanceCompliant: true,
    },
    {
        id: 'inter',
        name: 'Banco Inter',
        logo: '🟠',
        description: 'API digital-first para fintechs e startups',
        docUrl: 'https://developers.inter.co',
        enabled: true,
        connected: false,
        features: ['PIX', 'Boleto', 'Cobranças', 'Extrato'],
        openFinanceCompliant: true,
    },
    {
        id: 'sicoob',
        name: 'Sicoob',
        logo: '🟢',
        description: 'Sistema cooperativo com APIs Open Banking',
        docUrl: 'https://developers.sicoob.com.br',
        enabled: false,
        connected: false,
        features: ['PIX', 'Boleto', 'Open Banking'],
        openFinanceCompliant: true,
    },
    {
        id: 'sicredi',
        name: 'Sicredi',
        logo: '🟢',
        description: 'Cooperativa de crédito com APIs modernas',
        docUrl: 'https://developer.sicredi.com.br',
        enabled: false,
        connected: false,
        features: ['PIX', 'Cobranças', 'Open Finance'],
        openFinanceCompliant: true,
    },
    {
        id: 'safra',
        name: 'Banco Safra',
        logo: '🔵',
        description: 'APIs corporativas e Open Banking',
        docUrl: 'https://developer.safra.com.br',
        enabled: false,
        connected: false,
        features: ['PIX', 'Open Banking', 'Investimentos'],
        openFinanceCompliant: true,
    },
];

const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
    companyName: 'Escola de Idiomas Node Zero',
    cnpj: '12.345.678/0001-90',
    email: 'financeiro@nodezero.com.br',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    pixKey: 'financeiro@nodezero.com.br',
    pixKeyType: 'email',
    defaultPaymentMethod: 'pix',
    defaultProvider: 'asaas',
    invoiceDueDays: 10,
    autoReminders: true,
    reminderDays: [3, 1, 0],
};

// ============================================================================
// PROVIDER CARD COMPONENT
// ============================================================================

function ProviderCard({
    provider,
    onToggle,
    onConfigure,
}: {
    provider: ProviderConfig;
    onToggle: (id: PaymentProvider) => void;
    onConfigure: (id: PaymentProvider) => void;
}) {
    return (
        <Paper p="md" withBorder radius="md">
            <Group justify="space-between" mb="sm">
                <Group gap="sm">
                    <Text size="xl">{provider.logo}</Text>
                    <div>
                        <Group gap={4}>
                            <Text fw={600} size="sm">{provider.name}</Text>
                            {provider.connected && (
                                <ThemeIcon color="green" variant="light" size="xs" radius="xl">
                                    <IconCheck size={10} />
                                </ThemeIcon>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed">{provider.description}</Text>
                    </div>
                </Group>
                <Switch
                    checked={provider.enabled}
                    onChange={() => onToggle(provider.id)}
                    size="sm"
                />
            </Group>
            <Group gap={4} mb="sm">
                {provider.supportedMethods.map(method => (
                    <Badge key={method} size="xs" variant="light" color="blue">
                        {method}
                    </Badge>
                ))}
            </Group>
            <Group justify="space-between">
                <Group gap={4}>
                    {provider.testMode && (
                        <Badge size="xs" color="yellow" variant="light">Teste</Badge>
                    )}
                    {provider.connected && (
                        <Badge size="xs" color="green" variant="light">Conectado</Badge>
                    )}
                </Group>
                <Button
                    size="xs"
                    variant="light"
                    onClick={() => onConfigure(provider.id)}
                    leftSection={<IconSettings size={12} />}
                >
                    Configurar
                </Button>
            </Group>
        </Paper>
    );
}

// ============================================================================
// BANK CARD COMPONENT
// ============================================================================

function BankCard({
    bank,
    onToggle,
    onConnect,
}: {
    bank: BankConfig;
    onToggle: (id: BrazilianBank) => void;
    onConnect: (id: BrazilianBank) => void;
}) {
    return (
        <Paper p="md" withBorder radius="md">
            <Group justify="space-between" mb="sm">
                <Group gap="sm">
                    <Text size="xl">{bank.logo}</Text>
                    <div>
                        <Group gap={4}>
                            <Text fw={600} size="sm">{bank.name}</Text>
                            {bank.openFinanceCompliant && (
                                <Tooltip label="Open Finance Compliant">
                                    <ThemeIcon color="teal" variant="light" size="xs" radius="xl">
                                        <IconShieldCheck size={10} />
                                    </ThemeIcon>
                                </Tooltip>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={1}>{bank.description}</Text>
                    </div>
                </Group>
                <Switch
                    checked={bank.enabled}
                    onChange={() => onToggle(bank.id)}
                    size="sm"
                />
            </Group>
            <Group gap={4} mb="sm" wrap="wrap">
                {bank.features.slice(0, 3).map(feature => (
                    <Badge key={feature} size="xs" variant="light" color="gray">
                        {feature}
                    </Badge>
                ))}
                {bank.features.length > 3 && (
                    <Badge size="xs" variant="light" color="gray">+{bank.features.length - 3}</Badge>
                )}
            </Group>
            <Group justify="space-between">
                {bank.connected ? (
                    <Group gap={4}>
                        <Badge size="xs" color="green" variant="light">Conectado</Badge>
                        {bank.lastSync && (
                            <Text size="xs" c="dimmed">
                                Sync: {new Date(bank.lastSync).toLocaleTimeString('pt-BR')}
                            </Text>
                        )}
                    </Group>
                ) : (
                    <Text size="xs" c="dimmed">Não conectado</Text>
                )}
                <Button
                    size="xs"
                    variant={bank.connected ? 'light' : 'filled'}
                    onClick={() => onConnect(bank.id)}
                    leftSection={<IconPlugConnected size={12} />}
                    disabled={!bank.enabled}
                >
                    {bank.connected ? 'Reconectar' : 'Conectar'}
                </Button>
            </Group>
        </Paper>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function BusinessSettingsPage() {
    const [activeTab, setActiveTab] = useState<string | null>('payments');
    const [providers, setProviders] = useState<ProviderConfig[]>(PAYMENT_PROVIDERS);
    const [banks, setBanks] = useState<BankConfig[]>(BRAZILIAN_BANKS);
    const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_BUSINESS_SETTINGS);
    const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] = useDisclosure(false);
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);

    // Stats
    const connectedProviders = providers.filter(p => p.connected).length;
    const enabledProviders = providers.filter(p => p.enabled).length;
    const connectedBanks = banks.filter(b => b.connected).length;
    const enabledBanks = banks.filter(b => b.enabled).length;

    // Handlers
    const handleToggleProvider = (id: PaymentProvider) => {
        setProviders(providers.map(p =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
        ));
    };

    const handleConfigureProvider = (id: PaymentProvider) => {
        setSelectedProvider(id);
        openConfigModal();
    };

    const handleToggleBank = (id: BrazilianBank) => {
        setBanks(banks.map(b =>
            b.id === id ? { ...b, enabled: !b.enabled } : b
        ));
    };

    const handleConnectBank = async (id: BrazilianBank) => {
        // Simulate OAuth flow
        notifications.show({
            title: 'Iniciando conexão...',
            message: `Redirecionando para ${banks.find(b => b.id === id)?.name}`,
            loading: true,
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        setBanks(banks.map(b =>
            b.id === id ? { ...b, connected: true, lastSync: new Date().toISOString() } : b
        ));

        notifications.show({
            title: 'Conectado!',
            message: `${banks.find(b => b.id === id)?.name} conectado com sucesso`,
            color: 'green',
        });
    };

    const handleSaveSettings = () => {
        notifications.show({
            title: 'Configurações salvas',
            message: 'As configurações do negócio foram atualizadas',
            color: 'green',
        });
    };

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
                            href="/owner"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>⚙️ Configurações do Negócio</Title>
                    <Text c="dimmed">Pagamentos, bancos e integrações financeiras</Text>
                </div>
                <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={handleSaveSettings}
                >
                    Salvar Alterações
                </Button>
            </Group>

            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Provedores Ativos</Text>
                        <ThemeIcon variant="light" color="blue" size="md">
                            <IconCreditCard size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>{connectedProviders}/{enabledProviders}</Text>
                    <Progress
                        value={enabledProviders > 0 ? (connectedProviders / enabledProviders) * 100 : 0}
                        color="blue"
                        size="sm"
                        mt="xs"
                    />
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Bancos Conectados</Text>
                        <ThemeIcon variant="light" color="teal" size="md">
                            <IconBuildingBank size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>{connectedBanks}/{enabledBanks}</Text>
                    <Progress
                        value={enabledBanks > 0 ? (connectedBanks / enabledBanks) * 100 : 0}
                        color="teal"
                        size="sm"
                        mt="xs"
                    />
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Open Finance</Text>
                        <ThemeIcon variant="light" color="green" size="md">
                            <IconShieldCheck size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {banks.filter(b => b.openFinanceCompliant && b.connected).length}
                    </Text>
                    <Text size="xs" c="dimmed">bancos integrados</Text>
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Chave PIX</Text>
                        <ThemeIcon variant="light" color="violet" size="md">
                            <IconCurrencyReal size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="sm" fw={500} truncate>{settings.pixKey}</Text>
                    <Badge size="xs" color="violet" variant="light" mt="xs">
                        {settings.pixKeyType.toUpperCase()}
                    </Badge>
                </Paper>
            </SimpleGrid>

            {/* Main Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                    <Tabs.Tab value="payments" leftSection={<IconCreditCard size={14} />}>
                        Provedores de Pagamento
                    </Tabs.Tab>
                    <Tabs.Tab value="banks" leftSection={<IconBuildingBank size={14} />}>
                        Bancos & Open Finance
                    </Tabs.Tab>
                    <Tabs.Tab value="business" leftSection={<IconFileInvoice size={14} />}>
                        Dados do Negócio
                    </Tabs.Tab>
                    <Tabs.Tab value="invoicing" leftSection={<IconReceipt size={14} />}>
                        Faturamento
                    </Tabs.Tab>
                </Tabs.List>

                {/* Payment Providers Tab */}
                <Tabs.Panel value="payments">
                    <Alert color="blue" variant="light" mb="lg" icon={<IconInfoCircle size={16} />}>
                        <Text size="sm">
                            Configure múltiplos provedores para redundância. Recomendamos ter pelo menos 2 ativos.
                            Taxas variam: PIX (0.4-2%), Cartão (3-5%), Boleto (2.5-3.5%).
                        </Text>
                    </Alert>

                    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
                        {providers.map(provider => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                onToggle={handleToggleProvider}
                                onConfigure={handleConfigureProvider}
                            />
                        ))}
                    </SimpleGrid>

                    {/* Fee Comparison */}
                    <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
                        <Text fw={600} mb="md">📊 Comparativo de Taxas</Text>
                        <Table.ScrollContainer minWidth={500}>
                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Provedor</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>PIX</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Cartão</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Boleto</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Status</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td><Group gap={4}><Text>💳</Text><Text size="sm">Stripe</Text></Group></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">0.4%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="yellow" size="xs">3.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Text size="xs" c="dimmed">-</Text></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">Ativo</Badge></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Group gap={4}><Text>🅰️</Text><Text size="sm">Asaas</Text></Group></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="yellow" size="xs">1.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">3.49%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">2.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">Ativo</Badge></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Group gap={4}><Text>🤝</Text><Text size="sm">Mercado Pago</Text></Group></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">0.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="orange" size="xs">4.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="yellow" size="xs">3.49%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">Ativo</Badge></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Group gap={4}><Text>🔒</Text><Text size="sm">PagSeguro</Text></Group></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">0.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="orange" size="xs">4.79%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">2.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="gray" size="xs">Inativo</Badge></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Group gap={4}><Text>💰</Text><Text size="sm">Pagar.me</Text></Group></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">0.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="green" size="xs">2.99%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="yellow" size="xs">3.49%</Badge></Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}><Badge color="gray" size="xs">Inativo</Badge></Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>
                </Tabs.Panel>

                {/* Banks Tab */}
                <Tabs.Panel value="banks">
                    <Alert color="teal" variant="light" mb="lg" icon={<IconShieldCheck size={16} />}>
                        <Text size="sm">
                            <strong>Open Finance Brasil:</strong> Todos os bancos listados são compatíveis com o Open Finance,
                            permitindo acesso seguro a saldos, extratos e iniciação de pagamentos via APIs padronizadas (FAPI).
                        </Text>
                    </Alert>

                    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
                        {banks.map(bank => (
                            <BankCard
                                key={bank.id}
                                bank={bank}
                                onToggle={handleToggleBank}
                                onConnect={handleConnectBank}
                            />
                        ))}
                    </SimpleGrid>

                    {/* Open Finance Info */}
                    <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
                        <Accordion>
                            <Accordion.Item value="openfinance">
                                <Accordion.Control icon={<IconWorld size={16} />}>
                                    <Text fw={500}>O que é Open Finance Brasil?</Text>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="md">
                                        <Text size="sm">
                                            O Open Finance é uma iniciativa do Banco Central do Brasil que permite o compartilhamento
                                            padronizado de dados e serviços financeiros entre instituições, sempre com o consentimento do cliente.
                                        </Text>
                                        <SimpleGrid cols={2}>
                                            <Paper p="sm" withBorder>
                                                <Text size="xs" fw={500} mb={4}>✅ Benefícios</Text>
                                                <Stack gap={2}>
                                                    <Text size="xs">• Consulta de saldos em tempo real</Text>
                                                    <Text size="xs">• Conciliação bancária automática</Text>
                                                    <Text size="xs">• Iniciação de pagamentos via API</Text>
                                                    <Text size="xs">• Histórico unificado de transações</Text>
                                                </Stack>
                                            </Paper>
                                            <Paper p="sm" withBorder>
                                                <Text size="xs" fw={500} mb={4}>🔒 Segurança</Text>
                                                <Stack gap={2}>
                                                    <Text size="xs">• OAuth 2.0 + OpenID Connect</Text>
                                                    <Text size="xs">• FAPI (Financial-grade API)</Text>
                                                    <Text size="xs">• Consentimento explícito do cliente</Text>
                                                    <Text size="xs">• Auditoria pelo Banco Central</Text>
                                                </Stack>
                                            </Paper>
                                        </SimpleGrid>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    </Card>
                </Tabs.Panel>

                {/* Business Data Tab */}
                <Tabs.Panel value="business">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Text fw={600} mb="lg">🏢 Dados da Empresa</Text>
                        <SimpleGrid cols={{ base: 1, md: 2 }}>
                            <TextInput
                                label="Nome da Empresa"
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                            />
                            <TextInput
                                label="CNPJ"
                                value={settings.cnpj}
                                onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                            />
                            <TextInput
                                label="Email Financeiro"
                                type="email"
                                value={settings.email}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                            />
                            <TextInput
                                label="Telefone"
                                value={settings.phone}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            />
                            <TextInput
                                label="Endereço"
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                style={{ gridColumn: 'span 2' }}
                            />
                        </SimpleGrid>

                        <Divider my="lg" label="Chave PIX" labelPosition="center" />

                        <SimpleGrid cols={{ base: 1, md: 2 }}>
                            <Select
                                label="Tipo de Chave PIX"
                                value={settings.pixKeyType}
                                onChange={(v) => setSettings({ ...settings, pixKeyType: v as any })}
                                data={[
                                    { value: 'cpf', label: 'CPF' },
                                    { value: 'cnpj', label: 'CNPJ' },
                                    { value: 'email', label: 'Email' },
                                    { value: 'phone', label: 'Telefone' },
                                    { value: 'random', label: 'Chave Aleatória' },
                                ]}
                            />
                            <TextInput
                                label="Chave PIX"
                                value={settings.pixKey}
                                onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })}
                                rightSection={
                                    <CopyButton value={settings.pixKey}>
                                        {({ copied, copy }) => (
                                            <ActionIcon variant="subtle" onClick={copy}>
                                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                            </ActionIcon>
                                        )}
                                    </CopyButton>
                                }
                            />
                        </SimpleGrid>
                    </Card>
                </Tabs.Panel>

                {/* Invoicing Tab */}
                <Tabs.Panel value="invoicing">
                    <SimpleGrid cols={{ base: 1, lg: 2 }}>
                        <Card shadow="sm" p="lg" radius="md" withBorder>
                            <Text fw={600} mb="lg">📄 Configurações de Cobrança</Text>
                            <Stack gap="md">
                                <Select
                                    label="Método de Pagamento Padrão"
                                    value={settings.defaultPaymentMethod}
                                    onChange={(v) => setSettings({ ...settings, defaultPaymentMethod: v || 'pix' })}
                                    data={[
                                        { value: 'pix', label: '⚡ PIX' },
                                        { value: 'boleto', label: '📄 Boleto' },
                                        { value: 'credit_card', label: '💳 Cartão de Crédito' },
                                    ]}
                                />
                                <Select
                                    label="Provedor Padrão"
                                    value={settings.defaultProvider}
                                    onChange={(v) => setSettings({ ...settings, defaultProvider: v as PaymentProvider })}
                                    data={providers.filter(p => p.enabled).map(p => ({
                                        value: p.id,
                                        label: `${p.logo} ${p.name}`,
                                    }))}
                                />
                                <TextInput
                                    label="Dias até Vencimento"
                                    type="number"
                                    value={settings.invoiceDueDays}
                                    onChange={(e) => setSettings({ ...settings, invoiceDueDays: parseInt(e.target.value) || 10 })}
                                    description="Dias após criação da fatura para vencimento"
                                />
                            </Stack>
                        </Card>

                        <Card shadow="sm" p="lg" radius="md" withBorder>
                            <Text fw={600} mb="lg">🔔 Lembretes Automáticos</Text>
                            <Stack gap="md">
                                <Switch
                                    label="Ativar lembretes automáticos"
                                    description="Envia lembretes por WhatsApp e email antes do vencimento"
                                    checked={settings.autoReminders}
                                    onChange={(e) => setSettings({ ...settings, autoReminders: e.currentTarget.checked })}
                                />

                                {settings.autoReminders && (
                                    <Stack gap="xs">
                                        <Text size="sm" c="dimmed">Enviar lembretes:</Text>
                                        {[3, 1, 0].map(days => (
                                            <Paper key={days} p="sm" withBorder>
                                                <Group justify="space-between">
                                                    <Group gap="xs">
                                                        <ThemeIcon variant="light" size="sm" color={days === 0 ? 'red' : 'blue'}>
                                                            {days === 0 ? <IconAlertTriangle size={12} /> : <IconMail size={12} />}
                                                        </ThemeIcon>
                                                        <Text size="sm">
                                                            {days === 0
                                                                ? 'No dia do vencimento'
                                                                : `${days} dia${days > 1 ? 's' : ''} antes`}
                                                        </Text>
                                                    </Group>
                                                    <Group gap={4}>
                                                        <Badge size="xs" color="green" variant="light">
                                                            <IconBrandWhatsapp size={10} /> WhatsApp
                                                        </Badge>
                                                        <Badge size="xs" color="blue" variant="light">
                                                            <IconMail size={10} /> Email
                                                        </Badge>
                                                    </Group>
                                                </Group>
                                            </Paper>
                                        ))}
                                    </Stack>
                                )}
                            </Stack>
                        </Card>
                    </SimpleGrid>

                    {/* Webhook Info */}
                    <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
                        <Text fw={600} mb="md">🔗 Webhooks Configurados</Text>
                        <Text size="sm" c="dimmed" mb="md">
                            Endpoints para receber notificações de pagamento em tempo real:
                        </Text>
                        <Stack gap="sm">
                            {['stripe', 'asaas', 'mercadopago', 'pagseguro', 'pagarme'].map(provider => (
                                <Paper key={provider} p="sm" withBorder>
                                    <Group justify="space-between">
                                        <Group gap="xs">
                                            <ThemeIcon variant="light" size="sm" color="violet">
                                                <IconWebhook size={12} />
                                            </ThemeIcon>
                                            <Text size="sm" tt="capitalize">{provider}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Code c="dimmed">
                                                /api/webhooks/{provider}
                                            </Code>
                                            <CopyButton value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${provider}`}>
                                                {({ copied, copy }) => (
                                                    <ActionIcon variant="subtle" size="sm" onClick={copy}>
                                                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                                    </ActionIcon>
                                                )}
                                            </CopyButton>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </Card>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}

