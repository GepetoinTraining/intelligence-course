'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container, Title, Text, Card, Stack, Group, Button, Progress, Badge,
    ThemeIcon, Paper, Divider, Box, Stepper, Collapse, Alert
} from '@mantine/core';
import {
    IconUsers, IconPackage, IconReceipt, IconBuildingBank, IconCheck,
    IconLock, IconArrowRight, IconSparkles, IconRocket, IconChevronDown,
    IconChevronUp, IconAlertCircle
} from '@tabler/icons-react';
import { useOrg } from '@/components/OrgContext';

// Setup sections definition
const SETUP_SECTIONS = [
    {
        id: 'team',
        title: 'Equipe & Estrutura',
        description: 'Cargos, salas, horários e estrutura organizacional',
        icon: IconUsers,
        color: 'violet',
        route: '/admin/setup/team',
        dependencies: [],
        items: [
            { id: 'roles', label: 'Definir cargos e permissões', required: true },
            { id: 'hierarchy', label: 'Configurar hierarquia de aprovações', required: true },
            { id: 'rooms', label: 'Cadastrar salas e espaços', required: true },
            { id: 'hours', label: 'Definir horários de funcionamento', required: true },
        ],
    },
    {
        id: 'products',
        title: 'Produtos & Preços',
        description: 'Cadastre cursos, turmas e tabela de preços',
        icon: IconPackage,
        color: 'blue',
        route: '/admin/setup/products',
        dependencies: ['team'],
        items: [
            { id: 'courses', label: 'Cadastrar cursos', required: true },
            { id: 'pricing', label: 'Definir preços e formas de pagamento', required: true },
            { id: 'discounts', label: 'Configurar descontos e promoções', required: false },
        ],
    },
    {
        id: 'rules',
        title: 'Regras de Negócio',
        description: 'Comissões, metas e políticas comerciais',
        icon: IconReceipt,
        color: 'orange',
        route: '/admin/setup/rules',
        dependencies: ['products'],
        items: [
            { id: 'commissions', label: 'Estrutura de comissões', required: true },
            { id: 'goals', label: 'Metas e bonificações', required: false },
            { id: 'policies', label: 'Políticas de cancelamento e reembolso', required: true },
        ],
    },
    {
        id: 'financial',
        title: 'Financeiro & Pagamentos',
        description: 'Contas bancárias e provedores de pagamento',
        icon: IconBuildingBank,
        color: 'green',
        route: '/admin/setup/financial',
        dependencies: ['rules'],
        items: [
            { id: 'bank_accounts', label: 'Cadastrar contas bancárias', required: true },
            { id: 'payment_providers', label: 'Configurar PIX, boleto, cartão', required: true },
            { id: 'fiscal', label: 'Integração fiscal (NFS-e)', required: false },
        ],
    },
];

// Mock completion state (would come from DB in real app)
const INITIAL_COMPLETION: Record<string, string[]> = {
    team: [],
    products: [],
    rules: [],
    financial: [],
};

