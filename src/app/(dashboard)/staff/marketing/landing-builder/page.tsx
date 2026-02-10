'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, TextInput, Select, Button, Textarea, Modal,
    ActionIcon, Table, Switch, Divider, Alert, Tabs,
    ThemeIcon, ColorInput, Slider, FileButton
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconPlus, IconArrowLeft, IconEye, IconEdit, IconTrash,
    IconCopy, IconCheck, IconTemplate, IconLayoutGrid,
    IconPhoto, IconVideo, IconLink, IconMail, IconPhone,
    IconBrandWhatsapp, IconDownload, IconExternalLink,
    IconDeviceDesktop, IconDeviceMobile, IconPalette,
    IconSettings, IconPlayerPlay, IconDragDrop
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface LandingPageBlock {
    id: string;
    type: 'hero' | 'benefits' | 'testimonials' | 'cta' | 'faq' | 'pricing' | 'video' | 'form';
    content: Record<string, unknown>;
    order: number;
}

interface LandingPage {
    id: string;
    name: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    template: string;
    primaryColor: string;
    visits: number;
    conversions: number;
    createdAt: string;
    updatedAt: string;
}

interface LandingTemplate {
    id: string;
    name: string;
    description: string;
    preview: string;
    category: 'education' | 'promo' | 'event' | 'simple';
    blocks: string[];
}

// ============================================================================
// CONFIG
// ============================================================================

const TEMPLATES: LandingTemplate[] = [
    {
        id: 'classic-enrollment',
        name: 'Matrícula Clássica',
        description: 'Template completo para captação de matrículas com hero, benefícios, depoimentos e CTA',
        preview: '🎓',
        category: 'education',
        blocks: ['hero', 'benefits', 'testimonials', 'cta'],
    },
    {
        id: 'promo-urgency',
        name: 'Promoção Urgente',
        description: 'Foco em urgência e escassez para campanhas promocionais',
        preview: '🔥',
        category: 'promo',
        blocks: ['hero', 'pricing', 'cta'],
    },
    {
        id: 'event-webinar',
        name: 'Evento/Webinar',
        description: 'Para aulas ao vivo, workshops e eventos gratuitos',
        preview: '📺',
        category: 'event',
        blocks: ['hero', 'video', 'benefits', 'form'],
    },
    {
        id: 'simple-cta',
        name: 'CTA Simples',
        description: 'Página mínima focada apenas em conversão',
        preview: '🎯',
        category: 'simple',
        blocks: ['hero', 'cta'],
    },
    {
        id: 'trial-class',
        name: 'Aula Experimental',
        description: 'Otimizado para agendamento de aulas experimentais',
        preview: '📝',
        category: 'education',
        blocks: ['hero', 'benefits', 'testimonials', 'form'],
    },
];

const BLOCK_OPTIONS = [
    { value: 'hero', label: '🎯 Hero Section', description: 'Título, subtítulo e CTA principal' },
    { value: 'benefits', label: '✅ Benefícios', description: 'Lista de vantagens com ícones' },
    { value: 'testimonials', label: '💬 Depoimentos', description: 'Cards com fotos e testemunhos' },
    { value: 'cta', label: '🔘 Call-to-Action', description: 'Seção de conversão com botão' },
    { value: 'faq', label: '❓ FAQ', description: 'Perguntas frequentes em accordion' },
    { value: 'pricing', label: '💰 Preços', description: 'Tabela de planos e valores' },
    { value: 'video', label: '🎥 Vídeo', description: 'Embed de vídeo do YouTube/Vimeo' },
    { value: 'form', label: '📋 Formulário', description: 'Captura de leads com campos personalizados' },
];

// ============================================================================
// TEMPLATE CARD
// ============================================================================

