'use client';

import { useState } from 'react';
import {
    Modal, TextInput, Select, Button, Stack, Group, Text,
    Paper, Badge, ThemeIcon, CopyButton, ActionIcon, Tooltip,
    Alert, Divider,
} from '@mantine/core';
import {
    IconUserPlus, IconMail, IconShield, IconCheck,
    IconCopy, IconSend, IconAlertCircle, IconUser,
    IconBrandWhatsapp, IconLink,
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

interface InviteTeamModalProps {
    opened: boolean;
    onClose: () => void;
    onInviteSent?: () => void;
}

interface InviteResult {
    email: string;
    role: string;
    emailSent: boolean;
    joinUrl: string;
}

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Administrador(a) — acesso total' },
    { value: 'staff', label: 'Equipe — operações e atendimento' },
    { value: 'teacher', label: 'Professor(a) — aulas e notas' },
    { value: 'accountant', label: 'Contador(a) — acesso fiscal' },
    { value: 'support', label: 'Suporte — acesso limitado' },
];

const ROLE_COLORS: Record<string, string> = {
    admin: 'violet',
    staff: 'teal',
    teacher: 'blue',
    accountant: 'green',
    support: 'gray',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function InviteTeamModal({ opened, onClose, onInviteSent }: InviteTeamModalProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<InviteResult | null>(null);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setRole(null);
        setError(null);
        setResult(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSendAnother = () => {
        resetForm();
    };

    const handleSubmit = async () => {
        if (!firstName.trim()) {
            setError('Nome é obrigatório');
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            setError('Email válido é obrigatório');
            return;
        }
        if (!role) {
            setError('Selecione um papel');
            return;
        }

        setError(null);
        setSending(true);

        try {
            const res = await fetch('/api/invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    role,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao enviar convite');
                return;
            }

            setResult({
                email: data.data.email,
                role: data.data.role,
                emailSent: data.data.emailSent,
                joinUrl: data.data.joinUrl,
            });

            onInviteSent?.();
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setSending(false);
        }
    };

    // ========================================================================
    // SUCCESS STATE
    // ========================================================================

    if (result) {
        return (
            <Modal
                opened={opened}
                onClose={handleClose}
                title={
                    <Group gap="sm">
                        <ThemeIcon size={28} radius="xl" color="green" variant="light">
                            <IconCheck size={16} />
                        </ThemeIcon>
                        <Text fw={600}>Convite Enviado!</Text>
                    </Group>
                }
                size="md"
            >
                <Stack gap="md">
                    <Paper withBorder radius="md" p="md">
                        <Group justify="space-between">
                            <div>
                                <Text fw={500}>{firstName} {lastName}</Text>
                                <Text size="sm" c="dimmed">{result.email}</Text>
                            </div>
                            <Badge color={ROLE_COLORS[result.role] || 'gray'} variant="light">
                                {ROLE_OPTIONS.find(r => r.value === result.role)?.label.split(' —')[0] || result.role}
                            </Badge>
                        </Group>
                    </Paper>

                    {result.emailSent ? (
                        <Alert
                            icon={<IconMail size={18} />}
                            color="green"
                            variant="light"
                            title="Email enviado"
                        >
                            Um email de convite foi enviado para <strong>{result.email}</strong>.
                            O convite expira em 7 dias.
                        </Alert>
                    ) : (
                        <Alert
                            icon={<IconAlertCircle size={18} />}
                            color="yellow"
                            variant="light"
                            title="Email não configurado"
                        >
                            O convite foi criado, mas o email não pôde ser enviado.
                            Compartilhe o link abaixo manualmente.
                        </Alert>
                    )}

                    {/* Shareable link */}
                    <div>
                        <Text size="sm" fw={500} mb={4}>Link de Convite</Text>
                        <Paper withBorder radius="md" p="sm">
                            <Group gap="xs">
                                <Text size="xs" c="dimmed" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {result.joinUrl}
                                </Text>
                                <CopyButton value={result.joinUrl} timeout={2000}>
                                    {({ copied, copy }) => (
                                        <Tooltip label={copied ? 'Copiado!' : 'Copiar link'}>
                                            <ActionIcon
                                                color={copied ? 'green' : 'gray'}
                                                variant="subtle"
                                                onClick={copy}
                                            >
                                                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </CopyButton>
                                <Tooltip label="Enviar via WhatsApp">
                                    <ActionIcon
                                        color="green"
                                        variant="subtle"
                                        component="a"
                                        href={`https://wa.me/?text=${encodeURIComponent(`Você foi convidado(a) para nossa equipe! Acesse: ${result.joinUrl}`)}`}
                                        target="_blank"
                                    >
                                        <IconBrandWhatsapp size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Paper>
                    </div>

                    <Divider />

                    <Group justify="space-between">
                        <Button variant="subtle" onClick={handleClose}>
                            Fechar
                        </Button>
                        <Button
                            leftSection={<IconUserPlus size={16} />}
                            onClick={handleSendAnother}
                        >
                            Convidar Outro
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        );
    }

    // ========================================================================
    // FORM STATE
    // ========================================================================

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <ThemeIcon size={28} radius="xl" color="violet" variant="light">
                        <IconUserPlus size={16} />
                    </ThemeIcon>
                    <Text fw={600}>Convidar para a Equipe</Text>
                </Group>
            }
            size="md"
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Envie um convite por email para novos membros da equipe.
                    Eles receberão um link para criar a conta e acessar a plataforma.
                </Text>

                {error && (
                    <Alert
                        icon={<IconAlertCircle size={18} />}
                        color="red"
                        variant="light"
                        withCloseButton
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                <Group grow>
                    <TextInput
                        label="Nome"
                        placeholder="João"
                        value={firstName}
                        onChange={(e) => setFirstName(e.currentTarget.value)}
                        leftSection={<IconUser size={16} />}
                        required
                    />
                    <TextInput
                        label="Sobrenome"
                        placeholder="Silva"
                        value={lastName}
                        onChange={(e) => setLastName(e.currentTarget.value)}
                    />
                </Group>

                <TextInput
                    label="Email"
                    placeholder="joao@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    leftSection={<IconMail size={16} />}
                    required
                />

                <Select
                    label="Papel na Organização"
                    placeholder="Selecione o papel"
                    value={role}
                    onChange={setRole}
                    data={ROLE_OPTIONS}
                    leftSection={<IconShield size={16} />}
                    required
                />

                {role && (
                    <Paper withBorder radius="md" p="sm" bg="violet.0">
                        <Group gap="xs">
                            <IconShield size={14} color="var(--mantine-color-violet-6)" />
                            <Text size="xs" c="violet.8">
                                {role === 'admin' && 'Administradores têm acesso total à plataforma, incluindo configurações e dados financeiros.'}
                                {role === 'staff' && 'Equipe tem acesso a operações diárias, atendimento, vendas e CRM.'}
                                {role === 'teacher' && 'Professores acessam turmas, notas, frequência e materiais didáticos.'}
                                {role === 'accountant' && 'Contadores acessam relatórios fiscais, DRE, balancete e exportações SPED.'}
                                {role === 'support' && 'Suporte tem acesso limitado para atendimento e consultas básicas.'}
                            </Text>
                        </Group>
                    </Paper>
                )}

                <Divider />

                <Group justify="flex-end">
                    <Button variant="subtle" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        leftSection={<IconSend size={16} />}
                        loading={sending}
                        onClick={handleSubmit}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        }}
                    >
                        Enviar Convite
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
