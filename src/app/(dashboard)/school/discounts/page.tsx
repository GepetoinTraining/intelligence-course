'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Table, Modal, TextInput, Select,
    NumberInput, Grid, Switch, Progress
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconDiscount,
    IconClock, IconCheck, IconAlertCircle, IconPercentage
} from '@tabler/icons-react';
import Link from 'next/link';

interface Discount {
    id: string;
    name: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    maxUses: number;
    currentUses: number;
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'exhausted' | 'scheduled';
}

const MOCK_DISCOUNTS: Discount[] = [
    { id: '1', name: 'Volta às Aulas', code: 'VOLTA2026', type: 'percentage', value: 15, maxUses: 50, currentUses: 23, startDate: '2026-01-15', endDate: '2026-02-28', status: 'active' },
    { id: '2', name: 'Indicação de Amigo', code: 'AMIGO10', type: 'percentage', value: 10, maxUses: 0, currentUses: 45, startDate: '2025-01-01', endDate: '2026-12-31', status: 'active' },
    { id: '3', name: 'Black Friday', code: 'BLACK50', type: 'fixed', value: 200, maxUses: 30, currentUses: 30, startDate: '2025-11-25', endDate: '2025-11-30', status: 'expired' },
];

export default function DiscountManagementPage() {
    const [discounts, setDiscounts] = useState<Discount[]>(MOCK_DISCOUNTS);
    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
            active: { color: 'green', label: 'Ativo' },
            scheduled: { color: 'blue', label: 'Agendado' },
            expired: { color: 'gray', label: 'Expirado' },
            exhausted: { color: 'orange', label: 'Esgotado' },
        };
        return map[status] || map.active;
    };

    return (
        <Stack gap="xl">
            <Group justify="space-between">
                <Group>
                    <Link href="/school" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Descontos e Promoções 🏷️</Title>
                        <Text c="dimmed">Gerencie cupons e campanhas</Text>
                    </div>
                </Group>
                <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
                    Novo Desconto
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {discounts.map(discount => {
                    const statusInfo = getStatusInfo(discount.status);
                    const usage = discount.maxUses > 0 ? (discount.currentUses / discount.maxUses) * 100 : 0;

                    return (
                        <Card key={discount.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={600}>{discount.name}</Text>
                                        <Badge variant="filled" color="dark" size="lg" tt="uppercase">
                                            {discount.code}
                                        </Badge>
                                    </div>
                                    <Badge color={statusInfo.color} variant="light">
                                        {statusInfo.label}
                                    </Badge>
                                </Group>

                                <Paper p="md" bg="violet.0" radius="md" style={{ textAlign: 'center' }}>
                                    <Text size="xl" fw={700} c="violet">
                                        {discount.type === 'percentage' ? `${discount.value}%` : `R$ ${discount.value}`}
                                    </Text>
                                </Paper>

                                <div>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm" c="dimmed">Uso</Text>
                                        <Text size="sm">{discount.currentUses}{discount.maxUses > 0 ? `/${discount.maxUses}` : ''}</Text>
                                    </Group>
                                    {discount.maxUses > 0 && <Progress value={usage} size="sm" radius="xl" />}
                                </div>

                                <Text size="sm" c="dimmed">
                                    {new Date(discount.startDate).toLocaleDateString('pt-BR')} - {new Date(discount.endDate).toLocaleDateString('pt-BR')}
                                </Text>

                                <Group>
                                    <Button size="xs" variant="light" leftSection={<IconEdit size={14} />} flex={1}>
                                        Editar
                                    </Button>
                                    <Button size="xs" variant="light" color="red" leftSection={<IconTrash size={14} />}>
                                        Excluir
                                    </Button>
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>

            <Modal opened={modal} onClose={closeModal} title="Novo Desconto" centered>
                <Stack gap="md">
                    <TextInput label="Nome" placeholder="Ex: Volta às Aulas" required />
                    <TextInput label="Código" placeholder="Ex: VOLTA2026" required />
                    <Select label="Tipo" data={[{ value: 'percentage', label: '%' }, { value: 'fixed', label: 'R$' }]} />
                    <NumberInput label="Valor" min={0} />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={closeModal}>Criar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