function TemplateCard({
    template,
    selected,
    onSelect
}: {
    template: LandingTemplate;
    selected: boolean;
    onSelect: () => void;
}) {
    const categoryColors = {
        education: 'blue',
        promo: 'red',
        event: 'violet',
        simple: 'gray',
    };

    return (
        <Paper
            p="lg"
            withBorder
            radius="md"
            style={{
                cursor: 'pointer',
                borderColor: selected ? 'var(--mantine-color-blue-5)' : undefined,
                borderWidth: selected ? 2 : 1,
            }}
            onClick={onSelect}
        >
            <Group justify="space-between" mb="sm">
                <Text size="2rem">{template.preview}</Text>
                {selected && (
                    <ThemeIcon color="blue" variant="filled" size="sm" radius="xl">
                        <IconCheck size={12} />
                    </ThemeIcon>
                )}
            </Group>
            <Text fw={600} mb={4}>{template.name}</Text>
            <Text size="xs" c="dimmed" mb="sm">{template.description}</Text>
            <Group gap={4}>
                <Badge color={categoryColors[template.category]} size="xs">
                    {template.category}
                </Badge>
                <Badge color="gray" size="xs" variant="light">
                    {template.blocks.length} blocos
                </Badge>
            </Group>
        </Paper>
    );
}

// ============================================================================
// PAGE CARD
// ============================================================================

function PageCard({
    page,
    onEdit,
    onDelete,
    onDuplicate,
}: {
    page: LandingPage;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}) {
    const statusColors = { draft: 'gray', published: 'green', archived: 'orange' };
    const statusLabels = { draft: 'Rascunho', published: 'Publicada', archived: 'Arquivada' };
    const conversionRate = page.visits > 0 ? (page.conversions / page.visits * 100).toFixed(1) : '0';

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="sm">
                <Group gap="xs">
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            backgroundColor: page.primaryColor
                        }}
                    />
                    <Text fw={600}>{page.name}</Text>
                </Group>
                <Badge color={statusColors[page.status]}>
                    {statusLabels[page.status]}
                </Badge>
            </Group>

            <Text size="xs" c="dimmed" mb="md">
                /{page.slug}
            </Text>

            <SimpleGrid cols={3} mb="md">
                <div>
                    <Text size="xs" c="dimmed">Visitas</Text>
                    <Text fw={600}>{page.visits.toLocaleString()}</Text>
                </div>
                <div>
                    <Text size="xs" c="dimmed">Conversões</Text>
                    <Text fw={600} c="green">{page.conversions}</Text>
                </div>
                <div>
                    <Text size="xs" c="dimmed">CVR</Text>
                    <Text fw={600} c="blue">{conversionRate}%</Text>
                </div>
            </SimpleGrid>

            <Group gap="xs">
                <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconEdit size={14} />}
                    onClick={onEdit}
                    style={{ flex: 1 }}
                >
                    Editar
                </Button>
                {page.status === 'published' && (
                    <ActionIcon variant="light" color="blue" size="lg">
                        <IconExternalLink size={16} />
                    </ActionIcon>
                )}
                <ActionIcon variant="light" color="gray" size="lg" onClick={onDuplicate}>
                    <IconCopy size={16} />
                </ActionIcon>
                <ActionIcon variant="light" color="red" size="lg" onClick={onDelete}>
                    <IconTrash size={16} />
                </ActionIcon>
            </Group>
        </Card>
    );
}

// ============================================================================
// PAGE BUILDER (Simplified Visual Editor)
// ============================================================================

