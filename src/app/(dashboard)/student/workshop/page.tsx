'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Stepper, Textarea, Alert, Divider,
    Grid
} from '@mantine/core';
import {
    IconChevronLeft, IconBulb, IconTarget, IconEye, IconRocket,
    IconCheck, IconAlertCircle, IconSparkles, IconRefresh
} from '@tabler/icons-react';
import Link from 'next/link';

interface Workshop {
    id: string;
    title: string;
    status: 'in_progress' | 'completed';
    createdAt: string;
    problem: string;
    whys: string[];
    rootCause: string;
    successSign: string;
    firstAction: string;
}

const MOCK_WORKSHOPS: Workshop[] = [
    {
        id: '1',
        title: 'Dificuldade com prompts longos',
        status: 'completed',
        createdAt: '2026-01-28',
        problem: 'Minhas prompts muito longas confundem o modelo',
        whys: [
            'Por que o modelo se confunde? - Porque há muitas instruções conflitantes',
            'Por que há instruções conflitantes? - Porque não estruturo bem o prompt',
            'Por que não estruturo bem? - Porque não planejo antes de escrever',
            'Por que não planejo? - Porque tenho pressa de ver resultados',
            'Por que tenho pressa? - Porque subestimo o tempo necessário',
        ],
        rootCause: 'Falta de planejamento prévio antes de escrever prompts',
        successSign: 'Conseguir respostas consistentes em prompts com mais de 3 parágrafos',
        firstAction: 'Criar um template de estrutura para prompts complexos',
    },
];

