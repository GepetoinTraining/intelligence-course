'use client';

import { useState } from 'react';
import {
    Title,
    Text,
    Card,
    Stack,
    Group,
    Badge,
    Avatar,
    Paper,
    Button,
    TextInput,
    Textarea,
    Select,
    ActionIcon,
    Timeline,
    Tabs,
    Divider,
    ThemeIcon,
    Modal,
    SimpleGrid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconArrowLeft,
    IconPhone,
    IconMail,
    IconBrandWhatsapp,
    IconCalendarEvent,
    IconEdit,
    IconCheck,
    IconX,
    IconUser,
    IconNote,
    IconMessage,
    IconClock,
    IconPlus,
    IconMapPin,
    IconSchool,
} from '@tabler/icons-react';
import Link from 'next/link';

// Mock lead data
const lead = {
    id: '1',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '(11) 99999-1111',
    whatsapp: '(11) 99999-1111',
    status: 'qualified',
    source: 'instagram',
    sourceDetail: '@nodezero post about AI',
    interest: ['English A1', 'Intelligence'],
    currentLevel: 'Beginner',
    preferredSchedule: 'Manhã ou tarde',
    notes: 'Interessada em começar o quanto antes. Mora perto da escola.',
    assignedTo: 'Carlos',
    // Referral tracking
    referredBy: {
        id: 'ref-001',
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        phone: '(11) 99999-4444',
        type: 'student', // student | parent | external
        studentId: 'student-004',
        tier: 'Silver',
        referralDate: '2025-01-25',
        creditStatus: 'pending', // pending | credited | paid
        creditAmount: 50,
    },
    referralChain: [
        { name: 'Pedro Costa', type: 'student', date: '2025-01-25' },
    ],
    referralsGenerated: 0,
    createdAt: '2025-01-28',
    lastContactAt: '2025-01-30',
    nextFollowupAt: '2025-02-02',
    utmSource: 'instagram',
    utmMedium: 'social',
    utmCampaign: 'jan_promotion',
};

const interactions = [
    {
        id: '1',
        type: 'whatsapp',
        direction: 'outgoing',
        subject: 'Primeiro contato',
        content: 'Olá Maria! Vi que você se interessou pelo nosso curso de inglês. Posso te ajudar?',
        outcome: 'Respondeu com interesse',
        createdAt: '30 Jan 2025, 10:30',
        createdBy: 'Carlos',
    },
    {
        id: '2',
        type: 'whatsapp',
        direction: 'incoming',
        subject: 'Resposta',
        content: 'Oi! Sim, gostaria de saber mais sobre os horários e preços.',
        outcome: null,
        createdAt: '30 Jan 2025, 14:15',
        createdBy: null,
    },
    {
        id: '3',
        type: 'call',
        direction: 'outgoing',
        subject: 'Ligação para qualificação',
        content: 'Conversamos sobre disponibilidade de horários. Ela prefere manhã ou início da tarde.',
        outcome: 'Qualificada - agendar trial',
        createdAt: '30 Jan 2025, 15:00',
        createdBy: 'Carlos',
    },
];

const trials = [
    {
        id: '1',
        scheduledDate: '2025-02-03',
        scheduledTime: '10:00',
        classId: 'English A1 - Turma 3',
        roomId: 'Sala 1',
        status: 'scheduled',
        notes: 'Aula experimental com a turma da Prof. Ana',
    },
];

const statusOptions = [
    { value: 'new', label: 'Novo' },
    { value: 'contacted', label: 'Contatado' },
    { value: 'qualified', label: 'Qualificado' },
    { value: 'trial_scheduled', label: 'Trial Agendado' },
    { value: 'trial_completed', label: 'Trial Feito' },
    { value: 'proposal_sent', label: 'Proposta Enviada' },
    { value: 'enrolled', label: 'Matriculado' },
    { value: 'lost', label: 'Perdido' },
];

const interactionIcons: Record<string, any> = {
    whatsapp: IconBrandWhatsapp,
    call: IconPhone,
    email: IconMail,
    note: IconNote,
    meeting: IconUser,
};

