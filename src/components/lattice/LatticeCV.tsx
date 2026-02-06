/**
 * Lattice CV Generator
 * 
 * Generates a downloadable, evidence-based CV from the lattice data
 * Can be exported as PDF or shared as a link
 */

'use client';

import { useRef, useState, useCallback } from 'react';
import {
    Paper,
    Text,
    Title,
    Stack,
    Group,
    Badge,
    Progress,
    Button,
    Divider,
    Grid,
    Box,
    ThemeIcon,
    Timeline,
    ActionIcon,
    Tooltip,
    Card,
} from '@mantine/core';
import {
    IconDownload,
    IconShare,
    IconPrinter,
    IconStar,
    IconAlertTriangle,
    IconBrain,
    IconUsers,
    IconClock,
    IconBulb,
    IconHeart,
    IconWorld,
    IconDeviceMobile,
    IconRefresh,
    IconLogicAnd,
} from '@tabler/icons-react';
import { SkillRadar } from './SkillRadar';
import {
    SKILL_CATEGORIES,
    getCategoryName,
    getSkillName,
    type SkillCategory
} from '@/lib/lattice/skills';
import type { ShapeData, ShadowRegion } from '@/lib/lattice/schemas';

// ============================================================================
// Category Icons
// ============================================================================

const CATEGORY_ICONS: Record<SkillCategory, typeof IconBrain> = {
    communication: IconUsers,
    adaptability: IconRefresh,
    diversity_understanding: IconWorld,
    social_media_digital: IconDeviceMobile,
    emotional_intelligence: IconHeart,
    time_management: IconClock,
    networking: IconUsers,
    continuous_learning: IconBulb,
    logic_reasoning: IconLogicAnd,
};

const CATEGORY_COLORS: Record<SkillCategory, string> = {
    communication: 'blue',
    adaptability: 'teal',
    diversity_understanding: 'violet',
    social_media_digital: 'yellow',
    emotional_intelligence: 'pink',
    time_management: 'cyan',
    networking: 'indigo',
    continuous_learning: 'green',
    logic_reasoning: 'orange',
};

// ============================================================================
// Types
// ============================================================================

