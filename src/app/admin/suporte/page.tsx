'use client';

import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    SimpleGrid,
    ThemeIcon,
} from '@mantine/core';
import {
    IconTicket,
    IconHeadset,
    IconBook,
    IconMessages,
} from '@tabler/icons-react';
import Link from 'next/link';

export default function SuportePage() {
    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Suporte</Title>
                    <Text c="dimmed">Central de atendimento e ajuda</Text>
                </div>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} mb="xl">
                <Card withBorder p="lg" component={Link} href="/admin/suporte/tickets" style={{ textDecoration: 'none' }}>
                    <Group>
                        <ThemeIcon color="blue" size="xl" radius="md">
                            <IconTicket size={28} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">Tickets</Text>
                            <Text size="sm" c="dimmed">Gerenciar solicitações de suporte</Text>
                        </div>
                    </Group>
                    <Badge mt="md" color="blue">5 abertos</Badge>
                </Card>

                <Card withBorder p="lg" component={Link} href="/admin/suporte/chat" style={{ textDecoration: 'none' }}>
                    <Group>
                        <ThemeIcon color="green" size="xl" radius="md">
                            <IconMessages size={28} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">Chat ao Vivo</Text>
                            <Text size="sm" c="dimmed">Atendimento em tempo real</Text>
                        </div>
                    </Group>
                    <Badge mt="md" color="green">Online</Badge>
                </Card>

                <Card withBorder p="lg" component={Link} href="/admin/suporte/faq" style={{ textDecoration: 'none' }}>
                    <Group>
                        <ThemeIcon color="grape" size="xl" radius="md">
                            <IconBook size={28} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">Base de Conhecimento</Text>
                            <Text size="sm" c="dimmed">FAQ e artigos de ajuda</Text>
                        </div>
                    </Group>
                    <Badge mt="md" color="grape">45 artigos</Badge>
                </Card>

                <Card withBorder p="lg" component={Link} href="/admin/suporte/atendentes" style={{ textDecoration: 'none' }}>
                    <Group>
                        <ThemeIcon color="orange" size="xl" radius="md">
                            <IconHeadset size={28} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">Atendentes</Text>
                            <Text size="sm" c="dimmed">Equipe de suporte</Text>
                        </div>
                    </Group>
                    <Badge mt="md" color="orange">4 online</Badge>
                </Card>
            </SimpleGrid>
        </div>
    );
}

