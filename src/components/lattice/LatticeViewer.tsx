/**
 * Lattice 3D Visualization
 * 
 * Simple, working point cloud with React Three Fiber
 */

'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ShapeData } from '@/lib/lattice/schemas';

// ============================================================================
// Category Colors - Bright, visible colors
// ============================================================================

const CATEGORY_COLORS: Record<string, string> = {
    comm: '#60A5FA',      // Blue
    adapt: '#34D399',     // Green
    div: '#A78BFA',       // Purple
    smd: '#FBBF24',       // Yellow
    eq: '#F472B6',        // Pink
    tm: '#2DD4BF',        // Teal
    net: '#818CF8',       // Indigo
    cl: '#4ADE80',        // Lime
    lr: '#FB923C',        // Orange
};

function getColorForSkill(skillId: string): string {
    for (const [prefix, color] of Object.entries(CATEGORY_COLORS)) {
        if (skillId.startsWith(prefix)) return color;
    }
    return '#FFFFFF';
}

// ============================================================================
// Types
// ============================================================================

interface LatticeViewerProps {
    shapeData: ShapeData;
    personName?: string;
    projectionName?: string;
}

interface SkillPoint {
    id: string;
    position: number;
    color: string;
    x: number;
    y: number;
    z: number;
}

// ============================================================================
// Convert positions to 3D layout
// ============================================================================

function positionsTo3D(positions: Record<string, number>): SkillPoint[] {
    const points: SkillPoint[] = [];
    const entries = Object.entries(positions);

    entries.forEach(([skillId, position], index) => {
        const angle = (index / entries.length) * Math.PI * 2;
        const radius = 2 + Math.random() * 1.5;

        points.push({
            id: skillId,
            position,
            color: getColorForSkill(skillId),
            x: Math.cos(angle) * radius,
            y: position * 1.2, // Height based on skill position
            z: Math.sin(angle) * radius,
        });
    });

    return points;
}

// ============================================================================
// Single Skill Sphere
// ============================================================================

function SkillSphere({
    point,
    isHovered,
    onHover,
    onUnhover
}: {
    point: SkillPoint;
    isHovered: boolean;
    onHover: () => void;
    onUnhover: () => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const baseY = point.y;

    useFrame((state) => {
        if (!meshRef.current) return;
        // Gentle float animation
        const t = state.clock.elapsedTime;
        meshRef.current.position.y = baseY + Math.sin(t + point.x) * 0.05;
    });

    const size = isHovered ? 0.18 : 0.12;

    return (
        <mesh
            ref={meshRef}
            position={[point.x, point.y, point.z]}
            onPointerOver={onHover}
            onPointerOut={onUnhover}
        >
            <sphereGeometry args={[size, 16, 16]} />
            <meshStandardMaterial
                color={point.color}
                emissive={point.color}
                emissiveIntensity={isHovered ? 0.8 : 0.4}
            />

            {isHovered && (
                <Html center style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.85)',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        border: `2px solid ${point.color}`,
                    }}>
                        <div style={{ fontWeight: 'bold' }}>{point.id}</div>
                        <div style={{
                            color: point.position >= 0 ? '#4ade80' : '#f87171'
                        }}>
                            {point.position >= 0 ? '+' : ''}{point.position.toFixed(1)}
                        </div>
                    </div>
                </Html>
            )}
        </mesh>
    );
}

// ============================================================================
// Scene Content
// ============================================================================

function Scene({ points, score }: { points: SkillPoint[]; score: number }) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -5, -10]} intensity={0.5} color="#8B5CF6" />

            {/* Controls */}
            <OrbitControls
                enableDamping
                dampingFactor={0.05}
                minDistance={4}
                maxDistance={15}
            />

            {/* Ground plane reference */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
                <circleGeometry args={[5, 32]} />
                <meshBasicMaterial color="#1a1a2e" transparent opacity={0.5} />
            </mesh>

            {/* Vertical axis line */}
            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[new Float32Array([0, -3, 0, 0, 3, 0]), 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#4B5563" />
            </line>

            {/* Skill spheres */}
            {points.map(point => (
                <SkillSphere
                    key={point.id}
                    point={point}
                    isHovered={hoveredId === point.id}
                    onHover={() => setHoveredId(point.id)}
                    onUnhover={() => setHoveredId(null)}
                />
            ))}

            {/* Score display */}
            <Html position={[0, 4, 0]} center>
                <div style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    color: 'white',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{score}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Fit Score</div>
                </div>
            </Html>
        </>
    );
}

// ============================================================================
// Main Export
// ============================================================================

export function LatticeViewer({ shapeData }: LatticeViewerProps) {
    const points = useMemo(
        () => positionsTo3D(shapeData.positions),
        [shapeData.positions]
    );

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '500px',
            background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
            borderRadius: '12px',
        }}>
            <Canvas
                camera={{ position: [6, 4, 6], fov: 50 }}
                gl={{ antialias: true }}
            >
                <Scene points={points} score={shapeData.overallScore} />
            </Canvas>
        </div>
    );
}

export default LatticeViewer;