interface LatticeCVProps {
    shapeData: ShapeData;
    personName: string;
    personEmail?: string;
    personTitle?: string;
    bio?: string;
    projectionName?: string;
    generatedAt?: Date;
    evidenceHighlights?: Array<{
        content: string;
        source: string;
        date: string;
    }>;
    onShare?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getPositionLabel(position: number): string {
    if (position >= 1.5) return 'Core Strength';
    if (position >= 0.5) return 'Developed';
    if (position >= -0.5) return 'Functional';
    if (position >= -1.5) return 'Developing';
    return 'Growth Area';
}

function getPositionColor(position: number): string {
    if (position >= 1.5) return 'green';
    if (position >= 0.5) return 'teal';
    if (position >= -0.5) return 'gray';
    if (position >= -1.5) return 'orange';
    return 'red';
}

function positionToPercent(position: number): number {
    // Map -2 to +2 → 0 to 100
    return ((position + 2) / 4) * 100;
}

// ============================================================================
// Skill Category Card
// ============================================================================

function CategoryCard({
    category,
    positions,
    shadowRegions,
}: {
    category: SkillCategory;
    positions: Record<string, number>;
    shadowRegions: ShadowRegion[];
}) {
    const categorySkills = Object.entries(positions)
        .filter(([id]) => {
            // Match skills to categories based on prefix
            const prefix = category.substring(0, 3);
            return id.startsWith(prefix) ||
                (category === 'emotional_intelligence' && id.startsWith('eq')) ||
                (category === 'time_management' && id.startsWith('tm')) ||
                (category === 'continuous_learning' && id.startsWith('cl')) ||
                (category === 'logic_reasoning' && id.startsWith('lr')) ||
                (category === 'social_media_digital' && id.startsWith('smd')) ||
                (category === 'diversity_understanding' && id.startsWith('div')) ||
                (category === 'networking' && id.startsWith('net')) ||
                (category === 'adaptability' && id.startsWith('adapt')) ||
                (category === 'communication' && id.startsWith('comm'));
        })
        .sort((a, b) => b[1] - a[1]);

    const shadowSkills = new Set(shadowRegions.map(s => s.skillId));
    const Icon = CATEGORY_ICONS[category];
    const color = CATEGORY_COLORS[category];

    // Calculate category average
    const avg = categorySkills.length > 0
        ? categorySkills.reduce((sum, [, pos]) => sum + pos, 0) / categorySkills.length
        : 0;

    return (
        <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group mb="xs">
                <ThemeIcon size="lg" radius="md" color={color} variant="light">
                    <Icon size={20} />
                </ThemeIcon>
                <div>
                    <Text fw={600} size="sm">{getCategoryName(category)}</Text>
                    <Badge size="xs" color={getPositionColor(avg)} variant="light">
                        {getPositionLabel(avg)}
                    </Badge>
                </div>
            </Group>

            <Stack gap="xs">
                {categorySkills.slice(0, 5).map(([skillId, position]) => (
                    <div key={skillId}>
                        <Group justify="space-between" mb={4}>
                            <Text size="xs" c={shadowSkills.has(skillId) ? 'red' : 'dimmed'}>
                                {getSkillName(skillId)}
                                {shadowSkills.has(skillId) && (
                                    <IconAlertTriangle size={12} style={{ marginLeft: 4 }} />
                                )}
                            </Text>
                            <Text size="xs" c={getPositionColor(position)} fw={500}>
                                {position >= 0 ? '+' : ''}{position.toFixed(1)}
                            </Text>
                        </Group>
                        <Progress
                            value={positionToPercent(position)}
                            size="xs"
                            color={shadowSkills.has(skillId) ? 'red' : color}
                        />
                    </div>
                ))}
            </Stack>
        </Card>
    );
}

// ============================================================================
// Top Strengths Section
// ============================================================================

function TopStrengths({ positions }: { positions: Record<string, number> }) {
    const strengths = Object.entries(positions)
        .filter(([, pos]) => pos >= 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    if (strengths.length === 0) return null;

    return (
        <Box>
            <Group gap="xs" mb="sm">
                <IconStar size={18} color="#22c55e" />
                <Text fw={600}>Core Strengths</Text>
            </Group>
            <Group gap="xs">
                {strengths.map(([skillId, position]) => (
                    <Badge
                        key={skillId}
                        size="lg"
                        color="green"
                        variant="light"
                        leftSection={
                            <Text size="xs" fw={700}>
                                +{position.toFixed(1)}
                            </Text>
                        }
                    >
                        {getSkillName(skillId)}
                    </Badge>
                ))}
            </Group>
        </Box>
    );
}

// ============================================================================
// Growth Areas Section
// ============================================================================

function GrowthAreas({
    positions,
    shadowRegions
}: {
    positions: Record<string, number>;
    shadowRegions: ShadowRegion[];
}) {
    const gaps = Object.entries(positions)
        .filter(([, pos]) => pos < -0.5)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 4);

    if (gaps.length === 0) return null;

    const shadowSkills = new Set(shadowRegions.map(s => s.skillId));

    return (
        <Box>
            <Group gap="xs" mb="sm">
                <IconBulb size={18} color="#f59e0b" />
                <Text fw={600}>Growth Opportunities</Text>
            </Group>
            <Group gap="xs">
                {gaps.map(([skillId, position]) => (
                    <Badge
                        key={skillId}
                        size="lg"
                        color={shadowSkills.has(skillId) ? 'red' : 'orange'}
                        variant="light"
                        leftSection={
                            <Text size="xs" fw={700}>
                                {position.toFixed(1)}
                            </Text>
                        }
                    >
                        {getSkillName(skillId)}
                    </Badge>
                ))}
            </Group>
        </Box>
    );
}

// ============================================================================
// Evidence Timeline
// ============================================================================

function EvidenceTimeline({
    highlights
}: {
    highlights?: Array<{ content: string; source: string; date: string }>
}) {
    if (!highlights || highlights.length === 0) return null;

    return (
        <Box>
            <Text fw={600} mb="md">Evidence Highlights</Text>
            <Timeline active={highlights.length - 1} bulletSize={24} lineWidth={2}>
                {highlights.map((h, i) => (
                    <Timeline.Item
                        key={i}
                        title={h.source}
                        bullet={<IconBrain size={14} />}
                    >
                        <Text c="dimmed" size="sm" mt={4}>
                            {h.content}
                        </Text>
                        <Text size="xs" c="dimmed" mt={4}>
                            {h.date}
                        </Text>
                    </Timeline.Item>
                ))}
            </Timeline>
        </Box>
    );
}

// ============================================================================
// Main CV Component
// ============================================================================

export function LatticeCV({
    shapeData,
    personName,
    personEmail,
    personTitle,
    bio,
    projectionName,
    generatedAt = new Date(),
    evidenceHighlights,
    onShare,
}: LatticeCVProps) {
    const cvRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = useCallback(() => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    }, []);

