'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container, Title, Text, Card, Stack, Group, Button, Badge,
    ThemeIcon, Paper, Divider, Box, Alert, Tabs, Progress,
    SimpleGrid, Timeline, List, Accordion, Loader, RingProgress
} from '@mantine/core';
import {
    IconArrowLeft, IconCheck, IconSparkles, IconUsers, IconSchool,
    IconCash, IconCalendar, IconTarget, IconBulb, IconArrowRight,
    IconRocket, IconChartBar, IconMessage, IconSettings, IconBook,
    IconUserPlus, IconSpeakerphone, IconClipboardList, IconBrain
} from '@tabler/icons-react';
import { useOrg } from '@/components/OrgContext';

// Simulated school context from previous setup steps
const SCHOOL_CONTEXT = {
    name: 'Eco Escola',
    teamSize: 8,
    courses: 3,
    rooms: 4,
    monthlyTarget: 50,
    avgTicket: 450,
    roles: ['Proprietário', 'Coordenador', 'Professor', 'Comercial', 'Secretaria'],
};

// AI-generated blueprint (simulated response)
const GENERATED_BLUEPRINT = {
    summary: {
        schoolType: 'Escola de Cursos Livres - Porte Pequeno/Médio',
        maturityLevel: 'Em Estruturação',
        priority: 'Captação e Processos',
    },
    frontend: {
        title: 'Frontend: Marketing & Captação',
        icon: IconSpeakerphone,
        color: 'blue',
        description: 'Como atrair e converter novos alunos',
        recommendations: [
            {
                title: 'Funil de Captação Digital',
                priority: 'Alta',
                description: 'Monte um funil de 3 etapas: Atração → Nutrição → Conversão',
                actions: [
                    'Criar landing page com formulário de interesse',
                    'Configurar sequência de WhatsApp automática (5 mensagens)',
                    'Definir script de primeiro contato comercial',
                ],
            },
            {
                title: 'Presença em Redes Sociais',
                priority: 'Média',
                description: 'Com 3 cursos, foque em conteúdo educacional no Instagram',
                actions: [
                    'Postar 3x/semana: 2 educativos + 1 institucional',
                    'Stories diários mostrando o dia-a-dia da escola',
                    'Reels mensais com depoimentos de alunos',
                ],
            },
            {
                title: 'Programa de Indicação',
                priority: 'Alta',
                description: 'Com meta de 50 alunos/mês, indicações podem trazer 30%',
                actions: [
                    'Criar desconto de 10% para quem indica',
                    'Bonus de R$50 para aluno que trouxer matrícula',
                    'Campanha "Traga um amigo" trimestral',
                ],
            },
        ],
        kpis: [
            { label: 'Leads/mês', target: '150', current: '0' },
            { label: 'Taxa de conversão', target: '33%', current: '0%' },
            { label: 'CAC', target: 'R$ 80', current: '-' },
        ],
    },
    middleware: {
        title: 'Middleware: Gestão Operacional',
        icon: IconClipboardList,
        color: 'orange',
        description: 'Processos do dia-a-dia da escola',
        recommendations: [
            {
                title: 'Fluxo de Matrícula',
                priority: 'Alta',
                description: 'Padronize o processo de nova matrícula',
                actions: [
                    'Visita/Tour → Proposta → Contrato → Pagamento → Boas-vindas',
                    'Checklist de documentos obrigatórios',
                    'Kit de boas-vindas digital (cronograma + regras)',
                ],
            },
            {
                title: 'Gestão de Inadimplência',
                priority: 'Alta',
                description: 'Com ticket de R$450, cada inadimplente dói',
                actions: [
                    'Lembrete automático 3 dias antes do vencimento',
                    'Cobrança amigável no D+1 via WhatsApp',
                    'Ligação após 7 dias de atraso',
                    'Bloqueio de acesso após 30 dias',
                ],
            },
            {
                title: 'Agenda e Ocupação',
                priority: 'Média',
                description: 'Com 4 salas, otimize a ocupação',
                actions: [
                    'Meta de 80% de ocupação por sala',
                    'Sistema de reposição de aulas',
                    'Visualização de grade semanal por sala',
                ],
            },
        ],
        kpis: [
            { label: 'Ocupação salas', target: '80%', current: '0%' },
            { label: 'Inadimplência', target: '< 5%', current: '-' },
            { label: 'NPS', target: '> 70', current: '-' },
        ],
    },
    backend: {
        title: 'Backend: Coordenação Pedagógica',
        icon: IconBook,
        color: 'green',
        description: 'Qualidade do ensino e gestão acadêmica',
        recommendations: [
            {
                title: 'Estrutura Curricular',
                priority: 'Alta',
                description: 'Documente os 3 cursos com clareza',
                actions: [
                    'Ementa de cada módulo/aula',
                    'Objetivos de aprendizagem por aula',
                    'Materiais didáticos padronizados',
                    'Avaliações e critérios de aprovação',
                ],
            },
            {
                title: 'Capacitação de Professores',
                priority: 'Média',
                description: 'Alinhe metodologia e padrão de qualidade',
                actions: [
                    'Reunião pedagógica quinzenal',
                    'Observação de aulas mensal',
                    'Feedback estruturado por competências',
                ],
            },
            {
                title: 'Acompanhamento de Alunos',
                priority: 'Alta',
                description: 'Evite evasão com acompanhamento proativo',
                actions: [
                    'Alerta de 2 faltas consecutivas',
                    'Contato com responsável após 3ª falta',
                    'Pesquisa de satisfação mensal',
                ],
            },
        ],
        kpis: [
            { label: 'Evasão', target: '< 10%', current: '-' },
            { label: 'Satisfação aulas', target: '> 4.5', current: '-' },
            { label: 'Aprovados', target: '> 85%', current: '-' },
        ],
    },
    firstActions: [
        { day: 1, task: 'Configurar funil de WhatsApp', area: 'frontend' },
        { day: 2, task: 'Criar checklist de matrícula', area: 'middleware' },
        { day: 3, task: 'Documentar ementa do curso principal', area: 'backend' },
        { day: 4, task: 'Configurar cobrança automática', area: 'middleware' },
        { day: 5, task: 'Lançar programa de indicação', area: 'frontend' },
        { day: 7, task: 'Primeira reunião pedagógica', area: 'backend' },
    ],
};

