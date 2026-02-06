/**
 * Genesis Subconscious Processor
 *
 * Stateless. No identity. No memory. No personality.
 * Receives the graph state + a new session event.
 * Returns JSON operations to apply to the graph.
 *
 * Called by the Stop hook via /api/platform/genesis/process
 * Uses Haiku for cheap, fast pattern recognition.
 */

import { db } from '@/lib/db';
import { eq, desc, sql, and } from 'drizzle-orm';
import {
    genesisNodes,
    genesisEdges,
    genesisLedger,
} from '@/lib/db/genesis-schema';
import { executeGenesisTool } from './executor';

// ============================================================================
// Types
// ============================================================================

interface SessionEvent {
    sessionSummary: string;
    tags: string[];
    decisions: string[];
    sourceSessionType: 'claude_code' | 'claude_desktop' | 'claude_web' | 'antigravity' | 'manual';
}

interface SubconsciousOps {
    createNodes: Array<{
        content: string;
        nodeType: string;
        tags: string[];
        depth: number;
        gravity: number;
    }>;
    createEdges: Array<{
        sourceContent: string;
        targetContent: string;
        relationType: string;
        weight: number;
    }>;
    reinforceTags: Array<{
        tag: string;
        amount: number;
    }>;
    surfaceNextSession: string[];
    ledgerEntries: Array<{
        entryType: string;
        content: string;
        confidence: number;
    }>;
}

// ============================================================================
// Main Processor
// ============================================================================

export async function processSubconscious(
    personId: string,
    event: SessionEvent,
): Promise<{ applied: SubconsciousOps; nodesCreated: number; edgesCreated: number }> {

    // 1. Load current graph state
    const topNodes = await db.select()
        .from(genesisNodes)
        .where(eq(genesisNodes.personId, personId))
        .orderBy(desc(genesisNodes.gravity))
        .limit(50);

    const recentLedger = await db.select()
        .from(genesisLedger)
        .where(eq(genesisLedger.personId, personId))
        .orderBy(desc(genesisLedger.createdAt))
        .limit(10);

    // 2. Build prompt for the subconscious
    const prompt = buildSubconsciousPrompt(topNodes, recentLedger, event);

    // 3. Call Haiku
    const ops = await callHaiku(prompt);
    if (!ops) {
        return { applied: emptyOps(), nodesCreated: 0, edgesCreated: 0 };
    }

    // 4. Apply operations
    const result = await applyOps(personId, ops, event.sourceSessionType, topNodes);

    return result;
}

// ============================================================================
// Prompt Builder
// ============================================================================

function buildSubconsciousPrompt(
    topNodes: Array<typeof genesisNodes.$inferSelect>,
    recentLedger: Array<typeof genesisLedger.$inferSelect>,
    event: SessionEvent,
): string {
    const nodesContext = topNodes.map(n => ({
        id: n.id,
        content: (n.summary || n.content).slice(0, 200),
        type: n.nodeType,
        gravity: n.gravity,
        depth: n.depth,
        tags: JSON.parse(n.tags || '[]'),
    }));

    const ledgerContext = recentLedger.map(l => ({
        type: l.entryType,
        content: l.content.slice(0, 200),
        confidence: l.confidence,
    }));

    return `You are a subconscious memory processor. You have no identity, no preferences, no conversation history. You receive a memory graph state and a new session event. Your job: determine what nodes to create, what edges to form, what gravity to adjust.

CURRENT GRAPH (top ${topNodes.length} nodes by gravity):
${JSON.stringify(nodesContext, null, 2)}

RECENT LEDGER:
${JSON.stringify(ledgerContext, null, 2)}

NEW SESSION EVENT:
Summary: ${event.sessionSummary}
Tags: ${JSON.stringify(event.tags)}
Decisions: ${JSON.stringify(event.decisions)}
Source: ${event.sourceSessionType}

Return ONLY valid JSON with these arrays (all arrays can be empty):
{
  "createNodes": [{ "content": "...", "nodeType": "concept|insight|decision|pattern|question|contradiction", "tags": [...], "depth": 0.0-1.0, "gravity": 0.0-10.0 }],
  "createEdges": [{ "sourceContent": "matches existing node content", "targetContent": "matches existing or new node content", "relationType": "references|develops|contradicts|supports|causes|branches", "weight": 0.0-1.0 }],
  "reinforceTags": [{ "tag": "...", "amount": 0.0-2.0 }],
  "surfaceNextSession": ["insight text to surface next time"],
  "ledgerEntries": [{ "entryType": "observation|inference|pattern|decision", "content": "...", "confidence": 0.0-1.0 }]
}

Rules:
- MOST sessions produce 0-2 new nodes. Be aggressive about NOT creating nodes.
- Only create a node if it represents a genuinely new concept, decision, or pattern.
- If a decision was already recorded as a node, DO NOT duplicate it. Reinforce the tag instead.
- Edges connect to EXISTING nodes by matching their content. Use sourceContent/targetContent to match.
- surfaceNextSession: flag insights that the conscious layer should see next time. Use sparingly.
- Contradictions between existing nodes are valuable — always create contradiction edges.`;
}

