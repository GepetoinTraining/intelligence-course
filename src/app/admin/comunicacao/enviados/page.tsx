'use client';

import { Container, Title, Text, Paper, Group, ThemeIcon, Stack, Badge } from '@mantine/core';
import { IconHammer } from '@tabler/icons-react';

export default function Page() {
    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Comunicação</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Enviados</Text>
                    </Group>
                    <Group gap="md" align="center">
                        <Title order={1}>Enviados</Title>
                        <Badge variant="light" color="yellow" size="sm">Em Construção</Badge>
                    </Group>
                    <Text c="dimmed" mt="xs">Histórico de mensagens enviadas e seus status de entrega.</Text>
                </div>
                
                <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} radius="xl" variant="light" color="yellow" mx="auto" mb="md">
                        <IconHammer size={32} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Página em Desenvolvimento</Title>
                    <Text c="dimmed" maw={500} mx="auto">
                        Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
                        Fique atento às próximas atualizações do NodeZero.
                    </Text>
                </Paper>
            </Stack>
        </Container>
    );
}
