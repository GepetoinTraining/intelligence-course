'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Container, Title, Group, Button, Stepper, Paper, Text, Badge, Card,
    TextInput, Select, SimpleGrid, Stack, Alert, Loader, Center, Divider,
    ThemeIcon, Grid, Avatar,
    SegmentedControl, Checkbox, ScrollArea,
    Slider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconSchool, IconUsers, IconFileText, IconCheck,
    IconArrowLeft, IconArrowRight, IconSearch, IconUser,
    IconCalendar, IconClock, IconMapPin, IconCurrencyReal,
    IconAlertCircle, IconConfetti, IconFileDescription,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface CourseType {
    id: string;
    name: string;
    code: string;
    defaultMonthlyPrice: number;
    levels: { id: string; name: string; code: string; orderIndex: number }[];
    openClasses: number;
    availableSpots: number;
}

interface ClassOption {
    id: string;
    name: string;
    courseType: { id: string; name: string } | null;
    level: { id: string; name: string; code: string } | null;
    teacher: { id: string; name: string; avatarUrl: string | null } | null;
    maxStudents: number;
    currentStudents: number;
    vacancy: number;
    isFull: boolean;
    monthlyPrice: number | null;
    schedules: {
        id: string;
        dayOfWeek: number;
        dayName: string;
        startTime: string;
        endTime: string;
        room: { id: string; name: string } | null;
    }[];
}

interface PersonResult {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    birthDate: number | null;
}

interface PaymentPlan {
    monthlyPrice: number;
    durationMonths: number;
    enrollmentFee: number;
    grossTuition: number;
    grossTotal: number;
    discountPercent: number;
    discountAmount: number;
    netTuition: number;
    netTotal: number;
    installmentCount: number;
    installmentValue: number;
    lastInstallmentValue: number;
    installments: {
        number: number;
        dueDate: string;
        dueDateTimestamp: number;
        amount: number;
    }[];
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function NovaMatriculaPage() {
    const [active, setActive] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [completionResult, setCompletionResult] = useState<any>(null);

    // Step 1: Course selection
    const [selectedCourseType, setSelectedCourseType] = useState<CourseType | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

    // Step 2: Class selection
    const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);

    // Step 3: Persons
    const [parentMode, setParentMode] = useState<'search' | 'create'>('create');
    const [studentMode, setStudentMode] = useState<'search' | 'create'>('create');
    const [selectedParent, setSelectedParent] = useState<PersonResult | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<PersonResult | null>(null);
    const [sameAsPerson, setSameAsPerson] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PersonResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Step 4: Payment
    const [paymentPlan, setPaymentPlan] = useState<PaymentPlan | null>(null);
    const [installmentCount, setInstallmentCount] = useState(12);
    const [discountPercent, setDiscountPercent] = useState(0);

    // Step 5: Contract
    const [signatureProvider, setSignatureProvider] = useState('in_person');

    // Data fetching
    const { data: coursesData, isLoading: coursesLoading } = useApi<any>('/api/enrollment-flow/courses');
    const courseTypes_data: CourseType[] = coursesData?.data || [];

    const [classesData, setClassesData] = useState<ClassOption[]>([]);
    const [classesLoading, setClassesLoading] = useState(false);