function PageBuilder({
    page,
    onSave,
    onClose,
}: {
    page: LandingPage;
    onSave: (page: LandingPage) => void;
    onClose: () => void;
}) {
    const [pageName, setPageName] = useState(page.name);
    const [pageSlug, setPageSlug] = useState(page.slug);
    const [primaryColor, setPrimaryColor] = useState(page.primaryColor);
    const [selectedBlocks, setSelectedBlocks] = useState<string[]>(
        TEMPLATES.find(t => t.id === page.template)?.blocks || ['hero', 'cta']
    );
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [heroTitle, setHeroTitle] = useState('Domine o Inglês em 12 Meses');
    const [heroSubtitle, setHeroSubtitle] = useState('Método comprovado com garantia de resultado');
    const [ctaText, setCtaText] = useState('Quero Começar Agora');
    const [whatsappNumber, setWhatsappNumber] = useState('5511999999999');

    const handleBlockToggle = (blockId: string) => {
        if (selectedBlocks.includes(blockId)) {
            setSelectedBlocks(selectedBlocks.filter(b => b !== blockId));
        } else {
            setSelectedBlocks([...selectedBlocks, blockId]);
        }
    };

    const handleSave = () => {
        onSave({
            ...page,
            name: pageName,
            slug: pageSlug,
            primaryColor,
            updatedAt: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between">
                <Group gap="xs">
                    <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={onClose}>
                        Voltar
                    </Button>
                    <Title order={4}>{page.name}</Title>
                </Group>
                <Group>
                    <Button
                        variant={previewMode === 'desktop' ? 'filled' : 'light'}
                        size="xs"
                        leftSection={<IconDeviceDesktop size={14} />}
                        onClick={() => setPreviewMode('desktop')}
                    >
                        Desktop
                    </Button>
                    <Button
                        variant={previewMode === 'mobile' ? 'filled' : 'light'}
                        size="xs"
                        leftSection={<IconDeviceMobile size={14} />}
                        onClick={() => setPreviewMode('mobile')}
                    >
                        Mobile
                    </Button>
                    <Divider orientation="vertical" />
                    <Button variant="light" leftSection={<IconEye size={16} />}>
                        Preview
                    </Button>
                    <Button leftSection={<IconCheck size={16} />} onClick={handleSave}>
                        Salvar
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                {/* Settings Panel */}
                <Stack gap="md">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Text fw={600} mb="md">⚙️ Configurações</Text>
                        <Stack gap="md">
                            <TextInput
                                label="Nome da Página"
                                value={pageName}
                                onChange={(e) => setPageName(e.target.value)}
                            />
                            <TextInput
                                label="Slug (URL)"
                                value={pageSlug}
                                onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                leftSection={<Text size="xs" c="dimmed">/</Text>}
                            />
                            <ColorInput
                                label="Cor Principal"
                                value={primaryColor}
                                onChange={setPrimaryColor}
                                format="hex"
                                swatches={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']}
                            />
                        </Stack>
                    </Card>

                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Text fw={600} mb="md">📝 Conteúdo do Hero</Text>
                        <Stack gap="md">
                            <TextInput
                                label="Título Principal"
                                value={heroTitle}
                                onChange={(e) => setHeroTitle(e.target.value)}
                            />
                            <Textarea
                                label="Subtítulo"
                                value={heroSubtitle}
                                onChange={(e) => setHeroSubtitle(e.target.value)}
                                rows={2}
                            />
                            <TextInput
                                label="Texto do CTA"
                                value={ctaText}
                                onChange={(e) => setCtaText(e.target.value)}
                            />
                            <TextInput
                                label="WhatsApp (com código do país)"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                leftSection={<IconBrandWhatsapp size={16} />}
                            />
                        </Stack>
                    </Card>

                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Text fw={600} mb="md">🧱 Blocos da Página</Text>
                        <Stack gap="xs">
                            {BLOCK_OPTIONS.map(block => (
                                <Paper
                                    key={block.value}
                                    p="sm"
                                    withBorder
                                    radius="sm"
                                    style={{
                                        cursor: 'pointer',
                                        borderColor: selectedBlocks.includes(block.value)
                                            ? primaryColor
                                            : undefined,
                                        backgroundColor: selectedBlocks.includes(block.value)
                                            ? `${primaryColor}10`
                                            : undefined,
                                    }}
                                    onClick={() => handleBlockToggle(block.value)}
                                >
                                    <Group justify="space-between">
                                        <div>
                                            <Text size="sm" fw={500}>{block.label}</Text>
                                            <Text size="xs" c="dimmed">{block.description}</Text>
                                        </div>
                                        {selectedBlocks.includes(block.value) && (
                                            <ThemeIcon color="blue" variant="filled" size="sm" radius="xl">
                                                <IconCheck size={12} />
                                            </ThemeIcon>
                                        )}
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </Card>
                </Stack>

                {/* Preview Panel */}
                <Card shadow="sm" p="lg" radius="md" withBorder>
                    <Text fw={600} mb="md">👁️ Preview</Text>
                    <Paper
                        withBorder
                        radius="md"
                        style={{
                            width: previewMode === 'desktop' ? '100%' : 375,
                            margin: previewMode === 'mobile' ? '0 auto' : undefined,
                            minHeight: 500,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Simulated Preview */}
                        <div style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}aa 100%)`,
                            padding: previewMode === 'desktop' ? 40 : 20,
                            color: 'white',
                            textAlign: 'center',
                        }}>
                            <Text size={previewMode === 'desktop' ? 'xl' : 'lg'} fw={700} mb="sm">
                                {heroTitle}
                            </Text>
                            <Text size={previewMode === 'desktop' ? 'md' : 'sm'} mb="lg" style={{ opacity: 0.9 }}>
                                {heroSubtitle}
                            </Text>
                            <Button
                                color="white"
                                variant="white"
                                size={previewMode === 'desktop' ? 'lg' : 'md'}
                                style={{ color: primaryColor }}
                            >
                                {ctaText}
                            </Button>
                        </div>

                        {selectedBlocks.includes('benefits') && (
                            <div style={{ padding: 20, background: '#f8f9fa' }}>
                                <Text fw={600} ta="center" mb="md">✅ Por que escolher nossa escola?</Text>
                                <SimpleGrid cols={previewMode === 'desktop' ? 3 : 1}>
                                    {['Professores Nativos', 'Método Comprovado', 'Horários Flexíveis'].map(b => (
                                        <Paper key={b} p="sm" radius="sm" withBorder ta="center">
                                            <Text size="sm">{b}</Text>
                                        </Paper>
                                    ))}
                                </SimpleGrid>
                            </div>
                        )}

                        {selectedBlocks.includes('testimonials') && (
                            <div style={{ padding: 20 }}>
                                <Text fw={600} ta="center" mb="md">💬 O que dizem nossos alunos</Text>
                                <Paper p="md" withBorder radius="md">
                                    <Text size="sm" fs="italic" c="dimmed">
                                        "Em 8 meses consegui uma promoção no trabalho por causa do meu inglês!"
                                    </Text>
                                    <Text size="xs" fw={500} mt="sm">— Maria S.</Text>
                                </Paper>
                            </div>
                        )}

                        {selectedBlocks.includes('cta') && (
                            <div style={{
                                padding: 20,
                                background: primaryColor,
                                textAlign: 'center'
                            }}>
                                <Text color="white" fw={600} mb="sm">Pronto para começar?</Text>
                                <Button color="white" variant="white" style={{ color: primaryColor }}>
                                    {ctaText}
                                </Button>
                            </div>
                        )}
                    </Paper>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function LandingPageBuilderPage() {
    const [pages, setPages] = useState<LandingPage[]>([]);
    const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [newPageName, setNewPageName] = useState('');
    const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('pages');

    const handleCreatePage = () => {
        if (!newPageName || !selectedTemplate) {
            notifications.show({
                title: 'Erro',
                message: 'Preencha o nome e selecione um template',
                color: 'red',
            });
            return;
        }

        const newPage: LandingPage = {
            id: Date.now().toString(),
            name: newPageName,
            slug: newPageName.toLowerCase().replace(/\s+/g, '-'),
            status: 'draft',
            template: selectedTemplate,
            primaryColor: '#3b82f6',
            visits: 0,
            conversions: 0,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
        };

        setPages([newPage, ...pages]);
        setEditingPage(newPage);
        closeCreateModal();
        setNewPageName('');
        setSelectedTemplate(null);

        notifications.show({
            title: 'Página Criada!',
            message: 'Agora você pode personalizar sua landing page',
            color: 'green',
        });
    };

    const handleSavePage = (updatedPage: LandingPage) => {
        setPages(pages.map(p => p.id === updatedPage.id ? updatedPage : p));
        setEditingPage(null);
        notifications.show({
            title: 'Salvo!',
            message: 'Alterações salvas com sucesso',
            color: 'green',
        });
    };

    const handleDeletePage = (id: string) => {
        setPages(pages.filter(p => p.id !== id));
        notifications.show({
            title: 'Removida',
            message: 'Página removida com sucesso',
            color: 'gray',
        });
    };

    const handleDuplicatePage = (page: LandingPage) => {
        const duplicate: LandingPage = {
            ...page,
            id: Date.now().toString(),
            name: `${page.name} (Cópia)`,
            slug: `${page.slug}-copy`,
            status: 'draft',
            visits: 0,
            conversions: 0,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
        };
        setPages([duplicate, ...pages]);
        notifications.show({
            title: 'Duplicada!',
            message: 'Página duplicada como rascunho',
            color: 'blue',
        });
    };

    // Stats
    const stats = useMemo(() => ({
        total: pages.length,
        published: pages.filter(p => p.status === 'published').length,
        totalVisits: pages.reduce((s, p) => s + p.visits, 0),
        totalConversions: pages.reduce((s, p) => s + p.conversions, 0),
    }), [pages]);

    if (editingPage) {
        return (
            <Container fluid px="lg" py="lg">
                <PageBuilder
                    page={editingPage}
                    onSave={handleSavePage}
                    onClose={() => setEditingPage(null)}
                />
            </Container>
        );
    }

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
                    <Title order={2}>🖥️ Landing Page Builder</Title>
                    <Text c="dimmed">Crie páginas de conversão sem código</Text>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
                    Nova Página
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Total de Páginas</Text>
                            <Text size="xl" fw={700}>{stats.total}</Text>
                        </div>
                        <ThemeIcon variant="light" size="lg">
                            <IconLayoutGrid size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Publicadas</Text>
                            <Text size="xl" fw={700} c="green">{stats.published}</Text>
                        </div>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Visitas Totais</Text>
                            <Text size="xl" fw={700}>{stats.totalVisits.toLocaleString()}</Text>
                        </div>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconEye size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Conversões</Text>
                            <Text size="xl" fw={700} c="violet">{stats.totalConversions}</Text>
                        </div>
                        <ThemeIcon variant="light" color="violet" size="lg">
                            <IconMail size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Pages Grid */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                    <Text fw={600}>Suas Landing Pages</Text>
                    <Badge color="blue">{pages.length} páginas</Badge>
                </Group>

                {pages.length === 0 ? (
                    <Paper p="xl" withBorder radius="md" ta="center">
                        <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                            <IconTemplate size={30} />
                        </ThemeIcon>
                        <Text c="dimmed" mb="md">Nenhuma landing page criada ainda</Text>
                        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
                            Criar Primeira Página
                        </Button>
                    </Paper>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {pages.map(page => (
                            <PageCard
                                key={page.id}
                                page={page}
                                onEdit={() => setEditingPage(page)}
                                onDelete={() => handleDeletePage(page.id)}
                                onDuplicate={() => handleDuplicatePage(page)}
                            />
                        ))}
                    </SimpleGrid>
                )}
            </Card>

            {/* Create Modal */}
            <Modal
                opened={createModalOpened}
                onClose={closeCreateModal}
                title="Nova Landing Page"
                size="xl"
            >
                <Stack gap="lg">
                    <TextInput
                        label="Nome da Página"
                        placeholder="Ex: Promoção Março 2026"
                        value={newPageName}
                        onChange={(e) => setNewPageName(e.target.value)}
                        required
                    />

                    <div>
                        <Text fw={500} mb="sm">Selecione um Template</Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            {TEMPLATES.map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    selected={selectedTemplate === template.id}
                                    onSelect={() => setSelectedTemplate(template.id)}
                                />
                            ))}
                        </SimpleGrid>
                    </div>

                    <Group justify="flex-end">
                        <Button variant="light" onClick={closeCreateModal}>Cancelar</Button>
                        <Button
                            onClick={handleCreatePage}
                            disabled={!newPageName || !selectedTemplate}
                            leftSection={<IconPlus size={16} />}
                        >
                            Criar Página
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

