'use client';

import { use, useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, TextInput, NumberInput, Select, Slider, Switch,
    Divider, ThemeIcon, SimpleGrid, Alert, Tabs, Table
} from '@mantine/core';
import {
    IconCurrencyReal, IconPercentage, IconUser, IconSchool,
    IconBuildingBank, IconCheck, IconAlertCircle, IconDeviceFloppy,
    IconArrowLeft
} from '@tabler/icons-react';
import Link from 'next/link';

type PaymentModel = 'school_course' | 'hired_teacher' | 'external_teacher';

interface CourseSetup {
    id: string;
    title: string;
    fullPrice: number;
    maxInstallments: number;
    earlyPaymentDiscount: number;
    latePaymentFee: number;
    paymentModel: PaymentModel;
    teacherId?: string;
    teacherPercentage: number;
    platformFee: number;
    transactionFee: number;
    roomRental: number;
    additionalServices: string[];
}

// Mock teachers
const MOCK_TEACHERS = [
    { value: 'teacher-1', label: 'Prof. Maria Santos', model: 'hired_teacher' as const },
    { value: 'teacher-2', label: 'Prof. João Lima', model: 'hired_teacher' as const },
    { value: 'teacher-3', label: 'Prof. Ana Costa (Externo)', model: 'external_teacher' as const },
];

// Mock services
const MOCK_SERVICES = [
    { id: 'svc-1', name: 'Sala Premium', price: 500, category: 'room_rental' },
    { id: 'svc-2', name: 'Equipamento Audiovisual', price: 200, category: 'equipment' },
    { id: 'svc-3', name: 'Marketing Digital', price: 300, category: 'marketing' },
    { id: 'svc-4', name: 'Suporte Administrativo', price: 150, category: 'admin' },
];

interface Props {
    params: Promise<{ courseId: string }>;
}

