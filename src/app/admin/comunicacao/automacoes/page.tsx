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
    Button,
    Table,
    Avatar,
    Switch,
} from '@mantine/core';
import {
    IconBell,
    IconPlus,
    IconMail,
    IconBrandWhatsapp,
    IconDeviceMobile,
} from '@tabler/icons-react';

// Demo automations
const automations = [
    { id: 1, name: 'Lembrete de Pagamento', trigger: '3 dias antes vencimento', channel: 'WhatsApp', enabled: true, sentToday: 45 },
    { id: 2, name: 'Boas-vindas Matrícula', trigger: 'Nova matrícula', channel: 'Email', enabled: true, sentToday: 3 },
    { id: 3, name: 'Cobrança Vencido', trigger: '1 dia após vencimento', channel: 'Email + WhatsApp', enabled: true, sentToday: 12 },
    { id: 4, name: 'Confirmação de Aula', trigger: '2h antes da aula', channel: 'Push', enabled: true, sentToday: 156 },
    { id: 5, name: 'Ausência Detectada', trigger: 'Falta registrada', channel: 'WhatsApp', enabled: false, sentToday: 0 },
    { id: 6, name: 'Aniversário', trigger: 'Data de nascimento', channel: 'Email + Push', enabled: true, sentToday: 2 },
];

export default function AutomacoesPage() {
    const active = automations.filter(a => a.enabled).length;
    const totalSent = automations.reduce((sum, a) => sum + a.sentToday, 0);

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>Automações</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Automação
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBell size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Automações</Text>
                            <Text fw={700} size="lg">{automations.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconBell size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{active}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconMail size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Enviadas Hoje</Text>
                            <Text fw={700} size="lg">{totalSent}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg">
                            <IconBell size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pausadas</Text>
                            <Text fw={700} size="lg">{automations.filter(a => !a.enabled).length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Automations Table */}
            <Card withBorder p="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Automação</Table.Th>
                            <Table.Th>Gatilho</Table.Th>
                            <Table.Th>Canal</Table.Th>
                            <Table.Th>Enviadas Hoje</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Ativo</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {automations.map((auto) => (
                            <Table.Tr key={auto.id}>
                                <Table.Td>
                                    <Text fw={500}>{auto.name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{auto.trigger}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4}>
                                        {auto.channel.includes('Email') && <IconMail size={16} />}
                                        {auto.channel.includes('WhatsApp') && <IconBrandWhatsapp size={16} />}
                                        {auto.channel.includes('Push') && <IconDeviceMobile size={16} />}
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={500}>{auto.sentToday}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        color={auto.enabled ? 'green' : 'gray'}
                                        variant="light"
                                    >
                                        {auto.enabled ? 'Ativa' : 'Pausada'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Switch defaultChecked={auto.enabled} size="sm" />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}

