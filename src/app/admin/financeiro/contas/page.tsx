'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Select,
    Modal, TextInput, NumberInput, ActionIcon, Menu,
} from '@mantine/core';
import {
    IconBuildingBank, IconPlus, IconCreditCard, IconAlertCircle,
    IconCheck, IconDotsVertical, IconEdit, IconTrash, IconKey,
    IconWallet, IconQrcode,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Gateway {
    id: string;
    provider: string;
    accountId: string | null;
    accountName: string | null;
    isProduction: boolean;
    isDefault: boolean;
    supportsPix: boolean;
    supportsBoleto: boolean;
    supportsCard: boolean;
    supportsSplit: boolean;
    pixFeePercent: number | null;
    boletoFeeCents: number | null;
    cardFeePercent: number | null;
    isActive: boolean;
    apiKeyHint: string | null;
    secretKeyHint: string | null;
    createdAt: number;
}

const providerLabels: Record<string, { label: string; color: string }> = {
    asaas: { label: 'Asaas', color: 'blue' },
    pagarme: { label: 'Pagar.me', color: 'green' },
    pagbank: { label: 'PagBank', color: 'orange' },
    mercadopago: { label: 'Mercado Pago', color: 'cyan' },
    iugu: { label: 'Iugu', color: 'violet' },
    stripe: { label: 'Stripe', color: 'indigo' },
    manual: { label: 'Manual', color: 'gray' },
};

export default function ContasBancariasPage() {
    const { data: gateways, isLoading, error, refetch } = useApi<Gateway[]>('/api/payment-gateways');
    const [addOpen, setAddOpen] = useState(false);

    const active = gateways?.filter(g => g.isActive) || [];
    const inactive = gateways?.filter(g => !g.isActive) || [];
    const defaultGw = gateways?.find(g => g.isDefault);

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Contas Bancárias & Gateways</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>
                    Adicionar Gateway
                </Button>
            </Group>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Gateways Ativos</Text>
                    <Text fw={700} size="xl">{active.length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">PIX Habilitado</Text>
                    <Text fw={700} size="xl">{active.filter(g => g.supportsPix).length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Boleto Habilitado</Text>
                    <Text fw={700} size="xl">{active.filter(g => g.supportsBoleto).length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Split Habilitado</Text>
                    <Text fw={700} size="xl">{active.filter(g => g.supportsSplit).length}</Text>
                </Card>
            </SimpleGrid>

            {/* Gateway Cards */}
            {active.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {active.map((gw) => {
                        const prov = providerLabels[gw.provider] || { label: gw.provider, color: 'gray' };
                        return (
                            <Card key={gw.id} withBorder p="lg">
                                <Group justify="space-between" mb="sm">
                                    <Group>
                                        <ThemeIcon variant="light" color={prov.color} size="lg" radius="md">
                                            <IconBuildingBank size={20} />
                                        </ThemeIcon>
                                        <div>
                                            <Group gap={8}>
                                                <Text fw={600}>{prov.label}</Text>
                                                {gw.isDefault && <Badge size="xs" color="blue">Padrão</Badge>}
                                                <Badge size="xs" color={gw.isProduction ? 'green' : 'orange'} variant="light">
                                                    {gw.isProduction ? 'Produção' : 'Sandbox'}
                                                </Badge>
                                            </Group>
                                            <Text size="sm" c="dimmed">{gw.accountName}</Text>
                                        </div>
                                    </Group>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                            <Menu.Item leftSection={<IconKey size={14} />}>Atualizar Chaves</Menu.Item>
                                            <Menu.Item leftSection={<IconTrash size={14} />} color="red">Desativar</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>

                                {/* Capabilities */}
                                <Group gap={6} mb="sm">
                                    {gw.supportsPix && <Badge size="sm" variant="dot" color="green">PIX</Badge>}
                                    {gw.supportsBoleto && <Badge size="sm" variant="dot" color="blue">Boleto</Badge>}
                                    {gw.supportsCard && <Badge size="sm" variant="dot" color="violet">Cartão</Badge>}
                                    {gw.supportsSplit && <Badge size="sm" variant="dot" color="orange">Split</Badge>}
                                </Group>

                                {/* Fees */}
                                <SimpleGrid cols={3}>
                                    <div>
                                        <Text size="xs" c="dimmed">Taxa PIX</Text>
                                        <Text size="sm" fw={500}>{gw.pixFeePercent != null ? `${gw.pixFeePercent}%` : '-'}</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Taxa Boleto</Text>
                                        <Text size="sm" fw={500}>{gw.boletoFeeCents != null ? `R$ ${(gw.boletoFeeCents / 100).toFixed(2)}` : '-'}</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Taxa Cartão</Text>
                                        <Text size="sm" fw={500}>{gw.cardFeePercent != null ? `${gw.cardFeePercent}%` : '-'}</Text>
                                    </div>
                                </SimpleGrid>

                                {/* Key hints */}
                                {gw.apiKeyHint && (
                                    <Group gap={4} mt="sm">
                                        <IconKey size={12} color="gray" />
                                        <Text size="xs" c="dimmed">API Key: {gw.apiKeyHint}</Text>
                                    </Group>
                                )}
                            </Card>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Card withBorder p="xl">
                    <Center>
                        <Stack align="center" gap="xs">
                            <IconWallet size={48} color="gray" />
                            <Text c="dimmed">Nenhum gateway configurado</Text>
                            <Text size="sm" c="dimmed">Adicione um gateway para processar pagamentos PIX, boleto e cartão</Text>
                            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => setAddOpen(true)}>
                                Configurar Gateway
                            </Button>
                        </Stack>
                    </Center>
                </Card>
            )}

            {/* Asaas Integration Guide */}
            <Alert icon={<IconQrcode size={16} />} color="blue" variant="light" title="Integração Prioritária: Asaas">
                <Text size="xs">
                    <strong>Asaas</strong> é o gateway recomendado — suporte completo a PIX (QR Code + copia-e-cola),
                    Boleto Registrado (híbrido com QR), Cartão de Crédito/Débito, PIX Automático (recorrente),
                    e Split de Pagamentos nativo. Sandbox disponível em <strong>sandbox.asaas.com</strong>.
                </Text>
            </Alert>

            {/* Legal */}
            <Alert icon={<IconBuildingBank size={16} />} color="gray" variant="light" title="Compliance">
                <Text size="xs">
                    <strong>Res. BCB 80/2021</strong> — Arranjos de pagamento •{' '}
                    <strong>Lei 12.865/2013</strong> — Instituições de pagamento •{' '}
                    <strong>LGPD Arts. 46-49</strong> — Segurança de dados financeiros •{' '}
                    Credenciais armazenadas com <strong>AES-256-GCM</strong>
                </Text>
            </Alert>

            {/* Add Gateway Modal */}
            <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Adicionar Gateway" size="lg">
                <Stack gap="md">
                    <Select
                        label="Provedor"
                        placeholder="Selecione o gateway"
                        data={[
                            { value: 'asaas', label: 'Asaas (Recomendado)' },
                            { value: 'pagarme', label: 'Pagar.me' },
                            { value: 'pagbank', label: 'PagBank' },
                            { value: 'mercadopago', label: 'Mercado Pago' },
                            { value: 'iugu', label: 'Iugu' },
                            { value: 'stripe', label: 'Stripe' },
                            { value: 'manual', label: 'Manual (sem integração)' },
                        ]}
                        required
                    />
                    <TextInput label="Nome da Conta" placeholder="Ex: Conta Principal Asaas" required />
                    <TextInput label="API Key" placeholder="Chave de API do provedor" type="password" required />
                    <TextInput label="Secret Key" placeholder="Chave secreta (se aplicável)" type="password" />
                    <TextInput label="Webhook Secret" placeholder="Secret para validar webhooks" type="password" />
                    <TextInput label="Account ID" placeholder="ID da conta no provedor (opcional)" />
                    <SimpleGrid cols={3}>
                        <NumberInput label="Taxa PIX (%)" placeholder="0.99" decimalScale={2} />
                        <NumberInput label="Taxa Boleto (R$)" placeholder="1.99" decimalScale={2} />
                        <NumberInput label="Taxa Cartão (%)" placeholder="2.49" decimalScale={2} />
                    </SimpleGrid>
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setAddOpen(false)}>Cancelar</Button>
                        <Button>Salvar Gateway</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
