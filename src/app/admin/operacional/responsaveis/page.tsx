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
    IconUsers,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface FamilyLink {
    id: string;
    parentId: string;
    studentId: string;
    relationship: string;
    isPrimaryContact: number;
    canViewProgress: number;
    canPayInvoices: number;
}

const relationshipLabels: Record<string, string> = {
    parent: 'Pai/Mãe',
    guardian: 'Responsável',
    grandparent: 'Avô/Avó',
    sibling: 'Irmão/Irmã',
    other: 'Outro',
};

export default function ResponsaveisPage() {
    const { data: links, isLoading, error, refetch } = useApi<FamilyLink[]>('/api/family-links');

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

    const familyLinks = links || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Operacional</Text>
                    <Title order={2}>Responsáveis</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Vínculo</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Vínculos</Text>
                            <Text fw={700} size="lg">{familyLinks.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Contatos Primários</Text>
                            <Text fw={700} size="lg">{familyLinks.filter(l => l.isPrimaryContact).length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {familyLinks.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID Responsável</Table.Th>
                                <Table.Th>ID Aluno</Table.Th>
                                <Table.Th>Relação</Table.Th>
                                <Table.Th>Permissões</Table.Th>
                                <Table.Th>Primário</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {familyLinks.map((link) => (
                                <Table.Tr key={link.id}>
                                    <Table.Td><Text size="xs" c="dimmed">{link.parentId.slice(0, 8)}...</Text></Table.Td>
                                    <Table.Td><Text size="xs" c="dimmed">{link.studentId.slice(0, 8)}...</Text></Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {relationshipLabels[link.relationship] || link.relationship}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {link.canViewProgress ? <Badge size="xs" variant="light" color="blue">Notas</Badge> : null}
                                            {link.canPayInvoices ? <Badge size="xs" variant="light" color="green">Pagamentos</Badge> : null}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={link.isPrimaryContact ? 'green' : 'gray'} variant="light" size="sm">
                                            {link.isPrimaryContact ? 'Sim' : 'Não'}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUsers size={48} color="gray" />
                            <Text c="dimmed">Nenhum vínculo encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

