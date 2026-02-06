'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, TextInput, Select, Button, CopyButton, Tooltip,
    ActionIcon, Table, Switch, Divider, Alert, Tabs,
    ThemeIcon, Code
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconLink, IconCopy, IconCheck, IconTrash, IconPlus,
    IconArrowLeft, IconBrandGoogle, IconBrandFacebook,
    IconBrandInstagram, IconMail, IconBrandTiktok,
    IconBrandYoutube, IconWorld, IconDownload, IconInfoCircle,
    IconHistory, IconEye
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface UTMParams {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
}

interface SavedLink {
    id: string;
    baseUrl: string;
    params: UTMParams;
    fullUrl: string;
    name: string;
    createdAt: string;
    clicks?: number;
}

// ============================================================================
// PRESET DATA
// ============================================================================

const SOURCE_PRESETS = [
    { value: 'google', label: 'Google', icon: <IconBrandGoogle size={14} /> },
    { value: 'facebook', label: 'Facebook', icon: <IconBrandFacebook size={14} /> },
    { value: 'instagram', label: 'Instagram', icon: <IconBrandInstagram size={14} /> },
    { value: 'email', label: 'Email', icon: <IconMail size={14} /> },
    { value: 'tiktok', label: 'TikTok', icon: <IconBrandTiktok size={14} /> },
    { value: 'youtube', label: 'YouTube', icon: <IconBrandYoutube size={14} /> },
    { value: 'organic', label: 'Orgânico', icon: <IconWorld size={14} /> },
];

const MEDIUM_PRESETS = [
    { value: 'cpc', label: 'CPC (paid clicks)' },
    { value: 'organic', label: 'Organic' },
    { value: 'social', label: 'Social Media' },
    { value: 'email', label: 'Email Marketing' },
    { value: 'referral', label: 'Referral' },
    { value: 'display', label: 'Display Ads' },
    { value: 'video', label: 'Video Ads' },
    { value: 'affiliate', label: 'Affiliate' },
];

