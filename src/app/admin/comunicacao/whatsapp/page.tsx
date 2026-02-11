'use client';

import { useState, useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Button, Stepper, TextInput, Alert, Loader, Center, Table,
    Tabs, ActionIcon, Avatar, Tooltip, Modal, Textarea, Select,
} from '@mantine/core';
import {
    IconBrandWhatsapp, IconPlug, IconShieldCheck, IconMessageCircle,
    IconAlertCircle, IconCheck, IconSettings, IconSearch,
    IconSend, IconUsers, IconTemplate, IconHash,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface WhatsAppConfig {
    phoneNumberId?: string;
    businessAccountId?: string;
    verifiedName?: string;
    qualityRating?: string;
    status?: 'connected' | 'disconnected' | 'pending';
}

interface Conversation {
    id: string;
    type: string;
    name?: string;
    channel?: string;
    messageCount: number;
    lastMessageAt?: number;
    participants?: { id: string; name: string; role: string }[];
    lastMessage?: { content: string; senderName: string; createdAt: number };
}

interface Template {
    id: string;
    name: string;
    templateType: string;
    subject: string | null;
    isActive: number;
    triggerEvent: string | null;
    createdAt: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function fmtDate(ts?: number): string {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

function fmtRelative(ts?: number): string {
    if (!ts) return '';
    const diff = Math.floor(Date.now() / 1000) - ts;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

// ============================================================================
// PAGE
// ============================================================================

export default function WhatsAppPage() {
    const { data: conversations, isLoading: convLoading } = useApi<Conversation[]>('/api/communicator/conversations');
    const { data: templates, isLoading: tplLoading } = useApi<Template[]>('/api/templates');

    const [activeTab, setActiveTab] = useState<string | null>('conversations');
    const [search, setSearch] = useState('');
    const [sendOpen, setSendOpen] = useState(false);
    const [sendRecipient, setSendRecipient] = useState('');
    const [sendTemplate, setSendTemplate] = useState('');
    const [sendMessage, setSendMessage] = useState('');

    // Simulated connection status (would come from org settings)
    const [isConnected] = useState(false);

    // Filter WhatsApp-related conversations and templates
    const whatsappConversations = useMemo(() => {
        const all = conversations || [];
        return all.filter(c => {
            if (search.trim()) {
                const q = search.toLowerCase();
                return c.name?.toLowerCase().includes(q) ||
                    c.lastMessage?.content?.toLowerCase().includes(q);
            }
            return true;
        });
    }, [conversations, search]);

    const whatsappTemplates = useMemo(() => {
        return (templates || []).filter(t =>
            t.templateType === 'transactional' || t.templateType === 'notification'
        );
    }, [templates]);

    const isLoading = convLoading || tplLoading;

    // Stats
    const totalConversations = (conversations || []).length;
    const activeToday = (conversations || []).filter(c => {
        if (!c.lastMessageAt) return false;
        const dayAgo = Math.floor(Date.now() / 1000) - 86400;
        return c.lastMessageAt > dayAgo;
    }).length;

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    // ====================================================================
    // SETUP WIZARD (when not connected)
    // ====================================================================
    if (!isConnected) {
        return (
            <Stack gap="lg">
                <div>
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>
                        <Group gap="xs">
                            <IconBrandWhatsapp size={28} />
                            WhatsApp Business
                        </Group>
                    </Title>
                </div>

                <Card withBorder p="xl">
                    <Stepper active={0} orientation="vertical">
                        <Stepper.Step
                            label="Criar conta no Meta Business"
                            description="Acesse business.facebook.com e crie uma conta de negócios"
                            icon={<IconPlug size={18} />}
                        >
                            <Stack gap="sm" mt="md">
                                <Text size="sm">
                                    Para integrar o WhatsApp, você precisa de uma conta Meta Business com a API do WhatsApp Business habilitada.
                                </Text>
                                <Button
                                    component="a"
                                    href="https://business.facebook.com"
                                    target="_blank"
                                    variant="light"
                                    leftSection={<IconPlug size={16} />}
                                >
                                    Acessar Meta Business
                                </Button>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step
                            label="Configurar API do WhatsApp"
                            description="Obtenha o Phone Number ID e Token de acesso"
                            icon={<IconSettings size={18} />}
                        >
                            <Stack gap="sm" mt="md">
                                <TextInput label="Phone Number ID" placeholder="Ex: 123456789012345" />
                                <TextInput label="Business Account ID" placeholder="Ex: 987654321098765" />
                                <TextInput label="Token de Acesso Permanente" placeholder="EAABs..." />
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step
                            label="Verificar Webhook"
                            description="Configure o webhook para receber mensagens"
                            icon={<IconShieldCheck size={18} />}
                        >
                            <Stack gap="sm" mt="md">
                                <Text size="sm">
                                    Configure o seguinte URL de webhook na sua conta Meta:
                                </Text>
                                <TextInput
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/whatsapp`}
                                    label="URL do Webhook"
                                />
                                <TextInput label="Token de Verificação" placeholder="Gere um token seguro" />
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step
                            label="Pronto!"
                            description="WhatsApp integrado com sucesso"
                            icon={<IconCheck size={18} />}
                        />
                    </Stepper>

                    <Group mt="xl">
                        <Button>Salvar e Verificar</Button>
                    </Group>
                </Card>

                {/* Preview of what they'll get */}
                <Alert icon={<IconBrandWhatsapp size={16} />} color="green" variant="light" title="O que você terá">
                    <Stack gap={4}>
                        <Text size="sm">• Envio de mensagens via templates aprovados pelo Meta</Text>
                        <Text size="sm">• Atendimento ao vivo com conversas centralizadas</Text>
                        <Text size="sm">• Automações: cobranças, lembretes, avisos</Text>
                        <Text size="sm">• Comunicação trans-escola via #handle</Text>
                    </Stack>
                </Alert>
            </Stack>
        );
    }

    // ====================================================================
    // OPERATIONAL VIEW (when connected)
    // ====================================================================
    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>
                        <Group gap="xs">
                            <IconBrandWhatsapp size={28} />
                            WhatsApp Business
                            <Badge color="green" variant="light" size="sm">Conectado</Badge>
                        </Group>
                    </Title>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconSettings size={16} />}>
                        Configurações
                    </Button>
                    <Button leftSection={<IconSend size={16} />} onClick={() => setSendOpen(true)}>
                        Nova Mensagem
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconBrandWhatsapp size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Status</Text>
                            <Text fw={700} size="lg" c="green">Online</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconMessageCircle size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conversas</Text>
                            <Text fw={700} size="lg">{totalConversations}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="cyan" size="lg"><IconSend size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas (24h)</Text>
                            <Text fw={700} size="lg">{activeToday}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg"><IconTemplate size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Templates</Text>
                            <Text fw={700} size="lg">{whatsappTemplates.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Content Tabs */}
            <Card withBorder p="md">
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List mb="md">
                        <Tabs.Tab value="conversations" leftSection={<IconMessageCircle size={14} />}>
                            Conversas
                        </Tabs.Tab>
                        <Tabs.Tab value="templates" leftSection={<IconTemplate size={14} />}>
                            Templates ({whatsappTemplates.length})
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Conversations Tab */}
                    <Tabs.Panel value="conversations">
                        <Stack gap="sm">
                            <TextInput
                                placeholder="Buscar conversas..."
                                leftSection={<IconSearch size={16} />}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {whatsappConversations.length > 0 ? (
                                whatsappConversations.map((conv) => (
                                    <Card key={conv.id} withBorder p="sm" style={{ cursor: 'pointer' }}>
                                        <Group justify="space-between" wrap="nowrap">
                                            <Group wrap="nowrap" style={{ flex: 1 }}>
                                                <Avatar size={40} radius="xl" color="green">
                                                    {conv.name?.charAt(0)?.toUpperCase() || '?'}
                                                </Avatar>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text fw={600} size="sm" lineClamp={1}>{conv.name || `Chat #${conv.id.substring(0, 6)}`}</Text>
                                                    {conv.lastMessage && (
                                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                                            {conv.lastMessage.content}
                                                        </Text>
                                                    )}
                                                </div>
                                            </Group>
                                            <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
                                                <Text size="xs" c="dimmed">{fmtRelative(conv.lastMessageAt)}</Text>
                                                {conv.messageCount > 0 && (
                                                    <Badge size="xs" variant="filled" color="green" circle>
                                                        {conv.messageCount}
                                                    </Badge>
                                                )}
                                            </Stack>
                                        </Group>
                                    </Card>
                                ))
                            ) : (
                                <Center py="xl">
                                    <Stack align="center" gap="xs">
                                        <IconBrandWhatsapp size={48} color="gray" />
                                        <Text c="dimmed">Nenhuma conversa encontrada</Text>
                                    </Stack>
                                </Center>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    {/* Templates Tab */}
                    <Tabs.Panel value="templates">
                        {whatsappTemplates.length > 0 ? (
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Nome</Table.Th>
                                        <Table.Th>Tipo</Table.Th>
                                        <Table.Th>Evento</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Criado em</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {whatsappTemplates.map((tpl) => (
                                        <Table.Tr key={tpl.id}>
                                            <Table.Td><Text fw={500}>{tpl.name}</Text></Table.Td>
                                            <Table.Td>
                                                <Badge variant="light" size="sm">
                                                    {tpl.templateType === 'transactional' ? 'Transacional' : 'Notificação'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td><Text size="sm" c="dimmed">{tpl.triggerEvent || '-'}</Text></Table.Td>
                                            <Table.Td>
                                                <Badge color={tpl.isActive ? 'green' : 'gray'} variant="light">
                                                    {tpl.isActive ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>{fmtDate(tpl.createdAt)}</Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Center py="xl">
                                <Stack align="center" gap="xs">
                                    <IconTemplate size={48} color="gray" />
                                    <Text c="dimmed">Nenhum template de WhatsApp</Text>
                                    <Button variant="light" size="sm">Criar Template</Button>
                                </Stack>
                            </Center>
                        )}
                    </Tabs.Panel>
                </Tabs>
            </Card>

            {/* Send Message Modal */}
            <Modal opened={sendOpen} onClose={() => setSendOpen(false)} title="Enviar via WhatsApp" size="lg">
                <Stack gap="md">
                    <TextInput
                        label="Telefone / #Handle"
                        placeholder="+55 11 99999-9999 ou #escola-parceira"
                        leftSection={<IconHash size={16} />}
                        value={sendRecipient}
                        onChange={(e) => setSendRecipient(e.target.value)}
                        description="Use #handle para enviar para outra escola NodeZero"
                    />
                    <Select
                        label="Template (opcional)"
                        placeholder="Selecione um template aprovado..."
                        data={whatsappTemplates.map(t => ({ value: t.id, label: t.name }))}
                        value={sendTemplate}
                        onChange={(v) => setSendTemplate(v || '')}
                        clearable
                    />
                    <Textarea
                        label="Mensagem"
                        placeholder="Escreva sua mensagem..."
                        minRows={4}
                        value={sendMessage}
                        onChange={(e) => setSendMessage(e.target.value)}
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setSendOpen(false)}>Cancelar</Button>
                        <Button
                            color="green"
                            leftSection={<IconBrandWhatsapp size={16} />}
                            disabled={!sendRecipient.trim() || !sendMessage.trim()}
                        >
                            Enviar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
