'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Container, Title, Text, Paper, Textarea, Button, Stack, Group,
    Alert, Loader, Badge, Divider, ActionIcon, Tooltip, Modal,
    Box, Card, Accordion
} from '@mantine/core';
import {
    IconSparkles, IconDeviceFloppy, IconSend, IconRefresh,
    IconQuestionMark, IconInfoCircle, IconAlertCircle,
    IconCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAutoSave } from '@/hooks/useAutoSave';

interface AnunciacaoEditorProps {
    teamId: string;
    teamName: string;
    anunciacaoId?: string;
    initialData?: {
        quarter1Content?: string;
        quarter2Content?: string;
        quarter3Content?: string;
        quarter4AiContent?: string;
        closingContent?: string;
    };
    onPublish?: () => void;
}

const QUARTER_PROMPTS = {
    quarter1: {
        title: 'Quem Eu Sou',
        subtitle: 'Who I Am',
        prompt: 'Quem é você? O que moldou sua forma de pensar? Conte sua história.',
        icon: '🌱',
    },
    quarter2: {
        title: 'O Que Eu Acredito',
        subtitle: 'What I Believe',
        prompt: 'Qual é sua filosofia? O que você acredita sobre educação, liderança, ou a área em que atua?',
        icon: '💡',
    },
    quarter3: {
        title: 'O Que Eu Estou Construindo',
        subtitle: "What I'm Building",
        prompt: 'Qual é sua visão para esta equipe? O que você está trazendo? Para onde estamos indo?',
        icon: '🚀',
    },
};

