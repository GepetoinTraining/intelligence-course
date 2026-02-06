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
    IconCertificate,
    IconAlertCircle,
    IconDownload,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Enrollment {
    id: string;
    status: string;
    enrolledAt: number;
    completedAt: number | null;
    student?: { name: string; email: string };
    class?: { name: string };
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

export default function CertificadosPage() {
    const { data: enrollments, isLoading, error, refetch } = useApi<Enrollment[]>('/api/enrollments');

    const completed = enrollments?.filter(e => e.status === 'completed') || [];

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
            <div>
                <Text size="sm" c="dimmed">Pedagógico</Text>
                <Title order={2}>Certificados</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCertificate size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Emitidos</Text>
                            <Text fw={700} size="lg">{completed.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {completed.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Curso</Table.Th>
                                <Table.Th>Conclusão</Table.Th>
                                <Table.Th>Ação</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {completed.map((enrollment) => (
                                <Table.Tr key={enrollment.id}>
                                    <Table.Td><Text fw={500}>{enrollment.student?.name || '-'}</Text></Table.Td>
                                    <Table.Td>{enrollment.class?.name || '-'}</Table.Td>
                                    <Table.Td>{formatDate(enrollment.completedAt || enrollment.enrolledAt)}</Table.Td>
                                    <Table.Td>
                                        <Button size="xs" variant="light" leftSection={<IconDownload size={14} />}>
                                            Baixar
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCertificate size={48} color="gray" />
                            <Text c="dimmed">Nenhum certificado emitido</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

