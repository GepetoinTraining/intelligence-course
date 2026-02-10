'use client';

import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    SimpleGrid,
    ThemeIcon,
    Button,
} from '@mantine/core';
import {
    IconMail,
    IconBell,
    IconBrandWhatsapp,
    IconSend,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';

export default function ComunicacoesPage() {
    const { data: convsData, isLoading } = useApi<any>('/api/communicator/conversations');
    const unread = (convsData?.data || []).filter((c: any) => c.status === 'unread').length;

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Comunicações</Title>
                    <Text c="dimmed">Central de comunicação com alunos e responsáveis</Text>
                </div>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} mb="xl">
                <Card withBorder p="lg" component={Link} href="/admin/comunicacoes/mensagens" style={{ textDecoration: 'none' }}>
                    <Group>
                        <ThemeIcon color="blue" size="xl" radius="md">
                            <IconMail size={28} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">Mensagens</Text>
                            <Text size="sm" c="dimmed">Caixa de entrada e envio de mensagens</Text>
                        </div>
                    </Group>
                    <Badge mt="md" color="blue">{isLoading ? '...' : `${unread || 0} não lidas`}</Badge>
                </Card>

                <Card withBorder p="lg" component={Link} href="/admin/comunicacoes/notificacoes" style={{ textDecoration: 'none' }}>
                    <Group>
                        <ThemeIcon color="grape" size="xl" radius="md">
                            <IconBell size={28} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">Notificações</Text>
                            <Text size="sm" c="dimmed">Push notifications e alertas</Text>
                        </div>
                    </Group>
                    <Badge mt="md" color="grape">12 enviadas hoje</Badge>
                </Card>

                <Card withBorder p="lg" component={Link} href="/admin/comunicacoes/whatsapp" style={{ textDecoration: 'none' }}>
                    <Group>
                        <ThemeIcon color="green" size="xl" radius="md">
                            <IconBrandWhatsapp size={28} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">WhatsApp</Text>
                            <Text size="sm" c="dimmed">Mensagens automáticas e campanhas</Text>
                        </div>
                    </Group>
                    <Badge mt="md" color="green">Conectado</Badge>
                </Card>

                <Card withBorder p="lg" component={Link} href="/admin/comunicacoes/campanhas-email" style={{ textDecoration: 'none' }}>
                    <Group>
                        <ThemeIcon color="orange" size="xl" radius="md">
                            <IconSend size={28} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">Campanhas de Email</Text>
                            <Text size="sm" c="dimmed">Email marketing e newsletters</Text>
                        </div>
                    </Group>
                    <Badge mt="md" color="orange">2 agendadas</Badge>
                </Card>
            </SimpleGrid>
        </div>
    );
}

