/**
 * Synapse Tool Executor v2
 * 
 * Enhanced executor that bridges the legacy Synapse system with the new
 * Memory Topology system (D4). Supports both database-backed persistence
 * and the in-memory topology graph.
 */

import { db } from '@/lib/db';
import { memoryGraphs, memoryNodes, memoryEdges, memoryLedger } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
    QueryMemorySchema,
    GetLedgerEntriesSchema,
    CreateMemorySchema,
    CreateLedgerEntrySchema,
    UpdateNodeGravitySchema,
} from './synapse-tools';

// Import Memory Topology system
import {
    getMemoryNodes,
    createMemoryNode,
    strengthenNode,
    getLedgerEntries,
    createLedgerEntry,
    getMemoryGraph,
    getWorldOverlay,
    buildContext,
    formMemory,
    evaluateForLedger,
    PHI_CONSTANTS,
} from './index';

// ============================================================================
// TYPES
// ============================================================================

interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

// ============================================================================
// UNIFIED TOOL EXECUTOR
// ============================================================================

export async function executeSynapseToolV2(
    toolName: string,
    input: Record<string, any>,
    userId: string,
    organizationId: string,
    options?: {
        useTopology?: boolean;  // Use new Memory Topology system
        sessionId?: string;     // Current conversation session
    }
): Promise<ToolResult> {
    const useTopology = options?.useTopology ?? true; // Default to new system

    try {
        switch (toolName) {
            case 'query_memory':
            case 'query_memories':
                return useTopology
                    ? await executeQueryMemoryTopology(input, userId, organizationId)
                    : await executeQueryMemoryLegacy(input, userId, organizationId);

            case 'get_ledger':
                return useTopology
                    ? await executeGetLedgerTopology(input, userId)
                    : await executeGetLedgerLegacy(input, userId, organizationId);

            case 'remember':
                return useTopology
                    ? await executeRememberTopology(input, userId, options?.sessionId)
                    : await executeRememberLegacy(input, userId, organizationId);

            case 'add_to_ledger':
            case 'add_ledger_entry':
                return useTopology
                    ? await executeAddToLedgerTopology(input, userId)
                    : await executeAddToLedgerLegacy(input, userId, organizationId);

            case 'reinforce_memory':
                return useTopology
                    ? await executeReinforceMemoryTopology(input, userId)
                    : await executeReinforceMemoryLegacy(input, userId, organizationId);

            case 'get_memory_stats':
                return useTopology
                    ? await executeGetMemoryStatsTopology(userId)
                    : await executeGetMemoryStatsLegacy(userId, organizationId);

            case 'get_world_overlay':
                return await executeGetWorldOverlayTool(userId);

            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    } catch (error: any) {
        console.error(`Synapse tool error (${toolName}):`, error);
        return { success: false, error: error.message || 'Tool execution failed' };
    }
}

// ============================================================================
// TOPOLOGY-BASED IMPLEMENTATIONS (New D4 System)
// ============================================================================

async function executeQueryMemoryTopology(
    input: any,
    userId: string,
    organizationId: string
): Promise<ToolResult> {
    const validation = QueryMemorySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { query, modality, limit, minGravity } = validation.data;

    // Map legacy modality to new types
    const modalityToTypes: Record<string, string[]> = {
        'episodic': ['experience'],
        'semantic': ['fact', 'belief'],
        'procedural': ['learning'],
        'emotional': ['emotion'],
        'sensory': ['preference'],
        'all': [],
    };

    const types = modality !== 'all' ? modalityToTypes[modality] || [] : undefined;

    // Try to get embedding for query
    let queryEmbedding: number[] | undefined;
    try {
        const { embed } = await import('@/lib/embeddings/gemini');
        queryEmbedding = await embed(query);
    } catch (err) {
        console.warn('Embedding failed, using gravity-based retrieval');
    }

    // Use context builder for semantic search
    const contextResponse = await buildContext({
        studentId: userId,
        currentMessage: query,
        currentEmbedding: queryEmbedding,
        maxNodes: limit,
        minGravity: minGravity * PHI_CONSTANTS.MAX_GRAVITY, // Scale 0-1 to 0-10
        includeLedger: false,
        maxLedgerEntries: 0,
        includeTypes: types as any,
    });

    return {
        success: true,
        data: {
            memories: contextResponse.memories.map(m => ({
                id: m.node.id,
                content: m.node.summary || m.node.content,
                modality: legacyModalityFromType(m.node.type),
                type: m.node.type,
                gravity: m.node.gravity / PHI_CONSTANTS.MAX_GRAVITY, // Normalize to 0-1
                relevance: m.relevanceScore,
                createdAt: m.node.createdAt,
            })),
            count: contextResponse.memories.length,
            searchStats: contextResponse.stats,
        },
    };
}

async function executeGetLedgerTopology(
    input: any,
    userId: string
): Promise<ToolResult> {
    const validation = GetLedgerEntriesSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { category, limit } = validation.data;

    // Map legacy categories to new ones
    const categoryMap: Record<string, string[]> = {
        'promise': ['promise'],
        'secret': ['confession'],
        'debt': ['conflict'],
        'threat': ['fear'],
        'goal': ['dream', 'milestone'],
        'preference': ['breakthrough', 'growth'],
        'all': [],
    };

    const categories = category !== 'all' ? categoryMap[category] || [] : undefined;

    const entries = await getLedgerEntries(userId, {
        categories: categories as any,
        limit,
        minSignificance: 5,
    });

    return {
        success: true,
        data: {
            entries: entries.map(e => ({
                id: e.id,
                category: legacyCategoryFromNew(e.category),
                content: e.summary,
                title: e.title,
                importance: e.significance,
                createdAt: e.recordedAt,
            })),
            count: entries.length,
        },
    };
}

async function executeRememberTopology(
    input: any,
    userId: string,
    sessionId?: string
): Promise<ToolResult> {
    const validation = CreateMemorySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { content, modality, gravity, tags } = validation.data;

    // Map legacy modality to new type
    const modalityToType: Record<string, string> = {
        'episodic': 'experience',
        'semantic': 'fact',
        'procedural': 'learning',
        'emotional': 'emotion',
        'sensory': 'preference',
    };

    const type = modalityToType[modality] || 'fact';

    // Get embedding
    let embedding: number[] | undefined;
    try {
        const { embed } = await import('@/lib/embeddings/gemini');
        embedding = await embed(content);
    } catch (err) {
        console.warn('Failed to generate embedding');
    }

    const node = await createMemoryNode(userId, {
        type: type as any,
        content,
        gravity: gravity * PHI_CONSTANTS.MAX_GRAVITY, // Scale 0-1 to 0-10
        privacyLevel: 'private',
        embedding,
        sourceSessionId: sessionId,
    });

    // Check if this is ledger-worthy
    const ledgerEval = await evaluateForLedger(userId, content, {
        emotionalIntensity: gravity,
        topicSignificance: gravity,
        isFirstMention: true,
    });

    if (ledgerEval.isLedgerWorthy) {
        await createLedgerEntry(userId, {
            category: ledgerEval.suggestedCategory as any || 'growth',
            title: content.substring(0, 50),
            summary: content,
            significance: ledgerEval.suggestedSignificance || 5,
            relatedNodeIds: [node.id],
        });
    }

    return {
        success: true,
        data: {
            id: node.id,
            content: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
            modality,
            type,
            gravity,
            message: 'Memory stored successfully',
            ledgerCreated: ledgerEval.isLedgerWorthy,
        },
    };
}

async function executeAddToLedgerTopology(
    input: any,
    userId: string
): Promise<ToolResult> {
    const validation = CreateLedgerEntrySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { category, content, importance, triggers } = validation.data;

    // Map legacy categories to new ones
    const categoryMap: Record<string, string> = {
        'promise': 'promise',
        'secret': 'confession',
        'debt': 'conflict',
        'threat': 'fear',
        'goal': 'dream',
        'preference': 'breakthrough',
    };

    const newCategory = categoryMap[category] || 'growth';

    const entry = await createLedgerEntry(userId, {
        category: newCategory as any,
        title: content.substring(0, 50),
        summary: content,
        significance: importance,
        emotionalWeight: 0,
        relatedNodeIds: [],
        triggerContext: triggers.join(', '),
    });

    return {
        success: true,
        data: {
            id: entry.id,
            category: newCategory,
            title: entry.title,
            importance,
            message: `Critical fact added to ledger: ${category}`,
        },
    };
}

async function executeReinforceMemoryTopology(
    input: any,
    userId: string
): Promise<ToolResult> {
    const validation = UpdateNodeGravitySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { nodeId, delta, reason } = validation.data;

    // Scale delta from 0-1 range to 0-10 range
    const scaledDelta = delta * PHI_CONSTANTS.MAX_GRAVITY;

    const node = await strengthenNode(userId, nodeId, scaledDelta);

    if (!node) {
        return { success: false, error: 'Memory node not found' };
    }

    return {
        success: true,
        data: {
            nodeId,
            newGravity: node.gravity / PHI_CONSTANTS.MAX_GRAVITY, // Normalize back to 0-1
            delta,
            reason,
            message: delta > 0 ? 'Memory reinforced' : 'Memory weakened',
        },
    };
}

async function executeGetMemoryStatsTopology(userId: string): Promise<ToolResult> {
    const graph = await getMemoryGraph(userId);

    // Group nodes by type
    const nodesByType: Record<string, number> = {};
    for (const node of graph.nodes) {
        nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    return {
        success: true,
        data: {
            exists: true,
            nodes: {
                total: graph.stats?.totalNodes ?? 0,
                byType: nodesByType,
                avgGravity: (graph.stats?.avgGravity ?? 0) / PHI_CONSTANTS.MAX_GRAVITY,
            },
            edges: {
                total: graph.stats?.totalEdges ?? 0,
            },
            compression: {
                ratio: graph.stats?.compressionRatio ?? 0,
                lastCompressed: graph.lastCompressed,
            },
            version: graph.version,
        },
    };
}

async function executeGetWorldOverlayTool(userId: string): Promise<ToolResult> {
    const overlay = await getWorldOverlay(userId);

    return {
        success: true,
        data: {
            knownFacts: overlay.knownFacts,
            currentBeliefs: overlay.currentBeliefs,
            activeGoals: overlay.activeGoals,
            significantPeople: overlay.significantPeople,
            emotionalState: overlay.emotionalState,
            recentTopics: overlay.recentTopics,
        },
    };
}

// ============================================================================
// LEGACY DB IMPLEMENTATIONS (For backwards compatibility)
// ============================================================================

async function executeQueryMemoryLegacy(
    input: any,
    userId: string,
    organizationId: string
): Promise<ToolResult> {
    // Get or create graph
    let graph = await db.query.memoryGraphs.findFirst({
        where: and(
            eq(memoryGraphs.studentId, userId),
            eq(memoryGraphs.organizationId, organizationId)
        ),
    });

    if (!graph) {
        return { success: true, data: { memories: [], count: 0 } };
    }

    const validation = QueryMemorySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input' };
    }

    const { query, modality, limit, minGravity } = validation.data;

    const conditions: any[] = [eq(memoryNodes.graphId, graph.id)];
    if (modality !== 'all') {
        conditions.push(eq(memoryNodes.modality, modality as any));
    }

    const nodes = await db.select()
        .from(memoryNodes)
        .where(and(...conditions))
        .orderBy(desc(memoryNodes.gravity))
        .limit(limit);

    return {
        success: true,
        data: {
            memories: nodes.map(n => ({
                id: n.id,
                content: n.content,
                modality: n.modality,
                gravity: n.gravity || 0,
                createdAt: n.createdAt,
            })),
            count: nodes.length,
        },
    };
}

async function executeGetLedgerLegacy(
    input: any,
    userId: string,
    organizationId: string
): Promise<ToolResult> {
    let graph = await db.query.memoryGraphs.findFirst({
        where: and(
            eq(memoryGraphs.studentId, userId),
            eq(memoryGraphs.organizationId, organizationId)
        ),
    });

    if (!graph) {
        return { success: true, data: { entries: [], count: 0 } };
    }

    const validation = GetLedgerEntriesSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input' };
    }

    const { category, limit } = validation.data;

    const conditions: any[] = [
        eq(memoryLedger.graphId, graph.id),
        eq(memoryLedger.isActive, 1),
    ];

    if (category !== 'all') {
        conditions.push(eq(memoryLedger.category, category as any));
    }

    const entries = await db.select()
        .from(memoryLedger)
        .where(and(...conditions))
        .orderBy(desc(memoryLedger.importance))
        .limit(limit);

    return {
        success: true,
        data: {
            entries: entries.map(e => ({
                id: e.id,
                category: e.category,
                content: e.content,
                importance: e.importance,
                createdAt: e.createdAt,
            })),
            count: entries.length,
        },
    };
}

