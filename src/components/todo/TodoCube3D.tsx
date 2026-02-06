'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, Box, Line, GradientTexture } from '@react-three/drei';
import type { Todo } from '@/app/(dashboard)/student/todo/page';
import * as THREE from 'three';

// ============================================================================
// TYPES
// ============================================================================

interface TodoCube3DProps {
    todos: Todo[];
    onToggle: (id: string) => void;
}

interface TaskSphereProps {
    todo: Todo;
    position: [number, number, number];
    color: string;
    onToggle: (id: string) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTaskPosition(todo: Todo): [number, number, number] {
    // X: Urgency (left = not urgent, right = urgent)
    const x = todo.urgent ? 1.5 : -1.5;

    // Y: Importance (bottom = not important, top = important)
    const y = todo.important ? 1.5 : -1.5;

    // Z: Effort (front = low, back = high)
    const z = todo.effort === 'low' ? 1.5 : todo.effort === 'medium' ? 0 : -1.5;

    // Add some randomness to prevent exact overlaps
    const jitter = 0.3;
    return [
        x + (Math.random() - 0.5) * jitter,
        y + (Math.random() - 0.5) * jitter,
        z + (Math.random() - 0.5) * jitter,
    ];
}

function getTaskColor(todo: Todo): string {
    if (todo.urgent && todo.important) return '#ef4444'; // red
    if (!todo.urgent && todo.important) return '#3b82f6'; // blue
    if (todo.urgent && !todo.important) return '#f97316'; // orange
    return '#6b7280'; // gray
}

// ============================================================================
// 3D COMPONENTS
// ============================================================================

function TaskSphere({ todo, position, color, onToggle }: TaskSphereProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle floating animation
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.05;

            // Scale on hover
            const targetScale = hovered ? 1.2 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    const size = todo.effort === 'high' ? 0.25 : todo.effort === 'medium' ? 0.2 : 0.15;

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={() => onToggle(todo.id)}
            >
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.4 : 0.1}
                    metalness={0.3}
                    roughness={0.4}
                />
            </mesh>

            {/* Glow effect */}
            <mesh scale={1.3}>
                <sphereGeometry args={[size, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={hovered ? 0.2 : 0.1} />
            </mesh>

            {/* Label on hover */}
            {hovered && (
                <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.9)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        maxWidth: '200px',
                        whiteSpace: 'nowrap',
                        border: `2px solid ${color}`,
                    }}>
                        <div style={{ fontWeight: 600 }}>{todo.title}</div>
                        {todo.description && (
                            <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '4px' }}>
                                {todo.description}
                            </div>
                        )}
                        <div style={{ marginTop: '4px', fontSize: '10px', opacity: 0.8 }}>
                            Clique para marcar como concluída
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

function CubeFrame() {
    const size = 3;
    const half = size / 2;

    // Define the 12 edges of a cube
    const edges = [
        // Bottom face
        [[-half, -half, -half], [half, -half, -half]],
        [[half, -half, -half], [half, -half, half]],
        [[half, -half, half], [-half, -half, half]],
        [[-half, -half, half], [-half, -half, -half]],
        // Top face
        [[-half, half, -half], [half, half, -half]],
        [[half, half, -half], [half, half, half]],
        [[half, half, half], [-half, half, half]],
        [[-half, half, half], [-half, half, -half]],
        // Vertical edges
        [[-half, -half, -half], [-half, half, -half]],
        [[half, -half, -half], [half, half, -half]],
        [[half, -half, half], [half, half, half]],
        [[-half, -half, half], [-half, half, half]],
    ] as [[number, number, number], [number, number, number]][];

    return (
        <group>
            {edges.map((edge, i) => (
                <Line
                    key={i}
                    points={edge}
                    color="#444"
                    lineWidth={1}
                    transparent
                    opacity={0.5}
                />
            ))}

            {/* Axis labels */}
            <Text position={[2, 0, 0]} fontSize={0.2} color="#ef4444">
                Urgente →
            </Text>
            <Text position={[-2, 0, 0]} fontSize={0.2} color="#22c55e">
                ← Não Urgente
            </Text>
            <Text position={[0, 2, 0]} fontSize={0.2} color="#3b82f6">
                Importante ↑
            </Text>
            <Text position={[0, -2, 0]} fontSize={0.2} color="#6b7280">
                ↓ Não Importante
            </Text>
            <Text position={[0, 0, 2]} fontSize={0.2} color="#22c55e">
                Baixo Esforço
            </Text>
            <Text position={[0, 0, -2]} fontSize={0.2} color="#eab308">
                Alto Esforço
            </Text>

            {/* Quadrant planes (semi-transparent) */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                <planeGeometry args={[3, 3]} />
                <meshBasicMaterial color="#888" transparent opacity={0.05} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3, 3]} />
                <meshBasicMaterial color="#888" transparent opacity={0.05} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[3, 3]} />
                <meshBasicMaterial color="#888" transparent opacity={0.05} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function RotatingGroup({ children }: { children: React.ReactNode }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current) {
            // Very slow auto-rotation when not interacting
            groupRef.current.rotation.y += 0.001;
        }
    });

    return <group ref={groupRef}>{children}</group>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TodoCube3D({ todos, onToggle }: TodoCube3DProps) {
    // Memoize positions to prevent re-calculation on every render
    const todoPositions = useMemo(() => {
        return todos.map(todo => ({
            todo,
            position: getTaskPosition(todo),
            color: getTaskColor(todo),
        }));
    }, [todos]);

    return (
        <Canvas camera={{ position: [5, 4, 5], fov: 50 }}>
            <color attach="background" args={['#0a0a0a']} />

            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />

            {/* Stars background */}
            {Array.from({ length: 100 }).map((_, i) => (
                <mesh
                    key={i}
                    position={[
                        (Math.random() - 0.5) * 30,
                        (Math.random() - 0.5) * 30,
                        (Math.random() - 0.5) * 30,
                    ]}
                >
                    <sphereGeometry args={[0.02, 8, 8]} />
                    <meshBasicMaterial color="white" />
                </mesh>
            ))}

            {/* Cube wireframe and labels */}
            <CubeFrame />

            {/* Task spheres */}
            {todoPositions.map(({ todo, position, color }) => (
                <TaskSphere
                    key={todo.id}
                    todo={todo}
                    position={position}
                    color={color}
                    onToggle={onToggle}
                />
            ))}

            {/* Controls */}
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={3}
                maxDistance={15}
                autoRotate={false}
            />
        </Canvas>
    );
}

