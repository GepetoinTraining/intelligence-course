/**
 * AI Memory Compression System
 * 
 * SNR-based double-layer compression:
 * - Layer 1: Prune low-gravity nodes, track entropy loss
 * - Layer 2: Spectral clustering, node merging
 * 
 * Uses φ (phi) constants for thresholds:
 * - 0.382: Noise floor (below = prune)
 * - 0.618: Density threshold (cluster formation)
 * - 1.618: Phi ratio for scaling
 */

// Use crypto.randomUUID() instead of uuid package
const uuidv4 = () => crypto.randomUUID();

import {
    MemoryNode, MemoryEdge, MemoryGraph,
    CompressionReport, CompressionReportSchema,
    PHI_CONSTANTS, calculateDecayedGravity, isEligibleForPruning
} from './memory';
import {
    getMemoryGraph, deleteMemoryNode, deleteMemoryEdge,
    createMemoryNode, createMemoryEdge, updateMemoryNode
} from './memory-queries';

// ============================================================================
// LAYER 1: LOW-GRAVITY PRUNING
// ============================================================================

interface PruningResult {
    prunedNodeIds: string[];
    entropyLoss: number;
    nodesBeforeCount: number;
    nodesAfterCount: number;
}

/**
 * Layer 1: Prune nodes below gravity threshold
 * Tracks entropy loss from information removal
 */
export async function pruneLayer1(
    studentId: string,
    options?: {
        gravityThreshold?: number;
        maxNodesToPrune?: number;
        preserveTypes?: string[];
        dryRun?: boolean;
    }
): Promise<PruningResult> {
    const threshold = options?.gravityThreshold ?? PHI_CONSTANTS.NOISE_FLOOR;
    const maxPrune = options?.maxNodesToPrune ?? 100;
    const preserveTypes = options?.preserveTypes ?? ['confession', 'promise']; // High-value types

    const graph = await getMemoryGraph(studentId);
    const now = Date.now();

    // Find candidates for pruning
    const candidates = graph.nodes.filter(node => {
        // Skip preserved types
        if (preserveTypes.includes(node.type)) return false;

        // Calculate effective gravity with decay
        const daysSinceAccess = (now - node.accessedAt.getTime()) / (1000 * 60 * 60 * 24);
        const effectiveGravity = calculateDecayedGravity(node.gravity, daysSinceAccess);

        return effectiveGravity < threshold;
    });

    // Sort by effective gravity (lowest first)
    candidates.sort((a, b) => {
        const aGravity = calculateDecayedGravity(a.gravity, (now - a.accessedAt.getTime()) / (1000 * 60 * 60 * 24));
        const bGravity = calculateDecayedGravity(b.gravity, (now - b.accessedAt.getTime()) / (1000 * 60 * 60 * 24));
        return aGravity - bGravity;
    });

    // Limit pruning
    const toPrune = candidates.slice(0, maxPrune);

    // Calculate entropy loss
    // Entropy = sum of information content removed, weighted by gravity
    let totalEntropyLoss = 0;
    for (const node of toPrune) {
        // Rough entropy calculation: length * gravity * (1 - entropy already)
        const informationContent = node.content.length / 1000; // Normalize
        totalEntropyLoss += informationContent * node.gravity * (1 - node.entropy);
    }

    // Normalize entropy to 0-1 range
    const normalizedEntropyLoss = Math.min(totalEntropyLoss / graph.nodes.length, 1);

    // Execute pruning if not dry run
    const prunedIds: string[] = [];
    if (!options?.dryRun) {
        for (const node of toPrune) {
            await deleteMemoryNode(studentId, node.id);
            prunedIds.push(node.id);
        }
    } else {
        prunedIds.push(...toPrune.map(n => n.id));
    }

    return {
        prunedNodeIds: prunedIds,
        entropyLoss: normalizedEntropyLoss,
        nodesBeforeCount: graph.nodes.length,
        nodesAfterCount: graph.nodes.length - prunedIds.length,
    };
}

// ============================================================================
// LAYER 2: SPECTRAL CLUSTERING & MERGING
// ============================================================================

