'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, TextInput, Select, Button, Textarea, Loader,
    ActionIcon, Table, Switch, Divider, Alert, Tabs,
    ThemeIcon, CopyButton, Tooltip, SegmentedControl, Slider,
    Accordion
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconSparkles, IconCopy, IconCheck, IconRefresh, IconPlus,
    IconArrowLeft, IconMail, IconBrandInstagram, IconBrandWhatsapp,
    IconMessageCircle, IconEdit, IconHistory, IconWand, IconHeart,
    IconTrash, IconBookmark, IconBulb
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface GeneratedCopy {
    id: string;
    type: string;
    prompt: string;
    content: string;
    tone: string;
    createdAt: string;
    saved: boolean;
}

// ============================================================================
// PRESET DATA
// ============================================================================

const COPY_TYPES = [
    { value: 'instagram_caption', label: '📸 Instagram Caption', maxLength: 2200 },
    { value: 'instagram_stories', label: '📱 Stories Text', maxLength: 100 },
    { value: 'facebook_ad', label: '📘 Facebook Ad', maxLength: 500 },
    { value: 'google_ad', label: '🔍 Google Ad (Headlines)', maxLength: 90 },
    { value: 'email_subject', label: '✉️ Email Subject', maxLength: 60 },
    { value: 'email_body', label: '📧 Email Body', maxLength: 2000 },
    { value: 'whatsapp', label: '💬 WhatsApp Message', maxLength: 500 },
    { value: 'landing_page', label: '🖥️ Landing Page Headline', maxLength: 150 },
    { value: 'cta_button', label: '🔘 CTA Button', maxLength: 25 },
];

const TONE_OPTIONS = [
    { value: 'professional', label: 'Profissional' },
    { value: 'friendly', label: 'Amigável' },
    { value: 'urgent', label: 'Urgente' },
    { value: 'inspirational', label: 'Inspirador' },
    { value: 'playful', label: 'Divertido' },
    { value: 'educational', label: 'Educativo' },
];

const AUDIENCE_OPTIONS = [
    { value: 'parents', label: 'Pais de alunos' },
    { value: 'young_adults', label: 'Jovens adultos (18-25)' },
    { value: 'professionals', label: 'Profissionais' },
    { value: 'students', label: 'Estudantes' },
    { value: 'general', label: 'Público geral' },
];

// Mock pre-generated copies for demo
const MOCK_GENERATED_COPIES: GeneratedCopy[] = [
    {
        id: '1',
        type: 'instagram_caption',
        prompt: 'Promoção de matrícula de carnaval',
        content: `🎭 CARNAVAL DE OPORTUNIDADES! 🎭

Enquanto todo mundo pula, a gente te ajuda a dar um salto no seu inglês! 🚀

✨ 40% OFF na matrícula
✨ Material didático GRÁTIS
✨ Primeira aula experimental inclusa

Só até sexta-feira de carnaval! 💃

📲 Toque no link da bio e garanta sua vaga!

#InglêsFluente #PromoçãoCarnaval #AprenderInglês #CursoDeIngles`,
        tone: 'playful',
        createdAt: '2026-02-04',
        saved: true,
    },
    {
        id: '2',
        type: 'email_subject',
        prompt: 'Email de reengajamento para leads inativos',
        content: 'Sentimos sua falta! 🙁 Volte e ganhe 20% na sua primeira aula',
        tone: 'friendly',
        createdAt: '2026-02-03',
        saved: true,
    },
    {
        id: '3',
        type: 'whatsapp',
        prompt: 'Follow-up após aula experimental',
        content: `Oi! 👋

Tudo bem? Sou da [Escola] e vi que você fez uma aula experimental conosco essa semana.

Gostou da experiência? 😊

Temos uma condição especial para você se matricular até sexta: 
🎁 Material gratuito + 15% off na mensalidade

Posso te passar mais detalhes?`,
        tone: 'friendly',
        createdAt: '2026-02-02',
        saved: false,
    },
];

// ============================================================================
// AI COPY GENERATOR (Simulated)
// ============================================================================

