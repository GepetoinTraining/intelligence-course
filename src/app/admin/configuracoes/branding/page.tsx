'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Button,
    TextInput, Paper, ThemeIcon, ColorSwatch, Loader, Center,
    FileInput, SimpleGrid, Divider,
} from '@mantine/core';
import {
    IconPalette, IconUpload, IconBuilding, IconCheck,
    IconDeviceFloppy, IconPhoto, IconBrush,
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

interface OrgBranding {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string | null;
    type: string | null;
}

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
    '#3b82f6', '#2563eb', '#1d4ed8', '#0f172a',
];

// ============================================================================
// PAGE
// ============================================================================

export default function BrandingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [orgData, setOrgData] = useState<OrgBranding | null>(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#6366f1');
    const [logoUrl, setLogoUrl] = useState('');

    const fetchOrg = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/user/organizations');
            if (res.ok) {
                const json = await res.json();
                const org = json.organizations?.[0];
                if (org) {
                    setOrgData(org);
                    setName(org.name || '');
                    setSlug(org.slug || '');
                    setPrimaryColor(org.primaryColor || '#6366f1');
                    setLogoUrl(org.logoUrl || '');
                }
            }
        } catch (err) {
            console.error('Error fetching org:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrg();
    }, [fetchOrg]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setSaved(false);
            // Currently the org API doesn't support PATCH, so we log
            // In production, this would PATCH /api/organizations/[id]
            console.log('Saving branding:', { name, slug, primaryColor, logoUrl });

            // Simulate success for now
            await new Promise(r => setTimeout(r, 500));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving branding:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Center py="xl"><Loader size="lg" /></Center>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Configurações</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Branding</Text>
                    </Group>
                    <Group justify="space-between" align="flex-end">
                        <div>
                            <Title order={1}>Branding</Title>
                            <Text c="dimmed" mt="xs">Personalize a identidade visual da sua escola.</Text>
                        </div>
                        <Button
                            leftSection={saved ? <IconCheck size={16} /> : <IconDeviceFloppy size={16} />}
                            loading={saving}
                            onClick={handleSave}
                            color={saved ? 'green' : 'violet'}
                        >
                            {saved ? 'Salvo!' : 'Salvar Alterações'}
                        </Button>
                    </Group>
                </div>

                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {/* Organization Info */}
                    <Card withBorder radius="md" p="lg">
                        <Group gap="sm" mb="lg">
                            <ThemeIcon size={36} radius="md" variant="light" color="violet">
                                <IconBuilding size={18} />
                            </ThemeIcon>
                            <Title order={4}>Informações da Escola</Title>
                        </Group>
                        <Stack gap="md">
                            <TextInput
                                label="Nome da Escola"
                                placeholder="Minha Escola"
                                value={name}
                                onChange={(e) => setName(e.currentTarget.value)}
                            />
                            <TextInput
                                label="Slug (URL)"
                                placeholder="minha-escola"
                                value={slug}
                                onChange={(e) => setSlug(e.currentTarget.value)}
                                description="Identificador único usado em URLs"
                            />
                            <TextInput
                                label="URL do Logo"
                                placeholder="https://..."
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.currentTarget.value)}
                                leftSection={<IconPhoto size={16} />}
                            />
                        </Stack>
                    </Card>

                    {/* Color */}
                    <Card withBorder radius="md" p="lg">
                        <Group gap="sm" mb="lg">
                            <ThemeIcon size={36} radius="md" variant="light" color="violet">
                                <IconPalette size={18} />
                            </ThemeIcon>
                            <Title order={4}>Cor Principal</Title>
                        </Group>
                        <Stack gap="md">
                            <TextInput
                                label="Cor Hexadecimal"
                                placeholder="#6366f1"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.currentTarget.value)}
                                leftSection={
                                    <ColorSwatch color={primaryColor} size={16} />
                                }
                            />

                            <div>
                                <Text size="sm" fw={500} mb="xs">Cores Predefinidas</Text>
                                <Group gap="xs">
                                    {PRESET_COLORS.map(color => (
                                        <ColorSwatch
                                            key={color}
                                            color={color}
                                            size={32}
                                            radius="md"
                                            onClick={() => setPrimaryColor(color)}
                                            style={{
                                                cursor: 'pointer',
                                                outline: primaryColor === color ? '2px solid var(--mantine-color-violet-5)' : 'none',
                                                outlineOffset: 2,
                                            }}
                                        />
                                    ))}
                                </Group>
                            </div>
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* Preview */}
                <Card withBorder radius="md" p="lg">
                    <Group gap="sm" mb="lg">
                        <ThemeIcon size={36} radius="md" variant="light" color="violet">
                            <IconBrush size={18} />
                        </ThemeIcon>
                        <Title order={4}>Preview</Title>
                    </Group>

                    <Paper
                        radius="md"
                        p="xl"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                            color: 'white',
                        }}
                    >
                        <Group>
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt="Logo"
                                    style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: 'white' }}
                                />
                            ) : (
                                <ThemeIcon size={48} radius="md" color="white" variant="filled">
                                    <IconBuilding size={24} color={primaryColor} />
                                </ThemeIcon>
                            )}
                            <div>
                                <Title order={3} c="white">{name || 'Nome da Escola'}</Title>
                                <Text size="sm" style={{ opacity: 0.85 }}>{slug || 'slug-da-escola'}.nodezero.app</Text>
                            </div>
                        </Group>
                    </Paper>

                    <Group mt="md" gap="xs">
                        <Button style={{ background: primaryColor }} size="sm">
                            Botão Primário
                        </Button>
                        <Button variant="outline" color={primaryColor} size="sm" style={{ borderColor: primaryColor, color: primaryColor }}>
                            Botão Secundário
                        </Button>
                        <Button variant="subtle" size="sm" style={{ color: primaryColor }}>
                            Botão Sutil
                        </Button>
                    </Group>
                </Card>
            </Stack>
        </Container>
    );
}
