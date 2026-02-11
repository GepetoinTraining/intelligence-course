'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Button, Table, Loader, Alert, Center, Modal, TextInput,
    Select, Textarea,
} from '@mantine/core';
import {
    IconMail, IconPlus, IconAlertCircle, IconCheck,
} from '@tabler/icons-react';
import { useApi, useCreate } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Template {
    id: string;
    name: string;
    templateType: 'marketing' | 'transactional' | 'notification' | 'system';
    triggerEvent: string | null;
    subject: string | null;
    bodyHtml: string | null;
    bodyText: string | null;
    variables: string | null;
    isActive: number;
    createdAt: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const typeLabels: Record<string, string> = {
    marketing: 'Marketing',
    transactional: 'Transacional',
    notification: 'Notificação',
    system: 'Sistema',
};

const typeColors: Record<string, string> = {
    marketing: 'blue',
    transactional: 'cyan',
    notification: 'grape',
    system: 'orange',
};

// ============================================================================
// PAGE
// ============================================================================

export default function TemplatesPage() {
    const { data: templates, isLoading, error, refetch } = useApi<Template[]>('/api/templates');
    const { create, isLoading: creating } = useCreate('/api/templates');

    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<string>('marketing');
    const [newSubject, setNewSubject] = useState('');
    const [newBody, setNewBody] = useState('');
    const [newTrigger, setNewTrigger] = useState('');

    const allTemplates = templates || [];
    const activeCount = allTemplates.filter(t => t.isActive).length;
    const marketingCount = allTemplates.filter(t => t.templateType === 'marketing').length;
    const transactionalCount = allTemplates.filter(t =>
        t.templateType === 'transactional' || t.templateType === 'notification'
    ).length;

    const handleCreate = async () => {
        try {
            await create({
                name: newName,
                templateType: newType,
                subject: newSubject || undefined,
                bodyText: newBody || undefined,
                triggerEvent: newTrigger || undefined,
            });
            setCreateOpen(false);
            setNewName('');
            setNewType('marketing');
            setNewSubject('');
            setNewBody('');
            setNewTrigger('');
            refetch();
        } catch { /* errors handled by hook */ }
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
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>Templates</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
                    Novo Template
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconMail size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{allTemplates.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconCheck size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="lg">{activeCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconMail size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Marketing</Text>
                            <Text fw={700} size="lg">{marketingCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg"><IconMail size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Transacional / Notif.</Text>
                            <Text fw={700} size="lg">{transactionalCount}</Text>
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
                                <Table.Th>Gatilho</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Criado</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allTemplates.map((template) => (
                                <Table.Tr key={template.id}>
                                    <Table.Td><Text fw={500}>{template.name}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm" color={typeColors[template.templateType]}>
                                            {typeLabels[template.templateType] || template.templateType}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td><Text lineClamp={1} size="sm">{template.subject || '-'}</Text></Table.Td>
                                    <Table.Td><Text size="sm" c="dimmed">{template.triggerEvent || '-'}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge color={template.isActive ? 'green' : 'gray'} variant="light">
                                            {template.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(template.createdAt)}</Table.Td>
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

            {/* Create Modal */}
            <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Novo Template" size="lg">
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Ex: Boas-vindas Matrícula"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                    />
                    <Select
                        label="Tipo"
                        data={[
                            { value: 'marketing', label: '📢 Marketing' },
                            { value: 'transactional', label: '🧾 Transacional' },
                            { value: 'notification', label: '🔔 Notificação' },
                            { value: 'system', label: '⚙️ Sistema' },
                        ]}
                        value={newType}
                        onChange={(v) => setNewType(v || 'marketing')}
                    />
                    <TextInput
                        label="Gatilho (opcional)"
                        placeholder="Ex: enrollment_created, payment_reminder"
                        value={newTrigger}
                        onChange={(e) => setNewTrigger(e.target.value)}
                        description="Evento que dispara o envio automático"
                    />
                    <TextInput
                        label="Assunto"
                        placeholder="Assunto do email/mensagem"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                    />
                    <Textarea
                        label="Corpo"
                        placeholder="Use {{nome}}, {{escola}}, {{valor}} como variáveis..."
                        minRows={6}
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        description="Variáveis: {{nome}}, {{email}}, {{escola}}, {{turma}}, {{valor}}, {{vencimento}}"
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            disabled={!newName.trim()}
                            loading={creating}
                            onClick={handleCreate}
                        >
                            Criar Template
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