    const handleDownload = useCallback(async () => {
        // For now, trigger print which can save as PDF
        // In production, could use a server-side PDF generator
        handlePrint();
    }, [handlePrint]);

    return (
        <div ref={cvRef} className="lattice-cv">
            <Paper
                shadow="md"
                radius="lg"
                p="xl"
                style={{
                    background: 'linear-gradient(180deg, #1a1b2e 0%, #0f0f1a 100%)',
                    color: 'white',
                    maxWidth: 900,
                    margin: '0 auto',
                }}
            >
                {/* Actions (hide on print) */}
                <Group justify="flex-end" mb="lg" className="print:hidden">
                    <Tooltip label="Download PDF">
                        <ActionIcon
                            variant="light"
                            size="lg"
                            onClick={handleDownload}
                            loading={isPrinting}
                        >
                            <IconDownload size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Print">
                        <ActionIcon variant="light" size="lg" onClick={handlePrint}>
                            <IconPrinter size={18} />
                        </ActionIcon>
                    </Tooltip>
                    {onShare && (
                        <Tooltip label="Share">
                            <ActionIcon variant="light" size="lg" onClick={onShare}>
                                <IconShare size={18} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>

                {/* Header */}
                <Group justify="space-between" align="flex-start" mb="xl">
                    <div>
                        <Title order={1} mb="xs">{personName}</Title>
                        {personTitle && (
                            <Text size="lg" c="dimmed">{personTitle}</Text>
                        )}
                        {personEmail && (
                            <Text size="sm" c="dimmed">{personEmail}</Text>
                        )}
                        {bio && (
                            <Text size="sm" mt="md" maw={500}>{bio}</Text>
                        )}
                    </div>

                    {/* Mini radar chart */}
                    <Box style={{ width: 200, height: 200 }}>
                        <SkillRadar
                            shapeData={shapeData}
                            size={200}
                        />
                    </Box>
                </Group>

                {/* Score & Projection */}
                <Paper
                    radius="md"
                    p="lg"
                    mb="xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="sm" c="dimmed">Overall Fit Score</Text>
                            <Group gap="sm" align="baseline">
                                <Text size="xl" fw={700} style={{ fontSize: 48 }}>
                                    {shapeData.overallScore}
                                </Text>
                                <Text c="dimmed">/ 100</Text>
                            </Group>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <Text size="sm" c="dimmed">Based on</Text>
                            <Text fw={600}>{shapeData.totalEvidenceCount} evidence points</Text>
                            {projectionName && (
                                <Text size="sm" c="dimmed">via "{projectionName}"</Text>
                            )}
                        </div>
                    </Group>
                </Paper>

                {/* Strengths & Growth */}
                <Stack gap="lg" mb="xl">
                    <TopStrengths positions={shapeData.positions} />
                    <GrowthAreas
                        positions={shapeData.positions}
                        shadowRegions={shapeData.shadowRegions}
                    />
                </Stack>

                <Divider my="xl" color="gray.7" />

                {/* Category Breakdown */}
                <Text fw={600} size="lg" mb="md">Skill Breakdown</Text>
                <Grid gutter="md" mb="xl">
                    {SKILL_CATEGORIES.map(category => (
                        <Grid.Col key={category} span={{ base: 12, sm: 6, lg: 4 }}>
                            <CategoryCard
                                category={category}
                                positions={shapeData.positions}
                                shadowRegions={shapeData.shadowRegions}
                            />
                        </Grid.Col>
                    ))}
                </Grid>

                {/* Evidence Timeline */}
                {evidenceHighlights && evidenceHighlights.length > 0 && (
                    <>
                        <Divider my="xl" color="gray.7" />
                        <EvidenceTimeline highlights={evidenceHighlights} />
                    </>
                )}

                {/* Footer */}
                <Divider my="xl" color="gray.7" />
                <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                        Generated by Lattice HR
                    </Text>
                    <Text size="xs" c="dimmed">
                        {generatedAt.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                </Group>
            </Paper>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .lattice-cv {
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
}

export default LatticeCV;

