'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    TextInput,
    Accordion,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconQuestionMark,
    IconPlus,
    IconSearch,
    IconBook,
    IconHelpCircle,
    IconChevronRight,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// Demo FAQ data
const faqCategories = [
    {
        category: 'Matrículas',
        questions: [
            { q: 'Como realizar uma matrícula?', a: 'Acesse Operacional > Matrículas > Nova Matrícula e preencha os dados do aluno...' },
            { q: 'Como transferir um aluno de turma?', a: 'Em Operacional > Transferências, selecione o aluno e a nova turma desejada...' },
            { q: 'Qual o prazo para cancelamento?', a: 'O cancelamento pode ser solicitado com 30 dias de antecedência...' },
        ]
    },
    {
        category: 'Financeiro',
        questions: [
            { q: 'Como gerar boletos?', a: 'Acesse Financeiro > Faturamento > Gerar Boletos em lote ou individual...' },
            { q: 'Como dar desconto em uma mensalidade?', a: 'Na ficha do aluno, vá em Condições Comerciais > Desconto...' },
            { q: 'Como emitir nota fiscal?', a: 'Em Contábil > NFS-e, clique em Emitir NFS-e e selecione o recebimento...' },
        ]
    },
    {
        category: 'Pedagógico',
        questions: [
            { q: 'Como lançar notas?', a: 'Acesse Pedagógico > Notas > Lançar Notas e selecione a turma...' },
            { q: 'Como registrar presença?', a: 'Em Pedagógico > Presença, selecione a data e marque os alunos presentes...' },
            { q: 'Como acessar o material didático?', a: 'Os materiais estão disponíveis em Conhecimento > Wiki por curso...' },
        ]
    },
];

export default function FAQPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/wiki/articles?category=faq');

    const totalQuestions = faqCategories.reduce((sum, cat) => sum + cat.questions.length, 0);


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Conhecimento</Text>
                    <Title order={2}>Perguntas Frequentes (FAQ)</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Pergunta
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconHelpCircle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Perguntas</Text>
                            <Text fw={700} size="lg">{totalQuestions}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Categorias</Text>
                            <Text fw={700} size="lg">{faqCategories.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconQuestionMark size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Acessos (Mês)</Text>
                            <Text fw={700} size="lg">1,234</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Search */}
            <TextInput
                placeholder="Buscar nas perguntas frequentes..."
                leftSection={<IconSearch size={16} />}
                size="md"
            />

            {/* FAQ Accordion */}
            {faqCategories.map((cat) => (
                <Card key={cat.category} withBorder p="md">
                    <Text fw={600} mb="md">{cat.category}</Text>
                    <Accordion variant="separated">
                        {cat.questions.map((faq, i) => (
                            <Accordion.Item key={i} value={faq.q}>
                                <Accordion.Control>
                                    <Group gap="xs">
                                        <IconChevronRight size={14} />
                                        <Text size="sm">{faq.q}</Text>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Text size="sm" c="dimmed">{faq.a}</Text>
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </Card>
            ))}
        </Stack>
    );
}