async function executeRememberLegacy(
    input: any,
    userId: string,
    organizationId: string
): Promise<ToolResult> {
    // Get or create graph
    let graph = await db.query.memoryGraphs.findFirst({
        where: and(
            eq(memoryGraphs.studentId, userId),
            eq(memoryGraphs.organizationId, organizationId)
        ),
    });

    if (!graph) {
        const now = Math.floor(Date.now() / 1000);
        const [newGraph] = await db.insert(memoryGraphs).values({
            studentId: userId,
            organizationId,
            snr: 1,
            compressionPasses: 0,
            lossVector: '[]',
            nodeCount: 0,
            edgeCount: 0,
            version: 1,
            createdAt: now,
            updatedAt: now,
            lastAccessed: now,
        }).returning();
        graph = newGraph;
    }

    const validation = CreateMemorySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input' };
    }

    const { content, modality, gravity } = validation.data;
    const now = Math.floor(Date.now() / 1000);

    // Get embedding
    let embedding: string | null = null;
    try {
        const { embed } = await import('@/lib/embeddings/gemini');
        const emb = await embed(content);
        embedding = JSON.stringify(emb);
    } catch (err) {
        console.warn('Embedding failed');
    }

    await db.insert(memoryNodes).values({
        graphId: graph.id,
        content,
        contentHash: content.length.toString(),
        modality,
        gravity,
        salience: gravity,
        confidence: 1.0,
        embedding,
        timestamp: now,
        sourceType: 'chat',
        createdAt: now,
    });

    await db.update(memoryGraphs)
        .set({
            nodeCount: sql`${memoryGraphs.nodeCount} + 1`,
            updatedAt: now,
        })
        .where(eq(memoryGraphs.id, graph.id));

    return {
        success: true,
        data: {
            content: content.slice(0, 100),
            modality,
            gravity,
            message: 'Memory stored',
        },
    };
}

