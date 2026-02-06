'use client';

import { useState, useRef, useMemo, Suspense } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, TextInput,
    ThemeIcon, Paper, ActionIcon, Modal, Textarea, Select, Loader,
    ColorSwatch, Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconSearch, IconLink, IconTrash,
    IconSparkles, IconFilter, IconZoomIn, IconZoomOut, IconRefresh
} from '@tabler/icons-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// ============================================================================
// TYPES
// ============================================================================

interface KnowledgeNode {
    id: string;
    label: string;
    description: string;
    module: string;
    position: [number, number, number];
    connections: string[];
    createdAt: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MODULE_COLORS: Record<string, string> = {
    foundations: '#3b82f6',    // blue
    prompting: '#8b5cf6',      // violet
    reasoning: '#f59e0b',      // amber
    creativity: '#10b981',     // emerald
    ethics: '#ef4444',         // red
    mastery: '#ec4899',        // pink
};

const MOCK_NODES: KnowledgeNode[] = [
    { id: '1', label: 'LLM Basics', description: 'Understanding how large language models work', module: 'foundations', position: [0, 0, 0], connections: ['2', '3'], createdAt: '2026-01-15' },
    { id: '2', label: 'Tokenização', description: 'Como texto é convertido em tokens', module: 'foundations', position: [2, 1, -1], connections: ['1', '4'], createdAt: '2026-01-16' },
    { id: '3', label: 'Context Window', description: 'Limites de contexto em LLMs', module: 'foundations', position: [-2, 1, 1], connections: ['1', '5'], createdAt: '2026-01-17' },
    { id: '4', label: 'Zero-Shot Prompting', description: 'Prompting sem exemplos', module: 'prompting', position: [3, 2, -2], connections: ['2', '6', '7'], createdAt: '2026-01-20' },
    { id: '5', label: 'Few-Shot Prompting', description: 'Prompting com exemplos', module: 'prompting', position: [-1, 2, 2], connections: ['3', '6'], createdAt: '2026-01-21' },
    { id: '6', label: 'Chain of Thought', description: 'Raciocínio passo a passo', module: 'reasoning', position: [1, 3, 0], connections: ['4', '5', '8'], createdAt: '2026-01-25' },
    { id: '7', label: 'Role Playing', description: 'Assumindo personas', module: 'creativity', position: [4, 3, -1], connections: ['4', '9'], createdAt: '2026-01-26' },
    { id: '8', label: 'Self-Reflection', description: 'Fazendo o modelo avaliar sua resposta', module: 'reasoning', position: [0, 4, 1], connections: ['6', '10'], createdAt: '2026-01-28' },
    { id: '9', label: 'Creative Writing', description: 'Geração criativa de texto', module: 'creativity', position: [3, 4, -2], connections: ['7', '10'], createdAt: '2026-01-29' },
    { id: '10', label: 'AI Ethics', description: 'Considerações éticas no uso de IA', module: 'ethics', position: [1, 5, 0], connections: ['8', '9'], createdAt: '2026-02-01' },
];

// ============================================================================
// 3D COMPONENTS (Dynamically Imported)
// ============================================================================

interface Constellation3DProps {
    nodes: KnowledgeNode[];
    allNodes: KnowledgeNode[];
    moduleColors: Record<string, string>;
    onNodeClick: (node: KnowledgeNode) => void;
    linkingMode: boolean;
    linkSource: string | null;
}

const Constellation3D = dynamic<Constellation3DProps>(() => import('./Constellation3D') as Promise<{ default: React.ComponentType<Constellation3DProps> }>, {
    ssr: false,
    loading: () => (
        <Box style={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1b26 0%, #24283b 100%)', borderRadius: '12px' }}>
            <Loader color="violet" size="lg" />
        </Box>
    )
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ConstellationPage() {
    const [nodes, setNodes] = useState<KnowledgeNode[]>(MOCK_NODES);
    const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
    const [linkingMode, setLinkingMode] = useState(false);
    const [linkSource, setLinkSource] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState<string | null>(null);

    const [nodeModal, { open: openNodeModal, close: closeNodeModal }] = useDisclosure(false);
    const [detailModal, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

    // New node form state
    const [newLabel, setNewLabel] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newModule, setNewModule] = useState<string | null>('foundations');

    const filteredNodes = useMemo(() => {
        return nodes.filter(node => {
            const matchesSearch = !searchQuery ||
                node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = !filterModule || node.module === filterModule;
            return matchesSearch && matchesFilter;
        });
    }, [nodes, searchQuery, filterModule]);

    const handleNodeClick = (node: KnowledgeNode) => {
        if (linkingMode && linkSource) {
            // Create connection
            if (linkSource !== node.id) {
                setNodes(prev => prev.map(n => {
                    if (n.id === linkSource && !n.connections.includes(node.id)) {
                        return { ...n, connections: [...n.connections, node.id] };
                    }
                    if (n.id === node.id && !n.connections.includes(linkSource)) {
                        return { ...n, connections: [...n.connections, linkSource] };
                    }
                    return n;
                }));
            }
            setLinkingMode(false);
            setLinkSource(null);
        } else {
            setSelectedNode(node);
            openDetailModal();
        }
    };

    const handleStartLink = (nodeId: string) => {
        setLinkingMode(true);
        setLinkSource(nodeId);
        closeDetailModal();
    };

    const handleCreateNode = () => {
        if (!newLabel || !newModule) return;

        // Position new node randomly around the center
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 2;
        const height = Math.random() * 4;
        const position: [number, number, number] = [
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        ];

        const newNode: KnowledgeNode = {
            id: `node-${Date.now()}`,
            label: newLabel,
            description: newDescription,
            module: newModule,
            position,
            connections: [],
            createdAt: new Date().toISOString().split('T')[0],
        };

        setNodes(prev => [...prev, newNode]);
        setNewLabel('');
        setNewDescription('');
        closeNodeModal();
    };

    const handleDeleteNode = (nodeId: string) => {
        setNodes(prev => prev
            .filter(n => n.id !== nodeId)
            .map(n => ({
                ...n,
                connections: n.connections.filter(c => c !== nodeId)
            }))
        );
        closeDetailModal();
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/student" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Constelação de Conhecimento ✨</Title>
                        <Text c="dimmed">Visualize e conecte seus insights</Text>
                    </div>
                </Group>
                <Group>
                    {linkingMode && (
                        <Badge color="violet" size="lg" variant="filled" leftSection={<IconLink size={14} />}>
                            Clique em um nó para conectar
                        </Badge>
                    )}
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={openNodeModal}
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'indigo' }}
                    >
                        Novo Insight
                    </Button>
                </Group>
            </Group>

            {/* Controls */}
            <Group>
                <TextInput
                    placeholder="Buscar insights..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, maxWidth: 300 }}
                />
                <Select
                    placeholder="Filtrar por módulo"
                    leftSection={<IconFilter size={16} />}
                    data={[
                        { value: 'foundations', label: '🔵 Fundamentos' },
                        { value: 'prompting', label: '🟣 Prompting' },
                        { value: 'reasoning', label: '🟡 Raciocínio' },
                        { value: 'creativity', label: '🟢 Criatividade' },
                        { value: 'ethics', label: '🔴 Ética' },
                        { value: 'mastery', label: '🩷 Maestria' },
                    ]}
                    value={filterModule}
                    onChange={setFilterModule}
                    clearable
                    style={{ width: 200 }}
                />
                <Group gap={4}>
                    {Object.entries(MODULE_COLORS).map(([module, color]) => (
                        <ColorSwatch
                            key={module}
                            color={color}
                            size={20}
                            style={{ cursor: 'pointer', opacity: filterModule === module ? 1 : 0.5 }}
                            onClick={() => setFilterModule(filterModule === module ? null : module)}
                        />
                    ))}
                </Group>
            </Group>

            {/* Stats */}
            <Group gap="md">
                <Paper p="sm" radius="md" withBorder>
                    <Group gap="xs">
                        <ThemeIcon size="sm" variant="light" color="violet">
                            <IconSparkles size={14} />
                        </ThemeIcon>
                        <Text size="sm">{nodes.length} insights</Text>
                    </Group>
                </Paper>
                <Paper p="sm" radius="md" withBorder>
                    <Group gap="xs">
                        <ThemeIcon size="sm" variant="light" color="blue">
                            <IconLink size={14} />
                        </ThemeIcon>
                        <Text size="sm">
                            {nodes.reduce((acc, n) => acc + n.connections.length, 0) / 2} conexões
                        </Text>
                    </Group>
                </Paper>
            </Group>

            {/* 3D Visualization */}
            <Card shadow="xl" radius="lg" p={0} withBorder style={{ overflow: 'hidden' }}>
                <Suspense fallback={
                    <Box style={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1b26' }}>
                        <Loader color="violet" />
                    </Box>
                }>
                    <Constellation3D
                        nodes={filteredNodes}
                        allNodes={nodes}
                        moduleColors={MODULE_COLORS}
                        onNodeClick={handleNodeClick}
                        linkingMode={linkingMode}
                        linkSource={linkSource}
                    />
                </Suspense>
            </Card>

            {/* Instructions */}
            <Paper p="md" bg="violet.0" radius="md">
                <Group gap="xl">
                    <Text size="sm">🖱️ <strong>Orbitar:</strong> Arrastar com mouse</Text>
                    <Text size="sm">🔍 <strong>Zoom:</strong> Scroll do mouse</Text>
                    <Text size="sm">👆 <strong>Selecionar:</strong> Clique em um nó</Text>
                    <Text size="sm">🔗 <strong>Conectar:</strong> Use o botão "Conectar" no detalhe</Text>
                </Group>
            </Paper>

            {/* Create Node Modal */}
            <Modal
                opened={nodeModal}
                onClose={closeNodeModal}
                title="Novo Insight"
                centered
            >
                <Stack gap="md">
                    <TextInput
                        label="Título"
                        placeholder="Ex: Chain of Thought"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        required
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descreva o insight..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        minRows={3}
                    />
                    <Select
                        label="Módulo"
                        data={[
                            { value: 'foundations', label: '🔵 Fundamentos' },
                            { value: 'prompting', label: '🟣 Prompting' },
                            { value: 'reasoning', label: '🟡 Raciocínio' },
                            { value: 'creativity', label: '🟢 Criatividade' },
                            { value: 'ethics', label: '🔴 Ética' },
                            { value: 'mastery', label: '🩷 Maestria' },
                        ]}
                        value={newModule}
                        onChange={setNewModule}
                        required
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeNodeModal}>Cancelar</Button>
                        <Button
                            onClick={handleCreateNode}
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'indigo' }}
                        >
                            Criar
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Node Detail Modal */}
            <Modal
                opened={detailModal}
                onClose={closeDetailModal}
                title={selectedNode?.label}
                centered
            >
                {selectedNode && (
                    <Stack gap="md">
                        <Paper p="md" bg={`${MODULE_COLORS[selectedNode.module]}15`} radius="md">
                            <Text size="sm">{selectedNode.description}</Text>
                        </Paper>

                        <Group>
                            <Badge
                                color={MODULE_COLORS[selectedNode.module]}
                                variant="filled"
                                size="lg"
                            >
                                {selectedNode.module}
                            </Badge>
                            <Text size="sm" c="dimmed">
                                Criado em {new Date(selectedNode.createdAt).toLocaleDateString('pt-BR')}
                            </Text>
                        </Group>

                        <div>
                            <Text size="sm" fw={500} mb="xs">Conexões ({selectedNode.connections.length})</Text>
                            <Group gap="xs">
                                {selectedNode.connections.map(connId => {
                                    const connNode = nodes.find(n => n.id === connId);
                                    return connNode ? (
                                        <Badge key={connId} variant="outline" color="gray">
                                            {connNode.label}
                                        </Badge>
                                    ) : null;
                                })}
                                {selectedNode.connections.length === 0 && (
                                    <Text size="sm" c="dimmed">Nenhuma conexão ainda</Text>
                                )}
                            </Group>
                        </div>

                        <Group>
                            <Button
                                variant="light"
                                color="violet"
                                leftSection={<IconLink size={16} />}
                                onClick={() => handleStartLink(selectedNode.id)}
                                flex={1}
                            >
                                Conectar
                            </Button>
                            <Button
                                variant="light"
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={() => handleDeleteNode(selectedNode.id)}
                            >
                                Excluir
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