export default function AdminSetupPage() {
    const org = useOrg();
    const router = useRouter();
    const primaryColor = org.primaryColor || '#7048e8';

    const [completion, setCompletion] = useState(INITIAL_COMPLETION);
    const [expandedSection, setExpandedSection] = useState<string | null>('team');

    // Calculate section completion
    const getSectionProgress = (sectionId: string) => {
        const section = SETUP_SECTIONS.find(s => s.id === sectionId);
        if (!section) return 0;

        const requiredItems = section.items.filter(i => i.required);
        const completedRequired = requiredItems.filter(i =>
            completion[sectionId]?.includes(i.id)
        );

        return requiredItems.length > 0
            ? Math.round((completedRequired.length / requiredItems.length) * 100)
            : 0;
    };

    const isSectionComplete = (sectionId: string) => getSectionProgress(sectionId) === 100;

    const isSectionUnlocked = (sectionId: string) => {
        const section = SETUP_SECTIONS.find(s => s.id === sectionId);
        if (!section) return false;

        // First section is always unlocked
        if (section.dependencies.length === 0) return true;

        // Check all dependencies are complete
        return section.dependencies.every(dep => isSectionComplete(dep));
    };

    // Calculate overall progress
    const overallProgress = SETUP_SECTIONS.reduce((acc, section) => {
        return acc + getSectionProgress(section.id);
    }, 0) / SETUP_SECTIONS.length;

    const allComplete = overallProgress === 100;

    // Toggle item completion (for demo - would be API call in real app)
    const toggleItem = (sectionId: string, itemId: string) => {
        setCompletion(prev => {
            const current = prev[sectionId] || [];
            const isComplete = current.includes(itemId);

            return {
                ...prev,
                [sectionId]: isComplete
                    ? current.filter(id => id !== itemId)
                    : [...current, itemId],
            };
        });
    };

    return (
        <Box bg="dark.9" mih="100vh">
            <Container size="md" py="xl">
                <Stack gap="lg">
                    {/* Header */}
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Group gap="xs">
                                <ThemeIcon
                                    size={36}
                                    radius="md"
                                    style={{ background: primaryColor }}
                                >
                                    <IconRocket size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text c="gray.5" size="xs">Configuração</Text>
                                    <Text c="white" fw={700}>{org.displayName || org.name}</Text>
                                </div>
                            </Group>
                            <Badge
                                size="lg"
                                variant="gradient"
                                gradient={{ from: 'violet', to: 'grape' }}
                            >
                                {Math.round(overallProgress)}% Completo
                            </Badge>
                        </Group>

                        <Progress
                            value={overallProgress}
                            size="sm"
                            radius="xl"
                            color="violet"
                        />
                    </Stack>

                    {/* All Complete Banner */}
                    {allComplete && (
                        <Alert
                            icon={<IconSparkles size={20} />}
                            color="green"
                            variant="light"
                            title="Configuração completa!"
                        >
                            <Text size="sm">
                                Sua escola está pronta para operar! Você pode acessar o painel administrativo completo.
                            </Text>
                            <Button
                                mt="sm"
                                size="sm"
                                variant="light"
                                color="green"
                                rightSection={<IconArrowRight size={16} />}
                                onClick={() => router.push(`/${org.slug}/admin`)}
                            >
                                Ir para o Painel
                            </Button>
                        </Alert>
                    )}

                    {/* AI Blueprint Generator */}
                    <Card
                        bg="dark.7"
                        radius="md"
                        p="md"
                        style={{
                            border: '1px solid var(--mantine-color-grape-9)',
                            background: 'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, rgba(156, 54, 181, 0.1) 100%)',
                        }}
                    >
                        <Group justify="space-between">
                            <Group gap="md">
                                <ThemeIcon
                                    size={50}
                                    radius="md"
                                    variant="gradient"
                                    gradient={{ from: 'grape', to: 'violet' }}
                                >
                                    <IconSparkles size={26} />
                                </ThemeIcon>
                                <div>
                                    <Group gap="xs">
                                        <Text c="white" fw={600}>Blueprint Operacional</Text>
                                        <Badge size="xs" color="grape">IA</Badge>
                                    </Group>
                                    <Text c="gray.4" size="sm">
                                        Receba recomendações personalizadas de processos, metas e ações iniciais
                                    </Text>
                                    <Text c="gray.6" size="xs" mt={2}>
                                        Baseado na estrutura da sua escola: equipe, cursos, salas e metas
                                    </Text>
                                </div>
                            </Group>
                            <Button
                                variant="gradient"
                                gradient={{ from: 'grape', to: 'violet' }}
                                leftSection={<IconSparkles size={16} />}
                                onClick={() => router.push(`/${org.slug}/admin/setup/blueprint`)}
                            >
                                Gerar Blueprint
                            </Button>
                        </Group>
                    </Card>

                    {/* Setup Sections */}
                    <Stack gap="sm">
                        {SETUP_SECTIONS.map((section, index) => {
                            const isUnlocked = isSectionUnlocked(section.id);
                            const isComplete = isSectionComplete(section.id);
                            const progress = getSectionProgress(section.id);
                            const isExpanded = expandedSection === section.id;

                            return (
                                <Card
                                    key={section.id}
                                    bg="dark.7"
                                    radius="md"
                                    p={0}
                                    style={{
                                        opacity: isUnlocked ? 1 : 0.6,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {/* Section Header */}
                                    <Paper
                                        p="md"
                                        bg="dark.7"
                                        style={{
                                            cursor: isUnlocked ? 'pointer' : 'not-allowed',
                                            borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
                                        }}
                                        onClick={() => isUnlocked && setExpandedSection(
                                            isExpanded ? null : section.id
                                        )}
                                    >
                                        <Group justify="space-between">
                                            <Group>
                                                <ThemeIcon
                                                    size={40}
                                                    radius="md"
                                                    color={isComplete ? 'green' : section.color}
                                                    variant={isComplete ? 'filled' : 'light'}
                                                >
                                                    {isComplete ? (
                                                        <IconCheck size={20} />
                                                    ) : isUnlocked ? (
                                                        <section.icon size={20} />
                                                    ) : (
                                                        <IconLock size={20} />
                                                    )}
                                                </ThemeIcon>
                                                <div>
                                                    <Group gap="xs">
                                                        <Text c="white" fw={600} size="sm">
                                                            {index + 1}. {section.title}
                                                        </Text>
                                                        {isComplete && (
                                                            <Badge size="xs" color="green">
                                                                Completo
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                    <Text c="gray.5" size="xs">
                                                        {section.description}
                                                    </Text>
                                                </div>
                                            </Group>

                                            <Group gap="sm">
                                                {isUnlocked && !isComplete && (
                                                    <Badge variant="light" color={section.color}>
                                                        {progress}%
                                                    </Badge>
                                                )}
                                                {isUnlocked && (
                                                    isExpanded
                                                        ? <IconChevronUp size={18} color="gray" />
                                                        : <IconChevronDown size={18} color="gray" />
                                                )}
                                            </Group>
                                        </Group>

                                        {isUnlocked && !isComplete && (
                                            <Progress
                                                value={progress}
                                                size="xs"
                                                radius="xl"
                                                color={section.color}
                                                mt="sm"
                                            />
                                        )}
                                    </Paper>

                                    {/* Section Content */}
                                    <Collapse in={isExpanded && isUnlocked}>
                                        <Box p="md" pt={0}>
                                            <Divider color="dark.5" mb="md" />

                                            <Stack gap="xs">
                                                {section.items.map((item) => {
                                                    const isItemComplete = completion[section.id]?.includes(item.id);

                                                    return (
                                                        <Paper
                                                            key={item.id}
                                                            p="sm"
                                                            radius="sm"
                                                            bg={isItemComplete ? 'dark.6' : 'dark.8'}
                                                            style={{
                                                                cursor: 'pointer',
                                                                border: isItemComplete
                                                                    ? '1px solid var(--mantine-color-green-8)'
                                                                    : '1px solid var(--mantine-color-dark-5)',
                                                            }}
                                                            onClick={() => toggleItem(section.id, item.id)}
                                                        >
                                                            <Group justify="space-between">
                                                                <Group gap="sm">
                                                                    <ThemeIcon
                                                                        size={24}
                                                                        radius="xl"
                                                                        color={isItemComplete ? 'green' : 'gray'}
                                                                        variant={isItemComplete ? 'filled' : 'light'}
                                                                    >
                                                                        <IconCheck size={14} />
                                                                    </ThemeIcon>
                                                                    <Text
                                                                        c={isItemComplete ? 'gray.4' : 'white'}
                                                                        size="sm"
                                                                        style={{
                                                                            textDecoration: isItemComplete ? 'line-through' : 'none',
                                                                        }}
                                                                    >
                                                                        {item.label}
                                                                    </Text>
                                                                </Group>
                                                                {item.required ? (
                                                                    <Badge size="xs" color="red" variant="light">
                                                                        Obrigatório
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge size="xs" color="gray" variant="light">
                                                                        Opcional
                                                                    </Badge>
                                                                )}
                                                            </Group>
                                                        </Paper>
                                                    );
                                                })}
                                            </Stack>

                                            {/* Section Action Button */}
                                            <Button
                                                fullWidth
                                                mt="md"
                                                variant="light"
                                                color={section.color}
                                                rightSection={<IconArrowRight size={16} />}
                                                onClick={() => router.push(`/${org.slug}${section.route}`)}
                                            >
                                                Configurar {section.title}
                                            </Button>
                                        </Box>
                                    </Collapse>
                                </Card>
                            );
                        })}
                    </Stack>

                    {/* Help Section */}
                    <Card bg="dark.7" radius="md" p="md">
                        <Group>
                            <ThemeIcon size={36} radius="md" variant="light" color="blue">
                                <IconAlertCircle size={20} />
                            </ThemeIcon>
                            <div>
                                <Text c="white" fw={600} size="sm">Precisa de ajuda?</Text>
                                <Text c="gray.5" size="xs">
                                    Acesse nossa base de conhecimento ou fale com o suporte.
                                </Text>
                            </div>
                            <Button
                                ml="auto"
                                size="xs"
                                variant="subtle"
                                onClick={() => router.push(`/${org.slug}/wiki`)}
                            >
                                Ver Wiki
                            </Button>
                        </Group>
                    </Card>
                </Stack>
            </Container>
        </Box>
    );
}
