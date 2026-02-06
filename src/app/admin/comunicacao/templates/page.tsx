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
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconMail,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Template {
    id: string;
    name: string;
    templateType: 'marketing' | 'transactional' | 'notification' | 'system';
    triggerEvent: string | null;
    subject: string | null;
    isActive: number;
    createdAt: number;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const typeLabels: Record<string, string> = {
    marketing: 'Marketing',
    transactional: 'Transacional',
    notification: 'Notificação',
    system: 'Sistema',
};

export default function TemplatesPage() {
    const { data: templates, isLoading, error, refetch } = useApi<Template[]>('/api/templates');

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

    const allTemplates = templates || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>Templates</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Template</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconMail size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{allTemplates.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconMail size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="lg">{allTemplates.filter(t => t.isActive).length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {allTemplates.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Assunto</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allTemplates.map((template) => (
                                <Table.Tr key={template.id}>
                                    <Table.Td><Text fw={500}>{template.name}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {typeLabels[template.templateType] || template.templateType}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td><Text lineClamp={1}>{template.subject || '-'}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge color={template.isActive ? 'green' : 'gray'} variant="light">
                                            {template.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconMail size={48} color="gray" />
                            <Text c="dimmed">Nenhum template encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

