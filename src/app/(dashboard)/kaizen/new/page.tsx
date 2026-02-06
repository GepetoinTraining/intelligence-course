'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Button,
    TextInput, Textarea, Select, TagsInput,
    Paper, Breadcrumbs, Anchor, Alert, LoadingOverlay,
    Switch, Divider, SegmentedControl, ThemeIcon
} from '@mantine/core';
import {
    IconArrowLeft, IconSend, IconAlertCircle,
    IconBulb, IconFlame, IconClock, IconCheck,
    IconEye, IconMessage, IconChartBar, IconX,
    IconTrendingUp, IconUser, IconShield, IconHeart,
    IconUsers, IconCoin
} from '@tabler/icons-react';
import Link from 'next/link';

const PROBLEM_TYPES = [
    { value: 'inefficiency', label: '⏱️ Ineficiência - Processo demora demais' },
    { value: 'error_prone', label: '❌ Propenso a Erros - Erros frequentes' },
    { value: 'unclear', label: '👁️ Confuso - Processo não é claro' },
    { value: 'bottleneck', label: '🔥 Gargalo - Limita capacidade' },
    { value: 'waste', label: '📈 Desperdício - Recursos mal utilizados' },
    { value: 'safety', label: '⚠️ Segurança - Risco à segurança' },
    { value: 'quality', label: '✅ Qualidade - Afeta qualidade final' },
    { value: 'cost', label: '💰 Custo - Gasta mais que deveria' },
    { value: 'communication', label: '💬 Comunicação - Falhas de comunicação' },
    { value: 'other', label: '💡 Outro - Outros tipos' },
];

const IMPACT_AREAS = [
    { value: 'time', label: 'Tempo', icon: <IconClock size={14} /> },
    { value: 'cost', label: 'Custo', icon: <IconCoin size={14} /> },
    { value: 'quality', label: 'Qualidade', icon: <IconCheck size={14} /> },
    { value: 'safety', label: 'Segurança', icon: <IconShield size={14} /> },
    { value: 'morale', label: 'Moral da Equipe', icon: <IconHeart size={14} /> },
    { value: 'customer', label: 'Cliente', icon: <IconUsers size={14} /> },
];

const IMPACT_LEVELS = [
    { value: 'low', label: 'Baixo - Melhoria pequena', color: 'gray' },
    { value: 'medium', label: 'Médio - Melhoria significativa', color: 'blue' },
    { value: 'high', label: 'Alto - Grande impacto', color: 'orange' },
    { value: 'critical', label: 'Crítico - Impacto urgente', color: 'red' },
];

const TAG_SUGGESTIONS = [
    'processo', 'atendimento', 'financeiro', 'comunicação',
    'tecnologia', 'treinamento', 'documentação', 'automação',
    'qualidade', 'velocidade', 'custo', 'experiência'
];

