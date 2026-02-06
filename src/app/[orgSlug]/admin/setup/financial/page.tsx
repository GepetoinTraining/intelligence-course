'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container, Title, Text, Card, Stack, Group, Button, Badge,
    ThemeIcon, Paper, Divider, Box, TextInput, Select, Switch,
    SimpleGrid, ActionIcon, Modal, Textarea, Alert, Tabs,
    NumberInput, PasswordInput, CopyButton, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconBuildingBank, IconPlus, IconEdit, IconTrash, IconArrowLeft,
    IconCheck, IconCreditCard, IconReceipt, IconLink, IconKey,
    IconCopy, IconExternalLink, IconShieldCheck, IconAlertCircle,
    IconCertificate2, IconUpload, IconLock, IconEye, IconEyeOff
} from '@tabler/icons-react';
import { useOrg } from '@/components/OrgContext';

// Bank accounts
const DEFAULT_ACCOUNTS = [
    {
        id: '1',
        bank: 'Banco do Brasil',
        bankCode: '001',
        agency: '1234-5',
        account: '12345-6',
        type: 'checking',
        holder: 'Eco Escola LTDA',
        cnpj: '12.345.678/0001-00',
        isPrimary: true,
        pixKey: '12345678000100',
        pixType: 'cnpj',
    },
    {
        id: '2',
        bank: 'Nubank',
        bankCode: '260',
        agency: '0001',
        account: '98765432-1',
        type: 'checking',
        holder: 'Eco Escola LTDA',
        cnpj: '12.345.678/0001-00',
        isPrimary: false,
        pixKey: 'financeiro@ecoescola.com.br',
        pixType: 'email',
    },
];

// Payment providers
const PAYMENT_PROVIDERS = [
    {
        id: 'asaas',
        name: 'Asaas',
        description: 'Boleto, PIX e Cartão. Ideal para escolas.',
        logo: '💳',
        connected: true,
        features: ['Boleto', 'PIX', 'Cartão', 'Cobrança Recorrente', 'Split de Pagamento'],
    },
    {
        id: 'stripe',
        name: 'Stripe',
        description: 'Pagamentos internacionais e cartão.',
        logo: '🔵',
        connected: false,
        features: ['Cartão Internacional', 'Assinaturas', 'Checkout'],
    },
    {
        id: 'mercadopago',
        name: 'Mercado Pago',
        description: 'PIX, boleto e cartão com parcelamento.',
        logo: '🟡',
        connected: false,
        features: ['PIX', 'Boleto', 'Cartão', 'Parcelamento'],
    },
    {
        id: 'pagarme',
        name: 'Pagar.me',
        description: 'Gateway para escolas de grande porte.',
        logo: '🟢',
        connected: false,
        features: ['Boleto', 'PIX', 'Cartão', 'Antecipação'],
    },
];

// Fiscal integrations
const FISCAL_INTEGRATIONS = [
    {
        id: 'nfse',
        name: 'NFS-e Municipal',
        description: 'Emissão automática de notas fiscais de serviço.',
        status: 'pending',
        city: 'Joinville',
    },
    {
        id: 'sped',
        name: 'SPED Contábil',
        description: 'Exportação de dados para ECD, ECF e EFD.',
        status: 'active',
    },
];

