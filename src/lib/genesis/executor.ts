/**
 * Genesis Tool Executor
 *
 * Handles all MCP tool calls against the Turso database.
 * Ported from genesis/mcp/src/handlers.rs + genesis/mcp/src/bridge.rs
 *
 * Auth is handled by the route layer — by the time we get here,
 * personId is verified as a platform org owner.
 */

import { db } from '@/lib/db';
import { eq, and, desc, sql, like, inArray } from 'drizzle-orm';
import {
    genesisNodes,
    genesisEdges,
    genesisCubePositions,
    genesisLedger,
    genesisEmbeddings,
    type GenesisNode,
} from '@/lib/db/genesis-schema';
import type { GenesisToolName } from './tools';

// Platform org ID — set after bootstrap
const PLATFORM_ORG_ID = process.env.GENESIS_PLATFORM_ORG_ID || '';

// ============================================================================
// UUID helper
// ============================================================================

function genId(): string {
    return crypto.randomUUID().replace(/-/g, '');
}

// ============================================================================
// Embedding helper (calls Gemini or Nomic via API)
// ============================================================================

async function getEmbedding(text: string): Promise<number[]> {
    // Use Gemini embedding API (already available in the project)
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text }] },
            }),
        },
    );
    const data = await response.json();
    return data.embedding?.values || [];
}

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
}

// ============================================================================
// Tool Executor
// ============================================================================

export async function executeGenesisTool(
    personId: string,
    toolName: GenesisToolName | string,
    args: Record<string, unknown>,
): Promise<unknown> {
    switch (toolName) {
        case 'remember':
            return handleRemember(personId, args);
        case 'recall':
            return handleRecall(personId, args);
        case 'relate':
            return handleRelate(args);
        case 'observe':
            return handleObserve(personId, args);
        case 'forget':
            return handleForget(args);
        case 'reinforce':
            return handleReinforce(personId, args);
        case 'who_am_i':
            return handleWhoAmI(personId);
        case 'status':
            return handleStatus(personId);
        default:
            throw new Error(`Unknown Genesis tool: ${toolName}`);
    }
}

// ============================================================================
// remember — Create a memory node + optional edges + embedding
// ============================================================================

async function handleRemember(personId: string, args: Record<string, unknown>) {
    const nodeId = genId();
    const content = args.content as string;
    const nodeType = (args.nodeType as string) || 'insight';
    const tags = (args.tags as string[]) || [];
    const depth = (args.depth as number) ?? 0.5;
    const gravity = (args.gravity as number) ?? 5.0;
    const relatedTo = (args.relatedTo as string[]) || [];
    const sourceSessionType = (args.sourceSessionType as string) || null;

    const now = Math.floor(Date.now() / 1000);

    // Insert node
    await db.insert(genesisNodes).values({
        id: nodeId,
        personId,
        organizationId: PLATFORM_ORG_ID,
        content,
        nodeType: nodeType as GenesisNode['nodeType'],
        tags: JSON.stringify(tags),
        depth,
        gravity,
        accessLevel: 1,
        createdAt: now,
        updatedAt: now,
        accessedAt: now,
        accessCount: 0,
        sourceSessionType: sourceSessionType as GenesisNode['sourceSessionType'],
    });

    // Create edges to related nodes
    for (const targetId of relatedTo) {
        await db.insert(genesisEdges).values({
            id: genId(),
            sourceId: nodeId,
            targetId,
            relationType: 'references',
            weight: 1.0,
            createdAt: now,
            strengthenedCount: 0,
        });
    }

    // Generate and store embedding
    try {
        const vector = await getEmbedding(content);
        if (vector.length > 0) {
            await db.insert(genesisEmbeddings).values({
                nodeId,
                vector: JSON.stringify(vector),
                createdAt: now,
            });
        }
    } catch {
        // Embedding failure is non-fatal — node still stored
    }

    return { id: nodeId, content, nodeType, depth, gravity, tags, edges: relatedTo.length };
}

// ============================================================================
// recall — Semantic search + graph traversal
// ============================================================================