    // Forms
    const parentForm = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            taxId: '',
            taxIdType: 'cpf',
        },
        validate: {
            firstName: (v) => (!v ? 'Nome é obrigatório' : null),
            taxId: (v) => (!v ? 'CPF é obrigatório' : null),
        },
    });

    const studentForm = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            birthDate: '',
            gender: '',
        },
        validate: {
            firstName: (v) => (!v ? 'Nome é obrigatório' : null),
        },
    });

    // ========================================================================
    // Step navigation
    // ========================================================================

    const canNext = (step: number) => {
        switch (step) {
            case 0: return !!selectedCourseType;
            case 1: return !!selectedClass;
            case 2: return !!(selectedParent || parentForm.values.firstName) && (sameAsPerson || !!(selectedStudent || studentForm.values.firstName));
            case 3: return !!paymentPlan;
            case 4: return true;
            default: return false;
        }
    };

    const nextStep = () => {
        if (active === 2) {
            // Validate forms before proceeding
            if (parentMode === 'create') {
                const validation = parentForm.validate();
                if (validation.hasErrors) return;
            }
            if (!sameAsPerson && studentMode === 'create') {
                const validation = studentForm.validate();
                if (validation.hasErrors) return;
            }
        }
        setActive((c) => Math.min(c + 1, 5));
    };

    const prevStep = () => setActive((c) => Math.max(c - 1, 0));

    // ========================================================================
    // Fetch classes when course type or level changes
    // ========================================================================

    useEffect(() => {
        if (!selectedCourseType) return;
        setClassesLoading(true);
        const params = new URLSearchParams();
        params.set('courseTypeId', selectedCourseType.id);
        if (selectedLevel) params.set('levelId', selectedLevel);

        fetch(`/api/enrollment-flow/classes?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setClassesData(data.data || []);
                setClassesLoading(false);
            })
            .catch(() => setClassesLoading(false));
    }, [selectedCourseType, selectedLevel]);

    // ========================================================================
    // Calculate payment when params change
    // ========================================================================

    useEffect(() => {
        if (!selectedClass || active !== 3) return;
        const price = selectedClass.monthlyPrice || selectedCourseType?.defaultMonthlyPrice || 0;
        if (!price) return;

        fetch('/api/enrollment-flow/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                monthlyPrice: price,
                durationMonths: 12,
                installmentCount,
                discountPercent,
                enrollmentFee: 0,
            }),
        })
            .then(res => res.json())
            .then(data => setPaymentPlan(data.data || null))
            .catch(console.error);
    }, [selectedClass, installmentCount, discountPercent, active]);

    // ========================================================================
    // Search persons
    // ========================================================================

    const searchPersons = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const res = await fetch('/api/enrollment-flow/persons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'search', query }),
            });
            const data = await res.json();
            setSearchResults(data.data || []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    // ========================================================================
    // Submit enrollment
    // ========================================================================

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const body: any = {
                classId: selectedClass!.id,
                payment: {
                    monthlyPrice: selectedClass!.monthlyPrice || selectedCourseType!.defaultMonthlyPrice,
                    durationMonths: 12,
                    installmentCount,
                    discountPercent,
                    netTotal: paymentPlan!.netTotal,
                    installments: paymentPlan!.installments,
                },
                relationship: 'parent',
                signatureProvider,
            };

            // Student
            if (sameAsPerson && selectedParent) {
                body.studentId = selectedParent.id;
                body.parentId = selectedParent.id;
            } else {
                if (selectedStudent) {
                    body.studentId = selectedStudent.id;
                } else {
                    body.studentData = studentForm.values;
                }
                if (selectedParent) {
                    body.parentId = selectedParent.id;
                } else {
                    body.parentData = parentForm.values;
                }
            }

            const res = await fetch('/api/enrollment-flow/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Falha ao processar matrícula');
            }

            setCompletionResult(result.data);
            setIsComplete(true);
            setActive(5);

            notifications.show({
                title: '✅ Matrícula Realizada!',
                message: result.message || 'A matrícula foi processada com sucesso.',
                color: 'green',
                autoClose: 5000,
            });
        } catch (error: any) {
            notifications.show({
                title: 'Erro na Matrícula',
                message: error.message || 'Falha ao processar matrícula',
                color: 'red',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========================================================================
    // FORMAT HELPERS
    // ========================================================================

    const fmt = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
    const fmtCpf = (cpf: string) => cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '';

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        Nova Matrícula
                    </Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Processo completo de matrícula de novo aluno
                    </Text>
                </div>
                <Button
                    variant="subtle"
                    leftSection={<IconArrowLeft size={16} />}
                    component="a"
                    href="/admin/operacional/matriculas"
                >
                    Voltar
                </Button>
            </Group>

            <Stepper
                active={active}
                onStepClick={(step) => step < active && setActive(step)}
                size="sm"
                mb="xl"
                styles={{
                    separator: { marginLeft: 4, marginRight: 4 },
                }}
            >
                <Stepper.Step icon={<IconSchool size={18} />} label="Curso" description="Selecione o curso">
                    <StepCourseSelection
                        courseTypes={courseTypes_data}
                        loading={coursesLoading}
                        selected={selectedCourseType}
                        selectedLevel={selectedLevel}
                        onSelectCourse={setSelectedCourseType}
                        onSelectLevel={setSelectedLevel}
                    />
                </Stepper.Step>

                <Stepper.Step icon={<IconCalendar size={18} />} label="Turma" description="Escolha a turma">
                    <StepClassSelection
                        classes={classesData}
                        loading={classesLoading}
                        selected={selectedClass}
                        onSelect={setSelectedClass}
                    />
                </Stepper.Step>

                <Stepper.Step icon={<IconUsers size={18} />} label="Pessoas" description="Responsável e aluno">
                    <StepPersons
                        parentMode={parentMode}
                        studentMode={studentMode}
                        selectedParent={selectedParent}
                        selectedStudent={selectedStudent}
                        sameAsPerson={sameAsPerson}
                        parentForm={parentForm}
                        studentForm={studentForm}
                        searchQuery={searchQuery}
                        searchResults={searchResults}
                        searchLoading={searchLoading}
                        onParentModeChange={setParentMode}
                        onStudentModeChange={setStudentMode}
                        onSelectParent={setSelectedParent}
                        onSelectStudent={setSelectedStudent}
                        onSameAsPersonChange={setSameAsPerson}
                        onSearchQueryChange={(q: string) => { setSearchQuery(q); searchPersons(q); }}
                        fmt={fmtCpf}
                    />
                </Stepper.Step>

                <Stepper.Step icon={<IconCurrencyReal size={18} />} label="Pagamento" description="Plano financeiro">
                    <StepPayment
                        selectedClass={selectedClass}
                        courseType={selectedCourseType}
                        paymentPlan={paymentPlan}
                        installmentCount={installmentCount}
                        discountPercent={discountPercent}
                        onInstallmentCountChange={setInstallmentCount}
                        onDiscountPercentChange={setDiscountPercent}
                        fmt={fmt}
                    />
                </Stepper.Step>

                <Stepper.Step icon={<IconFileText size={18} />} label="Contrato" description="Revisão e assinatura">
                    <StepContract
                        selectedClass={selectedClass}
                        courseType={selectedCourseType}
                        selectedParent={selectedParent}
                        selectedStudent={selectedStudent}
                        sameAsPerson={sameAsPerson}
                        parentForm={parentForm}
                        studentForm={studentForm}
                        paymentPlan={paymentPlan}
                        signatureProvider={signatureProvider}
                        onSignatureProviderChange={setSignatureProvider}
                        fmt={fmt}
                        fmtCpf={fmtCpf}
                        isSubmitting={isSubmitting}
                        onSubmit={handleSubmit}
                    />
                </Stepper.Step>

                <Stepper.Completed>
                    <StepCompleted result={completionResult} fmt={fmt} />
                </Stepper.Completed>
            </Stepper>

            {/* Navigation */}
            {!isComplete && (
                <Group justify="space-between" mt="xl">
                    <Button
                        variant="default"
                        onClick={prevStep}
                        disabled={active === 0}
                        leftSection={<IconArrowLeft size={16} />}
                    >
                        Anterior
                    </Button>

                    {active < 4 ? (
                        <Button
                            onClick={nextStep}
                            disabled={!canNext(active)}
                            rightSection={<IconArrowRight size={16} />}
                        >
                            Próximo
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            color="green"
                            leftSection={<IconCheck size={16} />}
                            size="md"
                        >
                            Finalizar Matrícula
                        </Button>
                    )}
                </Group>
            )}
        </Container>
    );
}

// ============================================================================
// STEP 1: COURSE SELECTION
// ============================================================================

function StepCourseSelection({
    courseTypes, loading, selected, selectedLevel, onSelectCourse, onSelectLevel,
}: {
    courseTypes: CourseType[];
    loading: boolean;
    selected: CourseType | null;
    selectedLevel: string | null;
    onSelectCourse: (ct: CourseType) => void;
    onSelectLevel: (id: string | null) => void;
}) {
    if (loading) {
        return <Center py="xl"><Loader /></Center>;
    }

    return (
        <Stack gap="md">
            <Text fw={600} size="lg">Selecione o tipo de curso</Text>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {courseTypes.map((ct) => (
                    <Card
                        key={ct.id}
                        shadow={selected?.id === ct.id ? 'lg' : 'sm'}
                        padding="lg"
                        radius="md"
                        withBorder
                        style={{
                            cursor: 'pointer',
                            borderColor: selected?.id === ct.id ? 'var(--mantine-color-blue-5)' : undefined,
                            borderWidth: selected?.id === ct.id ? 2 : 1,
                            transition: 'all 0.2s',
                        }}
                        onClick={() => {
                            onSelectCourse(ct);
                            onSelectLevel(null);
                        }}
                    >
                        <Group justify="space-between" mb="xs">
                            <Text fw={700} size="lg">{ct.name}</Text>
                            {selected?.id === ct.id && (
                                <ThemeIcon color="blue" variant="filled" size="sm" radius="xl">
                                    <IconCheck size={12} />
                                </ThemeIcon>
                            )}
                        </Group>
                        <Text c="dimmed" size="sm" mb="sm">{ct.code}</Text>
                        <Group gap="xs">
                            <Badge color="blue" variant="light" size="sm">
                                {ct.openClasses} turmas abertas
                            </Badge>
                            <Badge color="green" variant="light" size="sm">
                                {ct.availableSpots} vagas
                            </Badge>
                        </Group>
                        {ct.defaultMonthlyPrice > 0 && (
                            <Text size="sm" mt="sm" fw={600} c="blue">
                                R$ {(ct.defaultMonthlyPrice / 100).toFixed(2).replace('.', ',')} / mês
                            </Text>
                        )}
                    </Card>
                ))}
            </SimpleGrid>

            {/* Level selection */}
            {selected && selected.levels?.length > 0 && (
                <>
                    <Divider my="sm" />
                    <Text fw={600} size="md">Filtrar por nível (opcional)</Text>
                    <Group gap="xs">
                        <Badge
                            size="lg"
                            variant={!selectedLevel ? 'filled' : 'outline'}
                            color="gray"
                            style={{ cursor: 'pointer' }}
                            onClick={() => onSelectLevel(null)}
                        >
                            Todos
                        </Badge>
                        {selected.levels.map((lvl) => (
                            <Badge
                                key={lvl.id}
                                size="lg"
                                variant={selectedLevel === lvl.id ? 'filled' : 'outline'}
                                style={{ cursor: 'pointer' }}
                                onClick={() => onSelectLevel(lvl.id)}
                            >
                                {lvl.name} ({lvl.code})
                            </Badge>
                        ))}
                    </Group>
                </>
            )}
        </Stack>
    );
}

// ============================================================================
// STEP 2: CLASS SELECTION
// ============================================================================

function StepClassSelection({
    classes, loading, selected, onSelect,
}: {
    classes: ClassOption[];
    loading: boolean;
    selected: ClassOption | null;
    onSelect: (cls: ClassOption) => void;
}) {
    if (loading) {
        return <Center py="xl"><Loader /></Center>;
    }

    if (classes.length === 0) {
        return (
            <Alert icon={<IconAlertCircle />} color="yellow" title="Sem turmas disponíveis">
                Não há turmas abertas para o curso/nível selecionado.
            </Alert>
        );
    }

    return (
        <Stack gap="md">
            <Text fw={600} size="lg">Escolha uma turma com vagas</Text>

            {classes.map((cls) => (
                <Card
                    key={cls.id}
                    shadow={selected?.id === cls.id ? 'lg' : 'sm'}
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{
                        cursor: cls.isFull ? 'not-allowed' : 'pointer',
                        opacity: cls.isFull ? 0.5 : 1,
                        borderColor: selected?.id === cls.id ? 'var(--mantine-color-blue-5)' : undefined,
                        borderWidth: selected?.id === cls.id ? 2 : 1,
                        transition: 'all 0.2s',
                    }}
                    onClick={() => !cls.isFull && onSelect(cls)}
                >
                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Group gap="sm" mb="xs">
                                <Text fw={700} size="md">{cls.name}</Text>
                                {selected?.id === cls.id && (
                                    <ThemeIcon color="blue" variant="filled" size="sm" radius="xl">
                                        <IconCheck size={12} />
                                    </ThemeIcon>
                                )}
                            </Group>
                            <Group gap="xs" mb="xs">
                                {cls.level && <Badge size="sm" variant="light">{cls.level.name}</Badge>}
                                <Badge
                                    size="sm"
                                    color={cls.isFull ? 'red' : cls.vacancy <= 3 ? 'yellow' : 'green'}
                                    variant="light"
                                >
                                    {cls.isFull ? 'Lotada' : `${cls.vacancy} vagas`}
                                </Badge>
                            </Group>
                            {cls.teacher && (
                                <Group gap="xs">
                                    <Avatar size="xs" src={cls.teacher.avatarUrl} />
                                    <Text size="sm" c="dimmed">Prof. {cls.teacher.name}</Text>
                                </Group>
                            )}
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Stack gap={4}>
                                {cls.schedules.map((s) => (
                                    <Group key={s.id} gap="xs">
                                        <IconCalendar size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                        <Text size="sm">{s.dayName}</Text>
                                        <IconClock size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                        <Text size="sm">{s.startTime} - {s.endTime}</Text>
                                        {s.room && (
                                            <>
                                                <IconMapPin size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                                <Text size="sm" c="dimmed">{s.room.name}</Text>
                                            </>
                                        )}
                                    </Group>
                                ))}
                                {cls.schedules.length === 0 && (
                                    <Text size="sm" c="dimmed" fs="italic">Horário a definir</Text>
                                )}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Card>
            ))}
        </Stack>
    );
}

// ============================================================================
// STEP 3: PERSONS (Parent + Student)
// ============================================================================

function StepPersons({
    parentMode, studentMode, selectedParent, selectedStudent, sameAsPerson,
    parentForm, studentForm, searchQuery, searchResults, searchLoading,
    onParentModeChange, onStudentModeChange, onSelectParent, onSelectStudent,
    onSameAsPersonChange, onSearchQueryChange, fmt,
}: any) {
    const [activeSearch, setActiveSearch] = useState<'parent' | 'student' | null>(null);

    return (
        <Stack gap="lg">
            {/* PARENT / RESPONSIBLE */}
            <Paper p="lg" withBorder radius="md">
                <Group justify="space-between" mb="md">
                    <Group gap="xs">
                        <ThemeIcon variant="light" color="blue"><IconUser size={18} /></ThemeIcon>
                        <Text fw={700}>Responsável Financeiro</Text>
                    </Group>
                    <SegmentedControl
                        size="xs"
                        value={parentMode}
                        onChange={(v) => {
                            onParentModeChange(v);
                            if (v === 'search') setActiveSearch('parent');
                        }}
                        data={[
                            { value: 'create', label: 'Novo' },
                            { value: 'search', label: 'Buscar existente' },
                        ]}
                    />
                </Group>

                {selectedParent && parentMode === 'search' ? (
                    <Alert color="green" icon={<IconCheck />} title="Responsável selecionado">
                        <Group>
                            <Text fw={600}>{selectedParent.name}</Text>
                            {selectedParent.taxId && <Text size="sm">CPF: {fmt(selectedParent.taxId)}</Text>}
                            {selectedParent.email && <Text size="sm">{selectedParent.email}</Text>}
                        </Group>
                        <Button size="xs" variant="subtle" mt="xs" onClick={() => onSelectParent(null)}>
                            Alterar
                        </Button>
                    </Alert>
                ) : parentMode === 'search' ? (
                    <Stack gap="sm">
                        <TextInput
                            placeholder="Buscar por nome, email, CPF ou telefone..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => {
                                onSearchQueryChange(e.currentTarget.value);
                                setActiveSearch('parent');
                            }}
                        />
                        {searchLoading && <Center><Loader size="sm" /></Center>}
                        {searchResults.length > 0 && activeSearch === 'parent' && (
                            <Stack gap="xs">
                                {searchResults.map((p: PersonResult) => (
                                    <Card
                                        key={p.id}
                                        padding="sm"
                                        withBorder
                                        radius="sm"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => onSelectParent(p)}
                                    >
                                        <Group justify="space-between">
                                            <div>
                                                <Text fw={600} size="sm">{p.name}</Text>
                                                <Group gap="xs">
                                                    {p.email && <Text size="xs" c="dimmed">{p.email}</Text>}
                                                    {p.taxId && <Text size="xs" c="dimmed">CPF: {fmt(p.taxId)}</Text>}
                                                </Group>
                                            </div>
                                            <Button size="xs" variant="light">Selecionar</Button>
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput label="Nome *" placeholder="Nome" {...parentForm.getInputProps('firstName')} />
                        <TextInput label="Sobrenome" placeholder="Sobrenome" {...parentForm.getInputProps('lastName')} />
                        <TextInput label="CPF *" placeholder="000.000.000-00" {...parentForm.getInputProps('taxId')} />
                        <TextInput label="E-mail" placeholder="email@exemplo.com" {...parentForm.getInputProps('email')} />
                        <TextInput label="Telefone" placeholder="(XX) XXXXX-XXXX" {...parentForm.getInputProps('phone')} />
                    </SimpleGrid>
                )}
            </Paper>

            {/* SAME AS PERSON checkbox */}
            <Checkbox
                label="O responsável financeiro é o próprio aluno (adulto)"
                checked={sameAsPerson}
                onChange={(e) => onSameAsPersonChange(e.currentTarget.checked)}
            />

            {/* STUDENT */}
            {!sameAsPerson && (
                <Paper p="lg" withBorder radius="md">
                    <Group justify="space-between" mb="md">
                        <Group gap="xs">
                            <ThemeIcon variant="light" color="violet"><IconSchool size={18} /></ThemeIcon>
                            <Text fw={700}>Aluno(a)</Text>
                        </Group>
                        <SegmentedControl
                            size="xs"
                            value={studentMode}
                            onChange={(v) => {
                                onStudentModeChange(v);
                                if (v === 'search') setActiveSearch('student');
                            }}
                            data={[
                                { value: 'create', label: 'Novo' },
                                { value: 'search', label: 'Buscar existente' },
                            ]}
                        />
                    </Group>

                    {selectedStudent && studentMode === 'search' ? (
                        <Alert color="green" icon={<IconCheck />} title="Aluno selecionado">
                            <Text fw={600}>{selectedStudent.name}</Text>
                            <Button size="xs" variant="subtle" mt="xs" onClick={() => onSelectStudent(null)}>
                                Alterar
                            </Button>
                        </Alert>
                    ) : studentMode === 'search' ? (
                        <Stack gap="sm">
                            <TextInput
                                placeholder="Buscar aluno por nome..."
                                leftSection={<IconSearch size={16} />}
                                value={searchQuery}
                                onChange={(e) => {
                                    onSearchQueryChange(e.currentTarget.value);
                                    setActiveSearch('student');
                                }}
                            />
                            {searchLoading && <Center><Loader size="sm" /></Center>}
                            {searchResults.length > 0 && activeSearch === 'student' && (
                                <Stack gap="xs">
                                    {searchResults.map((p: PersonResult) => (
                                        <Card
                                            key={p.id}
                                            padding="sm"
                                            withBorder
                                            radius="sm"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => onSelectStudent(p)}
                                        >
                                            <Group justify="space-between">
                                                <Text fw={600} size="sm">{p.name}</Text>
                                                <Button size="xs" variant="light">Selecionar</Button>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    ) : (
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <TextInput label="Nome *" placeholder="Nome" {...studentForm.getInputProps('firstName')} />
                            <TextInput label="Sobrenome" placeholder="Sobrenome" {...studentForm.getInputProps('lastName')} />
                            <TextInput label="Data de Nascimento" placeholder="DD/MM/AAAA" type="date" {...studentForm.getInputProps('birthDate')} />
                            <Select
                                label="Gênero"
                                placeholder="Selecione"
                                data={[
                                    { value: 'male', label: 'Masculino' },
                                    { value: 'female', label: 'Feminino' },
                                    { value: 'other', label: 'Outro' },
                                    { value: 'prefer_not_to_say', label: 'Prefiro não informar' },
                                ]}
                                {...studentForm.getInputProps('gender')}
                            />
                            <TextInput label="E-mail" placeholder="email@exemplo.com" {...studentForm.getInputProps('email')} />
                            <TextInput label="Telefone" placeholder="(XX) XXXXX-XXXX" {...studentForm.getInputProps('phone')} />
                        </SimpleGrid>
                    )}
                </Paper>
            )}
        </Stack>
    );
}

// ============================================================================
// STEP 4: PAYMENT PLAN
// ============================================================================

function StepPayment({
    selectedClass, courseType, paymentPlan, installmentCount, discountPercent,
    onInstallmentCountChange, onDiscountPercentChange, fmt,
}: any) {
    if (!selectedClass) return null;

    const monthlyPrice = selectedClass.monthlyPrice || courseType?.defaultMonthlyPrice || 0;

    return (
        <Stack gap="lg">
            <Text fw={600} size="lg">Plano de Pagamento</Text>

            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="lg" withBorder radius="md">
                        <Stack gap="md">
                            <div>
                                <Text size="sm" c="dimmed" mb={4}>Mensalidade base</Text>
                                <Text size="xl" fw={700} c="blue">{fmt(monthlyPrice)}</Text>
                            </div>

                            <Divider />

                            <div>
                                <Text size="sm" fw={600} mb="xs">Número de parcelas</Text>
                                <SegmentedControl
                                    fullWidth
                                    value={String(installmentCount)}
                                    onChange={(v) => onInstallmentCountChange(Number(v))}
                                    data={[
                                        { value: '1', label: 'À vista' },
                                        { value: '6', label: '6x' },
                                        { value: '10', label: '10x' },
                                        { value: '12', label: '12x' },
                                    ]}
                                />
                            </div>

                            <div>
                                <Text size="sm" fw={600} mb="xs">
                                    Desconto: {discountPercent}%
                                </Text>
                                <Slider
                                    value={discountPercent}
                                    onChange={onDiscountPercentChange}
                                    min={0}
                                    max={30}
                                    step={5}
                                    marks={[
                                        { value: 0, label: '0%' },
                                        { value: 5, label: '5%' },
                                        { value: 10, label: '10%' },
                                        { value: 15, label: '15%' },
                                        { value: 20, label: '20%' },
                                        { value: 30, label: '30%' },
                                    ]}
                                    styles={{ markLabel: { fontSize: 10 } }}
                                />
                            </div>
                        </Stack>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    {paymentPlan ? (
                        <Paper p="lg" withBorder radius="md" style={{ background: 'var(--mantine-color-dark-7, var(--mantine-color-gray-0))' }}>
                            <Text fw={700} mb="md" size="lg">Resumo Financeiro</Text>
                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm">Mensalidade × {paymentPlan.durationMonths} meses</Text>
                                    <Text size="sm">{fmt(paymentPlan.grossTuition)}</Text>
                                </Group>
                                {paymentPlan.discountAmount > 0 && (
                                    <Group justify="space-between">
                                        <Text size="sm" c="green">Desconto ({paymentPlan.discountPercent}%)</Text>
                                        <Text size="sm" c="green" fw={600}>-{fmt(paymentPlan.discountAmount)}</Text>
                                    </Group>
                                )}
                                <Divider />
                                <Group justify="space-between">
                                    <Text fw={700}>Total</Text>
                                    <Text fw={700} size="lg" c="blue">{fmt(paymentPlan.netTotal)}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">{paymentPlan.installmentCount}× parcelas de</Text>
                                    <Text fw={600}>{fmt(paymentPlan.installmentValue)}</Text>
                                </Group>
                            </Stack>

                            <Divider my="md" />
                            <Text size="sm" fw={600} mb="xs">Cronograma de Parcelas</Text>
                            <ScrollArea h={200}>
                                <Stack gap={4}>
                                    {paymentPlan.installments.map((inst: any) => (
                                        <Group key={inst.number} justify="space-between">
                                            <Text size="xs">Parcela {inst.number}/{paymentPlan.installmentCount}</Text>
                                            <Text size="xs" c="dimmed">{inst.dueDate}</Text>
                                            <Text size="xs" fw={600}>{fmt(inst.amount)}</Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </ScrollArea>
                        </Paper>
                    ) : (
                        <Center py="xl"><Loader /></Center>
                    )}
                </Grid.Col>
            </Grid>
        </Stack>
    );
}

// ============================================================================
// STEP 5: CONTRACT REVIEW + SUBMIT
// ============================================================================

function StepContract({
    selectedClass, courseType, selectedParent, selectedStudent, sameAsPerson,
    parentForm, studentForm, paymentPlan, signatureProvider,
    onSignatureProviderChange, fmt, fmtCpf, isSubmitting, onSubmit,
}: any) {
    const parentName = selectedParent
        ? selectedParent.name
        : [parentForm.values.firstName, parentForm.values.lastName].filter(Boolean).join(' ');

    const studentName = sameAsPerson
        ? parentName
        : (selectedStudent ? selectedStudent.name : [studentForm.values.firstName, studentForm.values.lastName].filter(Boolean).join(' '));

    const parentCpf = selectedParent?.taxId || parentForm.values.taxId;

    return (
        <Stack gap="lg">
            <Text fw={600} size="lg">Revisão Final e Assinatura</Text>

            {/* Summary */}
            <Paper p="lg" withBorder radius="md">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Turma</Text>
                        <Text fw={700}>{selectedClass?.name}</Text>
                        {selectedClass?.level && <Badge size="sm" variant="light">{selectedClass.level.name}</Badge>}
                    </div>
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Mensalidade</Text>
                        <Text fw={700} c="blue">
                            {fmt(selectedClass?.monthlyPrice || courseType?.defaultMonthlyPrice || 0)}
                        </Text>
                    </div>
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Responsável</Text>
                        <Text fw={700}>{parentName}</Text>
                        {parentCpf && <Text size="sm" c="dimmed">CPF: {fmtCpf(parentCpf)}</Text>}
                    </div>
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Aluno(a)</Text>
                        <Text fw={700}>{studentName}</Text>
                    </div>
                    {paymentPlan && (
                        <>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Contrato</Text>
                                <Text fw={700} size="lg" c="blue">{fmt(paymentPlan.netTotal)}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Parcelas</Text>
                                <Text fw={700}>{paymentPlan.installmentCount}× de {fmt(paymentPlan.installmentValue)}</Text>
                            </div>
                        </>
                    )}
                </SimpleGrid>
            </Paper>

            {/* Signature method */}
            <Paper p="lg" withBorder radius="md">
                <Text fw={600} mb="md">Método de Assinatura</Text>
                <SegmentedControl
                    fullWidth
                    value={signatureProvider}
                    onChange={onSignatureProviderChange}
                    data={[
                        { value: 'in_person', label: '✍️ Presencial' },
                        { value: 'zapsign', label: '📱 ZapSign' },
                        { value: 'd4sign', label: '📄 D4Sign' },
                        { value: 'gov_br', label: '🏛️ Gov.br' },
                    ]}
                />
                <Text size="xs" c="dimmed" mt="xs">
                    {signatureProvider === 'in_person'
                        ? 'O contrato será impresso e assinado presencialmente.'
                        : 'O contrato será enviado para assinatura digital.'}
                </Text>
            </Paper>

            {/* Submit info */}
            <Alert
                icon={<IconFileDescription size={20} />}
                title="O que acontece ao finalizar"
                color="blue"
                variant="light"
            >
                <Stack gap={4}>
                    <Text size="sm">✓ Matrícula do aluno será criada</Text>
                    <Text size="sm">✓ Contrato será gerado com as cláusulas padrão</Text>
                    <Text size="sm">✓ {paymentPlan?.installmentCount || 12} faturas serão criadas</Text>
                    <Text size="sm">✓ Vínculo familiar será registrado</Text>
                    <Text size="sm">✓ Vaga na turma será reservada</Text>
                    <Text size="sm">✓ 2 gestores serão notificados</Text>
                </Stack>
            </Alert>
        </Stack>
    );
}

// ============================================================================
// STEP COMPLETED
// ============================================================================

function StepCompleted({ result, fmt }: { result: any; fmt: (v: number) => string }) {
    if (!result) return null;

    return (
        <Stack gap="lg" align="center" py="xl">
            <ThemeIcon size={80} radius="xl" color="green" variant="light">
                <IconConfetti size={40} />
            </ThemeIcon>
            <Title order={2} ta="center" c="green">Matrícula Realizada com Sucesso!</Title>
            <Text c="dimmed" ta="center" maw={500}>
                Todos os registros foram criados. O contrato está pronto para assinatura e as faturas foram geradas.
            </Text>

            <Paper p="lg" withBorder radius="md" w="100%" maw={600}>
                <SimpleGrid cols={2} spacing="md">
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase">Aluno</Text>
                        <Text fw={700}>{result.student?.name}</Text>
                    </div>
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase">Responsável</Text>
                        <Text fw={700}>{result.parent?.name}</Text>
                    </div>
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase">Contrato</Text>
                        <Badge color="blue" variant="light">{result.contract?.contractNumber}</Badge>
                    </div>
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase">Faturas</Text>
                        <Text fw={700}>{result.invoices?.length || 0} parcelas geradas</Text>
                    </div>
                </SimpleGrid>
            </Paper>

            <Group mt="md">
                <Button component="a" href="/admin/operacional/matriculas" variant="light">
                    Ver Matrículas
                </Button>
                <Button
                    component="a"
                    href={`/admin/operacional/contratos`}
                    variant="light"
                    color="violet"
                >
                    Ver Contrato
                </Button>
                <Button component="a" href="/admin/operacional/matriculas/nova" color="green">
                    Nova Matrícula
                </Button>
            </Group>
        </Stack>
    );
}
