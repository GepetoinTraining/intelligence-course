'use client';

import { useState, useEffect } from 'react';
import {
    Modal,
    Stack,
    Group,
    Text,
    Button,
    Avatar,
    Paper,
    Badge,
    Loader,
    Center,
    Alert,
} from '@mantine/core';
import {
    IconBuilding,
    IconCheck,
    IconAlertCircle,
    IconSchool,
    IconBuildingSkyscraper,
} from '@tabler/icons-react';

interface Organization {
    id: string;
    name: string;
    slug: string;
    type: string | null;
    role: string;
    logoUrl: string | null;
    primaryColor: string | null;
}

interface OrgSwitcherProps {
    opened: boolean;
    onClose: () => void;
}

export function OrgSwitcher({ opened, onClose }: OrgSwitcherProps) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (opened) {
            fetchOrganizations();
        }
    }, [opened]);

    const fetchOrganizations = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/user/organizations');
            if (!res.ok) throw new Error('Failed to fetch organizations');
            const data = await res.json();
            setOrganizations(data.organizations || []);
            setActiveOrgId(data.activeOrgId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleSwitch = async (orgId: string) => {
        if (orgId === activeOrgId) {
            onClose();
            return;
        }

        setSwitching(orgId);
        try {
            const res = await fetch('/api/user/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId }),
            });

            if (!res.ok) throw new Error('Failed to switch organization');

            setActiveOrgId(orgId);

            // Reload the page to apply the new org context
            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to switch');
            setSwitching(null);
        }
    };

    const getOrgIcon = (type: string | null) => {
        switch (type) {
            case 'school':
                return <IconSchool size={24} />;
            case 'platform':
                return <IconBuildingSkyscraper size={24} />;
            default:
                return <IconBuilding size={24} />;
        }
    };

    const getRoleBadge = (role: string) => {
        const roleLabels: Record<string, { label: string; color: string }> = {
            owner: { label: 'Proprietário', color: 'violet' },
            admin: { label: 'Admin', color: 'blue' },
            staff: { label: 'Equipe', color: 'green' },
            teacher: { label: 'Professor', color: 'cyan' },
            student: { label: 'Aluno', color: 'gray' },
        };
        const config = roleLabels[role] || { label: role, color: 'gray' };
        return <Badge size="sm" variant="light" color={config.color}>{config.label}</Badge>;
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconBuilding size={20} />
                    <Text fw={600}>Trocar Organização</Text>
                </Group>
            }
            size="md"
        >
            {loading ? (
                <Center py="xl">
                    <Loader size="lg" />
                </Center>
            ) : error ? (
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">
                    {error}
                    <Button size="xs" variant="light" mt="sm" onClick={fetchOrganizations}>
                        Tentar novamente
                    </Button>
                </Alert>
            ) : organizations.length === 0 ? (
                <Center py="xl">
                    <Stack align="center" gap="xs">
                        <IconBuilding size={48} color="gray" />
                        <Text c="dimmed">Você não tem acesso a nenhuma organização</Text>
                    </Stack>
                </Center>
            ) : (
                <Stack gap="sm">
                    <Text size="sm" c="dimmed">
                        Selecione a organização que deseja acessar:
                    </Text>

                    {organizations.map((org) => (
                        <Paper
                            key={org.id}
                            p="md"
                            radius="md"
                            withBorder
                            style={{
                                cursor: switching ? 'wait' : 'pointer',
                                borderColor: org.id === activeOrgId
                                    ? 'var(--mantine-color-blue-5)'
                                    : undefined,
                                backgroundColor: org.id === activeOrgId
                                    ? 'var(--mantine-color-blue-light)'
                                    : undefined,
                            }}
                            onClick={() => !switching && handleSwitch(org.id)}
                        >
                            <Group justify="space-between">
                                <Group>
                                    <Avatar
                                        size="lg"
                                        radius="md"
                                        src={org.logoUrl}
                                        color={org.primaryColor || 'blue'}
                                    >
                                        {getOrgIcon(org.type)}
                                    </Avatar>
                                    <div>
                                        <Group gap="xs">
                                            <Text fw={600}>{org.name}</Text>
                                            {org.id === activeOrgId && (
                                                <Badge size="xs" color="blue" variant="filled">
                                                    Atual
                                                </Badge>
                                            )}
                                        </Group>
                                        <Group gap="xs">
                                            <Text size="xs" c="dimmed">{org.slug}</Text>
                                            {getRoleBadge(org.role)}
                                        </Group>
                                    </div>
                                </Group>

                                {switching === org.id ? (
                                    <Loader size="sm" />
                                ) : org.id === activeOrgId ? (
                                    <IconCheck size={20} color="var(--mantine-color-blue-6)" />
                                ) : null}
                            </Group>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Modal>
    );
}
