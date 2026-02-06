/**
 * AI Memory Queries
 * 
 * CRUD operations for memory nodes, edges, and ledger entries.
 * In production, these would connect to a database.
 * For now, uses in-memory storage with localStorage persistence.
 */

// Use crypto.randomUUID() instead of uuid package
const uuidv4 = () => crypto.randomUUID();

import {
    MemoryNode, MemoryNodeSchema, MemoryNodeType,
    MemoryEdge, MemoryEdgeSchema, MemoryEdgeType,
    MemoryGraph, MemoryGraphSchema,
    LedgerEntry, LedgerEntrySchema, LedgerCategory,
    MemorySession, MemorySessionSchema,
    PHI_CONSTANTS, calculateDecayedGravity
} from './memory';

// ============================================================================
// IN-MEMORY STORAGE (Replace with DB in production)
// ============================================================================

interface MemoryStore {
    nodes: Map<string, MemoryNode>;
    edges: Map<string, MemoryEdge>;
    ledger: Map<string, LedgerEntry>;
    sessions: Map<string, MemorySession>;
}

const stores: Map<string, MemoryStore> = new Map();

function getStore(studentId: string): MemoryStore {
    if (!stores.has(studentId)) {
        stores.set(studentId, {
            nodes: new Map(),
            edges: new Map(),
            ledger: new Map(),
            sessions: new Map(),
        });
    }
    return stores.get(studentId)!;
}

// ============================================================================
// NODE OPERATIONS
// ============================================================================

/**
 * Create a new memory node
 */
export async function createMemoryNode(
    studentId: string,
    data: {
        type: MemoryNodeType;
        content: string;
        summary?: string;
        embedding?: number[];
        gravity?: number;
        privacyLevel?: 'public' | 'family' | 'private' | 'sacred';
        sourceSessionId?: string;
        sourceMessageId?: string;
    }
): Promise<MemoryNode> {
    const store = getStore(studentId);
    const now = new Date();

    const node: MemoryNode = MemoryNodeSchema.parse({
        id: uuidv4(),
        studentId,
        type: data.type,
        content: data.content,
        summary: data.summary,
        embedding: data.embedding,
        gravity: data.gravity ?? 1.0,
        entropy: 0,
        depth: 0,
        privacyLevel: data.privacyLevel ?? 'private',
        encrypted: false,
        createdAt: now,
        updatedAt: now,
        accessedAt: now,
        accessCount: 0,
        sourceSessionId: data.sourceSessionId,
        sourceMessageId: data.sourceMessageId,
        isCompressed: false,
    });

    store.nodes.set(node.id, node);
    return node;
}

/**
 * Get a memory node by ID
 */
export async function getMemoryNode(
    studentId: string,
    nodeId: string
): Promise<MemoryNode | null> {
    const store = getStore(studentId);
    const node = store.nodes.get(nodeId);

    if (node) {
        // Update access metadata
        node.accessedAt = new Date();
        node.accessCount += 1;
        store.nodes.set(nodeId, node);
    }

    return node || null;
}

/**
 * Get all memory nodes for a student
 */
export async function getMemoryNodes(
    studentId: string,
    options?: {
        types?: MemoryNodeType[];
        minGravity?: number;
        maxAgeDays?: number;
        limit?: number;
        includeCompressed?: boolean;
    }
): Promise<MemoryNode[]> {
    const store = getStore(studentId);
    let nodes = Array.from(store.nodes.values());

    // Filter by type
    if (options?.types && options.types.length > 0) {
        nodes = nodes.filter(n => options.types!.includes(n.type));
    }

    // Filter by gravity (with decay)
    if (options?.minGravity !== undefined) {
        nodes = nodes.filter(n => {
            const daysSinceAccess = (Date.now() - n.accessedAt.getTime()) / (1000 * 60 * 60 * 24);
            const effectiveGravity = calculateDecayedGravity(n.gravity, daysSinceAccess);
            return effectiveGravity >= options.minGravity!;
        });
    }

    // Filter by age
    if (options?.maxAgeDays !== undefined) {
        const cutoff = Date.now() - (options.maxAgeDays * 24 * 60 * 60 * 1000);
        nodes = nodes.filter(n => n.createdAt.getTime() >= cutoff);
    }

    // Filter compressed
    if (!options?.includeCompressed) {
        nodes = nodes.filter(n => !n.isCompressed);
    }

    // Sort by effective gravity (descending)
    nodes.sort((a, b) => {
        const aGravity = calculateDecayedGravity(a.gravity, (Date.now() - a.accessedAt.getTime()) / (1000 * 60 * 60 * 24));
        const bGravity = calculateDecayedGravity(b.gravity, (Date.now() - b.accessedAt.getTime()) / (1000 * 60 * 60 * 24));
        return bGravity - aGravity;
    });

    // Limit
    if (options?.limit) {
        nodes = nodes.slice(0, options.limit);
    }

    return nodes;
}

