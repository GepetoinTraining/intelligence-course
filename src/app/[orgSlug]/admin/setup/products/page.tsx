'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container, Title, Text, Card, Stack, Group, Button, Badge,
    ThemeIcon, Paper, Divider, Box, TextInput, Select, Switch,
    SimpleGrid, ActionIcon, Modal, Textarea, Alert, Tabs,
    NumberInput, Table, Checkbox
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPackage, IconPlus, IconEdit, IconTrash, IconArrowLeft,
    IconCheck, IconCurrencyReal, IconPercentage, IconCalendar,
    IconCreditCard, IconReceipt, IconTag
} from '@tabler/icons-react';
import { useOrg } from '@/components/OrgContext';

// Sample courses
const DEFAULT_COURSES = [
    {
        id: '1',
        name: 'Curso de Robótica',
        duration: '6 meses',
        workload: 48,
        category: 'technology',
        status: 'active',
    },
    {
        id: '2',
        name: 'Inglês Básico',
        duration: '12 meses',
        workload: 96,
        category: 'languages',
        status: 'active',
    },
    {
        id: '3',
        name: 'Reforço Escolar',
        duration: 'Mensal',
        workload: 8,
        category: 'tutoring',
        status: 'active',
    },
];

// Sample pricing
const DEFAULT_PRICING = [
    {
        id: '1',
        courseId: '1',
        courseName: 'Curso de Robótica',
        type: 'monthly',
        value: 299.90,
        installments: 6,
        discount: 0,
    },
    {
        id: '2',
        courseId: '1',
        courseName: 'Curso de Robótica',
        type: 'full',
        value: 1499.50,
        installments: 1,
        discount: 15,
    },
    {
        id: '3',
        courseId: '2',
        courseName: 'Inglês Básico',
        type: 'monthly',
        value: 249.90,
        installments: 12,
        discount: 0,
    },
];

// Payment methods
const PAYMENT_METHODS = [
    { id: 'pix', label: 'PIX', icon: '🔒', enabled: true, discount: 5 },
    { id: 'credit', label: 'Cartão de Crédito', icon: '💳', enabled: true, discount: 0 },
    { id: 'boleto', label: 'Boleto', icon: '📄', enabled: true, discount: 0 },
    { id: 'debit', label: 'Débito Recorrente', icon: '🔄', enabled: false, discount: 3 },
];

