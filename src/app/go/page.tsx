'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/hooks/useUser';
import {
    Center, Loader, Stack, Text, Paper, Group, Avatar,
    Badge, Button, Title, Box, Transition,
} from '@mantine/core';
import {
    IconBuilding, IconSchool, IconBuildingSkyscraper,
    IconCheck, IconArrowRight, IconAlertCircle,
} from '@tabler/icons-react';

// ── Role → Dashboard mapping ────────────────────────────────────────────────
const ROLE_DASHBOARDS: Record<string, string> = {
    student: '/student',
    parent: '/parent',
    teacher: '/teacher',
    staff: '/admin',
    admin: '/admin',
    owner: '/admin',
    accountant: '/admin',
    talent: '/talent',
};

// ── Organization type from the API ──────────────────────────────────────────
interface Organization {
    id: string;
    name: string;
    slug: string;
    type: string | null;
    role: string;
    logoUrl: string | null;
    primaryColor: string | null;
}

// ── Role badge helpers ──────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    owner: { label: 'Proprietário', color: 'violet' },
    admin: { label: 'Admin', color: 'blue' },
    staff: { label: 'Equipe', color: 'green' },
    teacher: { label: 'Professor', color: 'cyan' },
    student: { label: 'Aluno', color: 'gray' },
    parent: { label: 'Responsável', color: 'teal' },
    accountant: { label: 'Contador', color: 'orange' },
    talent: { label: 'Talento', color: 'pink' },
};

function getRoleBadge(role: string) {
    const config = ROLE_LABELS[role] || { label: role, color: 'gray' };
    return <Badge size="sm" variant="light" color={config.color}>{config.label}</Badge>;
}