export function AnunciacaoEditor({
    teamId,
    teamName,
    anunciacaoId,
    initialData,
    onPublish
}: AnunciacaoEditorProps) {
    // Auto-save for the writing content
    const {
        content,
        setContent,
        isSaving,
        lastSaved,
        isDirty,
        isLoading,
        saveNow,
        clearDraft,
    } = useAutoSave('anunciacao', teamId, {
        quarter1Content: initialData?.quarter1Content || '',
        quarter2Content: initialData?.quarter2Content || '',
        quarter3Content: initialData?.quarter3Content || '',
        quarter4AiContent: initialData?.quarter4AiContent || '',
        closingContent: initialData?.closingContent || '',
    });

    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showFaq, setShowFaq] = useState(false);
    const [currentAnunciacaoId, setCurrentAnunciacaoId] = useState(anunciacaoId);

    // Check if quarters 1-3 are complete
    const quartersComplete = !!(
        content.quarter1Content?.trim() &&
        content.quarter2Content?.trim() &&
        content.quarter3Content?.trim()
    );

    // Can publish if quarters 1-3 are complete
    const canPublish = quartersComplete;

    const updateQuarter = useCallback((quarter: 'quarter1Content' | 'quarter2Content' | 'quarter3Content' | 'closingContent', value: string) => {
        setContent(prev => ({ ...prev, [quarter]: value }));
    }, [setContent]);

    // Create draft on mount if none exists
    useEffect(() => {
        const createDraft = async () => {
            if (!currentAnunciacaoId && !isLoading) {
                try {
                    const response = await fetch(`/api/teams/${teamId}/anunciacao`, {
                        method: 'POST',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setCurrentAnunciacaoId(data.anunciacao.id);
                    }
                } catch (error) {
                    console.error('Failed to create draft:', error);
                }
            }
        };
        createDraft();
    }, [teamId, currentAnunciacaoId, isLoading]);

    const handleGenerateAi = async () => {
        if (!currentAnunciacaoId || !quartersComplete) return;

        setIsGeneratingAi(true);
        try {
            // First sync content to API
            await saveNow();

            // Then generate AI quarter
            const response = await fetch(`/api/teams/${teamId}/anunciacao/generate-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anunciacaoId: currentAnunciacaoId }),
            });

            if (!response.ok) throw new Error('Failed to generate');

            const data = await response.json();
            setContent(prev => ({ ...prev, quarter4AiContent: data.quarter4Content }));

            notifications.show({
                title: 'Gerado com sucesso',
                message: 'O quarto trimestre foi gerado pela IA.',
                color: 'violet',
                icon: <IconSparkles size={16} />,
            });
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível gerar o quarto trimestre.',
                color: 'red',
            });
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handlePublish = async () => {
        if (!currentAnunciacaoId || !canPublish) return;

        setIsPublishing(true);
        try {
            // First sync content
            await saveNow();

            const response = await fetch(`/api/teams/${teamId}/anunciacao/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anunciacaoId: currentAnunciacaoId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to publish');
            }

            // Clear local draft
            await clearDraft();

            notifications.show({
                title: 'Publicado!',
                message: 'Sua Anunciação foi publicada. A equipe agora está desbloqueada.',
                color: 'green',
                icon: <IconCheck size={16} />,
            });

            onPublish?.();
        } catch (error) {
            notifications.show({
                title: 'Erro ao publicar',
                message: error instanceof Error ? error.message : 'Não foi possível publicar.',
                color: 'red',
            });
        } finally {
            setIsPublishing(false);
        }
    };

    if (isLoading) {
        return (
            <Container size="md" py="xl">
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">Carregando seu rascunho...</Text>
                </Stack>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Sua Anunciação</Title>
                        <Text c="dimmed" size="sm">
                            Equipe: {teamName}
                        </Text>
                    </div>
                    <Group gap="xs">
                        {isSaving ? (
                            <Badge color="gray" leftSection={<Loader size={12} />}>
                                Salvando...
                            </Badge>
                        ) : lastSaved ? (
                            <Badge color="green" variant="light" leftSection={<IconDeviceFloppy size={12} />}>
                                Salvo
                            </Badge>
                        ) : null}
                        <Tooltip label="O que é uma Anunciação?">
                            <ActionIcon variant="subtle" onClick={() => setShowFaq(true)}>
                                <IconQuestionMark size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                {/* Intro Alert */}
                <Alert icon={<IconInfoCircle size={18} />} color="violet" variant="light">
                    <Text size="sm">
                        Uma Anunciação não é algo que você fabrica — é algo que se revela através de você
                        enquanto escreve. Não há modelo, não há limites. Apenas você e sua visão.
                    </Text>
                </Alert>

                {/* Quarters 1-3 */}
                {Object.entries(QUARTER_PROMPTS).map(([key, config]) => {
                    const fieldKey = `${key}Content` as 'quarter1Content' | 'quarter2Content' | 'quarter3Content';
                    return (
                        <Paper key={key} p="lg" withBorder radius="md">
                            <Stack gap="md">
                                <Group gap="sm">
                                    <Text size="xl">{config.icon}</Text>
                                    <div>
                                        <Title order={4}>{config.title}</Title>
                                        <Text c="dimmed" size="xs">{config.subtitle}</Text>
                                    </div>
                                </Group>
                                <Text size="sm" c="dimmed" fs="italic">
                                    {config.prompt}
                                </Text>
                                <Textarea
                                    placeholder="Escreva livremente..."
                                    minRows={6}
                                    autosize
                                    maxRows={20}
                                    value={content[fieldKey] || ''}
                                    onChange={(e) => updateQuarter(fieldKey, e.target.value)}
                                    styles={{
                                        input: {
                                            fontSize: '1rem',
                                            lineHeight: 1.6,
                                        }
                                    }}
                                />
                            </Stack>
                        </Paper>
                    );
                })}

                <Divider label="O Quarto Trimestre — A Perspectiva da IA" labelPosition="center" />

                {/* Quarter 4 - AI */}
                <Paper p="lg" withBorder radius="md" style={{ borderColor: 'var(--mantine-color-violet-4)' }}>
                    <Stack gap="md">
                        <Group gap="sm">
                            <Text size="xl">🤖</Text>
                            <div>
                                <Title order={4}>A Voz da IA</Title>
                                <Text c="dimmed" size="xs">The AI Quarter</Text>
                            </div>
                        </Group>

                        {!quartersComplete ? (
                            <Alert icon={<IconAlertCircle size={18} />} color="orange" variant="light">
                                Complete os três primeiros trimestres para gerar a perspectiva da IA.
                            </Alert>
                        ) : !content.quarter4AiContent ? (
                            <Stack gap="md">
                                <Text size="sm" c="dimmed">
                                    A IA vai ler seus três trimestres e escrever o quarto — não como resumo,
                                    mas como sua própria voz em diálogo com a sua.
                                </Text>
                                <Button
                                    leftSection={<IconSparkles size={16} />}
                                    color="violet"
                                    onClick={handleGenerateAi}
                                    loading={isGeneratingAi}
                                >
                                    Gerar Quarto Trimestre
                                </Button>
                            </Stack>
                        ) : (
                            <Stack gap="md">
                                <Box
                                    p="md"
                                    style={{
                                        backgroundColor: 'var(--mantine-color-violet-0)',
                                        borderRadius: 'var(--mantine-radius-md)',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    <Text style={{ lineHeight: 1.7 }}>
                                        {content.quarter4AiContent}
                                    </Text>
                                </Box>
                                <Group gap="xs">
                                    <Button
                                        variant="light"
                                        leftSection={<IconRefresh size={16} />}
                                        color="violet"
                                        onClick={handleGenerateAi}
                                        loading={isGeneratingAi}
                                        size="xs"
                                    >
                                        Regenerar
                                    </Button>
                                </Group>
                            </Stack>
                        )}
                    </Stack>
                </Paper>

                {/* Optional Closing */}
                {content.quarter4AiContent && (
                    <Paper p="lg" withBorder radius="md">
                        <Stack gap="md">
                            <Group gap="sm">
                                <Text size="xl">✍️</Text>
                                <div>
                                    <Title order={4}>Encerramento</Title>
                                    <Text c="dimmed" size="xs">Opcional — Suas palavras finais</Text>
                                </div>
                            </Group>
                            <Text size="sm" c="dimmed">
                                Se desejar, adicione uma nota de encerramento após a contribuição da IA.
                            </Text>
                            <Textarea
                                placeholder="Suas palavras finais..."
                                minRows={3}
                                autosize
                                maxRows={10}
                                value={content.closingContent || ''}
                                onChange={(e) => updateQuarter('closingContent', e.target.value)}
                            />
                        </Stack>
                    </Paper>
                )}

                {/* Publish Button */}
                <Paper p="lg" withBorder radius="md" style={{ backgroundColor: 'var(--mantine-color-green-0)' }}>
                    <Stack gap="md">
                        <Title order={4}>Publicar</Title>
                        <Text size="sm">
                            Ao publicar, sua Anunciação se tornará a declaração oficial da equipe.
                            Ela será visível para todos os membros da organização.
                        </Text>
                        <Button
                            leftSection={<IconSend size={16} />}
                            color="green"
                            size="lg"
                            onClick={handlePublish}
                            loading={isPublishing}
                            disabled={!canPublish}
                        >
                            Publicar Anunciação
                        </Button>
                        {!canPublish && (
                            <Text size="xs" c="dimmed">
                                Complete os três primeiros trimestres para publicar.
                            </Text>
                        )}
                    </Stack>
                </Paper>
            </Stack>

            {/* FAQ Modal */}
            <Modal
                opened={showFaq}
                onClose={() => setShowFaq(false)}
                title="O que é uma Anunciação?"
                size="lg"
            >
                <Accordion>
                    <Accordion.Item value="what">
                        <Accordion.Control>O que é uma Anunciação?</Accordion.Control>
                        <Accordion.Panel>
                            Uma Anunciação é um documento pessoal de declaração que líderes de equipe
                            escrevem ao assumir uma posição. Não é um plano de negócios ou uma lista
                            de metas — é uma expressão de quem você é, no que você acredita, e o que
                            você está construindo.
                        </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="why">
                        <Accordion.Control>Por que escrever uma?</Accordion.Control>
                        <Accordion.Panel>
                            As melhores organizações não são alinhadas por documentos de processo —
                            são alinhadas pelo entendimento compartilhado de por que cada pessoa
                            está lá. A Anunciação torna isso visível.
                        </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="ai">
                        <Accordion.Control>O que a IA escreve?</Accordion.Control>
                        <Accordion.Panel>
                            Após você escrever seus três trimestres, a IA lê tudo e escreve o quarto
                            — não como resumo, mas da perspectiva dela. É a voz da IA em diálogo
                            com a sua, explicando como ela entende sua visão e como será a colaboração.
                        </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="leave">
                        <Accordion.Control>O que acontece quando eu sair?</Accordion.Control>
                        <Accordion.Panel>
                            Quando você deixa a liderança da equipe, sua Anunciação é "consagrada" —
                            congelada com as datas de seu mandato e estatísticas do que você
                            realizou. O próximo líder escreve a sua própriaatt, criando um
                            histórico vivo da filosofia de liderança da equipe.
                        </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="edit">
                        <Accordion.Control>Posso editar depois de publicar?</Accordion.Control>
                        <Accordion.Panel>
                            Não. Uma Anunciação publicada representa quem você era naquele momento.
                            Se você evoluir significativamente, pode escrever uma nova versão —
                            mas a antiga permanece arquivada, mostrando sua evolução.
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Modal>
        </Container>
    );
}

export default AnunciacaoEditor;
