/**
 * MCP Memory Bridge
 * 
 * Bridges the new Memory Topology system (D4) with the MCP/Synapse tools.
 * Provides a unified interface for AI companions to access student memories.
 * 
 * This integrates:
 * - In-memory graph storage (development/fast access)
 * - Database persistence (production/durability)
 * - MCP tool execution
 * - Context injection for prompts
 */

import { db } from '@/lib/db';
import { memoryGraphs, memoryNodes, memoryEdges, memoryLedger } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Import the new memory topology system
import {
    // Types
    type MemoryNode,
    type MemoryEdge,
    type LedgerEntry,
    type MemoryGraph,
    type ContextRequest,
    type ContextResponse,
    PHI_CONSTANTS,

    // Operations
    createMemoryNode,
    getMemoryNodes,
    strengthenNode,
    deleteMemoryNode,
    createMemoryEdge,
    getConnectedNodes,
    createLedgerEntry,
    getLedgerEntries,
    getMemoryGraph,
    startSession,
    endSession,

    // Context
    buildContext,
    formMemory,
    evaluateForLedger,
    getWorldOverlay,

    // Compression
    runCompression,
    endOfSessionCompression,
} from './index';

// ============================================================================
// MCP TOOL DEFINITIONS (Enhanced with Memory Topology)
// ============================================================================

export const MEMORY_MCP_TOOLS = [
    {
        name: 'query_memories',
        description: `Search the student's memory graph using semantic similarity. Returns memories most relevant to the query, weighted by gravity (importance) and recency.`,
        input_schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Natural language query to search memories',
                },
                types: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['fact', 'belief', 'experience', 'emotion', 'preference', 'goal', 'relationship', 'learning', 'confession', 'meta'],
                    },
                    description: 'Filter by memory types (optional)',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum memories to return (1-20)',
                    default: 10,
                },
                minGravity: {
                    type: 'number',
                    description: 'Minimum importance threshold (0-10)',
                    default: PHI_CONSTANTS.NOISE_FLOOR,
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'remember',
        description: `Store a new memory about the student. Choose the appropriate type and gravity based on importance.`,
        input_schema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The memory content to store',
                },
                type: {
                    type: 'string',
                    enum: ['fact', 'belief', 'experience', 'emotion', 'preference', 'goal', 'relationship', 'learning', 'confession', 'meta'],
                    description: 'Memory type: fact=concrete info, belief=opinions, experience=events, emotion=feelings, preference=likes/dislikes, goal=aspirations, relationship=people, learning=academic, confession=private, meta=self-reference',
                },
                gravity: {
                    type: 'number',
                    description: 'Importance weight (0-10). Use 7+ for important, 3-6 for context, <3 for minor',
                    default: 5,
                },
                privacyLevel: {
                    type: 'string',
                    enum: ['public', 'family', 'private', 'sacred'],
                    description: 'Privacy: public=anyone, family=parents only, private=student only, sacred=encrypted',
                    default: 'private',
                },
            },
            required: ['content', 'type'],
        },
    },
    {
        name: 'get_ledger',
        description: `Retrieve significant events from the student's ledger. The ledger contains milestones, breakthroughs, confessions, promises, dreams, fears, and growth moments.`,
        input_schema: {
            type: 'object',
            properties: {
                categories: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['milestone', 'breakthrough', 'confession', 'promise', 'dream', 'fear', 'relationship', 'conflict', 'resolution', 'growth'],
                    },
                    description: 'Filter by categories (optional)',
                },
                minSignificance: {
                    type: 'number',
                    description: 'Minimum significance level (1-10)',
                    default: 5,
                },
                limit: {
                    type: 'number',
                    description: 'Maximum entries to return',
                    default: 10,
                },
            },
            required: [],
        },
    },
    {
        name: 'add_ledger_entry',
        description: `Add a significant event to the student's ledger. Only use for truly important moments: milestones, breakthroughs, confessions, promises, dreams, fears, or growth.`,
        input_schema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['milestone', 'breakthrough', 'confession', 'promise', 'dream', 'fear', 'relationship', 'conflict', 'resolution', 'growth'],
                    description: 'Type of significant event',
                },
                title: {
                    type: 'string',
                    description: 'Short title (max 100 chars)',
                },
                summary: {
                    type: 'string',
                    description: 'Detailed summary (max 500 chars)',
                },
                significance: {
                    type: 'number',
                    description: 'Importance level 1-10',
                    default: 5,
                },
                emotionalWeight: {
                    type: 'number',
                    description: 'Emotional valence: -1 (negative) to 1 (positive)',
                    default: 0,
                },
            },
            required: ['category', 'title', 'summary'],
        },
    },
    {
        name: 'reinforce_memory',
        description: `Strengthen or weaken a memory's importance based on its relevance.`,
        input_schema: {
            type: 'object',
            properties: {
                nodeId: {
                    type: 'string',
                    description: 'The memory node ID to adjust',
                },
                amount: {
                    type: 'number',
                    description: 'Gravity adjustment: positive to strengthen, negative to weaken (-1 to +1)',
                },
            },
            required: ['nodeId', 'amount'],
        },
    },
    {
        name: 'get_world_overlay',
        description: `Get a summary of what you currently know about the student: facts, beliefs, goals, relationships, and emotional state.`,
        input_schema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'get_memory_stats',
        description: `Get statistics about the student's memory graph: node count, average gravity, compression status.`,
        input_schema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
];

