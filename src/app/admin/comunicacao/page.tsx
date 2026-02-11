'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Loader, Center, Alert, Button, Badge,
} from '@mantine/core';
import {
    IconAlertCircle, IconArrowRight, IconBell, IconBrandWhatsapp,
    IconInbox, IconMessages, IconRobot, IconTemplate, IconSend,
    IconHash, IconPencil, IconUsers,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { DiagramToggle } from '@/components/DiagramToggle';

// ============================================================================
// TYPES
// ============================================================================

interface Conversation {
    id: string;
    type: string;
    lastMessageAt?: number;
    messageCount: number;
}

interface Template {
    id: string;
    templateType: string;
    isActive: number;
}

interface SafetyAlert {
    id: string;
    resolvedAt: number | null;
}

// ============================================================================
// PAGE
// ============================================================================

export default function ComunicacaoHubPage() {
    const { data: conversations, isLoading: convLoading, error: convError, refetch } = useApi<Conversation[]>('/api/communicator/conversations');
    const { data: templates, isLoading: tplLoading } = useApi<Template[]>('/api/templates');
    const { data: alerts, isLoading: alertLoading } = useApi<SafetyAlert[]>('/api/alerts');

    const isLoading = convLoading || tplLoading || alertLoading;

    const convCount = (conversations || []).length;
    const directCount = (conversations || []).filter(c => c.type === 'direct').length;
    const groupCount = (conversations || []).filter(c => c.type === 'group' || c.type === 'broadcast').length;
    const templateCount = (templates || []).length;
    const activeTemplates = (templates || []).filter(t => t.isActive).length;
    const automationCount = (templates || []).filter(t =>
        t.templateType === 'notification' || t.templateType === 'system'
    ).length;
    const pendingAlerts = (alerts || []).filter(a => !a.resolvedAt).length;
    const recentActivity = (conversations || []).filter(c => {
        if (!c.lastMessageAt) return false;
        return c.lastMessageAt > Math.floor(Date.now() / 1000) - 86400;
    }).length;

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    const LINKS = [
        { key: 'inbox', label: 'Caixa de Entrada', icon: IconInbox, color: 'blue', href: '/admin/comunicacao/inbox', stat: `${convCount} conversas` },
        { key: 'comunicador', label: 'Comunicador', icon: IconMessages, color: 'cyan', href: '/admin/comunicacao/comunicador', stat: `${directCount} diretas` },
        { key: 'avisos', label: 'Avisos', icon: IconBell, color: 'yellow', href: '/admin/comunicacao/avisos', stat: pendingAlerts > 0 ? `${pendingAlerts} pendentes` : 'Nenhum pendente' },
        { key: 'automacoes', label: 'Automações', icon: IconRobot, color: 'grape', href: '/admin/comunicacao/automacoes', stat: `${automationCount} configuradas` },
        { key: 'templates', label: 'Templates', icon: IconTemplate, color: 'teal', href: '/admin/comunicacao/templates', stat: `${activeTemplates} ativos` },
        { key: 'whatsapp', label: 'WhatsApp', icon: IconBrandWhatsapp, color: 'green', href: '/admin/comunicacao/whatsapp', stat: 'Configurar integração' },
        { key: 'enviados', label: 'Enviados', icon: IconSend, color: 'orange', href: '/admin/comunicacao/enviados', stat: '' },
        { key: 'rascunhos', label: 'Rascunhos', icon: IconPencil, color: 'gray', href: '/admin/comunicacao/rascunhos', stat: '' },
    ];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Administração</Text>
                    <Title order={2}>Comunicação</Title>
                </div>
                <DiagramToggle route="/api/communicator/conversations" data={conversations || []} title="Fluxo de Comunicação" />
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconMessages size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conversas</Text>
                            <Text fw={700} size="xl">{convCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="cyan" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Grupos</Text>
                            <Text fw={700} size="xl">{groupCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconSend size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas (24h)</Text>
                            <Text fw={700} size="xl">{recentActivity}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg"><IconBell size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Avisos Pendentes</Text>
                            <Text fw={700} size="xl" c={pendingAlerts > 0 ? 'orange' : undefined}>
                                {pendingAlerts}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {convError && (
                <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                    Dados offline — {convError}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Trans-School Communication Badge */}
            <Card withBorder p="md" bg="var(--mantine-color-blue-0)">
                <Group>
                    <ThemeIcon variant="light" color="blue" size="lg"><IconHash size={20} /></ThemeIcon>
                    <div style={{ flex: 1 }}>
                        <Text fw={600} size="sm">Comunicação Trans-Escola</Text>
                        <Text size="xs" c="dimmed">
                            Use #handles para se comunicar com outras escolas NodeZero. Configure o handle da sua escola em Configurações.
                        </Text>
                    </div>
                    <Button variant="light" size="xs" component="a" href="/admin/configuracoes/escola">
                        Configurar Handle
                    </Button>
                </Group>
            </Card>

            {/* Quick Links */}
            <Title order={4}>Acesso Rápido</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Card
                            key={link.key}
                            withBorder
                            p="lg"
                            style={{ cursor: 'pointer' }}
                            onClick={() => window.location.href = link.href}
                        >
                            <Group justify="space-between">
                                <Group>
                                    <ThemeIcon variant="light" color={link.color} size="lg" radius="md">
                                        <Icon size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text fw={500}>{link.label}</Text>
                                        {link.stat && <Text size="xs" c="dimmed">{link.stat}</Text>}
                                    </div>
                                </Group>
                                <IconArrowRight size={16} color="gray" />
                            </Group>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
}