interface ClusterResult {
    clusters: Map<string, string[]>; // clusterId -> nodeIds
    mergedNodes: { from: string[]; to: string }[];
    nodesBeforeCount: number;
    nodesAfterCount: number;
    entropyLoss: number;
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find clusters of similar nodes using simple spectral approach
 */
function findClusters(
    nodes: MemoryNode[],
    similarityThreshold: number = PHI_CONSTANTS.DENSITY_THRESHOLD
): Map<string, string[]> {
    const clusters = new Map<string, string[]>();
    const assigned = new Set<string>();

    // Build similarity matrix for nodes with embeddings
    const nodesWithEmbeddings = nodes.filter(n => n.embedding && n.embedding.length > 0);

    for (let i = 0; i < nodesWithEmbeddings.length; i++) {
        const nodeA = nodesWithEmbeddings[i];
        if (assigned.has(nodeA.id)) continue;

        // Start a new cluster
        const clusterId = uuidv4();
        const cluster: string[] = [nodeA.id];
        assigned.add(nodeA.id);

        // Find similar nodes
        for (let j = i + 1; j < nodesWithEmbeddings.length; j++) {
            const nodeB = nodesWithEmbeddings[j];
            if (assigned.has(nodeB.id)) continue;

            // Must be same type for merging
            if (nodeA.type !== nodeB.type) continue;

            const similarity = cosineSimilarity(nodeA.embedding!, nodeB.embedding!);

            if (similarity >= similarityThreshold) {
                cluster.push(nodeB.id);
                assigned.add(nodeB.id);
            }
        }

        // Only keep clusters with 2+ nodes
        if (cluster.length >= 2) {
            clusters.set(clusterId, cluster);
        }
    }

    return clusters;
}

/**
 * Merge a cluster of nodes into a single compressed node
 */
async function mergeCluster(
    studentId: string,
    nodeIds: string[],
    nodes: Map<string, MemoryNode>
): Promise<{ mergedNode: MemoryNode; entropyLoss: number } | null> {
    if (nodeIds.length < 2) return null;

    const clusterNodes = nodeIds
        .map(id => nodes.get(id))
        .filter((n): n is MemoryNode => n !== undefined);

    if (clusterNodes.length < 2) return null;

    // Calculate merged properties
    const totalGravity = clusterNodes.reduce((sum, n) => sum + n.gravity, 0);
    const avgGravity = totalGravity / clusterNodes.length;
    const maxGravity = Math.max(...clusterNodes.map(n => n.gravity));

    // Combine content into summary
    const contents = clusterNodes.map(n => n.summary || n.content);
    const combinedContent = contents.join(' | ');
    const summary = combinedContent.length > 200
        ? combinedContent.substring(0, 197) + '...'
        : combinedContent;

    // Average embedding
    const embeddings = clusterNodes.filter(n => n.embedding).map(n => n.embedding!);
    let avgEmbedding: number[] | undefined;
    if (embeddings.length > 0) {
        avgEmbedding = new Array(embeddings[0].length).fill(0);
        for (const emb of embeddings) {
            for (let i = 0; i < emb.length; i++) {
                avgEmbedding[i] += emb[i] / embeddings.length;
            }
        }
    }

    // Calculate entropy loss from merging
    const originalInfoContent = clusterNodes.reduce((sum, n) => sum + n.content.length, 0);
    const mergedInfoContent = summary.length;
    const entropyLoss = 1 - (mergedInfoContent / originalInfoContent);

    // Inherit highest privacy level
    const privacyLevels = ['public', 'family', 'private', 'sacred'] as const;
    const maxPrivacyIndex = Math.max(...clusterNodes.map(n => privacyLevels.indexOf(n.privacyLevel)));
    const inheritedPrivacy = privacyLevels[maxPrivacyIndex];

    // Create merged node
    const mergedNode = await createMemoryNode(studentId, {
        type: clusterNodes[0].type,
        content: summary,
        summary: `Merged from ${clusterNodes.length} memories`,
        embedding: avgEmbedding,
        gravity: Math.max(avgGravity, maxGravity * 0.8), // Preserve importance
        privacyLevel: inheritedPrivacy,
    });

    // Mark as compressed and store merge info
    await updateMemoryNode(studentId, mergedNode.id, {
        // Note: We'd need to extend the update function to handle these
        // For now, we modify directly
    });

    // The actual merged node with compression metadata
    const finalNode: MemoryNode = {
        ...mergedNode,
        isCompressed: true,
        mergedFrom: nodeIds,
        originalGravity: totalGravity,
        entropy: entropyLoss,
    };

    return { mergedNode: finalNode, entropyLoss };
}

/**
 * Layer 2: Spectral clustering and node merging
 */
export async function clusterLayer2(
    studentId: string,
    options?: {
        similarityThreshold?: number;
        minClusterSize?: number;
        maxMergesPerRun?: number;
        dryRun?: boolean;
    }
): Promise<ClusterResult> {
    const threshold = options?.similarityThreshold ?? PHI_CONSTANTS.DENSITY_THRESHOLD;
    const minSize = options?.minClusterSize ?? 2;
    const maxMerges = options?.maxMergesPerRun ?? 20;

    const graph = await getMemoryGraph(studentId);
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

    // Find clusters
    const clusters = findClusters(graph.nodes, threshold);

    // Filter by minimum size
    for (const [clusterId, nodeIds] of clusters) {
        if (nodeIds.length < minSize) {
            clusters.delete(clusterId);
        }
    }

    const mergedNodes: { from: string[]; to: string }[] = [];
    let totalEntropyLoss = 0;
    let mergeCount = 0;

    if (!options?.dryRun) {
        for (const [, nodeIds] of clusters) {
            if (mergeCount >= maxMerges) break;

            const result = await mergeCluster(studentId, nodeIds, nodeMap);
            if (result) {
                // Delete original nodes
                for (const id of nodeIds) {
                    await deleteMemoryNode(studentId, id);
                }

                mergedNodes.push({
                    from: nodeIds,
                    to: result.mergedNode.id,
                });

                totalEntropyLoss += result.entropyLoss;
                mergeCount++;
            }
        }
    }

    const nodesAfter = graph.nodes.length - mergedNodes.reduce((sum, m) => sum + m.from.length, 0) + mergedNodes.length;

    return {
        clusters,
        mergedNodes,
        nodesBeforeCount: graph.nodes.length,
        nodesAfterCount: nodesAfter,
        entropyLoss: totalEntropyLoss / Math.max(mergedNodes.length, 1),
    };
}

// ============================================================================
// FULL COMPRESSION PIPELINE
// ============================================================================

export interface CompressionOptions {
    // Layer 1
    runLayer1?: boolean;
    gravityThreshold?: number;
    maxNodesToPrune?: number;
    preserveTypes?: string[];