// ============================================================================
// Haiku API Call
// ============================================================================

async function callHaiku(prompt: string): Promise<SubconsciousOps | null> {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY!,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            console.error('[Genesis Subconscious] Haiku API error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data.content?.[0]?.text;
        if (!text) return null;

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        return JSON.parse(jsonMatch[0]) as SubconsciousOps;
    } catch (error) {
        console.error('[Genesis Subconscious] Error:', error);
        return null;
    }
}

// ============================================================================
// Apply Operations to Graph
// ============================================================================

async function applyOps(
    personId: string,
    ops: SubconsciousOps,
    sourceSessionType: string,
    existingNodes: Array<typeof genesisNodes.$inferSelect>,
): Promise<{ applied: SubconsciousOps; nodesCreated: number; edgesCreated: number }> {

    let nodesCreated = 0;
    let edgesCreated = 0;

    // Create nodes
    const newNodeMap = new Map<string, string>(); // content → nodeId
    for (const node of ops.createNodes || []) {
        const result = await executeGenesisTool(personId, 'remember', {
            content: node.content,
            nodeType: node.nodeType,
            tags: node.tags,
            depth: node.depth,
            gravity: node.gravity,
            sourceSessionType: 'subconscious',
        }) as { id: string };
        newNodeMap.set(node.content, result.id);
        nodesCreated++;
    }

    // Create edges (match by content to find node IDs)
    for (const edge of ops.createEdges || []) {
        const sourceId = findNodeByContent(edge.sourceContent, existingNodes, newNodeMap);
        const targetId = findNodeByContent(edge.targetContent, existingNodes, newNodeMap);
        if (sourceId && targetId) {
            await executeGenesisTool(personId, 'relate', {
                sourceId,
                targetId,
                relationType: edge.relationType,
                weight: edge.weight,
            });
            edgesCreated++;
        }
    }

    // Reinforce tags
    for (const tag of ops.reinforceTags || []) {
        await executeGenesisTool(personId, 'reinforce', {
            tags: [tag.tag],
            amount: tag.amount,
        });
    }

    // Surface insights (write as ledger entries with type 'surfaced')
    for (const insight of ops.surfaceNextSession || []) {
        await executeGenesisTool(personId, 'observe', {
            entryType: 'surfaced',
            content: insight,
            confidence: 1.0,
            sourceSessionType: 'subconscious',
        });
    }

    // Ledger entries
    for (const entry of ops.ledgerEntries || []) {
        await executeGenesisTool(personId, 'observe', {
            entryType: entry.entryType,
            content: entry.content,
            confidence: entry.confidence,
            sourceSessionType: 'subconscious',
        });
    }

    return { applied: ops, nodesCreated, edgesCreated };
}

// ============================================================================
// Helpers
// ============================================================================

function findNodeByContent(
    content: string,
    existingNodes: Array<typeof genesisNodes.$inferSelect>,
    newNodeMap: Map<string, string>,
): string | null {
    // Check new nodes first (exact match)
    if (newNodeMap.has(content)) return newNodeMap.get(content)!;

    // Fuzzy match against existing nodes (simple substring for now)
    const contentLower = content.toLowerCase();
    const match = existingNodes.find(n =>
        n.content.toLowerCase().includes(contentLower) ||
        contentLower.includes(n.content.toLowerCase().slice(0, 50))
    );

    return match?.id || null;
}

function emptyOps(): SubconsciousOps {
    return {
        createNodes: [],
        createEdges: [],
        reinforceTags: [],
        surfaceNextSession: [],
        ledgerEntries: [],
    };
}
