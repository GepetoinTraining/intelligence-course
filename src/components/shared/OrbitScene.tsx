'use client';

import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Html } from '@react-three/drei';
import { Box, Paper, Text as MantineText, LoadingOverlay, Group, ThemeIcon, Stack, Badge } from '@mantine/core';
import { IconPlanet } from '@tabler/icons-react';
import * as THREE from 'three';

// ----------------------------------------
// Types
// ----------------------------------------

export interface OrbitNode {
    id: string;
    label: string;
    description?: string;
    size?: number;
    color?: string;
    ring?: number; // Which ring/orbit to place on (0 = center)
    angle?: number; // Position on ring in radians
    category?: string;
    onClick?: () => void;
}

export interface OrbitConnection {
    from: string;
    to: string;
    color?: string;
    opacity?: number;
}

export interface OrbitSceneProps {
    centerNode: OrbitNode;
    nodes: OrbitNode[];
    connections?: OrbitConnection[];
    ringCount?: number;
    ringSpacing?: number;
    animated?: boolean;
    rotationSpeed?: number;
    height?: number;
    onNodeClick?: (node: OrbitNode) => void;
    showLabels?: boolean;
    backgroundColor?: string;
}

// ----------------------------------------
// 3D Components
// ----------------------------------------

interface PlanetProps {
    position: [number, number, number];
    node: OrbitNode;
    onClick?: () => void;
    showLabel?: boolean;
    isCenter?: boolean;
}

function Planet({ position, node, onClick, showLabel = true, isCenter = false }: PlanetProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const size = node.size ?? (isCenter ? 0.8 : 0.3);
    const color = node.color ?? (isCenter ? '#3b82f6' : '#94a3b8');

    useFrame((state) => {
        if (meshRef.current && !isCenter) {
            meshRef.current.rotation.y += 0.005;
        }
        if (meshRef.current && hovered) {
            meshRef.current.scale.setScalar(1.2);
        } else if (meshRef.current) {
            meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.5 : isCenter ? 0.3 : 0.1}
                    metalness={0.3}
                    roughness={0.7}
                />
            </mesh>

            {/* Glow effect */}
            <mesh>
                <sphereGeometry args={[size * 1.2, 32, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={hovered ? 0.3 : 0.1}
                />
            </mesh>

            {/* Label */}
            {showLabel && (
                <Html
                    position={[0, size + 0.4, 0]}
                    center
                    style={{
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(0,0,0,0.75)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: isCenter ? '14px' : '11px',
                            fontWeight: isCenter ? 600 : 400,
                            fontFamily: 'system-ui, sans-serif',
                            opacity: hovered ? 1 : 0.8,
                        }}
                    >
                        {node.label}
                    </div>
                </Html>
            )}
        </group>
    );
}

interface OrbitRingProps {
    radius: number;
    segments?: number;
    color?: string;
    opacity?: number;
}

function OrbitRing({ radius, segments = 64, color = '#334155', opacity = 0.3 }: OrbitRingProps) {
    const points = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        return pts;
    }, [radius, segments]);

    return (
        <Line
            points={points}
            color={color}
            lineWidth={1}
            transparent
            opacity={opacity}
        />
    );
}

interface ConnectionLineProps {
    start: [number, number, number];
    end: [number, number, number];
    color?: string;
    opacity?: number;
}

function ConnectionLine({ start, end, color = '#60a5fa', opacity = 0.4 }: ConnectionLineProps) {
    return (
        <Line
            points={[start, end]}
            color={color}
            lineWidth={1.5}
            transparent
            opacity={opacity}
        />
    );
}

interface OrbitSystemProps extends Omit<OrbitSceneProps, 'height' | 'backgroundColor'> { }

function OrbitSystem({
    centerNode,
    nodes,
    connections = [],
    ringCount = 3,
    ringSpacing = 2.5,
    animated = true,
    rotationSpeed = 0.001,
    onNodeClick,
    showLabels = true,
}: OrbitSystemProps) {
    const groupRef = useRef<THREE.Group>(null);

    // Slowly rotate the entire system
    useFrame(() => {
        if (groupRef.current && animated) {
            groupRef.current.rotation.y += rotationSpeed;
        }
    });

    // Calculate node positions
    const nodePositions = useMemo(() => {
        const positions: Record<string, [number, number, number]> = {};

        // Center node
        positions[centerNode.id] = [0, 0, 0];

        // Group nodes by ring
        const nodesByRing: Record<number, OrbitNode[]> = {};
        nodes.forEach((node) => {
            const ring = node.ring ?? 1;
            if (!nodesByRing[ring]) nodesByRing[ring] = [];
            nodesByRing[ring].push(node);
        });

        // Position nodes on their rings
        Object.entries(nodesByRing).forEach(([ringStr, ringNodes]) => {
            const ring = parseInt(ringStr);
            const radius = ring * ringSpacing;

            ringNodes.forEach((node, idx) => {
                const angle = node.angle ?? (idx / ringNodes.length) * Math.PI * 2;
                positions[node.id] = [
                    Math.cos(angle) * radius,
                    (Math.random() - 0.5) * 0.5, // Slight vertical offset
                    Math.sin(angle) * radius,
                ];
            });
        });

        return positions;
    }, [centerNode, nodes, ringSpacing]);

    // Get rings to render
    const rings = useMemo(() => {
        const uniqueRings = new Set<number>();
        nodes.forEach(n => uniqueRings.add(n.ring ?? 1));
        return Array.from(uniqueRings).sort((a, b) => a - b);
    }, [nodes]);

    return (
        <group ref={groupRef}>
            {/* Orbit rings */}
            {rings.map((ring) => (
                <OrbitRing key={ring} radius={ring * ringSpacing} />
            ))}

            {/* Connection lines */}
            {connections.map((conn, idx) => {
                const start = nodePositions[conn.from];
                const end = nodePositions[conn.to];
                if (!start || !end) return null;
                return (
                    <ConnectionLine
                        key={idx}
                        start={start}
                        end={end}
                        color={conn.color}
                        opacity={conn.opacity}
                    />
                );
            })}

            {/* Center node */}
            <Planet
                position={[0, 0, 0]}
                node={centerNode}
                isCenter
                showLabel={showLabels}
                onClick={() => onNodeClick?.(centerNode)}
            />

            {/* Orbiting nodes */}
            {nodes.map((node) => (
                <Planet
                    key={node.id}
                    position={nodePositions[node.id]}
                    node={node}
                    showLabel={showLabels}
                    onClick={() => {
                        node.onClick?.();
                        onNodeClick?.(node);
                    }}
                />
            ))}
        </group>
    );
}

// ----------------------------------------
// Main Component
// ----------------------------------------

export function OrbitScene({
    centerNode,
    nodes,
    connections = [],
    ringCount = 3,
    ringSpacing = 2.5,
    animated = true,
    rotationSpeed = 0.001,
    height = 500,
    onNodeClick,
    showLabels = true,
    backgroundColor = '#0f172a',
}: OrbitSceneProps) {
    return (
        <Box
            style={{
                width: '100%',
                height: height,
                borderRadius: 'var(--mantine-radius-md)',
                overflow: 'hidden',
                background: backgroundColor,
            }}
        >
            <Suspense
                fallback={
                    <Box h={height} pos="relative">
                        <LoadingOverlay visible loaderProps={{ type: 'dots' }} />
                    </Box>
                }
            >
                <Canvas
                    camera={{ position: [0, 8, 12], fov: 50 }}
                    style={{ background: backgroundColor }}
                >
                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 10, 10]} intensity={0.6} />
                    <pointLight position={[-10, -10, -10]} intensity={0.3} color="#60a5fa" />

                    <OrbitSystem
                        centerNode={centerNode}
                        nodes={nodes}
                        connections={connections}
                        ringCount={ringCount}
                        ringSpacing={ringSpacing}
                        animated={animated}
                        rotationSpeed={rotationSpeed}
                        onNodeClick={onNodeClick}
                        showLabels={showLabels}
                    />

                    <OrbitControls
                        enablePan={false}
                        minDistance={5}
                        maxDistance={30}
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 2.2}
                    />
                </Canvas>
            </Suspense>
        </Box>
    );
}

