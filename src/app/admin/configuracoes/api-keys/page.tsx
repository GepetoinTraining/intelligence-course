'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Paper, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Button, ActionIcon,
    CopyButton, Tooltip, Modal, TextInput, Select,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconKey, IconAlertCircle, IconCopy, IconCheck,
    IconTrash, IconPlus, IconShieldLock,
} from '@tabler/icons-react';

interface ApiKeyRecord {
    id: string;
    provider: string;
    keyHint: string;
    lastUsedAt?: number;
    totalRequests?: number;
    createdAt?: number;
}

const PROVIDER_INFO: Record<string, { label: string; color: string; prefix: string }> = {
    anthropic: { label: 'Anthropic (Claude)', color: 'violet', prefix: 'sk-ant-' },
    openai: { label: 'OpenAI (GPT)', color: 'green', prefix: 'sk-' },
    google: { label: 'Google (Gemini)', color: 'blue', prefix: 'AI' },
    groq: { label: 'Groq', color: 'orange', prefix: 'gsk_' },
};

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);
    const [newProvider, setNewProvider] = useState<string | null>(null);
    const [newKey, setNewKey] = useState('');

    const fetchKeys = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/api-keys');
            if (!res.ok) throw new Error('Falha ao buscar chaves');
            const data = await res.json();
            setKeys(data.keys || []);
        } catch (err) {
            setError('Falha ao carregar chaves de API');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchKeys(); }, [fetchKeys]);

    const handleAdd = async () => {
        if (!newProvider || !newKey.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: newProvider, apiKey: newKey }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Falha ao salvar chave');
                return;
            }
            setNewProvider(null);
            setNewKey('');
            close();
            fetchKeys();
        } catch (err) {
            setError('Erro ao adicionar chave de API');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (provider: string) => {
        try {
            const res = await fetch(`/api/api-keys?provider=${provider}`, { method: 'DELETE' });
            if (res.ok) fetchKeys();
        } catch (err) {
            console.error(err);
        }
    };

    const fmtDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString('pt-BR') : '—';

    const configuredProviders = new Set(keys.map(k => k.provider));
    const availableProviders = Object.entries(PROVIDER_INFO)
        .map(([value, info]) => ({
            value,
            label: info.label,
            disabled: configuredProviders.has(value),
        }));

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando chaves de API...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Configurações</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>API Keys</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Chaves de API</Title>
                        <Button leftSection={<IconPlus size={16} />} onClick={open}>
                            Adicionar Chave
                        </Button>
                    </Group>
                    <Text c="dimmed" mt="xs">Gerencie suas chaves de API para integrações com provedores de IA.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro" withCloseButton onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Security Notice */}
                <Alert icon={<IconShieldLock size={16} />} color="blue" variant="light" title="Segurança">
                    Suas chaves de API são criptografadas antes de serem armazenadas. Nunca compartilhe suas chaves.
                    Apenas um hint (final da chave) é armazenado para identificação.
                </Alert>

                {/* Summary Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    {Object.entries(PROVIDER_INFO).map(([provider, info]) => {
                        const key = keys.find(k => k.provider === provider);
                        return (
                            <Card key={provider} withBorder padding="lg" radius="md">
                                <Group justify="space-between">
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{info.label.split(' ')[0]}</Text>
                                        <Text size="sm" fw={600} c={key ? 'green' : 'dimmed'}>
                                            {key ? 'Configurada' : 'Não configurada'}
                                        </Text>
                                        {key && (
                                            <Text size="xs" c="dimmed">{key.totalRequests || 0} req</Text>
                                        )}
                                    </div>
                                    <ThemeIcon
                                        size={40}
                                        radius="md"
                                        variant="light"
                                        color={key ? info.color : 'gray'}
                                    >
                                        <IconKey size={20} />
                                    </ThemeIcon>
                                </Group>
                            </Card>
                        );
                    })}
                </SimpleGrid>

                {/* Keys Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Chaves Configuradas</Text>
                        <Badge variant="light">{keys.length} chave{keys.length !== 1 ? 's' : ''}</Badge>
                    </Group>
                    {keys.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconKey size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhuma chave configurada</Title>
                            <Text c="dimmed" maw={400} mx="auto">
                                Adicione uma chave de API para usar os recursos de IA da plataforma.
                            </Text>
                            <Button mt="lg" onClick={open} leftSection={<IconPlus size={16} />}>
                                Adicionar Primeira Chave
                            </Button>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Provedor</Table.Th>
                                    <Table.Th>Hint da Chave</Table.Th>
                                    <Table.Th ta="center">Requisições</Table.Th>
                                    <Table.Th>Último Uso</Table.Th>
                                    <Table.Th>Criada em</Table.Th>
                                    <Table.Th ta="center">Ações</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {keys.map(key => {
                                    const info = PROVIDER_INFO[key.provider] || { label: key.provider, color: 'gray', prefix: '' };
                                    return (
                                        <Table.Tr key={key.id}>
                                            <Table.Td>
                                                <Badge variant="light" color={info.color}>{info.label}</Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Text size="sm" ff="monospace">{key.keyHint || '•••••'}</Text>
                                                    <CopyButton value={key.keyHint || ''}>
                                                        {({ copied, copy }) => (
                                                            <Tooltip label={copied ? 'Copiado!' : 'Copiar hint'}>
                                                                <ActionIcon variant="subtle" size="xs" onClick={copy}>
                                                                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </CopyButton>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Text size="sm">{key.totalRequests || 0}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{fmtDate(key.lastUsedAt)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{fmtDate(key.createdAt)}</Text>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Tooltip label="Remover chave">
                                                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDelete(key.provider)}>
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>

            {/* Add Key Modal */}
            <Modal opened={opened} onClose={close} title="Adicionar Chave de API" centered>
                <Stack>
                    <Select
                        label="Provedor"
                        placeholder="Selecione o provedor"
                        value={newProvider}
                        onChange={setNewProvider}
                        data={availableProviders}
                    />
                    <TextInput
                        label="Chave de API"
                        placeholder={newProvider ? PROVIDER_INFO[newProvider]?.prefix + '...' : 'Selecione um provedor primeiro'}
                        value={newKey}
                        onChange={(e) => setNewKey(e.currentTarget.value)}
                        type="password"
                    />
                    <Text size="xs" c="dimmed">
                        A chave será criptografada antes de ser armazenada. Apenas um hint será visível.
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={close}>Cancelar</Button>
                        <Button
                            onClick={handleAdd}
                            loading={saving}
                            disabled={!newProvider || !newKey.trim()}
                        >
                            Salvar Chave
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}
