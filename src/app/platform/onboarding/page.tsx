'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
    Container, Title, Text, Card, Stack, Group, Button, Stepper,
    TextInput, Textarea, Box, Paper, Divider, ColorInput, Badge,
    ThemeIcon, SimpleGrid, Select, Alert, FileInput
} from '@mantine/core';
import {
    IconBuilding, IconPalette, IconMapPin, IconCheck, IconArrowRight,
    IconArrowLeft, IconPhone, IconMail, IconWorld, IconPhoto,
    IconBuildingBank, IconRocket, IconSparkles
} from '@tabler/icons-react';

// Brazilian states
const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
].map(s => ({ value: s, label: s }));

// Step type
type Step = 'company' | 'branding' | 'contact' | 'legal' | 'review';

export default function OwnerOnboardingPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [activeStep, setActiveStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // Form state
    const [formData, setFormData] = useState({
        // Company info
        name: '',
        displayName: '',
        slug: '',

        // Branding
        primaryColor: '#40c057',
        // logo handled separately

        // Contact
        email: '',
        phone: '',
        whatsapp: '',
        website: '',

        // Address
        city: '',
        state: '',
        country: 'BR',

        // Legal (optional for now)
        cnpj: '',
        razaoSocial: '',
        regimeTributario: 'simples' as 'simples' | 'presumido' | 'real',
    });

    // Auto-generate slug from name
    const updateName = (name: string) => {
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        setFormData(prev => ({
            ...prev,
            name,
            slug,
        }));
    };

    const updateField = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const canProceed = (step: number): boolean => {
        switch (step) {
            case 0: // Company
                return !!(formData.name && formData.slug);
            case 1: // Branding
                return !!formData.primaryColor;
            case 2: // Contact
                return !!(formData.email && formData.city && formData.state);
            case 3: // Legal
                return true; // Optional
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/onboarding/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    ownerId: user.id,
                    ownerEmail: user.emailAddresses[0]?.emailAddress,
                    ownerName: user.fullName || user.firstName,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao criar escola');
            }

            const { slug } = await response.json();

            // Redirect to the new school's dashboard
            router.push(`/${slug}/admin`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <Box bg="dark.9" mih="100vh">
            <Container size="md" py="xl">
                <Stack gap="lg">
                    {/* Header */}
                    <Stack align="center" gap="sm">
                        <Group gap="xs">
                            <IconRocket size={28} color="var(--mantine-color-violet-5)" />
                            <Text size="lg" fw={700} c="white">NodeZero</Text>
                        </Group>
                        <Badge size="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
                            Nova Escola
                        </Badge>
                        <Title order={1} c="white" ta="center" size="xl">
                            Configure sua escola
                        </Title>
                        <Text c="gray.5" ta="center" maw={400} size="sm">
                            Vamos configurar sua nova escola no NodeZero em alguns passos rápidos.
                        </Text>
                    </Stack>

                    {/* Stepper Card */}
                    <Card bg="dark.7" radius="lg" p="lg">
                        <Stepper
                            active={activeStep}
                            onStepClick={setActiveStep}
                            allowNextStepsSelect={false}
                            color="violet"
                            size="sm"
                        >
                            {/* Step 1: Company Info */}
                            <Stepper.Step
                                label="Escola"
                                description="Informações básicas"
                                icon={<IconBuilding size={18} />}
                            >
                                <Stack gap="md" mt="lg">
                                    <Title order={3} c="white" size="md">
                                        Informações da Escola
                                    </Title>

                                    <TextInput
                                        label="Nome da Escola"
                                        placeholder="Ex: Escola de Tecnologia ABC"
                                        required
                                        value={formData.name}
                                        onChange={(e) => updateName(e.target.value)}
                                        styles={{ label: { color: 'white' } }}
                                    />

                                    <TextInput
                                        label="Nome de Exibição"
                                        placeholder="Nome que aparece no site (opcional)"
                                        value={formData.displayName}
                                        onChange={(e) => updateField('displayName', e.target.value)}
                                        styles={{ label: { color: 'white' } }}
                                    />

                                    <TextInput
                                        label="URL da Escola"
                                        placeholder="url-da-escola"
                                        required
                                        value={formData.slug}
                                        onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        leftSection={<Text size="sm" c="dimmed">nodezero.solutions/</Text>}
                                        leftSectionWidth={140}
                                        styles={{ label: { color: 'white' } }}
                                    />

                                    <Group justify="flex-end" mt="md">
                                        <Button
                                            rightSection={<IconArrowRight size={16} />}
                                            disabled={!canProceed(0)}
                                            onClick={() => setActiveStep(1)}
                                        >
                                            Continuar
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stepper.Step>

                            {/* Step 2: Branding */}
                            <Stepper.Step
                                label="Marca"
                                description="Cores e logo"
                                icon={<IconPalette size={18} />}
                            >
                                <Stack gap="md" mt="lg">
                                    <Title order={3} c="white" size="md">
                                        Identidade Visual
                                    </Title>

                                    <ColorInput
                                        label="Cor Principal"
                                        placeholder="Escolha uma cor"
                                        value={formData.primaryColor}
                                        onChange={(value) => updateField('primaryColor', value)}
                                        swatches={[
                                            '#7048e8', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
                                            '#40c057', '#82c91e', '#fab005', '#fd7e14', '#fa5252',
                                        ]}
                                        styles={{ label: { color: 'white' } }}
                                    />

                                    <Paper p="md" radius="md" bg="dark.6">
                                        <Group>
                                            <ThemeIcon
                                                size={48}
                                                radius="md"
                                                style={{ background: formData.primaryColor }}
                                            >
                                                <IconBuilding size={24} />
                                            </ThemeIcon>
                                            <Stack gap={2}>
                                                <Text c="white" fw={600}>{formData.name || 'Sua Escola'}</Text>
                                                <Text c="gray.5" size="xs">Preview da cor principal</Text>
                                            </Stack>
                                        </Group>
                                    </Paper>

                                    <Text c="gray.5" size="xs">
                                        💡 Você pode adicionar logo e mais cores depois nas configurações.
                                    </Text>

                                    <Group justify="space-between" mt="md">
                                        <Button
                                            variant="subtle"
                                            leftSection={<IconArrowLeft size={16} />}
                                            onClick={() => setActiveStep(0)}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            rightSection={<IconArrowRight size={16} />}
                                            disabled={!canProceed(1)}
                                            onClick={() => setActiveStep(2)}
                                        >
                                            Continuar
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stepper.Step>

                            {/* Step 3: Contact & Address */}
                            <Stepper.Step
                                label="Contato"
                                description="Endereço e contatos"
                                icon={<IconMapPin size={18} />}
                            >
                                <Stack gap="md" mt="lg">
                                    <Title order={3} c="white" size="md">
                                        Contato e Localização
                                    </Title>

                                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                        <TextInput
                                            label="Email"
                                            placeholder="contato@escola.com"
                                            type="email"
                                            required
                                            leftSection={<IconMail size={16} />}
                                            value={formData.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                            styles={{ label: { color: 'white' } }}
                                        />
                                        <TextInput
                                            label="Telefone"
                                            placeholder="(47) 3333-3333"
                                            leftSection={<IconPhone size={16} />}
                                            value={formData.phone}
                                            onChange={(e) => updateField('phone', e.target.value)}
                                            styles={{ label: { color: 'white' } }}
                                        />
                                    </SimpleGrid>

                                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                        <TextInput
                                            label="WhatsApp"
                                            placeholder="+55 47 99999-9999"
                                            value={formData.whatsapp}
                                            onChange={(e) => updateField('whatsapp', e.target.value)}
                                            styles={{ label: { color: 'white' } }}
                                        />
                                        <TextInput
                                            label="Website"
                                            placeholder="www.escola.com.br"
                                            leftSection={<IconWorld size={16} />}
                                            value={formData.website}
                                            onChange={(e) => updateField('website', e.target.value)}
                                            styles={{ label: { color: 'white' } }}
                                        />
                                    </SimpleGrid>

                                    <Divider label="Endereço" labelPosition="center" color="dark.4" />

                                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                        <TextInput
                                            label="Cidade"
                                            placeholder="Joinville"
                                            required
                                            value={formData.city}
                                            onChange={(e) => updateField('city', e.target.value)}
                                            styles={{ label: { color: 'white' } }}
                                        />
                                        <Select
                                            label="Estado"
                                            placeholder="Selecione"
                                            required
                                            data={BRAZILIAN_STATES}
                                            value={formData.state}
                                            onChange={(value) => updateField('state', value || '')}
                                            styles={{ label: { color: 'white' } }}
                                        />
                                    </SimpleGrid>

                                    <Group justify="space-between" mt="md">
                                        <Button
                                            variant="subtle"
                                            leftSection={<IconArrowLeft size={16} />}
                                            onClick={() => setActiveStep(1)}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            rightSection={<IconArrowRight size={16} />}
                                            disabled={!canProceed(2)}
                                            onClick={() => setActiveStep(3)}
                                        >
                                            Continuar
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stepper.Step>

                            {/* Step 4: Legal (Optional) */}
                            <Stepper.Step
                                label="Fiscal"
                                description="CNPJ (opcional)"
                                icon={<IconBuildingBank size={18} />}
                            >
                                <Stack gap="md" mt="lg">
                                    <Group justify="space-between">
                                        <Title order={3} c="white" size="md">
                                            Informações Fiscais
                                        </Title>
                                        <Badge variant="light" color="gray">Opcional</Badge>
                                    </Group>

                                    <Text c="gray.5" size="sm">
                                        Você pode preencher essas informações depois se preferir.
                                    </Text>

                                    <TextInput
                                        label="CNPJ"
                                        placeholder="00.000.000/0001-00"
                                        value={formData.cnpj}
                                        onChange={(e) => updateField('cnpj', e.target.value)}
                                        styles={{ label: { color: 'white' } }}
                                    />

                                    <TextInput
                                        label="Razão Social"
                                        placeholder="Razão social completa"
                                        value={formData.razaoSocial}
                                        onChange={(e) => updateField('razaoSocial', e.target.value)}
                                        styles={{ label: { color: 'white' } }}
                                    />

                                    <Select
                                        label="Regime Tributário"
                                        data={[
                                            { value: 'simples', label: 'Simples Nacional' },
                                            { value: 'presumido', label: 'Lucro Presumido' },
                                            { value: 'real', label: 'Lucro Real' },
                                        ]}
                                        value={formData.regimeTributario}
                                        onChange={(value) => updateField('regimeTributario', value as any || 'simples')}
                                        styles={{ label: { color: 'white' } }}
                                    />

                                    <Group justify="space-between" mt="md">
                                        <Button
                                            variant="subtle"
                                            leftSection={<IconArrowLeft size={16} />}
                                            onClick={() => setActiveStep(2)}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            rightSection={<IconArrowRight size={16} />}
                                            onClick={() => setActiveStep(4)}
                                        >
                                            Revisar
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stepper.Step>

                            {/* Step 5: Review */}
                            <Stepper.Step
                                label="Revisão"
                                description="Confirmar dados"
                                icon={<IconCheck size={18} />}
                            >
                                <Stack gap="md" mt="lg">
                                    <Title order={3} c="white" size="md">
                                        Revise suas informações
                                    </Title>

                                    <Paper p="md" radius="md" bg="dark.6">
                                        <Stack gap="sm">
                                            <Group>
                                                <ThemeIcon
                                                    size={48}
                                                    radius="md"
                                                    style={{ background: formData.primaryColor }}
                                                >
                                                    <IconBuilding size={24} />
                                                </ThemeIcon>
                                                <Stack gap={2}>
                                                    <Text c="white" fw={700} size="lg">
                                                        {formData.displayName || formData.name}
                                                    </Text>
                                                    <Text c="gray.5" size="sm">
                                                        nodezero.solutions/{formData.slug}
                                                    </Text>
                                                </Stack>
                                            </Group>
                                        </Stack>
                                    </Paper>

                                    <SimpleGrid cols={2}>
                                        <Paper p="sm" radius="md" bg="dark.6">
                                            <Text size="xs" c="gray.5">Email</Text>
                                            <Text c="white" size="sm">{formData.email || '-'}</Text>
                                        </Paper>
                                        <Paper p="sm" radius="md" bg="dark.6">
                                            <Text size="xs" c="gray.5">Telefone</Text>
                                            <Text c="white" size="sm">{formData.phone || '-'}</Text>
                                        </Paper>
                                        <Paper p="sm" radius="md" bg="dark.6">
                                            <Text size="xs" c="gray.5">Cidade</Text>
                                            <Text c="white" size="sm">{formData.city}, {formData.state}</Text>
                                        </Paper>
                                        <Paper p="sm" radius="md" bg="dark.6">
                                            <Text size="xs" c="gray.5">CNPJ</Text>
                                            <Text c="white" size="sm">{formData.cnpj || 'Não informado'}</Text>
                                        </Paper>
                                    </SimpleGrid>

                                    {error && (
                                        <Alert color="red" variant="light">
                                            {error}
                                        </Alert>
                                    )}

                                    <Paper p="md" radius="md" bg="violet.9" style={{ border: '1px solid var(--mantine-color-violet-5)' }}>
                                        <Group>
                                            <IconSparkles size={24} />
                                            <Stack gap={2}>
                                                <Text c="white" fw={600}>Pronto para começar!</Text>
                                                <Text c="white" size="xs" style={{ opacity: 0.8 }}>
                                                    Sua escola será criada com todos os módulos do plano Enterprise (trial).
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Paper>

                                    <Group justify="space-between" mt="md">
                                        <Button
                                            variant="subtle"
                                            leftSection={<IconArrowLeft size={16} />}
                                            onClick={() => setActiveStep(3)}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="gradient"
                                            gradient={{ from: 'violet', to: 'grape' }}
                                            rightSection={<IconRocket size={18} />}
                                            loading={isSubmitting}
                                            onClick={handleSubmit}
                                        >
                                            Criar Minha Escola
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stepper.Step>
                        </Stepper>
                    </Card>

                    {/* Footer */}
                    <Text c="gray.6" ta="center" size="xs">
                        Ao criar sua escola, você concorda com nossos Termos de Uso e Política de Privacidade.
                    </Text>
                </Stack>
            </Container>
        </Box>
    );
}

