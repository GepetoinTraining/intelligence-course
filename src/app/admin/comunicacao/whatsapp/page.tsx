'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Paper, Button, TextInput, Alert,
    Stepper,
    Loader,
    Center,
} from '@mantine/core';
import {
    IconBrandWhatsapp, IconPlug, IconShieldCheck,
    IconMessageCircle, IconAlertCircle, IconCheck,
    IconSettings,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

export default function WhatsAppPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/communicator/conversations?channel=whatsapp');

    const [step, setStep] = useState(0);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [businessId, setBusinessId] = useState('');
    const [token, setToken] = useState('');


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Comunicação</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>WhatsApp</Text>
                    </Group>
                    <Group gap="md" align="center">
                        <Title order={1}>WhatsApp Business</Title>
                        <Badge variant="light" color="yellow" size="sm">Integração Pendente</Badge>
                    </Group>
                    <Text c="dimmed" mt="xs">Integre o WhatsApp Business API para comunicação automática com alunos e responsáveis.</Text>
                </div>

                {/* Status Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Status</Text>
                                <Text size="xl" fw={700} c="yellow">Pendente</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="yellow">
                                <IconPlug size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Mensagens</Text>
                                <Text size="xl" fw={700}>0</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconMessageCircle size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Templates</Text>
                                <Text size="xl" fw={700}>0</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconSettings size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Verificação</Text>
                                <Text size="xl" fw={700} c="yellow">—</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconShieldCheck size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Setup Wizard */}
                <Card withBorder padding="xl" radius="md">
                    <Text fw={600} mb="xl" size="lg">Assistente de Configuração</Text>
                    <Stepper active={step} onStepClick={setStep}>
                        <Stepper.Step label="Conta Business" description="Vincular conta">
                            <Paper withBorder p="xl" radius="md" mt="md">
                                <Stack gap="md">
                                    <Text fw={500}>1. Crie uma conta no Meta Business Suite</Text>
                                    <Text size="sm" c="dimmed">
                                        Para utilizar a API do WhatsApp Business, você precisa de uma conta verificada no
                                        Meta Business Suite (antigo Facebook Business Manager).
                                    </Text>
                                    <TextInput
                                        label="Business Account ID"
                                        placeholder="Ex: 123456789012345"
                                        value={businessId}
                                        onChange={(e) => setBusinessId(e.currentTarget.value)}
                                    />
                                    <Button onClick={() => setStep(1)} disabled={!businessId.trim()}>
                                        Próximo
                                    </Button>
                                </Stack>
                            </Paper>
                        </Stepper.Step>

                        <Stepper.Step label="Número" description="Configurar número">
                            <Paper withBorder p="xl" radius="md" mt="md">
                                <Stack gap="md">
                                    <Text fw={500}>2. Configure seu número de telefone</Text>
                                    <Text size="sm" c="dimmed">
                                        Informe o número de telefone que será usado para envio de mensagens.
                                        O número precisa estar associado à sua conta do WhatsApp Business.
                                    </Text>
                                    <TextInput
                                        label="Número de Telefone"
                                        placeholder="Ex: +55 11 99999-9999"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.currentTarget.value)}
                                    />
                                    <Group>
                                        <Button variant="light" onClick={() => setStep(0)}>Voltar</Button>
                                        <Button onClick={() => setStep(2)} disabled={!phoneNumber.trim()}>Próximo</Button>
                                    </Group>
                                </Stack>
                            </Paper>
                        </Stepper.Step>

                        <Stepper.Step label="Token de Acesso" description="API Token">
                            <Paper withBorder p="xl" radius="md" mt="md">
                                <Stack gap="md">
                                    <Text fw={500}>3. Configure o Token de Acesso</Text>
                                    <Text size="sm" c="dimmed">
                                        Gere um token de acesso permanente no Meta Business Suite e cole abaixo.
                                        Este token será criptografado e armazenado com segurança.
                                    </Text>
                                    <TextInput
                                        label="Access Token"
                                        placeholder="EAA..."
                                        value={token}
                                        onChange={(e) => setToken(e.currentTarget.value)}
                                        type="password"
                                    />
                                    <Group>
                                        <Button variant="light" onClick={() => setStep(1)}>Voltar</Button>
                                        <Button onClick={() => setStep(3)} disabled={!token.trim()}>Próximo</Button>
                                    </Group>
                                </Stack>
                            </Paper>
                        </Stepper.Step>

                        <Stepper.Completed>
                            <Paper withBorder p="xl" radius="md" mt="md" style={{ textAlign: 'center' }}>
                                <ThemeIcon size={64} radius="xl" variant="light" color="green" mx="auto" mb="md">
                                    <IconCheck size={32} />
                                </ThemeIcon>
                                <Title order={3} mb="xs">Configuração quase pronta!</Title>
                                <Text c="dimmed" maw={500} mx="auto" mb="lg">
                                    As credenciais foram preenchidas. Em um ambiente de produção, elas seriam
                                    salvas via a API de configuração com criptografia end-to-end.
                                </Text>
                                <Alert icon={<IconAlertCircle size={16} />} color="blue" title="Próximos Passos" maw={500} mx="auto">
                                    <Text size="sm">
                                        1. Configure o Webhook URL no Meta Business Suite<br />
                                        2. Crie templates de mensagem aprovados pela Meta<br />
                                        3. Verifique seu número de telefone<br />
                                        4. Teste o envio de uma mensagem
                                    </Text>
                                </Alert>
                                <Button variant="light" mt="md" onClick={() => setStep(0)}>Refazer Configuração</Button>
                            </Paper>
                        </Stepper.Completed>
                    </Stepper>
                </Card>

                {/* Feature Cards */}
                <SimpleGrid cols={{ base: 1, md: 3 }}>
                    <Card withBorder padding="lg" radius="md">
                        <ThemeIcon size={40} radius="md" variant="light" color="green" mb="md">
                            <IconBrandWhatsapp size={20} />
                        </ThemeIcon>
                        <Text fw={600} mb="xs">Mensagens Automáticas</Text>
                        <Text size="sm" c="dimmed">
                            Envie confirmações de matrícula, lembretes de pagamento e avisos
                            automaticamente via WhatsApp.
                        </Text>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <ThemeIcon size={40} radius="md" variant="light" color="blue" mb="md">
                            <IconMessageCircle size={20} />
                        </ThemeIcon>
                        <Text fw={600} mb="xs">Templates Aprovados</Text>
                        <Text size="sm" c="dimmed">
                            Crie e gerencie templates de mensagens aprovados pela Meta para
                            comunicação profissional.
                        </Text>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <ThemeIcon size={40} radius="md" variant="light" color="violet" mb="md">
                            <IconShieldCheck size={20} />
                        </ThemeIcon>
                        <Text fw={600} mb="xs">Relatórios de Envio</Text>
                        <Text size="sm" c="dimmed">
                            Acompanhe taxas de entrega, leitura e resposta de todas as
                            mensagens enviadas.
                        </Text>
                    </Card>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}
