'use client';

import { Title, Text, Stack } from '@mantine/core';
import { PromptPlayground } from '@/components/playground/PromptPlayground';

export default function PlaygroundPage() {
    return (
        <Stack gap="lg" h="calc(100vh - 120px)">
            {/* Header */}
            <div>
                <Title order={2}>Prompt Playground</Title>
                <Text c="dimmed">
                    Experimente com prompts e veja como Claude responde
                </Text>
            </div>

            {/* Playground */}
            <div style={{ flex: 1 }}>
                <PromptPlayground />
            </div>
        </Stack>
    );
}