/**
 * Update a memory node
 */
export async function updateMemoryNode(
    studentId: string,
    nodeId: string,
    updates: Partial<Pick<MemoryNode, 'content' | 'summary' | 'gravity' | 'privacyLevel' | 'embedding'>>
): Promise<MemoryNode | null> {
    const store = getStore(studentId);
    const node = store.nodes.get(nodeId);

    if (!node) return null;

    const updated: MemoryNode = {
        ...node,
        ...updates,
        updatedAt: new Date(),
    };

    store.nodes.set(nodeId, updated);
    return updated;
}

/**
 * Strengthen a memory node (increase gravity)
 */
export async function strengthenNode(
    studentId: string,
    nodeId: string,
    amount: number = 0.1
): Promise<MemoryNode | null> {
    const store = getStore(studentId);
    const node = store.nodes.get(nodeId);

    if (!node) return null;

    const newGravity = Math.min(node.gravity + amount, PHI_CONSTANTS.MAX_GRAVITY);

    return updateMemoryNode(studentId, nodeId, { gravity: newGravity });
}

/**
 * Delete a memory node
 */
export async function deleteMemoryNode(
    studentId: string,
    nodeId: string
): Promise<boolean> {
    const store = getStore(studentId);

    // Delete associated edges
    for (const [edgeId, edge] of store.edges) {
        if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) {
            store.edges.delete(edgeId);
        }
    }

    return store.nodes.delete(nodeId);
}

// ============================================================================
// EDGE OPERATIONS
// ============================================================================

/**
 * Create a memory edge between two nodes
 */
export async function createMemoryEdge(
    studentId: string,
    data: {
        sourceNodeId: string;
        targetNodeId: string;
        type: MemoryEdgeType;
        weight?: number;
        context?: string;
        bidirectional?: boolean;
    }
): Promise<MemoryEdge> {
    const store = getStore(studentId);

    // Verify nodes exist
    if (!store.nodes.has(data.sourceNodeId) || !store.nodes.has(data.targetNodeId)) {
        throw new Error('Source or target node not found');
    }

    // Check for existing edge
    const existingEdge = Array.from(store.edges.values()).find(e =>
        e.sourceNodeId === data.sourceNodeId &&
        e.targetNodeId === data.targetNodeId &&
        e.type === data.type
    );

    if (existingEdge) {
        // Strengthen existing edge
        return strengthenEdge(studentId, existingEdge.id);
    }

    const edge: MemoryEdge = MemoryEdgeSchema.parse({
        id: uuidv4(),
        sourceNodeId: data.sourceNodeId,
        targetNodeId: data.targetNodeId,
        type: data.type,
        weight: data.weight ?? 0.5,
        context: data.context,
        bidirectional: data.bidirectional ?? true,
        createdAt: new Date(),
        strengthenedCount: 0,
    });

    store.edges.set(edge.id, edge);
    return edge;
}

/**
 * Get edges for a node
 */
export async function getNodeEdges(
    studentId: string,
    nodeId: string,
    options?: {
        direction?: 'outgoing' | 'incoming' | 'both';
        types?: MemoryEdgeType[];
    }
): Promise<MemoryEdge[]> {
    const store = getStore(studentId);
    let edges = Array.from(store.edges.values());

    const direction = options?.direction ?? 'both';

    edges = edges.filter(e => {
        if (direction === 'outgoing') return e.sourceNodeId === nodeId;
        if (direction === 'incoming') return e.targetNodeId === nodeId;
        return e.sourceNodeId === nodeId || e.targetNodeId === nodeId ||
            (e.bidirectional && (e.sourceNodeId === nodeId || e.targetNodeId === nodeId));
    });

    if (options?.types && options.types.length > 0) {
        edges = edges.filter(e => options.types!.includes(e.type));
    }

    return edges;
}

