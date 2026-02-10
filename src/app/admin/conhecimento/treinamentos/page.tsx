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
    Avatar,
    Progress,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconSchool,
    IconPlus,
    IconVideo,
    IconUsers,
    IconClock,
    IconPlayerPlay,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// Demo training data
const trainings = [
    { id: 1, name: 'Novo Sistema Acadêmico', type: 'Onboarding', duration: '2h', enrolled: 15, completed: 12, format: 'video' },
    { id: 2, name: 'Metodologia de Ensino', type: 'Pedagógico', duration: '4h', enrolled: 25, completed: 18, format: 'hybrid' },
    { id: 3, name: 'Atendimento ao Cliente', type: 'Comercial', duration: '1h30', enrolled: 8, completed: 8, format: 'video' },
    { id: 4, name: 'LGPD e Proteção de Dados', type: 'Compliance', duration: '1h', enrolled: 35, completed: 30, format: 'video' },
    { id: 5, name: 'Gestão de Turmas', type: 'Operacional', duration: '2h', enrolled: 20, completed: 10, format: 'live' },
];

export default function TreinamentosPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/templates?type=training');

    const totalEnrolled = trainings.reduce((sum, t) => sum + t.enrolled, 0);
    const totalCompleted = trainings.reduce((sum, t) => sum + t.completed, 0);
    const avgCompletion = ((totalCompleted / totalEnrolled) * 100).toFixed(0);


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Conhecimento</Text>
                    <Title order={2}>Treinamentos</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Treinamento
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Treinamentos</Text>
                            <Text fw={700} size="lg">{trainings.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Inscritos</Text>
                            <Text fw={700} size="lg">{totalEnrolled}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Concluídos</Text>
                            <Text fw={700} size="lg">{totalCompleted}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Taxa Conclusão</Text>
                            <Text fw={700} size="lg">{avgCompletion}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Trainings Table */}
            <Card withBorder p="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Treinamento</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Duração</Table.Th>
                            <Table.Th>Formato</Table.Th>
                            <Table.Th>Progresso</Table.Th>
                            <Table.Th>Ações</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {trainings.map((training) => (
                            <Table.Tr key={training.id}>
                                <Table.Td>
                                    <Text fw={500}>{training.name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light" size="sm">{training.type}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <IconClock size={14} />
                                        <Text size="sm">{training.duration}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        variant="outline"
                                        size="sm"
                                        leftSection={training.format === 'video' ? <IconVideo size={10} /> : <IconUsers size={10} />}
                                    >
                                        {training.format === 'video' ? 'Vídeo' :
                                            training.format === 'hybrid' ? 'Híbrido' : 'Ao Vivo'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Progress value={(training.completed / training.enrolled) * 100} w={60} size="sm" />
                                        <Text size="xs">{training.completed}/{training.enrolled}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Button size="xs" variant="light" leftSection={<IconPlayerPlay size={12} />}>
                                        Acessar
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}

