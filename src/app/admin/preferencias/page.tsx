'use client';

import { useState } from 'react';
import {
    Container, Title, Paper, Stack, Switch, Select,
    Button, Divider, Group, Text, ThemeIcon,
} from '@mantine/core';
import {
    IconDeviceFloppy, IconBell, IconLanguage, IconPalette,
    IconClock, IconMail,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useUserContext } from '@/hooks/useUser';

export default function PreferenciasPage() {
    const { user } = useUserContext();

    const [prefs, setPrefs] = useState({
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: false,
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        theme: 'auto',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/users/${user?.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences: prefs }),
            });
            notifications?.show?.({
                title: 'Preferências salvas',
                message: 'Suas preferências foram atualizadas com sucesso.',
                color: 'green',
            });
        } catch (e) {
            console.error('Error saving preferences:', e);
        } finally {
            setSaving(false);
        }
    };

    const updatePref = (key: string, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Container size="md" py="xl">
            <Title order={2} mb="lg">Preferências</Title>

            {/* Notifications */}
            <Paper withBorder p="xl" radius="md" mb="lg">
                <Group mb="md" gap="xs">
                    <ThemeIcon variant="light" color="blue"><IconBell size={18} /></ThemeIcon>
                    <Title order={4}>Notificações</Title>
                </Group>
                <Stack gap="md">
                    <Switch
                        label="Notificações por e-mail"
                        description="Receba atualizações importantes por e-mail"
                        checked={prefs.emailNotifications}
                        onChange={(e) => updatePref('emailNotifications', e.currentTarget.checked)}
                    />
                    <Switch
                        label="Notificações push"
                        description="Receba notificações em tempo real no navegador"
                        checked={prefs.pushNotifications}
                        onChange={(e) => updatePref('pushNotifications', e.currentTarget.checked)}
                    />
                    <Switch
                        label="Resumo semanal"
                        description="Receba um resumo semanal com métricas e atividades"
                        checked={prefs.weeklyDigest}
                        onChange={(e) => updatePref('weeklyDigest', e.currentTarget.checked)}
                    />
                </Stack>
            </Paper>

            {/* Regional */}
            <Paper withBorder p="xl" radius="md" mb="lg">
                <Group mb="md" gap="xs">
                    <ThemeIcon variant="light" color="teal"><IconLanguage size={18} /></ThemeIcon>
                    <Title order={4}>Regional</Title>
                </Group>
                <Stack gap="md">
                    <Select
                        label="Idioma"
                        leftSection={<IconLanguage size={16} />}
                        value={prefs.language}
                        onChange={(v) => updatePref('language', v)}
                        data={[
                            { value: 'pt-BR', label: 'Português (Brasil)' },
                            { value: 'en', label: 'English' },
                            { value: 'es', label: 'Español' },
                        ]}
                    />
                    <Select
                        label="Fuso horário"
                        leftSection={<IconClock size={16} />}
                        value={prefs.timezone}
                        onChange={(v) => updatePref('timezone', v)}
                        data={[
                            { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
                            { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
                            { value: 'America/Belem', label: 'Belém (GMT-3)' },
                            { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
                        ]}
                    />
                </Stack>
            </Paper>

            {/* Appearance */}
            <Paper withBorder p="xl" radius="md" mb="lg">
                <Group mb="md" gap="xs">
                    <ThemeIcon variant="light" color="violet"><IconPalette size={18} /></ThemeIcon>
                    <Title order={4}>Aparência</Title>
                </Group>
                <Select
                    label="Tema"
                    leftSection={<IconPalette size={16} />}
                    value={prefs.theme}
                    onChange={(v) => updatePref('theme', v)}
                    data={[
                        { value: 'auto', label: 'Automático (seguir sistema)' },
                        { value: 'light', label: 'Claro' },
                        { value: 'dark', label: 'Escuro' },
                        { value: 'brand', label: 'Marca' },
                    ]}
                />
            </Paper>

            <Divider my="lg" />

            <Group justify="flex-end">
                <Button
                    size="md"
                    leftSection={<IconDeviceFloppy size={18} />}
                    onClick={handleSave}
                    loading={saving}
                >
                    Salvar Preferências
                </Button>
            </Group>
        </Container>
    );
}
