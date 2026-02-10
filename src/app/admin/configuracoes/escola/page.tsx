'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Group,
    ThemeIcon,
    Button,
    TextInput,
    Switch,
    Divider,
    Avatar,
    ColorSwatch,
    FileInput,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconBuilding,
    IconPhoto,
    IconMail,
    IconPhone,
    IconMapPin,
    IconWorld,
    IconBrandFacebook,
    IconBrandInstagram,
    IconDeviceFloppy,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useApi } from '@/hooks/useApi';

export default function EscolaPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/profile');

    const [schoolData, setSchoolData] = useState({
        name: 'Node Zero Language School',
        email: 'contato@nodezero.edu.br',
        phone: '(11) 99999-9999',
        address: 'Rua das Linguagens, 100 - São Paulo, SP',
        website: 'www.nodezero.edu.br',
        facebook: 'nodezeroschool',
        instagram: '@nodezeroschool',
    });


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Dados da Escola</Title>
                </div>
                <Button leftSection={<IconDeviceFloppy size={16} />}>
                    Salvar Alterações
                </Button>
            </Group>

            {/* School Identity */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Identidade</Text>
                <Group align="flex-start" gap="xl">
                    <Stack align="center">
                        <Avatar size={120} radius="md" color="blue">
                            <IconBuilding size={60} />
                        </Avatar>
                        <Button variant="light" size="xs" leftSection={<IconPhoto size={14} />}>
                            Alterar Logo
                        </Button>
                    </Stack>
                    <Stack style={{ flex: 1 }} gap="md">
                        <TextInput
                            label="Nome da Escola"
                            value={schoolData.name}
                            onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                        />
                        <Group grow>
                            <TextInput
                                label="E-mail"
                                leftSection={<IconMail size={16} />}
                                value={schoolData.email}
                                onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                            />
                            <TextInput
                                label="Telefone"
                                leftSection={<IconPhone size={16} />}
                                value={schoolData.phone}
                                onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                            />
                        </Group>
                    </Stack>
                </Group>
            </Card>

            {/* Location */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Localização</Text>
                <Stack gap="md">
                    <TextInput
                        label="Endereço Completo"
                        leftSection={<IconMapPin size={16} />}
                        value={schoolData.address}
                        onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                    />
                    <Text size="xs" c="dimmed">
                        O endereço será exibido nas faturas e documentos oficiais.
                    </Text>
                </Stack>
            </Card>

            {/* Online Presence */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Presença Online</Text>
                <Stack gap="md">
                    <TextInput
                        label="Website"
                        leftSection={<IconWorld size={16} />}
                        value={schoolData.website}
                        onChange={(e) => setSchoolData({ ...schoolData, website: e.target.value })}
                    />
                    <Group grow>
                        <TextInput
                            label="Facebook"
                            leftSection={<IconBrandFacebook size={16} />}
                            value={schoolData.facebook}
                            onChange={(e) => setSchoolData({ ...schoolData, facebook: e.target.value })}
                        />
                        <TextInput
                            label="Instagram"
                            leftSection={<IconBrandInstagram size={16} />}
                            value={schoolData.instagram}
                            onChange={(e) => setSchoolData({ ...schoolData, instagram: e.target.value })}
                        />
                    </Group>
                </Stack>
            </Card>

            {/* Preferences */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Preferências</Text>
                <Stack gap="md">
                    <Group justify="space-between">
                        <div>
                            <Text size="sm">Modo de manutenção</Text>
                            <Text size="xs" c="dimmed">Desabilita acesso de alunos ao portal</Text>
                        </div>
                        <Switch />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <div>
                            <Text size="sm">Notificações por e-mail</Text>
                            <Text size="xs" c="dimmed">Enviar resumo diário para administradores</Text>
                        </div>
                        <Switch defaultChecked />
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <div>
                            <Text size="sm">Backup automático</Text>
                            <Text size="xs" c="dimmed">Backup diário dos dados às 3h</Text>
                        </div>
                        <Switch defaultChecked />
                    </Group>
                </Stack>
            </Card>
        </Stack>
    );
}

