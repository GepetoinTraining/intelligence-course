'use client';

import { useState } from 'react';
import {
    Title, Text, Card, Stack, Group, Button, Badge,
    ThemeIcon, Paper, SimpleGrid, Switch, Alert, Tabs,
    ActionIcon, Loader, Center,
} from '@mantine/core';
import {
    IconFileText, IconPlus, IconVariable, IconGripVertical,
    IconCode, IconEye, IconEdit, IconTrash,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// Default clause templates for new contract setup
// ============================================================================
const DEFAULT_CLAUSES = [
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
];

const CONTRACT_VARIABLES = [
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
];

// ============================================================================
// PAGE
// ============================================================================
export default function ContractBuilderPage() {
    const { data: savedTemplates, isLoading } = useApi<any>('/api/contract-templates');
    const [activeTab, setActiveTab] = useState<string | null>('builder');
    const [selectedClauses, setSelectedClauses] = useState<string[]>(
        ['objeto', 'preco', 'prazo', 'rescisao', 'lgpd', 'foro']
    );

    const toggleClause = (clauseId: string) => {
        const clause = DEFAULT_CLAUSES.find(c => c.id === clauseId);
        if (clause?.required) return;
        setSelectedClauses(prev =>
            prev.includes(clauseId)
                ? prev.filter(id => id !== clauseId)
                : [...prev, clauseId]
        );
    };

    const templates = savedTemplates?.data || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Construtor de Contratos</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                        Monte modelos de contrato com cláusulas e variáveis dinâmicas
                    </Text>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Modelo
                </Button>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="builder" leftSection={<IconFileText size={14} />}>
                        Construtor
                    </Tabs.Tab>
                    <Tabs.Tab value="templates" leftSection={<IconEye size={14} />}>
                        Modelos Salvos {templates.length > 0 && <Badge size="xs" ml={4}>{templates.length}</Badge>}
                    </Tabs.Tab>
                    <Tabs.Tab value="variables" leftSection={<IconVariable size={14} />}>
                        Variáveis
                    </Tabs.Tab>
                </Tabs.List>

                {/* Builder Tab */}
                <Tabs.Panel value="builder" pt="lg">
                    <Stack gap="md">
                        <Alert variant="light" color="orange" icon={<IconFileText size={20} />}>
                            <Text size="sm">
                                Monte o contrato de matrícula selecionando as cláusulas e configurando
                                as variáveis. Use <code style={{ color: 'var(--mantine-color-yellow-5)' }}>{`{{variavel}}`}</code> para dados dinâmicos.
                            </Text>
                        </Alert>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            {/* Clause Picker */}
                            <Card withBorder p="md">
                                <Stack gap="md">
                                    <Group justify="space-between">
                                        <Text fw={600} size="sm">
                                            Cláusulas Disponíveis
                                        </Text>
                                        <Badge color="orange">
                                            {selectedClauses.length}/{DEFAULT_CLAUSES.length}
                                        </Badge>
                                    </Group>

                                    <Stack gap="xs">
                                        {DEFAULT_CLAUSES.map((clause) => {
                                            const isSelected = selectedClauses.includes(clause.id);
                                            return (
                                                <Paper
                                                    key={clause.id}
                                                    p="sm"
                                                    radius="sm"
                                                    withBorder
                                                    style={{
                                                        cursor: clause.required ? 'not-allowed' : 'pointer',
                                                        borderColor: isSelected
                                                            ? 'var(--mantine-color-orange-6)'
                                                            : undefined,
                                                        opacity: clause.required ? 0.8 : 1,
                                                    }}
                                                    onClick={() => toggleClause(clause.id)}
                                                >
                                                    <Group justify="space-between">
                                                        <Group gap="sm">
                                                            <IconGripVertical size={14} color="gray" />
                                                            <div>
                                                                <Group gap="xs">
                                                                    <Text size="sm" fw={500}>
                                                                        {clause.name}
                                                                    </Text>
                                                                    {clause.required && (
                                                                        <Badge size="xs" color="red">
                                                                            Obrigatória
                                                                        </Badge>
                                                                    )}
                                                                </Group>
                                                                <Text size="xs" c="dimmed">
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
                            <Card withBorder p="md">
                                <Stack gap="md">
                                    <Group justify="space-between">
                                        <Group gap="xs">
                                            <IconVariable size={16} color="var(--mantine-color-yellow-5)" />
                                            <Text fw={600} size="sm">
                                                Variáveis do Contrato
                                            </Text>
                                        </Group>
                                        <Badge color="green" variant="light">
                                            Dinâmicas
                                        </Badge>
                                    </Group>

                                    <Stack gap="xs" mah={400} style={{ overflow: 'auto' }}>
                                        {CONTRACT_VARIABLES.map((variable) => (
                                            <Paper
                                                key={variable.name}
                                                p="xs"
                                                radius="sm"
                                                withBorder
                                            >
                                                <Group justify="space-between">
                                                    <Group gap="xs">
                                                        <IconCode size={12} color="var(--mantine-color-yellow-5)" />
                                                        <Text size="xs" ff="monospace">
                                                            {`{{${variable.name}}}`}
                                                        </Text>
                                                    </Group>
                                                    <Group gap="xs">
                                                        <Text c="dimmed" size="xs">
                                                            {variable.label}
                                                        </Text>
                                                        <Badge size="xs" variant="light" color="gray">
                                                            {variable.type}
                                                        </Badge>
                                                    </Group>
                                                </Group>
                                                <Text c="dimmed" size="xs" mt={4} ff="monospace">
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
                        <Card withBorder p="md">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text fw={600} size="sm">
                                        Preview do Contrato
                                    </Text>
                                    <Badge color="violet" variant="light">
                                        {selectedClauses.length} cláusulas
                                    </Badge>
                                </Group>

                                <Paper p="md" radius="sm" bg="gray.0" style={{ maxHeight: 300, overflow: 'auto' }}>
                                    <Stack gap="md">
                                        {DEFAULT_CLAUSES
                                            .filter(c => selectedClauses.includes(c.id))
                                            .map((clause, idx) => (
                                                <div key={clause.id}>
                                                    <Text fw={600} size="sm">
                                                        Cláusula {idx + 1}ª - {clause.name.toUpperCase()}
                                                    </Text>
                                                    <Text size="sm" mt={4} c="dimmed">
                                                        {clause.content.split(/\{\{|\}\}/).map((part, i) =>
                                                            i % 2 === 1 ? (
                                                                <span
                                                                    key={i}
                                                                    style={{
                                                                        background: 'var(--mantine-color-yellow-1)',
                                                                        color: 'var(--mantine-color-yellow-9)',
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

                {/* Saved Templates Tab */}
                <Tabs.Panel value="templates" pt="lg">
                    {isLoading ? (
                        <Center h={200}><Loader size="lg" /></Center>
                    ) : templates.length > 0 ? (
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            {templates.map((t: any) => (
                                <Card key={t.id} withBorder p="md">
                                    <Group justify="space-between" mb="sm">
                                        <Group gap="sm">
                                            <ThemeIcon color="violet" size="lg" radius="md">
                                                <IconFileText size={20} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={600}>{t.name}</Text>
                                                <Text size="xs" c="dimmed">{t.contractType}</Text>
                                            </div>
                                        </Group>
                                        <Badge color={t.isActive ? 'green' : 'gray'}>
                                            {t.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </Group>
                                    {t.description && (
                                        <Text size="sm" c="dimmed" mb="sm">{t.description}</Text>
                                    )}
                                    <Group gap="xs">
                                        <Badge size="sm" variant="light">v{t.version || 1}</Badge>
                                        <Badge size="sm" variant="light" color="gray">
                                            {t.useCount || 0} usos
                                        </Badge>
                                    </Group>
                                    <Group mt="md" gap="xs">
                                        <Button size="xs" variant="light" leftSection={<IconEdit size={14} />} flex={1}>
                                            Editar
                                        </Button>
                                        <ActionIcon variant="light" color="red" size="md">
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Card>
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Center py="xl">
                            <Stack align="center" gap="xs">
                                <IconFileText size={48} color="gray" />
                                <Text c="dimmed">Nenhum modelo salvo</Text>
                                <Text size="xs" c="dimmed">
                                    Use o Construtor para criar seu primeiro modelo de contrato
                                </Text>
                            </Stack>
                        </Center>
                    )}
                </Tabs.Panel>

                {/* Variables Reference Tab */}
                <Tabs.Panel value="variables" pt="lg">
                    <Stack gap="md">
                        <Alert variant="light" color="blue" icon={<IconVariable size={20} />}>
                            <Text size="sm">
                                Estas são todas as variáveis disponíveis para uso em templates de contrato.
                                Elas são preenchidas automaticamente durante a geração do contrato.
                            </Text>
                        </Alert>

                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                            {CONTRACT_VARIABLES.map((v) => (
                                <Card key={v.name} withBorder p="sm">
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm" ff="monospace" fw={600} c="orange">
                                            {`{{${v.name}}}`}
                                        </Text>
                                        <Badge size="xs" variant="light">{v.type}</Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed">{v.label}</Text>
                                    <Text size="xs" ff="monospace" c="dimmed" mt={2}>
                                        Padrão: {v.defaultValue}
                                    </Text>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