export default function ProblemWorkshopPage() {
    const [workshops, setWorkshops] = useState<Workshop[]>(MOCK_WORKSHOPS);
    const [activeStep, setActiveStep] = useState(0);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [problem, setProblem] = useState('');
    const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);
    const [rootCause, setRootCause] = useState('');
    const [successSign, setSuccessSign] = useState('');
    const [firstAction, setFirstAction] = useState('');

    const handleStartNew = () => {
        setIsCreating(true);
        setActiveStep(0);
        setProblem('');
        setWhys(['', '', '', '', '']);
        setRootCause('');
        setSuccessSign('');
        setFirstAction('');
    };

    const handleSave = () => {
        const newWorkshop: Workshop = {
            id: `ws-${Date.now()}`,
            title: problem.substring(0, 50),
            status: 'completed',
            createdAt: new Date().toISOString().split('T')[0],
            problem,
            whys: whys.filter(w => w),
            rootCause,
            successSign,
            firstAction,
        };
        setWorkshops(prev => [newWorkshop, ...prev]);
        setIsCreating(false);
    };

    const updateWhy = (index: number, value: string) => {
        setWhys(prev => prev.map((w, i) => i === index ? value : w));
    };

    return (
        <Stack gap="xl">
            <Group justify="space-between">
                <Group>
                    <Link href="/student" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Workshop de Problemas 🔧</Title>
                        <Text c="dimmed">Use os 5 Porquês para encontrar a raiz do problema</Text>
                    </div>
                </Group>
                {!isCreating && (
                    <Button leftSection={<IconBulb size={16} />} onClick={handleStartNew}>
                        Novo Workshop
                    </Button>
                )}
            </Group>

            {isCreating ? (
                <Card shadow="sm" radius="md" p="xl" withBorder>
                    <Stepper active={activeStep} onStepClick={setActiveStep} size="sm" mb="xl">
                        <Stepper.Step label="Problema" description="Capture o problema">
                            <Stack gap="md" mt="lg">
                                <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                                    Descreva o problema que você está enfrentando. Seja específico!
                                </Alert>
                                <Textarea
                                    label="Qual é o problema?"
                                    placeholder="Ex: Minhas prompts muito longas confundem o modelo..."
                                    value={problem}
                                    onChange={(e) => setProblem(e.target.value)}
                                    minRows={4}
                                />
                                <Group justify="flex-end">
                                    <Button onClick={() => setActiveStep(1)} disabled={!problem}>
                                        Próximo: 5 Porquês
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="5 Porquês" description="Aprofunde">
                            <Stack gap="md" mt="lg">
                                <Alert icon={<IconTarget size={16} />} color="violet" variant="light">
                                    Para cada resposta, pergunte "Por quê?" novamente. Isso ajuda a encontrar a causa raiz.
                                </Alert>

                                <Paper p="md" bg="gray.0" radius="md">
                                    <Text size="sm" fw={500} mb="xs">Problema:</Text>
                                    <Text size="sm" c="dimmed">{problem}</Text>
                                </Paper>

                                {[1, 2, 3, 4, 5].map((n, i) => (
                                    <Textarea
                                        key={n}
                                        label={`${n}º Por quê?`}
                                        placeholder={`Por que ${i === 0 ? 'isso acontece' : 'isso'}?`}
                                        value={whys[i]}
                                        onChange={(e) => updateWhy(i, e.target.value)}
                                        minRows={2}
                                    />
                                ))}

                                <Group justify="space-between">
                                    <Button variant="subtle" onClick={() => setActiveStep(0)}>Voltar</Button>
                                    <Button onClick={() => setActiveStep(2)} disabled={!whys[0]}>
                                        Próximo: Causa Raiz
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Causa Raiz" description="Identifique">
                            <Stack gap="md" mt="lg">
                                <Alert icon={<IconEye size={16} />} color="orange" variant="light">
                                    Baseado nos 5 Por quês, qual é a verdadeira causa raiz do problema?
                                </Alert>

                                <Paper p="md" bg="violet.0" radius="md">
                                    <Text size="sm" fw={500} mb="xs">Seus 5 Porquês:</Text>
                                    {whys.filter(w => w).map((w, i) => (
                                        <Text key={i} size="sm" c="dimmed">• {w}</Text>
                                    ))}
                                </Paper>

                                <Textarea
                                    label="Qual é a causa raiz?"
                                    placeholder="A verdadeira causa do problema é..."
                                    value={rootCause}
                                    onChange={(e) => setRootCause(e.target.value)}
                                    minRows={3}
                                />

                                <Group justify="space-between">
                                    <Button variant="subtle" onClick={() => setActiveStep(1)}>Voltar</Button>
                                    <Button onClick={() => setActiveStep(3)} disabled={!rootCause}>
                                        Próximo: Sinal de Sucesso
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Sinal" description="Defina sucesso">
                            <Stack gap="md" mt="lg">
                                <Alert icon={<IconSparkles size={16} />} color="green" variant="light">
                                    Como você vai saber que o problema foi resolvido? Defina um sinal claro de sucesso.
                                </Alert>

                                <Paper p="md" bg="orange.0" radius="md">
                                    <Text size="sm" fw={500} mb="xs">Causa Raiz Identificada:</Text>
                                    <Text size="sm" c="dimmed">{rootCause}</Text>
                                </Paper>

                                <Textarea
                                    label="O que seria um sinal de que o problema foi resolvido?"
                                    placeholder="Eu saberei que resolvi quando..."
                                    value={successSign}
                                    onChange={(e) => setSuccessSign(e.target.value)}
                                    minRows={3}
                                />

                                <Group justify="space-between">
                                    <Button variant="subtle" onClick={() => setActiveStep(2)}>Voltar</Button>
                                    <Button onClick={() => setActiveStep(4)} disabled={!successSign}>
                                        Próximo: Primeira Ação
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Ação" description="Comece agora">
                            <Stack gap="md" mt="lg">
                                <Alert icon={<IconRocket size={16} />} color="cyan" variant="light">
                                    Qual é a primeira ação concreta que você pode tomar AGORA para começar a resolver?
                                </Alert>

                                <Textarea
                                    label="Minha primeira ação será..."
                                    placeholder="A primeira coisa que vou fazer é..."
                                    value={firstAction}
                                    onChange={(e) => setFirstAction(e.target.value)}
                                    minRows={3}
                                />

                                <Divider label="Resumo do Workshop" labelPosition="center" />

                                <Paper p="md" bg="gray.0" radius="md">
                                    <Grid>
                                        <Grid.Col span={6}><Text size="xs" c="dimmed">Problema:</Text><Text size="sm">{problem}</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="xs" c="dimmed">Causa Raiz:</Text><Text size="sm">{rootCause}</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="xs" c="dimmed">Sinal de Sucesso:</Text><Text size="sm">{successSign}</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="xs" c="dimmed">Primeira Ação:</Text><Text size="sm">{firstAction}</Text></Grid.Col>
                                    </Grid>
                                </Paper>

                                <Group justify="space-between">
                                    <Button variant="subtle" onClick={() => setActiveStep(3)}>Voltar</Button>
                                    <Button color="green" leftSection={<IconCheck size={16} />} onClick={handleSave} disabled={!firstAction}>
                                        Salvar Workshop
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>
                    </Stepper>
                </Card>
            ) : (
                <>
                    {workshops.length === 0 ? (
                        <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                <IconBulb size={32} />
                            </ThemeIcon>
                            <Text fw={500}>Nenhum workshop ainda</Text>
                            <Text size="sm" c="dimmed" mb="md">Comece um novo workshop para analisar um problema</Text>
                            <Button onClick={handleStartNew}>Começar Agora</Button>
                        </Paper>
                    ) : (
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                            {workshops.map(ws => (
                                <Card key={ws.id} shadow="sm" radius="md" p="lg" withBorder>
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Text fw={600}>{ws.title}</Text>
                                            <Badge color="green" variant="light" leftSection={<IconCheck size={10} />}>
                                                Concluído
                                            </Badge>
                                        </Group>
                                        <Text size="sm" c="dimmed">{ws.problem}</Text>
                                        <Paper p="sm" bg="orange.0" radius="md">
                                            <Text size="xs" c="dimmed">Causa Raiz:</Text>
                                            <Text size="sm">{ws.rootCause}</Text>
                                        </Paper>
                                        <Paper p="sm" bg="cyan.0" radius="md">
                                            <Text size="xs" c="dimmed">Primeira Ação:</Text>
                                            <Text size="sm">{ws.firstAction}</Text>
                                        </Paper>
                                        <Text size="xs" c="dimmed">{new Date(ws.createdAt).toLocaleDateString('pt-BR')}</Text>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    )}
                </>
            )}
        </Stack>
    );
}