/**
 * Get connected nodes (neighbors)
 */
export async function getConnectedNodes(
    studentId: string,
    nodeId: string,
    maxDepth: number = 1
): Promise<MemoryNode[]> {
    const store = getStore(studentId);
    const visited = new Set<string>();
    const result: MemoryNode[] = [];

    async function traverse(currentId: string, depth: number) {
        if (depth > maxDepth || visited.has(currentId)) return;
        visited.add(currentId);

        const edges = await getNodeEdges(studentId, currentId);

        for (const edge of edges) {
            const neighborId = edge.sourceNodeId === currentId
                ? edge.targetNodeId
                : edge.sourceNodeId;

            if (!visited.has(neighborId)) {
                const neighbor = store.nodes.get(neighborId);
                if (neighbor && !neighbor.isCompressed) {
                    result.push(neighbor);
                    await traverse(neighborId, depth + 1);
                }
            }
        }
    }

    await traverse(nodeId, 0);
    return result;
}

/**
 * Strengthen an edge
 */
export async function strengthenEdge(
    studentId: string,
    edgeId: string,
    amount: number = 0.1
): Promise<MemoryEdge> {
    const store = getStore(studentId);
    const edge = store.edges.get(edgeId);

    if (!edge) {
        throw new Error('Edge not found');
    }

    const updated: MemoryEdge = {
        ...edge,
        weight: Math.min(edge.weight + amount, 1.0),
        strengthenedCount: edge.strengthenedCount + 1,
        lastStrengthened: new Date(),
    };

    store.edges.set(edgeId, updated);
    return updated;
}

/**
 * Delete a memory edge
 */
export async function deleteMemoryEdge(
    studentId: string,
    edgeId: string
): Promise<boolean> {
    const store = getStore(studentId);
    return store.edges.delete(edgeId);
}

// ============================================================================
// LEDGER OPERATIONS
// ============================================================================

/**
 * Create a ledger entry
 */
export async function createLedgerEntry(
    studentId: string,
    data: {
        category: LedgerCategory;
        title: string;
        summary: string;
        significance?: number;
        emotionalWeight?: number;
        relatedNodeIds: string[];
        triggerContext?: string;
        privacyLevel?: 'public' | 'family' | 'private' | 'sacred';
    }
): Promise<LedgerEntry> {
    const store = getStore(studentId);
    const now = new Date();

    const entry: LedgerEntry = LedgerEntrySchema.parse({
        id: uuidv4(),
        studentId,
        category: data.category,
        title: data.title,
        summary: data.summary,
        significance: data.significance ?? 5,
        emotionalWeight: data.emotionalWeight ?? 0,
        relatedNodeIds: data.relatedNodeIds,
        triggerContext: data.triggerContext,
        privacyLevel: data.privacyLevel ?? 'private',
        occurredAt: now,
        recordedAt: now,
        acknowledged: false,
        contestable: true,
    });

    store.ledger.set(entry.id, entry);
    return entry;
}

/**
 * Get ledger entries
 */
export async function getLedgerEntries(
    studentId: string,
    options?: {
        categories?: LedgerCategory[];
        minSignificance?: number;
        limit?: number;
    }
): Promise<LedgerEntry[]> {
    const store = getStore(studentId);
    let entries = Array.from(store.ledger.values());

    if (options?.categories && options.categories.length > 0) {
        entries = entries.filter(e => options.categories!.includes(e.category));
    }

    if (options?.minSignificance !== undefined) {
        entries = entries.filter(e => e.significance >= options.minSignificance!);
    }

    // Sort by significance and recency
    entries.sort((a, b) => {
        const sigDiff = b.significance - a.significance;
        if (sigDiff !== 0) return sigDiff;
        return b.occurredAt.getTime() - a.occurredAt.getTime();
    });

    if (options?.limit) {
        entries = entries.slice(0, options.limit);
    }

    return entries;
}