export default function FinancialSetupPage() {
    const org = useOrg();
    const router = useRouter();
    const primaryColor = org.primaryColor || '#7048e8';

    const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
    const [providers, setProviders] = useState(PAYMENT_PROVIDERS);
    const [activeTab, setActiveTab] = useState<string | null>('accounts');
    const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [showApiKeys, setShowApiKeys] = useState(false);
    const [certificateUploaded, setCertificateUploaded] = useState(false);

    // API credentials state
    const [credentials, setCredentials] = useState({
        asaas: { apiKey: '', environment: 'sandbox', connected: true },
        openai: { apiKey: '', connected: false },
        prefeitura: { login: '', password: '', connected: false },
    });

    const connectProvider = (providerId: string) => {
        setSelectedProvider(providerId);
        openModal();
    };

    const handleConnect = () => {
        if (selectedProvider) {
            setProviders(prev => prev.map(p =>
                p.id === selectedProvider ? { ...p, connected: true } : p
            ));
        }
        closeModal();
        setSelectedProvider(null);
    };

    return (
        <Box bg="dark.9" mih="100vh">
            <Container size="lg" py="xl">
                <Stack gap="lg">
                    {/* Header */}
                    <Group justify="space-between">
                        <Group>
                            <Button
                                variant="subtle"
                                leftSection={<IconArrowLeft size={16} />}
                                onClick={() => router.push(`/${org.slug}/admin/setup`)}
                            >
                                Voltar
                            </Button>
                            <Divider orientation="vertical" />
                            <div>
                                <Text c="gray.5" size="xs">Configuração da Escola</Text>
                                <Title order={2} c="white" size="lg">
                                    Financeiro & Pagamentos
                                </Title>
                            </div>
                        </Group>
                        <Badge size="lg" color="green">
                            {accounts.length} contas cadastradas
                        </Badge>
                    </Group>

                    {/* Tabs */}
                    <Tabs value={activeTab} onChange={setActiveTab} color="green">
                        <Tabs.List>
                            <Tabs.Tab value="accounts" leftSection={<IconBuildingBank size={16} />}>
                                Contas Bancárias
                            </Tabs.Tab>
                            <Tabs.Tab value="providers" leftSection={<IconCreditCard size={16} />}>
                                Provedores
                            </Tabs.Tab>
                            <Tabs.Tab value="credentials" leftSection={<IconKey size={16} />}>
                                Credenciais & Certificado
                            </Tabs.Tab>
                            <Tabs.Tab value="fiscal" leftSection={<IconReceipt size={16} />}>
                                Integração Fiscal
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* Bank Accounts Panel */}
                        <Tabs.Panel value="accounts" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Cadastre as contas bancárias para receber pagamentos.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                    >
                                        Nova Conta
                                    </Button>
                                </Group>

                                <Stack gap="sm">
                                    {accounts.map((account) => (
                                        <Card key={account.id} bg="dark.7" radius="md" p="md">
                                            <Group justify="space-between">
                                                <Group gap="md">
                                                    <ThemeIcon
                                                        size={48}
                                                        radius="md"
                                                        color={account.isPrimary ? 'green' : 'gray'}
                                                        variant="light"
                                                    >
                                                        <IconBuildingBank size={24} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Group gap="xs">
                                                            <Text c="white" fw={600} size="sm">
                                                                {account.bank}
                                                            </Text>
                                                            {account.isPrimary && (
                                                                <Badge size="xs" color="green">
                                                                    Principal
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                        <Text c="gray.5" size="xs">
                                                            Ag: {account.agency} | Conta: {account.account}
                                                        </Text>
                                                        <Text c="gray.6" size="xs">
                                                            {account.holder}
                                                        </Text>
                                                    </div>
                                                </Group>

                                                <Group gap="md">
                                                    {account.pixKey && (
                                                        <Paper p="xs" radius="sm" bg="dark.6">
                                                            <Group gap="xs">
                                                                <Text c="gray.5" size="xs">PIX:</Text>
                                                                <Text c="white" size="xs" ff="monospace">
                                                                    {account.pixKey.length > 20
                                                                        ? account.pixKey.slice(0, 20) + '...'
                                                                        : account.pixKey
                                                                    }
                                                                </Text>
                                                                <CopyButton value={account.pixKey}>
                                                                    {({ copied, copy }) => (
                                                                        <Tooltip label={copied ? 'Copiado!' : 'Copiar'}>
                                                                            <ActionIcon
                                                                                size="xs"
                                                                                variant="subtle"
                                                                                onClick={copy}
                                                                            >
                                                                                <IconCopy size={12} />
                                                                            </ActionIcon>
                                                                        </Tooltip>
                                                                    )}
                                                                </CopyButton>
                                                            </Group>
                                                        </Paper>
                                                    )}
                                                    <Group gap="xs">
                                                        <ActionIcon variant="subtle">
                                                            <IconEdit size={16} />
                                                        </ActionIcon>
                                                        <ActionIcon variant="subtle" color="red">
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Group>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            </Stack>
                        </Tabs.Panel>

                        {/* Payment Providers Panel */}
                        <Tabs.Panel value="providers" pt="lg">
                            <Stack gap="md">
                                <Text c="gray.4" size="sm">
                                    Conecte provedores de pagamento para aceitar cartão, boleto e PIX.
                                </Text>

                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                    {providers.map((provider) => (
                                        <Card key={provider.id} bg="dark.7" radius="md" p="md">
                                            <Stack gap="md">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <Text size="xl">{provider.logo}</Text>
                                                        <div>
                                                            <Group gap="xs">
                                                                <Text c="white" fw={600} size="sm">
                                                                    {provider.name}
                                                                </Text>
                                                                {provider.connected && (
                                                                    <Badge size="xs" color="green">
                                                                        Conectado
                                                                    </Badge>
                                                                )}
                                                            </Group>
                                                            <Text c="gray.5" size="xs">
                                                                {provider.description}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                </Group>

                                                <Group gap="xs" wrap="wrap">
                                                    {provider.features.map((feature) => (
                                                        <Badge
                                                            key={feature}
                                                            size="xs"
                                                            variant="light"
                                                            color="gray"
                                                        >
                                                            {feature}
                                                        </Badge>
                                                    ))}
                                                </Group>

                                                {provider.connected ? (
                                                    <Group gap="xs">
                                                        <Button
                                                            size="xs"
                                                            variant="light"
                                                            color="green"
                                                            leftSection={<IconShieldCheck size={14} />}
                                                            flex={1}
                                                        >
                                                            Configurar
                                                        </Button>
                                                        <ActionIcon
                                                            size="md"
                                                            variant="light"
                                                            color="red"
                                                        >
                                                            <IconTrash size={14} />
                                                        </ActionIcon>
                                                    </Group>
                                                ) : (
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        leftSection={<IconLink size={14} />}
                                                        onClick={() => connectProvider(provider.id)}
                                                    >
                                                        Conectar
                                                    </Button>
                                                )}
                                            </Stack>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            </Stack>
                        </Tabs.Panel>

                        {/* Credentials & Certificate Panel */}
                        <Tabs.Panel value="credentials" pt="lg">
                            <Stack gap="lg">
                                {/* API Keys Section */}
                                <Card bg="dark.7" radius="md" p="md">
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                <ThemeIcon size={40} radius="md" color="violet" variant="light">
                                                    <IconKey size={20} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text c="white" fw={600} size="sm">Chaves de API</Text>
                                                    <Text c="gray.5" size="xs">Credenciais para integrações externas</Text>
                                                </div>
                                            </Group>
                                            <ActionIcon
                                                variant="subtle"
                                                onClick={() => setShowApiKeys(!showApiKeys)}
                                            >
                                                {showApiKeys ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                            </ActionIcon>
                                        </Group>

                                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                            {/* Asaas API */}
                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Stack gap="xs">
                                                    <Group justify="space-between">
                                                        <Group gap="xs">
                                                            <Text size="xl">💳</Text>
                                                            <Text c="white" size="sm" fw={500}>Asaas</Text>
                                                        </Group>
                                                        <Badge size="xs" color={credentials.asaas.connected ? 'green' : 'gray'}>
                                                            {credentials.asaas.connected ? 'Conectado' : 'Não configurado'}
                                                        </Badge>
                                                    </Group>
                                                    <TextInput
                                                        size="xs"
                                                        placeholder="$aact_YTU5YTE0..."
                                                        type={showApiKeys ? 'text' : 'password'}
                                                        value={credentials.asaas.apiKey}
                                                        onChange={(e) => setCredentials(prev => ({
                                                            ...prev,
                                                            asaas: { ...prev.asaas, apiKey: e.target.value }
                                                        }))}
                                                        leftSection={<IconKey size={14} />}
                                                    />
                                                    <Select
                                                        size="xs"
                                                        data={[
                                                            { value: 'sandbox', label: 'Sandbox' },
                                                            { value: 'production', label: 'Produção' },
                                                        ]}
                                                        value={credentials.asaas.environment}
                                                        onChange={(v) => setCredentials(prev => ({
                                                            ...prev,
                                                            asaas: { ...prev.asaas, environment: v || 'sandbox' }
                                                        }))}
                                                    />
                                                </Stack>
                                            </Paper>

                                            {/* OpenAI */}
                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Stack gap="xs">
                                                    <Group justify="space-between">
                                                        <Group gap="xs">
                                                            <Text size="lg">🟢</Text>
                                                            <Text c="white" size="sm" fw={500}>OpenAI</Text>
                                                        </Group>
                                                        <Badge size="xs" color="gray">GPT-4o</Badge>
                                                    </Group>
                                                    <TextInput
                                                        size="xs"
                                                        placeholder="sk-proj-..."
                                                        type={showApiKeys ? 'text' : 'password'}
                                                        leftSection={<IconKey size={14} />}
                                                    />
                                                </Stack>
                                            </Paper>

                                            {/* Google Gemini */}
                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Stack gap="xs">
                                                    <Group justify="space-between">
                                                        <Group gap="xs">
                                                            <Text size="lg">🔵</Text>
                                                            <Text c="white" size="sm" fw={500}>Google AI</Text>
                                                        </Group>
                                                        <Badge size="xs" color="gray">Gemini 2.0</Badge>
                                                    </Group>
                                                    <TextInput
                                                        size="xs"
                                                        placeholder="AIza..."
                                                        type={showApiKeys ? 'text' : 'password'}
                                                        leftSection={<IconKey size={14} />}
                                                    />
                                                </Stack>
                                            </Paper>

                                            {/* Anthropic Claude */}
                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Stack gap="xs">
                                                    <Group justify="space-between">
                                                        <Group gap="xs">
                                                            <Text size="lg">🟠</Text>
                                                            <Text c="white" size="sm" fw={500}>Anthropic</Text>
                                                        </Group>
                                                        <Badge size="xs" color="gray">Claude 3.5</Badge>
                                                    </Group>
                                                    <TextInput
                                                        size="xs"
                                                        placeholder="sk-ant-..."
                                                        type={showApiKeys ? 'text' : 'password'}
                                                        leftSection={<IconKey size={14} />}
                                                    />
                                                </Stack>
                                            </Paper>

                                            {/* Groq */}
                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Stack gap="xs">
                                                    <Group justify="space-between">
                                                        <Group gap="xs">
                                                            <Text size="lg">⚡</Text>
                                                            <Text c="white" size="sm" fw={500}>Groq</Text>
                                                        </Group>
                                                        <Badge size="xs" color="gray">Llama 3.3</Badge>
                                                    </Group>
                                                    <TextInput
                                                        size="xs"
                                                        placeholder="gsk_..."
                                                        type={showApiKeys ? 'text' : 'password'}
                                                        leftSection={<IconKey size={14} />}
                                                    />
                                                </Stack>
                                            </Paper>
                                            {/* Meta WhatsApp Business */}
                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Stack gap="xs">
                                                    <Group justify="space-between">
                                                        <Group gap="xs">
                                                            <Text size="lg">💬</Text>
                                                            <Text c="white" size="sm" fw={500}>Meta</Text>
                                                        </Group>
                                                        <Badge size="xs" color="gray">WhatsApp API</Badge>
                                                    </Group>
                                                    <TextInput
                                                        size="xs"
                                                        placeholder="EAAGm..."
                                                        type={showApiKeys ? 'text' : 'password'}
                                                        leftSection={<IconKey size={14} />}
                                                    />
                                                    <Text c="gray.6" size="xs">
                                                        WhatsApp Business para comunicação com responsáveis
                                                    </Text>
                                                </Stack>
                                            </Paper>
                                        </SimpleGrid>

                                        <Alert variant="light" color="blue" p="xs">
                                            <Text size="xs">
                                                <strong>Recursos de IA:</strong> Assistente pedagógico, análise de desempenho,
                                                geração de conteúdo, chatbot para alunos. Configure ao menos um provedor.
                                            </Text>
                                        </Alert>
                                    </Stack>
                                </Card>

                                {/* AI Features & Access Control */}
                                <Card bg="dark.7" radius="md" p="md">
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                <ThemeIcon size={40} radius="md" color="grape" variant="light">
                                                    <Text size="lg">🤖</Text>
                                                </ThemeIcon>
                                                <div>
                                                    <Text c="white" fw={600} size="sm">Recursos de IA</Text>
                                                    <Text c="gray.5" size="xs">Controle de acesso ao assistente de IA</Text>
                                                </div>
                                            </Group>
                                            <Switch
                                                size="md"
                                                onLabel="ON"
                                                offLabel="OFF"
                                                defaultChecked
                                            />
                                        </Group>

                                        <Divider color="dark.5" />

                                        <Text c="gray.4" size="xs" fw={500}>
                                            Quais cargos terão acesso ao Assistente de IA?
                                        </Text>

                                        <Stack gap="xs">
                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <Text size="sm">👑</Text>
                                                        <div>
                                                            <Text c="white" size="sm" fw={500}>Proprietário / Admin</Text>
                                                            <Text c="gray.6" size="xs">Acesso total a todas funcionalidades</Text>
                                                        </div>
                                                    </Group>
                                                    <Switch defaultChecked disabled size="sm" />
                                                </Group>
                                            </Paper>

                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <Text size="sm">📋</Text>
                                                        <div>
                                                            <Text c="white" size="sm" fw={500}>Coordenador</Text>
                                                            <Text c="gray.6" size="xs">Análises, relatórios, sugestões pedagógicas</Text>
                                                        </div>
                                                    </Group>
                                                    <Switch defaultChecked size="sm" />
                                                </Group>
                                            </Paper>

                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <Text size="sm">👨‍🏫</Text>
                                                        <div>
                                                            <Text c="white" size="sm" fw={500}>Professor</Text>
                                                            <Text c="gray.6" size="xs">Geração de conteúdo, planos de aula, avaliações</Text>
                                                        </div>
                                                    </Group>
                                                    <Switch defaultChecked size="sm" />
                                                </Group>
                                            </Paper>

                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <Text size="sm">💼</Text>
                                                        <div>
                                                            <Text c="white" size="sm" fw={500}>Comercial</Text>
                                                            <Text c="gray.6" size="xs">Análise de leads, sugestões de abordagem</Text>
                                                        </div>
                                                    </Group>
                                                    <Switch size="sm" />
                                                </Group>
                                            </Paper>

                                            <Paper p="sm" radius="sm" bg="dark.6">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <Text size="sm">🎓</Text>
                                                        <div>
                                                            <Text c="white" size="sm" fw={500}>Alunos (Portal)</Text>
                                                            <Text c="gray.6" size="xs">Chatbot de dúvidas, tutor virtual</Text>
                                                        </div>
                                                    </Group>
                                                    <Switch size="sm" />
                                                </Group>
                                            </Paper>
                                        </Stack>

                                        <Alert variant="light" color="grape" p="xs">
                                            <Text size="xs">
                                                <strong>Uso responsável:</strong> A IA registra interações para auditoria.
                                                Os custos de API são proporcionais ao uso de cada cargo.
                                            </Text>
                                        </Alert>
                                    </Stack>
                                </Card>

                                {/* A1 Certificate Section */}
                                <Card bg="dark.7" radius="md" p="md">
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                <ThemeIcon size={40} radius="md" color="orange" variant="light">
                                                    <IconCertificate2 size={20} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text c="white" fw={600} size="sm">Certificado Digital A1</Text>
                                                    <Text c="gray.5" size="xs">Necessário para emissão de NFS-e</Text>
                                                </div>
                                            </Group>
                                            <Badge size="sm" color={certificateUploaded ? 'green' : 'yellow'}>
                                                {certificateUploaded ? 'Certificado Instalado' : 'Pendente'}
                                            </Badge>
                                        </Group>

                                        {certificateUploaded ? (
                                            <Paper p="md" radius="sm" bg="dark.6">
                                                <Group justify="space-between">
                                                    <Group gap="md">
                                                        <ThemeIcon size={36} radius="md" color="green" variant="light">
                                                            <IconShieldCheck size={18} />
                                                        </ThemeIcon>
                                                        <div>
                                                            <Text c="white" size="sm" fw={500}>
                                                                certificado_escola.pfx
                                                            </Text>
                                                            <Text c="gray.5" size="xs">
                                                                Expira em: 15/03/2027 | CNPJ: 12.345.678/0001-00
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                    <Button size="xs" variant="light" color="red">
                                                        Remover
                                                    </Button>
                                                </Group>
                                            </Paper>
                                        ) : (
                                            <Paper
                                                p="xl"
                                                radius="sm"
                                                bg="dark.6"
                                                style={{
                                                    border: '2px dashed var(--mantine-color-orange-6)',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => setCertificateUploaded(true)}
                                            >
                                                <Stack align="center" gap="sm">
                                                    <ThemeIcon size={60} radius="xl" color="orange" variant="light">
                                                        <IconUpload size={28} />
                                                    </ThemeIcon>
                                                    <Text c="white" fw={500} ta="center">
                                                        Clique para enviar o certificado .pfx ou .p12
                                                    </Text>
                                                    <Text c="gray.5" size="xs" ta="center">
                                                        Certificado digital A1 (ICP-Brasil) para assinatura de NFS-e
                                                    </Text>
                                                </Stack>
                                            </Paper>
                                        )}

                                        <PasswordInput
                                            label="Senha do Certificado"
                                            placeholder="Digite a senha do certificado"
                                            leftSection={<IconLock size={16} />}
                                        />

                                        <Alert variant="light" color="orange" icon={<IconAlertCircle size={18} />}>
                                            <Text size="xs">
                                                <strong>Segurança:</strong> O certificado A1 é criptografado e armazenado
                                                de forma segura. Nunca compartilhe sua senha.
                                            </Text>
                                        </Alert>
                                    </Stack>
                                </Card>

                                {/* Prefeitura Credentials */}
                                <Card bg="dark.7" radius="md" p="md">
                                    <Stack gap="md">
                                        <Group gap="sm">
                                            <ThemeIcon size={40} radius="md" color="blue" variant="light">
                                                <IconReceipt size={20} />
                                            </ThemeIcon>
                                            <div>
                                                <Text c="white" fw={600} size="sm">Credenciais da Prefeitura</Text>
                                                <Text c="gray.5" size="xs">Acesso ao sistema de NFS-e municipal</Text>
                                            </div>
                                        </Group>

                                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                            <TextInput
                                                label="Login/CNPJ"
                                                placeholder="12.345.678/0001-00"
                                                value={credentials.prefeitura.login}
                                                onChange={(e) => setCredentials(prev => ({
                                                    ...prev,
                                                    prefeitura: { ...prev.prefeitura, login: e.target.value }
                                                }))}
                                            />
                                            <PasswordInput
                                                label="Senha"
                                                placeholder="Senha do portal NFS-e"
                                                value={credentials.prefeitura.password}
                                                onChange={(e) => setCredentials(prev => ({
                                                    ...prev,
                                                    prefeitura: { ...prev.prefeitura, password: e.target.value }
                                                }))}
                                            />
                                        </SimpleGrid>

                                        <Select
                                            label="Município"
                                            placeholder="Selecione o município"
                                            data={[
                                                { value: 'joinville', label: 'Joinville - SC' },
                                                { value: 'florianopolis', label: 'Florianópolis - SC' },
                                                { value: 'curitiba', label: 'Curitiba - PR' },
                                                { value: 'sao_paulo', label: 'São Paulo - SP' },
                                                { value: 'rio', label: 'Rio de Janeiro - RJ' },
                                            ]}
                                            searchable
                                        />
                                    </Stack>
                                </Card>
                            </Stack>
                        </Tabs.Panel>

                        {/* Fiscal Integration Panel */}
                        <Tabs.Panel value="fiscal" pt="lg">
                            <Stack gap="md">
                                <Text c="gray.4" size="sm">
                                    Configure integrações fiscais para emissão automática de notas.
                                </Text>

                                <Stack gap="sm">
                                    {FISCAL_INTEGRATIONS.map((integration) => (
                                        <Card key={integration.id} bg="dark.7" radius="md" p="md">
                                            <Group justify="space-between">
                                                <Group gap="md">
                                                    <ThemeIcon
                                                        size={40}
                                                        radius="md"
                                                        color={integration.status === 'active' ? 'green' : 'yellow'}
                                                        variant="light"
                                                    >
                                                        <IconReceipt size={20} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Group gap="xs">
                                                            <Text c="white" fw={600} size="sm">
                                                                {integration.name}
                                                            </Text>
                                                            <Badge
                                                                size="xs"
                                                                color={integration.status === 'active' ? 'green' : 'yellow'}
                                                            >
                                                                {integration.status === 'active' ? 'Ativo' : 'Pendente'}
                                                            </Badge>
                                                        </Group>
                                                        <Text c="gray.5" size="xs">
                                                            {integration.description}
                                                        </Text>
                                                        {integration.city && (
                                                            <Text c="gray.6" size="xs">
                                                                Município: {integration.city}
                                                            </Text>
                                                        )}
                                                    </div>
                                                </Group>
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    color={integration.status === 'active' ? 'green' : 'yellow'}
                                                >
                                                    {integration.status === 'active' ? 'Configurar' : 'Ativar'}
                                                </Button>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>

                                <Alert variant="light" color="blue" icon={<IconAlertCircle size={20} />}>
                                    <Text size="sm">
                                        Para ativar a NFS-e, você precisará do certificado digital A1 e das
                                        credenciais de acesso ao sistema da prefeitura.
                                    </Text>
                                </Alert>
                            </Stack>
                        </Tabs.Panel>
                    </Tabs>

                    <Button
                        variant="light"
                        color="green"
                        rightSection={<IconCheck size={16} />}
                        onClick={() => router.push(`/${org.slug}/admin/setup`)}
                    >
                        Salvar e Continuar
                    </Button>
                </Stack>
            </Container>

            {/* Connect Provider Modal */}
            <Modal
                opened={isModalOpen}
                onClose={closeModal}
                title={`Conectar ${providers.find(p => p.id === selectedProvider)?.name}`}
                size="md"
            >
                <Stack gap="md">
                    <Alert variant="light" color="blue">
                        <Text size="sm">
                            Insira suas credenciais de API do provedor de pagamento.
                        </Text>
                    </Alert>

                    <TextInput
                        label="API Key"
                        placeholder="ak_live_..."
                        leftSection={<IconKey size={16} />}
                    />

                    <PasswordInput
                        label="Secret Key"
                        placeholder="sk_live_..."
                        leftSection={<IconKey size={16} />}
                    />

                    <Select
                        label="Ambiente"
                        data={[
                            { value: 'sandbox', label: 'Sandbox (Testes)' },
                            { value: 'production', label: 'Produção' },
                        ]}
                        defaultValue="sandbox"
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeModal}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConnect}
                            leftSection={<IconLink size={16} />}
                        >
                            Conectar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
}