async function handleRecall(personId: string, args: Record<string, unknown>) {
    const query = args.query as string;
    const maxResults = (args.maxResults as number) || 10;
    const nodeTypes = args.nodeTypes as string[] | undefined;
    const filterTags = args.tags as string[] | undefined;
    const minGravity = (args.minGravity as number) ?? 0;
    const includeEdges = (args.includeEdges as boolean) ?? true;

    // Get all nodes for this person
    let nodes = await db.select()
        .from(genesisNodes)
        .where(and(
            eq(genesisNodes.personId, personId),
        ))
        .orderBy(desc(genesisNodes.gravity));

    // Filter by type
    if (nodeTypes && nodeTypes.length > 0) {
        nodes = nodes.filter(n => nodeTypes.includes(n.nodeType));
    }

    // Filter by tags
    if (filterTags && filterTags.length > 0) {
        nodes = nodes.filter(n => {
            const nodeTags: string[] = JSON.parse(n.tags || '[]');
            return filterTags.some(t => nodeTags.includes(t));
        });
    }

    // Filter by gravity
    if (minGravity > 0) {
        nodes = nodes.filter(n => n.gravity >= minGravity);
    }

    // Semantic ranking if we can get an embedding
    let rankedNodes: Array<GenesisNode & { similarity?: number }>;
    try {
        const queryEmbedding = await getEmbedding(query);
        const embeddings = await db.select()
            .from(genesisEmbeddings)
            .where(inArray(genesisEmbeddings.nodeId, nodes.map(n => n.id)));

        const embMap = new Map(embeddings.map(e => [e.nodeId, JSON.parse(e.vector) as number[]]));

        rankedNodes = nodes.map(n => {
            const emb = embMap.get(n.id);
            const similarity = emb ? cosineSimilarity(queryEmbedding, emb) : 0;
            // Score = similarity × gravity × (1 / depth). Core nodes with high gravity win.
            const score = similarity * n.gravity * (1 / Math.max(n.depth, 0.1));
            return { ...n, similarity, _score: score };
        }).sort((a, b) => (b as any)._score - (a as any)._score);
    } catch {
        // Fallback to gravity-only ranking
        rankedNodes = nodes;
    }

    const results = rankedNodes.slice(0, maxResults);

    // Update access metadata
    const now = Math.floor(Date.now() / 1000);
    for (const node of results) {
        await db.update(genesisNodes)
            .set({ accessedAt: now, accessCount: (node.accessCount || 0) + 1 })
            .where(eq(genesisNodes.id, node.id));
    }

    // Optionally include edges
    let edges: Array<typeof genesisEdges.$inferSelect> = [];
    if (includeEdges && results.length > 0) {
        const nodeIds = results.map(n => n.id);
        edges = await db.select()
            .from(genesisEdges)
            .where(
                sql`${genesisEdges.sourceId} IN ${nodeIds} OR ${genesisEdges.targetId} IN ${nodeIds}`
            );
    }

    return {
        nodes: results.map(n => ({
            id: n.id,
            content: n.content,
            summary: n.summary,
            type: n.nodeType,
            depth: n.depth,
            gravity: n.gravity,
            tags: JSON.parse(n.tags || '[]'),
            similarity: (n as any).similarity,
            source: n.sourceSessionType,
            createdAt: n.createdAt,
        })),
        edges: edges.map(e => ({
            source: e.sourceId,
            target: e.targetId,
            type: e.relationType,
            weight: e.weight,
        })),
        total: results.length,
    };
}

// ============================================================================
// relate — Create edge between nodes
// ============================================================================

async function handleRelate(args: Record<string, unknown>) {
    const sourceId = args.sourceId as string;
    const targetId = args.targetId as string;
    const relationType = args.relationType as string;
    const weight = (args.weight as number) ?? 1.0;
    const context = (args.context as string) || null;

    const edgeId = genId();
    await db.insert(genesisEdges).values({
        id: edgeId,
        sourceId,
        targetId,
        relationType: relationType as any,
        weight,
        context,
        createdAt: Math.floor(Date.now() / 1000),
        strengthenedCount: 0,
    });

    return { id: edgeId, source: sourceId, target: targetId, type: relationType, weight };
}

// ============================================================================
// observe — Append to immutable ledger
// ============================================================================

async function handleObserve(personId: string, args: Record<string, unknown>) {
    const entryType = args.entryType as string;
    const content = args.content as string;
    const confidence = (args.confidence as number) ?? 1.0;
    const nodeId = (args.nodeId as string) || null;
    const sourceSessionType = (args.sourceSessionType as string) || null;

    const entryId = genId();
    await db.insert(genesisLedger).values({
        id: entryId,
        personId,
        nodeId,
        entryType: entryType as any,
        content,
        confidence,
        sourceSessionType: sourceSessionType as any,
        createdAt: Math.floor(Date.now() / 1000),
    });

    return { id: entryId, type: entryType, content, confidence };
}

// ============================================================================
// forget — Push node toward periphery
// ============================================================================

