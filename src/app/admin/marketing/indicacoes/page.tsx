'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    Avatar,
    Progress,
    CopyButton,
    Tooltip,
} from '@mantine/core';
import {
    IconShare,
    IconPlus,
    IconEye,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconGift,
    IconUsers,
    IconCurrencyDollar,
    IconLink,
    IconCheck,
    IconCopy,
    IconMail,
    IconBrandWhatsapp,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Referral {
    id: string;
    referrerName: string;
    referrerEmail: string;
    referredName?: string;
    referredEmail?: string;
    status: 'pending' | 'converted' | 'rewarded' | 'expired';
    rewardType: 'discount' | 'credit' | 'gift';
    rewardValue: number;
    createdAt: string;
    convertedAt?: string;
}

// Mock data for referrals
const mockReferrals: Referral[] = [
    { id: '1', referrerName: 'Maria Silva', referrerEmail: 'maria@email.com', referredName: 'João Costa', referredEmail: 'joao@email.com', status: 'rewarded', rewardType: 'discount', rewardValue: 10, createdAt: '2026-01-15', convertedAt: '2026-01-20' },
    { id: '2', referrerName: 'Pedro Santos', referrerEmail: 'pedro@email.com', referredName: 'Ana Lima', referredEmail: 'ana@email.com', status: 'converted', rewardType: 'credit', rewardValue: 50, createdAt: '2026-01-25', convertedAt: '2026-02-01' },
    { id: '3', referrerName: 'Carla Oliveira', referrerEmail: 'carla@email.com', status: 'pending', rewardType: 'discount', rewardValue: 10, createdAt: '2026-02-02' },
    { id: '4', referrerName: 'Lucas Pereira', referrerEmail: 'lucas@email.com', status: 'pending', rewardType: 'discount', rewardValue: 10, createdAt: '2026-02-03' },
    { id: '5', referrerName: 'Fernanda Souza', referrerEmail: 'fernanda@email.com', referredName: 'Bruno Mendes', referredEmail: 'bruno@email.com', status: 'rewarded', rewardType: 'gift', rewardValue: 100, createdAt: '2026-01-10', convertedAt: '2026-01-18' },
];

const statusColors: Record<string, string> = {
    pending: 'yellow',
    converted: 'blue',
    rewarded: 'green',
    expired: 'gray',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    converted: 'Convertido',
    rewarded: 'Recompensado',
    expired: 'Expirado',
};

const rewardLabels: Record<string, string> = {
    discount: 'Desconto',
    credit: 'Crédito',
    gift: 'Presente',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function IndicacoesPage() {
    const [referrals] = useState<Referral[]>(mockReferrals);

    const pendingCount = referrals.filter(r => r.status === 'pending').length;
    const convertedCount = referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length;
    const rewardedCount = referrals.filter(r => r.status === 'rewarded').length;
    const totalRewards = referrals
        .filter(r => r.status === 'rewarded')
        .reduce((acc, r) => acc + r.rewardValue, 0);
    const conversionRate = referrals.length > 0 ? (convertedCount / referrals.length) * 100 : 0;

    const referralLink = 'https://escola.com.br/indicar?ref=ABC123';

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Marketing</Text>
                    <Title order={2}>Programa de Indicações</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Convite
                </Button>
            </Group>

            <Card withBorder mb="xl" p="lg">
                <Group justify="space-between">
                    <div>
                        <Text size="sm" fw={500} mb="xs">Link de Indicação</Text>
                        <Text c="dimmed" size="sm">{referralLink}</Text>
                    </div>
                    <Group>
                        <CopyButton value={referralLink}>
                            {({ copied, copy }) => (
                                <Tooltip label={copied ? 'Copiado!' : 'Copiar link'}>
                                    <Button
                                        variant="light"
                                        color={copied ? 'teal' : 'gray'}
                                        onClick={copy}
                                        leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                    >
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </Button>
                                </Tooltip>
                            )}
                        </CopyButton>
                        <Button variant="light" leftSection={<IconMail size={16} />}>
                            Enviar por Email
                        </Button>
                        <Button variant="light" color="green" leftSection={<IconBrandWhatsapp size={16} />}>
                            WhatsApp
                        </Button>
                    </Group>
                </Group>
            </Card>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="yellow" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Indicações Pendentes</Text>
                            <Text fw={700} size="xl">{pendingCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconShare size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Convertidas</Text>
                            <Text fw={700} size="xl">{convertedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconGift size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Recompensas Pagas</Text>
                            <Text fw={700} size="xl">{rewardedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconCurrencyDollar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Taxa de Conversão</Text>
                            <Text fw={700} size="xl">{conversionRate.toFixed(0)}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todas as Indicações</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Quem Indicou</Table.Th>
                            <Table.Th>Indicado</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Recompensa</Table.Th>
                            <Table.Th>Data</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {referrals.map((referral) => (
                            <Table.Tr key={referral.id}>
                                <Table.Td>
                                    <Group gap="sm">
                                        <Avatar size="sm" radius="xl" color="blue">
                                            {referral.referrerName.charAt(0)}
                                        </Avatar>
                                        <div>
                                            <Text size="sm" fw={500}>{referral.referrerName}</Text>
                                            <Text size="xs" c="dimmed">{referral.referrerEmail}</Text>
                                        </div>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    {referral.referredName ? (
                                        <Group gap="sm">
                                            <Avatar size="sm" radius="xl" color="green">
                                                {referral.referredName.charAt(0)}
                                            </Avatar>
                                            <div>
                                                <Text size="sm" fw={500}>{referral.referredName}</Text>
                                                <Text size="xs" c="dimmed">{referral.referredEmail}</Text>
                                            </div>
                                        </Group>
                                    ) : (
                                        <Text size="sm" c="dimmed">Aguardando...</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[referral.status]} variant="light">
                                        {statusLabels[referral.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Badge variant="outline" color="gray">
                                            {rewardLabels[referral.rewardType]}
                                        </Badge>
                                        <Text size="sm" fw={500}>
                                            {referral.rewardType === 'discount'
                                                ? `${referral.rewardValue}%`
                                                : formatCurrency(referral.rewardValue)}
                                        </Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{formatDate(referral.createdAt)}</Text>
                                    {referral.convertedAt && (
                                        <Text size="xs" c="dimmed">Conv: {formatDate(referral.convertedAt)}</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDotsVertical size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                            <Menu.Item leftSection={<IconMail size={14} />}>Reenviar Convite</Menu.Item>
                                            {referral.status === 'converted' && (
                                                <Menu.Item leftSection={<IconGift size={14} />} color="green">Marcar como Recompensado</Menu.Item>
                                            )}
                                            <Menu.Divider />
                                            <Menu.Item leftSection={<IconTrash size={14} />} color="red">Cancelar</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

