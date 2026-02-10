'use client';

import {
    Title, Text, Stack, Card, Group, ThemeIcon, Button, TextInput, Switch,
    Divider, Avatar, Loader, Alert, Center, Textarea,
} from '@mantine/core';
import {
    IconBuilding, IconPhoto, IconMail, IconPhone, IconMapPin, IconWorld,
    IconBrandFacebook, IconBrandInstagram, IconDeviceFloppy, IconAlertCircle,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';

export default function EscolaPage() {
    const { data: apiData, isLoading, error, refetch } = useApi<any>('/api/profile');

    const [form, setForm] = useState({
        name: '', email: '', phone: '', address: '', website: '',
        facebook: '', instagram: '', description: '',
        maintenanceMode: false, emailNotifications: true, autoBackup: true,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (apiData) {
            const d = Array.isArray(apiData) ? apiData[0] : apiData;
            if (d) {
                setForm(prev => ({
                    ...prev,
                    name: d.name || d.schoolName || prev.name,
                    email: d.email || prev.email,
                    phone: d.phone || prev.phone,
                    address: d.address || prev.address,
                    website: d.website || prev.website,
                    facebook: d.facebook || prev.facebook,
                    instagram: d.instagram || prev.instagram,
                    description: d.description || prev.description,
                }));
            }
        }
    }, [apiData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            refetch();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const u = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle />} color="red" title="Erro">{String(error)}</Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Dados da Escola</Title>
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

            {/* School Identity */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Identidade</Text>
                <Group align="flex-start" gap="xl">
                    <Stack align="center">
                        <Avatar size={120} radius="md" color="blue">
                            <IconBuilding size={60} />
                        </Avatar>
                        <Button variant="light" size="xs" leftSection={<IconPhoto size={14} />}>
                            Alterar Logo
                        </Button>
                    </Stack>
                    <Stack style={{ flex: 1 }} gap="md">
                        <TextInput label="Nome da Escola" value={form.name} onChange={u('name')} />
                        <Textarea label="Descrição" value={form.description} onChange={u('description')} autosize minRows={2} />
                        <Group grow>
                            <TextInput label="E-mail" leftSection={<IconMail size={16} />} value={form.email} onChange={u('email')} />
                            <TextInput label="Telefone" leftSection={<IconPhone size={16} />} value={form.phone} onChange={u('phone')} />
                        </Group>
                    </Stack>
                </Group>
            </Card>

            {/* Location */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Localização</Text>
                <Stack gap="md">
                    <TextInput label="Endereço Completo" leftSection={<IconMapPin size={16} />} value={form.address} onChange={u('address')} />
                    <Text size="xs" c="dimmed">O endereço será exibido nas faturas e documentos oficiais.</Text>
                </Stack>
            </Card>

            {/* Online Presence */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Presença Online</Text>
                <Stack gap="md">
                    <TextInput label="Website" leftSection={<IconWorld size={16} />} value={form.website} onChange={u('website')} />
                    <Group grow>
                        <TextInput label="Facebook" leftSection={<IconBrandFacebook size={16} />} value={form.facebook} onChange={u('facebook')} />
                        <TextInput label="Instagram" leftSection={<IconBrandInstagram size={16} />} value={form.instagram} onChange={u('instagram')} />
                    </Group>
                </Stack>
            </Card>

            {/* Preferences */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Preferências</Text>
                <Stack gap="md">
                    <Group justify="space-between">
                        <div>
                            <Text size="sm">Modo de manutenção</Text>
                            <Text size="xs" c="dimmed">Desabilita acesso de alunos ao portal</Text>
                        </div>
                        <Switch checked={form.maintenanceMode} onChange={(e) => setForm(p => ({ ...p, maintenanceMode: e.currentTarget.checked }))} />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <div>
                            <Text size="sm">Notificações por e-mail</Text>
                            <Text size="xs" c="dimmed">Enviar resumo diário para administradores</Text>
                        </div>
                        <Switch checked={form.emailNotifications} onChange={(e) => setForm(p => ({ ...p, emailNotifications: e.currentTarget.checked }))} />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <div>
                            <Text size="sm">Backup automático</Text>
                            <Text size="xs" c="dimmed">Backup diário dos dados às 3h</Text>
                        </div>
                        <Switch checked={form.autoBackup} onChange={(e) => setForm(p => ({ ...p, autoBackup: e.currentTarget.checked }))} />
                    </Group>
                </Stack>
            </Card>
        </Stack>
    );
}
