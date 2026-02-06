'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container, Title, Text, Card, Stack, Group, Button, Badge,
    ThemeIcon, Paper, Divider, Box, TextInput, Select, Switch,
    SimpleGrid, ActionIcon, Modal, Textarea, Alert, Tabs,
    NumberInput, Slider, RingProgress
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconReceipt, IconPlus, IconEdit, IconTrash, IconArrowLeft,
    IconCheck, IconPercentage, IconTarget, IconShieldCheck,
    IconCash, IconUsers, IconTrophy, IconAlertTriangle,
    IconFileText, IconVariable, IconGripVertical, IconCode
} from '@tabler/icons-react';
import { useOrg } from '@/components/OrgContext';

// Commission structure
const DEFAULT_COMMISSIONS = [
    {
        id: '1',
        role: 'sales',
        roleName: 'Comercial',
        type: 'sale',
        typeName: 'Venda Nova',
        value: 10,
        isPercentage: true,
    },
    {
        id: '2',
        role: 'sales',
        roleName: 'Comercial',
        type: 'renewal',
        typeName: 'Rematrícula',
        value: 5,
        isPercentage: true,
    },
    {
        id: '3',
        role: 'teacher',
        roleName: 'Professor',
        type: 'class',
        typeName: 'Por Aula',
        value: 50,
        isPercentage: false,
    },
    {
        id: '4',
        role: 'coordinator',
        roleName: 'Coordenador',
        type: 'team_bonus',
        typeName: 'Bônus Equipe',
        value: 3,
        isPercentage: true,
    },
];

// Goals
const DEFAULT_GOALS = [
    {
        id: '1',
        name: 'Meta Comercial Mensal',
        target: 50000,
        current: 32500,
        bonus: 1000,
        role: 'sales',
    },
    {
        id: '2',
        name: 'Matrículas por Mês',
        target: 20,
        current: 14,
        bonus: 500,
        role: 'sales',
    },
    {
        id: '3',
        name: 'Taxa de Rematrícula',
        target: 85,
        current: 78,
        bonus: 300,
        role: 'coordinator',
    },
];

// Policies
const DEFAULT_POLICIES = [
    {
        id: '1',
        name: 'Política de Cancelamento',
        description: 'Cancelamento com 30 dias de antecedência. Multa de 10% sobre valor restante.',
        type: 'cancellation',
        active: true,
    },
    {
        id: '2',
        name: 'Política de Reembolso',
        description: 'Reembolso integral até 7 dias após matrícula. Após, proporcional ao período.',
        type: 'refund',
        active: true,
    },
    {
        id: '3',
        name: 'Política de Inadimplência',
        description: 'Tolerância de 10 dias. Após 30 dias, suspensão. Após 60 dias, cancelamento.',
        type: 'default',
        active: true,
    },
    {
        id: '4',
        name: 'Política de Transferência',
        description: 'Transferência de turma gratuita. Transferência de curso com taxa de R$ 50.',
        type: 'transfer',
        active: true,
    },
];

