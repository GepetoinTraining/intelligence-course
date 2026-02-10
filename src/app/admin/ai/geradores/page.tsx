'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Paper, Button, Textarea, Select,
    Loader,
} from '@mantine/core';
import {
    IconWand, IconBook, IconClipboard, IconSchool,
    IconMail, IconSparkles, IconCopy, IconCheck,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface GeneratorDef {
    id: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    placeholder: string;
    systemPrompt: string;
}

const GENERATORS: GeneratorDef[] = [
    {
        id: 'lesson_plan', label: 'Plano de Aula', description: 'Gere planos de aula estruturados com objetivos, atividades e avaliação.',
        icon: IconBook, color: 'blue', placeholder: 'Descreva o tema e nível da turma...',
        systemPrompt: 'Gere um plano de aula completo em português.',
    },
    {
        id: 'exam', label: 'Prova / Exercícios', description: 'Crie provas e exercícios com gabarito para diferentes disciplinas.',
        icon: IconClipboard, color: 'violet', placeholder: 'Disciplina, conteúdo e nível de dificuldade...',
        systemPrompt: 'Gere uma prova com questões e gabarito.',
    },
    {
        id: 'rubric', label: 'Rubrica de Avaliação', description: 'Crie rubricas detalhadas para avaliação de projetos e trabalhos.',
        icon: IconSchool, color: 'teal', placeholder: 'Tipo de trabalho e competências a avaliar...',
        systemPrompt: 'Gere uma rubrica de avaliação em formato tabular.',
    },
    {
        id: 'communication', label: 'Comunicado', description: 'Redija comunicados profissionais para pais, alunos ou equipe.',
        icon: IconMail, color: 'orange', placeholder: 'Objetivo e público-alvo do comunicado...',
        systemPrompt: 'Redija um comunicado institucional.',
    },
];

export default function GeradoresPage() {
    const [selectedGen, setSelectedGen] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generator = GENERATORS.find(g => g.id === selectedGen);

    const handleGenerate = async () => {
        if (!prompt.trim() || !generator) return;
        setLoading(true);
        setResult('');
        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `${generator.systemPrompt}\n\nSolicitação: ${prompt}`,
                    context: 'admin_generator',
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data.response || data.data?.response || 'Resposta gerada com sucesso. Verifique os logs para o conteúdo completo.');
            } else {
                setResult('⚠️ O serviço de IA não está disponível no momento. Configure uma API key de IA em Configurações > API Keys para habilitar os geradores.');
            }
        } catch {
            setResult('⚠️ Erro ao conectar com o serviço de IA. Verifique sua conexão e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Inteligência Artificial</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Geradores</Text></Group>
                    <Title order={1}>Geradores de Conteúdo</Title>
                    <Text c="dimmed" mt="xs">Use IA para gerar planos de aula, provas, rubricas e comunicados.</Text>
                </div>

                {/* Generator Cards */}
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {GENERATORS.map(gen => {
                        const Icon = gen.icon;
                        const isSelected = selectedGen === gen.id;
                        return (
                            <Card
                                key={gen.id}
                                withBorder
                                padding="lg"
                                radius="md"
                                style={{
                                    cursor: 'pointer',
                                    borderColor: isSelected ? `var(--mantine-color-${gen.color}-5)` : undefined,
                                    borderWidth: isSelected ? 2 : 1,
                                    transition: 'all 0.2s',
                                }}
                                onClick={() => { setSelectedGen(gen.id); setResult(''); }}
                            >
                                <Group>
                                    <ThemeIcon size={48} radius="md" variant={isSelected ? 'filled' : 'light'} color={gen.color}>
                                        <Icon size={24} />
                                    </ThemeIcon>
                                    <div>
                                        <Text fw={600}>{gen.label}</Text>
                                        <Text size="sm" c="dimmed">{gen.description}</Text>
                                    </div>
                                </Group>
                            </Card>
                        );
                    })}
                </SimpleGrid>

                {/* Input Area */}
                {generator && (
                    <Card withBorder padding="lg" radius="md">
                        <Group gap="sm" mb="md">
                            <ThemeIcon size={32} radius="md" variant="light" color={generator.color}>
                                <IconSparkles size={16} />
                            </ThemeIcon>
                            <Text fw={600}>{generator.label}</Text>
                        </Group>
                        <Textarea
                            placeholder={generator.placeholder}
                            value={prompt}
                            onChange={(e) => setPrompt(e.currentTarget.value)}
                            minRows={4}
                            maxRows={8}
                            autosize
                            mb="md"
                        />
                        <Button
                            leftSection={loading ? undefined : <IconWand size={16} />}
                            color={generator.color}
                            onClick={handleGenerate}
                            loading={loading}
                            disabled={!prompt.trim()}
                        >
                            Gerar com IA
                        </Button>
                    </Card>
                )}

                {/* Result */}
                {result && (
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="md">
                            <Group gap="sm">
                                <ThemeIcon size={32} radius="md" variant="light" color="green"><IconSparkles size={16} /></ThemeIcon>
                                <Text fw={600}>Resultado</Text>
                            </Group>
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                color={copied ? 'green' : 'gray'}
                                onClick={handleCopy}
                            >
                                {copied ? 'Copiado!' : 'Copiar'}
                            </Button>
                        </Group>
                        <Paper withBorder p="md" radius="md" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>
                            <Text size="sm">{result}</Text>
                        </Paper>
                    </Card>
                )}

                {/* Info */}
                {!selectedGen && (
                    <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                        <ThemeIcon size={64} radius="xl" variant="light" color="blue" mx="auto" mb="md"><IconWand size={32} /></ThemeIcon>
                        <Title order={3} mb="xs">Selecione um Gerador</Title>
                        <Text c="dimmed">Clique em um dos geradores acima para começar a criar conteúdo com IA.</Text>
                    </Paper>
                )}
            </Stack>
        </Container>
    );
}
