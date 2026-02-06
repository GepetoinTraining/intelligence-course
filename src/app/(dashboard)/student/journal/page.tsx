'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Textarea, Modal, ActionIcon, Loader, Center,
    Timeline, ThemeIcon, Select, Paper, Divider, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconSearch, IconNotebook, IconBulb, IconQuestionMark,
    IconSchool, IconSparkles, IconFilter, IconCalendar, IconPrinter, IconDownload
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

interface Annotation {
    id: string;
    runId: string;
    annotation: string;
    annotationType: 'reflection' | 'breakthrough' | 'lesson_learned' | 'question';
    insightCaptured: boolean;
    createdAt: number;
}

const annotationTypeConfig = {
    reflection: { label: 'Reflexão', color: 'blue', icon: IconNotebook },
    breakthrough: { label: 'Descoberta', color: 'green', icon: IconSparkles },
    lesson_learned: { label: 'Lição Aprendida', color: 'orange', icon: IconSchool },
    question: { label: 'Pergunta', color: 'violet', icon: IconQuestionMark },
};

export default function StudentJournalPage() {
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [newAnnotation, setNewAnnotation] = useState({
        runId: '',
        annotation: '',
        annotationType: 'reflection'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAnnotations();
    }, []);

    const fetchAnnotations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/annotations');
            const data = await res.json();
            if (data.data) {
                setAnnotations(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch annotations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newAnnotation.annotation.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/annotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAnnotation),
            });
            if (res.ok) {
                closeCreate();
                setNewAnnotation({ runId: '', annotation: '', annotationType: 'reflection' });
                fetchAnnotations();
            }
        } catch (error) {
            console.error('Failed to create annotation:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredAnnotations = annotations.filter(a => {
        const matchesSearch = a.annotation.toLowerCase().includes(search.toLowerCase());
        const matchesType = !typeFilter || a.annotationType === typeFilter;
        return matchesSearch && matchesType;
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Run Journal</Title>
                    <Text c="dimmed">Suas reflexões e aprendizados</Text>
                </div>
                <Group>
                    <Tooltip label="Imprimir Journal">
                        <ActionIcon
                            variant="light"
                            size="lg"
                            onClick={() => window.print()}
                        >
                            <IconPrinter size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <ExportButton
                        data={filteredAnnotations.map(a => ({
                            tipo: annotationTypeConfig[a.annotationType]?.label || a.annotationType,
                            anotacao: a.annotation,
                            insightCapturado: a.insightCaptured ? 'Sim' : 'Não',
                            data: formatDate(a.createdAt),
                        }))}
                        columns={[
                            { key: 'tipo', label: 'Tipo' },
                            { key: 'anotacao', label: 'Anotação' },
                            { key: 'insightCapturado', label: 'Insight' },
                            { key: 'data', label: 'Data' },
                        ]}
                        title="Run Journal - Anotações"
                        filename="journal_anotacoes"
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar"
                        variant="light"
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                        Nova Anotação
                    </Button>
                </Group>
            </Group>

            <Group mb="lg">
                <TextInput
                    placeholder="Buscar anotações..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1 }}
                />
                <Select
                    placeholder="Filtrar por tipo"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={typeFilter}
                    onChange={setTypeFilter}
                    data={[
                        { value: 'reflection', label: '💭 Reflexão' },
                        { value: 'breakthrough', label: '✨ Descoberta' },
                        { value: 'lesson_learned', label: '📚 Lição Aprendida' },
                        { value: 'question', label: '❓ Pergunta' },
                    ]}
                    w={200}
                />
            </Group>

            {/* Stats */}
            <Paper withBorder p="md" mb="lg">
                <Group justify="space-around">
                    {Object.entries(annotationTypeConfig).map(([type, config]) => {
                        const count = annotations.filter(a => a.annotationType === type).length;
                        return (
                            <Stack key={type} align="center" gap={4}>
                                <ThemeIcon size="lg" variant="light" color={config.color}>
                                    <config.icon size={18} />
                                </ThemeIcon>
                                <Text fw={700}>{count}</Text>
                                <Text size="xs" c="dimmed">{config.label}</Text>
                            </Stack>
                        );
                    })}
                </Group>
            </Paper>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : filteredAnnotations.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                        <IconNotebook size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Nenhuma anotação encontrada</Title>
                    <Text c="dimmed" mb="lg">
                        {annotations.length === 0
                            ? 'Comece registrando suas reflexões após cada prompt run!'
                            : 'Tente ajustar os filtros de busca'}
                    </Text>
                    {annotations.length === 0 && (
                        <Button onClick={openCreate}>Criar Primeira Anotação</Button>
                    )}
                </Card>
            ) : (
                <Timeline active={-1} bulletSize={36} lineWidth={2}>
                    {filteredAnnotations.map((annotation) => {
                        const config = annotationTypeConfig[annotation.annotationType];
                        const IconComponent = config.icon;
                        return (
                            <Timeline.Item
                                key={annotation.id}
                                bullet={
                                    <ThemeIcon size={36} radius="xl" color={config.color}>
                                        <IconComponent size={18} />
                                    </ThemeIcon>
                                }
                            >
                                <Card withBorder>
                                    <Group justify="space-between" mb="xs">
                                        <Badge color={config.color}>{config.label}</Badge>
                                        <Group gap="xs">
                                            <IconCalendar size={14} />
                                            <Text size="xs" c="dimmed">{formatDate(annotation.createdAt)}</Text>
                                        </Group>
                                    </Group>
                                    <Text>{annotation.annotation}</Text>
                                    {annotation.insightCaptured && (
                                        <Badge variant="light" color="yellow" mt="sm" leftSection={<IconBulb size={12} />}>
                                            Insight capturado
                                        </Badge>
                                    )}
                                </Card>
                            </Timeline.Item>
                        );
                    })}
                </Timeline>
            )}

            {/* Create Modal */}
            <Modal opened={createOpened} onClose={closeCreate} title="Nova Anotação" size="md">
                <Stack>
                    <Select
                        label="Tipo de Anotação"
                        value={newAnnotation.annotationType}
                        onChange={(v) => setNewAnnotation({ ...newAnnotation, annotationType: v || 'reflection' })}
                        data={[
                            { value: 'reflection', label: '💭 Reflexão' },
                            { value: 'breakthrough', label: '✨ Descoberta' },
                            { value: 'lesson_learned', label: '📚 Lição Aprendida' },
                            { value: 'question', label: '❓ Pergunta' },
                        ]}
                    />
                    <TextInput
                        label="Run ID (opcional)"
                        placeholder="ID do prompt run relacionado"
                        value={newAnnotation.runId}
                        onChange={(e) => setNewAnnotation({ ...newAnnotation, runId: e.target.value })}
                    />
                    <Textarea
                        label="Anotação"
                        placeholder="O que você aprendeu ou observou?"
                        minRows={4}
                        value={newAnnotation.annotation}
                        onChange={(e) => setNewAnnotation({ ...newAnnotation, annotation: e.target.value })}
                        required
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={closeCreate}>Cancelar</Button>
                        <Button onClick={handleCreate} loading={saving} disabled={!newAnnotation.annotation.trim()}>
                            Salvar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

