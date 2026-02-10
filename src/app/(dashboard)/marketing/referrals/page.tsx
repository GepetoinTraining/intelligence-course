'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, NumberInput,
    Grid, Table, Tabs, Progress, Avatar, CopyButton, Tooltip, Code
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconGift, IconUsers, IconCurrencyDollar,
    IconCopy, IconCheck, IconTrophy, IconArrowUp, IconShare,
    IconUserPlus, IconCoins
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Referrer {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    referrals: number;
    conversions: number;
    pendingReward: number;
    paidReward: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    joinedAt: string;
}

interface Referral {
    id: string;
    referrerId: string;
    referrerName: string;
    leadName: string;
    leadEmail: string;
    status: 'pending' | 'trial' | 'enrolled' | 'inactive';
    enrolledCourse?: string;
    reward: number;
    createdAt: string;
}

// ============================================================================
// PRESETS
// ============================================================================

const TIERS = {
    bronze: { color: 'orange', label: 'Bronze', minReferrals: 0, rewardMultiplier: 1 },
    silver: { color: 'gray', label: 'Prata', minReferrals: 5, rewardMultiplier: 1.2 },
    gold: { color: 'yellow', label: 'Ouro', minReferrals: 15, rewardMultiplier: 1.5 },
    platinum: { color: 'violet', label: 'Platina', minReferrals: 30, rewardMultiplier: 2 },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReferralProgramPage() {
    const [referrers, setReferrers] = useState<Referrer[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>('referrers');
    const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null);

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [detailModal, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [referralCode, setReferralCode] = useState('');

    const handleCreate = () => {
        setName('');
        setEmail('');
        setReferralCode('');
        openModal();
    };

    const handleSave = () => {
        if (!name || !email || !referralCode) return;

        const newReferrer: Referrer = {
            id: `ref-${Date.now()}`,
            name,
            email,
            referralCode: referralCode.toUpperCase(),
            referrals: 0,
            conversions: 0,
            pendingReward: 0,
            paidReward: 0,
            tier: 'bronze',
            joinedAt: new Date().toISOString().split('T')[0],
        };
        setReferrers(prev => [...prev, newReferrer]);
        closeModal();
    };

    const handleViewDetails = (referrer: Referrer) => {
        setSelectedReferrer(referrer);
        openDetailModal();
    };

    const handlePayReward = (referrerId: string) => {
        setReferrers(prev => prev.map(r =>
            r.id === referrerId
                ? { ...r, paidReward: r.paidReward + r.pendingReward, pendingReward: 0 }
                : r
        ));
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
            pending: { color: 'gray', label: 'Pendente' },
            trial: { color: 'blue', label: 'Em Trial' },
            enrolled: { color: 'green', label: 'Matriculado' },
            inactive: { color: 'red', label: 'Inativo' },
        };
        return map[status] || map.pending;
    };

    const totalReferrals = referrers.reduce((acc, r) => acc + r.referrals, 0);
    const totalConversions = referrers.reduce((acc, r) => acc + r.conversions, 0);
    const totalPendingRewards = referrers.reduce((acc, r) => acc + r.pendingReward, 0);
    const totalPaidRewards = referrers.reduce((acc, r) => acc + r.paidReward, 0);
    const conversionRate = totalReferrals > 0 ? ((totalConversions / totalReferrals) * 100).toFixed(1) : '0';

    // Sort referrers by conversions for leaderboard
    const leaderboard = [...referrers].sort((a, b) => b.conversions - a.conversions).slice(0, 5);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/marketing/campaigns" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Programa de Indicação 🎁</Title>
                        <Text c="dimmed">Gerencie indicadores e recompensas</Text>
                    </div>
                </Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreate}
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'grape' }}
                >
                    Novo Indicador
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{referrers.length}</Text>
                            <Text size="sm" c="dimmed">Indicadores</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconUsers size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="blue">{totalReferrals}</Text>
                            <Text size="sm" c="dimmed">Indicações</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconShare size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">{totalConversions}</Text>
                            <Text size="sm" c="dimmed">Conversões</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconUserPlus size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="orange">
                                R$ {totalPendingRewards.toLocaleString('pt-BR')}
                            </Text>
                            <Text size="sm" c="dimmed">A Pagar</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="orange">
                            <IconCoins size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="teal">
                                {conversionRate}%
                            </Text>
                            <Text size="sm" c="dimmed">Taxa Conversão</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="teal">
                            <IconArrowUp size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Leaderboard */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Group mb="md">
                    <ThemeIcon size="lg" variant="light" color="yellow">
                        <IconTrophy size={20} />
                    </ThemeIcon>
                    <Title order={4}>🏆 Top Indicadores</Title>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 5 }} spacing="md">
                    {leaderboard.map((referrer, index) => {
                        const tierInfo = TIERS[referrer.tier];
                        return (
                            <Paper key={referrer.id} p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                                <Badge
                                    size="lg"
                                    variant="filled"
                                    color={index === 0 ? 'yellow' : index === 1 ? 'gray' : index === 2 ? 'orange' : 'blue'}
                                    mb="xs"
                                    radius="xl"
                                >
                                    #{index + 1}
                                </Badge>
                                <Avatar size="lg" radius="xl" mx="auto" mb="xs" color={tierInfo.color}>
                                    {referrer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </Avatar>
                                <Text fw={600} size="sm">{referrer.name.split(' ')[0]}</Text>
                                <Badge variant="light" color={tierInfo.color} size="xs" mt={4}>
                                    {tierInfo.label}
                                </Badge>
                                <Text size="lg" fw={700} c="green" mt="xs">{referrer.conversions}</Text>
                                <Text size="xs" c="dimmed">conversões</Text>
                            </Paper>
                        );
                    })}
                </SimpleGrid>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="referrers">Indicadores ({referrers.length})</Tabs.Tab>
                    <Tabs.Tab value="referrals">Indicações ({referrals.length})</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="referrers" pt="md">
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Indicador</Table.Th>
                                <Table.Th>Código</Table.Th>
                                <Table.Th>Tier</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Indicações</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Conversões</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Pendente</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Total Pago</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {referrers.map(referrer => {
                                const tierInfo = TIERS[referrer.tier];
                                return (
                                    <Table.Tr key={referrer.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar size="sm" radius="xl" color={tierInfo.color}>
                                                    {referrer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>{referrer.name}</Text>
                                                    <Text size="xs" c="dimmed">{referrer.email}</Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Code>{referrer.referralCode}</Code>
                                                <CopyButton value={`https://escola.com/r/${referrer.referralCode}`}>
                                                    {({ copied, copy }) => (
                                                        <Tooltip label={copied ? 'Copiado!' : 'Copiar link'}>
                                                            <ActionIcon size="xs" variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
                                                                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </CopyButton>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="filled" color={tierInfo.color} size="sm">
                                                {tierInfo.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            <Text fw={500}>{referrer.referrals}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            <Text fw={700} c="green">{referrer.conversions}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            {referrer.pendingReward > 0 ? (
                                                <Text fw={700} c="orange">R$ {referrer.pendingReward}</Text>
                                            ) : (
                                                <Text c="dimmed">-</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Text fw={500}>R$ {referrer.paidReward.toLocaleString('pt-BR')}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4} justify="flex-end">
                                                {referrer.pendingReward > 0 && (
                                                    <Button size="xs" variant="light" color="green" onClick={() => handlePayReward(referrer.id)}>
                                                        Pagar
                                                    </Button>
                                                )}
                                                <Button size="xs" variant="light" onClick={() => handleViewDetails(referrer)}>
                                                    Detalhes
                                                </Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Tabs.Panel>

                <Tabs.Panel value="referrals" pt="md">
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Lead Indicado</Table.Th>
                                <Table.Th>Indicador</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Curso</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Recompensa</Table.Th>
                                <Table.Th>Data</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {referrals.map(referral => {
                                const statusInfo = getStatusInfo(referral.status);
                                return (
                                    <Table.Tr key={referral.id}>
                                        <Table.Td>
                                            <div>
                                                <Text size="sm" fw={500}>{referral.leadName}</Text>
                                                <Text size="xs" c="dimmed">{referral.leadEmail}</Text>
                                            </div>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{referral.referrerName}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={statusInfo.color} variant="light" size="sm">
                                                {statusInfo.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {referral.enrolledCourse ? (
                                                <Text size="sm">{referral.enrolledCourse}</Text>
                                            ) : (
                                                <Text size="sm" c="dimmed">-</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            {referral.reward > 0 ? (
                                                <Text fw={700} c="green">R$ {referral.reward}</Text>
                                            ) : (
                                                <Text c="dimmed">-</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{new Date(referral.createdAt).toLocaleDateString('pt-BR')}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Tabs.Panel>
            </Tabs>

            {/* Create Referrer Modal */}
            <Modal opened={modal} onClose={closeModal} title="Novo Indicador" centered>
                <Stack gap="md">
                    <TextInput
                        label="Nome Completo"
                        placeholder="Ex: Maria Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <TextInput
                        label="Email"
                        placeholder="maria@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <TextInput
                        label="Código de Indicação"
                        placeholder="Ex: MARIA2026"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        required
                        description="Será usado no link: escola.com/r/CODIGO"
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave} variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
                            Criar Indicador
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Referrer Detail Modal */}
            <Modal opened={detailModal} onClose={closeDetailModal} title={selectedReferrer?.name} centered size="lg">
                {selectedReferrer && (
                    <Stack gap="md">
                        <Paper p="md" bg={`${TIERS[selectedReferrer.tier].color}.0`} radius="md">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Tier Atual</Text>
                                    <Badge size="lg" variant="filled" color={TIERS[selectedReferrer.tier].color}>
                                        {TIERS[selectedReferrer.tier].label}
                                    </Badge>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Text size="sm" c="dimmed">Multiplicador</Text>
                                    <Text size="xl" fw={700}>{TIERS[selectedReferrer.tier].rewardMultiplier}x</Text>
                                </div>
                            </Group>
                        </Paper>

                        <SimpleGrid cols={4}>
                            <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700}>{selectedReferrer.referrals}</Text>
                                <Text size="xs" c="dimmed">Indicações</Text>
                            </Paper>
                            <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="green">{selectedReferrer.conversions}</Text>
                                <Text size="xs" c="dimmed">Conversões</Text>
                            </Paper>
                            <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="orange">R$ {selectedReferrer.pendingReward}</Text>
                                <Text size="xs" c="dimmed">Pendente</Text>
                            </Paper>
                            <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="teal">R$ {selectedReferrer.paidReward.toLocaleString('pt-BR')}</Text>
                                <Text size="xs" c="dimmed">Total Pago</Text>
                            </Paper>
                        </SimpleGrid>

                        <Paper p="md" radius="md" withBorder>
                            <Text size="sm" fw={500} mb="xs">Link de Indicação</Text>
                            <Group>
                                <Code style={{ flex: 1 }}>https://escola.com/r/{selectedReferrer.referralCode}</Code>
                                <CopyButton value={`https://escola.com/r/${selectedReferrer.referralCode}`}>
                                    {({ copied, copy }) => (
                                        <Button size="xs" variant={copied ? 'filled' : 'light'} color={copied ? 'green' : 'blue'} onClick={copy}>
                                            {copied ? 'Copiado!' : 'Copiar'}
                                        </Button>
                                    )}
                                </CopyButton>
                            </Group>
                        </Paper>

                        <Text size="sm" c="dimmed">Membro desde {new Date(selectedReferrer.joinedAt).toLocaleDateString('pt-BR')}</Text>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