const generateCopy = async (
    type: string,
    prompt: string,
    tone: string,
    audience: string
): Promise<string> => {
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 2000));

    // Mock responses based on type
    const templates: Record<string, string> = {
        instagram_caption: `✨ ${prompt.toUpperCase()}! ✨

Transforme seu sonho em realidade! 🚀

Na nossa escola, você vai além do básico:
✅ Professores nativos
✅ Turmas reduzidas  
✅ Método comprovado

📍 Agende sua aula experimental gratuita!
👇 Link na bio

#Inglês #Fluência #DreamBig`,

        email_subject: `🎯 ${prompt.slice(0, 40)}... Você não vai querer perder!`,

        whatsapp: `Olá! 👋

${prompt}

Temos uma oportunidade especial para você!

Gostaria de mais informações? 😊`,

        landing_page: `${prompt.toUpperCase()}\nDomine o inglês em 12 meses ou seu dinheiro de volta.`,

        cta_button: prompt.length > 20 ? 'Quero Agora!' : `${prompt}!`,

        google_ad: `${prompt} | Aula Grátis | Método Comprovado`,

        facebook_ad: `🎯 ${prompt}

Você sabia que 90% dos nossos alunos alcançam fluência em 12 meses?

✅ Professores qualificados
✅ Horários flexíveis
✅ Garantia de resultado

[Clique para agendar sua aula experimental gratuita]`,

        instagram_stories: `${prompt.slice(0, 60)}... 🔥 Link no stories!`,

        email_body: `Prezado(a),

${prompt}

Na nossa escola, oferecemos uma experiência única de aprendizado:

→ Metodologia imersiva
→ Professores certificados
→ Flexibilidade de horários
→ Suporte personalizado

Entre em contato conosco para agendar sua aula experimental gratuita.

Atenciosamente,
Equipe [Escola]`,
    };

    return templates[type] || `[Gerado para: ${type}] ${prompt}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CopyGeneratorPage() {
    const [copyType, setCopyType] = useState('instagram_caption');
    const [prompt, setPrompt] = useState('');
    const [tone, setTone] = useState('friendly');
    const [audience, setAudience] = useState('general');
    const [creativity, setCreativity] = useState(50);
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [copies, setCopies] = useState<GeneratedCopy[]>(MOCK_GENERATED_COPIES);
    const [activeTab, setActiveTab] = useState<string | null>('generator');

    const selectedType = COPY_TYPES.find(t => t.value === copyType);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            notifications.show({
                title: 'Erro',
                message: 'Digite uma descrição do que você quer gerar',
                color: 'red',
            });
            return;
        }

        setGenerating(true);
        try {
            const content = await generateCopy(copyType, prompt, tone, audience);
            setGeneratedContent(content);

            // Add to history
            const newCopy: GeneratedCopy = {
                id: Date.now().toString(),
                type: copyType,
                prompt,
                content,
                tone,
                createdAt: new Date().toISOString().split('T')[0],
                saved: false,
            };
            setCopies([newCopy, ...copies]);

            notifications.show({
                title: 'Copy gerado!',
                message: 'Revise e edite conforme necessário',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível gerar o copy',
                color: 'red',
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveCopy = (id: string) => {
        setCopies(copies.map(c =>
            c.id === id ? { ...c, saved: !c.saved } : c
        ));
    };

    const handleDeleteCopy = (id: string) => {
        setCopies(copies.filter(c => c.id !== id));
    };

    const getTypeLabel = (type: string) => {
        return COPY_TYPES.find(t => t.value === type)?.label || type;
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
                    <Title order={2}>✨ AI Copy Generator</Title>
                    <Text c="dimmed">Gere textos de marketing com inteligência artificial</Text>
                </div>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="lg">
                    <Tabs.Tab value="generator" leftSection={<IconWand size={14} />}>
                        Gerador
                    </Tabs.Tab>
                    <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
                        Histórico ({copies.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="templates" leftSection={<IconBulb size={14} />}>
                        Templates
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="generator">
                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                        {/* Generator Form */}
                        <Card shadow="sm" p="lg" radius="md" withBorder>
                            <Text fw={600} mb="md">Configuração</Text>

                            <Stack gap="md">
                                <Select
                                    label="Tipo de Copy"
                                    description="Onde o texto será usado"
                                    data={COPY_TYPES.map(t => ({ value: t.value, label: t.label }))}
                                    value={copyType}
                                    onChange={(v) => setCopyType(v || 'instagram_caption')}
                                />

                                <Textarea
                                    label="O que você quer comunicar?"
                                    description="Descreva a mensagem, oferta ou tema"
                                    placeholder="Ex: Promoção de matrícula com 30% de desconto válida até sexta-feira"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    rows={4}
                                    required
                                />

                                <SimpleGrid cols={2}>
                                    <Select
                                        label="Tom de voz"
                                        data={TONE_OPTIONS}
                                        value={tone}
                                        onChange={(v) => setTone(v || 'friendly')}
                                    />

                                    <Select
                                        label="Público-alvo"
                                        data={AUDIENCE_OPTIONS}
                                        value={audience}
                                        onChange={(v) => setAudience(v || 'general')}
                                    />
                                </SimpleGrid>

                                <div>
                                    <Text size="sm" fw={500} mb="xs">Criatividade</Text>
                                    <Slider
                                        value={creativity}
                                        onChange={setCreativity}
                                        marks={[
                                            { value: 0, label: 'Conservador' },
                                            { value: 50, label: 'Balanceado' },
                                            { value: 100, label: 'Criativo' },
                                        ]}
                                        mb="lg"
                                    />
                                </div>

                                <Button
                                    fullWidth
                                    size="lg"
                                    leftSection={generating ? <Loader size={18} color="white" /> : <IconSparkles size={18} />}
                                    onClick={handleGenerate}
                                    disabled={generating || !prompt.trim()}
                                >
                                    {generating ? 'Gerando...' : 'Gerar Copy'}
                                </Button>
                            </Stack>
                        </Card>

                        {/* Output */}
                        <Stack gap="lg">
                            <Card shadow="sm" p="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Text fw={600}>Resultado</Text>
                                    {selectedType && (
                                        <Badge color="blue" variant="light">
                                            máx. {selectedType.maxLength} chars
                                        </Badge>
                                    )}
                                </Group>

                                {!generatedContent ? (
                                    <Paper p="xl" withBorder radius="md" bg="gray.0" ta="center">
                                        <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                            <IconSparkles size={30} />
                                        </ThemeIcon>
                                        <Text c="dimmed">
                                            Configure as opções e clique em "Gerar Copy"
                                        </Text>
                                    </Paper>
                                ) : (
                                    <Stack gap="md">
                                        <Textarea
                                            value={generatedContent}
                                            onChange={(e) => setGeneratedContent(e.target.value)}
                                            autosize
                                            minRows={6}
                                            maxRows={15}
                                            styles={{ input: { fontFamily: 'inherit' } }}
                                        />

                                        <Group justify="space-between">
                                            <Text size="xs" c="dimmed">
                                                {generatedContent.length} caracteres
                                            </Text>
                                            <Group gap="xs">
                                                <CopyButton value={generatedContent}>
                                                    {({ copied, copy }) => (
                                                        <Button
                                                            variant="light"
                                                            color={copied ? 'teal' : 'blue'}
                                                            leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                                            onClick={copy}
                                                            size="sm"
                                                        >
                                                            {copied ? 'Copiado!' : 'Copiar'}
                                                        </Button>
                                                    )}
                                                </CopyButton>
                                                <Button
                                                    variant="light"
                                                    leftSection={<IconRefresh size={14} />}
                                                    onClick={handleGenerate}
                                                    disabled={generating}
                                                    size="sm"
                                                >
                                                    Regenerar
                                                </Button>
                                            </Group>
                                        </Group>
                                    </Stack>
                                )}
                            </Card>

                            {/* Quick Tips */}
                            <Card shadow="sm" p="lg" radius="md" withBorder>
                                <Text fw={600} mb="md">💡 Dicas para melhores resultados</Text>
                                <Stack gap="xs">
                                    <Paper p="sm" withBorder radius="sm">
                                        <Text size="xs">
                                            <strong>Seja específico:</strong> "Promoção 30% matrícula inglês" funciona melhor que "promoção"
                                        </Text>
                                    </Paper>
                                    <Paper p="sm" withBorder radius="sm">
                                        <Text size="xs">
                                            <strong>Inclua benefícios:</strong> Mencione o que o cliente ganha
                                        </Text>
                                    </Paper>
                                    <Paper p="sm" withBorder radius="sm">
                                        <Text size="xs">
                                            <strong>Adicione urgência:</strong> Prazos e limitações aumentam conversão
                                        </Text>
                                    </Paper>
                                </Stack>
                            </Card>
                        </Stack>
                    </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="history">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Histórico de Copies</Text>
                            <Badge color="blue">{copies.length} gerados</Badge>
                        </Group>

                        <Stack gap="md">
                            {copies.map((copy) => (
                                <Paper key={copy.id} p="md" withBorder radius="md">
                                    <Group justify="space-between" mb="sm">
                                        <Group gap="xs">
                                            <Badge color="blue" variant="light" size="sm">
                                                {getTypeLabel(copy.type)}
                                            </Badge>
                                            <Badge color="gray" variant="light" size="sm">
                                                {copy.tone}
                                            </Badge>
                                            {copy.saved && (
                                                <Badge color="yellow" variant="light" size="sm" leftSection={<IconBookmark size={10} />}>
                                                    Salvo
                                                </Badge>
                                            )}
                                        </Group>
                                        <Text size="xs" c="dimmed">{copy.createdAt}</Text>
                                    </Group>

                                    <Text size="xs" c="dimmed" mb="xs">Prompt: {copy.prompt}</Text>

                                    <Paper p="sm" bg="gray.0" radius="sm" mb="sm">
                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                            {copy.content}
                                        </Text>
                                    </Paper>

                                    <Group gap="xs">
                                        <CopyButton value={copy.content}>
                                            {({ copied, copy: doCopy }) => (
                                                <Button
                                                    variant="light"
                                                    color={copied ? 'teal' : 'blue'}
                                                    size="xs"
                                                    leftSection={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                                    onClick={doCopy}
                                                >
                                                    {copied ? 'Copiado!' : 'Copiar'}
                                                </Button>
                                            )}
                                        </CopyButton>
                                        <Button
                                            variant="light"
                                            color={copy.saved ? 'yellow' : 'gray'}
                                            size="xs"
                                            leftSection={<IconBookmark size={12} />}
                                            onClick={() => handleSaveCopy(copy.id)}
                                        >
                                            {copy.saved ? 'Salvo' : 'Salvar'}
                                        </Button>
                                        <Button
                                            variant="light"
                                            color="red"
                                            size="xs"
                                            leftSection={<IconTrash size={12} />}
                                            onClick={() => handleDeleteCopy(copy.id)}
                                        >
                                            Remover
                                        </Button>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </Card>
                </Tabs.Panel>

                <Tabs.Panel value="templates">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Text fw={600} mb="md">Templates Rápidos</Text>
                        <Text size="sm" c="dimmed" mb="lg">
                            Clique em um template para usar como base
                        </Text>

                        <Accordion>
                            <Accordion.Item value="promo">
                                <Accordion.Control icon={<IconHeart size={16} />}>
                                    Promoções e Ofertas
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="sm">
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Desconto de [X]% na matrícula válido até [data]')}>
                                            Desconto por tempo limitado
                                        </Button>
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Promoção de volta às aulas com condições especiais')}>
                                            Volta às aulas
                                        </Button>
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Black Friday: maiores descontos do ano em cursos')}>
                                            Black Friday
                                        </Button>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>

                            <Accordion.Item value="engagement">
                                <Accordion.Control icon={<IconMessageCircle size={16} />}>
                                    Engajamento
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="sm">
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Post motivacional sobre aprender inglês e conquistar sonhos')}>
                                            Post motivacional
                                        </Button>
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Dica rápida de inglês: [tema da dica]')}>
                                            Dica de inglês
                                        </Button>
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Pergunta para engajar seguidores sobre [tema]')}>
                                            Pergunta engajadora
                                        </Button>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>

                            <Accordion.Item value="conversion">
                                <Accordion.Control icon={<IconBulb size={16} />}>
                                    Conversão
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="sm">
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Agende sua aula experimental gratuita e descubra nosso método')}>
                                            Aula experimental
                                        </Button>
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Últimas vagas para turma de [nível] que começa [data]')}>
                                            Últimas vagas
                                        </Button>
                                        <Button variant="light" fullWidth justify="flex-start" onClick={() => setPrompt('Depoimento de aluno que alcançou fluência em [X] meses')}>
                                            Prova social
                                        </Button>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    </Card>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}

