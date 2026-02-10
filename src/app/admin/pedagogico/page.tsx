'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Group,
    ThemeIcon,
    Loader,
    Center,
    Alert,
    Button,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconArrowRight,
    IconBook,
    IconCertificate,
    IconClipboardCheck,
    IconFiles,
    IconPresentation,
    IconSchool,
    IconTable,
    IconUsersGroup,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

export default function PedaggicoHubPage() {
    const { data, isLoading, error, refetch } = useApi<any[]>('/api/courses');
    const count = data?.length ?? 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>Pedagógico</Title>
            </div>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg" radius="md">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Cursos</Text>
                            <Text fw={700} size="xl">
                                {isLoading ? <Loader size="sm" /> : count}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                    Dados offline — {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Quick Links */}
            <Title order={4}>Acesso Rápido</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>

                <Card
                    key="Cursos"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/pedagogico/cursos'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg" radius="md">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Cursos</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Turmas"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/pedagogico/turmas'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconUsersGroup size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Turmas</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Grade"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/pedagogico/grade'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="cyan" size="lg" radius="md">
                            <IconTable size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Grade</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Aulas"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/pedagogico/aulas'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconPresentation size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Aulas</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Materiais"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/pedagogico/materiais'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg" radius="md">
                            <IconFiles size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Materiais</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Presença"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/pedagogico/presenca'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                            <IconClipboardCheck size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Presença</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Notas"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/pedagogico/notas'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Notas</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>

                <Card
                    key="Certificados"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/admin/pedagogico/certificados'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                            <IconCertificate size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>Certificados</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}
