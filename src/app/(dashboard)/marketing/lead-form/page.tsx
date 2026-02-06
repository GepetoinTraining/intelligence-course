'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Button,
    TextInput, Textarea, Select, Switch, Paper, Tabs,
    ThemeIcon, Divider, ColorInput, NumberInput
} from '@mantine/core';
import {
    IconForms, IconSettings, IconEye, IconCopy, IconLink,
    IconMail, IconPhone, IconUser, IconSchool, IconCalendar
} from '@tabler/icons-react';

interface FormField {
    id: string;
    type: 'text' | 'email' | 'phone' | 'select' | 'number' | 'date' | 'textarea';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[];
}

export default function LeadFormBuilderPage() {
    const [formName, setFormName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [courseId, setCourseId] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState('#6366f1');
    const [showConsent, setShowConsent] = useState(true);
    const [consentText, setConsentText] = useState('Aceito receber comunicações sobre o curso.');
    const [redirectUrl, setRedirectUrl] = useState('');

    const [fields, setFields] = useState<FormField[]>([
        { id: '1', type: 'text', label: 'Nome Completo', placeholder: 'Seu nome', required: true },
        { id: '2', type: 'email', label: 'Email', placeholder: 'seu@email.com', required: true },
        { id: '3', type: 'phone', label: 'Telefone/WhatsApp', placeholder: '(11) 99999-9999', required: true },
    ]);

    const [activeTab, setActiveTab] = useState<string | null>('fields');

    const handleAddField = (type: FormField['type']) => {
        const newField: FormField = {
            id: Date.now().toString(),
            type,
            label: `Novo Campo`,
            placeholder: '',
            required: false,
        };
        setFields([...fields, newField]);
    };

    const handleRemoveField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleUpdateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleSave = async () => {
        try {
            // This would save to API
            console.log('Saving form:', { formName, slug, description, courseId, fields, primaryColor, showConsent, consentText });
            alert('Formulário salvo! (API não implementada)');
        } catch (error) {
            console.error('Failed to save form:', error);
        }
    };

    const fieldTypeIcons = {
        text: IconUser,
        email: IconMail,
        phone: IconPhone,
        select: IconSchool,
        number: IconSchool,
        date: IconCalendar,
        textarea: IconForms,
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Construtor de Formulário</Title>
                    <Text c="dimmed">Crie formulários de captura de leads</Text>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconEye size={16} />}>
                        Pré-visualizar
                    </Button>
                    <Button onClick={handleSave}>
                        Salvar Formulário
                    </Button>
                </Group>
            </Group>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 20 }}>
                {/* Main Editor */}
                <Stack>
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Configurações Básicas</Title>
                        <Stack>
                            <TextInput
                                label="Nome do Formulário"
                                placeholder="Ex: Inscrição Intelligence"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                            <TextInput
                                label="Slug (URL)"
                                placeholder="inscricao-intelligence"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                leftSection={<IconLink size={16} />}
                                description={`URL: /form/${slug || 'seu-slug'}`}
                            />
                            <Textarea
                                label="Descrição"
                                placeholder="Descrição do formulário..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <Select
                                label="Curso Associado"
                                placeholder="Selecione um curso"
                                value={courseId}
                                onChange={setCourseId}
                                data={[
                                    { value: 'intelligence', label: 'Intelligence' },
                                    { value: 'english', label: 'Inglês' },
                                    { value: 'kids', label: 'Kids' },
                                ]}
                            />
                        </Stack>
                    </Card>

                    <Card withBorder p="lg">
                        <Group justify="space-between" mb="md">
                            <Title order={4}>Campos do Formulário</Title>
                            <Select
                                placeholder="Adicionar campo"
                                data={[
                                    { value: 'text', label: '📝 Texto' },
                                    { value: 'email', label: '📧 Email' },
                                    { value: 'phone', label: '📱 Telefone' },
                                    { value: 'select', label: '📋 Seleção' },
                                    { value: 'number', label: '🔢 Número' },
                                    { value: 'date', label: '📅 Data' },
                                    { value: 'textarea', label: '📄 Texto Longo' },
                                ]}
                                onChange={(v) => v && handleAddField(v as FormField['type'])}
                                clearable
                                w={180}
                            />
                        </Group>

                        <Stack>
                            {fields.map((field, index) => {
                                const Icon = fieldTypeIcons[field.type];
                                return (
                                    <Paper key={field.id} withBorder p="md">
                                        <Group justify="space-between" mb="sm">
                                            <Group>
                                                <ThemeIcon size="sm" variant="light">
                                                    <Icon size={14} />
                                                </ThemeIcon>
                                                <Text size="sm" fw={500}>{field.type.toUpperCase()}</Text>
                                            </Group>
                                            <Button
                                                variant="subtle"
                                                color="red"
                                                size="xs"
                                                onClick={() => handleRemoveField(field.id)}
                                            >
                                                Remover
                                            </Button>
                                        </Group>
                                        <Stack gap="xs">
                                            <TextInput
                                                size="sm"
                                                label="Label"
                                                value={field.label}
                                                onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                            />
                                            <TextInput
                                                size="sm"
                                                label="Placeholder"
                                                value={field.placeholder}
                                                onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                                            />
                                            <Switch
                                                label="Obrigatório"
                                                checked={field.required}
                                                onChange={(e) => handleUpdateField(field.id, { required: e.currentTarget.checked })}
                                            />
                                        </Stack>
                                    </Paper>
                                );
                            })}

                            {fields.length === 0 && (
                                <Text c="dimmed" ta="center" py="xl">
                                    Adicione campos usando o seletor acima
                                </Text>
                            )}
                        </Stack>
                    </Card>

                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Consentimento</Title>
                        <Stack>
                            <Switch
                                label="Mostrar checkbox de consentimento"
                                checked={showConsent}
                                onChange={(e) => setShowConsent(e.currentTarget.checked)}
                            />
                            {showConsent && (
                                <Textarea
                                    label="Texto do consentimento"
                                    value={consentText}
                                    onChange={(e) => setConsentText(e.target.value)}
                                />
                            )}
                        </Stack>
                    </Card>
                </Stack>

                {/* Sidebar Preview */}
                <Card withBorder p="lg" h="fit-content" pos="sticky" top={80}>
                    <Title order={4} mb="md">Pré-visualização</Title>
                    <Paper
                        withBorder
                        p="md"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor}15 0%, transparent 100%)`,
                            borderTop: `4px solid ${primaryColor}`
                        }}
                    >
                        <Text fw={700} size="lg" mb="xs">
                            {formName || 'Nome do Formulário'}
                        </Text>
                        <Text size="sm" c="dimmed" mb="md">
                            {description || 'Descrição do formulário'}
                        </Text>
                        <Stack gap="xs">
                            {fields.map((field) => (
                                <TextInput
                                    key={field.id}
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    size="sm"
                                    disabled
                                />
                            ))}
                            {showConsent && (
                                <Group gap="xs" mt="md">
                                    <input type="checkbox" disabled />
                                    <Text size="xs">{consentText}</Text>
                                </Group>
                            )}
                            <Button mt="sm" style={{ backgroundColor: primaryColor }} fullWidth>
                                Enviar
                            </Button>
                        </Stack>
                    </Paper>

                    <Divider my="md" />

                    <Stack>
                        <ColorInput
                            label="Cor Principal"
                            value={primaryColor}
                            onChange={setPrimaryColor}
                        />
                        <TextInput
                            label="URL de Redirecionamento"
                            placeholder="https://exemplo.com/obrigado"
                            value={redirectUrl}
                            onChange={(e) => setRedirectUrl(e.target.value)}
                        />
                    </Stack>
                </Card>
            </div>
        </Container>
    );
}

