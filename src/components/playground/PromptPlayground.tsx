'use client';

import { useState } from 'react';
import {
    Paper,
    Textarea,
    Button,
    Group,
    Stack,
    Select,
    Text,
    Badge,
    Loader,
    Slider,
    Collapse,
    ActionIcon,
} from '@mantine/core';
import { IconPlayerPlay, IconSettings, IconDeviceFloppy } from '@tabler/icons-react';
import { CLAUDE_MODELS } from '@/lib/ai/anthropic';
import { OutputDisplay } from './OutputDisplay';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface RunResult {
    runId: string;
    output: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    error?: { code: string; message: string };
}

export function PromptPlayground() {
    const [systemPrompt, setSystemPrompt] = useState('');
    const [userMessage, setUserMessage] = useState('');
    const [model, setModel] = useState<string>('claude-sonnet-4-5-20250929');
    const [temperature, setTemperature] = useState(0.7);
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<RunResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
        if (!userMessage.trim()) {
            setError('Please enter a message');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const messages: Message[] = [{ role: 'user', content: userMessage }];

            const response = await fetch('/api/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    systemPrompt: systemPrompt || undefined,
                    messages,
                    temperature,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to run prompt');
                return;
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const modelOptions = CLAUDE_MODELS.map((m) => ({
        value: m.id,
        label: m.name,
    }));

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '1rem', height: '100%' }}>
            {/* Left Panel - Input */}
            <Stack gap="md">
                <Paper shadow="xs" radius="md" p="lg" style={{ border: '1px solid var(--mantine-color-gray-2)' }}>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text fw={500} size="sm" c="dimmed">
                                SYSTEM PROMPT
                            </Text>
                            <ActionIcon
                                variant="subtle"
                                size="sm"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <IconSettings size={16} />
                            </ActionIcon>
                        </Group>

                        <Textarea
                            placeholder="You are a helpful assistant..."
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            minRows={4}
                            maxRows={8}
                            autosize
                            styles={{
                                input: {
                                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                                    fontSize: '0.9rem',
                                },
                            }}
                        />

                        <Collapse in={showSettings}>
                            <Stack gap="xs" mt="xs">
                                <Select
                                    label="Model"
                                    data={modelOptions}
                                    value={model}
                                    onChange={(v) => v && setModel(v)}
                                    size="sm"
                                />
                                <div>
                                    <Text size="xs" c="dimmed" mb={4}>
                                        Temperature: {temperature.toFixed(1)}
                                    </Text>
                                    <Slider
                                        value={temperature}
                                        onChange={setTemperature}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        size="sm"
                                        marks={[
                                            { value: 0, label: '0' },
                                            { value: 0.5, label: '0.5' },
                                            { value: 1, label: '1' },
                                        ]}
                                    />
                                </div>
                            </Stack>
                        </Collapse>
                    </Stack>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" style={{ border: '1px solid var(--mantine-color-gray-2)', flex: 1 }}>
                    <Stack gap="md" h="100%">
                        <Text fw={500} size="sm" c="dimmed">
                            USER MESSAGE
                        </Text>

                        <Textarea
                            placeholder="Enter your message..."
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                            minRows={6}
                            style={{ flex: 1 }}
                            styles={{
                                input: {
                                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                                    fontSize: '0.9rem',
                                },
                            }}
                        />

                        {error && (
                            <Text c="red" size="sm">
                                {error}
                            </Text>
                        )}

                        <Group>
                            <Button
                                leftSection={isLoading ? <Loader size={16} color="white" /> : <IconPlayerPlay size={16} />}
                                onClick={handleRun}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Running...' : 'Run'}
                            </Button>
                            <Button variant="light" leftSection={<IconDeviceFloppy size={16} />} disabled>
                                Save
                            </Button>
                        </Group>
                    </Stack>
                </Paper>
            </Stack>

            {/* Right Panel - Output */}
            <Paper shadow="xs" radius="md" p="lg" style={{ border: '1px solid var(--mantine-color-gray-2)' }}>
                <Stack gap="md" h="100%">
                    <Group justify="space-between">
                        <Text fw={500} size="sm" c="dimmed">
                            OUTPUT
                        </Text>
                        {result && (
                            <Group gap="xs">
                                <Badge size="sm" variant="light" color="gray">
                                    {result.inputTokens} in / {result.outputTokens} out
                                </Badge>
                                <Badge size="sm" variant="light" color="blue">
                                    {result.latencyMs}ms
                                </Badge>
                            </Group>
                        )}
                    </Group>

                    <OutputDisplay
                        output={result?.output}
                        error={result?.error}
                        isLoading={isLoading}
                    />
                </Stack>
            </Paper>
        </div>
    );
}

