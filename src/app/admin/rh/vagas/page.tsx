'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    Table,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconBriefcase,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface JobOpening {
    id: string;
    title: string;
    description: string | null;
    company: string;
    postedAt: number;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

export default function VagasPage() {
    const { data, isLoading, error, refetch } = useApi<{ jobs: JobOpening[] }>('/api/careers');

    const jobs = data?.jobs || [];

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">RH</Text>
                    <Title order={2}>Vagas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Vaga</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBriefcase size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Vagas Abertas</Text>
                            <Text fw={700} size="lg">{jobs.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {jobs.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Título</Table.Th>
                                <Table.Th>Empresa</Table.Th>
                                <Table.Th>Publicado</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {jobs.map((job) => (
                                <Table.Tr key={job.id}>
                                    <Table.Td>
                                        <Text fw={500}>{job.title}</Text>
                                        {job.description && (
                                            <Text size="xs" c="dimmed" lineClamp={1}>{job.description}</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">{job.company}</Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(job.postedAt)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBriefcase size={48} color="gray" />
                            <Text c="dimmed">Nenhuma vaga encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

