'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, Textarea, Select,
    Grid, Tabs, Code, CopyButton, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconMail,
    IconCopy, IconEye, IconSend, IconVariable, IconTemplate
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    category: string;
    content: string;
    variables: string[];
    usageCount: number;
    lastUsed: string | null;
}

// ============================================================================
// PRESETS
// ============================================================================

const CATEGORIES = [
    { value: 'welcome', label: '👋 Boas-vindas' },
    { value: 'nurturing', label: '🌱 Nutrição' },
    { value: 'trial', label: '🎯 Trial/Demo' },
    { value: 'enrollment', label: '✅ Matrícula' },
    { value: 'reminder', label: '⏰ Lembretes' },
    { value: 'feedback', label: '💬 Feedback' },
    { value: 'reactivation', label: '🔄 Reativação' },
];

const AVAILABLE_VARIABLES = [
    { key: '{{nome}}', description: 'Nome do destinatário' },
    { key: '{{email}}', description: 'Email do destinatário' },
    { key: '{{curso}}', description: 'Nome do curso' },
    { key: '{{data_trial}}', description: 'Data do trial agendado' },
    { key: '{{horario}}', description: 'Horário' },
    { key: '{{professor}}', description: 'Nome do professor' },
    { key: '{{preco}}', description: 'Preço do curso' },
    { key: '{{desconto}}', description: 'Valor do desconto' },
    { key: '{{link_matricula}}', description: 'Link para matrícula' },
    { key: '{{link_trial}}', description: 'Link para agendar trial' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [previewModal, { open: openPreviewModal, close: closePreviewModal }] = useDisclosure(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [content, setContent] = useState('');

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedTemplate(null);
        setName('');
        setSubject('');
        setCategory(null);
        setContent('');
        openModal();
    };

    const handleEdit = (template: EmailTemplate) => {
        setIsCreating(false);
        setSelectedTemplate(template);
        setName(template.name);
        setSubject(template.subject);
        setCategory(template.category);
        setContent(template.content);
        openModal();
    };

    const handlePreview = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        openPreviewModal();
    };

    const handleSave = () => {
        if (!name || !subject || !category) return;

        // Extract variables from content
        const variableMatches = content.match(/\{\{(\w+)\}\}/g) || [];
        const subjectMatches = subject.match(/\{\{(\w+)\}\}/g) || [];
        const allMatches = [...new Set([...variableMatches, ...subjectMatches])];
        const variables = allMatches.map(v => v.replace(/\{\{|\}\}/g, ''));

        if (isCreating) {
            const newTemplate: EmailTemplate = {
                id: `tmpl-${Date.now()}`,
                name,
                subject,
                category,
                content,
                variables,
                usageCount: 0,
                lastUsed: null,
            };
            setTemplates(prev => [...prev, newTemplate]);
        } else if (selectedTemplate) {
            setTemplates(prev => prev.map(t =>
                t.id === selectedTemplate.id
                    ? { ...t, name, subject, category, content, variables }
                    : t
            ));
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        setTemplates(prev => prev.filter(t => t.id !== id));
    };

    const getCategoryInfo = (cat: string) => {
        return CATEGORIES.find(c => c.value === cat) || { value: cat, label: cat };
    };

    const filteredTemplates = activeTab === 'all'
        ? templates
        : templates.filter(t => t.category === activeTab);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/marketing/campaigns" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Templates de Email ✉️</Title>
                        <Text c="dimmed">Crie e gerencie templates com variáveis dinâmicas</Text>
                    </div>
                </Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreate}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                >
                    Novo Template
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{templates.length}</Text>
                            <Text size="sm" c="dimmed">Templates</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconTemplate size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">
                                {templates.reduce((acc, t) => acc + t.usageCount, 0)}
                            </Text>
                            <Text size="sm" c="dimmed">Emails Enviados</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconSend size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="violet">
                                {AVAILABLE_VARIABLES.length}
                            </Text>
                            <Text size="sm" c="dimmed">Variáveis</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconVariable size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="orange">
                                {CATEGORIES.length}
                            </Text>
                            <Text size="sm" c="dimmed">Categorias</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="orange">
                            <IconMail size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todos ({templates.length})</Tabs.Tab>
                    {CATEGORIES.map(cat => (
                        <Tabs.Tab key={cat.value} value={cat.value}>
                            {cat.label.split(' ')[0]} ({templates.filter(t => t.category === cat.value).length})
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>

            {/* Template Cards */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {filteredTemplates.map(template => {
                    const categoryInfo = getCategoryInfo(template.category);

                    return (
                        <Card key={template.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <div style={{ flex: 1 }}>
                                        <Group gap="xs" mb={4}>
                                            <Badge variant="light" size="sm">
                                                {categoryInfo.label}
                                            </Badge>
                                        </Group>
                                        <Text fw={600}>{template.name}</Text>
                                        <Text size="sm" c="dimmed" lineClamp={1}>
                                            📧 {template.subject}
                                        </Text>
                                    </div>
                                </Group>

                                <Paper p="sm" bg="gray.0" radius="md">
                                    <Text size="xs" c="dimmed" lineClamp={3} style={{ whiteSpace: 'pre-wrap' }}>
                                        {template.content.substring(0, 200)}...
                                    </Text>
                                </Paper>

                                <Group gap="xs">
                                    <Text size="xs" c="dimmed">Variáveis:</Text>
                                    {template.variables.slice(0, 4).map(v => (
                                        <Code key={v}>{`{{${v}}}`}</Code>
                                    ))}
                                    {template.variables.length > 4 && (
                                        <Badge variant="light" size="xs">+{template.variables.length - 4}</Badge>
                                    )}
                                </Group>

                                <Group justify="space-between">
                                    <Group gap="xl">
                                        <div>
                                            <Text size="sm" fw={700}>{template.usageCount}</Text>
                                            <Text size="xs" c="dimmed">usos</Text>
                                        </div>
                                        {template.lastUsed && (
                                            <div>
                                                <Text size="sm" fw={500}>{new Date(template.lastUsed).toLocaleDateString('pt-BR')}</Text>
                                                <Text size="xs" c="dimmed">último uso</Text>
                                            </div>
                                        )}
                                    </Group>

                                    <Group gap={4}>
                                        <Tooltip label="Visualizar">
                                            <ActionIcon variant="light" color="gray" onClick={() => handlePreview(template)}>
                                                <IconEye size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Editar">
                                            <ActionIcon variant="light" color="blue" onClick={() => handleEdit(template)}>
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Excluir">
                                            <ActionIcon variant="light" color="red" onClick={() => handleDelete(template.id)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {filteredTemplates.length === 0 && (
                <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                        <IconMail size={32} />
                    </ThemeIcon>
                    <Text fw={500}>Nenhum template encontrado</Text>
                    <Text size="sm" c="dimmed">Crie um novo template para começar</Text>
                </Paper>
            )}

            {/* Create/Edit Modal */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title={isCreating ? 'Novo Template' : 'Editar Template'}
                centered
                size="xl"
            >
                <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Stack gap="md">
                            <TextInput
                                label="Nome do Template"
                                placeholder="Ex: Boas-vindas ao Lead"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />

                            <Select
                                label="Categoria"
                                placeholder="Selecione a categoria"
                                data={CATEGORIES}
                                value={category}
                                onChange={setCategory}
                                required
                            />

                            <TextInput
                                label="Assunto do Email"
                                placeholder="Ex: 👋 Olá {{nome}}, bem-vindo(a)!"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />

                            <Textarea
                                label="Conteúdo do Email"
                                placeholder="Digite o conteúdo do email aqui. Use {{variavel}} para campos dinâmicos..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                minRows={12}
                                required
                            />

                            <Group justify="flex-end">
                                <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                                <Button
                                    onClick={handleSave}
                                    variant="gradient"
                                    gradient={{ from: 'blue', to: 'cyan' }}
                                >
                                    {isCreating ? 'Criar Template' : 'Salvar'}
                                </Button>
                            </Group>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper p="md" bg="gray.0" radius="md" h="100%">
                            <Text size="sm" fw={600} mb="md">
                                <IconVariable size={16} style={{ marginRight: 8 }} />
                                Variáveis Disponíveis
                            </Text>
                            <Stack gap="xs">
                                {AVAILABLE_VARIABLES.map(v => (
                                    <Paper key={v.key} p="xs" radius="sm" withBorder>
                                        <Group justify="space-between">
                                            <div>
                                                <Code>{v.key}</Code>
                                                <Text size="xs" c="dimmed">{v.description}</Text>
                                            </div>
                                            <CopyButton value={v.key}>
                                                {({ copied, copy }) => (
                                                    <Tooltip label={copied ? 'Copiado!' : 'Copiar'}>
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            color={copied ? 'green' : 'gray'}
                                                            onClick={copy}
                                                        >
                                                            <IconCopy size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </CopyButton>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Modal>

            {/* Preview Modal */}
            <Modal
                opened={previewModal}
                onClose={closePreviewModal}
                title="Visualização do Email"
                centered
                size="lg"
            >
                {selectedTemplate && (
                    <Stack gap="md">
                        <Paper p="md" bg="blue.0" radius="md">
                            <Text size="sm" fw={600}>
                                📧 {selectedTemplate.subject
                                    .replace(/\{\{nome\}\}/g, 'Maria Silva')
                                    .replace(/\{\{curso\}\}/g, 'Fundamentos de IA')
                                }
                            </Text>
                        </Paper>

                        <Paper p="lg" radius="md" withBorder>
                            <Text style={{ whiteSpace: 'pre-wrap' }}>
                                {selectedTemplate.content
                                    .replace(/\{\{nome\}\}/g, 'Maria Silva')
                                    .replace(/\{\{email\}\}/g, 'maria@email.com')
                                    .replace(/\{\{curso\}\}/g, 'Fundamentos de IA')
                                    .replace(/\{\{data_trial\}\}/g, '15/02/2026')
                                    .replace(/\{\{horario\}\}/g, '14:00')
                                    .replace(/\{\{professor\}\}/g, 'Prof. João')
                                    .replace(/\{\{preco\}\}/g, '997')
                                    .replace(/\{\{desconto\}\}/g, '200')
                                    .replace(/\{\{link_matricula\}\}/g, 'https://escola.com/matricula')
                                    .replace(/\{\{link_trial\}\}/g, 'https://escola.com/trial')
                                }
                            </Text>
                        </Paper>

                        <Text size="xs" c="dimmed" ta="center">
                            ⚡ Visualização com dados de exemplo
                        </Text>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