function getOrgIcon(type: string | null) {
    switch (type) {
        case 'school': return <IconSchool size={28} />;
        case 'platform': return <IconBuildingSkyscraper size={28} />;
        default: return <IconBuilding size={28} />;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function GoRedirect() {
    const router = useRouter();
    const { user, isLoading, role, needsOnboarding, approvalStatus } = useUserContext();

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const [orgsLoading, setOrgsLoading] = useState(true);
    const [orgsError, setOrgsError] = useState<string | null>(null);
    const [switching, setSwitching] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    // ── Step 1: Handle auth states (onboarding, approval) ───────────────────
    useEffect(() => {
        if (isLoading) return;

        if (needsOnboarding) {
            router.replace('/onboarding');
            return;
        }

        if (approvalStatus === 'pending') {
            return; // AuthGuard shows pending screen
        }
    }, [isLoading, needsOnboarding, approvalStatus, router]);

    // ── Step 2: Fetch organizations ─────────────────────────────────────────
    useEffect(() => {
        if (isLoading || needsOnboarding || approvalStatus === 'pending') return;
        if (!user) return;

        const fetchOrgs = async () => {
            try {
                setOrgsLoading(true);
                const res = await fetch('/api/user/organizations');

                if (!res.ok) {
                    // If the API fails, fall back to role-based redirect
                    console.warn('Failed to fetch organizations, falling back to role redirect');
                    redirectByRole(role);
                    return;
                }

                const data = await res.json();
                const orgs: Organization[] = data.organizations || [];
                const currentActiveId: string | null = data.activeOrgId || null;

                setOrganizations(orgs);
                setActiveOrgId(currentActiveId);

                if (orgs.length === 0) {
                    // No orgs → just redirect by current role
                    redirectByRole(role);
                } else if (orgs.length === 1) {
                    // Single org → select it and redirect
                    await selectOrgAndRedirect(orgs[0].id, orgs[0].role);
                } else {
                    // Multiple orgs → show picker
                    setShowPicker(true);
                }
            } catch (err) {
                console.error('Error fetching organizations:', err);
                setOrgsError('Erro ao carregar organizações');
                // Fallback: redirect by role
                setTimeout(() => redirectByRole(role), 2000);
            } finally {
                setOrgsLoading(false);
            }
        };

        fetchOrgs();
    }, [isLoading, needsOnboarding, approvalStatus, user]);

    // ── Redirect helper ─────────────────────────────────────────────────────
    function redirectByRole(r: string) {
        const dashboard = ROLE_DASHBOARDS[r] || '/student';
        router.replace(dashboard);
    }

    // ── Select org → set cookie → redirect ──────────────────────────────────
    async function selectOrgAndRedirect(orgId: string, orgRole: string) {
        setSwitching(orgId);
        try {
            await fetch('/api/user/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId }),
            });
        } catch {
            // Cookie set failed — still redirect, auth.ts will fallback
        }
        const dashboard = ROLE_DASHBOARDS[orgRole] || '/student';
        router.replace(dashboard);
    }

    // ── Handle org card click ───────────────────────────────────────────────
    function handleOrgSelect(org: Organization) {
        if (switching) return;
        selectOrgAndRedirect(org.id, org.role);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER: Loading state
    // ═════════════════════════════════════════════════════════════════════════
    if (isLoading || (orgsLoading && !showPicker)) {
        return (
            <Center h="100vh" style={{ background: 'linear-gradient(135deg, #1a1b2e 0%, #16213e 50%, #0f3460 100%)' }}>
                <Stack align="center" gap="md">
                    <Loader size="lg" color="violet" />
                    <Text c="gray.4" size="sm">Carregando...</Text>
                </Stack>
            </Center>
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER: Error state
    // ═════════════════════════════════════════════════════════════════════════
    if (orgsError) {
        return (
            <Center h="100vh" style={{ background: 'linear-gradient(135deg, #1a1b2e 0%, #16213e 50%, #0f3460 100%)' }}>
                <Stack align="center" gap="md">
                    <IconAlertCircle size={48} color="var(--mantine-color-red-5)" />
                    <Text c="gray.4">{orgsError}</Text>
                    <Text c="dimmed" size="sm">Redirecionando...</Text>
                </Stack>
            </Center>
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER: Org Picker (multiple orgs)
    // ═════════════════════════════════════════════════════════════════════════
    if (showPicker && organizations.length > 1) {
        return (
            <Center
                h="100vh"
                style={{ background: 'linear-gradient(135deg, #1a1b2e 0%, #16213e 50%, #0f3460 100%)' }}
            >
                <Transition mounted={showPicker} transition="fade" duration={400}>
                    {(styles) => (
                        <Box style={{ ...styles, width: '100%', maxWidth: 520, padding: '0 16px' }}>
                            <Stack align="center" gap="lg">
                                {/* Header */}
                                <Stack align="center" gap={4}>
                                    <Title order={2} c="white" ta="center">
                                        Escolha sua organização
                                    </Title>
                                    <Text c="gray.4" size="sm" ta="center">
                                        Você faz parte de {organizations.length} organizações
                                    </Text>
                                </Stack>

                                {/* Org Cards */}
                                <Stack gap="sm" w="100%">
                                    {organizations.map((org) => {
                                        const isActive = org.id === activeOrgId;
                                        const isSelecting = switching === org.id;

                                        return (
                                            <Paper
                                                key={org.id}
                                                p="lg"
                                                radius="lg"
                                                withBorder
                                                style={{
                                                    cursor: switching ? 'wait' : 'pointer',
                                                    borderColor: isActive
                                                        ? 'var(--mantine-color-violet-5)'
                                                        : 'var(--mantine-color-dark-4)',
                                                    backgroundColor: isActive
                                                        ? 'rgba(124, 58, 237, 0.08)'
                                                        : 'rgba(255, 255, 255, 0.03)',
                                                    transition: 'all 0.2s ease',
                                                    transform: isSelecting ? 'scale(0.98)' : undefined,
                                                }}
                                                onClick={() => handleOrgSelect(org)}
                                                onMouseEnter={(e) => {
                                                    if (!switching) {
                                                        e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.12)';
                                                        e.currentTarget.style.borderColor = 'var(--mantine-color-violet-5)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!switching && !isActive) {
                                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                                        e.currentTarget.style.borderColor = 'var(--mantine-color-dark-4)';
                                                    }
                                                }}
                                            >
                                                <Group justify="space-between" wrap="nowrap">
                                                    <Group wrap="nowrap">
                                                        <Avatar
                                                            size="lg"
                                                            radius="md"
                                                            src={org.logoUrl}
                                                            color={org.primaryColor || 'violet'}
                                                        >
                                                            {getOrgIcon(org.type)}
                                                        </Avatar>
                                                        <div>
                                                            <Group gap="xs" wrap="nowrap">
                                                                <Text fw={600} c="white" size="md">
                                                                    {org.name}
                                                                </Text>
                                                                {isActive && (
                                                                    <Badge size="xs" color="violet" variant="filled">
                                                                        Atual
                                                                    </Badge>
                                                                )}
                                                            </Group>
                                                            <Group gap="xs" mt={2}>
                                                                <Text size="xs" c="gray.5">
                                                                    {org.slug}
                                                                </Text>
                                                                {getRoleBadge(org.role)}
                                                            </Group>
                                                        </div>
                                                    </Group>

                                                    {isSelecting ? (
                                                        <Loader size="sm" color="violet" />
                                                    ) : (
                                                        <IconArrowRight
                                                            size={20}
                                                            color="var(--mantine-color-gray-5)"
                                                        />
                                                    )}
                                                </Group>
                                            </Paper>
                                        );
                                    })}
                                </Stack>

                                {/* Subtle footer */}
                                <Text size="xs" c="gray.6" ta="center">
                                    Você pode trocar de organização a qualquer momento no menu lateral
                                </Text>
                            </Stack>
                        </Box>
                    )}
                </Transition>
            </Center>
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER: Default redirect (fallback)
    // ═════════════════════════════════════════════════════════════════════════
    return (
        <Center h="100vh" style={{ background: 'linear-gradient(135deg, #1a1b2e 0%, #16213e 50%, #0f3460 100%)' }}>
            <Stack align="center" gap="md">
                <Loader size="lg" color="violet" />
                <Text c="gray.4" size="sm">Redirecionando para seu painel...</Text>
            </Stack>
        </Center>
    );
}