async function handleForget(args: Record<string, unknown>) {
    const nodeId = args.nodeId as string;
    const amount = (args.amount as number) ?? 0.1;

    await db.update(genesisNodes)
        .set({
            depth: sql`${genesisNodes.depth} + ${amount}`,
            updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(genesisNodes.id, nodeId));

    return { nodeId, depthIncreased: amount };
}

// ============================================================================
// reinforce — Bump gravity by tags or node IDs
// ============================================================================

async function handleReinforce(personId: string, args: Record<string, unknown>) {
    const tags = (args.tags as string[]) || [];
    const nodeIds = (args.nodeIds as string[]) || [];
    const amount = (args.amount as number) ?? 0.5;
    const now = Math.floor(Date.now() / 1000);

    let bumped = 0;

    // Bump by node IDs
    if (nodeIds.length > 0) {
        for (const id of nodeIds) {
            await db.update(genesisNodes)
                .set({
                    gravity: sql`MIN(${genesisNodes.gravity} + ${amount}, 10.0)`,
                    updatedAt: now,
                })
                .where(eq(genesisNodes.id, id));
            bumped++;
        }
    }

    // Bump by tags — find nodes that have any of the given tags
    if (tags.length > 0) {
        const allNodes = await db.select()
            .from(genesisNodes)
            .where(eq(genesisNodes.personId, personId));

        for (const node of allNodes) {
            const nodeTags: string[] = JSON.parse(node.tags || '[]');
            if (tags.some(t => nodeTags.includes(t))) {
                await db.update(genesisNodes)
                    .set({
                        gravity: sql`MIN(${genesisNodes.gravity} + ${amount}, 10.0)`,
                        updatedAt: now,
                    })
                    .where(eq(genesisNodes.id, node.id));
                bumped++;
            }
        }
    }

    return { bumped, tags, nodeIds, amount };
}

// ============================================================================
// who_am_i — Full context dump for session start
// ============================================================================

async function handleWhoAmI(personId: string) {
    // Cube position
    const cube = await db.select()
        .from(genesisCubePositions)
        .where(eq(genesisCubePositions.personId, personId))
        .limit(1);

    // Top nodes by gravity
    const topNodes = await db.select()
        .from(genesisNodes)
        .where(eq(genesisNodes.personId, personId))
        .orderBy(desc(genesisNodes.gravity))
        .limit(20);

    // Recent ledger
    const recentLedger = await db.select()
        .from(genesisLedger)
        .where(eq(genesisLedger.personId, personId))
        .orderBy(desc(genesisLedger.createdAt))
        .limit(10);

    // Surfaced items (subconscious flagged for this session)
    const surfaced = await db.select()
        .from(genesisLedger)
        .where(and(
            eq(genesisLedger.personId, personId),
            eq(genesisLedger.entryType, 'surfaced'),
        ))
        .orderBy(desc(genesisLedger.createdAt))
        .limit(5);

    return {
        cubePosition: cube[0] || { trustLevel: 1.0, accessDepth: 1.0, roleClarity: 2.0 },
        topMemories: topNodes.map(n => ({
            id: n.id,
            content: n.summary || n.content,
            type: n.nodeType,
            depth: n.depth,
            gravity: n.gravity,
            tags: JSON.parse(n.tags || '[]'),
        })),
        recentLedger: recentLedger.map(l => ({
            type: l.entryType,
            content: l.content,
            confidence: l.confidence,
            createdAt: l.createdAt,
        })),
        surfacedInsights: surfaced.map(s => s.content),
    };
}

// ============================================================================
// status — Graph statistics
// ============================================================================

async function handleStatus(personId: string) {
    const nodeCount = await db.select({ count: sql<number>`count(*)` })
        .from(genesisNodes)
        .where(eq(genesisNodes.personId, personId));

    const edgeCount = await db.select({ count: sql<number>`count(*)` })
        .from(genesisEdges);

    const avgDepth = await db.select({ avg: sql<number>`avg(${genesisNodes.depth})` })
        .from(genesisNodes)
        .where(eq(genesisNodes.personId, personId));

    const avgGravity = await db.select({ avg: sql<number>`avg(${genesisNodes.gravity})` })
        .from(genesisNodes)
        .where(eq(genesisNodes.personId, personId));

    const topByGravity = await db.select()
        .from(genesisNodes)
        .where(eq(genesisNodes.personId, personId))
        .orderBy(desc(genesisNodes.gravity))
        .limit(5);

    const ledgerCount = await db.select({ count: sql<number>`count(*)` })
        .from(genesisLedger)
        .where(eq(genesisLedger.personId, personId));

    return {
        nodes: nodeCount[0]?.count || 0,
        edges: edgeCount[0]?.count || 0,
        ledgerEntries: ledgerCount[0]?.count || 0,
        avgDepth: avgDepth[0]?.avg || 0,
        avgGravity: avgGravity[0]?.avg || 0,
        topNodes: topByGravity.map(n => ({
            content: n.summary || n.content?.slice(0, 100),
            gravity: n.gravity,
            depth: n.depth,
            type: n.nodeType,
        })),
    };
}