export default function RulesSetupPage() {
    const org = useOrg();
    const router = useRouter();
    const primaryColor = org.primaryColor || '#7048e8';

    const [commissions, setCommissions] = useState(DEFAULT_COMMISSIONS);
    const [goals, setGoals] = useState(DEFAULT_GOALS);
    const [policies, setPolicies] = useState(DEFAULT_POLICIES);
    const [activeTab, setActiveTab] = useState<string | null>('commissions');
    const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const togglePolicy = (policyId: string) => {
        setPolicies(prev => prev.map(p =>
            p.id === policyId ? { ...p, active: !p.active } : p
        ));
    };

    // Clause templates for contract builder
    const [clauseTemplates] = useState([
        {
            id: 'objeto',
            type: 'OBJETO',
            name: 'Objeto do Contrato',
            content: 'O presente contrato tem por objeto a prestação de serviços educacionais de {{NOME_CURSO}}, com carga horária de {{CARGA_HORARIA}} horas, conforme grade curricular em anexo.',
            variables: ['NOME_CURSO', 'CARGA_HORARIA'],
            required: true,
        },
        {
            id: 'preco',
            type: 'PRECO_PAGAMENTO',
            name: 'Preço e Pagamento',
            content: 'O valor total do curso é de {{VALOR_TOTAL}}, a ser pago em {{PARCELAS}} parcelas de {{VALOR_PARCELA}}, com vencimento todo dia {{DIA_VENCIMENTO}} de cada mês.',
            variables: ['VALOR_TOTAL', 'PARCELAS', 'VALOR_PARCELA', 'DIA_VENCIMENTO'],
            required: true,
        },
        {
            id: 'prazo',
            type: 'PRAZO_VIGENCIA',
            name: 'Prazo e Vigência',
            content: 'O presente contrato terá vigência de {{DURACAO_MESES}} meses, com início em {{DATA_INICIO}} e término em {{DATA_FIM}}.',
            variables: ['DURACAO_MESES', 'DATA_INICIO', 'DATA_FIM'],
            required: true,
        },
        {
            id: 'rescisao',
            type: 'RESCISAO',
            name: 'Rescisão e Cancelamento',
            content: 'A rescisão do contrato deverá ser comunicada com {{DIAS_ANTECEDENCIA}} dias de antecedência. Em caso de rescisão antecipada, será cobrada multa de {{PERCENTUAL_MULTA}}% sobre o valor restante.',
            variables: ['DIAS_ANTECEDENCIA', 'PERCENTUAL_MULTA'],
            required: true,
        },
        {
            id: 'reajuste',
            type: 'REAJUSTE',
            name: 'Reajuste Anual',
            content: 'O valor das mensalidades será reajustado anualmente pelo índice {{INDICE_REAJUSTE}}, ou outro índice que venha a substituí-lo.',
            variables: ['INDICE_REAJUSTE'],
            required: false,
        },
        {
            id: 'inadimplencia',
            type: 'MULTA',
            name: 'Inadimplência',
            content: 'Em caso de atraso no pagamento, incidirá multa de {{MULTA_ATRASO}}% e juros de {{JUROS_ATRASO}}% ao mês, calculados pro rata die.',
            variables: ['MULTA_ATRASO', 'JUROS_ATRASO'],
            required: false,
        },
        {
            id: 'responsabilidade',
            type: 'RESPONSABILIDADE',
            name: 'Responsabilidades do Contratante',
            content: 'O CONTRATANTE se compromete a: zelar pelo material didático; respeitar as normas da instituição; manter seus dados cadastrais atualizados.',
            variables: [],
            required: false,
        },
        {
            id: 'lgpd',
            type: 'LGPD',
            name: 'Proteção de Dados (LGPD)',
            content: 'A CONTRATADA tratará os dados pessoais do CONTRATANTE e do ALUNO em conformidade com a Lei 13.709/2018 (LGPD), conforme Política de Privacidade disponível em {{URL_POLITICA}}.',
            variables: ['URL_POLITICA'],
            required: true,
        },
        {
            id: 'foro',
            type: 'FORO',
            name: 'Foro',
            content: 'Fica eleito o foro da Comarca de {{CIDADE_FORO}}/{{UF_FORO}} para dirimir quaisquer dúvidas oriundas do presente contrato.',
            variables: ['CIDADE_FORO', 'UF_FORO'],
            required: true,
        },
    ]);

    // Selected clauses for the contract
    const [selectedClauses, setSelectedClauses] = useState<string[]>(['objeto', 'preco', 'prazo', 'rescisao', 'lgpd', 'foro']);

    // Contract variables with default values
    const [contractVariables] = useState([
        { name: 'NOME_CURSO', label: 'Nome do Curso', type: 'string', defaultValue: '{{curso.nome}}' },
        { name: 'CARGA_HORARIA', label: 'Carga Horária', type: 'number', defaultValue: '{{curso.cargaHoraria}}' },
        { name: 'VALOR_TOTAL', label: 'Valor Total', type: 'currency', defaultValue: '{{matricula.valorTotal}}' },
        { name: 'PARCELAS', label: 'Número de Parcelas', type: 'number', defaultValue: '{{matricula.parcelas}}' },
        { name: 'VALOR_PARCELA', label: 'Valor da Parcela', type: 'currency', defaultValue: '{{matricula.valorParcela}}' },
        { name: 'DIA_VENCIMENTO', label: 'Dia de Vencimento', type: 'number', defaultValue: '10' },
        { name: 'DURACAO_MESES', label: 'Duração (meses)', type: 'number', defaultValue: '{{curso.duracaoMeses}}' },
        { name: 'DATA_INICIO', label: 'Data de Início', type: 'date', defaultValue: '{{matricula.dataInicio}}' },
        { name: 'DATA_FIM', label: 'Data de Término', type: 'date', defaultValue: '{{matricula.dataFim}}' },
        { name: 'DIAS_ANTECEDENCIA', label: 'Dias de Antecedência', type: 'number', defaultValue: '30' },
        { name: 'PERCENTUAL_MULTA', label: 'Multa Rescisão (%)', type: 'number', defaultValue: '10' },
        { name: 'INDICE_REAJUSTE', label: 'Índice de Reajuste', type: 'string', defaultValue: 'IPCA' },
        { name: 'MULTA_ATRASO', label: 'Multa Atraso (%)', type: 'number', defaultValue: '2' },
        { name: 'JUROS_ATRASO', label: 'Juros Atraso (%)', type: 'number', defaultValue: '1' },
        { name: 'URL_POLITICA', label: 'URL Política Privacidade', type: 'string', defaultValue: '{{org.url}}/privacidade' },
        { name: 'CIDADE_FORO', label: 'Cidade do Foro', type: 'string', defaultValue: '{{org.cidade}}' },
        { name: 'UF_FORO', label: 'UF do Foro', type: 'string', defaultValue: '{{org.uf}}' },
    ]);

    const toggleClause = (clauseId: string) => {
        const clause = clauseTemplates.find(c => c.id === clauseId);
        if (clause?.required) return; // Can't remove required clauses

        setSelectedClauses(prev =>
            prev.includes(clauseId)
                ? prev.filter(id => id !== clauseId)
                : [...prev, clauseId]
        );
    };

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
                                <Text c="gray.5" size="xs">Configuração da Escola</Text>
                                <Title order={2} c="white" size="lg">
                                    Regras de Negócio
                                </Title>
                            </div>
                        </Group>
                        <Badge size="lg" color="orange">
                            {commissions.length} regras de comissão
                        </Badge>
                    </Group>

                    {/* Tabs */}
                    <Tabs value={activeTab} onChange={setActiveTab} color="orange">
                        <Tabs.List>
                            <Tabs.Tab value="commissions" leftSection={<IconPercentage size={16} />}>
                                Comissões
                            </Tabs.Tab>
                            <Tabs.Tab value="goals" leftSection={<IconTarget size={16} />}>
                                Metas & Bônus
                            </Tabs.Tab>
                            <Tabs.Tab value="policies" leftSection={<IconShieldCheck size={16} />}>
                                Políticas
                            </Tabs.Tab>
                            <Tabs.Tab value="contracts" leftSection={<IconFileText size={16} />}>
                                Contratos
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* Commissions Panel */}
                        <Tabs.Panel value="commissions" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Configure a estrutura de comissões por cargo e tipo de ação.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                        onClick={openModal}
                                    >
                                        Nova Comissão
                                    </Button>
                                </Group>

                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                    {commissions.map((commission) => (
                                        <Card key={commission.id} bg="dark.7" radius="md" p="md">
                                            <Stack gap="sm">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <ThemeIcon
                                                            size={36}
                                                            radius="md"
                                                            color="orange"
                                                            variant="light"
                                                        >
                                                            {commission.isPercentage ? (
                                                                <IconPercentage size={18} />
                                                            ) : (
                                                                <IconCash size={18} />
                                                            )}
                                                        </ThemeIcon>
                                                        <div>
                                                            <Text c="white" fw={600} size="sm">
                                                                {commission.typeName}
                                                            </Text>
                                                            <Text c="gray.5" size="xs">
                                                                {commission.roleName}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                    <Text c="green.4" fw={700} size="lg">
                                                        {commission.isPercentage
                                                            ? `${commission.value}%`
                                                            : formatCurrency(commission.value)
                                                        }
                                                    </Text>
                                                </Group>

                                                <Group gap="xs">
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        leftSection={<IconEdit size={14} />}
                                                        flex={1}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <ActionIcon
                                                        size="md"
                                                        variant="light"
                                                        color="red"
                                                    >
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            </Stack>
                                        </Card>
                                    ))}
                                </SimpleGrid>

                                <Alert variant="light" color="orange">
                                    <Text size="sm">
                                        As comissões são calculadas automaticamente e aparecem no relatório
                                        financeiro de cada colaborador.
                                    </Text>
                                </Alert>
                            </Stack>
                        </Tabs.Panel>

                        {/* Goals Panel */}
                        <Tabs.Panel value="goals" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Defina metas e bonificações para sua equipe.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                    >
                                        Nova Meta
                                    </Button>
                                </Group>

                                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                                    {goals.map((goal) => {
                                        const progress = Math.round((goal.current / goal.target) * 100);
                                        const achieved = progress >= 100;

                                        return (
                                            <Card key={goal.id} bg="dark.7" radius="md" p="md">
                                                <Stack gap="md" align="center">
                                                    <RingProgress
                                                        size={100}
                                                        thickness={8}
                                                        roundCaps
                                                        sections={[
                                                            {
                                                                value: Math.min(progress, 100),
                                                                color: achieved ? 'green' : progress > 70 ? 'yellow' : 'orange'
                                                            }
                                                        ]}
                                                        label={
                                                            <Text c="white" fw={700} ta="center" size="lg">
                                                                {progress}%
                                                            </Text>
                                                        }
                                                    />

                                                    <Stack gap={4} align="center">
                                                        <Text c="white" fw={600} size="sm" ta="center">
                                                            {goal.name}
                                                        </Text>
                                                        <Text c="gray.5" size="xs">
                                                            {typeof goal.target === 'number' && goal.target > 1000
                                                                ? `${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}`
                                                                : `${goal.current} / ${goal.target}`
                                                            }
                                                        </Text>
                                                        <Badge
                                                            size="sm"
                                                            color={achieved ? 'green' : 'gray'}
                                                            leftSection={<IconTrophy size={12} />}
                                                        >
                                                            Bônus: {formatCurrency(goal.bonus)}
                                                        </Badge>
                                                    </Stack>
                                                </Stack>
                                            </Card>
                                        );
                                    })}
                                </SimpleGrid>
                            </Stack>
                        </Tabs.Panel>

                        {/* Policies Panel */}
                        <Tabs.Panel value="policies" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Configure as políticas comerciais e operacionais.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                    >
                                        Nova Política
                                    </Button>
                                </Group>

                                <Stack gap="sm">
                                    {policies.map((policy) => (
                                        <Card key={policy.id} bg="dark.7" radius="md" p="md">
                                            <Group justify="space-between">
                                                <Group gap="md">
                                                    <ThemeIcon
                                                        size={40}
                                                        radius="md"
                                                        color={policy.active ? 'green' : 'gray'}
                                                        variant="light"
                                                    >
                                                        {policy.type === 'cancellation' && <IconAlertTriangle size={20} />}
                                                        {policy.type === 'refund' && <IconCash size={20} />}
                                                        {policy.type === 'default' && <IconReceipt size={20} />}
                                                        {policy.type === 'transfer' && <IconUsers size={20} />}
                                                    </ThemeIcon>
                                                    <div>
                                                        <Group gap="xs">
                                                            <Text c="white" fw={600} size="sm">
                                                                {policy.name}
                                                            </Text>
                                                            <Badge
                                                                size="xs"
                                                                color={policy.active ? 'green' : 'gray'}
                                                            >
                                                                {policy.active ? 'Ativa' : 'Inativa'}
                                                            </Badge>
                                                        </Group>
                                                        <Text c="gray.5" size="xs" maw={500}>
                                                            {policy.description}
                                                        </Text>
                                                    </div>
                                                </Group>
                                                <Group gap="sm">
                                                    <Switch
                                                        checked={policy.active}
                                                        onChange={() => togglePolicy(policy.id)}
                                                    />
                                                    <ActionIcon variant="subtle">
                                                        <IconEdit size={16} />
                                                    </ActionIcon>
                                                </Group>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>

                                <Alert variant="light" color="blue" icon={<IconShieldCheck size={20} />}>
                                    <Text size="sm">
                                        As políticas são exibidas automaticamente no contrato de matrícula
                                        e no portal do aluno.
                                    </Text>
                                </Alert>
                            </Stack>
                        </Tabs.Panel>

                        {/* Contracts Panel */}
                        <Tabs.Panel value="contracts" pt="lg">
                            <Stack gap="md">
                                <Alert variant="light" color="orange" icon={<IconFileText size={20} />}>
                                    <Text size="sm">
                                        Monte o contrato de matrícula da escola selecionando as cláusulas e
                                        configurando as variáveis. Use <code style={{ color: 'var(--mantine-color-yellow-5)' }}>{`{{variavel}}`}</code> para dados dinâmicos.
                                    </Text>
                                </Alert>

                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                    {/* Clause Picker */}
                                    <Card bg="dark.7" radius="md" p="md">
                                        <Stack gap="md">
                                            <Group justify="space-between">
                                                <Text c="white" fw={600} size="sm">
                                                    Cláusulas Disponíveis
                                                </Text>
                                                <Badge color="orange">
                                                    {selectedClauses.length}/{clauseTemplates.length}
                                                </Badge>
                                            </Group>

                                            <Stack gap="xs">
                                                {clauseTemplates.map((clause) => {
                                                    const isSelected = selectedClauses.includes(clause.id);
                                                    return (
                                                        <Paper
                                                            key={clause.id}
                                                            p="sm"
                                                            radius="sm"
                                                            bg={isSelected ? 'dark.5' : 'dark.8'}
                                                            style={{
                                                                cursor: clause.required ? 'not-allowed' : 'pointer',
                                                                border: isSelected
                                                                    ? '1px solid var(--mantine-color-orange-6)'
                                                                    : '1px solid var(--mantine-color-dark-5)',
                                                                opacity: clause.required ? 0.7 : 1,
                                                            }}
                                                            onClick={() => toggleClause(clause.id)}
                                                        >
                                                            <Group justify="space-between">
                                                                <Group gap="sm">
                                                                    <IconGripVertical size={14} color="gray" />
                                                                    <div>
                                                                        <Group gap="xs">
                                                                            <Text c="white" size="sm" fw={500}>
                                                                                {clause.name}
                                                                            </Text>
                                                                            {clause.required && (
                                                                                <Badge size="xs" color="red">
                                                                                    Obrigatória
                                                                                </Badge>
                                                                            )}
                                                                        </Group>
                                                                        <Text c="gray.5" size="xs">
                                                                            {clause.variables.length} variáveis
                                                                        </Text>
                                                                    </div>
                                                                </Group>
                                                                <Switch
                                                                    checked={isSelected}
                                                                    disabled={clause.required}
                                                                    onChange={() => { }}
                                                                    size="sm"
                                                                />
                                                            </Group>
                                                        </Paper>
                                                    );
                                                })}
                                            </Stack>
                                        </Stack>
                                    </Card>

                                    {/* Variables Configuration */}
                                    <Card bg="dark.7" radius="md" p="md">
                                        <Stack gap="md">
                                            <Group justify="space-between">
                                                <Group gap="xs">
                                                    <IconVariable size={16} color="var(--mantine-color-yellow-5)" />
                                                    <Text c="white" fw={600} size="sm">
                                                        Variáveis do Contrato
                                                    </Text>
                                                </Group>
                                                <Badge color="green" variant="light">
                                                    Dinâmicas
                                                </Badge>
                                            </Group>

                                            <Stack gap="xs" mah={400} style={{ overflow: 'auto' }}>
                                                {contractVariables.map((variable) => (
                                                    <Paper
                                                        key={variable.name}
                                                        p="xs"
                                                        radius="sm"
                                                        bg="dark.8"
                                                    >
                                                        <Group justify="space-between">
                                                            <Group gap="xs">
                                                                <IconCode size={12} color="var(--mantine-color-yellow-5)" />
                                                                <Text c="white" size="xs" ff="monospace">
                                                                    {`{{${variable.name}}}`}
                                                                </Text>
                                                            </Group>
                                                            <Group gap="xs">
                                                                <Text c="gray.5" size="xs">
                                                                    {variable.label}
                                                                </Text>
                                                                <Badge size="xs" variant="light" color="gray">
                                                                    {variable.type}
                                                                </Badge>
                                                            </Group>
                                                        </Group>
                                                        <Text c="gray.6" size="xs" mt={4} ff="monospace">
                                                            → {variable.defaultValue}
                                                        </Text>
                                                    </Paper>
                                                ))}
                                            </Stack>

                                            <Alert variant="light" color="blue" p="xs">
                                                <Text size="xs">
                                                    Variáveis entre <code>{`{{...}}`}</code> são preenchidas
                                                    automaticamente com dados do aluno, curso e matrícula.
                                                </Text>
                                            </Alert>
                                        </Stack>
                                    </Card>
                                </SimpleGrid>

                                {/* Preview */}
                                <Card bg="dark.7" radius="md" p="md">
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Text c="white" fw={600} size="sm">
                                                Preview do Contrato
                                            </Text>
                                            <Badge color="violet" variant="light">
                                                {selectedClauses.length} cláusulas
                                            </Badge>
                                        </Group>

                                        <Paper p="md" radius="sm" bg="dark.9" style={{ maxHeight: 300, overflow: 'auto' }}>
                                            <Stack gap="md">
                                                {clauseTemplates
                                                    .filter(c => selectedClauses.includes(c.id))
                                                    .map((clause, idx) => (
                                                        <div key={clause.id}>
                                                            <Text c="white" fw={600} size="sm">
                                                                Cláusula {idx + 1}ª - {clause.name.toUpperCase()}
                                                            </Text>
                                                            <Text c="gray.4" size="sm" mt={4}>
                                                                {clause.content.split(/\{\{|\}\}/).map((part, i) =>
                                                                    i % 2 === 1 ? (
                                                                        <span
                                                                            key={i}
                                                                            style={{
                                                                                background: 'var(--mantine-color-yellow-9)',
                                                                                color: 'var(--mantine-color-yellow-3)',
                                                                                padding: '1px 4px',
                                                                                borderRadius: 3,
                                                                                fontFamily: 'monospace',
                                                                                fontSize: '0.85em',
                                                                            }}
                                                                        >
                                                                            {`{{${part}}}`}
                                                                        </span>
                                                                    ) : (
                                                                        part
                                                                    )
                                                                )}
                                                            </Text>
                                                        </div>
                                                    ))}
                                            </Stack>
                                        </Paper>
                                    </Stack>
                                </Card>
                            </Stack>
                        </Tabs.Panel>
                    </Tabs>

                    <Button
                        variant="light"
                        color="green"
                        rightSection={<IconCheck size={16} />}
                        onClick={() => router.push(`/${org.slug}/admin/setup`)}
                    >
                        Salvar e Continuar
                    </Button>
                </Stack>
            </Container>

            {/* New Commission Modal */}
            <Modal
                opened={isModalOpen}
                onClose={closeModal}
                title="Nova Comissão"
                size="md"
            >
                <Stack gap="md">
                    <Select
                        label="Cargo"
                        data={[
                            { value: 'sales', label: 'Comercial' },
                            { value: 'teacher', label: 'Professor' },
                            { value: 'coordinator', label: 'Coordenador' },
                        ]}
                        placeholder="Selecione o cargo"
                    />

                    <Select
                        label="Tipo de Ação"
                        data={[
                            { value: 'sale', label: 'Venda Nova' },
                            { value: 'renewal', label: 'Rematrícula' },
                            { value: 'class', label: 'Por Aula' },
                            { value: 'team_bonus', label: 'Bônus de Equipe' },
                        ]}
                        placeholder="Selecione o tipo"
                    />

                    <Group grow>
                        <NumberInput
                            label="Valor"
                            placeholder="10"
                            min={0}
                            max={100}
                        />
                        <Select
                            label="Tipo de Valor"
                            data={[
                                { value: 'percentage', label: 'Porcentagem (%)' },
                                { value: 'fixed', label: 'Valor Fixo (R$)' },
                            ]}
                            defaultValue="percentage"
                        />
                    </Group>

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeModal}>
                            Cancelar
                        </Button>
                        <Button onClick={closeModal}>
                            Criar Comissão
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
}
