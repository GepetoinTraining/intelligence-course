'use client';

import { useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Loader, Center, Alert, Button, Badge, Divider,
} from '@mantine/core';
import {
    IconAlertCircle, IconArrowRight, IconBeach, IconBriefcase,
    IconCash, IconClock, IconFileText, IconUsers, IconUsersGroup,
    IconCoin, IconSchool, IconTarget, IconHierarchy,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// Hub Navigation Items
// ============================================================================

const NAV_ITEMS = [
    { key: 'colaboradores', label: 'Colaboradores', desc: 'Quadro de pessoal CLT/PJ', icon: IconUsers, color: 'orange', href: '/admin/rh/colaboradores' },
    { key: 'contratos', label: 'Contratos', desc: 'Gestão contratual eSocial', icon: IconFileText, color: 'blue', href: '/admin/rh/contratos' },
    { key: 'folha', label: 'Folha de Pagamento', desc: 'INSS, IRRF, FGTS, holerite', icon: IconCash, color: 'green', href: '/admin/rh/folha' },
    { key: 'ponto', label: 'Registro de Ponto', desc: 'Portaria 671, jornada, HE', icon: IconClock, color: 'teal', href: '/admin/rh/ponto' },
    { key: 'ferias', label: 'Férias e Afastamentos', desc: 'CLT Arts. 129-153, licenças', icon: IconBeach, color: 'cyan', href: '/admin/rh/ferias' },
    { key: 'comissoes', label: 'Comissões', desc: 'DSR, bonificações, pagamentos', icon: IconCoin, color: 'yellow', href: '/admin/rh/comissoes' },
    { key: 'vagas', label: 'Vagas e Recrutamento', desc: 'Pipeline de talentos', icon: IconBriefcase, color: 'violet', href: '/admin/rh/vagas' },
    { key: 'treinamentos', label: 'Treinamentos', desc: 'NR obrigatórios, CIPA', icon: IconSchool, color: 'indigo', href: '/admin/rh/treinamentos' },
    { key: 'metas', label: 'Metas e Desempenho', desc: 'OKR, PDI, avaliações', icon: IconTarget, color: 'pink', href: '/admin/rh/metas' },
    { key: 'organograma', label: 'Organograma', desc: 'Estrutura e headcount', icon: IconHierarchy, color: 'grape', href: '/admin/rh/organograma' },
];

// ============================================================================
// PAGE
// ============================================================================

export default function RHPessoasHubPage() {
    const { data: contracts, isLoading: loadC, error: errC, refetch: refetchC } = useApi<any[]>('/api/staff-contracts');
    const { data: payroll, isLoading: loadP } = useApi<any[]>('/api/staff-payroll');
    const { data: leaves, isLoading: loadL } = useApi<any[]>('/api/staff-leave');

    const isLoading = loadC || loadP || loadL;

    const stats = useMemo(() => {
        const ct = contracts || [];
        const active = ct.filter((c: any) => c.status === 'active');
        const clt = active.filter((c: any) => c.contractType === 'clt');
        const pj = active.filter((c: any) => c.contractType === 'pj');
        const totalPayroll = active.reduce((s: number, c: any) => s + (c.salaryCents || 0), 0);

        const pr = payroll || [];
        const pendingPayroll = pr.filter((p: any) => p.status === 'pending').length;

        const lv = leaves || [];
        const onLeave = lv.filter((l: any) => {
            const now = Date.now() / 1000;
            return l.status === 'approved' && l.startDate <= now && l.endDate >= now;
        }).length;
        const pendingLeave = lv.filter((l: any) => l.status === 'pending').length;

        return {
            total: ct.length,
            active: active.length,
            clt: clt.length,
            pj: pj.length,
            totalPayroll,
            pendingPayroll,
            onLeave,
            pendingLeave,
        };
    }, [contracts, payroll, leaves]);

    const fmt = (cents: number) => `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>Gestão de Pessoas</Title>
                <Text size="xs" c="dimmed" mt={2}>
                    Módulo completo de RH • CLT • eSocial • Normas Regulamentadoras
                </Text>
            </div>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4, md: 8 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg" radius="md">
                            <IconUsersGroup size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="xl">
                                {isLoading ? <Loader size="sm" /> : stats.total}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Ativos</Text>
                    <Text fw={700} size="xl" c="green.7">
                        {isLoading ? <Loader size="sm" /> : stats.active}
                    </Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">CLT</Text>
                    <Text fw={700} size="lg" c="blue.7">{stats.clt}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">PJ</Text>
                    <Text fw={700} size="lg" c="orange.7">{stats.pj}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Folha Mensal</Text>
                    <Text fw={700} size="sm">{fmt(stats.totalPayroll)}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Folha Pendente</Text>
                    <Text fw={700} size="lg" c="yellow.7">{stats.pendingPayroll}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Em Afastamento</Text>
                    <Text fw={700} size="lg" c="cyan.7">{stats.onLeave}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Férias Pendentes</Text>
                    <Text fw={700} size="lg" c="yellow.7">{stats.pendingLeave}</Text>
                </Card>
            </SimpleGrid>

            {errC && (
                <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                    Dados offline — {errC}
                    <Button size="xs" variant="light" ml="md" onClick={refetchC}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Quick Links */}
            <Divider />
            <Title order={4}>Módulos</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    return (
                        <Card
                            key={item.key}
                            withBorder
                            p="lg"
                            style={{ cursor: 'pointer' }}
                            onClick={() => window.location.href = item.href}
                        >
                            <Group>
                                <ThemeIcon variant="light" color={item.color} size="lg" radius="md">
                                    <Icon size={20} />
                                </ThemeIcon>
                                <div style={{ flex: 1 }}>
                                    <Text fw={500}>{item.label}</Text>
                                    <Text size="xs" c="dimmed">{item.desc}</Text>
                                </div>
                                <IconArrowRight size={16} color="gray" />
                            </Group>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {/* Legal Footer */}
            <Alert icon={<IconUsersGroup size={16} />} color="gray" variant="light" title="Base Legal">
                <Text size="xs">
                    Este módulo segue a CLT (Decreto-Lei 5.452/43), Reforma Trabalhista (Lei 13.467/17),
                    eSocial, Normas Regulamentadoras (NR-1 a NR-38), e legislação previdenciária (Lei 8.213/91).
                </Text>
            </Alert>
        </Stack>
    );
}