export default function NewKaizenPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [problemType, setProblemType] = useState<string | null>(null);
    const [impactArea, setImpactArea] = useState<string>('time');
    const [estimatedImpact, setEstimatedImpact] = useState<string>('medium');
    const [tags, setTags] = useState<string[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Título é obrigatório');
            return;
        }
        if (!description.trim() || description.length < 20) {
            setError('Descrição deve ter pelo menos 20 caracteres');
            return;
        }
        if (!problemType) {
            setError('Selecione o tipo de problema');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/kaizen/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    problemType,
                    impactArea,
                    estimatedImpact,
                    tags,
                    isAnonymous,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Erro ao enviar sugestão');
                return;
            }

            const data = await res.json();
            router.push(`/kaizen/${data.data.id}`);
        } catch (err) {
            console.error('Error submitting suggestion:', err);
            setError('Erro ao enviar sugestão');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Stack gap="xl" pos="relative">
            <LoadingOverlay visible={saving} />

            {/* Breadcrumbs */}
            <Breadcrumbs>
                <Anchor component={Link} href="/kaizen" size="sm">
                    Kaizen
                </Anchor>
                <Text size="sm" c="dimmed">Nova Sugestão</Text>
            </Breadcrumbs>

            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>💡 Nova Sugestão de Melhoria</Title>
                    <Text c="dimmed">
                        Compartilhe sua ideia para melhorar processos
                    </Text>
                </div>
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>
                    <Button
                        leftSection={<IconSend size={16} />}
                        onClick={handleSubmit}
                        loading={saving}
                        color="teal"
                    >
                        Enviar Sugestão
                    </Button>
                </Group>
            </Group>

            {error && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    title="Erro"
                    withCloseButton
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Form */}
            <Card shadow="xs" radius="md" p="xl" withBorder>
                <Stack gap="lg">
                    {/* Problem Type */}
                    <Select
                        label="Qual é o tipo de problema?"
                        placeholder="Selecione o tipo de problema"
                        data={PROBLEM_TYPES}
                        value={problemType}
                        onChange={setProblemType}
                        required
                        size="md"
                        searchable
                    />

                    {/* Title */}
                    <TextInput
                        label="Título da Sugestão"
                        placeholder="Ex: Automatizar envio de relatórios semanais"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        size="md"
                        maxLength={200}
                    />

                    {/* Description */}
                    <Textarea
                        label="Descrição Detalhada"
                        placeholder="Descreva o problema atual e sua sugestão de melhoria. Seja específico sobre o que poderia ser feito diferente..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        minRows={5}
                        maxLength={5000}
                        description={`${description.length}/5000 caracteres`}
                    />

                    <Divider />

                    {/* Impact */}
                    <Group grow align="flex-start">
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>Área de Impacto Principal</Text>
                            <SegmentedControl
                                value={impactArea}
                                onChange={setImpactArea}
                                data={IMPACT_AREAS.map(i => ({
                                    value: i.value,
                                    label: (
                                        <Group gap={4}>
                                            {i.icon}
                                            <span>{i.label}</span>
                                        </Group>
                                    ),
                                }))}
                                fullWidth
                            />
                        </Stack>
                    </Group>

                    <Select
                        label="Impacto Estimado"
                        description="Qual seria o benefício se implementado?"
                        data={IMPACT_LEVELS}
                        value={estimatedImpact}
                        onChange={(v) => setEstimatedImpact(v || 'medium')}
                    />

                    {/* Tags */}
                    <TagsInput
                        label="Tags (opcional)"
                        placeholder="Adicione tags para categorizar"
                        data={TAG_SUGGESTIONS}
                        value={tags}
                        onChange={setTags}
                    />

                    <Divider />

                    {/* Anonymous */}
                    <Paper p="md" radius="md" withBorder bg="gray.0">
                        <Group justify="space-between">
                            <div>
                                <Group gap="xs">
                                    <ThemeIcon size={24} radius="xl" variant="light" color="gray">
                                        <IconUser size={14} />
                                    </ThemeIcon>
                                    <Text fw={500}>Submissão Anônima</Text>
                                </Group>
                                <Text size="sm" c="dimmed" mt={4}>
                                    Seu nome não será exibido publicamente
                                </Text>
                            </div>
                            <Switch
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.currentTarget.checked)}
                                size="md"
                            />
                        </Group>
                    </Paper>
                </Stack>
            </Card>

            {/* Tips */}
            <Card shadow="xs" radius="md" p="md" withBorder>
                <Text fw={500} size="sm" mb="xs">💡 Dicas para uma boa sugestão</Text>
                <Stack gap="xs">
                    <Text size="xs" c="dimmed">
                        • <strong>Seja específico:</strong> Descreva exatamente qual processo ou problema você identificou
                    </Text>
                    <Text size="xs" c="dimmed">
                        • <strong>Proponha uma solução:</strong> Além do problema, sugira como poderia ser resolvido
                    </Text>
                    <Text size="xs" c="dimmed">
                        • <strong>Estime o impacto:</strong> Quanto tempo, dinheiro ou esforço seria economizado?
                    </Text>
                    <Text size="xs" c="dimmed">
                        • <strong>Vote em outras:</strong> Apoie sugestões semelhantes à sua para ganhar visibilidade
                    </Text>
                </Stack>
            </Card>
        </Stack>
    );
}

