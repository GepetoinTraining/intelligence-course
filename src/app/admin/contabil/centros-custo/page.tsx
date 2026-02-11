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
    Loader,
    Alert,
    Center,
    Stack,
    Modal,
    TextInput,
    Textarea,
    NumberInput,
    Select,
    Progress,
} from '@mantine/core';
import {
    IconCategory,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconChartPie,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface CostCenter {
    id: string;
    code: string;
    name: string;
    description: string | null;
    centerType: string;
    annualBudgetCents: number | null;
    monthlyBudgetCents: number | null;
    isActive: number;
    managerName: string | null;
    level: number | null;
}

const typeColors: Record<string, string> = {
    department: 'blue',
    project: 'grape',
    revenue: 'green',
    expense: 'red',
    overhead: 'orange',
};

const typeLabels: Record<string, string> = {
    department: 'Departamento',
    project: 'Projeto',
    revenue: 'Receita',
    expense: 'Despesa',
    overhead: 'Overhead',
};

function formatCurrency(cents: number | null) {
    if (cents === null || cents === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export default function CentrosCustoPage() {
    const { data, isLoading, error, refetch } = useApi<{ data: CostCenter[] }>('/api/cost-centers');
    const [createOpen, createHandlers] = useDisclosure(false);

    // Create form
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [centerType, setCenterType] = useState<string | null>('department');
    const [annualBudget, setAnnualBudget] = useState<number | string>('');
    const [creating, setCreating] = useState(false);

    const costCenters = data?.data || [];

    const activeCount = costCenters.filter(c => c.isActive === 1).length;
    const totalBudget = costCenters
        .filter(c => c.isActive === 1)
        .reduce((acc, c) => acc + (c.annualBudgetCents || 0), 0);

    const handleCreate = async () => {
        if (!code.trim() || !name.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/cost-centers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    name,
                    description: description || null,
                    centerType,
                    annualBudgetCents: annualBudget ? Number(annualBudget) : null,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erro ao criar');
            }
            refetch();
            createHandlers.close();
            setCode('');
            setName('');
            setDescription('');
            setAnnualBudget('');
            notifications.show({ title: 'Criado', message: 'Centro de custo criado', color: 'green' });
        } catch (err: any) {
            notifications.show({ title: 'Erro', message: err.message, color: 'red' });
        } finally {
            setCreating(false);
        }
    };

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Contábil</Text>
                    <Title order={2}>Centros de Custo</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={createHandlers.open}>
                    Novo Centro de Custo
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconCategory size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Centros Ativos</Text>
                            <Text fw={700} size="xl">{activeCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconChartPie size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Orçamento Anual</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalBudget)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCategory size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="xl">{costCenters.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todos os Centros de Custo</Title>

                {costCenters.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCategory size={48} color="gray" />
                            <Text c="dimmed">Nenhum centro de custo cadastrado</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Código</Table.Th>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Responsável</Table.Th>
                                <Table.Th>Orçamento Anual</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {costCenters.map((cc) => (
                                <Table.Tr key={cc.id} style={{ opacity: cc.isActive === 0 ? 0.5 : 1 }}>
                                    <Table.Td>
                                        <Text fw={500} ff="monospace">{cc.code}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <div>
                                            <Text size="sm" fw={500}>{cc.name}</Text>
                                            {cc.description && <Text size="xs" c="dimmed" lineClamp={1}>{cc.description}</Text>}
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={typeColors[cc.centerType] || 'gray'} variant="light">
                                            {typeLabels[cc.centerType] || cc.centerType}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{cc.managerName || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatCurrency(cc.annualBudgetCents)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={cc.isActive === 1 ? 'green' : 'gray'}>
                                            {cc.isActive === 1 ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Lançamentos</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>

            {/* Create Modal */}
            <Modal opened={createOpen} onClose={createHandlers.close} title="Novo Centro de Custo" size="md">
                <Stack gap="md">
                    <Group grow>
                        <TextInput
                            label="Código"
                            placeholder="Ex: CC-007"
                            value={code}
                            onChange={(e) => setCode(e.currentTarget.value)}
                            required
                        />
                        <Select
                            label="Tipo"
                            data={Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))}
                            value={centerType}
                            onChange={setCenterType}
                        />
                    </Group>
                    <TextInput
                        label="Nome"
                        placeholder="Ex: Departamento Pedagógico"
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        required
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descrição do centro de custo"
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                    />
                    <NumberInput
                        label="Orçamento Anual (centavos)"
                        placeholder="Ex: 5000000 (= R$ 50.000,00)"
                        value={annualBudget}
                        onChange={setAnnualBudget}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={createHandlers.close}>Cancelar</Button>
                        <Button onClick={handleCreate} loading={creating} disabled={!code.trim() || !name.trim()}>
                            Criar Centro
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
}
