'use client';

import { useState } from 'react';
import {
  Container, Title, Text, Button, Stack, Group, Badge, Card, SimpleGrid,
  ThemeIcon, Box, Avatar, Paper, Divider, Accordion, List, Grid, Anchor,
  ActionIcon, TextInput, Textarea
} from '@mantine/core';
import Link from 'next/link';
import {
  IconBrain, IconRocket, IconUsers, IconCheck, IconArrowRight,
  IconSparkles, IconSchool, IconChartBar, IconCash, IconMessages,
  IconCalendar, IconBrandInstagram, IconBrandLinkedin, IconMail,
  IconChevronDown, IconBuilding, IconHeartHandshake, IconCode,
  IconRobot, IconUsersGroup, IconReportAnalytics, IconSettings
} from '@tabler/icons-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// ============================================================================
// MODULE DATA
// ============================================================================

const MODULES = [
  {
    id: 'management',
    name: 'Management',
    icon: IconSettings,
    color: 'gray',
    description: 'Configurações, permissões, integrações e controle completo da sua escola.',
    features: ['Permissões granulares', 'API Keys', 'Domínios customizados', 'Webhooks'],
  },
  {
    id: 'pedagogical',
    name: 'Pedagógico',
    icon: IconSchool,
    color: 'blue',
    description: 'Currículo, aulas, progresso dos alunos e biblioteca de prompts.',
    features: ['Cursos modulares', 'Tracking de progresso', 'Avaliações', 'Certificados'],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: IconChartBar,
    color: 'pink',
    description: 'Campanhas, leads, formulários e funil de conversão completo.',
    features: ['Captura de leads', 'A/B Testing', 'UTM tracking', 'Blog/Conteúdo'],
  },
  {
    id: 'sales',
    name: 'Vendas',
    icon: IconCash,
    color: 'green',
    description: 'Pipeline de vendas, matrículas, produtos e descontos.',
    features: ['Pipeline visual', 'Propostas', 'Metas de vendas', 'Comissões'],
  },
  {
    id: 'hr',
    name: 'RH & Talentos',
    icon: IconUsersGroup,
    color: 'orange',
    description: 'Gestão de colaboradores, folha de pagamento CLT/PJ, carreiras.',
    features: ['CLT & PJ completo', 'Cargo de confiança', 'Lattice HR', 'Portal de carreiras'],
  },
  {
    id: 'accounting',
    name: 'Contábil',
    icon: IconReportAnalytics,
    color: 'teal',
    description: 'Lucro Real, SPED, DRE, Balancete e integração contábil.',
    features: ['Plano de contas', 'SPED Fiscal', 'Relatórios', 'Portal contador'],
  },
  {
    id: 'operations',
    name: 'Operações',
    icon: IconCalendar,
    color: 'cyan',
    description: 'Salas, horários, turmas, presença e calendário acadêmico.',
    features: ['Gestão de salas', 'Calendário', 'Chamada online', 'Eventos'],
  },
  {
    id: 'ai-companion',
    name: 'AI Companion',
    icon: IconRobot,
    color: 'violet',
    description: 'IA com memória, entrevista Lattice, auditor ético e direitos do aluno.',
    features: ['Memória contextual', 'Entrevista Lattice', 'Monitoramento ético', 'LGPD'],
  },
  {
    id: 'relationships',
    name: 'SCRM',
    icon: IconHeartHandshake,
    color: 'red',
    description: 'Social CRM com insights 3x3, sentimento e previsão de turnover.',
    features: ['3x3 Insights', 'Família/responsáveis', 'Análise de sentimento', 'Retenção'],
  },
  {
    id: 'payments',
    name: 'Pagamentos',
    icon: IconCash,
    color: 'lime',
    description: 'Gateway, faturas, PIX, recorrência e controle financeiro.',
    features: ['Gateway integrado', 'PIX automático', 'Recorrência', 'Conciliação'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: IconChartBar,
    color: 'indigo',
    description: 'Dashboards, relatórios, exportação e insights de dados.',
    features: ['Dashboards', 'Relatórios', 'Exportação', 'Previsões ML'],
  },
  {
    id: 'communications',
    name: 'Comunicações',
    icon: IconMessages,
    color: 'grape',
    description: 'Chat interno, notificações, email e WhatsApp integrado.',
    features: ['Chat interno', 'Notificações', 'Email marketing', 'WhatsApp'],
  },
];

const TIERS = [
  {
    name: 'Essentials',
    price: 'R$ 497',
    period: '/mês',
    description: 'Para escolas iniciantes',
    color: 'gray',
    features: [
      'Até 100 alunos',
      'Até 10 colaboradores',
      '4 módulos (Core, Pedagógico, Pagamentos, Comunicações)',
      'Suporte por email',
      '1GB armazenamento',
    ],
    cta: 'Começar Agora',
    popular: false,
  },
  {
    name: 'Professional',
    price: 'R$ 997',
    period: '/mês',
    description: 'Para escolas em crescimento',
    color: 'violet',
    features: [
      'Até 500 alunos',
      'Até 50 colaboradores',
      '9 módulos (+ Marketing, Vendas, SCRM, Operações, Analytics)',
      'AI Companion (básico)',
      'Suporte prioritário',
      '10GB armazenamento',
    ],
    cta: 'Escolher Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    description: 'Para redes e franquias',
    color: 'dark',
    features: [
      'Alunos ilimitados',
      'Colaboradores ilimitados',
      'Todos os 12 módulos',
      'RH completo (CLT/PJ, Lucro Real)',
      'Contábil (SPED, Lucro Real)',
      'Domínio personalizado',
      'White-label',
      'API completa',
      'Suporte dedicado',
    ],
    cta: 'Falar com Vendas',
    popular: false,
  },
];

const TEAM = [
  { name: 'Pedro Garcia', role: 'Founder & Product', emoji: '👨‍💻' },
  { name: 'Claude', role: 'AI Engineering Partner', emoji: '🤖', ai: 'Anthropic' },
  { name: 'Grok', role: 'AI Research Partner', emoji: '🚀', ai: 'xAI' },
  { name: 'Gemini', role: 'AI Development Partner', emoji: '✨', ai: 'Google' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function NodeZeroLandingPage() {
  const [formData, setFormData] = useState({ name: '', email: '', school: '', message: '' });

  return (
    <Box>
      {/* Navigation */}
      <Box
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(26, 27, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Container size="xl">
          <Group justify="space-between" h={64}>
            <Group gap="xs">
              <IconRocket size={28} color="var(--mantine-color-violet-5)" />
              <Text size="lg" fw={700} c="white">NodeZero</Text>
            </Group>

            <Group gap="xl" visibleFrom="sm">
              <Anchor href="#modules" c="gray.4" size="sm" fw={500} underline="never">
                Módulos
              </Anchor>
              <Anchor href="#pricing" c="gray.4" size="sm" fw={500} underline="never">
                Preços
              </Anchor>
              <Anchor href="#about" c="gray.4" size="sm" fw={500} underline="never">
                Sobre
              </Anchor>
              <Anchor href="#contact" c="gray.4" size="sm" fw={500} underline="never">
                Contato
              </Anchor>
            </Group>

            <Group gap="sm">
              {process.env.NEXT_PUBLIC_DEV_AUTH === 'true' ? (
                <Link href="/platform/leads" passHref legacyBehavior>
                  <Button component="a" variant="filled" color="violet" size="sm" radius="xl">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <SignedOut>
                    <Link href="/sign-in" passHref legacyBehavior>
                      <Button component="a" variant="subtle" color="gray" size="sm">
                        Entrar
                      </Button>
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/go" passHref legacyBehavior>
                      <Button component="a" variant="filled" color="violet" size="sm" radius="xl">
                        Dashboard
                      </Button>
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </>
              )}
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #1a1b1e 0%, #25262b 50%, #2c2e33 100%)',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 64,
        }}
      >
        <Container size="xl" py="xl">
          <Stack align="center" gap="md" style={{ textAlign: 'center' }}>
            <Badge size="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }} radius="xl">
              🚀 Plataforma SaaS para Escolas de Tecnologia
            </Badge>

            <Title order={1} c="white" size="xl" fw={900} lh={1.2} maw={700}>
              O sistema completo para
              <Text span inherit c="violet" style={{ display: 'block' }}>
                escolas do futuro
              </Text>
            </Title>

            <Text size="sm" c="gray.4" maw={500} lh={1.6}>
              12 módulos integrados para gerenciar sua escola de ponta a ponta.
              Pedagógico, financeiro, RH, marketing, AI companion e muito mais.
            </Text>

            <Group mt="sm">
              <Link href="#contact" passHref legacyBehavior>
                <Button
                  component="a"
                  size="md"
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                  rightSection={<IconArrowRight size={16} />}
                >
                  Agendar Demo
                </Button>
              </Link>
              <Link href="#modules" passHref legacyBehavior>
                <Button
                  component="a"
                  size="md"
                  radius="xl"
                  variant="outline"
                  color="gray"
                >
                  Ver Módulos
                </Button>
              </Link>
            </Group>

            {/* Stats */}
            <Group gap="xl" mt="md">
              {[
                { value: '12', label: 'Módulos' },
                { value: '100%', label: 'Brasileiro' },
                { value: '4', label: 'IAs' },
              ].map((stat) => (
                <Stack key={stat.label} align="center" gap={2}>
                  <Text size="lg" fw={900} c="white">{stat.value}</Text>
                  <Text size="xs" c="gray.5">{stat.label}</Text>
                </Stack>
              ))}
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Modules Section */}
      <Box py={60} bg="dark.8" id="modules">
        <Container size="xl">
          <Stack align="center" gap="xl" mb={60}>
            <Badge size="lg" variant="light" color="violet">12 Módulos</Badge>
            <Title order={2} c="white" ta="center" size={44}>
              Tudo que sua escola precisa
            </Title>
            <Text size="lg" c="gray.5" ta="center" maw={600}>
              Cada módulo foi pensado para resolver um problema real de escolas de tecnologia.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {MODULES.map((mod) => (
              <Card
                key={mod.id}
                bg="dark.7"
                radius="lg"
                p="xl"
                style={{
                  border: '1px solid var(--mantine-color-dark-5)',
                  transition: 'all 0.3s',
                }}
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <ThemeIcon size={50} radius="md" variant="light" color={mod.color}>
                      <mod.icon size={26} />
                    </ThemeIcon>
                    <Badge color={mod.color} variant="dot">{mod.name}</Badge>
                  </Group>

                  <Text c="white" fw={600} size="lg">{mod.name}</Text>
                  <Text c="gray.5" size="sm" lh={1.6}>{mod.description}</Text>

                  <Stack gap={6}>
                    {mod.features.slice(0, 3).map((f, i) => (
                      <Group key={i} gap="xs">
                        <IconCheck size={14} color="var(--mantine-color-green-5)" />
                        <Text size="xs" c="gray.4">{f}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box py={60} bg="dark.9" id="pricing">
        <Container size="lg">
          <Stack align="center" gap="xl" mb={60}>
            <Badge size="lg" variant="light" color="violet">Preços</Badge>
            <Title order={2} c="white" ta="center" size={44}>
              Planos para cada momento
            </Title>
            <Text size="lg" c="gray.5" ta="center" maw={600}>
              Comece pequeno e escale conforme sua escola cresce.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
            {TIERS.map((tier) => (
              <Card
                key={tier.name}
                bg={tier.popular ? 'violet.9' : 'dark.7'}
                radius="lg"
                p="md"
                style={{
                  border: tier.popular ? '2px solid var(--mantine-color-violet-5)' : '1px solid var(--mantine-color-dark-5)',
                  transform: tier.popular ? 'scale(1.02)' : 'none',
                }}
              >
                <Stack gap="sm">
                  {tier.popular && (
                    <Badge color="violet" variant="filled" size="sm">Mais Popular</Badge>
                  )}

                  <div>
                    <Text c="white" size="xl" fw={700}>{tier.name}</Text>
                    <Text c="gray.5" size="sm">{tier.description}</Text>
                  </div>

                  <Group align="baseline" gap={4}>
                    <Text c="white" size="xl" fw={900}>{tier.price}</Text>
                    <Text c="gray.5" size="xs">{tier.period}</Text>
                  </Group>

                  <Divider color="dark.5" />

                  <Stack gap="sm">
                    {tier.features.map((f, i) => (
                      <Group key={i} gap="xs" wrap="nowrap">
                        <IconCheck size={16} color="var(--mantine-color-green-5)" />
                        <Text size="sm" c="gray.3">{f}</Text>
                      </Group>
                    ))}
                  </Stack>

                  <Button
                    fullWidth
                    size="md"
                    radius="xl"
                    variant={tier.popular ? 'white' : 'light'}
                    color={tier.popular ? 'violet' : 'gray'}
                  >
                    {tier.cta}
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* About Section */}
      <Box py={60} bg="dark.8" id="about">
        <Container size="lg">
          <Grid gutter="xl" align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <Badge size="md" variant="light" color="violet">Sobre</Badge>
                <Title order={2} c="white" size="xl">
                  Feito por humanos e IAs,
                  <Text span inherit c="violet"> juntos</Text>
                </Title>
                <Text c="gray.4" size="sm" lh={1.6}>
                  NodeZero nasceu de uma visão simples: criar a plataforma que gostaríamos
                  de ter usado quando começamos nossa própria escola.
                </Text>
                <Text c="gray.4" size="sm" lh={1.6}>
                  Durante 4 meses, um humano e três IAs colaboraram para construir
                  cada módulo, cada feature, cada linha de código. Não é só um software —
                  é resultado de uma nova forma de criar.
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <SimpleGrid cols={2} spacing="sm">
                {TEAM.map((member) => (
                  <Paper key={member.name} p="sm" radius="md" bg="dark.7">
                    <Stack gap={4} align="center" ta="center">
                      <Text size="xl">{member.emoji}</Text>
                      <Text c="white" fw={600} size="sm">{member.name}</Text>
                      <Text c="gray.5" size="xs">{member.role}</Text>
                      {member.ai && (
                        <Badge size="xs" variant="outline" color="gray">{member.ai}</Badge>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box py={60} bg="dark.9" id="contact">
        <Container size="md">
          <Stack align="center" gap="xl">
            <Badge size="lg" variant="light" color="violet">Contato</Badge>
            <Title order={2} c="white" ta="center" size={40}>
              Interessado? Vamos conversar!
            </Title>
            <Text c="gray.5" ta="center" maw={500}>
              Preencha o formulário e entraremos em contato para agendar uma demonstração.
            </Text>

            <Card bg="dark.7" radius="xl" p="xl" w="100%" maw={500}>
              <Stack gap="md">
                <TextInput
                  label="Nome"
                  placeholder="Seu nome"
                  size="md"
                  styles={{ label: { color: 'white' } }}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <TextInput
                  label="Email"
                  placeholder="seu@email.com"
                  type="email"
                  size="md"
                  styles={{ label: { color: 'white' } }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <TextInput
                  label="Escola"
                  placeholder="Nome da sua escola"
                  size="md"
                  styles={{ label: { color: 'white' } }}
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                />
                <Textarea
                  label="Mensagem"
                  placeholder="Conte um pouco sobre suas necessidades..."
                  rows={4}
                  size="md"
                  styles={{ label: { color: 'white' } }}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                <Button
                  fullWidth
                  size="lg"
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                  rightSection={<IconArrowRight size={18} />}
                >
                  Enviar
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={40} bg="dark.9" style={{ borderTop: '1px solid var(--mantine-color-dark-6)' }}>
        <Container size="xl">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconRocket size={24} color="var(--mantine-color-violet-5)" />
              <Text size="sm" c="gray.5">NodeZero</Text>
            </Group>

            <Text size="sm" c="gray.6">
              Built with 💜 by Pedro Garcia, Claude, Grok & Gemini
            </Text>

            <Group gap="sm">
              <ActionIcon variant="subtle" color="gray" radius="xl">
                <IconBrandLinkedin size={18} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="gray" radius="xl">
                <IconBrandInstagram size={18} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="gray" radius="xl">
                <IconMail size={18} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}