// ============================================================================
// MCP TOOL EXECUTOR
// ============================================================================

export interface MCPToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Execute an MCP memory tool
 */
export async function executeMemoryTool(
    toolName: string,
    input: Record<string, any>,
    studentId: string,
    sessionId?: string
): Promise<MCPToolResult> {
    try {
        switch (toolName) {
            case 'query_memories':
                return await executeQueryMemories(studentId, {
                    query: input.query as string,
                    types: input.types as string[] | undefined,
                    limit: input.limit as number | undefined,
                    minGravity: input.minGravity as number | undefined,
                });

            case 'remember':
                return await executeRemember(studentId, {
                    content: input.content as string,
                    type: input.type as string,
                    gravity: input.gravity as number | undefined,
                    privacyLevel: input.privacyLevel as string | undefined,
                }, sessionId);

            case 'get_ledger':
                return await executeGetLedger(studentId, {
                    categories: input.categories as string[] | undefined,
                    minSignificance: input.minSignificance as number | undefined,
                    limit: input.limit as number | undefined,
                });

            case 'add_ledger_entry':
                return await executeAddLedgerEntry(studentId, {
                    category: input.category as string,
                    title: input.title as string,
                    summary: input.summary as string,
                    significance: input.significance as number | undefined,
                    emotionalWeight: input.emotionalWeight as number | undefined,
                });

            case 'reinforce_memory':
                return await executeReinforceMemory(studentId, {
                    nodeId: input.nodeId as string,
                    amount: input.amount as number,
                });

            case 'get_world_overlay':
                return await executeGetWorldOverlay(studentId);

            case 'get_memory_stats':
                return await executeGetMemoryStats(studentId);

            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    } catch (error: any) {
        console.error(`MCP Memory Tool Error (${toolName}):`, error);
        return { success: false, error: error.message || 'Tool execution failed' };
    }
}

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

async function executeQueryMemories(
    studentId: string,
    input: { query: string; types?: string[]; limit?: number; minGravity?: number }
): Promise<MCPToolResult> {
    const limit = input.limit ?? 10;
    const minGravity = input.minGravity ?? PHI_CONSTANTS.NOISE_FLOOR;

    // Get embedding for query
    let queryEmbedding: number[] | undefined;
    try {
        const { embed } = await import('@/lib/embeddings/gemini');
        queryEmbedding = await embed(input.query);
    } catch (err) {
        console.warn('Embedding failed, using gravity-based retrieval');
    }

    // Build context with the query
    const contextResponse = await buildContext({
        studentId,
        currentMessage: input.query,
        currentEmbedding: queryEmbedding,
        maxNodes: limit,
        minGravity,
        includeLedger: false,
        maxLedgerEntries: 0,
        includeTypes: input.types as any,
    });

    return {
        success: true,
        data: {
            memories: contextResponse.memories.map(m => ({
                id: m.node.id,
                type: m.node.type,
                content: m.node.summary || m.node.content,
                gravity: m.node.gravity,
                relevance: m.relevanceScore,
                reason: m.retrievalReason,
                createdAt: m.node.createdAt,
            })),
            count: contextResponse.memories.length,
            searchStats: contextResponse.stats,
        },
    };
}

async function executeRemember(
    studentId: string,
    input: { content: string; type: string; gravity?: number; privacyLevel?: string },
    sessionId?: string
): Promise<MCPToolResult> {
    // Get embedding
    let embedding: number[] | undefined;
    try {
        const { embed } = await import('@/lib/embeddings/gemini');
        embedding = await embed(input.content);
    } catch (err) {
        console.warn('Failed to generate embedding for memory');
    }

    const node = await createMemoryNode(studentId, {
        type: input.type as any,
        content: input.content,
        gravity: input.gravity ?? 5,
        privacyLevel: (input.privacyLevel ?? 'private') as any,
        embedding,
        sourceSessionId: sessionId,
    });

    return {
        success: true,
        data: {
            id: node.id,
            type: node.type,
            gravity: node.gravity,
            message: `Memory stored: "${input.content.substring(0, 50)}..."`,
        },
    };
}

async function executeGetLedger(
    studentId: string,
    input: { categories?: string[]; minSignificance?: number; limit?: number }
): Promise<MCPToolResult> {
    const entries = await getLedgerEntries(studentId, {
        categories: input.categories as any,
        minSignificance: input.minSignificance,
        limit: input.limit,
    });

    return {
        success: true,
        data: {
            entries: entries.map(e => ({
                id: e.id,
                category: e.category,
                title: e.title,
                summary: e.summary,
                significance: e.significance,
                emotionalWeight: e.emotionalWeight,
                occurredAt: e.occurredAt,
                acknowledged: e.acknowledged,
            })),
            count: entries.length,
        },
    };
}

async function executeAddLedgerEntry(
    studentId: string,
    input: {
        category: string;
        title: string;
        summary: string;
        significance?: number;
        emotionalWeight?: number;
    }
): Promise<MCPToolResult> {
    const entry = await createLedgerEntry(studentId, {
        category: input.category as any,
        title: input.title,
        summary: input.summary,
        significance: input.significance,
        emotionalWeight: input.emotionalWeight,
        relatedNodeIds: [],
    });

    return {
        success: true,
        data: {
            id: entry.id,
            category: entry.category,
            title: entry.title,
            message: `Ledger entry added: ${entry.title}`,
        },
    };
}

async function executeReinforceMemory(
    studentId: string,
    input: { nodeId: string; amount: number }
): Promise<MCPToolResult> {
    const node = await strengthenNode(studentId, input.nodeId, input.amount);

    if (!node) {
        return { success: false, error: 'Memory node not found' };
    }

    return {
        success: true,
        data: {
            nodeId: node.id,
            newGravity: node.gravity,
            message: `Memory ${input.amount > 0 ? 'strengthened' : 'weakened'}`,
        },
    };
}

async function executeGetWorldOverlay(studentId: string): Promise<MCPToolResult> {
    const overlay = await getWorldOverlay(studentId);

    return {
        success: true,
        data: overlay,
    };
}

async function executeGetMemoryStats(studentId: string): Promise<MCPToolResult> {
    const graph = await getMemoryGraph(studentId);

    return {
        success: true,
        data: {
            totalNodes: graph.stats?.totalNodes ?? 0,
            totalEdges: graph.stats?.totalEdges ?? 0,
            avgGravity: graph.stats?.avgGravity ?? 0,
            compressionRatio: graph.stats?.compressionRatio ?? 0,
            version: graph.version,
            lastCompressed: graph.lastCompressed,
        },
    };
}

// ============================================================================
// CONTEXT INJECTION FOR PROMPTS
// ============================================================================

/**
 * Get formatted memory context for prompt injection
 */
export async function getMemoryContextForPrompt(
    studentId: string,
    currentMessage: string,
    options?: {
        maxTokens?: number;
        formatStyle?: 'narrative' | 'structured' | 'minimal';
        includeWorldOverlay?: boolean;
    }
): Promise<string> {
    // Get embedding for current message
    let embedding: number[] | undefined;
    try {
        const { embed } = await import('@/lib/embeddings/gemini');
        embedding = await embed(currentMessage);
    } catch (err) {
        console.warn('Failed to embed current message');
    }

    const response = await buildContext({
        studentId,
        currentMessage,
        currentEmbedding: embedding,
        maxNodes: 10,
        minGravity: PHI_CONSTANTS.NOISE_FLOOR,
        includeLedger: true,
        maxLedgerEntries: 5,
    }, {
        maxTokens: options?.maxTokens ?? 1500,
        formatStyle: options?.formatStyle ?? 'narrative',
    });

    let context = response.formattedContext;

    // Optionally include world overlay
    if (options?.includeWorldOverlay) {
        const overlay = await getWorldOverlay(studentId);
        context = `## Current Understanding\n` +
            `- Known facts: ${overlay.knownFacts.slice(0, 3).join('; ')}\n` +
            `- Active goals: ${overlay.activeGoals.slice(0, 2).join('; ')}\n` +
            `- Emotional state: ${overlay.emotionalState}\n\n` +
            context;
    }

    return context;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Start a memory-enabled conversation session
 */
export async function startMemorySession(
    studentId: string,
    companionId?: string
): Promise<{
    sessionId: string;
    initialContext: string;
}> {
    const session = await startSession(studentId, companionId);
    const initialContext = await getMemoryContextForPrompt(studentId, '', {
        includeWorldOverlay: true,
        formatStyle: 'narrative',
    });

    return {
        sessionId: session.id,
        initialContext,
    };
}

/**
 * End a memory session with optional compression
 */
export async function endMemorySession(
    studentId: string,
    sessionId: string,
    emotionalProfile?: {
        dominant?: string;
        valence?: number;
        arousal?: number;
    },
    topicsDiscussed?: string[]
): Promise<{
    compressed: boolean;
    nodesPruned?: number;
    nodesMerged?: number;
}> {
    const ended = await endSession(studentId, sessionId, emotionalProfile, topicsDiscussed);
    const compression = await endOfSessionCompression(studentId, sessionId);

    return {
        compressed: compression !== null,
        nodesPruned: compression?.nodesPruned,
        nodesMerged: compression?.nodesMerged,
    };
}

// ============================================================================
// SYNC WITH DATABASE (Production Use)
// ============================================================================

/**
 * Sync in-memory graph to database for persistence
 */
export async function syncGraphToDatabase(
    studentId: string,
    organizationId: string
): Promise<void> {
    const graph = await getMemoryGraph(studentId);

    // Check if graph exists in DB
    const existing = await db.query.memoryGraphs.findFirst({
        where: and(
            eq(memoryGraphs.studentId, studentId),
            eq(memoryGraphs.organizationId, organizationId)
        ),
    });

    const now = Math.floor(Date.now() / 1000);

    if (existing) {
        // Update existing graph
        await db.update(memoryGraphs)
            .set({
                nodeCount: graph.stats?.totalNodes ?? 0,
                edgeCount: graph.stats?.totalEdges ?? 0,
                updatedAt: now,
                lastAccessed: now,
            })
            .where(eq(memoryGraphs.id, existing.id));
    } else {
        // Create new graph
        await db.insert(memoryGraphs).values({
            studentId,
            organizationId,
            nodeCount: graph.stats?.totalNodes ?? 0,
            edgeCount: graph.stats?.totalEdges ?? 0,
            snr: 1,
            compressionPasses: 0,
            lossVector: '[]',
            version: 1,
            createdAt: now,
            updatedAt: now,
            lastAccessed: now,
        });
    }

    console.log(`📦 Synced memory graph for student ${studentId}`);
}

