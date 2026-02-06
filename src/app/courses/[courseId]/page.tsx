'use client';

import { use } from 'react';
import {
    Container, Title, Text, Button, Stack, Group, Badge, Card, SimpleGrid,
    ThemeIcon, Box, Avatar, Paper, Divider, Accordion, List, Progress,
    Tabs, Grid, Timeline, Table, Anchor, ActionIcon, RingProgress
} from '@mantine/core';
import Link from 'next/link';
import {
    IconBrain, IconRocket, IconUsers, IconStar, IconCheck, IconArrowRight,
    IconSparkles, IconCode, IconTarget, IconTrophy, IconClock, IconCertificate,
    IconSchool, IconDeviceLaptop, IconBrandWhatsapp, IconChevronLeft,
    IconPlayerPlay, IconBook, IconCalendar, IconCoin, IconGift, IconQuote
} from '@tabler/icons-react';

// Course data (would come from API/database)
const COURSES_DATA: Record<string, any> = {
    intelligence: {
        id: 'intelligence',
        name: 'Alfabetização em IA',
        subtitle: 'O curso que vai mudar sua relação com a tecnologia',
        tagline: 'Domine a inteligência artificial de forma crítica e criativa',
        color: 'violet',
        gradient: { from: 'violet', to: 'grape' },
        icon: '🧠',
        heroImage: null,
        description: `Nosso curso de Alfabetização em IA foi desenvolvido para ensinar você a interagir 
        efetivamente com sistemas de inteligência artificial. Você aprenderá a criar prompts eficazes, 
        avaliar respostas criticamente e desenvolver projetos práticos usando IA como ferramenta.`,
        duration: '6 meses',
        classesPerWeek: '1 aula/semana',
        classDuration: '90 minutos',
        totalClasses: 24,
        price: 450,
        enrollmentFee: 100,
        ages: '10+ anos',
        maxStudents: 8,
        availableSpots: 3,
        nextStart: '10 de Março 2026',
        schedule: [
            { day: 'Segunda', time: '14:00 - 15:30' },
            { day: 'Terça', time: '16:00 - 17:30' },
            { day: 'Sábado', time: '09:00 - 10:30' },
        ],
        modules: [
            {
                title: 'Módulo 1: Fundamentos de IA',
                lessons: 4,
                topics: ['O que é IA?', 'Tipos de IA', 'IA no cotidiano', 'Ética e IA'],
            },
            {
                title: 'Módulo 2: Prompt Engineering Básico',
                lessons: 4,
                topics: ['Anatomia de um prompt', 'Contexto e clareza', 'Iteração', 'Estruturação'],
            },
            {
                title: 'Módulo 3: Avaliação Crítica',
                lessons: 4,
                topics: ['Verificação de fatos', 'Viés algorítmico', 'Alucinações', 'Fontes confiáveis'],
            },
            {
                title: 'Módulo 4: Prompt Engineering Avançado',
                lessons: 4,
                topics: ['Chain of thought', 'Few-shot learning', 'Personas', 'Templates'],
            },
            {
                title: 'Módulo 5: Projetos Criativos',
                lessons: 4,
                topics: ['Storytelling com IA', 'Arte generativa', 'Música com IA', 'Jogos'],
            },
            {
                title: 'Módulo 6: Projeto Final',
                lessons: 4,
                topics: ['Planejamento', 'Desenvolvimento', 'Apresentação', 'Certificação'],
            },
        ],
        outcomes: [
            'Criar prompts eficazes para qualquer tarefa',
            'Avaliar criticamente respostas de IA',
            'Identificar viés e desinformação',
            'Usar IA como ferramenta produtiva',
            'Desenvolver projetos criativos com IA',
            'Entender limitações e riscos da IA',
        ],
        requirements: [
            'Saber ler e escrever',
            'Curiosidade e vontade de aprender',
            'Acesso a computador ou tablet',
        ],
        teachers: [
            { name: 'Maria Santos', role: 'Instrutora Principal', avatar: 'MS' },
        ],
        testimonials: [
            {
                quote: 'Aprendi a usar IA de verdade, não só pedir coisas aleatórias. Agora consigo estudar melhor!',
                name: 'Pedro, 12 anos',
            },
            {
                quote: 'Minha filha entende os limites da IA e questiona as respostas. Isso é muito valioso.',
                name: 'Ana, mãe da Sofia',
            },
        ],
        faq: [
            { q: 'Preciso ter conhecimento prévio de programação?', a: 'Não! O curso foi desenhado para iniciantes.' },
            { q: 'As aulas são presenciais ou online?', a: 'Oferecemos ambas as modalidades. Escolha a que prefere.' },
            { q: 'Posso trocar de horário se precisar?', a: 'Sim, com aviso de 24h você pode fazer aula em outro horário disponível.' },
        ],
    },
    kids: {
        id: 'kids',
        name: 'Intelligence Kids',
        subtitle: 'Tecnologia criativa para pequenos gênios',
        tagline: 'Aprendizado lúdico e divertido sobre IA',
        color: 'cyan',
        gradient: { from: 'cyan', to: 'teal' },
        icon: '🌟',
        description: 'Introdução lúdica à inteligência artificial com projetos divertidos e jogos educativos.',
        duration: '4 meses',
        classesPerWeek: '1 aula/semana',
        classDuration: '60 minutos',
        totalClasses: 16,
        price: 380,
        enrollmentFee: 80,
        ages: '6-9 anos',
        maxStudents: 6,
        availableSpots: 2,
        nextStart: '15 de Março 2026',
        schedule: [
            { day: 'Quarta', time: '14:00 - 15:00' },
            { day: 'Sábado', time: '10:00 - 11:00' },
        ],
        modules: [
            { title: 'Módulo 1: Olá, Robô!', lessons: 4, topics: ['O que é um robô?', 'IA vs humanos', 'Conversando com IA', 'Meu primeiro prompt'] },
            { title: 'Módulo 2: Criando com IA', lessons: 4, topics: ['Histórias mágicas', 'Desenhos incríveis', 'Músicas divertidas', 'Jogos'] },
            { title: 'Módulo 3: Detetive Digital', lessons: 4, topics: ['Verdade ou mentira?', 'Pistas digitais', 'Perguntas inteligentes', 'Quiz'] },
            { title: 'Módulo 4: Meu Projeto', lessons: 4, topics: ['Escolhendo tema', 'Criando', 'Mostrando', 'Festa da IA!'] },
        ],
        outcomes: ['Entender o que é IA de forma lúdica', 'Fazer perguntas claras', 'Criar projetos divertidos', 'Pensar criticamente'],
        requirements: ['Saber ler palavras simples', 'Acompanhamento de responsável'],
        teachers: [{ name: 'Ana Ferreira', role: 'Instrutora Kids', avatar: 'AF' }],
        testimonials: [{ quote: 'Meu filho adora a aula de IA! Fica contando tudo em casa.', name: 'Carla, mãe do Lucas' }],
        faq: [{ q: 'Meu filho de 5 anos pode participar?', a: 'Recomendamos a partir de 6 anos. Faça um trial para avaliar!' }],
    },
    teens: {
        id: 'teens',
        name: 'Intelligence Teens',
        subtitle: 'Prepare-se para o futuro digital',
        tagline: 'Habilidades do século XXI com IA',
        color: 'blue',
        gradient: { from: 'blue', to: 'indigo' },
        icon: '💻',
        description: 'Projetos práticos com IA, programação e desenvolvimento de aplicações do mundo real.',
        duration: '6 meses',
        classesPerWeek: '1 aula/semana',
        classDuration: '90 minutos',
        totalClasses: 24,
        price: 480,
        enrollmentFee: 100,
        ages: '13-17 anos',
        maxStudents: 10,
        availableSpots: 5,
        nextStart: '12 de Março 2026',
        schedule: [
            { day: 'Terça', time: '18:00 - 19:30' },
            { day: 'Quinta', time: '18:00 - 19:30' },
        ],
        modules: [
            { title: 'Módulo 1: IA & Sociedade', lessons: 4, topics: ['Impacto da IA', 'Carreiras do futuro', 'Ética tech', 'Fake news'] },
            { title: 'Módulo 2: Prompt Pro', lessons: 4, topics: ['Técnicas avançadas', 'Automações', 'APIs', 'Workflows'] },
            { title: 'Módulo 3: Código & IA', lessons: 4, topics: ['Python básico', 'Integração com IA', 'Chatbots', 'Web apps'] },
            { title: 'Módulo 4: Criação de Conteúdo', lessons: 4, topics: ['Escrita assistida', 'Design com IA', 'Vídeos', 'Portfólio'] },
            { title: 'Módulo 5: Startup', lessons: 4, topics: ['Ideação', 'MVP', 'Pitch', 'Validação'] },
            { title: 'Módulo 6: Demo Day', lessons: 4, topics: ['Polimento', 'Apresentação', 'Feedback', 'Próximos passos'] },
        ],
        outcomes: ['Criar aplicações com IA', 'Programar em Python', 'Desenvolver portfólio', 'Apresentar projetos'],
        requirements: ['Interesse em tecnologia', 'Computador próprio recomendado'],
        teachers: [{ name: 'João Oliveira', role: 'Instrutor Teens', avatar: 'JO' }],
        testimonials: [{ quote: 'Já estou fazendo freelance usando o que aprendi no curso!', name: 'Gabriel, 16 anos' }],
        faq: [{ q: 'Preciso saber programar?', a: 'Não! Ensinamos tudo do zero.' }],
    },
};

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    const course = COURSES_DATA[courseId];

    if (!course) {
        return (
            <Container py={80}>
                <Stack align="center">
                    <Title>Curso não encontrado</Title>
                    <Link href="/">
                        <Button>Voltar para Home</Button>
                    </Link>
                </Stack>
            </Container>
        );
    }

    return (
        <Box>
            {/* Hero Section */}
            <Box
                style={{
                    background: `linear-gradient(135deg, var(--mantine-color-${course.color}-6) 0%, var(--mantine-color-${course.color}-9) 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Container size="xl" py={60}>
                    <Group mb="lg">
                        <Link href="/" passHref legacyBehavior>
                            <Button component="a" variant="subtle" color="white" leftSection={<IconChevronLeft size={16} />}>
                                Voltar
                            </Button>
                        </Link>
                    </Group>

                    <Grid align="center">
                        <Grid.Col span={{ base: 12, md: 7 }}>
                            <Stack gap="lg">
                                <Badge size="lg" variant="white" color={course.color} radius="xl">
                                    {course.icon} {course.ages}
                                </Badge>
                                <Title order={1} c="white" size={48} fw={800}>
                                    {course.name}
                                </Title>
                                <Text size="xl" c="white" style={{ opacity: 0.9 }} lh={1.6}>
                                    {course.tagline}
                                </Text>
                                <Text c="white" style={{ opacity: 0.8 }} lh={1.7}>
                                    {course.description}
                                </Text>

                                <Group mt="md">
                                    <Button
                                        size="xl"
                                        radius="xl"
                                        variant="white"
                                        color={course.color}
                                        leftSection={<IconBrandWhatsapp size={20} />}
                                    >
                                        Matricular Agora
                                    </Button>
                                    <Button
                                        size="xl"
                                        radius="xl"
                                        variant="outline"
                                        color="white"
                                        leftSection={<IconPlayerPlay size={20} />}
                                    >
                                        Aula Experimental
                                    </Button>
                                </Group>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 5 }}>
                            <Card shadow="xl" radius="lg" p="xl" bg="white">
                                <Stack gap="md">
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Mensalidade</Text>
                                        <Badge color="green" variant="light">Vagas abertas</Badge>
                                    </Group>
                                    <Group align="baseline">
                                        <Text size="xl" fw={800} c={course.color}>
                                            R$ {course.price}
                                        </Text>
                                        <Text size="sm" c="dimmed">/mês</Text>
                                    </Group>

                                    <Divider />

                                    <Stack gap="xs">
                                        {[
                                            { icon: IconClock, text: `${course.duration} de duração` },
                                            { icon: IconBook, text: `${course.totalClasses} aulas` },
                                            { icon: IconUsers, text: `Máx. ${course.maxStudents} alunos/turma` },
                                            { icon: IconCalendar, text: `Início: ${course.nextStart}` },
                                        ].map((item, i) => (
                                            <Group key={i} gap="sm">
                                                <ThemeIcon size="sm" variant="light" color={course.color}>
                                                    <item.icon size={14} />
                                                </ThemeIcon>
                                                <Text size="sm">{item.text}</Text>
                                            </Group>
                                        ))}
                                    </Stack>

                                    <Divider />

                                    <div>
                                        <Group justify="space-between" mb="xs">
                                            <Text size="sm">Vagas disponíveis</Text>
                                            <Text size="sm" fw={600}>{course.availableSpots}/{course.maxStudents}</Text>
                                        </Group>
                                        <Progress
                                            value={((course.maxStudents - course.availableSpots) / course.maxStudents) * 100}
                                            color={course.availableSpots <= 2 ? 'red' : course.color}
                                            size="lg"
                                            radius="xl"
                                        />
                                        {course.availableSpots <= 2 && (
                                            <Text size="xs" c="red" mt="xs">Últimas vagas!</Text>
                                        )}
                                    </div>
                                </Stack>
                            </Card>
                        </Grid.Col>
                    </Grid>
                </Container>
            </Box>

            {/* Schedule Section */}
            <Box py={60} bg="gray.0">
                <Container size="xl">
                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group gap="md">
                                <ThemeIcon size={50} radius="md" variant="light" color={course.color}>
                                    <IconCalendar size={24} />
                                </ThemeIcon>
                                <div>
                                    <Text c="dimmed" size="sm">Horários disponíveis</Text>
                                    <Stack gap={4} mt="xs">
                                        {course.schedule.map((s: any, i: number) => (
                                            <Text key={i} size="sm" fw={500}>{s.day}: {s.time}</Text>
                                        ))}
                                    </Stack>
                                </div>
                            </Group>
                        </Card>

                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group gap="md">
                                <ThemeIcon size={50} radius="md" variant="light" color={course.color}>
                                    <IconClock size={24} />
                                </ThemeIcon>
                                <div>
                                    <Text c="dimmed" size="sm">Duração das aulas</Text>
                                    <Text size="lg" fw={600}>{course.classDuration}</Text>
                                    <Text size="sm" c="dimmed">{course.classesPerWeek}</Text>
                                </div>
                            </Group>
                        </Card>

                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group gap="md">
                                <ThemeIcon size={50} radius="md" variant="light" color={course.color}>
                                    <IconCoin size={24} />
                                </ThemeIcon>
                                <div>
                                    <Text c="dimmed" size="sm">Taxa de matrícula</Text>
                                    <Text size="lg" fw={600}>R$ {course.enrollmentFee}</Text>
                                    <Text size="sm" c="dimmed">Pagamento único</Text>
                                </div>
                            </Group>
                        </Card>
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Curriculum Section */}
            <Box py={60}>
                <Container size="xl">
                    <Stack align="center" gap="xl" mb="xl">
                        <Badge size="lg" variant="light" color={course.color}>Conteúdo Programático</Badge>
                        <Title order={2} ta="center">O que você vai aprender</Title>
                    </Stack>

                    <Grid>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Accordion variant="separated" radius="md">
                                {course.modules.map((module: any, i: number) => (
                                    <Accordion.Item key={i} value={`module-${i}`}>
                                        <Accordion.Control>
                                            <Group justify="space-between">
                                                <Group gap="sm">
                                                    <Badge color={course.color} variant="light">{i + 1}</Badge>
                                                    <Text fw={500}>{module.title}</Text>
                                                </Group>
                                                <Badge variant="light">{module.lessons} aulas</Badge>
                                            </Group>
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            <List
                                                spacing="xs"
                                                icon={
                                                    <ThemeIcon size={20} radius="xl" color={course.color} variant="light">
                                                        <IconCheck size={12} />
                                                    </ThemeIcon>
                                                }
                                            >
                                                {module.topics.map((topic: string, j: number) => (
                                                    <List.Item key={j}>{topic}</List.Item>
                                                ))}
                                            </List>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Card shadow="sm" radius="md" p="lg" withBorder>
                                <Stack gap="md">
                                    <Text fw={600}>Ao final do curso você vai:</Text>
                                    <List
                                        spacing="sm"
                                        icon={
                                            <ThemeIcon size={24} radius="xl" color="green">
                                                <IconCheck size={14} />
                                            </ThemeIcon>
                                        }
                                    >
                                        {course.outcomes.map((outcome: string, i: number) => (
                                            <List.Item key={i}>{outcome}</List.Item>
                                        ))}
                                    </List>

                                    <Divider />

                                    <Text fw={600}>Pré-requisitos:</Text>
                                    <List spacing="xs" size="sm" c="dimmed">
                                        {course.requirements.map((req: string, i: number) => (
                                            <List.Item key={i}>{req}</List.Item>
                                        ))}
                                    </List>
                                </Stack>
                            </Card>
                        </Grid.Col>
                    </Grid>
                </Container>
            </Box>

            {/* Testimonials */}
            {course.testimonials?.length > 0 && (
                <Box py={60} bg={`${course.color}.0`}>
                    <Container size="xl">
                        <Stack align="center" gap="xl" mb="xl">
                            <Badge size="lg" variant="light" color={course.color}>Depoimentos</Badge>
                            <Title order={2} ta="center">O que dizem os alunos</Title>
                        </Stack>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                            {course.testimonials.map((t: any, i: number) => (
                                <Card key={i} shadow="sm" radius="lg" p="xl">
                                    <Stack gap="md">
                                        <IconQuote size={24} color={`var(--mantine-color-${course.color}-3)`} />
                                        <Text size="lg" lh={1.7} style={{ fontStyle: 'italic' }}>
                                            "{t.quote}"
                                        </Text>
                                        <Text fw={600}>— {t.name}</Text>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Container>
                </Box>
            )}

            {/* FAQ */}
            {course.faq?.length > 0 && (
                <Box py={60}>
                    <Container size="md">
                        <Stack align="center" gap="xl" mb="xl">
                            <Badge size="lg" variant="light" color={course.color}>Dúvidas</Badge>
                            <Title order={2} ta="center">Perguntas frequentes</Title>
                        </Stack>

                        <Accordion variant="separated" radius="md">
                            {course.faq.map((item: any, i: number) => (
                                <Accordion.Item key={i} value={`faq-${i}`}>
                                    <Accordion.Control>
                                        <Text fw={500}>{item.q}</Text>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Text c="dimmed">{item.a}</Text>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    </Container>
                </Box>
            )}

            {/* CTA */}
            <Box
                py={60}
                style={{
                    background: `linear-gradient(135deg, var(--mantine-color-${course.color}-6) 0%, var(--mantine-color-${course.color}-9) 100%)`,
                }}
            >
                <Container size="md">
                    <Stack align="center" gap="xl" style={{ textAlign: 'center' }}>
                        <Title order={2} c="white">Pronto para começar?</Title>
                        <Text size="lg" c="white" style={{ opacity: 0.9 }}>
                            Vagas limitadas! Garanta sua matrícula agora.
                        </Text>
                        <Group>
                            <Button
                                size="xl"
                                radius="xl"
                                variant="white"
                                color={course.color}
                                leftSection={<IconBrandWhatsapp size={24} />}
                            >
                                Falar no WhatsApp
                            </Button>
                        </Group>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
}
