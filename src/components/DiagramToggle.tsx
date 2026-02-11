'use client';

import { useState, useMemo } from 'react';
import { ActionIcon, Tooltip, Collapse, Card, Group, Text, Badge, CloseButton } from '@mantine/core';
import {
    IconGitBranch,
    IconHierarchy,
    IconArrowsExchange,
    IconMoodSmile,
    IconBrain,
    IconCalendarEvent,
    IconChartDots,
    IconVectorTriangle,
} from '@tabler/icons-react';
import { MermaidDiagram } from './MermaidDiagram';
import { canVisualize, type DiagramType, DIAGRAM_LABELS } from '@/lib/mermaid/canVisualize';
import { generateDiagram } from '@/lib/mermaid/generateDiagram';

// ============================================================================
// ICON MAP — Maps DiagramType → actual React icon component
// ============================================================================

const ICON_COMPONENTS: Record<DiagramType, React.ComponentType<{ size?: number }>> = {
    stateDiagram: IconGitBranch,
    flowchart: IconHierarchy,
    sequenceDiagram: IconArrowsExchange,
    erDiagram: IconChartDots,
    journey: IconMoodSmile,
    gantt: IconCalendarEvent,
    mindmap: IconBrain,
    graph: IconVectorTriangle,
};

// ============================================================================
// DIAGRAM TOGGLE COMPONENT
// ============================================================================

interface DiagramToggleProps {
    /** API route the data was fetched from */
    route: string;
    /** The API response data */
    data: unknown;
    /** Optional: force a specific diagram type override */
    forceType?: DiagramType;
    /** Optional: custom title for the diagram */
    title?: string;
    /** Optional: callback when a node in the diagram is clicked */
    onNodeClick?: (nodeId: string) => void;
}

/**
 * "See as diagram" toggle button.
 *
 * Renders as a single ActionIcon whose icon matches the diagram type:
 *   🔀 IconGitBranch      → stateDiagram (status/state flows)
 *   🔲 IconHierarchy       → flowchart (parent-child / funnels)
 *   ⇆  IconArrowsExchange  → sequenceDiagram (temporal chains)
 *   🔵 IconChartDots       → erDiagram (entity relationships)
 *   😊 IconMoodSmile       → journey (experience maps)
 *   📅 IconCalendarEvent   → gantt (schedules)
 *   🧠 IconBrain           → mindmap (concept trees)
 *
 * On click: generates diagram once, then toggles visibility.
 */
export function DiagramToggle({
    route,
    data,
    forceType,
    title,
    onNodeClick,
}: DiagramToggleProps) {
    const [open, setOpen] = useState(false);

    // Determine visualization hint
    const hint = useMemo(() => {
        if (forceType) {
            return {
                type: forceType,
                title: title || DIAGRAM_LABELS[forceType],
                iconName: '',
            };
        }
        return canVisualize(route, data);
    }, [route, data, forceType, title]);

    // Generate diagram syntax (computed once, memoized)
    const syntax = useMemo(() => {
        if (!hint || !data) return null;
        try {
            const result = generateDiagram(hint.type, data, hint.title);
            return result.syntax;
        } catch {
            return null;
        }
    }, [hint, data]);

    // No visualization possible for this data
    if (!hint || !syntax) return null;

    const DiagramIcon = ICON_COMPONENTS[hint.type] || IconChartDots;
    const diagramLabel = DIAGRAM_LABELS[hint.type] || 'Diagrama';

    return (
        <>
            <Tooltip label={`Ver como ${diagramLabel}`} position="bottom">
                <ActionIcon
                    variant={open ? 'filled' : 'subtle'}
                    color={open ? 'blue' : 'gray'}
                    size="lg"
                    onClick={() => setOpen(!open)}
                    aria-label={`Toggle ${diagramLabel}`}
                >
                    <DiagramIcon size={18} />
                </ActionIcon>
            </Tooltip>

            <Collapse in={open}>
                <Card withBorder mt="sm" p="md" radius="md">
                    <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                            <DiagramIcon size={16} />
                            <Text fw={600} size="sm">{hint.title}</Text>
                            <Badge size="xs" variant="light" color="blue">{diagramLabel}</Badge>
                        </Group>
                        <CloseButton size="sm" onClick={() => setOpen(false)} />
                    </Group>
                    <MermaidDiagram syntax={syntax} onNodeClick={onNodeClick} />
                </Card>
            </Collapse>
        </>
    );
}
