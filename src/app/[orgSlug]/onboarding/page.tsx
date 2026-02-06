'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useOrg } from '@/components/OrgContext';
import {
    Container, Title, Text, Card, SimpleGrid, Stack, Group, Button,
    ThemeIcon, Badge, Stepper, TextInput, Textarea, Alert, Box,
    Avatar, Paper, Divider, List
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
        description: 'Quero fazer cursos nesta escola',
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
        description: 'Quero dar aulas nesta escola',
        icon: IconSchool,
        color: 'blue',
        autoApproved: false,
        approver: 'Coordenador ou Admin',
    },
    {
        id: 'staff',
        label: 'Equipe',
        description: 'Trabalho na equipe da escola',
        icon: IconClipboard,
        color: 'cyan',
        autoApproved: false,
        approver: 'Admin',
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
];

export default function OrgOnboardingPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const org = useOrg();
    const [step, setStep] = useState(0);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [additionalInfo, setAdditionalInfo] = useState({
        phone: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const selectedRoleData = ROLES.find(r => r.id === selectedRole);
    const primaryColor = org.primaryColor || '#7048e8';

    const handleSubmit = async () => {
        if (!selectedRole || !user) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/org/${org.slug}/onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.emailAddresses[0]?.emailAddress,
                    name: user.fullName || user.firstName,
                    organizationId: org.id,
                    requestedRole: selectedRole,
                    phone: additionalInfo.phone,
                    message: additionalInfo.message,
                }),
            });

            if (response.ok) {
                const { autoApproved } = await response.json();
                if (autoApproved) {
                    // Redirect to org dashboard
                    router.push(`/${org.slug}`);
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
            <Box bg="dark.9" mih="100vh">
                <Container size="sm" py="xl">
                    <Card bg="dark.7" radius="lg" p="xl">
                        <Stack align="center" gap="lg">
                            <ThemeIcon size={64} radius="xl" variant="light" color="blue">
                                <IconClock size={32} />
                            </ThemeIcon>
                            <Title order={2} c="white" ta="center">
                                Solicitação Enviada!
                            </Title>
                            <Text c="gray.4" ta="center" maw={400}>
                                Sua solicitação de acesso como <strong>{selectedRoleData?.label}</strong> em{' '}
                                <strong>{org.displayName || org.name}</strong> foi enviada.
                            </Text>
                            <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                                <Text size="sm">
                                    Um <strong>{selectedRoleData?.approver}</strong> irá revisar sua solicitação.
                                    Você receberá um email quando for aprovado.
                                </Text>
                            </Alert>
                            <Button
                                variant="light"
                                onClick={() => router.push(`/${org.slug}`)}
                            >
                                Voltar para {org.name}
                            </Button>
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
                    <Stack align="center" gap="sm">
                        <Group gap="xs">
                            <ThemeIcon size={32} radius="md" style={{ background: primaryColor }}>
                                <IconSchool size={18} />
                            </ThemeIcon>
                            <Text size="lg" fw={700} c="white">{org.displayName || org.name}</Text>
                        </Group>
                        <Title order={1} c="white" ta="center" size="xl">
                            Junte-se a nós!
                        </Title>
                        <Text c="gray.5" ta="center" size="sm">
                            Configure seu perfil em {org.name}
                        </Text>
                    </Stack>

                    {/* User Info Card */}
                    <Card bg="dark.7" radius="lg" p="sm" mx="auto" maw={400}>
                        <Group>
                            <Avatar src={user?.imageUrl} size={40} radius="xl" />
                            <div>
                                <Text c="white" fw={500} size="sm">{user?.fullName || user?.firstName}</Text>
                                <Text size="xs" c="gray.5">
                                    {user?.emailAddresses[0]?.emailAddress}
                                </Text>
                            </div>
                        </Group>
                    </Card>

                    {/* Main Card */}
                    <Card bg="dark.7" radius="lg" p="lg">
                        <Stepper active={step} onStepClick={setStep} allowNextStepsSelect={false} color="violet" size="sm">
                            {/* Step 1: Role Selection */}
                            <Stepper.Step label="Seu Perfil" description="Escolha seu papel">
                                <Stack gap="md" mt="lg">
                                    <Title order={3} c="white" size="md">Como você vai participar?</Title>
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                        {ROLES.map((role) => (
                                            <Paper
                                                key={role.id}
                                                p="md"
                                                radius="md"
                                                bg="dark.6"
                                                style={{
                                                    cursor: 'pointer',
                                                    border: selectedRole === role.id
                                                        ? `2px solid ${primaryColor}`
                                                        : '1px solid var(--mantine-color-dark-5)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onClick={() => setSelectedRole(role.id)}
                                            >
                                                <Stack gap="xs">
                                                    <Group justify="space-between">
                                                        <ThemeIcon
                                                            size={32}
                                                            radius="md"
                                                            color={role.color}
                                                            variant={selectedRole === role.id ? 'filled' : 'light'}
                                                        >
                                                            <role.icon size={16} />
                                                        </ThemeIcon>
                                                        {selectedRole === role.id && (
                                                            <ThemeIcon size={20} radius="xl" color="green">
                                                                <IconCheck size={12} />
                                                            </ThemeIcon>
                                                        )}
                                                    </Group>
                                                    <div>
                                                        <Text c="white" fw={600} size="sm">{role.label}</Text>
                                                        <Text size="xs" c="gray.5">{role.description}</Text>
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
                                        <Alert icon={<IconShieldCheck size={16} />} color="blue" variant="light">
                                            <Text size="xs">
                                                Este perfil requer aprovação de um <strong>{selectedRoleData.approver}</strong>.
                                            </Text>
                                        </Alert>
                                    )}

                                    <Group justify="flex-end" mt="sm">
                                        <Button
                                            rightSection={<IconArrowRight size={16} />}
                                            disabled={!selectedRole}
                                            onClick={() => setStep(1)}
                                        >
                                            Continuar
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stepper.Step>

                            {/* Step 2: Additional Info */}
                            <Stepper.Step label="Contato" description="Informações adicionais">
                                <Stack gap="md" mt="lg">
                                    <Title order={3} c="white" size="md">Informações de contato</Title>

                                    <TextInput
                                        label="Telefone/WhatsApp"
                                        placeholder="(47) 99999-9999"
                                        leftSection={<IconPhone size={16} />}
                                        value={additionalInfo.phone}
                                        onChange={(e) => setAdditionalInfo(prev => ({
                                            ...prev,
                                            phone: e.target.value
                                        }))}
                                        styles={{ label: { color: 'white' } }}
                                    />

                                    {selectedRoleData && !selectedRoleData.autoApproved && (
                                        <Textarea
                                            label="Mensagem para o aprovador (opcional)"
                                            placeholder="Conte um pouco sobre você..."
                                            rows={3}
                                            value={additionalInfo.message}
                                            onChange={(e) => setAdditionalInfo(prev => ({
                                                ...prev,
                                                message: e.target.value
                                            }))}
                                            styles={{ label: { color: 'white' } }}
                                        />
                                    )}

                                    <Divider color="dark.5" />

                                    <Paper p="md" radius="md" bg="dark.6">
                                        <Stack gap="xs">
                                            <Text fw={600} c="white" size="sm">Resumo:</Text>
                                            <Group gap="xs">
                                                <Text size="sm" c="gray.4">Perfil:</Text>
                                                <Badge color={selectedRoleData?.color}>{selectedRoleData?.label}</Badge>
                                            </Group>
                                            <Group gap="xs">
                                                <Text size="sm" c="gray.4">Status:</Text>
                                                {selectedRoleData?.autoApproved ? (
                                                    <Badge color="green" size="sm">Acesso Imediato</Badge>
                                                ) : (
                                                    <Badge color="orange" size="sm">Aguardando Aprovação</Badge>
                                                )}
                                            </Group>
                                        </Stack>
                                    </Paper>

                                    <Group justify="space-between" mt="sm">
                                        <Button variant="subtle" onClick={() => setStep(0)}>
                                            Voltar
                                        </Button>
                                        <Button
                                            rightSection={<IconCheck size={16} />}
                                            loading={isSubmitting}
                                            onClick={handleSubmit}
                                            style={{ background: primaryColor }}
                                        >
                                            {selectedRoleData?.autoApproved ? 'Finalizar' : 'Enviar Solicitação'}
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
