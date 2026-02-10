'use client';

import { useState, useEffect } from 'react';
import {
    Title, Text, Stack, Card, Button, Group, Badge,
    ThemeIcon, Loader, Center, Paper, Avatar,
} from '@mantine/core';
import {
    IconCheck, IconX, IconShield, IconBuilding,
    IconUserPlus, IconArrowRight, IconClock,
} from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface InviteData {
    membershipId: string;
    personId: string;
    organizationId: string;
    role: string;
    orgName: string;
    inviteeName: string;
    inviteeEmail: string;
    invitedAt: number;
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Co-proprietário(a)',
    admin: 'Administrador(a)',
    teacher: 'Professor(a)',
    staff: 'Equipe',
    accountant: 'Contador(a)',
    support: 'Suporte',
};

const ROLE_COLORS: Record<string, string> = {
    owner: 'red',
    admin: 'violet',
    teacher: 'blue',
    staff: 'teal',
    accountant: 'green',
    support: 'gray',
};

// ============================================================================
// INNER COMPONENT (needs useSearchParams inside Suspense)
// ============================================================================

function JoinPageContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Token de convite não encontrado');
            setLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`/api/invites/${token}`);
                if (!res.ok) {
                    const data = await res.json();
                    if (res.status === 410) {
                        setError('Este convite expirou. Peça um novo convite ao administrador.');
                    } else {
                        setError(data.error || 'Convite inválido');
                    }
                    return;
                }
                const data = await res.json();
                setInvite(data.data);
            } catch (err) {
                setError('Erro ao verificar convite');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);

        try {
            const res = await fetch(`/api/invites/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // In production, this would include the Clerk user ID
                    // after sign-up/sign-in
                    clerkUserId: null,
                }),
            });

            if (res.ok) {
                setAccepted(true);
                // Redirect to sign-up after a brief moment
                setTimeout(() => {
                    window.location.href = `/sign-up?redirect_url=/&invite_email=${encodeURIComponent(invite?.inviteeEmail || '')}`;
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.error || 'Erro ao aceitar convite');
            }
        } catch (err) {
            setError('Erro ao aceitar convite');
        } finally {
            setAccepting(false);
        }
    };

    // Loading
    if (loading) {
        return (
            <Center style={{ minHeight: '100vh', background: '#f4f4f5' }}>
                <Card shadow="md" radius="lg" p="xl" w={440} style={{ textAlign: 'center' }}>
                    <Loader size="lg" color="violet" mb="md" />
                    <Text c="dimmed">Verificando convite...</Text>
                </Card>
            </Center>
        );
    }

    // Error
    if (error) {
        return (
            <Center style={{ minHeight: '100vh', background: '#f4f4f5' }}>
                <Card shadow="md" radius="lg" p="xl" w={440} style={{ textAlign: 'center' }}>
                    <ThemeIcon size={60} radius="xl" color="red" variant="light" mx="auto" mb="md">
                        <IconX size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Convite Inválido</Title>
                    <Text c="dimmed" mb="xl">{error}</Text>
                    <Button
                        variant="light"
                        component="a"
                        href="/sign-in"
                    >
                        Ir para Login
                    </Button>
                </Card>
            </Center>
        );
    }

    // Accepted
    if (accepted) {
        return (
            <Center style={{ minHeight: '100vh', background: '#f4f4f5' }}>
                <Card shadow="md" radius="lg" p="xl" w={440} style={{ textAlign: 'center' }}>
                    <ThemeIcon size={60} radius="xl" color="green" variant="light" mx="auto" mb="md">
                        <IconCheck size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Convite Aceito! 🎉</Title>
                    <Text c="dimmed" mb="md">
                        Você agora faz parte de <strong>{invite?.orgName}</strong>.
                    </Text>
                    <Text c="dimmed" size="sm">
                        Redirecionando para criação de conta...
                    </Text>
                    <Loader size="sm" color="green" mt="md" mx="auto" />
                </Card>
            </Center>
        );
    }

    // Invite details
    if (!invite) return null;

    const daysAgo = invite.invitedAt
        ? Math.floor((Date.now() / 1000 - invite.invitedAt) / 86400)
        : 0;

    return (
        <Center style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' }}>
            <Card shadow="xl" radius="lg" p={0} w={480} style={{ overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    padding: '32px 40px',
                    color: 'white',
                }}>
                    <Group gap="sm">
                        <ThemeIcon size={44} radius="xl" color="white" variant="light">
                            <IconUserPlus size={24} color="#6366f1" />
                        </ThemeIcon>
                        <div>
                            <Title order={3} c="white" style={{ fontWeight: 700 }}>Convite de Equipe</Title>
                            <Text size="sm" style={{ opacity: 0.85 }}>Você foi convidado para uma organização</Text>
                        </div>
                    </Group>
                </div>

                {/* Body */}
                <Stack p="xl" gap="lg">
                    {/* Org info */}
                    <Paper withBorder radius="md" p="lg">
                        <Group>
                            <Avatar size={48} color="violet" radius="xl">
                                <IconBuilding size={24} />
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Text fw={600} size="lg">{invite.orgName}</Text>
                                <Group gap="xs">
                                    <Badge
                                        color={ROLE_COLORS[invite.role] || 'gray'}
                                        variant="light"
                                        leftSection={<IconShield size={12} />}
                                    >
                                        {ROLE_LABELS[invite.role] || invite.role}
                                    </Badge>
                                    <Text size="xs" c="dimmed">
                                        <IconClock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                        {daysAgo === 0 ? 'Hoje' : `${daysAgo}d atrás`}
                                    </Text>
                                </Group>
                            </div>
                        </Group>
                    </Paper>

                    {/* Invitee info */}
                    <div>
                        <Text size="sm" c="dimmed" mb={4}>Convidado(a)</Text>
                        <Text fw={600}>{invite.inviteeName}</Text>
                        <Text size="sm" c="dimmed">{invite.inviteeEmail}</Text>
                    </div>

                    {/* Actions */}
                    <Button
                        fullWidth
                        size="lg"
                        loading={accepting}
                        onClick={handleAccept}
                        leftSection={<IconCheck size={20} />}
                        rightSection={<IconArrowRight size={16} />}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        }}
                    >
                        Aceitar Convite
                    </Button>

                    <Text size="xs" c="dimmed" ta="center">
                        Ao aceitar, você criará uma conta e terá acesso à plataforma como{' '}
                        <strong>{ROLE_LABELS[invite.role] || invite.role}</strong>.
                    </Text>
                </Stack>
            </Card>
        </Center>
    );
}

// ============================================================================
// PAGE EXPORT (wrapped in Suspense for useSearchParams)
// ============================================================================

export default function JoinPage() {
    return (
        <Suspense fallback={
            <Center style={{ minHeight: '100vh', background: '#f4f4f5' }}>
                <Loader size="lg" color="violet" />
            </Center>
        }>
            <JoinPageContent />
        </Suspense>
    );
}
