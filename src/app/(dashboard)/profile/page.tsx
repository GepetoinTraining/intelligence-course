'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    TextInput, Textarea, Select, ThemeIcon, Paper, ActionIcon,
    Avatar, Divider, Switch, Tabs, Table, Modal, Grid,
    NumberInput, Loader, Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconUser, IconMail, IconPhone, IconMapPin, IconCreditCard,
    IconEdit, IconCheck, IconPlus, IconTrash, IconShield,
    IconBuilding, IconCalendar, IconBell, IconLock, IconCamera,
    IconBrandWhatsapp, IconReceipt, IconCash,
} from '@tabler/icons-react';

// DEFAULT profile data (used as fallback when API is unavailable)
const defaultProfileData = {
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    cpf: '',
    birthDate: '',
    avatarUrl: null as string | null,

    // Address
    address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
    },

    // Billing Address (can be different)
    billingAddress: {
        sameAsAddress: true,
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
    },

    // Payment Methods
    paymentMethods: [] as Array<{
        id: string;
        type: string;
        brand: string;
        last4: string;
        expiry: string;
        isDefault: boolean;
        holderName: string;
    }>,

    // Emergency Contact
    emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
    },

    // Preferences
    preferences: {
        emailNotifications: true,
        whatsappNotifications: true,
        marketingEmails: false,
        language: 'pt-BR',
    },

    // Children (for parents)
    children: [] as Array<{
        id: string;
        name: string;
        birthDate: string;
        course: string;
        class: string;
    }>,
};

