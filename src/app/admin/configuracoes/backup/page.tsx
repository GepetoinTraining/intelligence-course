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
    TextInput,
    Select,
    Checkbox,
    Divider,
} from '@mantine/core';
import {
    IconDatabase,
    IconDownload,
    IconCheck,
    IconCalendar,
} from '@tabler/icons-react';

export default function BackupPage() {
    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Backup & Dados</Title>
                </div>
                <Button leftSection={<IconDownload size={16} />}>
                    Backup Manual
                </Button>
            </Group>

            {/* Backup Status */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Último Backup</Text>
                            <Text fw={700} size="lg">Hoje, 03:00</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconDatabase size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Tamanho</Text>
                            <Text fw={700} size="lg">2.4 GB</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Frequência</Text>
                            <Text fw={700} size="lg">Diário</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg">
                            <IconDatabase size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Retenção</Text>
                            <Text fw={700} size="lg">30 dias</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Backup Settings */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Configurações de Backup</Text>
                <Stack gap="md">
                    <Select
                        label="Frequência"
                        defaultValue="daily"
                        data={[
                            { value: 'hourly', label: 'A cada hora' },
                            { value: 'daily', label: 'Diário' },
                            { value: 'weekly', label: 'Semanal' },
                        ]}
                    />
                    <TextInput
                        label="Horário do Backup"
                        defaultValue="03:00"
                        description="Horário de execução do backup automático"
                    />
                    <Select
                        label="Retenção"
                        defaultValue="30"
                        data={[
                            { value: '7', label: '7 dias' },
                            { value: '15', label: '15 dias' },
                            { value: '30', label: '30 dias' },
                            { value: '90', label: '90 dias' },
                        ]}
                    />
                    <Divider />
                    <Checkbox defaultChecked label="Backup de arquivos (fotos, documentos)" />
                    <Checkbox defaultChecked label="Backup do banco de dados" />
                    <Checkbox label="Enviar notificação após backup" />
                </Stack>
            </Card>

            {/* Recent Backups */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Backups Recentes</Text>
                <Stack gap="sm">
                    {[
                        { date: '05/02/2026 03:00', size: '2.4 GB', status: 'success' },
                        { date: '04/02/2026 03:00', size: '2.3 GB', status: 'success' },
                        { date: '03/02/2026 03:00', size: '2.3 GB', status: 'success' },
                        { date: '02/02/2026 03:00', size: '2.2 GB', status: 'success' },
                        { date: '01/02/2026 03:00', size: '2.2 GB', status: 'success' },
                    ].map((backup, i) => (
                        <Group key={i} justify="space-between" p="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                            <Group>
                                <IconDatabase size={16} />
                                <Text size="sm">{backup.date}</Text>
                            </Group>
                            <Group>
                                <Text size="sm" c="dimmed">{backup.size}</Text>
                                <Badge color="green" variant="light" size="sm">Sucesso</Badge>
                                <Button size="xs" variant="subtle" leftSection={<IconDownload size={12} />}>
                                    Baixar
                                </Button>
                            </Group>
                        </Group>
                    ))}
                </Stack>
            </Card>
        </Stack>
    );
}

