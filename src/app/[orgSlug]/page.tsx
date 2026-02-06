'use client';

import {
    Container, Title, Text, Button, Stack, Group, Badge, Card, SimpleGrid,
    ThemeIcon, Box, Paper, Divider, Anchor, ActionIcon, Grid
} from '@mantine/core';
import Link from 'next/link';
import {
    IconArrowRight, IconSchool, IconUsers, IconCalendar, IconBrandInstagram,
    IconBrandWhatsapp, IconMail, IconPhone, IconMapPin, IconRocket
} from '@tabler/icons-react';
import { useOrg } from '@/components/OrgContext';

export default function SchoolLandingPage() {
    const org = useOrg();

    // Use org's primary color or default
    const primaryColor = org.primaryColor || '#7048e8';

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
                    <Group justify="space-between" h={56}>
                        <Group gap="xs">
                            {org.branding?.logoIconUrl ? (
                                <img
                                    src={org.branding.logoIconUrl}
                                    alt={org.name}
                                    style={{ height: 28 }}
                                />
                            ) : (
                                <IconSchool size={24} style={{ color: primaryColor }} />
                            )}
                            <Text size="md" fw={700} c="white">{org.displayName || org.name}</Text>
                        </Group>

                        <Group gap="md" visibleFrom="sm">
                            <Anchor href="#about" c="gray.4" size="sm" underline="never">Sobre</Anchor>
                            <Anchor href="#courses" c="gray.4" size="sm" underline="never">Cursos</Anchor>
                            <Anchor href="#contact" c="gray.4" size="sm" underline="never">Contato</Anchor>
                        </Group>

                        <Link href={`/${org.slug}/matricula`} passHref legacyBehavior>
                            <Button
                                component="a"
                                size="sm"
                                radius="xl"
                                style={{ background: primaryColor }}
                            >
                                Matricule-se
                            </Button>
                        </Link>
                    </Group>
                </Container>
            </Box>

            {/* Hero Section */}
            <Box
                style={{
                    background: `linear-gradient(135deg, #1a1b1e 0%, ${primaryColor}22 100%)`,
                    paddingTop: 56,
                }}
            >
                <Container size="xl" py="xl">
                    <Grid align="center" gutter="xl">
                        <Grid.Col span={{ base: 12, md: 7 }}>
                            <Stack gap="md">
                                <Badge
                                    size="md"
                                    radius="xl"
                                    style={{ background: primaryColor }}
                                >
                                    📍 {org.city}, {org.state}
                                </Badge>

                                <Title order={1} c="white" size="xl" fw={900} lh={1.2}>
                                    {org.displayName || org.name}
                                </Title>

                                <Text size="sm" c="gray.4" maw={500} lh={1.6}>
                                    Transformando o futuro através da educação tecnológica.
                                    Cursos práticos e inovadores para todas as idades.
                                </Text>

                                <Group mt="sm">
                                    <Link href="#contact" passHref legacyBehavior>
                                        <Button
                                            component="a"
                                            size="md"
                                            radius="xl"
                                            style={{ background: primaryColor }}
                                            rightSection={<IconArrowRight size={16} />}
                                        >
                                            Agende uma Visita
                                        </Button>
                                    </Link>
                                    <Link href="#courses" passHref legacyBehavior>
                                        <Button
                                            component="a"
                                            size="md"
                                            radius="xl"
                                            variant="outline"
                                            color="gray"
                                        >
                                            Ver Cursos
                                        </Button>
                                    </Link>
                                </Group>
                            </Stack>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 5 }}>
                            {org.branding?.heroImageUrl ? (
                                <img
                                    src={org.branding.heroImageUrl}
                                    alt={org.name}
                                    style={{
                                        width: '100%',
                                        borderRadius: 16,
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                                    }}
                                />
                            ) : (
                                <Paper
                                    p="xl"
                                    radius="lg"
                                    bg="dark.7"
                                    style={{
                                        aspectRatio: '4/3',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Stack align="center" gap="xs">
                                        <IconSchool size={64} style={{ color: primaryColor, opacity: 0.5 }} />
                                        <Text c="gray.6" size="sm">Imagem em breve</Text>
                                    </Stack>
                                </Paper>
                            )}
                        </Grid.Col>
                    </Grid>
                </Container>
            </Box>

            {/* Features/Stats */}
            <Box py="xl" bg="dark.8" id="about">
                <Container size="lg">
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                        {[
                            { icon: IconSchool, label: 'Cursos', value: 'Programação, Robótica, IA' },
                            { icon: IconUsers, label: 'Turmas', value: 'Crianças, Jovens, Adultos' },
                            { icon: IconCalendar, label: 'Horários', value: 'Manhã, Tarde, Noite' },
                        ].map((item) => (
                            <Paper key={item.label} p="md" radius="md" bg="dark.7">
                                <Group>
                                    <ThemeIcon
                                        size={40}
                                        radius="md"
                                        variant="light"
                                        style={{ color: primaryColor, background: `${primaryColor}22` }}
                                    >
                                        <item.icon size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text c="white" fw={600} size="sm">{item.value}</Text>
                                        <Text c="gray.5" size="xs">{item.label}</Text>
                                    </div>
                                </Group>
                            </Paper>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Courses Section (Placeholder) */}
            <Box py="xl" bg="dark.9" id="courses">
                <Container size="lg">
                    <Stack align="center" gap="md" mb="lg">
                        <Badge size="md" variant="light" style={{ color: primaryColor }}>Cursos</Badge>
                        <Title order={2} c="white" ta="center" size="lg">
                            Nossos Cursos
                        </Title>
                        <Text c="gray.5" ta="center" maw={500} size="sm">
                            Em breve, confira nossa grade completa de cursos.
                        </Text>
                    </Stack>

                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                        {['Programação Kids', 'Robótica', 'Inteligência Artificial'].map((course) => (
                            <Card key={course} p="md" radius="md" bg="dark.7">
                                <Stack gap="xs">
                                    <Text c="white" fw={600} size="sm">{course}</Text>
                                    <Text c="gray.5" size="xs">Em breve mais detalhes</Text>
                                    <Button
                                        variant="light"
                                        size="xs"
                                        radius="xl"
                                        style={{ color: primaryColor }}
                                        disabled
                                    >
                                        Saiba mais
                                    </Button>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Contact Section */}
            <Box py="xl" bg="dark.8" id="contact">
                <Container size="md">
                    <Stack align="center" gap="md">
                        <Badge size="md" variant="light" style={{ color: primaryColor }}>Contato</Badge>
                        <Title order={2} c="white" ta="center" size="lg">
                            Entre em Contato
                        </Title>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" w="100%">
                            {org.phone && (
                                <Paper p="md" radius="md" bg="dark.7">
                                    <Group>
                                        <ThemeIcon size={36} radius="md" variant="light" color="gray">
                                            <IconPhone size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text c="white" size="sm">{org.phone}</Text>
                                            <Text c="gray.5" size="xs">Telefone</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            )}

                            {org.whatsapp && (
                                <Paper p="md" radius="md" bg="dark.7">
                                    <Group>
                                        <ThemeIcon size={36} radius="md" variant="light" color="green">
                                            <IconBrandWhatsapp size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text c="white" size="sm">{org.whatsapp}</Text>
                                            <Text c="gray.5" size="xs">WhatsApp</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            )}

                            {org.email && (
                                <Paper p="md" radius="md" bg="dark.7">
                                    <Group>
                                        <ThemeIcon size={36} radius="md" variant="light" color="blue">
                                            <IconMail size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text c="white" size="sm">{org.email}</Text>
                                            <Text c="gray.5" size="xs">Email</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            )}

                            {org.city && (
                                <Paper p="md" radius="md" bg="dark.7">
                                    <Group>
                                        <ThemeIcon size={36} radius="md" variant="light" color="orange">
                                            <IconMapPin size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text c="white" size="sm">{org.city}, {org.state}</Text>
                                            <Text c="gray.5" size="xs">Localização</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            )}
                        </SimpleGrid>

                        {/* Social Links */}
                        <Group mt="md">
                            {org.branding?.socialInstagram && (
                                <ActionIcon
                                    component="a"
                                    href={org.branding.socialInstagram}
                                    target="_blank"
                                    variant="light"
                                    color="pink"
                                    radius="xl"
                                    size="lg"
                                >
                                    <IconBrandInstagram size={20} />
                                </ActionIcon>
                            )}
                            {org.branding?.socialWhatsapp && (
                                <ActionIcon
                                    component="a"
                                    href={`https://wa.me/${org.branding.socialWhatsapp.replace(/\D/g, '')}`}
                                    target="_blank"
                                    variant="light"
                                    color="green"
                                    radius="xl"
                                    size="lg"
                                >
                                    <IconBrandWhatsapp size={20} />
                                </ActionIcon>
                            )}
                        </Group>
                    </Stack>
                </Container>
            </Box>

            {/* Footer */}
            <Box py="lg" bg="dark.9" style={{ borderTop: '1px solid var(--mantine-color-dark-6)' }}>
                <Container size="xl">
                    <Group justify="space-between" align="center">
                        <Text size="xs" c="gray.6">
                            {org.branding?.footerText || `© ${new Date().getFullYear()} ${org.name}`}
                        </Text>

                        {org.branding?.showPoweredBy && (
                            <Group gap="xs">
                                <Text size="xs" c="gray.6">Powered by</Text>
                                <Link href="/" style={{ textDecoration: 'none' }}>
                                    <Group gap={4}>
                                        <IconRocket size={14} color="var(--mantine-color-violet-5)" />
                                        <Text size="xs" c="violet.5" fw={600}>NodeZero</Text>
                                    </Group>
                                </Link>
                            </Group>
                        )}
                    </Group>
                </Container>
            </Box>
        </Box>
    );
}