    // Layer 2
    runLayer2?: boolean;
    similarityThreshold?: number;
    minClusterSize?: number;
    maxMergesPerRun?: number;

    // General
    dryRun?: boolean;
    sessionId?: string;
}

/**
 * Run full compression pipeline
 */
export async function runCompression(
    studentId: string,
    options?: CompressionOptions
): Promise<CompressionReport> {
    const startTime = Date.now();

    const graphBefore = await getMemoryGraph(studentId);
    const nodesBefore = graphBefore.nodes.length;
    const edgesBefore = graphBefore.edges.length;

    let nodesPruned = 0;
    let nodesMerged = 0;
    let layer1Entropy = 0;
    let layer2Entropy = 0;
    let layer1Applied = false;
    let layer2Applied = false;

    // Layer 1: Prune low-gravity nodes
    if (options?.runLayer1 !== false) {
        const pruneResult = await pruneLayer1(studentId, {
            gravityThreshold: options?.gravityThreshold,
            maxNodesToPrune: options?.maxNodesToPrune,
            preserveTypes: options?.preserveTypes,
            dryRun: options?.dryRun,
        });

        nodesPruned = pruneResult.prunedNodeIds.length;
        layer1Entropy = pruneResult.entropyLoss;
        layer1Applied = true;
    }

    // Layer 2: Cluster and merge similar nodes
    if (options?.runLayer2 !== false) {
        const clusterResult = await clusterLayer2(studentId, {
            similarityThreshold: options?.similarityThreshold,
            minClusterSize: options?.minClusterSize,
            maxMergesPerRun: options?.maxMergesPerRun,
            dryRun: options?.dryRun,
        });

        nodesMerged = clusterResult.mergedNodes.reduce((sum, m) => sum + m.from.length - 1, 0);
        layer2Entropy = clusterResult.entropyLoss;
        layer2Applied = true;
    }

    const graphAfter = await getMemoryGraph(studentId);
    const nodesAfter = graphAfter.nodes.length;
    const edgesAfter = graphAfter.edges.length;

    const report: CompressionReport = CompressionReportSchema.parse({
        sessionId: options?.sessionId,
        runAt: new Date(),
        nodesBefore,
        edgesBefore,
        nodesAfter,
        edgesAfter,
        nodesPruned,
        nodesMerged,
        edgesPruned: edgesBefore - edgesAfter,
        entropyIntroduced: Math.min(layer1Entropy + layer2Entropy, 1),
        totalEntropyLoss: (graphAfter.totalEntropyLoss || 0) + layer1Entropy + layer2Entropy,
        layer1Applied,
        layer2Applied,
        durationMs: Date.now() - startTime,
    });

    console.log(`🗜️ Compression complete:`, {
        pruned: nodesPruned,
        merged: nodesMerged,
        entropyLoss: report.entropyIntroduced.toFixed(3),
        duration: `${report.durationMs}ms`,
    });

    return report;
}

// ============================================================================
// COMPRESSION TRIGGERS
// ============================================================================

/**
 * Check if compression should be triggered
 */
export async function shouldTriggerCompression(studentId: string): Promise<{
    shouldCompress: boolean;
    reason?: string;
}> {
    const graph = await getMemoryGraph(studentId);

    // Trigger if node count exceeds threshold
    if (graph.nodes.length > PHI_CONSTANTS.COMPRESSION_THRESHOLD) {
        return {
            shouldCompress: true,
            reason: `Node count (${graph.nodes.length}) exceeds threshold (${PHI_CONSTANTS.COMPRESSION_THRESHOLD})`,
        };
    }

    // Trigger if too many low-gravity nodes
    const lowGravityRatio = graph.nodes.filter(n => isEligibleForPruning(n)).length / graph.nodes.length;
    if (lowGravityRatio > 0.3) {
        return {
            shouldCompress: true,
            reason: `${(lowGravityRatio * 100).toFixed(0)}% of nodes are low-gravity`,
        };
    }

    // Trigger if last compression was too long ago
    if (graph.lastCompressed) {
        const daysSinceCompression = (Date.now() - graph.lastCompressed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCompression > 30) {
            return {
                shouldCompress: true,
                reason: `Last compression was ${daysSinceCompression.toFixed(0)} days ago`,
            };
        }
    }

    return { shouldCompress: false };
}

/**
 * End-of-session compression (lighter version)
 */
export async function endOfSessionCompression(
    studentId: string,
    sessionId: string
): Promise<CompressionReport | null> {
    const { shouldCompress, reason } = await shouldTriggerCompression(studentId);

    if (!shouldCompress) {
        return null;
    }

    console.log(`📦 Triggering end-of-session compression: ${reason}`);

    return runCompression(studentId, {
        sessionId,
        // Light compression for end of session
        maxNodesToPrune: 20,
        maxMergesPerRun: 5,
    });
}

// ============================================================================
// DECAY OPERATIONS
// ============================================================================

/**
 * Apply time-based gravity decay to all nodes
 */
export async function decayNodes(
    studentId: string,
    halfLifeDays?: number
): Promise<{ nodesDecayed: number; avgDecayFactor: number }> {
    const halfLife = halfLifeDays ?? PHI_CONSTANTS.DECAY_HALF_LIFE;
    const graph = await getMemoryGraph(studentId);
    const now = Date.now();

    let totalDecayFactor = 0;
    let decayedCount = 0;

    for (const node of graph.nodes) {
        const daysSinceAccess = (now - node.accessedAt.getTime()) / (1000 * 60 * 60 * 24);
        const decayedGravity = calculateDecayedGravity(node.gravity, daysSinceAccess, halfLife);

        if (Math.abs(decayedGravity - node.gravity) > 0.01) {
            await updateMemoryNode(studentId, node.id, { gravity: decayedGravity });
            totalDecayFactor += decayedGravity / node.gravity;
            decayedCount++;
        }
    }

    return {
        nodesDecayed: decayedCount,
        avgDecayFactor: decayedCount > 0 ? totalDecayFactor / decayedCount : 1,
    };
}