const interactionColors: Record<string, string> = {
    whatsapp: 'green',
    call: 'blue',
    email: 'violet',
    note: 'gray',
    meeting: 'orange',
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
    const [status, setStatus] = useState(lead.status);
    const [interactionOpened, { open: openInteraction, close: closeInteraction }] = useDisclosure(false);
    const [trialOpened, { open: openTrial, close: closeTrial }] = useDisclosure(false);
    const [convertOpened, { open: openConvert, close: closeConvert }] = useDisclosure(false);
    const [newInteraction, setNewInteraction] = useState({
        type: 'whatsapp',
        direction: 'outgoing',
        subject: '',
        content: '',
        outcome: '',
    });

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <ActionIcon
                        variant="subtle"
                        component={Link}
                        href="/staff/leads"
                        size="lg"
                    >
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                    <Avatar size="xl" color="blue" radius="xl">
                        {lead.name.charAt(0)}
                    </Avatar>
                    <div>
                        <Title order={1}>{lead.name}</Title>
                        <Group gap="sm" mt="xs">
                            <Badge color="pink" variant="light">Instagram</Badge>
                            <Badge
                                color={statusOptions.find(s => s.value === status)?.value === 'enrolled' ? 'green' : 'blue'}
                                variant="filled"
                            >
                                {statusOptions.find(s => s.value === status)?.label}
                            </Badge>
                        </Group>
                    </div>
                </Group>
                <Group>
                    <Button
                        variant="light"
                        color="green"
                        leftSection={<IconBrandWhatsapp size={18} />}
                    >
                        WhatsApp
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconCalendarEvent size={18} />}
                        onClick={openTrial}
                    >
                        Agendar Trial
                    </Button>
                    <Button
                        color="green"
                        leftSection={<IconCheck size={18} />}
                        onClick={openConvert}
                    >
                        Matricular
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
                {/* Contact Info */}
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Title order={4} mb="md">Informações de Contato</Title>

                    <Stack gap="sm">
                        <Group>
                            <ThemeIcon variant="light" color="blue">
                                <IconMail size={16} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Email</Text>
                                <Text size="sm">{lead.email}</Text>
                            </div>
                        </Group>

                        <Group>
                            <ThemeIcon variant="light" color="blue">
                                <IconPhone size={16} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Telefone</Text>
                                <Text size="sm">{lead.phone}</Text>
                            </div>
                        </Group>

                        <Group>
                            <ThemeIcon variant="light" color="green">
                                <IconBrandWhatsapp size={16} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">WhatsApp</Text>
                                <Text size="sm">{lead.whatsapp}</Text>
                            </div>
                        </Group>

                        <Divider my="sm" />

                        <Group>
                            <ThemeIcon variant="light" color="violet">
                                <IconSchool size={16} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Interesse</Text>
                                <Group gap="xs" mt={2}>
                                    {lead.interest.map(i => (
                                        <Badge key={i} size="sm" variant="light">
                                            {i}
                                        </Badge>
                                    ))}
                                </Group>
                            </div>
                        </Group>

                        <Group>
                            <ThemeIcon variant="light" color="orange">
                                <IconClock size={16} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Horário Preferido</Text>
                                <Text size="sm">{lead.preferredSchedule}</Text>
                            </div>
                        </Group>
                    </Stack>
                </Card>

                {/* Status & Assignment */}
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Title order={4} mb="md">Status & Atribuição</Title>

                    <Stack gap="md">
                        <Select
                            label="Status"
                            value={status}
                            onChange={(v) => setStatus(v || 'new')}
                            data={statusOptions}
                        />

                        <Select
                            label="Responsável"
                            defaultValue="carlos"
                            data={[
                                { value: 'carlos', label: 'Carlos' },
                                { value: 'julia', label: 'Julia' },
                                { value: 'marina', label: 'Marina' },
                            ]}
                        />

                        <Divider my="xs" />

                        <div>
                            <Text size="xs" c="dimmed">Criado em</Text>
                            <Text size="sm">{lead.createdAt}</Text>
                        </div>

                        <div>
                            <Text size="xs" c="dimmed">Último contato</Text>
                            <Text size="sm">{lead.lastContactAt}</Text>
                        </div>

                        <div>
                            <Text size="xs" c="dimmed">Próximo follow-up</Text>
                            <Text size="sm" fw={500} c="orange">{lead.nextFollowupAt}</Text>
                        </div>
                    </Stack>
                </Card>

                {/* Notes & UTM */}
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Title order={4} mb="md">Notas & Rastreamento</Title>

                    <Stack gap="md">
                        <div>
                            <Text size="xs" c="dimmed" mb="xs">Observações</Text>
                            <Paper p="sm" withBorder radius="sm">
                                <Text size="sm">{lead.notes}</Text>
                            </Paper>
                        </div>

                        <Divider my="xs" />

                        <div>
                            <Text size="xs" c="dimmed">Origem Detalhada</Text>
                            <Text size="sm">{lead.sourceDetail}</Text>
                        </div>

                        <SimpleGrid cols={3}>
                            <div>
                                <Text size="xs" c="dimmed">UTM Source</Text>
                                <Badge size="xs" variant="light">{lead.utmSource}</Badge>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">UTM Medium</Text>
                                <Badge size="xs" variant="light">{lead.utmMedium}</Badge>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">UTM Campaign</Text>
                                <Badge size="xs" variant="light">{lead.utmCampaign}</Badge>
                            </div>
                        </SimpleGrid>
                    </Stack>
                </Card>
            </SimpleGrid>

            {/* Referral Tracking Section */}
            {lead.referredBy && (
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Title order={4} mb="md">🔗 Rastreamento de Indicação</Title>

                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                        {/* Referrer Info */}
                        <Paper p="md" withBorder radius="md" bg="green.0">
                            <Text size="xs" c="dimmed" mb="xs">Indicado por</Text>
                            <Group mb="sm">
                                <Avatar color="green" radius="xl">
                                    {lead.referredBy.name.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text fw={600}>{lead.referredBy.name}</Text>
                                    <Badge size="xs" color="green" variant="light">
                                        {lead.referredBy.type === 'student' ? 'Aluno' :
                                            lead.referredBy.type === 'parent' ? 'Responsável' : 'Externo'}
                                    </Badge>
                                </div>
                            </Group>
                            <Stack gap={4}>
                                <Group gap="xs">
                                    <IconMail size={14} />
                                    <Text size="sm">{lead.referredBy.email}</Text>
                                </Group>
                                <Group gap="xs">
                                    <IconPhone size={14} />
                                    <Text size="sm">{lead.referredBy.phone}</Text>
                                </Group>
                            </Stack>
                            <Divider my="sm" />
                            <Group justify="space-between">
                                <Text size="xs" c="dimmed">Tier</Text>
                                <Badge color="yellow" variant="light">{lead.referredBy.tier}</Badge>
                            </Group>
                        </Paper>

                        {/* Credit Info */}
                        <Paper p="md" withBorder radius="md">
                            <Text size="xs" c="dimmed" mb="sm">Status do Crédito</Text>
                            <Stack gap="sm">
                                <Group justify="space-between">
                                    <Text size="sm">Valor do crédito</Text>
                                    <Text fw={700} c="green" size="lg">R$ {lead.referredBy.creditAmount}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm">Status</Text>
                                    <Badge
                                        color={
                                            lead.referredBy.creditStatus === 'paid' ? 'green' :
                                                lead.referredBy.creditStatus === 'credited' ? 'blue' : 'yellow'
                                        }
                                    >
                                        {lead.referredBy.creditStatus === 'paid' ? '✅ Pago' :
                                            lead.referredBy.creditStatus === 'credited' ? '📝 Creditado' : '⏳ Pendente'}
                                    </Badge>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm">Data da indicação</Text>
                                    <Text size="sm" c="dimmed">{lead.referredBy.referralDate}</Text>
                                </Group>
                                {lead.referredBy.creditStatus === 'pending' && (
                                    <Button size="xs" variant="light" color="green" mt="sm">
                                        Creditar Agora
                                    </Button>
                                )}
                            </Stack>
                        </Paper>

                        {/* Referral Chain */}
                        <Paper p="md" withBorder radius="md">
                            <Text size="xs" c="dimmed" mb="sm">Cadeia de Indicação</Text>
                            <Timeline active={-1} bulletSize={20} lineWidth={2}>
                                {lead.referralChain.map((ref, i) => (
                                    <Timeline.Item
                                        key={i}
                                        bullet={<IconUser size={12} />}
                                        title={ref.name}
                                    >
                                        <Text size="xs" c="dimmed">
                                            {ref.type === 'student' ? 'Aluno' :
                                                ref.type === 'parent' ? 'Responsável' : 'Externo'} • {ref.date}
                                        </Text>
                                    </Timeline.Item>
                                ))}
                                <Timeline.Item
                                    bullet={<IconCheck size={12} />}
                                    title={lead.name}
                                    color="blue"
                                >
                                    <Text size="xs" c="dimmed">Lead atual</Text>
                                </Timeline.Item>
                            </Timeline>
                        </Paper>
                    </SimpleGrid>
                </Card>
            )}

            {/* Tabs: Interactions & Trials */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Tabs defaultValue="interactions">
                    <Tabs.List>
                        <Tabs.Tab value="interactions" leftSection={<IconMessage size={16} />}>
                            Interações ({interactions.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="trials" leftSection={<IconCalendarEvent size={16} />}>
                            Trials ({trials.length})
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="interactions" pt="md">
                        <Group justify="flex-end" mb="md">
                            <Button
                                size="sm"
                                leftSection={<IconPlus size={16} />}
                                onClick={openInteraction}
                            >
                                Nova Interação
                            </Button>
                        </Group>

                        <Timeline active={-1} bulletSize={24} lineWidth={2}>
                            {interactions.map((interaction) => {
                                const Icon = interactionIcons[interaction.type] || IconNote;
                                return (
                                    <Timeline.Item
                                        key={interaction.id}
                                        bullet={<Icon size={12} />}
                                        color={interactionColors[interaction.type]}
                                        title={
                                            <Group gap="sm">
                                                <Text fw={500}>{interaction.subject}</Text>
                                                <Badge
                                                    size="xs"
                                                    variant="light"
                                                    color={interaction.direction === 'incoming' ? 'teal' : 'blue'}
                                                >
                                                    {interaction.direction === 'incoming' ? 'Recebido' : 'Enviado'}
                                                </Badge>
                                            </Group>
                                        }
                                    >
                                        <Paper p="sm" withBorder radius="sm" mt="xs">
                                            <Text size="sm">{interaction.content}</Text>
                                            {interaction.outcome && (
                                                <Badge mt="xs" color="green" variant="light">
                                                    {interaction.outcome}
                                                </Badge>
                                            )}
                                        </Paper>
                                        <Text size="xs" c="dimmed" mt="xs">
                                            {interaction.createdAt}
                                            {interaction.createdBy && ` • por ${interaction.createdBy}`}
                                        </Text>
                                    </Timeline.Item>
                                );
                            })}
                        </Timeline>
                    </Tabs.Panel>

                    <Tabs.Panel value="trials" pt="md">
                        <Group justify="flex-end" mb="md">
                            <Button
                                size="sm"
                                leftSection={<IconPlus size={16} />}
                                onClick={openTrial}
                            >
                                Agendar Trial
                            </Button>
                        </Group>

                        <Stack gap="md">
                            {trials.map((trial) => (
                                <Paper key={trial.id} p="md" withBorder radius="md">
                                    <Group justify="space-between">
                                        <div>
                                            <Group gap="sm">
                                                <Text fw={600}>
                                                    {trial.scheduledDate} às {trial.scheduledTime}
                                                </Text>
                                                <Badge
                                                    color={trial.status === 'scheduled' ? 'blue' : 'green'}
                                                >
                                                    {trial.status === 'scheduled' ? 'Agendado' : 'Concluído'}
                                                </Badge>
                                            </Group>
                                            <Text size="sm" c="dimmed" mt="xs">
                                                {trial.classId} • {trial.roomId}
                                            </Text>
                                            <Text size="sm" mt="xs">{trial.notes}</Text>
                                        </div>
                                        <Group>
                                            <Button variant="light" size="xs">Editar</Button>
                                            <Button variant="light" size="xs" color="red">Cancelar</Button>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Card>

            {/* New Interaction Modal */}
            <Modal
                opened={interactionOpened}
                onClose={closeInteraction}
                title="Registrar Interação"
                size="md"
            >
                <Stack>
                    <Group grow>
                        <Select
                            label="Tipo"
                            value={newInteraction.type}
                            onChange={(v) => setNewInteraction({ ...newInteraction, type: v || 'whatsapp' })}
                            data={[
                                { value: 'whatsapp', label: 'WhatsApp' },
                                { value: 'call', label: 'Ligação' },
                                { value: 'email', label: 'Email' },
                                { value: 'meeting', label: 'Reunião' },
                                { value: 'note', label: 'Nota' },
                            ]}
                        />
                        <Select
                            label="Direção"
                            value={newInteraction.direction}
                            onChange={(v) => setNewInteraction({ ...newInteraction, direction: v || 'outgoing' })}
                            data={[
                                { value: 'outgoing', label: 'Enviado' },
                                { value: 'incoming', label: 'Recebido' },
                            ]}
                        />
                    </Group>
                    <TextInput
                        label="Assunto"
                        value={newInteraction.subject}
                        onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })}
                    />
                    <Textarea
                        label="Conteúdo"
                        rows={4}
                        value={newInteraction.content}
                        onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })}
                    />
                    <TextInput
                        label="Resultado/Próximos passos"
                        value={newInteraction.outcome}
                        onChange={(e) => setNewInteraction({ ...newInteraction, outcome: e.target.value })}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeInteraction}>Cancelar</Button>
                        <Button onClick={closeInteraction}>Salvar</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Schedule Trial Modal */}
            <Modal
                opened={trialOpened}
                onClose={closeTrial}
                title="Agendar Trial"
                size="md"
            >
                <Stack>
                    <TextInput label="Data" type="date" required />
                    <TextInput label="Horário" type="time" required />
                    <Select
                        label="Turma"
                        placeholder="Selecione a turma"
                        data={[
                            { value: 'english_a1_1', label: 'English A1 - Turma 1 (Seg/Qua 10h)' },
                            { value: 'english_a1_2', label: 'English A1 - Turma 2 (Ter/Qui 14h)' },
                            { value: 'english_a1_3', label: 'English A1 - Turma 3 (Seg/Qua 16h)' },
                        ]}
                    />
                    <Select
                        label="Sala"
                        placeholder="Selecione a sala"
                        data={[
                            { value: 'sala1', label: 'Sala 1' },
                            { value: 'sala2', label: 'Sala 2' },
                            { value: 'lab', label: 'Lab' },
                            { value: 'online', label: 'Online' },
                        ]}
                    />
                    <Textarea label="Observações" rows={2} />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeTrial}>Cancelar</Button>
                        <Button onClick={closeTrial}>Agendar</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Convert Modal */}
            <Modal
                opened={convertOpened}
                onClose={closeConvert}
                title="Matricular Aluno"
                size="md"
            >
                <Stack>
                    <Text size="sm">
                        Ao confirmar, será criada uma conta de aluno para <strong>{lead.name}</strong> e
                        você poderá realizar a matrícula em uma turma.
                    </Text>
                    <Select
                        label="Turma para matrícula"
                        placeholder="Selecione a turma"
                        data={[
                            { value: 'english_a1_1', label: 'English A1 - Turma 1 (Seg/Qua 10h)' },
                            { value: 'english_a1_2', label: 'English A1 - Turma 2 (Ter/Qui 14h)' },
                            { value: 'english_a1_3', label: 'English A1 - Turma 3 (Seg/Qua 16h)' },
                        ]}
                        required
                    />
                    <TextInput label="Data de início" type="date" />
                    <Textarea label="Observações da matrícula" rows={2} />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeConvert}>Cancelar</Button>
                        <Button color="green" onClick={closeConvert}>Confirmar Matrícula</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