async function executeAddToLedgerLegacy(
    input: any,
    userId: string,
    organizationId: string
): Promise<ToolResult> {
    let graph = await db.query.memoryGraphs.findFirst({
        where: and(
            eq(memoryGraphs.studentId, userId),
            eq(memoryGraphs.organizationId, organizationId)
        ),
    });

    if (!graph) {
        return { success: false, error: 'No memory graph exists' };
    }

    const validation = CreateLedgerEntrySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input' };
    }

    const { category, content, importance, triggers } = validation.data;
    const now = Math.floor(Date.now() / 1000);

    await db.insert(memoryLedger).values({
        graphId: graph.id,
        category: category as any,
        content,
        importance: importance / 10,
        triggers: JSON.stringify(triggers),
        sourceType: 'synapse',
        isActive: 1,
        createdAt: now,
    });

    return {
        success: true,
        data: {
            category,
            importance,
            message: `Added to ledger: ${category}`,
        },
    };
}

async function executeReinforceMemoryLegacy(
    input: any,
    userId: string,
    organizationId: string
): Promise<ToolResult> {
    let graph = await db.query.memoryGraphs.findFirst({
        where: and(
            eq(memoryGraphs.studentId, userId),
            eq(memoryGraphs.organizationId, organizationId)
        ),
    });

    if (!graph) {
        return { success: false, error: 'No memory graph exists' };
    }

    const validation = UpdateNodeGravitySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input' };
    }

    const { nodeId, delta } = validation.data;

    const node = await db.query.memoryNodes.findFirst({
        where: and(
            eq(memoryNodes.id, nodeId),
            eq(memoryNodes.graphId, graph.id)
        ),
    });

    if (!node) {
        return { success: false, error: 'Node not found' };
    }

    const currentGravity = node.gravity || 0;
    const newGravity = Math.max(0, Math.min(1, currentGravity + delta));

    await db.update(memoryNodes)
        .set({ gravity: newGravity })
        .where(eq(memoryNodes.id, nodeId));

    return {
        success: true,
        data: {
            nodeId,
            previousGravity: currentGravity,
            newGravity,
            delta,
        },
    };
}