export default function ProductsSetupPage() {
    const org = useOrg();
    const router = useRouter();
    const primaryColor = org.primaryColor || '#7048e8';

    const [courses, setCourses] = useState(DEFAULT_COURSES);
    const [pricing, setPricing] = useState(DEFAULT_PRICING);
    const [paymentMethods, setPaymentMethods] = useState(PAYMENT_METHODS);
    const [activeTab, setActiveTab] = useState<string | null>('courses');
    const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);

    // New course form
    const [newCourse, setNewCourse] = useState({
        name: '',
        duration: '',
        workload: 0,
        category: 'technology',
    });

    const handleAddCourse = () => {
        const id = String(courses.length + 1);
        setCourses(prev => [...prev, {
            id,
            name: newCourse.name,
            duration: newCourse.duration,
            workload: newCourse.workload,
            category: newCourse.category,
            status: 'active',
        }]);
        closeModal();
        setNewCourse({ name: '', duration: '', workload: 0, category: 'technology' });
    };

    const togglePaymentMethod = (methodId: string) => {
        setPaymentMethods(prev => prev.map(m =>
            m.id === methodId ? { ...m, enabled: !m.enabled } : m
        ));
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
                                    Produtos & Preços
                                </Title>
                            </div>
                        </Group>
                        <Badge size="lg" color="blue">
                            {courses.length} cursos
                        </Badge>
                    </Group>

                    {/* Tabs */}
                    <Tabs value={activeTab} onChange={setActiveTab} color="blue">
                        <Tabs.List>
                            <Tabs.Tab value="courses" leftSection={<IconPackage size={16} />}>
                                Cursos
                            </Tabs.Tab>
                            <Tabs.Tab value="pricing" leftSection={<IconCurrencyReal size={16} />}>
                                Tabela de Preços
                            </Tabs.Tab>
                            <Tabs.Tab value="payments" leftSection={<IconCreditCard size={16} />}>
                                Formas de Pagamento
                            </Tabs.Tab>
                            <Tabs.Tab value="discounts" leftSection={<IconTag size={16} />}>
                                Descontos
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* Courses Panel */}
                        <Tabs.Panel value="courses" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Cadastre os cursos e serviços oferecidos pela escola.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                        onClick={openModal}
                                    >
                                        Novo Curso
                                    </Button>
                                </Group>

                                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                                    {courses.map((course) => (
                                        <Card key={course.id} bg="dark.7" radius="md" p="md">
                                            <Stack gap="sm">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <ThemeIcon
                                                            size={36}
                                                            radius="md"
                                                            color="blue"
                                                            variant="light"
                                                        >
                                                            <IconPackage size={18} />
                                                        </ThemeIcon>
                                                        <div>
                                                            <Text c="white" fw={600} size="sm">
                                                                {course.name}
                                                            </Text>
                                                            <Text c="gray.5" size="xs">
                                                                {course.duration} • {course.workload}h
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                    <Badge
                                                        size="xs"
                                                        color={course.status === 'active' ? 'green' : 'gray'}
                                                    >
                                                        {course.status === 'active' ? 'Ativo' : 'Inativo'}
                                                    </Badge>
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
                            </Stack>
                        </Tabs.Panel>

                        {/* Pricing Panel */}
                        <Tabs.Panel value="pricing" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Configure os preços e formas de pagamento para cada curso.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                    >
                                        Novo Preço
                                    </Button>
                                </Group>

                                <Card bg="dark.7" radius="md" p="md">
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th><Text c="gray.5" size="xs">Curso</Text></Table.Th>
                                                <Table.Th><Text c="gray.5" size="xs">Tipo</Text></Table.Th>
                                                <Table.Th><Text c="gray.5" size="xs">Valor</Text></Table.Th>
                                                <Table.Th><Text c="gray.5" size="xs">Parcelas</Text></Table.Th>
                                                <Table.Th><Text c="gray.5" size="xs">Desconto</Text></Table.Th>
                                                <Table.Th><Text c="gray.5" size="xs">Ações</Text></Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {pricing.map((price) => (
                                                <Table.Tr key={price.id}>
                                                    <Table.Td>
                                                        <Text c="white" size="sm">{price.courseName}</Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge size="xs" variant="light" color={price.type === 'monthly' ? 'blue' : 'green'}>
                                                            {price.type === 'monthly' ? 'Mensal' : 'À Vista'}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text c="white" size="sm" fw={600}>
                                                            {formatCurrency(price.value)}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text c="gray.4" size="sm">
                                                            {price.installments}x
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        {price.discount > 0 ? (
                                                            <Badge size="xs" color="green">
                                                                {price.discount}% OFF
                                                            </Badge>
                                                        ) : (
                                                            <Text c="gray.6" size="xs">-</Text>
                                                        )}
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Group gap="xs">
                                                            <ActionIcon size="sm" variant="subtle">
                                                                <IconEdit size={14} />
                                                            </ActionIcon>
                                                            <ActionIcon size="sm" variant="subtle" color="red">
                                                                <IconTrash size={14} />
                                                            </ActionIcon>
                                                        </Group>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </Card>
                            </Stack>
                        </Tabs.Panel>

                        {/* Payment Methods Panel */}
                        <Tabs.Panel value="payments" pt="lg">
                            <Stack gap="md">
                                <Text c="gray.4" size="sm">
                                    Configure as formas de pagamento aceitas pela escola.
                                </Text>

                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                    {paymentMethods.map((method) => (
                                        <Card key={method.id} bg="dark.7" radius="md" p="md">
                                            <Group justify="space-between">
                                                <Group gap="sm">
                                                    <Text size="xl">{method.icon}</Text>
                                                    <div>
                                                        <Text c="white" fw={600} size="sm">
                                                            {method.label}
                                                        </Text>
                                                        {method.discount > 0 && (
                                                            <Badge size="xs" color="green" variant="light">
                                                                {method.discount}% desconto
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </Group>
                                                <Switch
                                                    checked={method.enabled}
                                                    onChange={() => togglePaymentMethod(method.id)}
                                                />
                                            </Group>
                                        </Card>
                                    ))}
                                </SimpleGrid>

                                <Alert variant="light" color="blue">
                                    <Text size="sm">
                                        Para habilitar cartão de crédito e débito recorrente, configure as
                                        integrações com provedores de pagamento na seção Financeiro.
                                    </Text>
                                </Alert>
                            </Stack>
                        </Tabs.Panel>

                        {/* Discounts Panel */}
                        <Tabs.Panel value="discounts" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Configure descontos e promoções especiais.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                    >
                                        Novo Desconto
                                    </Button>
                                </Group>

                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                    <Card bg="dark.7" radius="md" p="md">
                                        <Stack gap="sm">
                                            <Group justify="space-between">
                                                <Text c="white" fw={600} size="sm">Desconto Família</Text>
                                                <Badge color="green">Ativo</Badge>
                                            </Group>
                                            <Text c="gray.5" size="xs">
                                                10% de desconto para 2º membro da família
                                            </Text>
                                            <Text c="gray.5" size="xs">
                                                15% de desconto para 3º membro em diante
                                            </Text>
                                        </Stack>
                                    </Card>

                                    <Card bg="dark.7" radius="md" p="md">
                                        <Stack gap="sm">
                                            <Group justify="space-between">
                                                <Text c="white" fw={600} size="sm">Desconto Antecipação</Text>
                                                <Badge color="green">Ativo</Badge>
                                            </Group>
                                            <Text c="gray.5" size="xs">
                                                5% de desconto para pagamento até o dia 5
                                            </Text>
                                        </Stack>
                                    </Card>

                                    <Card bg="dark.7" radius="md" p="md">
                                        <Stack gap="sm">
                                            <Group justify="space-between">
                                                <Text c="white" fw={600} size="sm">Convênio Empresarial</Text>
                                                <Badge color="gray">Inativo</Badge>
                                            </Group>
                                            <Text c="gray.5" size="xs">
                                                Descontos especiais para funcionários de empresas parceiras
                                            </Text>
                                        </Stack>
                                    </Card>
                                </SimpleGrid>
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

            {/* New Course Modal */}
            <Modal
                opened={isModalOpen}
                onClose={closeModal}
                title="Novo Curso"
                size="md"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome do Curso"
                        placeholder="Ex: Curso de Inglês"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />

                    <Group grow>
                        <TextInput
                            label="Duração"
                            placeholder="Ex: 6 meses"
                            value={newCourse.duration}
                            onChange={(e) => setNewCourse(prev => ({ ...prev, duration: e.target.value }))}
                        />
                        <NumberInput
                            label="Carga Horária (h)"
                            placeholder="48"
                            value={newCourse.workload}
                            onChange={(value) => setNewCourse(prev => ({ ...prev, workload: Number(value) || 0 }))}
                        />
                    </Group>

                    <Select
                        label="Categoria"
                        data={[
                            { value: 'technology', label: 'Tecnologia' },
                            { value: 'languages', label: 'Idiomas' },
                            { value: 'tutoring', label: 'Reforço Escolar' },
                            { value: 'arts', label: 'Artes' },
                            { value: 'sports', label: 'Esportes' },
                            { value: 'other', label: 'Outros' },
                        ]}
                        value={newCourse.category}
                        onChange={(value) => setNewCourse(prev => ({ ...prev, category: value || 'other' }))}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeModal}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddCourse} disabled={!newCourse.name}>
                            Criar Curso
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
}