const STATES = [
    { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' }, { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' }, { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' }, { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
];

export default function ProfilePage() {
    const [profile, setProfile] = useState(defaultProfileData);
    const [loading, setLoading] = useState(true);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);
    const [sameAsBilling, setSameAsBilling] = useState(true);

    // Fetch profile from API
    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/users/me');
            if (res.ok) {
                const data = await res.json();
                const u = data.user || data;
                setProfile(prev => ({
                    ...prev,
                    firstName: u.firstName || u.name?.split(' ')[0] || '',
                    lastName: u.lastName || u.name?.split(' ').slice(1).join(' ') || '',
                    email: u.email || '',
                    phone: u.phone || '',
                    whatsapp: u.whatsapp || u.phone || '',
                    cpf: u.cpf || '',
                    birthDate: u.birthDate || '',
                    avatarUrl: u.avatarUrl || u.imageUrl || null,
                    address: u.address || prev.address,
                    billingAddress: u.billingAddress || prev.billingAddress,
                    paymentMethods: u.paymentMethods || prev.paymentMethods,
                    emergencyContact: u.emergencyContact || prev.emergencyContact,
                    preferences: u.preferences || prev.preferences,
                    children: u.children || prev.children,
                }));
                if (u.billingAddress) {
                    setSameAsBilling(u.billingAddress.sameAsAddress ?? true);
                }
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSave = async (section: string) => {
        try {
            await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, data: profile }),
            });
        } catch (err) {
            console.error('Failed to save profile:', err);
        }
        setEditingSection(null);
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={1}>Meu Perfil</Title>
                    <Text c="dimmed" size="lg">
                        Gerencie suas informações pessoais, endereços e pagamento
                    </Text>
                </div>
            </Group>

            <Tabs defaultValue="personal">
                <Tabs.List>
                    <Tabs.Tab value="personal" leftSection={<IconUser size={16} />}>
                        Dados Pessoais
                    </Tabs.Tab>
                    <Tabs.Tab value="address" leftSection={<IconMapPin size={16} />}>
                        Endereços
                    </Tabs.Tab>
                    <Tabs.Tab value="payment" leftSection={<IconCreditCard size={16} />}>
                        Pagamento
                    </Tabs.Tab>
                    <Tabs.Tab value="preferences" leftSection={<IconBell size={16} />}>
                        Preferências
                    </Tabs.Tab>
                    <Tabs.Tab value="security" leftSection={<IconShield size={16} />}>
                        Segurança
                    </Tabs.Tab>
                </Tabs.List>

                {/* ===== PERSONAL INFO TAB ===== */}
                <Tabs.Panel value="personal" pt="xl">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        {/* Profile Card */}
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group justify="space-between" mb="md">
                                <Title order={4}>Informações Básicas</Title>
                                {editingSection !== 'personal' ? (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconEdit size={14} />}
                                        onClick={() => setEditingSection('personal')}
                                    >
                                        Editar
                                    </Button>
                                ) : (
                                    <Group gap="xs">
                                        <Button
                                            variant="default"
                                            size="xs"
                                            onClick={() => setEditingSection(null)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="xs"
                                            leftSection={<IconCheck size={14} />}
                                            onClick={() => handleSave('personal')}
                                        >
                                            Salvar
                                        </Button>
                                    </Group>
                                )}
                            </Group>

                            <Group mb="lg">
                                <Avatar size={80} radius="xl" color="blue">
                                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                                </Avatar>
                                {editingSection === 'personal' && (
                                    <Button variant="light" size="xs" leftSection={<IconCamera size={14} />}>
                                        Alterar Foto
                                    </Button>
                                )}
                            </Group>

                            <Stack gap="md">
                                <Grid>
                                    <Grid.Col span={6}>
                                        <TextInput
                                            label="Nome"
                                            value={profile.firstName}
                                            disabled={editingSection !== 'personal'}
                                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <TextInput
                                            label="Sobrenome"
                                            value={profile.lastName}
                                            disabled={editingSection !== 'personal'}
                                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                        />
                                    </Grid.Col>
                                </Grid>

                                <TextInput
                                    label="E-mail"
                                    value={profile.email}
                                    disabled={editingSection !== 'personal'}
                                    leftSection={<IconMail size={16} />}
                                />

                                <TextInput
                                    label="CPF"
                                    value={profile.cpf}
                                    disabled={editingSection !== 'personal'}
                                    leftSection={<IconShield size={16} />}
                                />

                                <TextInput
                                    label="Data de Nascimento"
                                    type="date"
                                    value={profile.birthDate}
                                    disabled={editingSection !== 'personal'}
                                    leftSection={<IconCalendar size={16} />}
                                />
                            </Stack>
                        </Card>

                        {/* Contact Info */}
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group justify="space-between" mb="md">
                                <Title order={4}>Contato</Title>
                                {editingSection !== 'contact' ? (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconEdit size={14} />}
                                        onClick={() => setEditingSection('contact')}
                                    >
                                        Editar
                                    </Button>
                                ) : (
                                    <Group gap="xs">
                                        <Button
                                            variant="default"
                                            size="xs"
                                            onClick={() => setEditingSection(null)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="xs"
                                            leftSection={<IconCheck size={14} />}
                                            onClick={() => handleSave('contact')}
                                        >
                                            Salvar
                                        </Button>
                                    </Group>
                                )}
                            </Group>

                            <Stack gap="md">
                                <TextInput
                                    label="Telefone"
                                    value={profile.phone}
                                    disabled={editingSection !== 'contact'}
                                    leftSection={<IconPhone size={16} />}
                                    placeholder="(11) 99999-9999"
                                />

                                <TextInput
                                    label="WhatsApp"
                                    value={profile.whatsapp}
                                    disabled={editingSection !== 'contact'}
                                    leftSection={<IconBrandWhatsapp size={16} />}
                                    placeholder="(11) 99999-9999"
                                />

                                <Divider my="sm" label="Contato de Emergência" labelPosition="left" />

                                <TextInput
                                    label="Nome"
                                    value={profile.emergencyContact.name}
                                    disabled={editingSection !== 'contact'}
                                />

                                <Grid>
                                    <Grid.Col span={6}>
                                        <TextInput
                                            label="Parentesco"
                                            value={profile.emergencyContact.relationship}
                                            disabled={editingSection !== 'contact'}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <TextInput
                                            label="Telefone"
                                            value={profile.emergencyContact.phone}
                                            disabled={editingSection !== 'contact'}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Stack>
                        </Card>

                        {/* Children (for parents) */}
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group justify="space-between" mb="md">
                                <Title order={4}>Meus Filhos</Title>
                                <Button variant="light" size="xs" leftSection={<IconPlus size={14} />}>
                                    Adicionar
                                </Button>
                            </Group>

                            <Stack gap="md">
                                {profile.children.map((child) => (
                                    <Paper key={child.id} p="md" withBorder radius="md">
                                        <Group justify="space-between">
                                            <Group>
                                                <Avatar size="lg" color="violet" radius="xl">
                                                    {child.name.split(' ').map(n => n[0]).join('')}
                                                </Avatar>
                                                <div>
                                                    <Text fw={600}>{child.name}</Text>
                                                    <Text size="sm" c="dimmed">{child.course} • {child.class}</Text>
                                                </div>
                                            </Group>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Card>
                    </SimpleGrid>
                </Tabs.Panel>

                {/* ===== ADDRESS TAB ===== */}
                <Tabs.Panel value="address" pt="xl">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        {/* Main Address */}
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group justify="space-between" mb="md">
                                <Group>
                                    <ThemeIcon color="blue" variant="light" size="lg">
                                        <IconMapPin size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Title order={4}>Endereço Principal</Title>
                                        <Text size="xs" c="dimmed">Residência</Text>
                                    </div>
                                </Group>
                                {editingSection !== 'address' ? (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconEdit size={14} />}
                                        onClick={() => setEditingSection('address')}
                                    >
                                        Editar
                                    </Button>
                                ) : (
                                    <Group gap="xs">
                                        <Button
                                            variant="default"
                                            size="xs"
                                            onClick={() => setEditingSection(null)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="xs"
                                            leftSection={<IconCheck size={14} />}
                                            onClick={() => handleSave('address')}
                                        >
                                            Salvar
                                        </Button>
                                    </Group>
                                )}
                            </Group>

                            <Stack gap="md">
                                <TextInput
                                    label="CEP"
                                    value={profile.address.zipCode}
                                    disabled={editingSection !== 'address'}
                                    placeholder="00000-000"
                                />
                                <TextInput
                                    label="Rua"
                                    value={profile.address.street}
                                    disabled={editingSection !== 'address'}
                                />
                                <Grid>
                                    <Grid.Col span={4}>
                                        <TextInput
                                            label="Número"
                                            value={profile.address.number}
                                            disabled={editingSection !== 'address'}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={8}>
                                        <TextInput
                                            label="Complemento"
                                            value={profile.address.complement}
                                            disabled={editingSection !== 'address'}
                                        />
                                    </Grid.Col>
                                </Grid>
                                <TextInput
                                    label="Bairro"
                                    value={profile.address.neighborhood}
                                    disabled={editingSection !== 'address'}
                                />
                                <Grid>
                                    <Grid.Col span={8}>
                                        <TextInput
                                            label="Cidade"
                                            value={profile.address.city}
                                            disabled={editingSection !== 'address'}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <Select
                                            label="Estado"
                                            value={profile.address.state}
                                            disabled={editingSection !== 'address'}
                                            data={STATES}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Stack>
                        </Card>

                        {/* Billing Address */}
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group justify="space-between" mb="md">
                                <Group>
                                    <ThemeIcon color="green" variant="light" size="lg">
                                        <IconReceipt size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Title order={4}>Endereço de Cobrança</Title>
                                        <Text size="xs" c="dimmed">Para notas fiscais</Text>
                                    </div>
                                </Group>
                                {editingSection !== 'billing' ? (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconEdit size={14} />}
                                        onClick={() => setEditingSection('billing')}
                                    >
                                        Editar
                                    </Button>
                                ) : (
                                    <Group gap="xs">
                                        <Button
                                            variant="default"
                                            size="xs"
                                            onClick={() => setEditingSection(null)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="xs"
                                            leftSection={<IconCheck size={14} />}
                                            onClick={() => handleSave('billing')}
                                        >
                                            Salvar
                                        </Button>
                                    </Group>
                                )}
                            </Group>

                            <Switch
                                label="Mesmo endereço principal"
                                checked={sameAsBilling}
                                onChange={(e) => setSameAsBilling(e.currentTarget.checked)}
                                mb="md"
                                disabled={editingSection !== 'billing'}
                            />

                            {!sameAsBilling && (
                                <Stack gap="md">
                                    <TextInput
                                        label="CEP"
                                        value={profile.billingAddress.zipCode}
                                        disabled={editingSection !== 'billing'}
                                        placeholder="00000-000"
                                    />
                                    <TextInput
                                        label="Rua"
                                        value={profile.billingAddress.street}
                                        disabled={editingSection !== 'billing'}
                                    />
                                    <Grid>
                                        <Grid.Col span={4}>
                                            <TextInput
                                                label="Número"
                                                value={profile.billingAddress.number}
                                                disabled={editingSection !== 'billing'}
                                            />
                                        </Grid.Col>
                                        <Grid.Col span={8}>
                                            <TextInput
                                                label="Complemento"
                                                value={profile.billingAddress.complement}
                                                disabled={editingSection !== 'billing'}
                                            />
                                        </Grid.Col>
                                    </Grid>
                                    <TextInput
                                        label="Bairro"
                                        value={profile.billingAddress.neighborhood}
                                        disabled={editingSection !== 'billing'}
                                    />
                                    <Grid>
                                        <Grid.Col span={8}>
                                            <TextInput
                                                label="Cidade"
                                                value={profile.billingAddress.city}
                                                disabled={editingSection !== 'billing'}
                                            />
                                        </Grid.Col>
                                        <Grid.Col span={4}>
                                            <Select
                                                label="Estado"
                                                value={profile.billingAddress.state}
                                                disabled={editingSection !== 'billing'}
                                                data={STATES}
                                            />
                                        </Grid.Col>
                                    </Grid>
                                </Stack>
                            )}

                            {sameAsBilling && (
                                <Paper p="md" bg="gray.0" radius="md">
                                    <Text size="sm" c="dimmed">
                                        Usando o mesmo endereço: {profile.address.street}, {profile.address.number} - {profile.address.city}/{profile.address.state}
                                    </Text>
                                </Paper>
                            )}
                        </Card>
                    </SimpleGrid>
                </Tabs.Panel>

                {/* ===== PAYMENT TAB ===== */}
                <Tabs.Panel value="payment" pt="xl">
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Group justify="space-between" mb="lg">
                            <Title order={4}>Métodos de Pagamento</Title>
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={openPaymentModal}
                            >
                                Adicionar Cartão
                            </Button>
                        </Group>

                        <Stack gap="md">
                            {profile.paymentMethods.map((method) => (
                                <Paper
                                    key={method.id}
                                    p="md"
                                    withBorder
                                    radius="md"
                                    style={{
                                        border: method.isDefault ? '2px solid var(--mantine-color-green-5)' : undefined
                                    }}
                                >
                                    <Group justify="space-between">
                                        <Group>
                                            <ThemeIcon
                                                size="xl"
                                                radius="md"
                                                variant="light"
                                                color={method.brand === 'Visa' ? 'blue' : 'red'}
                                            >
                                                <IconCreditCard size={24} />
                                            </ThemeIcon>
                                            <div>
                                                <Group gap="xs">
                                                    <Text fw={600}>{method.brand} •••• {method.last4}</Text>
                                                    {method.isDefault && (
                                                        <Badge color="green" size="xs">Principal</Badge>
                                                    )}
                                                </Group>
                                                <Text size="sm" c="dimmed">
                                                    Expira em {method.expiry} • {method.holderName}
                                                </Text>
                                            </div>
                                        </Group>
                                        <Group>
                                            {!method.isDefault && (
                                                <Button variant="subtle" size="xs">
                                                    Definir como Principal
                                                </Button>
                                            )}
                                            <ActionIcon variant="subtle" color="red">
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>

                        <Divider my="lg" />

                        <Title order={5} mb="md">Histórico de Pagamentos</Title>
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Data</Table.Th>
                                    <Table.Th>Descrição</Table.Th>
                                    <Table.Th>Método</Table.Th>
                                    <Table.Th>Valor</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                <Table.Tr>
                                    <Table.Td>01/02/2026</Table.Td>
                                    <Table.Td>Mensalidade Fev/2026 - Lucas</Table.Td>
                                    <Table.Td>Visa •••• 4242</Table.Td>
                                    <Table.Td>R$ 450,00</Table.Td>
                                    <Table.Td><Badge color="green">Pago</Badge></Table.Td>
                                </Table.Tr>
                                <Table.Tr>
                                    <Table.Td>01/01/2026</Table.Td>
                                    <Table.Td>Mensalidade Jan/2026 - Lucas</Table.Td>
                                    <Table.Td>Visa •••• 4242</Table.Td>
                                    <Table.Td>R$ 450,00</Table.Td>
                                    <Table.Td><Badge color="green">Pago</Badge></Table.Td>
                                </Table.Tr>
                                <Table.Tr>
                                    <Table.Td>15/12/2025</Table.Td>
                                    <Table.Td>Matrícula 2026 - Lucas</Table.Td>
                                    <Table.Td>Visa •••• 4242</Table.Td>
                                    <Table.Td>R$ 200,00</Table.Td>
                                    <Table.Td><Badge color="green">Pago</Badge></Table.Td>
                                </Table.Tr>
                            </Table.Tbody>
                        </Table>
                    </Card>
                </Tabs.Panel>

                {/* ===== PREFERENCES TAB ===== */}
                <Tabs.Panel value="preferences" pt="xl">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Title order={4} mb="md">Notificações</Title>
                            <Stack gap="md">
                                <Switch
                                    label="Notificações por E-mail"
                                    description="Receber atualizações sobre progresso, pagamentos e mensagens"
                                    checked={profile.preferences.emailNotifications}
                                />
                                <Switch
                                    label="Notificações por WhatsApp"
                                    description="Lembretes de aula e comunicados importantes"
                                    checked={profile.preferences.whatsappNotifications}
                                />
                                <Switch
                                    label="E-mails de Marketing"
                                    description="Promoções, novidades e dicas de estudo"
                                    checked={profile.preferences.marketingEmails}
                                />
                            </Stack>
                        </Card>

                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Title order={4} mb="md">Idioma e Região</Title>
                            <Stack gap="md">
                                <Select
                                    label="Idioma"
                                    value={profile.preferences.language}
                                    data={[
                                        { value: 'pt-BR', label: 'Português (Brasil)' },
                                        { value: 'en-US', label: 'English (US)' },
                                        { value: 'es-ES', label: 'Español' },
                                    ]}
                                />
                                <Select
                                    label="Fuso Horário"
                                    defaultValue="america_sao_paulo"
                                    data={[
                                        { value: 'america_sao_paulo', label: 'América/São Paulo (BRT)' },
                                        { value: 'america_new_york', label: 'América/New York (EST)' },
                                    ]}
                                />
                            </Stack>
                        </Card>
                    </SimpleGrid>
                </Tabs.Panel>

                {/* ===== SECURITY TAB ===== */}
                <Tabs.Panel value="security" pt="xl">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Title order={4} mb="md">Alterar Senha</Title>
                            <Stack gap="md">
                                <TextInput
                                    label="Senha Atual"
                                    type="password"
                                    placeholder="••••••••"
                                />
                                <TextInput
                                    label="Nova Senha"
                                    type="password"
                                    placeholder="••••••••"
                                    description="Mínimo 8 caracteres"
                                />
                                <TextInput
                                    label="Confirmar Nova Senha"
                                    type="password"
                                    placeholder="••••••••"
                                />
                                <Button>Alterar Senha</Button>
                            </Stack>
                        </Card>

                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Title order={4} mb="md">Sessões Ativas</Title>
                            <Stack gap="md">
                                <Paper p="md" withBorder radius="md" bg="blue.0">
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={500}>Este dispositivo</Text>
                                            <Text size="sm" c="dimmed">Chrome • Windows • São Paulo</Text>
                                        </div>
                                        <Badge color="blue">Atual</Badge>
                                    </Group>
                                </Paper>
                                <Paper p="md" withBorder radius="md">
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={500}>iPhone 14</Text>
                                            <Text size="sm" c="dimmed">Safari • iOS • Último acesso há 2h</Text>
                                        </div>
                                        <Button variant="subtle" color="red" size="xs">
                                            Encerrar
                                        </Button>
                                    </Group>
                                </Paper>
                                <Button variant="outline" color="red">
                                    Encerrar Todas as Outras Sessões
                                </Button>
                            </Stack>
                        </Card>

                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Title order={4} mb="md">Autenticação em Dois Fatores</Title>
                            <Text size="sm" c="dimmed" mb="md">
                                Adicione uma camada extra de segurança à sua conta
                            </Text>
                            <Button variant="light" leftSection={<IconShield size={16} />}>
                                Ativar 2FA
                            </Button>
                        </Card>

                        <Card shadow="sm" radius="md" p="lg" withBorder bg="red.0">
                            <Title order={4} mb="md" c="red">Zona de Perigo</Title>
                            <Text size="sm" c="dimmed" mb="md">
                                Ações irreversíveis para sua conta
                            </Text>
                            <Group>
                                <Button variant="outline" color="red">
                                    Desativar Conta
                                </Button>
                                <Button variant="filled" color="red">
                                    Excluir Conta
                                </Button>
                            </Group>
                        </Card>
                    </SimpleGrid>
                </Tabs.Panel>
            </Tabs>

            {/* Add Payment Modal */}
            <Modal
                opened={paymentModalOpened}
                onClose={closePaymentModal}
                title="Adicionar Cartão"
                size="md"
            >
                <Stack>
                    <TextInput
                        label="Número do Cartão"
                        placeholder="0000 0000 0000 0000"
                        leftSection={<IconCreditCard size={16} />}
                    />
                    <TextInput
                        label="Nome no Cartão"
                        placeholder="NOME COMO ESTÁ NO CARTÃO"
                    />
                    <Grid>
                        <Grid.Col span={6}>
                            <TextInput
                                label="Validade"
                                placeholder="MM/AA"
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <TextInput
                                label="CVV"
                                placeholder="000"
                                type="password"
                            />
                        </Grid.Col>
                    </Grid>
                    <TextInput
                        label="CPF do Titular"
                        placeholder="000.000.000-00"
                    />
                    <Switch
                        label="Definir como cartão principal"
                        defaultChecked
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closePaymentModal}>
                            Cancelar
                        </Button>
                        <Button onClick={closePaymentModal}>
                            Adicionar Cartão
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

