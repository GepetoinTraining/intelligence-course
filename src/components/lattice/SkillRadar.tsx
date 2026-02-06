/**
 * Skill Radar Chart
 * 
 * Simple SVG radar with visible colors
 */

'use client';

import { useMemo } from 'react';
import type { ShapeData } from '@/lib/lattice/schemas';

// Category colors - bright and visible
const CATEGORY_COLORS: { [key: string]: string } = {
    communication: '#60A5FA',
    adaptability: '#34D399',
    diversity_understanding: '#A78BFA',
    social_media_digital: '#FBBF24',
    emotional_intelligence: '#F472B6',
    time_management: '#2DD4BF',
    networking: '#818CF8',
    continuous_learning: '#4ADE80',
    logic_reasoning: '#FB923C',
};

const CATEGORY_LABELS: { [key: string]: string } = {
    communication: 'Communication',
    adaptability: 'Adaptability',
    diversity_understanding: 'Diversity',
    social_media_digital: 'Digital',
    emotional_intelligence: 'EQ',
    time_management: 'Time Mgmt',
    networking: 'Networking',
    continuous_learning: 'Learning',
    logic_reasoning: 'Logic',
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

interface SkillRadarProps {
    shapeData: ShapeData;
    size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

export function SkillRadar({ shapeData, size = 400 }: SkillRadarProps) {
    const center = size / 2;
    const maxRadius = size * 0.35;
    const labelRadius = size * 0.45;

    const data = useMemo(() => {
        return CATEGORIES.map((cat, i) => {
            const score = shapeData.categoryScores[cat] || 0;
            // Map -2..+2 to 0..1
            const normalized = (score + 2) / 4;
            const angle = (i / CATEGORIES.length) * 360;
            const r = normalized * maxRadius;
            const point = polarToCartesian(center, center, r, angle);
            const labelPt = polarToCartesian(center, center, labelRadius, angle);

            return {
                category: cat,
                score,
                x: point.x,
                y: point.y,
                labelX: labelPt.x,
                labelY: labelPt.y,
                color: CATEGORY_COLORS[cat],
            };
        });
    }, [shapeData.categoryScores, center, maxRadius, labelRadius]);

    const path = data.map((d, i) =>
        `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`
    ).join(' ') + ' Z';

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background */}
                <circle cx={center} cy={center} r={maxRadius} fill="#1f1f2e" />

                {/* Grid rings */}
                {[0.25, 0.5, 0.75, 1].map((r, i) => (
                    <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={r * maxRadius}
                        fill="none"
                        stroke="#374151"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Spokes */}
                {data.map((d, i) => {
                    const outer = polarToCartesian(center, center, maxRadius, (i / CATEGORIES.length) * 360);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={outer.x}
                            y2={outer.y}
                            stroke="#374151"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Data polygon */}
                <path
                    d={path}
                    fill="url(#radarFill)"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                />

                {/* Gradient definition */}
                <defs>
                    <radialGradient id="radarFill">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4} />
                    </radialGradient>
                </defs>

                {/* Data points */}
                {data.map((d, i) => (
                    <g key={i}>
                        <circle cx={d.x} cy={d.y} r={8} fill={d.color} fillOpacity={0.3} />
                        <circle cx={d.x} cy={d.y} r={4} fill={d.color} />
                    </g>
                ))}

                {/* Labels */}
                {data.map((d, i) => (
                    <g key={`label-${i}`}>
                        <text
                            x={d.labelX}
                            y={d.labelY - 6}
                            textAnchor="middle"
                            fill={d.color}
                            fontSize={12}
                            fontWeight={600}
                        >
                            {CATEGORY_LABELS[d.category]}
                        </text>
                        <text
                            x={d.labelX}
                            y={d.labelY + 10}
                            textAnchor="middle"
                            fill={d.score >= 0 ? '#4ade80' : '#f87171'}
                            fontSize={11}
                            fontWeight={500}
                        >
                            {d.score >= 0 ? '+' : ''}{d.score.toFixed(1)}
                        </text>
                    </g>
                ))}

                {/* Center score */}
                <text
                    x={center}
                    y={center - 8}
                    textAnchor="middle"
                    fill="white"
                    fontSize={32}
                    fontWeight="bold"
                >
                    {shapeData.overallScore}
                </text>
                <text
                    x={center}
                    y={center + 18}
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize={12}
                >
                    Score
                </text>
            </svg>
        </div>
    );
}

export default SkillRadar;