export default function CourseSetupPage({ params }: Props) {
    const { courseId } = use(params);

    const [course, setCourse] = useState<CourseSetup>({
        id: courseId,
        title: 'Intelligence: The Architect Protocol',
        fullPrice: 1497.00,
        maxInstallments: 10,
        earlyPaymentDiscount: 10,
        latePaymentFee: 2,
        paymentModel: 'school_course',
        teacherPercentage: 30,
        platformFee: 5,
        transactionFee: 2.5,
        roomRental: 500,
        additionalServices: [],
    });

    const updateCourse = (field: keyof CourseSetup, value: unknown) => {
        setCourse(prev => ({ ...prev, [field]: value }));
    };

    // Calculate split preview
    const calculateSplit = () => {
        const gross = course.fullPrice;
        let teacherAmount = 0;
        let schoolAmount = gross;
        let platformFeeAmount = 0;
        let transactionFeeAmount = gross * (course.transactionFee / 100);
        let deductions = 0;

        if (course.paymentModel === 'hired_teacher') {
            teacherAmount = gross * (course.teacherPercentage / 100);
            schoolAmount = gross - teacherAmount - transactionFeeAmount;
        } else if (course.paymentModel === 'external_teacher') {
            platformFeeAmount = gross * (course.platformFee / 100);
            deductions = course.roomRental +
                MOCK_SERVICES.filter(s => course.additionalServices.includes(s.id))
                    .reduce((acc, s) => acc + s.price, 0);
            teacherAmount = gross - platformFeeAmount - transactionFeeAmount - deductions;
            schoolAmount = platformFeeAmount + deductions;
        } else {
            schoolAmount = gross - transactionFeeAmount;
        }

        return {
            gross,
            teacherAmount,
            schoolAmount,
            platformFeeAmount,
            transactionFeeAmount,
            deductions,
        };
    };

    const split = calculateSplit();

    const formatCurrency = (amount: number) =>
        `R$ ${amount.toFixed(2).replace('.', ',')}`;

    const getPaymentModelInfo = (model: PaymentModel) => {
        switch (model) {
            case 'school_course':
                return {
                    color: 'blue',
                    icon: IconBuildingBank,
                    label: 'Curso da Escola',
                    description: '100% da receita vai para a escola (menos taxas de transação)',
                };
            case 'hired_teacher':
                return {
                    color: 'violet',
                    icon: IconUser,
                    label: 'Professor Contratado',
                    description: 'Professor recebe uma porcentagem configurável de cada pagamento',
                };
            case 'external_teacher':
                return {
                    color: 'orange',
                    icon: IconSchool,
                    label: 'Professor Externo',
                    description: 'Professor aluga sala e usa serviços, recebe o restante após deduções',
                };
        }
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group gap="md">
                    <Link href="/school" passHref legacyBehavior>
                        <Button component="a" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <Title order={2}>Configuração do Curso</Title>
                        <Text c="dimmed">{course.title}</Text>
                    </div>
                </Group>
                <Button leftSection={<IconDeviceFloppy size={16} />}>
                    Salvar Alterações
                </Button>
            </Group>

            <Tabs defaultValue="pricing">
                <Tabs.List>
                    <Tabs.Tab value="pricing" leftSection={<IconCurrencyReal size={14} />}>
                        Preços
                    </Tabs.Tab>
                    <Tabs.Tab value="split" leftSection={<IconPercentage size={14} />}>
                        Divisão de Pagamentos
                    </Tabs.Tab>
                </Tabs.List>

                {/* Pricing Tab */}
                <Tabs.Panel value="pricing" pt="md">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        <Card shadow="xs" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Title order={4}>Preço do Curso</Title>

                                <NumberInput
                                    label="Valor Total"
                                    description="Preço cheio do curso"
                                    value={course.fullPrice}
                                    onChange={(v) => updateCourse('fullPrice', v || 0)}
                                    prefix="R$ "
                                    decimalScale={2}
                                    fixedDecimalScale
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    min={0}
                                />

                                <NumberInput
                                    label="Máximo de Parcelas"
                                    description="Quantidade máxima de parcelas"
                                    value={course.maxInstallments}
                                    onChange={(v) => updateCourse('maxInstallments', v || 1)}
                                    min={1}
                                    max={24}
                                />

                                <Text size="sm" c="dimmed">
                                    Valor da parcela: {formatCurrency(course.fullPrice / course.maxInstallments)}
                                </Text>
                            </Stack>
                        </Card>

                        <Card shadow="xs" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Title order={4}>Descontos e Taxas</Title>

                                <div>
                                    <Text size="sm" fw={500} mb="xs">
                                        Desconto por Pagamento Antecipado: {course.earlyPaymentDiscount}%
                                    </Text>
                                    <Slider
                                        value={course.earlyPaymentDiscount}
                                        onChange={(v) => updateCourse('earlyPaymentDiscount', v)}
                                        min={0}
                                        max={20}
                                        marks={[
                                            { value: 0, label: '0%' },
                                            { value: 10, label: '10%' },
                                            { value: 20, label: '20%' },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <Text size="sm" fw={500} mb="xs">
                                        Multa por Atraso: {course.latePaymentFee}%
                                    </Text>
                                    <Slider
                                        value={course.latePaymentFee}
                                        onChange={(v) => updateCourse('latePaymentFee', v)}
                                        min={0}
                                        max={10}
                                        marks={[
                                            { value: 0, label: '0%' },
                                            { value: 2, label: '2%' },
                                            { value: 5, label: '5%' },
                                            { value: 10, label: '10%' },
                                        ]}
                                    />
                                </div>
                            </Stack>
                        </Card>
                    </SimpleGrid>
                </Tabs.Panel>

                {/* Payment Split Tab */}
                <Tabs.Panel value="split" pt="md">
                    <Stack gap="lg">
                        {/* Payment Model Selection */}
                        <Card shadow="xs" radius="md" p="lg" withBorder>
                            <Title order={4} mb="md">Modelo de Pagamento</Title>

                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                {(['school_course', 'hired_teacher', 'external_teacher'] as PaymentModel[]).map((model) => {
                                    const info = getPaymentModelInfo(model);
                                    const isSelected = course.paymentModel === model;

                                    return (
                                        <Paper
                                            key={model}
                                            p="md"
                                            radius="md"
                                            withBorder
                                            style={{
                                                cursor: 'pointer',
                                                borderColor: isSelected ? `var(--mantine-color-${info.color}-6)` : undefined,
                                                borderWidth: isSelected ? 2 : 1,
                                                background: isSelected ? `var(--mantine-color-${info.color}-0)` : undefined,
                                            }}
                                            onClick={() => updateCourse('paymentModel', model)}
                                        >
                                            <Group gap="sm" mb="xs">
                                                <ThemeIcon
                                                    size={36}
                                                    radius="md"
                                                    variant={isSelected ? 'filled' : 'light'}
                                                    color={info.color}
                                                >
                                                    <info.icon size={20} />
                                                </ThemeIcon>
                                                {isSelected && <IconCheck size={18} color={`var(--mantine-color-${info.color}-6)`} />}
                                            </Group>
                                            <Text fw={600}>{info.label}</Text>
                                            <Text size="xs" c="dimmed">{info.description}</Text>
                                        </Paper>
                                    );
                                })}
                            </SimpleGrid>
                        </Card>

                        {/* Model-specific configuration */}
                        {course.paymentModel === 'hired_teacher' && (
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Title order={4} mb="md">Configuração - Professor Contratado</Title>

                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                    <Select
                                        label="Professor"
                                        placeholder="Selecione o professor"
                                        data={MOCK_TEACHERS.filter(t => t.model === 'hired_teacher')}
                                        value={course.teacherId}
                                        onChange={(v) => updateCourse('teacherId', v)}
                                    />

                                    <div>
                                        <Text size="sm" fw={500} mb="xs">
                                            Porcentagem do Professor: {course.teacherPercentage}%
                                        </Text>
                                        <Slider
                                            value={course.teacherPercentage}
                                            onChange={(v) => updateCourse('teacherPercentage', v)}
                                            min={0}
                                            max={70}
                                            marks={[
                                                { value: 0, label: '0%' },
                                                { value: 30, label: '30%' },
                                                { value: 50, label: '50%' },
                                                { value: 70, label: '70%' },
                                            ]}
                                            color="violet"
                                        />
                                    </div>
                                </SimpleGrid>
                            </Card>
                        )}

                        {course.paymentModel === 'external_teacher' && (
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Title order={4} mb="md">Configuração - Professor Externo</Title>

                                <Stack gap="md">
                                    <Select
                                        label="Professor"
                                        placeholder="Selecione o professor"
                                        data={MOCK_TEACHERS.filter(t => t.model === 'external_teacher')}
                                        value={course.teacherId}
                                        onChange={(v) => updateCourse('teacherId', v)}
                                    />

                                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                        <div>
                                            <Text size="sm" fw={500} mb="xs">
                                                Taxa da Plataforma: {course.platformFee}%
                                            </Text>
                                            <Slider
                                                value={course.platformFee}
                                                onChange={(v) => updateCourse('platformFee', v)}
                                                min={0}
                                                max={15}
                                                marks={[
                                                    { value: 0, label: '0%' },
                                                    { value: 5, label: '5%' },
                                                    { value: 10, label: '10%' },
                                                    { value: 15, label: '15%' },
                                                ]}
                                                color="orange"
                                            />
                                        </div>

                                        <NumberInput
                                            label="Aluguel da Sala (mensal)"
                                            value={course.roomRental}
                                            onChange={(v) => updateCourse('roomRental', v || 0)}
                                            prefix="R$ "
                                            decimalScale={2}
                                            min={0}
                                        />
                                    </SimpleGrid>

                                    <Divider label="Serviços Adicionais" labelPosition="left" />

                                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
                                        {MOCK_SERVICES.map((service) => (
                                            <Paper
                                                key={service.id}
                                                p="sm"
                                                radius="md"
                                                withBorder
                                                style={{
                                                    background: course.additionalServices.includes(service.id)
                                                        ? 'var(--mantine-color-orange-0)'
                                                        : undefined,
                                                }}
                                            >
                                                <Group justify="space-between">
                                                    <div>
                                                        <Text size="sm" fw={500}>{service.name}</Text>
                                                        <Text size="xs" c="dimmed">{formatCurrency(service.price)}/mês</Text>
                                                    </div>
                                                    <Switch
                                                        checked={course.additionalServices.includes(service.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                updateCourse('additionalServices', [...course.additionalServices, service.id]);
                                                            } else {
                                                                updateCourse('additionalServices', course.additionalServices.filter(id => id !== service.id));
                                                            }
                                                        }}
                                                    />
                                                </Group>
                                            </Paper>
                                        ))}
                                    </SimpleGrid>
                                </Stack>
                            </Card>
                        )}

                        {/* Split Preview */}
                        <Card shadow="xs" radius="md" p="lg" withBorder>
                            <Title order={4} mb="md">Prévia da Divisão (por pagamento)</Title>

                            <Alert
                                icon={<IconAlertCircle size={16} />}
                                color="gray"
                                variant="light"
                                mb="md"
                            >
                                Esta é uma simulação baseada no valor total do curso.
                                A divisão real será calculada para cada pagamento recebido.
                            </Alert>

                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Descrição</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Valor</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>%</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td>
                                            <Text fw={500}>Valor Bruto</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Text fw={500}>{formatCurrency(split.gross)}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Text>100%</Text>
                                        </Table.Td>
                                    </Table.Tr>

                                    <Table.Tr>
                                        <Table.Td>
                                            <Text c="dimmed">Taxa de Transação</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Text c="red">-{formatCurrency(split.transactionFeeAmount)}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Text c="dimmed">{course.transactionFee}%</Text>
                                        </Table.Td>
                                    </Table.Tr>

                                    {course.paymentModel === 'external_teacher' && split.platformFeeAmount > 0 && (
                                        <Table.Tr>
                                            <Table.Td>
                                                <Text c="dimmed">Taxa da Plataforma</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text c="red">-{formatCurrency(split.platformFeeAmount)}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text c="dimmed">{course.platformFee}%</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}

                                    {course.paymentModel === 'external_teacher' && split.deductions > 0 && (
                                        <Table.Tr>
                                            <Table.Td>
                                                <Text c="dimmed">Serviços (rateio mensal)</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text c="red">-{formatCurrency(split.deductions)}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text c="dimmed">—</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}

                                    <Table.Tr style={{ background: 'var(--mantine-color-gray-0)' }}>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <ThemeIcon size={20} radius="xl" color="blue" variant="light">
                                                    <IconBuildingBank size={12} />
                                                </ThemeIcon>
                                                <Text fw={600}>Escola</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Text fw={600} c="blue">{formatCurrency(split.schoolAmount)}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Text c="blue">{((split.schoolAmount / split.gross) * 100).toFixed(1)}%</Text>
                                        </Table.Td>
                                    </Table.Tr>

                                    {split.teacherAmount > 0 && (
                                        <Table.Tr style={{ background: 'var(--mantine-color-violet-0)' }}>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <ThemeIcon size={20} radius="xl" color="violet" variant="light">
                                                        <IconUser size={12} />
                                                    </ThemeIcon>
                                                    <Text fw={600}>Professor</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text fw={600} c="violet">{formatCurrency(split.teacherAmount)}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text c="violet">{((split.teacherAmount / split.gross) * 100).toFixed(1)}%</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Card>
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
