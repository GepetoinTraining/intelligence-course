'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Group,
    Stack,
    Card,
    Badge,
    Avatar,
    Paper,
    TextInput,
    Button,
    ActionIcon,
    Tabs,
    SimpleGrid,
    Progress,
    ThemeIcon,
    Tooltip,
    Loader,
    Center,
    Box,
    Menu,
    Divider,
    RingProgress,
    Grid,
    SegmentedControl,
    Modal,
    ScrollArea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch,
    IconUsers,
    IconStar,
    IconBriefcase,
    IconCheck,
    IconX,
    IconFilter,
    IconDotsVertical,
    IconMail,
    IconPhone,
    IconDownload,
    IconEye,
    IconMessageCircle,
    IconTrendingUp,
    IconClock,
    IconSparkles,
    IconTarget,
    IconChartBar,
    IconRefresh,
} from '@tabler/icons-react';

// Skill categories for display
const SKILL_CATEGORIES: Record<string, { label: string; color: string }> = {
    'problem_solving': { label: 'Resolução de Problemas', color: 'blue' },
    'communication': { label: 'Comunicação', color: 'green' },
    'leadership': { label: 'Liderança', color: 'violet' },
    'technical': { label: 'Técnico', color: 'cyan' },
    'creativity': { label: 'Criatividade', color: 'pink' },
    'teamwork': { label: 'Trabalho em Equipe', color: 'teal' },
    'adaptability': { label: 'Adaptabilidade', color: 'orange' },
    'time_management': { label: 'Gestão do Tempo', color: 'yellow' },
    'analytical': { label: 'Análise', color: 'indigo' },
};

interface TalentProfile {
    id: string;
    userId: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
    headline: string | null;
    summary: string | null;
    status: string;
    isSearchable: boolean;
    evidenceCount: number;
    profileCompleteness: number;
    interviewCompleted: boolean;
    topSkills: { id: string; score: number }[];
    createdAt: number;
    updatedAt: number;
}

function TalentCard({ profile, onView }: { profile: TalentProfile; onView: (id: string) => void }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'green';
            case 'complete': return 'blue';
            case 'incomplete': return 'yellow';
            case 'archived': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'published': return 'Publicado';
            case 'complete': return 'Completo';
            case 'incomplete': return 'Incompleto';
            case 'archived': return 'Arquivado';
            default: return status;
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ position: 'relative', overflow: 'visible' }}>
            {/* Status Indicator */}
            <Box
                style={{
                    position: 'absolute',
                    top: -8,
                    right: 16,
                }}
            >
                <Badge
                    color={getStatusColor(profile.status)}
                    variant="filled"
                    size="sm"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                >
                    {getStatusLabel(profile.status)}
                </Badge>
            </Box>

            <Group justify="space-between" align="flex-start" mb="md">
                <Group>
                    <Avatar
                        src={profile.avatarUrl}
                        size={56}
                        radius="xl"
                        color="violet"
                        style={{
                            border: '3px solid var(--mantine-color-violet-2)',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
                        }}
                    >
                        {profile.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <Text fw={600} size="lg">{profile.name}</Text>
                        {profile.headline && (
                            <Text size="sm" c="dimmed" lineClamp={1}>{profile.headline}</Text>
                        )}
                    </div>
                </Group>

                <Menu shadow="md" width={180} position="bottom-end">
                    <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={18} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>Ações</Menu.Label>
                        <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onView(profile.id)}>
                            Ver Perfil
                        </Menu.Item>
                        <Menu.Item leftSection={<IconDownload size={14} />}>
                            Baixar CV
                        </Menu.Item>
                        <Menu.Item leftSection={<IconMessageCircle size={14} />}>
                            Enviar Mensagem
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item leftSection={<IconMail size={14} />}>
                            {profile.email || 'Sem email'}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>

            {/* Profile Completeness */}
            <Paper p="sm" bg="var(--mantine-color-gray-0)" radius="md" mb="md">
                <Group justify="space-between" mb={6}>
                    <Text size="xs" c="dimmed">Perfil Completo</Text>
                    <Text size="xs" fw={600} c={profile.profileCompleteness > 70 ? 'green' : 'orange'}>
                        {Math.round(profile.profileCompleteness)}%
                    </Text>
                </Group>
                <Progress
                    value={profile.profileCompleteness}
                    color={profile.profileCompleteness > 70 ? 'green' : profile.profileCompleteness > 40 ? 'yellow' : 'red'}
                    size="sm"
                    radius="xl"
                />
            </Paper>

            {/* Top Skills */}
            {profile.topSkills.length > 0 && (
                <Stack gap={4} mb="md">
                    <Text size="xs" c="dimmed" fw={500}>Top Competências</Text>
                    <Group gap={6}>
                        {profile.topSkills.slice(0, 4).map((skill) => {
                            const category = SKILL_CATEGORIES[skill.id] || { label: skill.id, color: 'gray' };
                            return (
                                <Tooltip key={skill.id} label={`${Math.round(skill.score * 100)}%`}>
                                    <Badge
                                        size="sm"
                                        variant="light"
                                        color={category.color}
                                        leftSection={
                                            <Box
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    background: `var(--mantine-color-${category.color}-filled)`
                                                }}
                                            />
                                        }
                                    >
                                        {category.label}
                                    </Badge>
                                </Tooltip>
                            );
                        })}
                        {profile.topSkills.length > 4 && (
                            <Badge size="sm" variant="outline" color="gray">
                                +{profile.topSkills.length - 4}
                            </Badge>
                        )}
                    </Group>
                </Stack>
            )}

            {/* Badges */}
            <Group gap={8}>
                {profile.interviewCompleted && (
                    <Tooltip label="Entrevista Completa">
                        <ThemeIcon size="sm" variant="light" color="green" radius="xl">
                            <IconCheck size={12} />
                        </ThemeIcon>
                    </Tooltip>
                )}
                {profile.isSearchable && (
                    <Tooltip label="Disponível para vagas">
                        <ThemeIcon size="sm" variant="light" color="blue" radius="xl">
                            <IconSearch size={12} />
                        </ThemeIcon>
                    </Tooltip>
                )}
                {profile.evidenceCount > 0 && (
                    <Tooltip label={`${profile.evidenceCount} documentos`}>
                        <Badge size="xs" variant="dot" color="violet">
                            {profile.evidenceCount} docs
                        </Badge>
                    </Tooltip>
                )}
            </Group>

            <Divider my="sm" />

            {/* Footer */}
            <Group justify="space-between">
                <Text size="xs" c="dimmed">
                    <IconClock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Atualizado {formatDate(profile.updatedAt)}
                </Text>
                <Button
                    size="xs"
                    variant="light"
                    color="violet"
                    onClick={() => onView(profile.id)}
                >
                    Ver Detalhes
                </Button>
            </Group>
        </Card>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon,
    color
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <Card shadow="sm" padding="lg" radius="lg" withBorder>
            <Group justify="space-between">
                <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{title}</Text>
                    <Text size="xl" fw={700} mt={4}>{value}</Text>
                    {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
                </div>
                <ThemeIcon size={48} variant="light" color={color} radius="lg">
                    {icon}
                </ThemeIcon>
            </Group>
        </Card>
    );
}

