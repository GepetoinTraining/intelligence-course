'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Center, Loader, Text, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface MermaidDiagramProps {
    /** Valid Mermaid syntax string */
    syntax: string;
    /** Optional click handler for diagram nodes */
    onNodeClick?: (nodeId: string) => void;
}

/**
 * Client-side Mermaid renderer. Renders Mermaid syntax as inline SVG.
 * Uses dark theme to match Node Zero's UI.
 */
export function MermaidDiagram({ syntax, onNodeClick }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rendering, setRendering] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const idRef = useRef(`mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    const render = useCallback(async () => {
        if (!containerRef.current || !syntax) return;

        setRendering(true);
        setError(null);

        try {
            // Dynamic import — only loads when actually rendering
            const mermaid = (await import('mermaid')).default;

            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                fontFamily: 'Inter, system-ui, sans-serif',
                flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
                sequence: { useMaxWidth: true, wrap: true },
                gantt: { useMaxWidth: true },
            });

            const { svg } = await mermaid.render(idRef.current, syntax);
            if (containerRef.current) {
                containerRef.current.innerHTML = svg;

                // Attach click handlers to nodes
                if (onNodeClick) {
                    containerRef.current.querySelectorAll('.node, .nodeLabel').forEach(node => {
                        (node as HTMLElement).style.cursor = 'pointer';
                        node.addEventListener('click', () => {
                            onNodeClick(node.id || node.textContent || '');
                        });
                    });
                }
            }
        } catch (err) {
            console.error('[MermaidDiagram] Render error:', err);
            setError(err instanceof Error ? err.message : 'Failed to render');
        } finally {
            setRendering(false);
        }
    }, [syntax, onNodeClick]);

    useEffect(() => {
        render();
    }, [render]);

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light" title="Erro no diagrama">
                {error}
            </Alert>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', overflow: 'auto' }}>
            {rendering && (
                <Center py="md">
                    <Stack align="center" gap="xs">
                        <Loader size="sm" />
                        <Text size="xs" c="dimmed">Renderizando diagrama...</Text>
                    </Stack>
                </Center>
            )}
            <div
                ref={containerRef}
                style={{
                    display: rendering ? 'none' : 'block',
                    width: '100%',
                    padding: '16px 0',
                }}
            />
        </div>
    );
}
