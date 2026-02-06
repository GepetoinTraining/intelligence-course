'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// TYPES
// ============================================================================

interface KnowledgeNode {
    id: string;
    label: string;
    description: string;
    module: string;
    position: [number, number, number];
    connections: string[];
    createdAt: string;
}

interface Constellation3DProps {
    nodes: KnowledgeNode[];
    allNodes: KnowledgeNode[];
    moduleColors: Record<string, string>;
    onNodeClick: (node: KnowledgeNode) => void;
    linkingMode: boolean;
    linkSource: string | null;
}

// ============================================================================
// NODE COMPONENT
// ============================================================================

interface NodeSphereProps {
    node: KnowledgeNode;
    color: string;
    onClick: () => void;
    isLinkSource: boolean;
    linkingMode: boolean;
}

function NodeSphere({ node, color, onClick, isLinkSource, linkingMode }: NodeSphereProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle floating animation
            meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.05;

            // Pulse when hovered or is link source
            const scale = hovered || isLinkSource ? 1.3 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
        }
    });

    return (
        <group position={node.position}>
            {/* Glow effect */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered || isLinkSource ? 0.8 : 0.3}
                    metalness={0.2}
                    roughness={0.3}
                />
            </mesh>

            {/* Outer glow */}
            <mesh scale={1.5}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={hovered ? 0.3 : 0.1}
                />
            </mesh>

            {/* Clickable area */}
            <mesh
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = linkingMode ? 'crosshair' : 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {/* Label */}
            <Text
                position={[0, 0.6, 0]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="black"
            >
                {node.label}
            </Text>

            {/* Link source indicator */}
            {isLinkSource && (
                <mesh scale={2}>
                    <ringGeometry args={[0.4, 0.5, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
                </mesh>
            )}
        </group>
    );
}

// ============================================================================
// EDGE COMPONENT
// ============================================================================

interface EdgeLineProps {
    start: [number, number, number];
    end: [number, number, number];
    color: string;
}

function EdgeLine({ start, end, color }: EdgeLineProps) {
    const points = useMemo(() => {
        // Create a curved line between nodes
        const midPoint: [number, number, number] = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2 + 0.3,
            (start[2] + end[2]) / 2,
        ];
        return [start, midPoint, end];
    }, [start, end]);

    return (
        <Line
            points={points}
            color={color}
            lineWidth={1.5}
            opacity={0.6}
            transparent
        />
    );
}

// ============================================================================
// SCENE COMPONENT
// ============================================================================

interface SceneProps {
    nodes: KnowledgeNode[];
    allNodes: KnowledgeNode[];
    moduleColors: Record<string, string>;
    onNodeClick: (node: KnowledgeNode) => void;
    linkingMode: boolean;
    linkSource: string | null;
}

function Scene({ nodes, allNodes, moduleColors, onNodeClick, linkingMode, linkSource }: SceneProps) {
    // Generate edges (avoid duplicates)
    const edges = useMemo(() => {
        const edgeSet = new Set<string>();
        const result: { start: [number, number, number]; end: [number, number, number]; color: string }[] = [];

        allNodes.forEach(node => {
            node.connections.forEach(connId => {
                const edgeKey = [node.id, connId].sort().join('-');
                if (!edgeSet.has(edgeKey)) {
                    edgeSet.add(edgeKey);
                    const connNode = allNodes.find(n => n.id === connId);
                    if (connNode) {
                        result.push({
                            start: node.position,
                            end: connNode.position,
                            color: moduleColors[node.module] || '#888888',
                        });
                    }
                }
            });
        });

        return result;
    }, [allNodes, moduleColors]);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />

            {/* Stars background */}
            <Stars radius={50} depth={50} count={2000} factor={4} saturation={0.5} fade speed={1} />

            {/* Edges */}
            {edges.map((edge, i) => (
                <EdgeLine key={i} {...edge} />
            ))}

            {/* Nodes */}
            {nodes.map(node => (
                <NodeSphere
                    key={node.id}
                    node={node}
                    color={moduleColors[node.module] || '#888888'}
                    onClick={() => onNodeClick(node)}
                    isLinkSource={linkSource === node.id}
                    linkingMode={linkingMode}
                />
            ))}

            {/* Center reference point */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh position={[0, -1, 0]}>
                    <octahedronGeometry args={[0.15]} />
                    <meshStandardMaterial
                        color="#8b5cf6"
                        emissive="#8b5cf6"
                        emissiveIntensity={0.5}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
            </Float>

            {/* Grid helper */}
            <gridHelper args={[20, 20, '#333333', '#222222']} position={[0, -2, 0]} />

            {/* Camera controls */}
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={3}
                maxDistance={20}
                autoRotate
                autoRotateSpeed={0.3}
            />
        </>
    );
}

// ============================================================================
// MAIN CANVAS COMPONENT
// ============================================================================

export default function Constellation3D(props: Constellation3DProps) {
    return (
        <div style={{ width: '100%', height: '500px', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1b2e 50%, #0d1117 100%)' }}>
            <Canvas
                camera={{ position: [5, 5, 5], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Scene {...props} />
            </Canvas>
        </div>
    );
}

