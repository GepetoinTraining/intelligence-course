'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    ActionIcon,
    Text,
    Stack,
    Group,
    Avatar,
    TextInput,
    ScrollArea,
    Badge,
    Tabs,
    Indicator,
    Tooltip,
    Transition,
    Menu,
    Divider,
    Loader,
    ThemeIcon,
    UnstyledButton,
    Skeleton,
    Modal,
    Alert,
    Progress,
} from '@mantine/core';
import {
    IconMessage,
    IconX,
    IconSend,
    IconRobot,
    IconUsers,
    IconBrandWhatsapp,
    IconBrandTelegram,
    IconMail,
    IconPlus,
    IconSearch,
    IconArrowLeft,
    IconMicrophone,
    IconPaperclip,
    IconChevronDown,
    IconUserPlus,
    IconBulb,
    IconSpeakerphone,
    IconVideo,
    IconDotsVertical,
    IconCheck,
    IconChecks,
    IconBrain,
    IconInfoCircle,
    IconSparkles,
    IconEdit,
} from '@tabler/icons-react';
import { useUserContext } from '@/hooks/useUser';
import { useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface Conversation {
    id: string;
    type: 'direct' | 'ai_assistant' | 'broadcast' | 'group' | 'meeting' | 'problem_resolution' | 'support';
    name: string | null;
    avatarUrl: string | null;
    lastMessage: {
        content: string;
        senderName: string;
        createdAt: number;
    } | null;
    unreadCount: number;
    isPinned: boolean;
    lastMessageAt: number | null;
    participants: Array<{
        id: string;
        name: string;
        avatarUrl: string | null;
    }>;
    // Task linking - when linked task is complete, conversation is locked
    linkedTaskId?: string | null;
    linkedTaskTitle?: string | null;
    isResolved: boolean;
    resolvedAt?: number | null;
}

interface Contact {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
    role: string | null;
    department?: string | null;
    lastContactedAt: number | null;
    conversationCount: number;
    isSynapse?: boolean; // True if this is the AI companion
    // Most recent conversation with this contact
    lastConversation?: {
        id: string;
        lastMessage: string | null;
        lastMessageAt: number | null;
    } | null;
}

interface Message {
    id: string;
    content: string;
    contentType: string;
    sender: {
        id: string | null;
        name: string;
        avatarUrl: string | null;
        type: 'user' | 'ai' | 'system';
    };
    createdAt: number;
    isSolution?: boolean;
    isEdited?: boolean;
}

interface MemoryNode {
    id: string;
    content: string;
    modality: 'episodic' | 'semantic' | 'procedural' | 'emotional' | 'sensory';
    gravity: number;
    salience: number;
    confidence: number;
    timestamp: number;
    lastAccessed: number | null;
}

// Synapse default name (user can customize)
const DEFAULT_SYNAPSE_NAME = 'Synapse';

// ============================================================================
// COMMUNICATOR WIDGET
// ============================================================================

export function CommunicatorWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('chats');
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Memory modal state
    const [memoryModalOpened, { open: openMemoryModal, close: closeMemoryModal }] = useDisclosure(false);
    const [memories, setMemories] = useState<MemoryNode[]>([]);
    const [loadingMemories, setLoadingMemories] = useState(false);
    const [synapseName, setSynapseName] = useState(DEFAULT_SYNAPSE_NAME);

    // Contacts state
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [contactHistory, setContactHistory] = useState<Conversation[]>([]);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { colorScheme } = useMantineColorScheme();
    const { user } = useUserContext();
    const isDark = colorScheme === 'dark';

    // ========================================================================
    // DATA FETCHING
    // ========================================================================

    useEffect(() => {
        if (isOpen && conversations.length === 0) {
            fetchConversations();
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
        }
    }, [activeConversation?.id]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            const scrollArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }
    }, [messages]);

    async function fetchConversations() {
        setLoading(true);
        try {
            const res = await fetch('/api/communicator/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
                const total = (data.conversations || []).reduce((sum: number, c: Conversation) => sum + (c.unreadCount || 0), 0);
                setTotalUnread(total);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMessages(conversationId: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/communicator/conversations/${conversationId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchMemories() {
        setLoadingMemories(true);
        try {
            const res = await fetch('/api/memory/nodes?limit=30');
            if (res.ok) {
                const data = await res.json();
                setMemories(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching memories:', error);
        } finally {
            setLoadingMemories(false);
        }
    }

    function handleOpenMemoryModal() {
        fetchMemories();
        openMemoryModal();
    }

    async function fetchContacts() {
        setLoadingContacts(true);
        try {
            // Using the permission-based contacts API
            const res = await fetch('/api/communicator/contacts');
            if (res.ok) {
                const data = await res.json();
                // Contacts come pre-formatted from API including Synapse
                const formattedContacts: Contact[] = (data.contacts || []).map((c: any) => ({
                    id: c.id,
                    name: c.name || 'Usuário',
                    email: c.email,
                    avatarUrl: c.avatarUrl,
                    role: c.isSynapse ? '✨ Seu Companheiro IA' : c.role,
                    department: null,
                    lastContactedAt: c.lastContactedAt,
                    conversationCount: c.conversationCount || 0,
                    lastConversation: null,
                    isSynapse: c.isSynapse || false,
                }));
                setContacts(formattedContacts);
            } else {
                // API error - still show Synapse as fallback
                console.error('Contacts API error:', res.status);
                setContacts([{
                    id: 'synapse-fallback',
                    name: 'Synapse',
                    email: null,
                    avatarUrl: null,
                    role: '✨ Seu Companheiro IA',
                    department: null,
                    lastContactedAt: null,
                    conversationCount: 0,
                    lastConversation: null,
                    isSynapse: true,
                }]);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
            // Fallback to show Synapse even on error
            setContacts([{
                id: 'synapse-fallback',
                name: 'Synapse',
                email: null,
                avatarUrl: null,
                role: '✨ Seu Companheiro IA',
                department: null,
                lastContactedAt: null,
                conversationCount: 0,
                lastConversation: null,
                isSynapse: true,
            }]);
        } finally {
            setLoadingContacts(false);
        }
    }

    async function fetchContactHistory(contactId: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/communicator/conversations?participantId=${contactId}`);
            if (res.ok) {
                const data = await res.json();
                setContactHistory(data.conversations || []);
            }
        } catch (error) {
            console.error('Error fetching contact history:', error);
        } finally {
            setLoading(false);
        }
    }

    async function getOrCreateSynapseConversation(): Promise<Conversation | null> {
        // Check if we already have an AI conversation
        const existing = conversations.find(c => c.type === 'ai_assistant');
        if (existing) return existing;

        // Create a new AI conversation
        try {
            const res = await fetch('/api/communicator/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ai_assistant',
                    name: synapseName,
                    aiProvider: 'anthropic',
                    aiModel: 'claude-sonnet-4-20250514',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const newConv: Conversation = {
                    id: data.conversation.id,
                    type: 'ai_assistant',
                    name: synapseName,
                    avatarUrl: null,
                    lastMessage: null,
                    unreadCount: 0,
                    isPinned: false,
                    lastMessageAt: Date.now(),
                    participants: [],
                    isResolved: false,
                };
                setConversations(prev => [newConv, ...prev]);
                return newConv;
            }
        } catch (error) {
            console.error('Error creating Synapse conversation:', error);
        }
        return null;
    }

    async function handleSelectContact(contact: Contact) {
        if (contact.isSynapse) {
            // Synapse is the AI companion - open or create AI chat
            setLoading(true);
            const aiConv = await getOrCreateSynapseConversation();
            setLoading(false);

            if (aiConv) {
                setActiveTab('chats');
                setActiveConversation(aiConv);
                fetchMessages(aiConv.id);
            }
            return;
        }
        setSelectedContact(contact);
        fetchContactHistory(contact.id);
    }

    function handleBackFromContact() {
        setSelectedContact(null);
        setContactHistory([]);
    }

    // Check if conversation is locked (resolved and task-linked)
    function isConversationLocked(conv: Conversation): boolean {
        return conv.isResolved && !!conv.linkedTaskId;
    }

    function getModalityLabel(modality: string) {
        const labels: Record<string, string> = {
            'episodic': 'Episódica',
            'semantic': 'Semântica',
            'procedural': 'Procedural',
            'emotional': 'Emocional',
            'sensory': 'Sensorial',
        };
        return labels[modality] || modality;
    }

    function getModalityColor(modality: string) {
        const colors: Record<string, string> = {
            'episodic': 'blue',
            'semantic': 'teal',
            'procedural': 'orange',
            'emotional': 'pink',
            'sensory': 'grape',
        };
        return colors[modality] || 'gray';
    }

    async function sendMessage() {
        if (!newMessage.trim() || !activeConversation) return;

        setSendingMessage(true);
        const messageContent = newMessage;
        setNewMessage('');

        // Optimistic update
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            content: messageContent,
            contentType: 'text',
            sender: {
                id: user?.id || null,
                name: user?.name || 'You',
                avatarUrl: user?.avatarUrl || null,
                type: 'user',
            },
            createdAt: Date.now(),
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            const res = await fetch(`/api/communicator/conversations/${activeConversation.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: messageContent,
                    contentType: 'text',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // Replace temp message with real one
                setMessages(prev => prev.map(m =>
                    m.id === tempMessage.id
                        ? { ...data.message, sender: tempMessage.sender }
                        : m
                ));

                // For AI conversations, there might be an AI response
                if (data.aiMessage) {
                    setMessages(prev => [...prev, {
                        id: data.aiMessage.id,
                        content: data.aiMessage.content,
                        contentType: data.aiMessage.contentType || 'markdown',
                        sender: {
                            id: null,
                            name: 'Assistente IA',
                            avatarUrl: null,
                            type: 'ai',
                        },
                        createdAt: data.aiMessage.createdAt,
                    }]);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
            setNewMessage(messageContent);
        } finally {
            setSendingMessage(false);
            inputRef.current?.focus();
        }
    }

    // ========================================================================
    // UI HELPERS
    // ========================================================================

    function getConversationIcon(type: string) {
        switch (type) {
            case 'ai_assistant': return <IconRobot size={16} />;
            case 'group': return <IconUsers size={16} />;
            case 'broadcast': return <IconSpeakerphone size={16} />;
            case 'meeting': return <IconVideo size={16} />;
            case 'problem_resolution': return <IconBulb size={16} />;
            default: return <IconMessage size={16} />;
        }
    }

    function getConversationColor(type: string) {
        switch (type) {
            case 'ai_assistant': return 'violet';
            case 'group': return 'teal';
            case 'broadcast': return 'orange';
            case 'meeting': return 'green';
            case 'problem_resolution': return 'yellow';
            default: return 'blue';
        }
    }

    function formatTime(timestamp: number | null) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
    }

    const filteredConversations = conversations.filter(c =>
        !searchQuery ||
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.participants.some(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <>
            {/* Floating Button */}
            <Box
                style={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 1000,
                }}
            >
                <Indicator
                    disabled={totalUnread === 0}
                    label={totalUnread > 9 ? '9+' : totalUnread}
                    size={20}
                    color="red"
                    offset={5}
                >
                    <ActionIcon
                        size={56}
                        radius="xl"
                        variant="filled"
                        color="blue"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                            transition: 'transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {isOpen ? <IconX size={26} /> : <IconMessage size={26} />}
                    </ActionIcon>
                </Indicator>
            </Box>

            {/* Chat Panel */}
            <Transition mounted={isOpen} transition="slide-up" duration={200}>
                {(styles) => (
                    <Paper
                        shadow="xl"
                        radius="lg"
                        style={{
                            ...styles,
                            position: 'fixed',
                            bottom: 90,
                            right: 20,
                            width: isExpanded ? 480 : 380,
                            height: isExpanded ? 600 : 500,
                            zIndex: 999,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`,
                        }}
                    >
                        {/* Header */}
                        <Box
                            p="sm"
                            style={{
                                background: isDark
                                    ? 'linear-gradient(135deg, var(--mantine-color-dark-6) 0%, var(--mantine-color-dark-7) 100%)'
                                    : 'linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-blue-7) 100%)',
                                color: 'white',
                            }}
                        >
                            {activeConversation ? (
                                <Group justify="space-between">
                                    <Group>
                                        <ActionIcon
                                            variant="subtle"
                                            color="white"
                                            onClick={() => setActiveConversation(null)}
                                        >
                                            <IconArrowLeft size={18} />
                                        </ActionIcon>
                                        <Avatar
                                            size={36}
                                            radius="xl"
                                            src={activeConversation.avatarUrl}
                                            color={getConversationColor(activeConversation.type)}
                                        >
                                            {activeConversation.type === 'ai_assistant'
                                                ? <IconSparkles size={18} />
                                                : activeConversation.name?.charAt(0).toUpperCase() || getConversationIcon(activeConversation.type)}
                                        </Avatar>
                                        <Stack gap={0}>
                                            <Text size="sm" fw={600} c="white">
                                                {activeConversation.type === 'ai_assistant'
                                                    ? (activeConversation.name || synapseName)
                                                    : (activeConversation.name || 'Conversa')}
                                            </Text>
                                            <Text size="xs" c="white" opacity={0.8}>
                                                {activeConversation.type === 'ai_assistant'
                                                    ? '✨ IA Companion'
                                                    : `${activeConversation.participants.length} participantes`}
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <Group gap="xs">
                                        {/* Memory button for AI conversations */}
                                        {activeConversation.type === 'ai_assistant' && (
                                            <Tooltip label="Memórias do Synapse">
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="white"
                                                    onClick={handleOpenMemoryModal}
                                                >
                                                    <IconBrain size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                        <Menu position="bottom-end" shadow="md">
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="white">
                                                    <IconDotsVertical size={18} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                {activeConversation.type === 'ai_assistant' ? (
                                                    <>
                                                        <Menu.Label>Synapse</Menu.Label>
                                                        <Menu.Item
                                                            leftSection={<IconBrain size={14} />}
                                                            onClick={handleOpenMemoryModal}
                                                        >
                                                            Ver memórias
                                                        </Menu.Item>
                                                        <Menu.Item leftSection={<IconEdit size={14} />}>
                                                            Renomear Synapse
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item leftSection={<IconInfoCircle size={14} />}>
                                                            <Text size="xs" c="dimmed">
                                                                Memórias não podem ser deletadas.
                                                                <br />
                                                                Converse para refiná-las.
                                                            </Text>
                                                        </Menu.Item>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Menu.Item leftSection={<IconUserPlus size={14} />}>
                                                            Adicionar participante
                                                        </Menu.Item>
                                                        <Menu.Item leftSection={<IconBulb size={14} />}>
                                                            Marcar como solução
                                                        </Menu.Item>
                                                    </>
                                                )}
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Group>
                            ) : (
                                <Group justify="space-between">
                                    <Group>
                                        <ThemeIcon
                                            size={36}
                                            radius="xl"
                                            variant="white"
                                            color="blue"
                                        >
                                            <IconMessage size={20} />
                                        </ThemeIcon>
                                        <Stack gap={0}>
                                            <Text size="sm" fw={600} c="white">
                                                Comunicador
                                            </Text>
                                            <Text size="xs" c="white" opacity={0.8}>
                                                {conversations.length} conversas
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <Group gap="xs">
                                        <Menu position="bottom-end" shadow="md">
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="white">
                                                    <IconPlus size={18} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Label>Nova Conversa</Menu.Label>
                                                <Menu.Item leftSection={<IconMessage size={14} />}>
                                                    Mensagem direta
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconRobot size={14} />}>
                                                    Chat com IA
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconUsers size={14} />}>
                                                    Criar grupo
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconBulb size={14} />}>
                                                    Resolução de problema
                                                </Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Label>Comunicados</Menu.Label>
                                                <Menu.Item leftSection={<IconSpeakerphone size={14} />}>
                                                    Novo comunicado
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                        <Tooltip label={isExpanded ? 'Reduzir' : 'Expandir'}>
                                            <ActionIcon
                                                variant="subtle"
                                                color="white"
                                                onClick={() => setIsExpanded(!isExpanded)}
                                            >
                                                <IconChevronDown
                                                    size={18}
                                                    style={{
                                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s ease',
                                                    }}
                                                />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>
                            )}
                        </Box>

                        {/* Content */}
                        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {activeConversation ? (
                                /* Message View */
                                <>
                                    <ScrollArea
                                        ref={scrollAreaRef}
                                        style={{ flex: 1 }}
                                        p="sm"
                                        type="auto"
                                    >
                                        {loading ? (
                                            <Stack gap="sm">
                                                {[1, 2, 3].map(i => (
                                                    <Skeleton key={i} height={60} radius="md" />
                                                ))}
                                            </Stack>
                                        ) : messages.length === 0 ? (
                                            <Stack align="center" justify="center" h="100%" gap="xs">
                                                <ThemeIcon
                                                    size={48}
                                                    radius="xl"
                                                    variant="light"
                                                    color={getConversationColor(activeConversation.type)}
                                                >
                                                    {getConversationIcon(activeConversation.type)}
                                                </ThemeIcon>
                                                <Text size="sm" c="dimmed" ta="center">
                                                    Nenhuma mensagem ainda.
                                                    <br />
                                                    Comece a conversa!
                                                </Text>
                                            </Stack>
                                        ) : (
                                            <Stack gap="xs">
                                                {messages.map((msg, idx) => {
                                                    const isOwn = msg.sender.type === 'user' && msg.sender.id === user?.id;
                                                    const isAI = msg.sender.type === 'ai';
                                                    const isSystem = msg.sender.type === 'system';

                                                    return (
                                                        <Box
                                                            key={msg.id}
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                                            }}
                                                        >
                                                            <Paper
                                                                p="xs"
                                                                radius="md"
                                                                style={{
                                                                    maxWidth: '85%',
                                                                    background: isOwn
                                                                        ? 'var(--mantine-color-blue-6)'
                                                                        : isAI
                                                                            ? `var(--mantine-color-violet-${isDark ? '9' : '0'})`
                                                                            : isSystem
                                                                                ? 'transparent'
                                                                                : isDark
                                                                                    ? 'var(--mantine-color-dark-5)'
                                                                                    : 'var(--mantine-color-gray-1)',
                                                                    color: isOwn ? 'white' : undefined,
                                                                    border: isSystem
                                                                        ? `1px dashed var(--mantine-color-gray-4)`
                                                                        : undefined,
                                                                }}
                                                            >
                                                                {!isOwn && !isSystem && (
                                                                    <Text size="xs" fw={600} c={isOwn ? 'white' : 'dimmed'} mb={2}>
                                                                        {msg.sender.name}
                                                                    </Text>
                                                                )}
                                                                <Text
                                                                    size="sm"
                                                                    style={{
                                                                        whiteSpace: 'pre-wrap',
                                                                        wordBreak: 'break-word',
                                                                    }}
                                                                >
                                                                    {msg.content}
                                                                </Text>
                                                                <Group gap={4} justify="flex-end" mt={4}>
                                                                    <Text size="xs" c={isOwn ? 'white' : 'dimmed'} opacity={0.7}>
                                                                        {formatTime(msg.createdAt)}
                                                                    </Text>
                                                                    {isOwn && (
                                                                        <IconChecks size={14} style={{ opacity: 0.7 }} />
                                                                    )}
                                                                </Group>
                                                            </Paper>
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        )}
                                    </ScrollArea>

                                    {/* Message Input */}
                                    <Box p="sm" style={{ borderTop: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}` }}>
                                        {activeConversation && isConversationLocked(activeConversation) ? (
                                            /* Locked conversation - read only */
                                            <Alert
                                                variant="light"
                                                color="gray"
                                                icon={<IconInfoCircle size={16} />}
                                                p="xs"
                                            >
                                                <Text size="xs">
                                                    Esta conversa foi resolvida e está bloqueada.
                                                    {activeConversation.linkedTaskTitle && (
                                                        <> Tarefa vinculada: <strong>{activeConversation.linkedTaskTitle}</strong></>
                                                    )}
                                                </Text>
                                            </Alert>
                                        ) : (
                                            <Group gap="xs">
                                                <ActionIcon variant="subtle" color="gray">
                                                    <IconPaperclip size={18} />
                                                </ActionIcon>
                                                <TextInput
                                                    ref={inputRef}
                                                    placeholder="Digite uma mensagem..."
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                                    style={{ flex: 1 }}
                                                    radius="xl"
                                                    disabled={sendingMessage}
                                                    rightSection={
                                                        sendingMessage
                                                            ? <Loader size="xs" />
                                                            : <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                onClick={() => {/* Voice recording */ }}
                                                            >
                                                                <IconMicrophone size={16} />
                                                            </ActionIcon>
                                                    }
                                                />
                                                <ActionIcon
                                                    size="lg"
                                                    radius="xl"
                                                    color="blue"
                                                    variant="filled"
                                                    onClick={sendMessage}
                                                    disabled={!newMessage.trim() || sendingMessage}
                                                >
                                                    <IconSend size={18} />
                                                </ActionIcon>
                                            </Group>
                                        )}
                                    </Box>
                                </>
                            ) : (
                                /* Conversation List */
                                <>
                                    {/* Tabs */}
                                    <Tabs
                                        value={activeTab}
                                        onChange={(value) => {
                                            setActiveTab(value);
                                            if (value === 'contacts') {
                                                fetchContacts();
                                            }
                                        }}
                                        variant="default"
                                    >
                                        <Tabs.List grow>
                                            <Tabs.Tab value="chats" leftSection={<IconMessage size={14} />}>
                                                Chats
                                            </Tabs.Tab>
                                            <Tabs.Tab value="contacts" leftSection={<IconUsers size={14} />}>
                                                Contatos
                                            </Tabs.Tab>
                                            <Tabs.Tab
                                                value="channels"
                                                leftSection={<IconBrandWhatsapp size={14} />}
                                                disabled
                                            >
                                                Canais
                                            </Tabs.Tab>
                                        </Tabs.List>
                                    </Tabs>

                                    {/* Search */}
                                    <Box p="xs">
                                        <TextInput
                                            placeholder="Buscar conversas..."
                                            leftSection={<IconSearch size={14} />}
                                            size="xs"
                                            radius="xl"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </Box>

                                    {/* Content based on active tab */}
                                    <ScrollArea style={{ flex: 1 }}>
                                        {activeTab === 'chats' && (
                                            <>
                                                {loading ? (
                                                    <Stack gap="xs" p="xs">
                                                        {[1, 2, 3, 4].map(i => (
                                                            <Skeleton key={i} height={60} radius="md" />
                                                        ))}
                                                    </Stack>
                                                ) : filteredConversations.length === 0 ? (
                                                    <Stack align="center" justify="center" h={200} gap="xs">
                                                        <IconMessage size={32} color="gray" />
                                                        <Text size="sm" c="dimmed">
                                                            {searchQuery
                                                                ? 'Nenhuma conversa encontrada'
                                                                : 'Nenhuma conversa ainda'}
                                                        </Text>
                                                    </Stack>
                                                ) : (
                                                    <Stack gap={0}>
                                                        {filteredConversations.map(conv => (
                                                            <UnstyledButton
                                                                key={conv.id}
                                                                onClick={() => setActiveConversation(conv)}
                                                                p="sm"
                                                                style={{
                                                                    borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-1)'}`,
                                                                    transition: 'background 0.15s ease',
                                                                    opacity: isConversationLocked(conv) ? 0.7 : 1,
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = isDark
                                                                        ? 'var(--mantine-color-dark-5)'
                                                                        : 'var(--mantine-color-gray-0)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = 'transparent';
                                                                }}
                                                            >
                                                                <Group wrap="nowrap">
                                                                    <Indicator
                                                                        color={isConversationLocked(conv) ? 'gray' : getConversationColor(conv.type)}
                                                                        size={10}
                                                                        offset={2}
                                                                        disabled={conv.type !== 'ai_assistant' && !conv.isResolved}
                                                                    >
                                                                        <Avatar
                                                                            size={44}
                                                                            radius="xl"
                                                                            src={conv.avatarUrl}
                                                                            color={getConversationColor(conv.type)}
                                                                        >
                                                                            {conv.name?.charAt(0).toUpperCase() || getConversationIcon(conv.type)}
                                                                        </Avatar>
                                                                    </Indicator>
                                                                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                                                        <Group justify="space-between" wrap="nowrap">
                                                                            <Group gap={4}>
                                                                                <Text
                                                                                    size="sm"
                                                                                    fw={conv.unreadCount > 0 ? 600 : 400}
                                                                                    truncate
                                                                                >
                                                                                    {conv.name || 'Conversa'}
                                                                                </Text>
                                                                                {isConversationLocked(conv) && (
                                                                                    <Badge size="xs" variant="light" color="gray">
                                                                                        Resolvido
                                                                                    </Badge>
                                                                                )}
                                                                            </Group>
                                                                            <Text size="xs" c="dimmed">
                                                                                {formatTime(conv.lastMessageAt)}
                                                                            </Text>
                                                                        </Group>
                                                                        <Group justify="space-between" wrap="nowrap">
                                                                            <Text
                                                                                size="xs"
                                                                                c="dimmed"
                                                                                truncate
                                                                                style={{ flex: 1 }}
                                                                            >
                                                                                {conv.lastMessage
                                                                                    ? `${conv.lastMessage.senderName}: ${conv.lastMessage.content}`
                                                                                    : 'Sem mensagens'}
                                                                            </Text>
                                                                            {conv.unreadCount > 0 && (
                                                                                <Badge
                                                                                    size="sm"
                                                                                    circle
                                                                                    color="blue"
                                                                                >
                                                                                    {conv.unreadCount}
                                                                                </Badge>
                                                                            )}
                                                                        </Group>
                                                                    </Stack>
                                                                </Group>
                                                            </UnstyledButton>
                                                        ))}
                                                    </Stack>
                                                )}
                                            </>
                                        )}

                                        {activeTab === 'contacts' && (
                                            <>
                                                {selectedContact ? (
                                                    /* Contact History View */
                                                    <Box>
                                                        <UnstyledButton
                                                            onClick={handleBackFromContact}
                                                            p="sm"
                                                            style={{
                                                                borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`,
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <Group>
                                                                <IconArrowLeft size={16} />
                                                                <Avatar size={32} radius="xl" src={selectedContact.avatarUrl}>
                                                                    {selectedContact.name.charAt(0).toUpperCase()}
                                                                </Avatar>
                                                                <Stack gap={0}>
                                                                    <Text size="sm" fw={600}>{selectedContact.name}</Text>
                                                                    <Text size="xs" c="dimmed">{selectedContact.role || 'Contato'}</Text>
                                                                </Stack>
                                                            </Group>
                                                        </UnstyledButton>

                                                        <Text size="xs" c="dimmed" p="xs" fw={600}>
                                                            Histórico de Conversas
                                                        </Text>

                                                        {loading ? (
                                                            <Stack gap="xs" p="xs">
                                                                {[1, 2, 3].map(i => (
                                                                    <Skeleton key={i} height={50} radius="md" />
                                                                ))}
                                                            </Stack>
                                                        ) : contactHistory.length === 0 ? (
                                                            <Stack align="center" py="lg" gap="xs">
                                                                <IconMessage size={24} color="gray" />
                                                                <Text size="sm" c="dimmed">
                                                                    Nenhuma conversa com este contato
                                                                </Text>
                                                                <ActionIcon
                                                                    variant="light"
                                                                    color="blue"
                                                                    size="lg"
                                                                    radius="xl"
                                                                >
                                                                    <IconPlus size={16} />
                                                                </ActionIcon>
                                                            </Stack>
                                                        ) : (
                                                            <Stack gap={0}>
                                                                {contactHistory.map(conv => (
                                                                    <UnstyledButton
                                                                        key={conv.id}
                                                                        onClick={() => setActiveConversation(conv)}
                                                                        p="sm"
                                                                        style={{
                                                                            borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-1)'}`,
                                                                            opacity: isConversationLocked(conv) ? 0.6 : 1,
                                                                        }}
                                                                    >
                                                                        <Group justify="space-between" wrap="nowrap">
                                                                            <Group gap="xs">
                                                                                {getConversationIcon(conv.type)}
                                                                                <Stack gap={0}>
                                                                                    <Group gap={4}>
                                                                                        <Text size="sm" truncate>
                                                                                            {conv.name || 'Conversa'}
                                                                                        </Text>
                                                                                        {isConversationLocked(conv) && (
                                                                                            <Badge size="xs" color="gray" variant="light">
                                                                                                🔒
                                                                                            </Badge>
                                                                                        )}
                                                                                    </Group>
                                                                                    <Text size="xs" c="dimmed" truncate>
                                                                                        {conv.lastMessage?.content || 'Sem mensagens'}
                                                                                    </Text>
                                                                                </Stack>
                                                                            </Group>
                                                                            <Text size="xs" c="dimmed">
                                                                                {formatTime(conv.lastMessageAt)}
                                                                            </Text>
                                                                        </Group>
                                                                    </UnstyledButton>
                                                                ))}
                                                            </Stack>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    /* Contacts List */
                                                    <>
                                                        {loadingContacts ? (
                                                            <Stack gap="xs" p="xs">
                                                                {[1, 2, 3, 4].map(i => (
                                                                    <Skeleton key={i} height={50} radius="md" />
                                                                ))}
                                                            </Stack>
                                                        ) : contacts.length === 0 ? (
                                                            <Stack align="center" justify="center" h={200} gap="xs">
                                                                <IconUsers size={32} color="gray" />
                                                                <Text size="sm" c="dimmed">
                                                                    Nenhum contato ainda
                                                                </Text>
                                                            </Stack>
                                                        ) : (
                                                            <Stack gap={0}>
                                                                {contacts
                                                                    .filter(c =>
                                                                        !searchQuery ||
                                                                        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
                                                                    )
                                                                    .map(contact => (
                                                                        <UnstyledButton
                                                                            key={contact.id}
                                                                            onClick={() => handleSelectContact(contact)}
                                                                            p="sm"
                                                                            style={{
                                                                                borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-1)'}`,
                                                                                transition: 'background 0.15s ease',
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.background = isDark
                                                                                    ? 'var(--mantine-color-dark-5)'
                                                                                    : 'var(--mantine-color-gray-0)';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.background = 'transparent';
                                                                            }}
                                                                        >
                                                                            <Group wrap="nowrap">
                                                                                <Avatar
                                                                                    size={40}
                                                                                    radius="xl"
                                                                                    src={contact.avatarUrl}
                                                                                    color="teal"
                                                                                >
                                                                                    {contact.name.charAt(0).toUpperCase()}
                                                                                </Avatar>
                                                                                <Stack gap={0} style={{ flex: 1 }}>
                                                                                    <Text size="sm" fw={500}>
                                                                                        {contact.name}
                                                                                    </Text>
                                                                                    <Text size="xs" c="dimmed" truncate>
                                                                                        {contact.role || contact.email || 'Contato'}
                                                                                    </Text>
                                                                                </Stack>
                                                                                {contact.conversationCount > 0 && (
                                                                                    <Badge size="xs" variant="light" color="gray">
                                                                                        {contact.conversationCount}
                                                                                    </Badge>
                                                                                )}
                                                                            </Group>
                                                                        </UnstyledButton>
                                                                    ))}
                                                            </Stack>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </ScrollArea>

                                    {/* Channel Selector (Future) */}
                                    <Box
                                        p="xs"
                                        style={{
                                            borderTop: `1px solid ${isDark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`,
                                        }}
                                    >
                                        <Group gap="xs" justify="center">
                                            <Tooltip label="Node Zero (Ativo)">
                                                <ActionIcon variant="light" color="blue" size="lg">
                                                    <IconMessage size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="WhatsApp (Em breve)">
                                                <ActionIcon variant="subtle" color="gray" size="lg" disabled>
                                                    <IconBrandWhatsapp size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Telegram (Em breve)">
                                                <ActionIcon variant="subtle" color="gray" size="lg" disabled>
                                                    <IconBrandTelegram size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Email (Em breve)">
                                                <ActionIcon variant="subtle" color="gray" size="lg" disabled>
                                                    <IconMail size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Paper>
                )}
            </Transition>

            {/* Synapse Memory Modal */}
            <Modal
                opened={memoryModalOpened}
                onClose={closeMemoryModal}
                title={
                    <Group>
                        <ThemeIcon color="violet" size="lg" radius="xl">
                            <IconBrain size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Memórias do {synapseName}</Text>
                            <Text size="xs" c="dimmed">O que seu Synapse lembra sobre você</Text>
                        </div>
                    </Group>
                }
                size="lg"
                radius="lg"
            >
                <Alert
                    icon={<IconInfoCircle size={18} />}
                    color="violet"
                    variant="light"
                    mb="md"
                >
                    <Text size="sm">
                        As memórias são <strong>imutáveis</strong> por política de privacidade e ética.
                        Para corrigir ou refinar uma memória, converse com seu Synapse sobre ela.
                    </Text>
                </Alert>

                {loadingMemories ? (
                    <Stack gap="sm">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} height={60} radius="md" />
                        ))}
                    </Stack>
                ) : memories.length === 0 ? (
                    <Stack align="center" py="xl" gap="sm">
                        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                            <IconBrain size={32} />
                        </ThemeIcon>
                        <Text c="dimmed" ta="center">
                            Seu Synapse ainda não formou memórias.
                            <br />
                            Continue conversando para construir sua história!
                        </Text>
                    </Stack>
                ) : (
                    <ScrollArea h={400}>
                        <Stack gap="xs">
                            {memories.map(memory => (
                                <Paper
                                    key={memory.id}
                                    p="sm"
                                    radius="md"
                                    withBorder
                                    style={{
                                        borderLeft: `3px solid var(--mantine-color-${getModalityColor(memory.modality)}-6)`,
                                    }}
                                >
                                    <Group justify="space-between" mb={4}>
                                        <Badge
                                            size="xs"
                                            variant="light"
                                            color={getModalityColor(memory.modality)}
                                        >
                                            {getModalityLabel(memory.modality)}
                                        </Badge>
                                        <Group gap={4}>
                                            <Tooltip label="Importância">
                                                <Badge size="xs" variant="outline" color="gray">
                                                    {Math.round(memory.gravity * 100)}%
                                                </Badge>
                                            </Tooltip>
                                            <Tooltip label="Confiança">
                                                <Badge size="xs" variant="outline" color="gray">
                                                    {Math.round(memory.confidence * 100)}%
                                                </Badge>
                                            </Tooltip>
                                        </Group>
                                    </Group>
                                    <Text size="sm">{memory.content}</Text>
                                    <Group mt={8} gap={4}>
                                        <Text size="xs" c="dimmed">
                                            {new Date(memory.timestamp * 1000).toLocaleDateString('pt-BR')}
                                        </Text>
                                        <Tooltip label="Para refinar esta memória, converse com seu Synapse">
                                            <ActionIcon
                                                size="xs"
                                                variant="subtle"
                                                color="violet"
                                                onClick={() => {
                                                    closeMemoryModal();
                                                    setNewMessage(`Synapse, sobre a memória "${memory.content.slice(0, 50)}...", eu gostaria de esclarecer que `);
                                                    inputRef.current?.focus();
                                                }}
                                            >
                                                <IconEdit size={12} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </ScrollArea>
                )}

                <Divider my="md" />

                <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                        {memories.length} memórias formadas
                    </Text>
                    <Text size="xs" c="dimmed">
                        <IconInfoCircle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        {' '}AI Auditor mantém acesso completo
                    </Text>
                </Group>
            </Modal>
        </>
    );
}

