'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Paper, Group, Stack, Text, Avatar,
    TextInput, Button, Divider, Badge, Loader, Center,
    Grid, Card, ThemeIcon,
} from '@mantine/core';
import {
    IconUser, IconMail, IconShield, IconCalendar, IconDeviceFloppy,
} from '@tabler/icons-react';
import { useUserContext } from '@/hooks/useUser';
import { useApi } from '@/hooks/useApi';

export default function PerfilPage() {
    const { user, isLoading } = useUserContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/users/${user?.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
        } catch (e) {
            console.error('Error saving profile:', e);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return <Center h={400}><Loader /></Center>;
    }

    const getUserInitials = () => {
        if (user?.name) {
            const parts = user.name.split(' ');
            return parts.length > 1
                ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                : parts[0].substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <Container size="md" py="xl">
            <Title order={2} mb="lg">Meu Perfil</Title>

            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card withBorder padding="xl" radius="md">
                        <Stack align="center" gap="md">
                            <Avatar
                                size={100}
                                radius={100}
                                color="blue"
                                src={user?.avatarUrl || undefined}
                            >
                                {getUserInitials()}
                            </Avatar>
                            <Text fw={600} size="lg">{user?.name || 'Usuário'}</Text>
                            <Text size="sm" c="dimmed">{user?.email}</Text>
                            <Badge color="blue" variant="light" size="lg">
                                {user?.role || 'staff'}
                            </Badge>
                        </Stack>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper withBorder p="xl" radius="md">
                        <Title order={4} mb="md">Informações Pessoais</Title>
                        <Stack gap="md">
                            <TextInput
                                label="Nome Completo"
                                leftSection={<IconUser size={16} />}
                                value={name}
                                onChange={(e) => setName(e.currentTarget.value)}
                            />
                            <TextInput
                                label="E-mail"
                                leftSection={<IconMail size={16} />}
                                value={email}
                                disabled
                                description="O e-mail é gerenciado pelo sistema de autenticação"
                            />
                            <Group gap="md">
                                <Group gap="xs">
                                    <ThemeIcon variant="light" size="sm" color="blue">
                                        <IconShield size={14} />
                                    </ThemeIcon>
                                    <Text size="sm" c="dimmed">Cargo: {user?.role || 'staff'}</Text>
                                </Group>
                                <Group gap="xs">
                                    <ThemeIcon variant="light" size="sm" color="gray">
                                        <IconCalendar size={14} />
                                    </ThemeIcon>
                                    <Text size="sm" c="dimmed">
                                        Membro desde: {(user as any)?.createdAt ? new Date((user as any).createdAt * 1000).toLocaleDateString('pt-BR') : '—'}
                                    </Text>
                                </Group>
                            </Group>

                            <Divider />

                            <Group justify="flex-end">
                                <Button
                                    leftSection={<IconDeviceFloppy size={16} />}
                                    onClick={handleSave}
                                    loading={saving}
                                >
                                    Salvar Alterações
                                </Button>
                            </Group>
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
