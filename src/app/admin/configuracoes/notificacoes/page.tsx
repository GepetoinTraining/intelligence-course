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
    Textarea,
    Select,
    Switch,
    Divider,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconBell,
    IconMail,
    IconBrandWhatsapp,
    IconDeviceMobile,
    IconCheck,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

export default function NotificacoesConfigPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/notifications');


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Notificações</Title>
                </div>
                <Button leftSection={<IconCheck size={16} />}>
                    Salvar Alterações
                </Button>
            </Group>

            {/* Channels */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Canais de Notificação</Text>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Group gap="sm">
                            <ThemeIcon variant="light" color="red" size="lg">
                                <IconMail size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={500}>Email</Text>
                                <Text size="xs" c="dimmed">Notificações por email</Text>
                            </div>
                        </Group>
                        <Switch defaultChecked size="md" />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <Group gap="sm">
                            <ThemeIcon variant="light" color="green" size="lg">
                                <IconBrandWhatsapp size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={500}>WhatsApp</Text>
                                <Text size="xs" c="dimmed">Mensagens via WhatsApp Business</Text>
                            </div>
                        </Group>
                        <Switch defaultChecked size="md" />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <Group gap="sm">
                            <ThemeIcon variant="light" color="blue" size="lg">
                                <IconDeviceMobile size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={500}>Push Notifications</Text>
                                <Text size="xs" c="dimmed">Notificações no app mobile</Text>
                            </div>
                        </Group>
                        <Switch defaultChecked size="md" />
                    </Group>
                </Stack>
            </Card>

            {/* Event Types */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Tipos de Evento</Text>
                <Stack gap="md">
                    <Group justify="space-between">
                        <div>
                            <Text fw={500}>Novas Matrículas</Text>
                            <Text size="xs" c="dimmed">Alerta quando uma nova matrícula é realizada</Text>
                        </div>
                        <Switch defaultChecked size="md" />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <div>
                            <Text fw={500}>Pagamentos Recebidos</Text>
                            <Text size="xs" c="dimmed">Confirmação de pagamentos</Text>
                        </div>
                        <Switch defaultChecked size="md" />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <div>
                            <Text fw={500}>Leads Novos</Text>
                            <Text size="xs" c="dimmed">Alerta de novos leads capturados</Text>
                        </div>
                        <Switch defaultChecked size="md" />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <div>
                            <Text fw={500}>Cancelamentos</Text>
                            <Text size="xs" c="dimmed">Alerta de cancelamentos de matrícula</Text>
                        </div>
                        <Switch defaultChecked size="md" />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <div>
                            <Text fw={500}>Sugestões Kaizen</Text>
                            <Text size="xs" c="dimmed">Novas sugestões de melhoria</Text>
                        </div>
                        <Switch size="md" />
                    </Group>
                </Stack>
            </Card>

            {/* Recipients */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Destinatários Padrão</Text>
                <Stack gap="md">
                    <TextInput
                        label="Email do Gestor"
                        placeholder="gestor@escola.com.br"
                        defaultValue="admin@minhaescola.com.br"
                    />
                    <TextInput
                        label="WhatsApp do Gestor"
                        placeholder="11 99999-9999"
                        defaultValue="11 99999-0000"
                    />
                </Stack>
            </Card>
        </Stack>
    );
}

