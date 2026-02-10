'use client';

import {
    Title, Text, Stack, Card, Group, ThemeIcon, Button, TextInput, Switch,
    Divider, Loader, Alert, Center,
} from '@mantine/core';
import {
    IconBell, IconMail, IconBrandWhatsapp, IconDeviceMobile, IconCheck,
    IconAlertCircle, IconDeviceFloppy,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';

interface NotifSettings {
    channels: { email: boolean; whatsapp: boolean; push: boolean };
    events: Record<string, boolean>;
    recipients: { email: string; phone: string };
}

const DEFAULT_EVENTS = [
    { key: 'enrollment', label: 'Novas Matrículas', desc: 'Alerta quando uma nova matrícula é realizada' },
    { key: 'payment', label: 'Pagamentos Recebidos', desc: 'Confirmação de pagamentos' },
    { key: 'lead', label: 'Leads Novos', desc: 'Alerta de novos leads capturados' },
    { key: 'cancellation', label: 'Cancelamentos', desc: 'Alerta de cancelamentos de matrícula' },
    { key: 'kaizen', label: 'Sugestões Kaizen', desc: 'Novas sugestões de melhoria' },
    { key: 'attendance', label: 'Faltas', desc: 'Alerta de ausências de alunos' },
];

export default function NotificacoesConfigPage() {
    const { data: apiData, isLoading, error, refetch } = useApi<any>('/api/notifications');

    const [settings, setSettings] = useState<NotifSettings>({
        channels: { email: true, whatsapp: true, push: true },
        events: Object.fromEntries(DEFAULT_EVENTS.map(e => [e.key, e.key !== 'kaizen'])),
        recipients: { email: '', phone: '' },
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (apiData) {
            const d = Array.isArray(apiData) ? apiData[0] : apiData;
            if (d?.channels) setSettings(prev => ({ ...prev, channels: d.channels }));
            if (d?.events) setSettings(prev => ({ ...prev, events: d.events }));
            if (d?.recipients) setSettings(prev => ({ ...prev, recipients: d.recipients }));
        }
    }, [apiData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            refetch();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle />} color="red" title="Erro">{String(error)}</Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Notificações</Title>
                </div>
                <Button
                    leftSection={<IconDeviceFloppy size={16} />}
                    onClick={handleSave}
                    loading={saving}
                    color={saved ? 'green' : undefined}
                >
                    {saved ? 'Salvo!' : 'Salvar Alterações'}
                </Button>
            </Group>

            {/* Channels */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Canais de Notificação</Text>
                <Stack gap="md">
                    {[
                        { key: 'email' as const, label: 'Email', desc: 'Notificações por email', icon: IconMail, color: 'red' },
                        { key: 'whatsapp' as const, label: 'WhatsApp', desc: 'Mensagens via WhatsApp Business', icon: IconBrandWhatsapp, color: 'green' },
                        { key: 'push' as const, label: 'Push Notifications', desc: 'Notificações no app mobile', icon: IconDeviceMobile, color: 'blue' },
                    ].map((ch, i) => (
                        <div key={ch.key}>
                            {i > 0 && <Divider mb="md" />}
                            <Group justify="space-between">
                                <Group gap="sm">
                                    <ThemeIcon variant="light" color={ch.color} size="lg"><ch.icon size={20} /></ThemeIcon>
                                    <div>
                                        <Text fw={500}>{ch.label}</Text>
                                        <Text size="xs" c="dimmed">{ch.desc}</Text>
                                    </div>
                                </Group>
                                <Switch
                                    checked={settings.channels[ch.key]}
                                    onChange={e => setSettings(p => ({ ...p, channels: { ...p.channels, [ch.key]: e.currentTarget.checked } }))}
                                    size="md"
                                />
                            </Group>
                        </div>
                    ))}
                </Stack>
            </Card>

            {/* Event Types */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Tipos de Evento</Text>
                <Stack gap="md">
                    {DEFAULT_EVENTS.map((ev, i) => (
                        <div key={ev.key}>
                            {i > 0 && <Divider mb="md" />}
                            <Group justify="space-between">
                                <div>
                                    <Text fw={500}>{ev.label}</Text>
                                    <Text size="xs" c="dimmed">{ev.desc}</Text>
                                </div>
                                <Switch
                                    checked={settings.events[ev.key] ?? false}
                                    onChange={e => setSettings(p => ({ ...p, events: { ...p.events, [ev.key]: e.currentTarget.checked } }))}
                                    size="md"
                                />
                            </Group>
                        </div>
                    ))}
                </Stack>
            </Card>

            {/* Recipients */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Destinatários Padrão</Text>
                <Stack gap="md">
                    <TextInput
                        label="Email do Gestor"
                        placeholder="gestor@escola.com.br"
                        value={settings.recipients.email}
                        onChange={e => setSettings(p => ({ ...p, recipients: { ...p.recipients, email: e.target.value } }))}
                    />
                    <TextInput
                        label="WhatsApp do Gestor"
                        placeholder="11 99999-9999"
                        value={settings.recipients.phone}
                        onChange={e => setSettings(p => ({ ...p, recipients: { ...p.recipients, phone: e.target.value } }))}
                    />
                </Stack>
            </Card>
        </Stack>
    );
}
