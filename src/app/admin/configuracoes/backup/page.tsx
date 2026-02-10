'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon, Button,
    Select, Checkbox, Divider, Loader, Alert, Center, TextInput,
} from '@mantine/core';
import {
    IconDatabase, IconDownload, IconCheck, IconCalendar, IconAlertCircle,
    IconDeviceFloppy, IconRefresh,
} from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

export default function BackupPage() {
    const { data: apiData, isLoading, error, refetch } = useApi<any>('/api/export');

    const [settings, setSettings] = useState({
        frequency: 'daily',
        time: '03:00',
        retention: '30',
        includeFiles: true,
        includeDatabase: true,
        notifyAfter: false,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const backupHistory = useMemo(() => {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            return apiData.slice(0, 10).map((b: any) => ({
                date: b.createdAt ? new Date(b.createdAt * 1000).toLocaleString('pt-BR') : '—',
                size: b.size || '—',
                status: b.status || 'success',
                url: b.url,
            }));
        }
        return [];
    }, [apiData]);

    useEffect(() => {
        if (apiData && !Array.isArray(apiData) && apiData.settings) {
            setSettings(prev => ({ ...prev, ...apiData.settings }));
        }
    }, [apiData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/export', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            refetch();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleManualBackup = async () => {
        try {
            await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'manual' }),
            });
            refetch();
        } catch (e) { console.error(e); }
    };

    const freqLabel = { hourly: 'Hora', daily: 'Diário', weekly: 'Semanal' }[settings.frequency] || settings.frequency;

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle />} color="red" title="Erro">{String(error)}</Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Backup & Dados</Title>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconDownload size={16} />} onClick={handleManualBackup}>
                        Backup Manual
                    </Button>
                    <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving} color={saved ? 'green' : undefined}>
                        {saved ? 'Salvo!' : 'Salvar Config'}
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconCheck size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Último Backup</Text>
                            <Text fw={700} size="lg">
                                {backupHistory.length > 0 ? backupHistory[0].date : '—'}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconDatabase size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Tamanho</Text>
                            <Text fw={700} size="lg">
                                {backupHistory.length > 0 ? backupHistory[0].size : '—'}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg"><IconCalendar size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Frequência</Text>
                            <Text fw={700} size="lg">{freqLabel}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg"><IconDatabase size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Retenção</Text>
                            <Text fw={700} size="lg">{settings.retention} dias</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={500} mb="md">Configurações de Backup</Text>
                <Stack gap="md">
                    <Select
                        label="Frequência"
                        value={settings.frequency}
                        onChange={v => setSettings(p => ({ ...p, frequency: v || 'daily' }))}
                        data={[
                            { value: 'hourly', label: 'A cada hora' },
                            { value: 'daily', label: 'Diário' },
                            { value: 'weekly', label: 'Semanal' },
                        ]}
                    />
                    <TextInput
                        label="Horário do Backup"
                        value={settings.time}
                        onChange={e => setSettings(p => ({ ...p, time: e.target.value }))}
                        description="Horário de execução do backup automático"
                    />
                    <Select
                        label="Retenção"
                        value={settings.retention}
                        onChange={v => setSettings(p => ({ ...p, retention: v || '30' }))}
                        data={[
                            { value: '7', label: '7 dias' },
                            { value: '15', label: '15 dias' },
                            { value: '30', label: '30 dias' },
                            { value: '90', label: '90 dias' },
                        ]}
                    />
                    <Divider />
                    <Checkbox checked={settings.includeFiles} onChange={e => setSettings(p => ({ ...p, includeFiles: e.currentTarget.checked }))} label="Backup de arquivos (fotos, documentos)" />
                    <Checkbox checked={settings.includeDatabase} onChange={e => setSettings(p => ({ ...p, includeDatabase: e.currentTarget.checked }))} label="Backup do banco de dados" />
                    <Checkbox checked={settings.notifyAfter} onChange={e => setSettings(p => ({ ...p, notifyAfter: e.currentTarget.checked }))} label="Enviar notificação após backup" />
                </Stack>
            </Card>

            <Card withBorder p="md">
                <Group justify="space-between" mb="md">
                    <Text fw={500}>Backups Recentes</Text>
                    <Button variant="subtle" size="xs" leftSection={<IconRefresh size={14} />} onClick={() => refetch()}>
                        Atualizar
                    </Button>
                </Group>
                {backupHistory.length > 0 ? (
                    <Stack gap="sm">
                        {backupHistory.map((backup: any, i: number) => (
                            <Group key={i} justify="space-between" p="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                                <Group>
                                    <IconDatabase size={16} />
                                    <Text size="sm">{backup.date}</Text>
                                </Group>
                                <Group>
                                    <Text size="sm" c="dimmed">{backup.size}</Text>
                                    <Badge color={backup.status === 'success' ? 'green' : 'red'} variant="light" size="sm">
                                        {backup.status === 'success' ? 'Sucesso' : backup.status}
                                    </Badge>
                                    {backup.url && (
                                        <Button size="xs" variant="subtle" leftSection={<IconDownload size={12} />}
                                            component="a" href={backup.url} target="_blank">
                                            Baixar
                                        </Button>
                                    )}
                                </Group>
                            </Group>
                        ))}
                    </Stack>
                ) : (
                    <Center py="xl">
                        <Text c="dimmed">Nenhum backup registrado</Text>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}
