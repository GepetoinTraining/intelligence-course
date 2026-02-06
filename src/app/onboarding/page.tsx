'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
    Container, Title, Text, Card, SimpleGrid, Stack, Group, Button,
    ThemeIcon, Badge, Stepper, TextInput, Textarea, Alert, Box,
    Avatar, Paper, Divider, List, Center, Loader
} from '@mantine/core';
import {
    IconUser, IconSchool, IconUsers, IconClipboard, IconBuildingBank,
    IconTrendingUp, IconCash, IconCheck, IconClock, IconArrowRight,
    IconMail, IconPhone, IconInfoCircle, IconShieldCheck
} from '@tabler/icons-react';

// Role definitions with approval requirements
const ROLES = [
    {
        id: 'student',
        label: 'Aluno',
        description: 'Quero fazer o curso de IA',
        icon: IconUser,
        color: 'violet',
        autoApproved: true,
        approver: null,
    },
    {
        id: 'parent',
        label: 'Responsável',
        description: 'Sou responsável por um aluno',
        icon: IconUsers,
        color: 'green',
        autoApproved: true,
        approver: null,
    },
    {
        id: 'teacher',
        label: 'Professor',
        description: 'Quero dar aulas na escola',
        icon: IconSchool,
        color: 'blue',
        autoApproved: false,
        approver: 'Coordenador ou Admin',
    },
    {
        id: 'staff',
        label: 'Equipe (Sales/Marketing)',
        description: 'Trabalho na equipe comercial',
        icon: IconClipboard,
        color: 'cyan',
        autoApproved: false,
        approver: 'Gerente Comercial',
    },
    {
        id: 'admin',
        label: 'Administrador',
        description: 'Gerencio a escola',
        icon: IconBuildingBank,
        color: 'orange',
        autoApproved: false,
        approver: 'Proprietário',
    },
    {
        id: 'accountant',
        label: 'Contador',
        description: 'Cuido da contabilidade',
        icon: IconCash,
        color: 'teal',
        autoApproved: false,
        approver: 'Proprietário ou Admin',
    },
    {
        id: 'talent',
        label: 'Talent Pool',
        description: 'Busco oportunidades de trabalho',
        icon: IconTrendingUp,
        color: 'grape',
        autoApproved: true,
        approver: null,
    },
];

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoaded } = useUser();
    const [step, setStep] = useState(0);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [additionalInfo, setAdditionalInfo] = useState({
        phone: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Pre-select role from query param (e.g., ?role=talent)
    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam && ROLES.find(r => r.id === roleParam)) {
            setSelectedRole(roleParam);
        }
    }, [searchParams]);

    const selectedRoleData = ROLES.find(r => r.id === selectedRole);

    const handleSubmit = async () => {
        if (!selectedRole || !user) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.emailAddresses[0]?.emailAddress,
                    name: user.fullName || user.firstName,
                    requestedRole: selectedRole,
                    phone: additionalInfo.phone,
                    message: additionalInfo.message,
                }),
            });

            if (response.ok) {
                const { autoApproved } = await response.json();
                if (autoApproved) {
                    // Redirect to role-specific dashboard
                    const dashboardMap: Record<string, string> = {
                        student: '/student',
                        parent: '/parent',
                        teacher: '/teacher',
                        talent: '/talent',
                    };
                    router.push(dashboardMap[selectedRole] || '/student');
                } else {
                    setSubmitted(true);
                }
            }
        } catch (error) {
            console.error('Onboarding error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) {
        return null;
    }

    if (submitted) {
        return (
            <Box
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <Container size="sm" py={80}>
                    <Card shadow="xl" radius="lg" p="xl">
                        <Stack align="center" gap="lg">
                            <ThemeIcon size={80} radius="xl" color="blue" variant="light">
                                <IconClock size={40} />
                            </ThemeIcon>
                            <Title order={2} ta="center">
                                Solicitação Enviada!
                            </Title>
                            <Text c="dimmed" ta="center" maw={400}>
                                Sua solicitação de acesso como <strong>{selectedRoleData?.label}</strong> foi
                                enviada para aprovação.
                            </Text>
                            <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                                <Text size="sm">
                                    Um <strong>{selectedRoleData?.approver}</strong> irá revisar sua solicitação.
                                    Você receberá um email quando for aprovado.
                                </Text>
                            </Alert>
                            <Divider w="100%" />
                            <Text size="sm" c="dimmed">
                                Enquanto isso, você pode explorar nossa página inicial.
                            </Text>
                            <Button
                                variant="light"
                                onClick={() => router.push('/')}
                            >
                                Voltar para Home
                            </Button>
                        </Stack>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Container size="lg" py={60}>
                <Stack gap="xl">
                    {/* Header */}
                    <Stack align="center" gap="md">
                        <Badge size="lg" variant="white" color="violet">
                            Bem-vindo ao Node Zero!
                        </Badge>
                        <Title order={1} c="white" ta="center">
                            Vamos configurar sua conta
                        </Title>
                        <Text c="white" ta="center" style={{ opacity: 0.9 }}>
                            Conte-nos um pouco sobre você para personalizar sua experiência
                        </Text>
                    </Stack>

                    {/* User Info */}
                    <Card shadow="md" radius="lg" p="md" mx="auto" maw={400}>
                        <Group>
                            <Avatar src={user?.imageUrl} size={48} radius="xl" />
                            <div>
                                <Text fw={500}>{user?.fullName || user?.firstName}</Text>
                                <Text size="sm" c="dimmed">
                                    {user?.emailAddresses[0]?.emailAddress}
                                </Text>
                            </div>
                        </Group>
                    </Card>

                    {/* Main Card */}
                    <Card shadow="xl" radius="lg" p="xl">
                        <Stepper active={step} onStepClick={setStep} allowNextStepsSelect={false}>
                            {/* Step 1: Role Selection */}
                            <Stepper.Step label="Seu Perfil" description="Escolha seu papel">
                                <Stack gap="lg" mt="xl">
                                    <Title order={3}>Como você vai usar a plataforma?</Title>
                                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                                        {ROLES.map((role) => (
                                            <Paper
                                                key={role.id}
                                                p="lg"
                                                radius="md"
                                                withBorder
                                                style={{
                                                    cursor: 'pointer',
                                                    borderColor: selectedRole === role.id
                                                        ? `var(--mantine-color-${role.color}-5)`
                                                        : undefined,
                                                    borderWidth: selectedRole === role.id ? 2 : 1,
                                                    background: selectedRole === role.id
                                                        ? `var(--mantine-color-${role.color}-0)`
                                                        : undefined,
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onClick={() => setSelectedRole(role.id)}
                                            >
                                                <Stack gap="sm">
                                                    <Group justify="space-between">
                                                        <ThemeIcon
                                                            size={40}
                                                            radius="md"
                                                            color={role.color}
                                                            variant={selectedRole === role.id ? 'filled' : 'light'}
                                                        >
                                                            <role.icon size={20} />
                                                        </ThemeIcon>
                                                        {selectedRole === role.id && (
                                                            <ThemeIcon size={24} radius="xl" color="green">
                                                                <IconCheck size={14} />
                                                            </ThemeIcon>
                                                        )}
                                                    </Group>
                                                    <div>
                                                        <Text fw={600}>{role.label}</Text>
                                                        <Text size="xs" c="dimmed">{role.description}</Text>
                                                    </div>
                                                    {!role.autoApproved && (
                                                        <Badge size="xs" variant="light" color="orange">
                                                            Requer aprovação
                                                        </Badge>
                                                    )}
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </SimpleGrid>

                                    {selectedRoleData && !selectedRoleData.autoApproved && (
                                        <Alert icon={<IconShieldCheck />} color="blue" variant="light">
                                            <Text size="sm">
                                                Este perfil requer aprovação de um <strong>{selectedRoleData.approver}</strong>.
                                                Após enviar sua solicitação, você receberá acesso quando aprovado.
                                            </Text>
                                        </Alert>
                                    )}

                                    <Group justify="flex-end" mt="md">
                                        <Button
                                            size="lg"
                                            rightSection={<IconArrowRight size={18} />}
                                            disabled={!selectedRole}
                                            onClick={() => setStep(1)}
                                        >
                                            Continuar
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stepper.Step>

                            {/* Step 2: Additional Info */}
                            <Stepper.Step label="Informações" description="Dados adicionais">
                                <Stack gap="lg" mt="xl">
                                    <Title order={3}>Informações adicionais</Title>

                                    <TextInput
                                        label="Telefone/WhatsApp"
                                        placeholder="(47) 99999-9999"
                                        leftSection={<IconPhone size={16} />}
                                        value={additionalInfo.phone}
                                        onChange={(e) => setAdditionalInfo(prev => ({
                                            ...prev,
                                            phone: e.target.value
                                        }))}
                                    />

                                    {selectedRoleData && !selectedRoleData.autoApproved && (
                                        <Textarea
                                            label="Mensagem para o aprovador (opcional)"
                                            placeholder="Conte um pouco sobre você e por que deseja este acesso..."
                                            rows={4}
                                            value={additionalInfo.message}
                                            onChange={(e) => setAdditionalInfo(prev => ({
                                                ...prev,
                                                message: e.target.value
                                            }))}
                                        />
                                    )}

                                    <Divider />

                                    <Paper p="md" radius="md" bg="gray.0">
                                        <Stack gap="xs">
                                            <Text fw={600}>Resumo da solicitação:</Text>
                                            <List size="sm" spacing="xs">
                                                <List.Item>
                                                    <strong>Perfil:</strong> {selectedRoleData?.label}
                                                </List.Item>
                                                <List.Item>
                                                    <strong>Status:</strong>{' '}
                                                    {selectedRoleData?.autoApproved ? (
                                                        <Badge color="green" size="sm">Acesso Imediato</Badge>
                                                    ) : (
                                                        <Badge color="orange" size="sm">Aguardando Aprovação</Badge>
                                                    )}
                                                </List.Item>
                                                {!selectedRoleData?.autoApproved && (
                                                    <List.Item>
                                                        <strong>Aprovador:</strong> {selectedRoleData?.approver}
                                                    </List.Item>
                                                )}
                                            </List>
                                        </Stack>
                                    </Paper>

                                    <Group justify="space-between" mt="md">
                                        <Button
                                            variant="subtle"
                                            onClick={() => setStep(0)}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            size="lg"
                                            rightSection={<IconCheck size={18} />}
                                            loading={isSubmitting}
                                            onClick={handleSubmit}
                                        >
                                            {selectedRoleData?.autoApproved ? 'Finalizar Cadastro' : 'Enviar Solicitação'}
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stepper.Step>
                        </Stepper>
                    </Card>
                </Stack>
            </Container>
        </Box>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Center h="100vh">
                    <Loader color="white" size="xl" />
                </Center>
            </Box>
        }>
            <OnboardingContent />
        </Suspense>
    );
}
