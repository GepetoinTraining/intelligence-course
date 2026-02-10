'use client';

import { useState, useRef } from 'react';
import {
    Card, Title, Text, Group, Badge, Table, Button, SimpleGrid,
    ThemeIcon, Select, Loader, Alert, Center, Stack, Modal,
    TextInput, Textarea, NumberInput, Divider, ActionIcon,
    Paper, Image, Tabs, FileInput, Progress, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconBook, IconPlus, IconEye, IconEdit, IconUpload,
    IconFileText, IconCheckbox, IconCode, IconSparkles,
    IconAlertCircle, IconListDetails, IconBrandYoutube,
    IconMusic, IconPresentation, IconDeviceDesktop,
    IconTrash, IconGripVertical, IconPhoto, IconVideo,
    IconFileTypePdf,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface ContentBlock {
    id: string;
    type: 'text' | 'youtube' | 'file' | 'audio' | 'slide' | 'equipment';
    data: Record<string, any>;
}

interface Lesson {
    id: string;
    moduleId: string;
    title: string;
    description: string | null;
    content: string | null;
    contentFormat: string;
    orderIndex: number;
    lessonType: string;
    createdAt: number;
    archivedAt: number | null;
}

// ============================================================================
// CONFIG
// ============================================================================

const LESSON_TYPES = [
    { value: 'standard', label: 'Padrão' },
    { value: 'practice', label: 'Prática' },
    { value: 'capstone', label: 'Capstone' },
];

const CONTENT_FORMATS = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'typst', label: 'Typst' },
    { value: 'html', label: 'HTML' },
    { value: 'blocks', label: '🧩 Blocos de Conteúdo' },
];

const TASK_TYPES = [
    { value: 'prompt', label: '💬 Prompt — Resposta aberta', description: 'Aluno responde em texto livre' },
    { value: 'compare', label: '🔄 Compare — Comparação', description: 'Compare dois conceitos ou textos' },
    { value: 'benchmark', label: '📊 Benchmark — Quiz/Teste', description: 'Questões objetivas com gabarito' },
    { value: 'reflection', label: '🪞 Reflection — Reflexão', description: 'Reflexão sobre o aprendizado' },
    { value: 'schema_design', label: '🗂️ Schema Design — Modelagem', description: 'Desenho de esquema/diagrama' },
    { value: 'upload', label: '📎 Upload — Envio de arquivo', description: 'Upload de documento, áudio ou vídeo' },
];

const BLOCK_TYPES = [
    { value: 'text', label: '📝 Texto', icon: IconFileText, color: 'blue', desc: 'Markdown, Typst ou HTML' },
    { value: 'youtube', label: '🎬 YouTube', icon: IconBrandYoutube, color: 'red', desc: 'Vídeo do YouTube' },
    { value: 'file', label: '📎 Arquivo', icon: IconUpload, color: 'cyan', desc: 'PDF, imagem, doc (Vercel Blob)' },
    { value: 'audio', label: '🎤 Áudio', icon: IconMusic, color: 'grape', desc: 'Áudio para listening/pronúncia' },
    { value: 'slide', label: '📊 Slides', icon: IconPresentation, color: 'orange', desc: 'Google Slides, Canva, iframe' },
    { value: 'equipment', label: '🔧 Equipamento', icon: IconDeviceDesktop, color: 'violet', desc: 'Solicitar hardware/multimídia' },
];

function parseI18nField(field: string | null): string {
    if (!field) return '-';
    try {
        const parsed = JSON.parse(field);
        return parsed['pt-BR'] || parsed.en || Object.values(parsed)[0] as string || '-';
    } catch {
        return field;
    }
}

function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return match ? match[1] : null;
}