async function executeGetMemoryStatsLegacy(
    userId: string,
    organizationId: string
): Promise<ToolResult> {
    const graph = await db.query.memoryGraphs.findFirst({
        where: and(
            eq(memoryGraphs.studentId, userId),
            eq(memoryGraphs.organizationId, organizationId)
        ),
    });

    if (!graph) {
        return { success: true, data: { exists: false } };
    }

    const nodeStats = await db.select({
        modality: memoryNodes.modality,
        count: sql<number>`count(*)`,
        avgGravity: sql<number>`avg(${memoryNodes.gravity})`,
    })
        .from(memoryNodes)
        .where(eq(memoryNodes.graphId, graph.id))
        .groupBy(memoryNodes.modality);

    const ledgerCount = await db.select({ count: sql<number>`count(*)` })
        .from(memoryLedger)
        .where(and(
            eq(memoryLedger.graphId, graph.id),
            eq(memoryLedger.isActive, 1)
        ));

    return {
        success: true,
        data: {
            exists: true,
            graphId: graph.id,
            nodes: {
                total: graph.nodeCount || 0,
                byModality: Object.fromEntries(
                    nodeStats.map(s => [s.modality, { count: s.count, avgGravity: s.avgGravity }])
                ),
            },
            edges: { total: graph.edgeCount || 0 },
            ledger: { total: ledgerCount[0]?.count || 0 },
            compressionPasses: graph.compressionPasses,
        },
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function legacyModalityFromType(type: string): string {
    const typeToModality: Record<string, string> = {
        'experience': 'episodic',
        'fact': 'semantic',
        'belief': 'semantic',
        'learning': 'procedural',
        'emotion': 'emotional',
        'preference': 'sensory',
        'goal': 'semantic',
        'relationship': 'semantic',
        'confession': 'emotional',
        'meta': 'semantic',
    };
    return typeToModality[type] || 'semantic';
}

function legacyCategoryFromNew(category: string): string {
    const categoryMap: Record<string, string> = {
        'promise': 'promise',
        'confession': 'secret',
        'conflict': 'debt',
        'fear': 'threat',
        'dream': 'goal',
        'milestone': 'goal',
        'breakthrough': 'preference',
        'growth': 'preference',
        'relationship': 'observation',
        'resolution': 'observation',
    };
    return categoryMap[category] || 'observation';
}

// ============================================================================
// RE-EXPORT ORIGINAL FOR BACKWARDS COMPATIBILITY
// ============================================================================

export { executeSynapseTool } from './synapse-executor';

