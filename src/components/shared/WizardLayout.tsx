'use client';

import { useState, ReactNode } from 'react';
import {
    Box, Paper, Stepper, Group, Button, Text, Stack, ThemeIcon, Progress, Divider, Alert, Title
} from '@mantine/core';
import { IconCheck, IconArrowLeft, IconArrowRight, IconAlertCircle } from '@tabler/icons-react';

export interface WizardStep {
    key: string;
    label: string;
    description?: string;
    icon?: ReactNode;
    content: ReactNode;
    validate?: () => boolean | string; // Return true if valid, or error message
    optional?: boolean;
}

export interface WizardLayoutProps {
    steps: WizardStep[];
    title?: string;
    description?: string;
    onComplete: () => void;
    onCancel?: () => void;
    completeLabel?: string;
    cancelLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
    allowStepClick?: boolean;
    showProgress?: boolean;
    orientation?: 'horizontal' | 'vertical';
    loading?: boolean;
}

export function WizardLayout({
    steps,
    title,
    description,
    onComplete,
    onCancel,
    completeLabel = 'Finalizar',
    cancelLabel = 'Cancelar',
    previousLabel = 'Voltar',
    nextLabel = 'Próximo',
    allowStepClick = false,
    showProgress = true,
    orientation = 'horizontal',
    loading = false,
}: WizardLayoutProps) {
    const [active, setActive] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [highestStepVisited, setHighestStepVisited] = useState(0);

    const progress = ((active + 1) / steps.length) * 100;
    const isLastStep = active === steps.length - 1;
    const isFirstStep = active === 0;

    const handleStepClick = (stepIndex: number) => {
        if (!allowStepClick) return;

        // Can only go back or to visited steps
        if (stepIndex <= highestStepVisited) {
            setActive(stepIndex);
            setError(null);
        }
    };

    const handleNext = () => {
        setError(null);

        const currentStep = steps[active];
        if (currentStep.validate) {
            const result = currentStep.validate();
            if (result !== true) {
                setError(typeof result === 'string' ? result : 'Por favor, preencha os campos obrigatórios.');
                return;
            }
        }

        if (isLastStep) {
            onComplete();
        } else {
            const nextStep = active + 1;
            setActive(nextStep);
            setHighestStepVisited((prev) => Math.max(prev, nextStep));
        }
    };

    const handlePrevious = () => {
        if (!isFirstStep) {
            setActive(active - 1);
            setError(null);
        }
    };

    return (
        <Box>
            {/* Header */}
            {(title || description || showProgress) && (
                <Paper p="md" mb="md" withBorder radius="md">
                    <Stack gap="sm">
                        {title && (
                            <Group justify="space-between" align="center">
                                <div>
                                    <Title order={4}>{title}</Title>
                                    {description && (
                                        <Text size="sm" c="dimmed">{description}</Text>
                                    )}
                                </div>
                                {showProgress && (
                                    <Text size="sm" c="dimmed">
                                        Passo {active + 1} de {steps.length}
                                    </Text>
                                )}
                            </Group>
                        )}
                        {showProgress && (
                            <Progress value={progress} size="sm" radius="xl" />
                        )}
                    </Stack>
                </Paper>
            )}

            {/* Stepper */}
            <Stepper
                active={active}
                onStepClick={allowStepClick ? handleStepClick : undefined}
                orientation={orientation}
                allowNextStepsSelect={false}
            >
                {steps.map((step, index) => (
                    <Stepper.Step
                        key={step.key}
                        label={step.label}
                        description={step.description}
                        icon={step.icon}
                        allowStepSelect={allowStepClick && index <= highestStepVisited}
                        completedIcon={<IconCheck size={18} />}
                    >
                        <Paper p="lg" mt="md" withBorder radius="md">
                            {/* Error Alert */}
                            {error && (
                                <Alert
                                    icon={<IconAlertCircle size={16} />}
                                    color="red"
                                    variant="light"
                                    mb="md"
                                    withCloseButton
                                    onClose={() => setError(null)}
                                >
                                    {error}
                                </Alert>
                            )}

                            {/* Step Content */}
                            {step.content}
                        </Paper>
                    </Stepper.Step>
                ))}

                {/* Completed State */}
                <Stepper.Completed>
                    <Paper p="xl" mt="md" withBorder radius="md" ta="center">
                        <ThemeIcon size={60} radius="xl" color="green" variant="light" mx="auto">
                            <IconCheck size={32} />
                        </ThemeIcon>
                        <Text size="lg" fw={600} mt="md">Pronto!</Text>
                        <Text size="sm" c="dimmed">
                            Todas as etapas foram concluídas com sucesso.
                        </Text>
                    </Paper>
                </Stepper.Completed>
            </Stepper>

            {/* Navigation Buttons */}
            <Divider my="lg" />
            <Group justify="space-between">
                <Group>
                    {onCancel && (
                        <Button variant="subtle" color="gray" onClick={onCancel}>
                            {cancelLabel}
                        </Button>
                    )}
                </Group>
                <Group>
                    <Button
                        variant="default"
                        onClick={handlePrevious}
                        disabled={isFirstStep}
                        leftSection={<IconArrowLeft size={16} />}
                    >
                        {previousLabel}
                    </Button>
                    <Button
                        onClick={handleNext}
                        loading={loading}
                        rightSection={!isLastStep && <IconArrowRight size={16} />}
                        color={isLastStep ? 'green' : 'blue'}
                    >
                        {isLastStep ? completeLabel : nextLabel}
                    </Button>
                </Group>
            </Group>
        </Box>
    );
}

// Compact horizontal wizard (inline tabs style)
export interface CompactWizardStep {
    key: string;
    label: string;
    content: ReactNode;
}

export interface CompactWizardProps {
    steps: CompactWizardStep[];
    onComplete: () => void;
}

export function CompactWizard({ steps, onComplete }: CompactWizardProps) {
    const [active, setActive] = useState(0);
    const isLastStep = active === steps.length - 1;

    return (
        <Stack gap="md">
            <Group gap="xs" justify="center">
                {steps.map((step, index) => (
                    <Group key={step.key} gap="xs">
                        <ThemeIcon
                            size="sm"
                            radius="xl"
                            variant={index <= active ? 'filled' : 'light'}
                            color={index <= active ? 'blue' : 'gray'}
                        >
                            {index < active ? (
                                <IconCheck size={12} />
                            ) : (
                                <Text size="xs" fw={600}>{index + 1}</Text>
                            )}
                        </ThemeIcon>
                        <Text size="xs" fw={index === active ? 600 : 400} c={index === active ? undefined : 'dimmed'}>
                            {step.label}
                        </Text>
                        {index < steps.length - 1 && (
                            <Divider orientation="vertical" h={12} mx="xs" />
                        )}
                    </Group>
                ))}
            </Group>

            <Box>{steps[active].content}</Box>

            <Group justify="flex-end">
                {active > 0 && (
                    <Button variant="subtle" onClick={() => setActive(active - 1)}>
                        Voltar
                    </Button>
                )}
                <Button onClick={isLastStep ? onComplete : () => setActive(active + 1)}>
                    {isLastStep ? 'Concluir' : 'Próximo'}
                </Button>
            </Group>
        </Stack>
    );
}

export default WizardLayout;