function generateBlockId(): string {
    return `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ============================================================================
// PAGE
// ============================================================================

export default function AulasPage() {
    const { data: lessonsData, isLoading: loadingLessons, refetch: refetchLessons } = useApi<Lesson[]>('/api/lessons');
    const { data: equipmentData } = useApi<any>('/api/equipment');

    const [createLessonOpened, { open: openCreateLesson, close: closeCreateLesson }] = useDisclosure(false);
    const [createTaskOpened, { open: openCreateTask, close: closeCreateTask }] = useDisclosure(false);
    const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
    const [saving, setSaving] = useState(false);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

    // Import state
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState('');
    const [importResult, setImportResult] = useState<any>(null);

    // Lesson form
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonDescription, setLessonDescription] = useState('');
    const [lessonContent, setLessonContent] = useState('');
    const [lessonFormat, setLessonFormat] = useState<string | null>('blocks');
    const [lessonType, setLessonType] = useState<string | null>('standard');

    // Content blocks (for blocks format)
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [addBlockType, setAddBlockType] = useState<string | null>(null);

    // Block-specific temp state
    const [ytUrl, setYtUrl] = useState('');
    const [slideUrl, setSlideUrl] = useState('');
    const [blockText, setBlockText] = useState('');
    const [blockTextFormat, setBlockTextFormat] = useState<string | null>('markdown');
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
    const [equipmentPurpose, setEquipmentPurpose] = useState('');

    // File upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Task form
    const [taskTitle, setTaskTitle] = useState('');
    const [taskInstructions, setTaskInstructions] = useState('');
    const [taskType, setTaskType] = useState<string | null>('prompt');
    const [taskMaxPoints, setTaskMaxPoints] = useState<number>(10);

    const lessons: Lesson[] = lessonsData || [];
    const activeLessons = lessons.filter(l => !l.archivedAt);
    const equipment = equipmentData?.data || [];

    const stats = {
        total: activeLessons.length,
        standard: activeLessons.filter(l => l.lessonType === 'standard').length,
        practice: activeLessons.filter(l => l.lessonType === 'practice').length,
        capstone: activeLessons.filter(l => l.lessonType === 'capstone').length,
    };

    // ---- Block management ----
    const addBlock = (type: string) => {
        let data: Record<string, any> = {};

        switch (type) {
            case 'text':
                data = { content: blockText, format: blockTextFormat || 'markdown' };
                setBlockText('');
                break;
            case 'youtube':
                const videoId = extractYouTubeId(ytUrl);
                if (!videoId) return;
                data = { url: ytUrl, videoId, title: '' };
                setYtUrl('');
                break;
            case 'slide':
                data = { url: slideUrl, provider: slideUrl.includes('google') ? 'google_slides' : slideUrl.includes('canva') ? 'canva' : 'iframe' };
                setSlideUrl('');
                break;
            case 'equipment':
                const eq = equipment.find((e: any) => e.id === selectedEquipmentId);
                data = { equipmentId: selectedEquipmentId, equipmentName: eq?.name || '-', purpose: equipmentPurpose };
                setSelectedEquipmentId(null);
                setEquipmentPurpose('');
                break;
            default:
                return;
        }

        setContentBlocks(prev => [...prev, { id: generateBlockId(), type: type as ContentBlock['type'], data }]);
        setAddBlockType(null);
    };

    const removeBlock = (id: string) => {
        setContentBlocks(prev => prev.filter(b => b.id !== id));
    };

    const handleFileUpload = async (file: File | null) => {
        if (!file) return;
        setUploading(true);
        setUploadProgress(30);

        try {
            const formData = new FormData();
            formData.append('file', file);

            setUploadProgress(60);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            setUploadProgress(90);

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setContentBlocks(prev => [...prev, {
                id: generateBlockId(),
                type: 'file',
                data: {
                    url: data.url,
                    filename: data.filename,
                    size: data.size,
                    contentType: data.contentType,
                    category: data.category,
                },
            }]);
            setUploadProgress(100);
        } catch (e) {
            console.error('Upload error:', e);
        }
        setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    };

    const handleAudioUpload = async (file: File | null) => {
        if (!file) return;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setContentBlocks(prev => [...prev, {
                id: generateBlockId(),
                type: 'audio',
                data: { url: data.url, filename: data.filename },
            }]);
        } catch (e) {
            console.error('Audio upload error:', e);
        }
        setUploading(false);
    };

    // ---- Save ----
    const saveLesson = async () => {
        setSaving(true);
        try {
            const titleObj = JSON.stringify({ 'pt-BR': lessonTitle });
            const descObj = JSON.stringify({ 'pt-BR': lessonDescription });

            let finalContent = lessonContent;
            let finalFormat = lessonFormat;

            if (lessonFormat === 'blocks') {
                finalContent = JSON.stringify(contentBlocks);
                finalFormat = 'blocks';
            }

            await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: titleObj,
                    description: descObj,
                    content: finalContent,
                    contentFormat: finalFormat,
                    lessonType: lessonType,
                }),
            });
            refetchLessons();
            setLessonTitle(''); setLessonDescription(''); setLessonContent('');
            setContentBlocks([]);
            closeCreateLesson();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const saveTask = async () => {
        if (!selectedLessonId) return;
        setSaving(true);
        try {
            const titleObj = JSON.stringify({ 'pt-BR': taskTitle });
            const instructionsObj = JSON.stringify({ 'pt-BR': taskInstructions });
            await fetch('/api/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: selectedLessonId,
                    title: titleObj,
                    instructions: instructionsObj,
                    taskType: taskType,
                    maxPoints: taskMaxPoints,
                }),
            });
            setTaskTitle(''); setTaskInstructions('');
            closeCreateTask();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const importLessons = async () => {
        setSaving(true);
        setImportError('');
        setImportResult(null);
        try {
            const parsed = JSON.parse(importJson);
            const res = await fetch('/api/lessons/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Import failed');
            setImportResult(data.summary);
            refetchLessons();
            setImportJson('');
            setTimeout(() => closeImport(), 2000);
        } catch (e: any) {
            setImportError(e.message || 'JSON inválido');
        }
        setSaving(false);
    };

    const typeColor = (t: string) => t === 'standard' ? 'blue' : t === 'practice' ? 'orange' : 'violet';

    // ---- File icon helper ----
    const fileIcon = (category: string) => {
        switch (category) {
            case 'image': return <IconPhoto size={16} />;
            case 'video': return <IconVideo size={16} />;
            case 'audio': return <IconMusic size={16} />;
            case 'document': return <IconFileTypePdf size={16} />;
            default: return <IconUpload size={16} />;
        }
    };

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Pedagógico</Text>
                    <Title order={2}>Construtor de Aulas</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                        Crie conteúdo rico com blocos: texto, YouTube, arquivos, áudio, slides e equipamentos
                    </Text>
                </div>
                <Group gap="xs">
                    <Button variant="light" leftSection={<IconUpload size={16} />} color="cyan" onClick={openImport}>
                        Importar JSON
                    </Button>
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreateLesson}>
                        Nova Aula
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Aulas</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Padrão</Text>
                            <Text fw={700} size="lg">{stats.standard}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg" radius="md">
                            <IconCheckbox size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Prática</Text>
                            <Text fw={700} size="lg">{stats.practice}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                            <IconCode size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Capstone</Text>
                            <Text fw={700} size="lg">{stats.capstone}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Lessons List */}
            <Card withBorder p="md">
                <Group justify="space-between" mb="md">
                    <Text fw={600}>Aulas</Text>
                    <Badge variant="light">{activeLessons.length} aulas</Badge>
                </Group>

                {loadingLessons ? (
                    <Center h={200}><Loader size="lg" /></Center>
                ) : activeLessons.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aula</Table.Th>
                                <Table.Th>Formato</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {activeLessons.map((lesson) => (
                                <Table.Tr key={lesson.id}>
                                    <Table.Td>
                                        <div>
                                            <Text fw={500} size="sm">{parseI18nField(lesson.title)}</Text>
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                {parseI18nField(lesson.description)}
                                            </Text>
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm"
                                            color={lesson.contentFormat === 'blocks' ? 'violet' : 'gray'}>
                                            {lesson.contentFormat === 'blocks' ? '🧩 Blocos' : lesson.contentFormat}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={typeColor(lesson.lessonType)} size="sm">
                                            {LESSON_TYPES.find(t => t.value === lesson.lessonType)?.label}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon variant="subtle" size="sm" color="blue">
                                                <IconEye size={14} />
                                            </ActionIcon>
                                            <ActionIcon variant="subtle" size="sm">
                                                <IconEdit size={14} />
                                            </ActionIcon>
                                            <ActionIcon variant="subtle" size="sm" color="teal"
                                                onClick={() => { setSelectedLessonId(lesson.id); openCreateTask(); }}>
                                                <IconListDetails size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBook size={48} color="gray" />
                            <Text c="dimmed">Nenhuma aula criada</Text>
                            <Text size="xs" c="dimmed">
                                Crie aulas com blocos de conteúdo — texto, YouTube, arquivos, áudio, slides
                            </Text>
                            <Button size="xs" onClick={openCreateLesson}>Criar primeira aula</Button>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* ================================================================ */}
            {/* CREATE LESSON MODAL */}
            {/* ================================================================ */}
            <Modal opened={createLessonOpened} onClose={closeCreateLesson} title="Nova Aula" size="xl">
                <Stack gap="md">
                    <TextInput label="Título" placeholder="Ex: Present Perfect — When & How"
                        value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} required />

                    <Textarea label="Descrição" placeholder="Resumo da aula..."
                        value={lessonDescription} onChange={e => setLessonDescription(e.target.value)} rows={2} />

                    <Group grow>
                        <Select label="Formato do Conteúdo" data={CONTENT_FORMATS}
                            value={lessonFormat} onChange={setLessonFormat} />
                        <Select label="Tipo de Aula" data={LESSON_TYPES}
                            value={lessonType} onChange={setLessonType} />
                    </Group>

                    <Divider label="Conteúdo" labelPosition="center" />

                    {/* LEGACY FORMATS: markdown/typst/html */}
                    {lessonFormat && lessonFormat !== 'blocks' && (
                        <Textarea label="Conteúdo" placeholder={
                            lessonFormat === 'markdown' ? '# Título\n\nEscreva em **markdown**...' :
                                lessonFormat === 'typst' ? '#heading(level: 1)[Título]\n\nEscreva em typst...' :
                                    '<h1>Título</h1>\n<p>Escreva em HTML...</p>'
                        }
                            value={lessonContent} onChange={e => setLessonContent(e.target.value)}
                            rows={12} autosize minRows={8} maxRows={20}
                            styles={{ input: { fontFamily: 'monospace', fontSize: '13px' } }}
                        />
                    )}

                    {/* BLOCKS FORMAT */}
                    {lessonFormat === 'blocks' && (
                        <Stack gap="sm">
                            {/* Existing blocks */}
                            {contentBlocks.map((block, idx) => (
                                <Paper key={block.id} withBorder p="sm" radius="md"
                                    style={{ borderLeft: `4px solid var(--mantine-color-${BLOCK_TYPES.find(b => b.value === block.type)?.color || 'gray'}-5)` }}>
                                    <Group justify="space-between">
                                        <Group gap="xs">
                                            <Badge variant="light" size="sm"
                                                color={BLOCK_TYPES.find(b => b.value === block.type)?.color || 'gray'}>
                                                {BLOCK_TYPES.find(b => b.value === block.type)?.label || block.type}
                                            </Badge>

                                            {/* Block content preview */}
                                            {block.type === 'text' && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                    {block.data.content?.substring(0, 60)}...
                                                </Text>
                                            )}
                                            {block.type === 'youtube' && (
                                                <Text size="xs" c="dimmed">
                                                    youtu.be/{block.data.videoId}
                                                </Text>
                                            )}
                                            {block.type === 'file' && (
                                                <Group gap={4}>
                                                    {fileIcon(block.data.category)}
                                                    <Text size="xs" c="dimmed">{block.data.filename}</Text>
                                                </Group>
                                            )}
                                            {block.type === 'audio' && (
                                                <Group gap={4}>
                                                    <IconMusic size={14} />
                                                    <Text size="xs" c="dimmed">{block.data.filename}</Text>
                                                </Group>
                                            )}
                                            {block.type === 'slide' && (
                                                <Text size="xs" c="dimmed">
                                                    {block.data.provider}
                                                </Text>
                                            )}
                                            {block.type === 'equipment' && (
                                                <Text size="xs" c="dimmed">
                                                    🔧 {block.data.equipmentName}
                                                </Text>
                                            )}
                                        </Group>
                                        <ActionIcon variant="subtle" color="red" size="sm"
                                            onClick={() => removeBlock(block.id)}>
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Group>

                                    {/* YouTube preview */}
                                    {block.type === 'youtube' && block.data.videoId && (
                                        <Image
                                            src={`https://img.youtube.com/vi/${block.data.videoId}/mqdefault.jpg`}
                                            alt="YouTube thumbnail"
                                            radius="sm"
                                            mt="xs"
                                            h={120}
                                            fit="cover"
                                        />
                                    )}

                                    {/* File preview for images */}
                                    {block.type === 'file' && block.data.category === 'image' && (
                                        <Image
                                            src={block.data.url}
                                            alt={block.data.filename}
                                            radius="sm"
                                            mt="xs"
                                            h={120}
                                            fit="cover"
                                        />
                                    )}
                                </Paper>
                            ))}

                            {/* Add block buttons */}
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                                <Text size="xs" fw={600} mb="xs" c="dimmed">Adicionar bloco de conteúdo:</Text>
                                <Group gap="xs">
                                    {BLOCK_TYPES.map(bt => (
                                        <Tooltip key={bt.value} label={bt.desc}>
                                            <Button
                                                variant={addBlockType === bt.value ? 'filled' : 'light'}
                                                color={bt.color}
                                                size="xs"
                                                leftSection={<bt.icon size={14} />}
                                                onClick={() => setAddBlockType(addBlockType === bt.value ? null : bt.value)}
                                            >
                                                {bt.label.split(' ')[1]}
                                            </Button>
                                        </Tooltip>
                                    ))}
                                </Group>

                                {/* Block-specific input forms */}
                                {addBlockType === 'text' && (
                                    <Stack gap="xs" mt="sm">
                                        <Select size="xs" label="Formato" data={[
                                            { value: 'markdown', label: 'Markdown' },
                                            { value: 'typst', label: 'Typst' },
                                            { value: 'html', label: 'HTML' },
                                        ]} value={blockTextFormat} onChange={setBlockTextFormat} />
                                        <Textarea placeholder="Escreva o conteúdo do bloco..."
                                            value={blockText} onChange={e => setBlockText(e.target.value)}
                                            rows={6} styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }} />
                                        <Button size="xs" onClick={() => addBlock('text')} disabled={!blockText}>
                                            Adicionar Texto
                                        </Button>
                                    </Stack>
                                )}

                                {addBlockType === 'youtube' && (
                                    <Stack gap="xs" mt="sm">
                                        <TextInput placeholder="https://www.youtube.com/watch?v=..."
                                            label="URL do YouTube" value={ytUrl}
                                            onChange={e => setYtUrl(e.target.value)} />
                                        {ytUrl && extractYouTubeId(ytUrl) && (
                                            <Image
                                                src={`https://img.youtube.com/vi/${extractYouTubeId(ytUrl)}/mqdefault.jpg`}
                                                alt="Preview" radius="sm" h={120} fit="cover" />
                                        )}
                                        <Button size="xs" color="red" onClick={() => addBlock('youtube')}
                                            disabled={!extractYouTubeId(ytUrl)}
                                            leftSection={<IconBrandYoutube size={14} />}>
                                            Adicionar Vídeo
                                        </Button>
                                    </Stack>
                                )}

                                {addBlockType === 'file' && (
                                    <Stack gap="xs" mt="sm">
                                        <FileInput
                                            label="Selecionar arquivo"
                                            placeholder="PDF, imagem, documento..."
                                            accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,video/*"
                                            onChange={handleFileUpload}
                                        />
                                        {uploading && (
                                            <Progress value={uploadProgress} animated color="cyan" size="sm" />
                                        )}
                                    </Stack>
                                )}

                                {addBlockType === 'audio' && (
                                    <Stack gap="xs" mt="sm">
                                        <FileInput
                                            label="Upload de áudio"
                                            placeholder="MP3, WAV, OGG..."
                                            accept="audio/*"
                                            onChange={handleAudioUpload}
                                        />
                                        {uploading && (
                                            <Progress value={50} animated color="grape" size="sm" />
                                        )}
                                    </Stack>
                                )}

                                {addBlockType === 'slide' && (
                                    <Stack gap="xs" mt="sm">
                                        <TextInput placeholder="https://docs.google.com/presentation/d/..."
                                            label="URL da apresentação (Google Slides, Canva, ou iframe)"
                                            value={slideUrl} onChange={e => setSlideUrl(e.target.value)} />
                                        <Button size="xs" color="orange" onClick={() => addBlock('slide')}
                                            disabled={!slideUrl} leftSection={<IconPresentation size={14} />}>
                                            Adicionar Slides
                                        </Button>
                                    </Stack>
                                )}

                                {addBlockType === 'equipment' && (
                                    <Stack gap="xs" mt="sm">
                                        <Select
                                            label="Equipamento necessário"
                                            placeholder="Selecione..."
                                            data={equipment.map((e: any) => ({
                                                value: e.id,
                                                label: `${e.name} (${e.category})`,
                                            }))}
                                            value={selectedEquipmentId}
                                            onChange={setSelectedEquipmentId}
                                            searchable
                                        />
                                        <TextInput label="Finalidade"
                                            placeholder="Ex: Listening exercise — Unit 3"
                                            value={equipmentPurpose}
                                            onChange={e => setEquipmentPurpose(e.target.value)} />
                                        <Button size="xs" color="violet" onClick={() => addBlock('equipment')}
                                            disabled={!selectedEquipmentId}
                                            leftSection={<IconDeviceDesktop size={14} />}>
                                            Solicitar Equipamento
                                        </Button>
                                    </Stack>
                                )}
                            </Paper>

                            {contentBlocks.length > 0 && (
                                <Alert variant="light" color="blue" p="xs">
                                    <Text size="xs">
                                        {contentBlocks.length} bloco(s) de conteúdo adicionados
                                    </Text>
                                </Alert>
                            )}
                        </Stack>
                    )}

                    <Button onClick={saveLesson} loading={saving}
                        disabled={!lessonTitle || (lessonFormat === 'blocks' && contentBlocks.length === 0)}
                        size="md" fullWidth>
                        Criar Aula
                    </Button>
                </Stack>
            </Modal>

            {/* ================================================================ */}
            {/* CREATE TASK MODAL */}
            {/* ================================================================ */}
            <Modal opened={createTaskOpened} onClose={closeCreateTask} title="Nova Tarefa" size="md">
                <Stack gap="md">
                    <Alert variant="light" color="blue" p="xs">
                        <Text size="xs">
                            6 tipos de tarefa: prompt (texto livre), compare, benchmark (quiz),
                            reflection, schema_design (diagrama), upload (arquivo).
                        </Text>
                    </Alert>

                    <TextInput label="Título" placeholder="Ex: Descreva a diferença entre..."
                        value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />

                    <Select label="Tipo de Tarefa" data={TASK_TYPES.map(t => ({
                        value: t.value, label: t.label,
                    }))} value={taskType} onChange={setTaskType} />

                    {taskType && (
                        <Text size="xs" c="dimmed">
                            {TASK_TYPES.find(t => t.value === taskType)?.description}
                        </Text>
                    )}

                    <Textarea label="Instruções" placeholder="O que o aluno deve fazer..."
                        value={taskInstructions} onChange={e => setTaskInstructions(e.target.value)} rows={4} />

                    <NumberInput label="Pontos Máximos" value={taskMaxPoints}
                        onChange={v => setTaskMaxPoints(Number(v))} min={1} max={100} />

                    <Button onClick={saveTask} loading={saving} disabled={!taskTitle}>
                        Adicionar Tarefa
                    </Button>
                </Stack>
            </Modal>

            {/* ================================================================ */}
            {/* IMPORT MODAL */}
            {/* ================================================================ */}
            <Modal opened={importOpened} onClose={closeImport} title="Importar Aulas via JSON" size="lg">
                <Stack gap="md">
                    <Alert variant="light" color="cyan" icon={<IconSparkles size={20} />}>
                        <Text size="sm">
                            Cole o JSON gerado pela IA. Formato: array de objetos com
                            <strong> title</strong>, <strong>content</strong>, <strong>contentFormat</strong>,
                            <strong> lessonType</strong>, <strong>moduleId</strong>.
                            Inclua <strong>tasks[]</strong> para criar tarefas automaticamente.
                        </Text>
                    </Alert>

                    <Textarea
                        label="JSON"
                        placeholder={'[\n  {\n    "title": "Present Perfect",\n    "content": "# Present Perfect\\n\\nUse for...",\n    "contentFormat": "markdown",\n    "lessonType": "standard",\n    "moduleId": "..."\n  }\n]'}
                        value={importJson}
                        onChange={e => setImportJson(e.target.value)}
                        rows={12} autosize minRows={8} maxRows={20}
                        styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
                    />

                    {importError && (
                        <Alert color="red" p="xs">
                            <Text size="xs">{importError}</Text>
                        </Alert>
                    )}

                    {importResult && (
                        <Alert color="green" p="xs">
                            <Text size="xs">
                                ✅ {importResult.lessonsCreated} aula(s) criada(s),
                                {' '}{importResult.tasksCreated} tarefa(s) criada(s)
                            </Text>
                        </Alert>
                    )}

                    <Button onClick={importLessons} loading={saving} disabled={!importJson}
                        color="cyan" leftSection={<IconUpload size={16} />}>
                        Importar Aulas
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
