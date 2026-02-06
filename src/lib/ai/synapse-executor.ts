/**
 * Synapse Tool Executor
 * 
 * Executes MCP tools for Synapse AI memory operations.
 * Each tool maps to the memory API routes.
 */

import { db } from '@/lib/db';
import { memoryGraphs, memoryNodes, memoryEdges, memoryLedger } from '@/lib/db/schema';
import { eq, and, desc, gte, sql, like, or } from 'drizzle-orm';
import {
    QueryMemoryInput,
    GetLedgerEntriesInput,
    CreateMemoryInput,
    CreateLedgerEntryInput,
    UpdateNodeGravityInput,
    QueryMemorySchema,
    GetLedgerEntriesSchema,
    CreateMemorySchema,
    CreateLedgerEntrySchema,
    UpdateNodeGravitySchema,
} from './synapse-tools';

// ============================================================================
// TOOL EXECUTION RESULTS
// ============================================================================

interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

export async function executeSynapseTool(
    toolName: string,
    input: Record<string, any>,
    userId: string,
    organizationId: string
): Promise<ToolResult> {
    try {
        // Get user's memory graph
        const graph = await db.query.memoryGraphs.findFirst({
            where: and(
                eq(memoryGraphs.studentId, userId),
                eq(memoryGraphs.organizationId, organizationId)
            ),
        });

        if (!graph && toolName !== 'get_memory_stats') {
            // Create graph if it doesn't exist (except for stats which can handle null)
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

            return executeSynapseTool(toolName, input, userId, organizationId);
        }

        switch (toolName) {
            case 'query_memory':
                return await executeQueryMemory(input, graph!);

            case 'get_ledger':
                return await executeGetLedger(input, graph!);

            case 'remember':
                return await executeRemember(input, graph!, userId);

            case 'add_to_ledger':
                return await executeAddToLedger(input, graph!, userId);

            case 'reinforce_memory':
                return await executeReinforceMemory(input, graph!);

            case 'get_memory_stats':
                return await executeGetMemoryStats(graph);

            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    } catch (error: any) {
        console.error(`Synapse tool error (${toolName}):`, error);
        return { success: false, error: error.message || 'Tool execution failed' };
    }
}

// ============================================================================
// QUERY MEMORY
// ============================================================================

async function executeQueryMemory(input: any, graph: any): Promise<ToolResult> {
    const validation = QueryMemorySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { query, modality, limit, minGravity } = validation.data;

    // Try to get embedding, but fall back to keyword search if unavailable
    let queryEmbedding: number[] | null = null;
    try {
        const { embed } = await import('@/lib/embeddings/gemini');
        queryEmbedding = await embed(query);
    } catch (err) {
        console.warn('Embedding failed, falling back to keyword search');
    }

    // Build conditions - note: schema doesn't have isDeleted, gravity can be null
    const conditions: any[] = [
        eq(memoryNodes.graphId, graph.id),
    ];

    if (modality !== 'all') {
        conditions.push(eq(memoryNodes.modality, modality as any));
    }

    const nodes = await db.select()
        .from(memoryNodes)
        .where(and(...conditions))
        .orderBy(desc(memoryNodes.gravity))
        .limit(100); // Get top 100 by gravity, then rank by similarity

    // Filter by minGravity in JS (since it can be null)
    const filteredNodes = nodes.filter(n => (n.gravity || 0) >= minGravity);

    if (filteredNodes.length === 0) {
        return {
            success: true,
            data: {
                memories: [],
                message: 'No memories found matching the criteria',
            },
        };
    }

    // If we have embeddings, calculate similarities
    let rankedNodes: typeof filteredNodes = filteredNodes;

    if (queryEmbedding) {
        const { cosineSimilarity } = await import('@/lib/embeddings/vector');

        const nodesWithScores = filteredNodes.map(node => {
            let nodeEmbedding: number[] | null = null;
            if (node.embedding) {
                try {
                    nodeEmbedding = typeof node.embedding === 'string'
                        ? JSON.parse(node.embedding)
                        : node.embedding;
                } catch {
                    nodeEmbedding = null;
                }
            }

            const similarity = nodeEmbedding
                ? cosineSimilarity(queryEmbedding, nodeEmbedding)
                : 0;

            // Combined score: 70% similarity + 30% gravity
            const score = (similarity * 0.7) + ((node.gravity || 0) * 0.3);

            return { node, similarity, score };
        });

        rankedNodes = nodesWithScores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(r => r.node);
    } else {
        // Keyword-based fallback
        const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

        const scoredNodes = filteredNodes.map(node => {
            const content = node.content.toLowerCase();
            const matchCount = keywords.filter(k => content.includes(k)).length;
            return { node, score: matchCount };
        });

        rankedNodes = scoredNodes
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(r => r.node);
    }

    // Update access timestamps
    const nodeIds = rankedNodes.map(n => n.id);
    if (nodeIds.length > 0) {
        const now = Math.floor(Date.now() / 1000);
        for (const nodeId of nodeIds) {
            await db.update(memoryNodes)
                .set({ lastAccessed: now })
                .where(eq(memoryNodes.id, nodeId));
        }
    }

    return {
        success: true,
        data: {
            memories: rankedNodes.map(node => ({
                id: node.id,
                content: node.content,
                modality: node.modality,
                gravity: node.gravity || 0,
                createdAt: node.createdAt,
            })),
            count: rankedNodes.length,
        },
    };
}

// ============================================================================
// GET LEDGER
// ============================================================================

async function executeGetLedger(input: any, graph: any): Promise<ToolResult> {
    const validation = GetLedgerEntriesSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { category, limit } = validation.data;

    const conditions: any[] = [
        eq(memoryLedger.graphId, graph.id),
        eq(memoryLedger.isActive, 1), // SQLite uses 1/0 for boolean
    ];

    // Map our category to schema category if different
    const categoryMap: Record<string, string> = {
        'goal': 'fact', // Map goal to fact (schema doesn't have goal)
        'preference': 'observation', // Map preference to observation
    };

    if (category !== 'all') {
        const schemaCategory = categoryMap[category] || category;
        conditions.push(eq(memoryLedger.category, schemaCategory as any));
    }

    const entries = await db.select()
        .from(memoryLedger)
        .where(and(...conditions))
        .orderBy(desc(memoryLedger.importance), desc(memoryLedger.createdAt))
        .limit(limit);

    return {
        success: true,
        data: {
            entries: entries.map(entry => ({
                id: entry.id,
                category: entry.category,
                content: entry.content,
                importance: entry.importance || 0,
                triggers: entry.triggers ? JSON.parse(entry.triggers) : [],
                createdAt: entry.createdAt,
                sourceType: entry.sourceType,
            })),
            count: entries.length,
        },
    };
}

// ============================================================================
// REMEMBER (Create Memory Node)
// ============================================================================

async function executeRemember(input: any, graph: any, userId: string): Promise<ToolResult> {
    const validation = CreateMemorySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { content, modality, gravity } = validation.data;

    // Generate embedding
    let embedding: number[] | null = null;
    try {
        const { embed } = await import('@/lib/embeddings/gemini');
        embedding = await embed(content);
    } catch (err) {
        console.warn('Failed to generate embedding for memory:', err);
    }

    // Create content hash
    const contentHash = await createContentHash(content);

    const now = Math.floor(Date.now() / 1000);

    await db.insert(memoryNodes).values({
        graphId: graph.id,
        content,
        contentHash,
        modality,
        gravity,
        salience: gravity,
        confidence: 1.0,
        embedding: embedding ? JSON.stringify(embedding) : null,
        timestamp: now,
        sourceType: 'chat',
        createdAt: now,
    });

    // Update graph stats
    await db.update(memoryGraphs)
        .set({
            nodeCount: sql`${memoryGraphs.nodeCount} + 1`,
            updatedAt: now,
            lastAccessed: now,
        })
        .where(eq(memoryGraphs.id, graph.id));

    return {
        success: true,
        data: {
            content: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
            modality,
            gravity,
            message: `Memory stored successfully`,
        },
    };
}

// Helper to create content hash
async function createContentHash(content: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: simple hash (not crypto-secure but works)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// ============================================================================
// ADD TO LEDGER
// ============================================================================

async function executeAddToLedger(input: any, graph: any, userId: string): Promise<ToolResult> {
    const validation = CreateLedgerEntrySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { category, content, importance, triggers } = validation.data;

    // Map our category to schema category
    const categoryMap: Record<string, 'promise' | 'secret' | 'debt' | 'threat' | 'fact' | 'instruction' | 'observation'> = {
        'goal': 'fact',
        'preference': 'observation',
        'promise': 'promise',
        'secret': 'secret',
        'debt': 'debt',
        'threat': 'threat',
    };

    const schemaCategory = categoryMap[category] || 'observation';
    const now = Math.floor(Date.now() / 1000);

    await db.insert(memoryLedger).values({
        graphId: graph.id,
        category: schemaCategory,
        content,
        importance: importance / 10, // Convert 1-10 to 0-1
        triggers: JSON.stringify(triggers),
        sourceType: 'synapse',
        isActive: 1,
        createdAt: now,
    });

    return {
        success: true,
        data: {
            category: schemaCategory,
            importance,
            message: `Critical fact added to ledger: ${category}`,
        },
    };
}

// ============================================================================
// REINFORCE MEMORY
// ============================================================================

async function executeReinforceMemory(input: any, graph: any): Promise<ToolResult> {
    const validation = UpdateNodeGravitySchema.safeParse(input);
    if (!validation.success) {
        return { success: false, error: 'Invalid input: ' + JSON.stringify(validation.error.flatten()) };
    }

    const { nodeId, delta, reason } = validation.data;

    // Get current node
    const node = await db.query.memoryNodes.findFirst({
        where: and(
            eq(memoryNodes.id, nodeId),
            eq(memoryNodes.graphId, graph.id)
        ),
    });

    if (!node) {
        return { success: false, error: 'Memory node not found' };
    }

    // Calculate new gravity (clamped 0-1)
    const currentGravity = node.gravity || 0;
    const newGravity = Math.max(0, Math.min(1, currentGravity + delta));
    const now = Math.floor(Date.now() / 1000);

    await db.update(memoryNodes)
        .set({
            gravity: newGravity,
            lastAccessed: now,
        })
        .where(eq(memoryNodes.id, nodeId));

    return {
        success: true,
        data: {
            nodeId,
            previousGravity: currentGravity,
            newGravity,
            delta,
            reason,
        },
    };
}

// ============================================================================
// GET MEMORY STATS
// ============================================================================

async function executeGetMemoryStats(graph: any | null): Promise<ToolResult> {
    if (!graph) {
        return {
            success: true,
            data: {
                exists: false,
                message: 'No memory graph exists yet',
            },
        };
    }

    // Get node counts by modality
    const nodeStats = await db.select({
        modality: memoryNodes.modality,
        count: sql<number>`count(*)`,
        avgGravity: sql<number>`avg(${memoryNodes.gravity})`,
    })
        .from(memoryNodes)
        .where(eq(memoryNodes.graphId, graph.id))
        .groupBy(memoryNodes.modality);

    // Get ledger stats
    const ledgerStats = await db.select({
        category: memoryLedger.category,
        count: sql<number>`count(*)`,
    })
        .from(memoryLedger)
        .where(and(
            eq(memoryLedger.graphId, graph.id),
            eq(memoryLedger.isActive, 1)
        ))
        .groupBy(memoryLedger.category);

    // Total edges
    const edgeCount = await db.select({ count: sql<number>`count(*)` })
        .from(memoryEdges)
        .where(eq(memoryEdges.graphId, graph.id));

    return {
        success: true,
        data: {
            exists: true,
            graphId: graph.id,
            snr: graph.snr,
            compressionPasses: graph.compressionPasses,
            nodes: {
                total: graph.nodeCount || 0,
                byModality: Object.fromEntries(
                    nodeStats.map(s => [s.modality, { count: s.count, avgGravity: Math.round((s.avgGravity || 0) * 100) / 100 }])
                ),
            },
            edges: {
                total: edgeCount[0]?.count || 0,
            },
            ledger: {
                total: ledgerStats.reduce((sum, s) => sum + s.count, 0),
                byCategory: Object.fromEntries(
                    ledgerStats.map(s => [s.category, s.count])
                ),
            },
            lastAccessed: graph.lastAccessed,
            createdAt: graph.createdAt,
        },
    };
}

