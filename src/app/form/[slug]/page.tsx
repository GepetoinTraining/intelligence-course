'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, TextInput, Textarea, Select, Checkbox,
    Container, Box, Progress
} from '@mantine/core';
import {
    IconSparkles, IconMail, IconUser, IconPhone, IconSchool,
    IconCheck, IconRocket, IconBrain
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

interface FormConfig {
    slug: string;
    title: string;
    subtitle: string;
    course: string;
    bgGradient: string;
    fields: string[];
    successMessage: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const FORMS: Record<string, FormConfig> = {
    'trial-ia-jovens': {
        slug: 'trial-ia-jovens',
        title: '🎮 Aula Experimental Grátis',
        subtitle: 'Aprenda IA de forma divertida! Para crianças e adolescentes de 8-17 anos.',
        course: 'Fundamentos de IA para Jovens',
        bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fields: ['name', 'email', 'phone', 'age', 'parent_name'],
        successMessage: 'Parabéns! Você está na lista para a aula experimental. Entraremos em contato em breve!',
    },
    'trial-ai-mastery': {
        slug: 'trial-ai-mastery',
        title: '🚀 Masterclass Gratuita',
        subtitle: 'Domine técnicas avançadas de prompting e IA generativa',
        course: 'AI Mastery para Profissionais',
        bgGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        fields: ['name', 'email', 'phone', 'job_title', 'company'],
        successMessage: 'Excelente! Sua vaga na masterclass está reservada. Enviaremos os detalhes por email.',
    },
    'waitlist-educators': {
        slug: 'waitlist-educators',
        title: '🧑‍🏫 Lista de Espera',
        subtitle: 'Seja o primeiro a saber quando abrirem vagas para IA para Educadores',
        course: 'IA para Educadores',
        bgGradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        fields: ['name', 'email', 'school', 'role'],
        successMessage: 'Você está na lista! Avisaremos assim que as inscrições abrirem.',
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function LeadCaptureFormPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [parentName, setParentName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [company, setCompany] = useState('');
    const [school, setSchool] = useState('');
    const [role, setRole] = useState<string | null>(null);
    const [consent, setConsent] = useState(false);

    useEffect(() => {
        if (slug && FORMS[slug]) {
            setFormConfig(FORMS[slug]);
        }
    }, [slug]);

    const handleSubmit = async () => {
        if (!consent || !name || !email) return;

        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoading(false);
        setSubmitted(true);
    };

    const hasField = (field: string) => formConfig?.fields.includes(field) || false;

    if (!formConfig) {
        return (
            <Container size="sm" py="xl">
                <Paper p="xl" radius="lg" withBorder style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                        <IconBrain size={32} />
                    </ThemeIcon>
                    <Title order={3}>Formulário não encontrado</Title>
                    <Text c="dimmed">Verifique o link e tente novamente</Text>
                </Paper>
            </Container>
        );
    }

    if (submitted) {
        return (
            <Box
                style={{
                    minHeight: '100vh',
                    background: formConfig.bgGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                }}
            >
                <Card shadow="xl" radius="xl" p={48} maw={500} w="100%">
                    <Stack gap="lg" align="center" ta="center">
                        <ThemeIcon size={80} variant="gradient" gradient={{ from: 'green', to: 'teal' }} radius="xl">
                            <IconCheck size={40} />
                        </ThemeIcon>

                        <Title order={2}>🎉 Inscrição Confirmada!</Title>

                        <Text size="lg">{formConfig.successMessage}</Text>

                        <Paper p="md" bg="gray.0" radius="md" w="100%">
                            <Group gap="xs" justify="center">
                                <IconMail size={16} />
                                <Text size="sm">Confirme seu email: <strong>{email}</strong></Text>
                            </Group>
                        </Paper>

                        <Group gap="xs">
                            <Badge variant="light" color="violet" size="lg">
                                {formConfig.course}
                            </Badge>
                        </Group>

                        <Text size="sm" c="dimmed" mt="md">
                            Fique de olho na sua caixa de entrada (e spam!) 👀
                        </Text>
                    </Stack>
                </Card>
            </Box>
        );
    }

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: formConfig.bgGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
            }}
        >
            <Card shadow="xl" radius="xl" p={32} maw={500} w="100%">
                <Stack gap="xl">
                    {/* Header */}
                    <div style={{ textAlign: 'center' }}>
                        <Badge variant="light" color="violet" size="lg" mb="md">
                            {formConfig.course}
                        </Badge>
                        <Title order={2}>{formConfig.title}</Title>
                        <Text c="dimmed" mt="xs">{formConfig.subtitle}</Text>
                    </div>

                    {/* Form Fields */}
                    <Stack gap="md">
                        <TextInput
                            label="Nome Completo"
                            placeholder="Seu nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            leftSection={<IconUser size={16} />}
                            required
                            size="md"
                        />

                        <TextInput
                            label="Email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftSection={<IconMail size={16} />}
                            type="email"
                            required
                            size="md"
                        />

                        {hasField('phone') && (
                            <TextInput
                                label="WhatsApp"
                                placeholder="(11) 99999-9999"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                leftSection={<IconPhone size={16} />}
                                size="md"
                            />
                        )}

                        {hasField('age') && (
                            <Select
                                label="Idade do Aluno"
                                placeholder="Selecione"
                                data={[
                                    { value: '8-10', label: '8-10 anos' },
                                    { value: '11-13', label: '11-13 anos' },
                                    { value: '14-17', label: '14-17 anos' },
                                ]}
                                value={age}
                                onChange={(value) => setAge(value || '')}
                                size="md"
                            />
                        )}

                        {hasField('parent_name') && (
                            <TextInput
                                label="Nome do Responsável"
                                placeholder="Nome do pai ou mãe"
                                value={parentName}
                                onChange={(e) => setParentName(e.target.value)}
                                size="md"
                            />
                        )}

                        {hasField('job_title') && (
                            <TextInput
                                label="Cargo"
                                placeholder="Ex: Gerente de Produto"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                size="md"
                            />
                        )}

                        {hasField('company') && (
                            <TextInput
                                label="Empresa"
                                placeholder="Onde você trabalha"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                size="md"
                            />
                        )}

                        {hasField('school') && (
                            <TextInput
                                label="Escola/Instituição"
                                placeholder="Nome da escola"
                                value={school}
                                onChange={(e) => setSchool(e.target.value)}
                                leftSection={<IconSchool size={16} />}
                                size="md"
                            />
                        )}

                        {hasField('role') && (
                            <Select
                                label="Função"
                                placeholder="Selecione sua função"
                                data={[
                                    { value: 'teacher', label: 'Professor(a)' },
                                    { value: 'coordinator', label: 'Coordenador(a)' },
                                    { value: 'principal', label: 'Diretor(a)' },
                                    { value: 'other', label: 'Outro' },
                                ]}
                                value={role}
                                onChange={setRole}
                                size="md"
                            />
                        )}
                    </Stack>

                    {/* Consent & Submit */}
                    <Stack gap="md">
                        <Checkbox
                            label="Concordo em receber comunicações por email e WhatsApp"
                            checked={consent}
                            onChange={(e) => setConsent(e.currentTarget.checked)}
                        />

                        <Button
                            fullWidth
                            size="lg"
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'grape' }}
                            leftSection={<IconRocket size={20} />}
                            onClick={handleSubmit}
                            loading={loading}
                            disabled={!consent || !name || !email}
                        >
                            Garantir Minha Vaga
                        </Button>
                    </Stack>

                    {/* Trust badges */}
                    <Group justify="center" gap="lg">
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="green">
                                <IconCheck size={12} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">100% Gratuito</Text>
                        </Group>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="green">
                                <IconCheck size={12} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">Sem compromisso</Text>
                        </Group>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="green">
                                <IconCheck size={12} />
                            </ThemeIcon>
                            <Text size="xs" c="dimmed">Vagas limitadas</Text>
                        </Group>
                    </Group>
                </Stack>
            </Card>
        </Box>
    );
}
