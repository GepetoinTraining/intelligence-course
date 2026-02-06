'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Modal, Loader, Center, Table, Avatar,
    ActionIcon, Menu, ThemeIcon, Select, Tabs, SimpleGrid
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconSearch, IconDots, IconEye, IconEdit, IconTrash,
    IconUsers, IconMail, IconPhone, IconFilter
} from '@tabler/icons-react';
import Link from 'next/link';
import { ExportButton } from '@/components/shared';

interface Student {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    classId: string | null;
    className: string | null;
    enrollmentStatus: 'active' | 'inactive' | 'pending' | 'graduated';
    createdAt: number;
}

const statusConfig = {
    active: { label: 'Ativo', color: 'green' },
    inactive: { label: 'Inativo', color: 'gray' },
    pending: { label: 'Pendente', color: 'yellow' },
    graduated: { label: 'Formado', color: 'blue' },
};

export default function SchoolStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [classFilter, setClassFilter] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', classId: '', status: 'active' });

    const handleOpenCreate = () => {
        setEditingStudent(null);
        setFormData({ name: '', email: '', phone: '', classId: '', status: 'active' });
        openModal();
    };

    const handleOpenEdit = (student: Student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            email: student.email,
            phone: student.phone || '',
            classId: student.classId || '',
            status: student.enrollmentStatus,
        });
        openModal();
    };

    const handleSave = async () => {
        // TODO: API integration
        closeModal();
        fetchStudents();
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users?role=student');
            const data = await res.json();
            if (data.data) {
                setStudents(data.data.map((s: any) => ({
                    ...s,
                    className: s.className || null,
                    enrollmentStatus: s.enrollmentStatus || 'active',
                })));
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || s.enrollmentStatus === statusFilter;
        const matchesClass = !classFilter || s.classId === classFilter;
        return matchesSearch && matchesStatus && matchesClass;
    });

    // Get unique classes for filter
    const uniqueClasses = Array.from(new Set(students.filter(s => s.classId).map(s => ({
        value: s.classId!,
        label: s.className || s.classId!,
    }))));

    const stats = {
        total: students.length,
        active: students.filter(s => s.enrollmentStatus === 'active').length,
        pending: students.filter(s => s.enrollmentStatus === 'pending').length,
        inactive: students.filter(s => s.enrollmentStatus === 'inactive').length,
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Alunos</Title>
                    <Text c="dimmed">Gerencie os alunos da escola</Text>
                </div>
                <Group>
                    <ExportButton
                        data={filteredStudents.map(s => ({
                            name: s.name,
                            email: s.email,
                            phone: s.phone || '-',
                            className: s.className || 'Sem turma',
                            status: statusConfig[s.enrollmentStatus].label,
                            createdAt: new Date(s.createdAt).toLocaleDateString('pt-BR'),
                        }))}
                        columns={[
                            { key: 'name', label: 'Nome' },
                            { key: 'email', label: 'E-mail' },
                            { key: 'phone', label: 'Telefone' },
                            { key: 'className', label: 'Turma' },
                            { key: 'status', label: 'Status' },
                            { key: 'createdAt', label: 'Cadastrado em' },
                        ]}
                        title="Lista de Alunos"
                        filename="alunos"
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar"
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
                        Novo Aluno
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={4} mb="lg">
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconUsers size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.total}</Text>
                            <Text size="xs" c="dimmed">Total</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconUsers size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.active}</Text>
                            <Text size="xs" c="dimmed">Ativos</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="yellow">
                            <IconUsers size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.pending}</Text>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="gray">
                            <IconUsers size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.inactive}</Text>
                            <Text size="xs" c="dimmed">Inativos</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Filters */}
            <Group mb="lg">
                <TextInput
                    placeholder="Buscar alunos..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1 }}
                />
                <Select
                    placeholder="Status"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={statusFilter}
                    onChange={setStatusFilter}
                    data={[
                        { value: 'active', label: 'Ativo' },
                        { value: 'pending', label: 'Pendente' },
                        { value: 'inactive', label: 'Inativo' },
                        { value: 'graduated', label: 'Formado' },
                    ]}
                    w={150}
                />
                <Select
                    placeholder="Turma"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={classFilter}
                    onChange={setClassFilter}
                    data={uniqueClasses}
                    w={200}
                />
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : filteredStudents.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                        <IconUsers size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Nenhum aluno encontrado</Title>
                    <Text c="dimmed" mb="lg">
                        {students.length === 0
                            ? 'Cadastre o primeiro aluno da escola'
                            : 'Tente ajustar os filtros'}
                    </Text>
                </Card>
            ) : (
                <Card withBorder p={0}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Email</Table.Th>
                                <Table.Th>Telefone</Table.Th>
                                <Table.Th>Turma</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredStudents.map((student) => {
                                const status = statusConfig[student.enrollmentStatus];
                                return (
                                    <Table.Tr key={student.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar
                                                    size={32}
                                                    radius="xl"
                                                    src={student.avatarUrl}
                                                    color="violet"
                                                >
                                                    {student.name.charAt(0)}
                                                </Avatar>
                                                <Text fw={500}>{student.name}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <IconMail size={14} />
                                                <Text size="sm">{student.email}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            {student.phone ? (
                                                <Group gap={4}>
                                                    <IconPhone size={14} />
                                                    <Text size="sm">{student.phone}</Text>
                                                </Group>
                                            ) : (
                                                <Text size="sm" c="dimmed">-</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            {student.className ? (
                                                <Badge variant="light">{student.className}</Badge>
                                            ) : (
                                                <Text size="sm" c="dimmed">Sem turma</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={status.color}>{status.label}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle">
                                                        <IconDots size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item
                                                        component={Link}
                                                        href={`/teacher/student/${student.id}`}
                                                        leftSection={<IconEye size={14} />}
                                                    >
                                                        Ver Detalhes
                                                    </Menu.Item>
                                                    <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleOpenEdit(student)}>
                                                        Editar
                                                    </Menu.Item>
                                                    <Menu.Divider />
                                                    <Menu.Item color="red" leftSection={<IconTrash size={14} />}>
                                                        Excluir
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Student CRUD Modal */}
            <Modal
                opened={modalOpened}
                onClose={closeModal}
                title={editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
                size="md"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Nome completo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <TextInput
                        label="Email"
                        placeholder="email@exemplo.com"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <TextInput
                        label="Telefone"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Select
                        label="Turma"
                        placeholder="Selecione a turma"
                        data={uniqueClasses}
                        value={formData.classId}
                        onChange={(v) => setFormData({ ...formData, classId: v || '' })}
                        clearable
                    />
                    <Select
                        label="Status"
                        data={[
                            { value: 'active', label: 'Ativo' },
                            { value: 'pending', label: 'Pendente' },
                            { value: 'inactive', label: 'Inativo' },
                            { value: 'graduated', label: 'Formado' },
                        ]}
                        value={formData.status}
                        onChange={(v) => setFormData({ ...formData, status: v || 'active' })}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave}>
                            {editingStudent ? 'Salvar' : 'Criar Aluno'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