// ----------------------------------------
// Demo/Preview Component
// ----------------------------------------

export function OrbitScenePreview() {
    const centerNode: OrbitNode = {
        id: 'center',
        label: 'Core Concept',
        color: '#3b82f6',
        size: 0.8,
    };

    const nodes: OrbitNode[] = [
        { id: '1', label: 'Orbit', ring: 1, color: '#22c55e' },
        { id: '2', label: 'Slingshot', ring: 1, angle: Math.PI / 2, color: '#f97316' },
        { id: '3', label: 'Black Hole', ring: 1, angle: Math.PI, color: '#8b5cf6' },
        { id: '4', label: 'Constellation', ring: 1, angle: Math.PI * 1.5, color: '#06b6d4' },
        { id: '5', label: 'Technique A', ring: 2, color: '#64748b' },
        { id: '6', label: 'Technique B', ring: 2, angle: Math.PI * 0.7, color: '#64748b' },
        { id: '7', label: 'Application', ring: 3, color: '#94a3b8' },
    ];

    const connections: OrbitConnection[] = [
        { from: 'center', to: '1' },
        { from: 'center', to: '2' },
        { from: 'center', to: '3' },
        { from: 'center', to: '4' },
        { from: '1', to: '5' },
        { from: '2', to: '6' },
    ];

    return (
        <OrbitScene
            centerNode={centerNode}
            nodes={nodes}
            connections={connections}
            height={400}
            onNodeClick={(node) => console.log('Clicked:', node.label)}
        />
    );
}

export default OrbitScene;