export default function BlueprintPage() {
    const org = useOrg();
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(true);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<string | null>('frontend');

    // Simulate AI generation
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsGenerating(false);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const renderLayerCard = (layer: typeof GENERATED_BLUEPRINT.frontend) => (
        <Stack gap="md">
            <Text c="gray.4" size="sm">
                {layer.description}
            </Text>

            <Accordion variant="separated" radius="md">
                {layer.recommendations.map((rec, idx) => (
                    <Accordion.Item key={idx} value={rec.title} style={{ background: 'var(--mantine-color-dark-7)' }}>
                        <Accordion.Control>
                            <Group justify="space-between" pr="md">
                                <Text c="white" size="sm" fw={500}>{rec.title}</Text>
                                <Badge
                                    size="xs"
                                    color={rec.priority === 'Alta' ? 'red' : 'yellow'}
                                >
                                    {rec.priority}
                                </Badge>
                            </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="sm">
                                <Text c="gray.4" size="sm">{rec.description}</Text>
                                <Divider color="dark.5" />
                                <Text c="gray.5" size="xs" fw={500}>Ações recomendadas:</Text>
                                <List size="sm" spacing="xs">
                                    {rec.actions.map((action, i) => (
                                        <List.Item key={i} c="gray.4">
                                            {action}
                                        </List.Item>
                                    ))}
                                </List>
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>

            <Paper p="md" radius="md" bg="dark.6">
                <Text c="gray.5" size="xs" fw={500} mb="sm">KPIs Sugeridos</Text>
                <SimpleGrid cols={3}>
                    {layer.kpis.map((kpi, idx) => (
                        <Paper key={idx} p="sm" radius="sm" bg="dark.7" ta="center">
                            <Text c="white" fw={600} size="lg">{kpi.target}</Text>
                            <Text c="gray.5" size="xs">{kpi.label}</Text>
                        </Paper>
                    ))}
                </SimpleGrid>
            </Paper>
        </Stack>
    );

    if (isGenerating) {
        return (
            <Box bg="dark.9" mih="100vh">
                <Container size="sm" py="xl">
                    <Card bg="dark.7" radius="lg" p="xl" mt={100}>
                        <Stack align="center" gap="xl">
                            <ThemeIcon size={80} radius="xl" color="grape" variant="light">
                                <IconBrain size={40} />
                            </ThemeIcon>

                            <div style={{ textAlign: 'center' }}>
                                <Title order={2} c="white" mb="xs">
                                    Gerando seu Blueprint
                                </Title>
                                <Text c="gray.4" size="sm">
                                    Analisando a estrutura da sua escola...
                                </Text>
                            </div>

                            <Stack w="100%" gap="xs">
                                <Progress
                                    value={progress}
                                    size="lg"
                                    radius="xl"
                                    color="grape"
                                    animated
                                />
                                <Group justify="space-between">
                                    <Text c="gray.5" size="xs">
                                        {progress < 30 && 'Analisando equipe e estrutura...'}
                                        {progress >= 30 && progress < 60 && 'Mapeando processos recomendados...'}
                                        {progress >= 60 && progress < 90 && 'Definindo KPIs e metas...'}
                                        {progress >= 90 && 'Finalizando blueprint...'}
                                    </Text>
                                    <Text c="gray.5" size="xs">{progress}%</Text>
                                </Group>
                            </Stack>

                            <SimpleGrid cols={3} w="100%" mt="md">
                                <Paper p="sm" radius="md" bg="dark.6" ta="center">
                                    <Text c="white" fw={600}>{SCHOOL_CONTEXT.teamSize}</Text>
                                    <Text c="gray.5" size="xs">Colaboradores</Text>
                                </Paper>
                                <Paper p="sm" radius="md" bg="dark.6" ta="center">
                                    <Text c="white" fw={600}>{SCHOOL_CONTEXT.courses}</Text>
                                    <Text c="gray.5" size="xs">Cursos</Text>
                                </Paper>
                                <Paper p="sm" radius="md" bg="dark.6" ta="center">
                                    <Text c="white" fw={600}>{SCHOOL_CONTEXT.rooms}</Text>
                                    <Text c="gray.5" size="xs">Salas</Text>
                                </Paper>
                            </SimpleGrid>
                        </Stack>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box bg="dark.9" mih="100vh">
            <Container size="lg" py="xl">
                <Stack gap="lg">
                    {/* Header */}
                    <Group justify="space-between">
                        <Group>
                            <Button
                                variant="subtle"
                                leftSection={<IconArrowLeft size={16} />}
                                onClick={() => router.push(`/${org.slug}/admin/setup`)}
                            >
                                Voltar
                            </Button>
                            <Divider orientation="vertical" />
                            <div>
                                <Text c="gray.5" size="xs">Gerado por IA</Text>
                                <Title order={2} c="white" size="lg">
                                    Blueprint Operacional
                                </Title>
                            </div>
                        </Group>
                        <Group>
                            <Badge size="lg" color="grape" leftSection={<IconSparkles size={14} />}>
                                Powered by AI
                            </Badge>
                        </Group>
                    </Group>

                    {/* Summary */}
                    <Card bg="dark.7" radius="md" p="md">
                        <Group justify="space-between">
                            <Group gap="lg">
                                <RingProgress
                                    size={80}
                                    thickness={8}
                                    sections={[
                                        { value: 33, color: 'blue' },
                                        { value: 33, color: 'orange' },
                                        { value: 34, color: 'green' },
                                    ]}
                                    label={
                                        <Text c="white" ta="center" size="xs" fw={600}>3</Text>
                                    }
                                />
                                <div>
                                    <Text c="white" fw={600}>{SCHOOL_CONTEXT.name}</Text>
                                    <Text c="gray.5" size="sm">{GENERATED_BLUEPRINT.summary.schoolType}</Text>
                                    <Group gap="xs" mt={4}>
                                        <Badge size="xs" color="yellow">
                                            {GENERATED_BLUEPRINT.summary.maturityLevel}
                                        </Badge>
                                        <Badge size="xs" color="grape">
                                            Foco: {GENERATED_BLUEPRINT.summary.priority}
                                        </Badge>
                                    </Group>
                                </div>
                            </Group>
                            <Stack gap={4} align="flex-end">
                                <Text c="gray.5" size="xs">Meta mensal</Text>
                                <Text c="white" fw={600} size="xl">
                                    {SCHOOL_CONTEXT.monthlyTarget} matrículas
                                </Text>
                                <Text c="green.5" size="sm">
                                    R$ {(SCHOOL_CONTEXT.monthlyTarget * SCHOOL_CONTEXT.avgTicket).toLocaleString()}/mês
                                </Text>
                            </Stack>
                        </Group>
                    </Card>

                    {/* 3-Layer Tabs */}
                    <Tabs value={activeTab} onChange={setActiveTab}>
                        <Tabs.List grow>
                            <Tabs.Tab
                                value="frontend"
                                leftSection={<IconSpeakerphone size={16} />}
                                color="blue"
                            >
                                Frontend (Captação)
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="middleware"
                                leftSection={<IconClipboardList size={16} />}
                                color="orange"
                            >
                                Middleware (Operação)
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="backend"
                                leftSection={<IconBook size={16} />}
                                color="green"
                            >
                                Backend (Pedagógico)
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="frontend" pt="lg">
                            {renderLayerCard(GENERATED_BLUEPRINT.frontend)}
                        </Tabs.Panel>

                        <Tabs.Panel value="middleware" pt="lg">
                            {renderLayerCard(GENERATED_BLUEPRINT.middleware)}
                        </Tabs.Panel>

                        <Tabs.Panel value="backend" pt="lg">
                            {renderLayerCard(GENERATED_BLUEPRINT.backend)}
                        </Tabs.Panel>
                    </Tabs>

                    {/* First 7 Days Action Plan */}
                    <Card bg="dark.7" radius="md" p="md">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Group gap="sm">
                                    <ThemeIcon size={40} radius="md" color="grape" variant="light">
                                        <IconRocket size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text c="white" fw={600}>Primeiros 7 Dias</Text>
                                        <Text c="gray.5" size="xs">Ações para começar com o pé direito</Text>
                                    </div>
                                </Group>
                                <Button size="xs" variant="light" color="grape">
                                    Criar Tarefas
                                </Button>
                            </Group>

                            <Timeline active={-1} bulletSize={24} lineWidth={2}>
                                {GENERATED_BLUEPRINT.firstActions.map((action, idx) => (
                                    <Timeline.Item
                                        key={idx}
                                        bullet={
                                            <Text size="xs" fw={600}>
                                                {action.day}
                                            </Text>
                                        }
                                        title={
                                            <Group gap="xs">
                                                <Text c="white" size="sm">{action.task}</Text>
                                                <Badge
                                                    size="xs"
                                                    color={
                                                        action.area === 'frontend' ? 'blue' :
                                                            action.area === 'middleware' ? 'orange' : 'green'
                                                    }
                                                >
                                                    {action.area}
                                                </Badge>
                                            </Group>
                                        }
                                    >
                                        <Text c="gray.6" size="xs">Dia {action.day}</Text>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </Stack>
                    </Card>

                    {/* Actions */}
                    <Group justify="space-between">
                        <Button
                            variant="subtle"
                            leftSection={<IconSparkles size={16} />}
                        >
                            Regenerar Blueprint
                        </Button>
                        <Group>
                            <Button
                                variant="light"
                                leftSection={<IconSettings size={16} />}
                            >
                                Personalizar
                            </Button>
                            <Button
                                color="grape"
                                rightSection={<IconArrowRight size={16} />}
                                onClick={() => router.push(`/${org.slug}/admin`)}
                            >
                                Ir para o Dashboard
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Container>
        </Box>
    );
}