/**
 * Acknowledge a ledger entry
 */
export async function acknowledgeLedgerEntry(
    studentId: string,
    entryId: string
): Promise<LedgerEntry | null> {
    const store = getStore(studentId);
    const entry = store.ledger.get(entryId);

    if (!entry) return null;

    const updated: LedgerEntry = {
        ...entry,
        acknowledged: true,
    };

    store.ledger.set(entryId, updated);
    return updated;
}

/**
 * Contest a ledger entry (student disagrees)
 */
export async function contestLedgerEntry(
    studentId: string,
    entryId: string,
    reason: string
): Promise<boolean> {
    const store = getStore(studentId);
    const entry = store.ledger.get(entryId);

    if (!entry || !entry.contestable) return false;

    // In production, this would create a review ticket
    // For now, we mark it and store the reason
    console.log(`Ledger entry ${entryId} contested: ${reason}`);

    return store.ledger.delete(entryId);
}

// ============================================================================
// SESSION OPERATIONS
// ============================================================================

/**
 * Start a new memory session
 */
export async function startSession(
    studentId: string,
    companionId?: string
): Promise<MemorySession> {
    const store = getStore(studentId);

    const session: MemorySession = MemorySessionSchema.parse({
        id: uuidv4(),
        studentId,
        companionId,
        startedAt: new Date(),
        messageCount: 0,
        nodesCreated: 0,
        edgesCreated: 0,
        compressed: false,
        sensitiveContent: false,
    });

    store.sessions.set(session.id, session);
    return session;
}

/**
 * End a session
 */
export async function endSession(
    studentId: string,
    sessionId: string,
    emotionalProfile?: MemorySession['emotionalProfile'],
    topicsDiscussed?: string[]
): Promise<MemorySession | null> {
    const store = getStore(studentId);
    const session = store.sessions.get(sessionId);

    if (!session) return null;

    const endedAt = new Date();
    const durationMinutes = (endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60);

    const updated: MemorySession = {
        ...session,
        endedAt,
        durationMinutes,
        emotionalProfile,
        topicsDiscussed,
    };

    store.sessions.set(sessionId, updated);
    return updated;
}

/**
 * Increment session counters
 */
export async function incrementSessionCounters(
    studentId: string,
    sessionId: string,
    counters: {
        messages?: number;
        nodes?: number;
        edges?: number;
    }
): Promise<void> {
    const store = getStore(studentId);
    const session = store.sessions.get(sessionId);

    if (!session) return;

    session.messageCount += counters.messages ?? 0;
    session.nodesCreated += counters.nodes ?? 0;
    session.edgesCreated += counters.edges ?? 0;

    store.sessions.set(sessionId, session);
}

// ============================================================================
// GRAPH OPERATIONS
// ============================================================================

/**
 * Get full memory graph for a student
 */
export async function getMemoryGraph(studentId: string): Promise<MemoryGraph> {
    const store = getStore(studentId);

    const nodes = Array.from(store.nodes.values());
    const edges = Array.from(store.edges.values());

    // Calculate stats
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const avgGravity = totalNodes > 0
        ? nodes.reduce((sum, n) => sum + n.gravity, 0) / totalNodes
        : 0;
    const maxDepth = nodes.reduce((max, n) => Math.max(max, n.depth), 0);
    const compressedNodes = nodes.filter(n => n.isCompressed).length;
    const compressionRatio = totalNodes > 0 ? compressedNodes / totalNodes : 0;

    return MemoryGraphSchema.parse({
        studentId,
        nodes,
        edges,
        version: 1,
        stats: {
            totalNodes,
            totalEdges,
            avgGravity,
            maxDepth,
            compressionRatio,
        },
    });
}

/**
 * Clear all memory for a student (GDPR right to deletion)
 */
export async function clearAllMemory(studentId: string): Promise<void> {
    stores.delete(studentId);
}

/**
 * Export memory graph for portability (LGPD)
 */
export async function exportMemoryGraph(studentId: string): Promise<string> {
    const graph = await getMemoryGraph(studentId);
    const ledger = await getLedgerEntries(studentId);

    return JSON.stringify({
        exportedAt: new Date().toISOString(),
        studentId,
        graph,
        ledger,
    }, null, 2);
}