// ============================================================================
// Talent Detail Modal
// ============================================================================

interface TalentDetailModalProps {
    opened: boolean;
    onClose: () => void;
    profile: TalentProfile | null;
}

function TalentDetailModal({ opened, onClose, profile }: TalentDetailModalProps) {
    if (!profile) return null;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group>
                    <Avatar
                        src={profile.avatarUrl}
                        size={48}
                        radius="xl"
                        color="violet"
                        style={{
                            border: '3px solid var(--mantine-color-violet-2)',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
                        }}
                    >
                        {profile.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <Text fw={600} size="lg">{profile.name}</Text>
                        <Text size="sm" c="dimmed">{profile.headline || 'Profissional'}</Text>
                    </div>
                </Group>
            }
            size="lg"
            radius="lg"
        >
            <Stack gap="md">
                {/* Profile Status */}
                <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                        <Text size="sm" fw={500}>Status do Perfil</Text>
                        <Badge
                            color={profile.status === 'published' ? 'green' : profile.status === 'complete' ? 'blue' : 'yellow'}
                            variant="filled"
                        >
                            {profile.status === 'published' ? 'Publicado' : profile.status === 'complete' ? 'Completo' : 'Incompleto'}
                        </Badge>
                    </Group>
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed">Completude</Text>
                            <Text size="xs" fw={600}>{Math.round(profile.profileCompleteness)}%</Text>
                        </Group>
                        <Progress
                            value={profile.profileCompleteness}
                            color={profile.profileCompleteness > 70 ? 'green' : profile.profileCompleteness > 40 ? 'yellow' : 'red'}
                            size="md"
                            radius="xl"
                        />
                    </Stack>
                </Paper>

                {/* Contact Info */}
                <Paper p="md" radius="md" withBorder>
                    <Text size="sm" fw={500} mb="sm">Informações de Contato</Text>
                    <Stack gap="xs">
                        {profile.email && (
                            <Group gap="xs">
                                <ThemeIcon size="sm" variant="light" color="blue">
                                    <IconMail size={12} />
                                </ThemeIcon>
                                <Text size="sm">{profile.email}</Text>
                            </Group>
                        )}
                        {profile.isSearchable && (
                            <Badge size="sm" variant="light" color="green">
                                Disponível para oportunidades
                            </Badge>
                        )}
                    </Stack>
                </Paper>

                {/* Skills */}
                {profile.topSkills.length > 0 && (
                    <Paper p="md" radius="md" withBorder>
                        <Text size="sm" fw={500} mb="sm">Competências ({profile.topSkills.length})</Text>
                        <Group gap="xs">
                            {profile.topSkills.map((skill) => {
                                const category = SKILL_CATEGORIES[skill.id] || { label: skill.id, color: 'gray' };
                                return (
                                    <Badge
                                        key={skill.id}
                                        size="md"
                                        variant="light"
                                        color={category.color}
                                        rightSection={
                                            <Text size="xs" fw={600}>
                                                {Math.round(skill.score * 100)}%
                                            </Text>
                                        }
                                    >
                                        {category.label}
                                    </Badge>
                                );
                            })}
                        </Group>
                    </Paper>
                )}

                {/* Summary */}
                {profile.summary && (
                    <Paper p="md" radius="md" withBorder>
                        <Text size="sm" fw={500} mb="sm">Resumo</Text>
                        <Text size="sm" c="dimmed">{profile.summary}</Text>
                    </Paper>
                )}

                {/* Metadata */}
                <Paper p="md" radius="md" bg="var(--mantine-color-gray-0)">
                    <SimpleGrid cols={2}>
                        <div>
                            <Text size="xs" c="dimmed">Documentos</Text>
                            <Text size="sm" fw={500}>{profile.evidenceCount} enviados</Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">Entrevista</Text>
                            <Text size="sm" fw={500}>
                                {profile.interviewCompleted ? (
                                    <Badge size="sm" color="green" variant="light">Completa</Badge>
                                ) : (
                                    <Badge size="sm" color="yellow" variant="light">Pendente</Badge>
                                )}
                            </Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">Criado em</Text>
                            <Text size="sm" fw={500}>{formatDate(profile.createdAt)}</Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">Atualizado em</Text>
                            <Text size="sm" fw={500}>{formatDate(profile.updatedAt)}</Text>
                        </div>
                    </SimpleGrid>
                </Paper>

                {/* Actions */}
                <Group mt="md">
                    <Button leftSection={<IconDownload size={16} />} variant="light">
                        Baixar CV
                    </Button>
                    <Button leftSection={<IconMessageCircle size={16} />} variant="light">
                        Enviar Mensagem
                    </Button>
                    <Button leftSection={<IconTarget size={16} />} color="violet">
                        Match com Vaga
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default function TalentPoolAdminPage() {
    const [profiles, setProfiles] = useState<TalentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        loadProfiles();
    }, [statusFilter]);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') {
                params.set('status', statusFilter);
            }

            const res = await fetch(`/api/owner/talent-pool?${params}`);
            if (res.ok) {
                const data = await res.json();
                setProfiles(data.profiles || []);
                setStatusCounts(data.statusCounts || {});
            } else {
                // Mock data for development
                setProfiles(generateMockProfiles());
                setStatusCounts({
                    incomplete: 5,
                    complete: 8,
                    published: 12,
                    archived: 2,
                });
            }
        } catch (error) {
            console.error('Failed to load talent pool:', error);
            setProfiles(generateMockProfiles());
        } finally {
            setLoading(false);
        }
    };

    // Modal state
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [selectedProfile, setSelectedProfile] = useState<TalentProfile | null>(null);

    const handleViewProfile = (id: string) => {
        const profile = profiles.find(p => p.id === id);
        if (profile) {
            setSelectedProfile(profile);
            openModal();
        }
    };

    // Filter profiles by search
    const filteredProfiles = profiles.filter(p => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(searchLower) ||
            p.email?.toLowerCase().includes(searchLower) ||
            p.headline?.toLowerCase().includes(searchLower)
        );
    });

    const totalProfiles = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const publishedCount = statusCounts['published'] || 0;
    const completionRate = profiles.length > 0
        ? profiles.reduce((sum, p) => sum + p.profileCompleteness, 0) / profiles.length
        : 0;

    return (
        <Container size="xl" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="xl">
                <div>
                    <Group gap="sm" mb={4}>
                        <ThemeIcon size={40} variant="gradient" gradient={{ from: 'violet', to: 'grape' }} radius="lg">
                            <IconSparkles size={24} />
                        </ThemeIcon>
                        <Title order={2}>Talent Pool</Title>
                    </Group>
                    <Text c="dimmed" size="sm">
                        Gerencie e explore o banco de talentos da sua organização
                    </Text>
                </div>

                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={loadProfiles}
                    >
                        Atualizar
                    </Button>
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                        leftSection={<IconTarget size={16} />}
                    >
                        Match com Vaga
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <StatCard
                    title="Total de Talentos"
                    value={totalProfiles}
                    subtitle="no banco de dados"
                    icon={<IconUsers size={24} />}
                    color="violet"
                />
                <StatCard
                    title="Perfis Publicados"
                    value={publishedCount}
                    subtitle="disponíveis para vagas"
                    icon={<IconStar size={24} />}
                    color="green"
                />
                <StatCard
                    title="Completude Média"
                    value={`${Math.round(completionRate)}%`}
                    subtitle="dos perfis"
                    icon={<IconChartBar size={24} />}
                    color="blue"
                />
                <StatCard
                    title="Novos esta Semana"
                    value={Math.floor(Math.random() * 10) + 3}
                    subtitle="últimos 7 dias"
                    icon={<IconTrendingUp size={24} />}
                    color="teal"
                />
            </SimpleGrid>

            {/* Filters */}
            <Paper p="md" radius="lg" withBorder mb="lg">
                <Group justify="space-between">
                    <TextInput
                        placeholder="Buscar por nome, email ou cargo..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        w={350}
                    />

                    <SegmentedControl
                        value={statusFilter}
                        onChange={setStatusFilter}
                        data={[
                            { value: 'all', label: `Todos (${totalProfiles})` },
                            { value: 'published', label: `Publicados (${statusCounts['published'] || 0})` },
                            { value: 'complete', label: `Completos (${statusCounts['complete'] || 0})` },
                            { value: 'incomplete', label: `Incompletos (${statusCounts['incomplete'] || 0})` },
                        ]}
                    />
                </Group>
            </Paper>

            {/* Profiles Grid */}
            {loading ? (
                <Center py={80}>
                    <Stack align="center" gap="md">
                        <Loader size="lg" color="violet" />
                        <Text c="dimmed">Carregando talentos...</Text>
                    </Stack>
                </Center>
            ) : filteredProfiles.length === 0 ? (
                <Center py={80}>
                    <Stack align="center" gap="md">
                        <ThemeIcon size={64} color="gray" variant="light" radius="xl">
                            <IconUsers size={32} />
                        </ThemeIcon>
                        <Text c="dimmed">
                            {search ? 'Nenhum talento encontrado com esses critérios' : 'Nenhum talento no banco ainda'}
                        </Text>
                        <Button variant="light" color="violet">
                            Convidar Candidatos
                        </Button>
                    </Stack>
                </Center>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
                    {filteredProfiles.map((profile) => (
                        <TalentCard
                            key={profile.id}
                            profile={profile}
                            onView={handleViewProfile}
                        />
                    ))}
                </SimpleGrid>
            )}

            {/* Talent Detail Modal */}
            <TalentDetailModal
                opened={modalOpened}
                onClose={closeModal}
                profile={selectedProfile}
            />
        </Container>
    );
}

