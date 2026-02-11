'use client';

import { useState, useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Button, Table, Switch, Loader, Alert, Center, Modal,
    TextInput, Select, Textarea, NumberInput,
} from '@mantine/core';
import {
    IconBell, IconPlus, IconMail, IconBrandWhatsapp, IconDeviceMobile,
    IconAlertCircle, IconRobot, IconClock, IconPlayerPlay, IconPlayerPause,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { DiagramToggle } from '@/components/DiagramToggle';

// ============================================================================
// TYPES
// ============================================================================

interface Template {
    id: string;
    name: string;
    templateType: 'marketing' | 'transactional' | 'notification' | 'system';
    triggerEvent: string | null;
    subject: string | null;
    bodyText: string | null;
    isActive: number;
    createdAt: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRIGGER_OPTIONS = [
    { value: 'payment_reminder', label: 'Lembrete de Pagamento', description: 'X dias antes do vencimento' },
    { value: 'payment_overdue', label: 'Cobrança Vencida', description: 'X dias após o vencimento' },
    { value: 'enrollment_created', label: 'Nova Matrícula', description: 'Ao confirmar matrícula' },
    { value: 'class_reminder', label: 'Confirmação de Aula', description: 'X horas antes da aula' },
    { value: 'absence_detected', label: 'Ausência Detectada', description: 'Ao registrar falta' },
    { value: 'birthday', label: 'Aniversário', description: 'Na data de nascimento' },
    { value: 'grade_posted', label: 'Nota Lançada', description: 'Ao lançar notas' },
    { value: 'document_expiring', label: 'Documento Expirando', description: 'X dias antes do vencimento' },
];

const CHANNEL_ICONS: Record<string, { icon: typeof IconMail; color: string; label: string }> = {
    email: { icon: IconMail, color: 'blue', label: 'Email' },
    whatsapp: { icon: IconBrandWhatsapp, color: 'green', label: 'WhatsApp' },
    push: { icon: IconDeviceMobile, color: 'grape', label: 'Push' },
    sms: { icon: IconDeviceMobile, color: 'orange', label: 'SMS' },
};

function fmtDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

// ============================================================================
// PAGE
// ============================================================================

export default function AutomacoesPage() {
    const { data: templates, isLoading, error, refetch } = useApi<Template[]>('/api/templates');

    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTrigger, setNewTrigger] = useState('');
    const [newChannel, setNewChannel] = useState('email');
    const [newSubject, setNewSubject] = useState('');
    const [newBody, setNewBody] = useState('');

    // Filter to automation-type templates (notification + system)
    const automations = useMemo(() => {
        return (templates || []).filter(t =>
            t.templateType === 'notification' || t.templateType === 'system'
        );
    }, [templates]);

    const active = automations.filter(a => a.isActive).length;
    const inactive = automations.length - active;

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
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>Automações</Title>
                </div>
                <Group>
                    <DiagramToggle route="/api/templates" data={automations} forceType="flowchart" title="Fluxo de Automações" />
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
                        Nova Automação
                    </Button>
                </Group>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconRobot size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Automações</Text>
                            <Text fw={700} size="lg">{automations.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconPlayerPlay size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{active}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg"><IconPlayerPause size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pausadas</Text>
                            <Text fw={700} size="lg">{inactive}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg"><IconClock size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Gatilhos Disponíveis</Text>
                            <Text fw={700} size="lg">{TRIGGER_OPTIONS.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Automations Table */}
            <Card withBorder p="md">
                {automations.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Automação</Table.Th>
                                <Table.Th>Gatilho</Table.Th>
                                <Table.Th>Assunto</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Criado</Table.Th>
                                <Table.Th>Ativo</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {automations.map((auto) => {
                                const trigger = TRIGGER_OPTIONS.find(t => t.value === auto.triggerEvent);
                                return (
                                    <Table.Tr key={auto.id}>
                                        <Table.Td>
                                            <Text fw={500}>{auto.name}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <IconClock size={14} />
                                                <Text size="sm">{trigger?.label || auto.triggerEvent || 'Manual'}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" lineClamp={1}>{auto.subject || '-'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={auto.isActive ? 'green' : 'gray'}
                                                variant="light"
                                            >
                                                {auto.isActive ? 'Ativa' : 'Pausada'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{fmtDate(auto.createdAt)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Switch defaultChecked={!!auto.isActive} size="sm" />
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconRobot size={48} color="gray" />
                            <Text c="dimmed">Nenhuma automação configurada</Text>
                            <Text size="sm" c="dimmed">Crie automações para enviar notificações automaticamente</Text>
                            <Button variant="light" size="sm" onClick={() => setCreateOpen(true)}>
                                Criar primeira automação
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Create Automation Modal */}
            <Modal
                opened={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Nova Automação"
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Ex: Lembrete de Pagamento - 3 dias"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                    />
                    <Select
                        label="Gatilho"
                        placeholder="Quando disparar?"
                        data={TRIGGER_OPTIONS.map(t => ({
                            value: t.value,
                            label: `${t.label} — ${t.description}`,
                        }))}
                        value={newTrigger}
                        onChange={(v) => setNewTrigger(v || '')}
                        required
                    />
                    <Select
                        label="Canal"
                        data={[
                            { value: 'email', label: '📧 Email' },
                            { value: 'whatsapp', label: '💬 WhatsApp' },
                            { value: 'push', label: '📱 Push Notification' },
                        ]}
                        value={newChannel}
                        onChange={(v) => setNewChannel(v || 'email')}
                    />
                    <TextInput
                        label="Assunto"
                        placeholder="Assunto da mensagem"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                    />
                    <Textarea
                        label="Corpo da Mensagem"
                        placeholder="Use {{nome}}, {{valor}}, {{vencimento}} como variáveis..."
                        minRows={4}
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        description="Variáveis disponíveis: {{nome}}, {{valor}}, {{vencimento}}, {{turma}}, {{escola}}"
                    />
                    <Alert variant="light" color="blue" icon={<IconBell size={16} />}>
                        A automação será criada como template do tipo &quot;notificação&quot; e poderá ser ativada/desativada a qualquer momento.
                    </Alert>
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            disabled={!newName.trim() || !newTrigger}
                        >
                            Criar Automação
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
