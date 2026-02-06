'use client';

import { useState } from 'react';
import {
    AppShell,
    Burger,
    Group,
    Text,
    Avatar,
    ActionIcon,
    useMantineColorScheme,
    Menu,
    SegmentedControl,
    Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSun,
    IconMoon,
    IconUser,
    IconSettings,
    IconLogout,
    IconBuilding,
    IconPalette,
    IconRocket,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useUserContext } from '@/hooks/useUser';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CommunicatorWidget } from '@/components/communicator/CommunicatorWidget';
import { OrgSwitcher } from '@/components/admin/OrgSwitcher';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [opened, { toggle }] = useDisclosure();
    const { colorScheme, toggleColorScheme, setColorScheme } = useMantineColorScheme();
    const { user, isLoading } = useUserContext();
    const [themeMode, setThemeMode] = useState<'brand' | 'light' | 'dark'>('brand');
    const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false);

    // Get user initials for avatar
    const getUserInitials = () => {
        if (user?.name) {
            const parts = user.name.split(' ');
            return parts.length > 1
                ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                : parts[0].substring(0, 2).toUpperCase();
        }
        return 'AD';
    };

    const handleThemeChange = (value: string) => {
        setThemeMode(value as 'brand' | 'light' | 'dark');
        if (value === 'dark') {
            setColorScheme('dark');
        } else {
            setColorScheme('light');
        }
    };

    return (
        <AuthGuard>
            <AppShell
                header={{ height: 60 }}
                navbar={{
                    width: 280,
                    breakpoint: 'sm',
                    collapsed: { mobile: !opened }
                }}
                padding="md"
            >
                {/* Header */}
                <AppShell.Header>
                    <Group h="100%" px="md" justify="space-between">
                        <Group>
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                            <Link href="/admin" style={{ textDecoration: 'none' }}>
                                <Group gap="xs">
                                    <IconRocket size={28} color="var(--mantine-color-blue-6)" />
                                    <Text size="lg" fw={700} c="blue">
                                        Node Zero
                                    </Text>
                                    <Text size="xs" c="dimmed" visibleFrom="sm">
                                        Admin
                                    </Text>
                                </Group>
                            </Link>
                        </Group>

                        <Group gap="xs">
                            {/* Theme Switcher */}
                            <Box visibleFrom="sm">
                                <SegmentedControl
                                    size="xs"
                                    value={themeMode}
                                    onChange={handleThemeChange}
                                    data={[
                                        { label: <IconPalette size={14} />, value: 'brand' },
                                        { label: <IconSun size={14} />, value: 'light' },
                                        { label: <IconMoon size={14} />, value: 'dark' },
                                    ]}
                                />
                            </Box>

                            {/* Mobile Theme Toggle */}
                            <ActionIcon
                                variant="subtle"
                                size="lg"
                                onClick={() => toggleColorScheme()}
                                hiddenFrom="sm"
                            >
                                {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
                            </ActionIcon>

                            {/* Profile Menu */}
                            <Menu shadow="md" width={220}>
                                <Menu.Target>
                                    <ActionIcon variant="subtle" size="lg">
                                        <Avatar
                                            size={32}
                                            radius="xl"
                                            color="blue"
                                            src={user?.avatarUrl || undefined}
                                        >
                                            {getUserInitials()}
                                        </Avatar>
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>
                                        <Text size="sm" fw={500}>{user?.name || 'Administrador'}</Text>
                                        <Text size="xs" c="dimmed">{user?.email || 'admin@escola.com'}</Text>
                                    </Menu.Label>
                                    <Menu.Divider />
                                    <Menu.Item
                                        leftSection={<IconUser size={14} />}
                                        component={Link}
                                        href="/admin/perfil"
                                    >
                                        Meu Perfil
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<IconSettings size={14} />}
                                        component={Link}
                                        href="/admin/preferencias"
                                    >
                                        Preferências
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<IconBuilding size={14} />}
                                        onClick={() => setOrgSwitcherOpen(true)}
                                    >
                                        Trocar Organização
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item color="red" leftSection={<IconLogout size={14} />}>
                                        Sair
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </Group>
                </AppShell.Header>

                {/* Sidebar */}
                <AppShell.Navbar p="md">
                    <AdminSidebar />
                </AppShell.Navbar>

                {/* Main Content */}
                <AppShell.Main>
                    {children}
                </AppShell.Main>

                {/* Org Switcher Modal */}
                <OrgSwitcher opened={orgSwitcherOpen} onClose={() => setOrgSwitcherOpen(false)} />

                {/* Floating Communicator Widget */}
                <CommunicatorWidget />
            </AppShell>
        </AuthGuard>
    );
}