// Mock data generator for development
function generateMockProfiles(): TalentProfile[] {
    const names = [
        'Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa',
        'Carla Mendes', 'Lucas Ferreira', 'Julia Lima', 'Rafael Souza',
        'Fernanda Rocha', 'Bruno Almeida', 'Camila Ribeiro', 'Thiago Martins',
    ];
    const headlines = [
        'Senior Software Engineer', 'Product Manager', 'UX Designer',
        'Data Scientist', 'Marketing Specialist', 'Full Stack Developer',
        'DevOps Engineer', 'Business Analyst', 'Project Manager',
    ];
    const statuses = ['published', 'complete', 'incomplete'];
    const skillIds = Object.keys(SKILL_CATEGORIES);

    return names.map((name, i) => ({
        id: `profile-${i}`,
        userId: `user-${i}`,
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
        avatarUrl: null,
        headline: headlines[i % headlines.length],
        summary: 'Profissional experiente com forte background em tecnologia e gestão de projetos.',
        status: statuses[i % statuses.length],
        isSearchable: Math.random() > 0.3,
        evidenceCount: Math.floor(Math.random() * 5),
        profileCompleteness: 30 + Math.floor(Math.random() * 70),
        interviewCompleted: Math.random() > 0.4,
        topSkills: skillIds
            .slice(0, 3 + Math.floor(Math.random() * 3))
            .map(id => ({ id, score: 0.5 + Math.random() * 0.5 })),
        createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));
}