const MOCK_SAVED_LINKS: SavedLink[] = [
    {
        id: '1',
        baseUrl: 'https://escola.com/matricula',
        params: { source: 'instagram', medium: 'social', campaign: 'fev_2026_promo', content: 'stories_urgencia' },
        fullUrl: 'https://escola.com/matricula?utm_source=instagram&utm_medium=social&utm_campaign=fev_2026_promo&utm_content=stories_urgencia',
        name: 'Promo Fevereiro - Stories',
        createdAt: '2026-02-01',
        clicks: 245,
    },
    {
        id: '2',
        baseUrl: 'https://escola.com/ingles-fluente',
        params: { source: 'google', medium: 'cpc', campaign: 'ingles_fluente', term: 'curso ingles' },
        fullUrl: 'https://escola.com/ingles-fluente?utm_source=google&utm_medium=cpc&utm_campaign=ingles_fluente&utm_term=curso+ingles',
        name: 'Google Ads - Inglês Fluente',
        createdAt: '2026-01-28',
        clicks: 892,
    },
    {
        id: '3',
        baseUrl: 'https://escola.com/aula-experimental',
        params: { source: 'email', medium: 'email', campaign: 'newsletter_jan', content: 'cta_principal' },
        fullUrl: 'https://escola.com/aula-experimental?utm_source=email&utm_medium=email&utm_campaign=newsletter_jan&utm_content=cta_principal',
        name: 'Newsletter Janeiro - CTA',
        createdAt: '2026-01-15',
        clicks: 156,
    },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UTMBuilderPage() {
    const [baseUrl, setBaseUrl] = useState('https://escola.com/');
    const [utmSource, setUtmSource] = useState('');
    const [utmMedium, setUtmMedium] = useState('');
    const [utmCampaign, setUtmCampaign] = useState('');
    const [utmContent, setUtmContent] = useState('');
    const [utmTerm, setUtmTerm] = useState('');
    const [linkName, setLinkName] = useState('');
    const [savedLinks, setSavedLinks] = useState<SavedLink[]>(MOCK_SAVED_LINKS);
    const [useShortener, setUseShortener] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('builder');

    // Generate full URL
    const generatedUrl = useMemo(() => {
        if (!baseUrl) return '';

        const params = new URLSearchParams();
        if (utmSource) params.set('utm_source', utmSource.toLowerCase().replace(/\s+/g, '_'));
        if (utmMedium) params.set('utm_medium', utmMedium.toLowerCase().replace(/\s+/g, '_'));
        if (utmCampaign) params.set('utm_campaign', utmCampaign.toLowerCase().replace(/\s+/g, '_'));
        if (utmContent) params.set('utm_content', utmContent.toLowerCase().replace(/\s+/g, '_'));
        if (utmTerm) params.set('utm_term', utmTerm.toLowerCase().replace(/\s+/g, '+'));

        const paramString = params.toString();
        if (!paramString) return baseUrl;

        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}${paramString}`;
    }, [baseUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm]);

    const isValid = baseUrl && utmSource && utmMedium && utmCampaign;

    const handleSaveLink = () => {
        if (!isValid) {
            notifications.show({
                title: 'Erro',
                message: 'Preencha os campos obrigatórios: Source, Medium e Campaign',
                color: 'red',
            });
            return;
        }

        const newLink: SavedLink = {
            id: Date.now().toString(),
            baseUrl,
            params: {
                source: utmSource,
                medium: utmMedium,
                campaign: utmCampaign,
                content: utmContent || undefined,
                term: utmTerm || undefined,
            },
            fullUrl: generatedUrl,
            name: linkName || `${utmSource} - ${utmCampaign}`,
            createdAt: new Date().toISOString().split('T')[0],
            clicks: 0,
        };

        setSavedLinks([newLink, ...savedLinks]);
        notifications.show({
            title: 'Link Salvo!',
            message: 'O link UTM foi salvo na biblioteca',
            color: 'green',
        });

        // Clear form
        setLinkName('');
        setUtmCampaign('');
        setUtmContent('');
        setUtmTerm('');
    };

    const handleDeleteLink = (id: string) => {
        setSavedLinks(savedLinks.filter(l => l.id !== id));
        notifications.show({
            title: 'Link Removido',
            message: 'O link foi removido da biblioteca',
            color: 'gray',
        });
    };

    const handleExportLinks = () => {
        const csv = savedLinks.map(l =>
            `"${l.name}","${l.fullUrl}","${l.params.source}","${l.params.medium}","${l.params.campaign}","${l.createdAt}","${l.clicks || 0}"`
        ).join('\n');
        const header = 'Nome,URL,Source,Medium,Campaign,Data,Cliques\n';

        const blob = new Blob([header + csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'utm_links.csv';
        a.click();
    };

    return (
        <Container fluid px="lg" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Group gap="md" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            component={Link}
                            href="/staff/marketing"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>🔗 UTM Builder</Title>
                    <Text c="dimmed">Crie links rastreáveis para suas campanhas</Text>
                </div>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                        onClick={handleExportLinks}
                    >
                        Exportar Links
                    </Button>
                </Group>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="lg">
                    <Tabs.Tab value="builder" leftSection={<IconLink size={14} />}>
                        Builder
                    </Tabs.Tab>
                    <Tabs.Tab value="library" leftSection={<IconHistory size={14} />}>
                        Biblioteca ({savedLinks.length})
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="builder">
                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                        {/* Builder Card */}
                        <Card shadow="sm" p="lg" radius="md" withBorder>
                            <Text fw={600} mb="md">Construtor de Link UTM</Text>

                            <Stack gap="md">
                                <TextInput
                                    label="URL Base"
                                    placeholder="https://escola.com/matricula"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    leftSection={<IconWorld size={16} />}
                                    required
                                />

                                <TextInput
                                    label="Nome do Link (opcional)"
                                    placeholder="Ex: Promo Fevereiro - Stories"
                                    value={linkName}
                                    onChange={(e) => setLinkName(e.target.value)}
                                />

                                <Divider label="Parâmetros UTM" labelPosition="center" />

                                <Select
                                    label="utm_source"
                                    description="Onde o tráfego está vindo (obrigatório)"
                                    placeholder="Selecione ou digite"
                                    data={SOURCE_PRESETS}
                                    value={utmSource}
                                    onChange={(v) => setUtmSource(v || '')}
                                    searchable
                                    allowDeselect
                                    required
                                />

                                <Select
                                    label="utm_medium"
                                    description="Tipo de marketing (obrigatório)"
                                    placeholder="Selecione ou digite"
                                    data={MEDIUM_PRESETS}
                                    value={utmMedium}
                                    onChange={(v) => setUtmMedium(v || '')}
                                    searchable
                                    allowDeselect
                                    required
                                />

                                <TextInput
                                    label="utm_campaign"
                                    description="Nome da campanha (obrigatório)"
                                    placeholder="Ex: promo_fevereiro_2026"
                                    value={utmCampaign}
                                    onChange={(e) => setUtmCampaign(e.target.value)}
                                    required
                                />

                                <TextInput
                                    label="utm_content"
                                    description="Variação do conteúdo (opcional)"
                                    placeholder="Ex: banner_azul, cta_urgencia"
                                    value={utmContent}
                                    onChange={(e) => setUtmContent(e.target.value)}
                                />

                                <TextInput
                                    label="utm_term"
                                    description="Palavras-chave pagas (opcional)"
                                    placeholder="Ex: curso ingles online"
                                    value={utmTerm}
                                    onChange={(e) => setUtmTerm(e.target.value)}
                                />

                                <Switch
                                    label="Usar encurtador de URL"
                                    description="Gera um link curto (ex: escola.co/abc123)"
                                    checked={useShortener}
                                    onChange={(e) => setUseShortener(e.currentTarget.checked)}
                                />
                            </Stack>
                        </Card>

                        {/* Preview Card */}
                        <Stack gap="lg">
                            <Card shadow="sm" p="lg" radius="md" withBorder>
                                <Text fw={600} mb="md">Preview do Link</Text>

                                {!isValid ? (
                                    <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                                        Preencha os campos obrigatórios para gerar o link
                                    </Alert>
                                ) : (
                                    <Stack gap="md">
                                        <Paper p="md" withBorder radius="sm" bg="gray.0">
                                            <Code block style={{ wordBreak: 'break-all', fontSize: 12 }}>
                                                {generatedUrl}
                                            </Code>
                                        </Paper>

                                        <Group>
                                            <CopyButton value={generatedUrl}>
                                                {({ copied, copy }) => (
                                                    <Button
                                                        color={copied ? 'teal' : 'blue'}
                                                        leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                                        onClick={copy}
                                                        style={{ flex: 1 }}
                                                    >
                                                        {copied ? 'Copiado!' : 'Copiar Link'}
                                                    </Button>
                                                )}
                                            </CopyButton>
                                            <Button
                                                variant="light"
                                                leftSection={<IconPlus size={16} />}
                                                onClick={handleSaveLink}
                                            >
                                                Salvar
                                            </Button>
                                        </Group>
                                    </Stack>
                                )}
                            </Card>

                            <Card shadow="sm" p="lg" radius="md" withBorder>
                                <Text fw={600} mb="md">📖 Guia Rápido UTM</Text>
                                <Stack gap="xs">
                                    <Paper p="sm" withBorder radius="sm">
                                        <Group gap="xs">
                                            <Badge color="blue" size="sm">source</Badge>
                                            <Text size="xs">De onde vem o tráfego (google, instagram, email)</Text>
                                        </Group>
                                    </Paper>
                                    <Paper p="sm" withBorder radius="sm">
                                        <Group gap="xs">
                                            <Badge color="violet" size="sm">medium</Badge>
                                            <Text size="xs">Tipo de canal (cpc, organic, social, email)</Text>
                                        </Group>
                                    </Paper>
                                    <Paper p="sm" withBorder radius="sm">
                                        <Group gap="xs">
                                            <Badge color="green" size="sm">campaign</Badge>
                                            <Text size="xs">Nome identificador da campanha</Text>
                                        </Group>
                                    </Paper>
                                    <Paper p="sm" withBorder radius="sm">
                                        <Group gap="xs">
                                            <Badge color="orange" size="sm">content</Badge>
                                            <Text size="xs">Variações de criativos (A/B test, posições)</Text>
                                        </Group>
                                    </Paper>
                                    <Paper p="sm" withBorder radius="sm">
                                        <Group gap="xs">
                                            <Badge color="red" size="sm">term</Badge>
                                            <Text size="xs">Palavras-chave em campanhas pagas</Text>
                                        </Group>
                                    </Paper>
                                </Stack>
                            </Card>
                        </Stack>
                    </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="library">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Links Salvos</Text>
                            <Badge color="blue">{savedLinks.length} links</Badge>
                        </Group>

                        <Table.ScrollContainer minWidth={800}>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Nome</Table.Th>
                                        <Table.Th>Source</Table.Th>
                                        <Table.Th>Medium</Table.Th>
                                        <Table.Th>Campaign</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Cliques</Table.Th>
                                        <Table.Th>Data</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Ações</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {savedLinks.map((link) => (
                                        <Table.Tr key={link.id}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{link.name}</Text>
                                                <Text size="xs" c="dimmed" lineClamp={1}>{link.baseUrl}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color="blue" variant="light" size="sm">
                                                    {link.params.source}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color="violet" variant="light" size="sm">
                                                    {link.params.medium}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{link.params.campaign}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <Badge color={link.clicks && link.clicks > 100 ? 'green' : 'gray'}>
                                                    {link.clicks || 0}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs" c="dimmed">{link.createdAt}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <Group gap={4} justify="center">
                                                    <CopyButton value={link.fullUrl}>
                                                        {({ copied, copy }) => (
                                                            <Tooltip label={copied ? 'Copiado!' : 'Copiar'}>
                                                                <ActionIcon
                                                                    variant="light"
                                                                    color={copied ? 'teal' : 'blue'}
                                                                    onClick={copy}
                                                                    size="sm"
                                                                >
                                                                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </CopyButton>
                                                    <Tooltip label="Ver">
                                                        <ActionIcon
                                                            variant="light"
                                                            color="gray"
                                                            component="a"
                                                            href={link.fullUrl}
                                                            target="_blank"
                                                            size="sm"
                                                        >
                                                            <IconEye size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Remover">
                                                        <ActionIcon
                                                            variant="light"
                                                            color="red"
                                                            onClick={() => handleDeleteLink(link.id)}
                                                            size="sm"
                                                        >
                                                            <IconTrash size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}

