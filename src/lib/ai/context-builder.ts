/**
 * AI Context Builder
 * 
 * Build context from relevant memories for prompt injection.
 * Uses embedding similarity and gravity weighting to select
 * the most relevant memories for the current conversation.
 */

import {
    MemoryNode, MemoryNodeType, LedgerEntry,
    ContextRequest, ContextResponse, ContextResponseSchema,
    PHI_CONSTANTS, cosineSimilarityToRelevance, estimateTokens
} from './memory';
import {
    getMemoryNodes, getMemoryGraph, getLedgerEntries,
    getConnectedNodes, strengthenNode
} from './memory-queries';

// ============================================================================
// TYPES
// ============================================================================

interface RetrievedMemory {
    node: MemoryNode;
    relevanceScore: number;
    retrievalReason: string;
}

interface ContextBuilderOptions {
    maxTokens?: number;
    includeSystemPrompt?: boolean;
    formatStyle?: 'narrative' | 'structured' | 'minimal';
}

// ============================================================================
// SIMILARITY SEARCH
// ============================================================================

/**
 * Calculate cosine similarity between embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

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
 * Find nodes most similar to query embedding
 */
async function findSimilarNodes(
    studentId: string,
    queryEmbedding: number[],
    options: {
        maxNodes: number;
        minSimilarity?: number;
        includeTypes?: MemoryNodeType[];
        excludeTypes?: MemoryNodeType[];
    }
): Promise<RetrievedMemory[]> {
    const minSim = options.minSimilarity ?? 0.5;

    // Get all eligible nodes
    const nodes = await getMemoryNodes(studentId, {
        types: options.includeTypes,
        minGravity: PHI_CONSTANTS.NOISE_FLOOR,
        includeCompressed: false,
    });

    // Filter by excluded types
    const filtered = options.excludeTypes
        ? nodes.filter(n => !options.excludeTypes!.includes(n.type))
        : nodes;

    // Calculate similarities
    const scoredNodes = filtered
        .map(node => {
            if (!node.embedding || node.embedding.length === 0) {
                // No embedding - use gravity as fallback
                return {
                    node,
                    similarity: 0,
                    gravityBoost: node.gravity / PHI_CONSTANTS.MAX_GRAVITY,
                };
            }

            const similarity = cosineSimilarity(queryEmbedding, node.embedding);
            const gravityBoost = node.gravity / PHI_CONSTANTS.MAX_GRAVITY;

            return { node, similarity, gravityBoost };
        })
        .filter(item => item.similarity >= minSim || item.gravityBoost > 0.5);

    // Score = similarity * 0.7 + gravity * 0.3
    scoredNodes.sort((a, b) => {
        const scoreA = a.similarity * 0.7 + a.gravityBoost * 0.3;
        const scoreB = b.similarity * 0.7 + b.gravityBoost * 0.3;
        return scoreB - scoreA;
    });

    // Take top N
    return scoredNodes.slice(0, options.maxNodes).map(item => ({
        node: item.node,
        relevanceScore: cosineSimilarityToRelevance(item.similarity),
        retrievalReason: item.similarity > 0.7
            ? 'High semantic similarity'
            : item.gravityBoost > 0.5
                ? 'High importance memory'
                : 'Related topic',
    }));
}

// ============================================================================
// LEDGER TRIGGERS
// ============================================================================

/**
 * Find ledger entries triggered by context
 */
async function findTriggeredLedgerEntries(
    studentId: string,
    contextNodes: MemoryNode[],
    maxEntries: number
): Promise<LedgerEntry[]> {
    const ledger = await getLedgerEntries(studentId, {
        minSignificance: 5,
        limit: 50,
    });

    // Find entries related to context nodes
    const nodeIds = new Set(contextNodes.map(n => n.id));

    const triggered = ledger.filter(entry =>
        entry.relatedNodeIds.some(id => nodeIds.has(id))
    );

    // Sort by significance and recency
    triggered.sort((a, b) => {
        const sigDiff = b.significance - a.significance;
        if (sigDiff !== 0) return sigDiff;
        return b.occurredAt.getTime() - a.occurredAt.getTime();
    });

    return triggered.slice(0, maxEntries);
}

// ============================================================================
// CONTEXT FORMATTING
// ============================================================================

/**
 * Format memories for narrative style
 */
function formatNarrative(
    memories: RetrievedMemory[],
    ledgerEntries: LedgerEntry[]
): string {
    const lines: string[] = [];

    if (memories.length > 0) {
        lines.push('📚 **What I remember about you:**');
        lines.push('');

        // Group by type
        const grouped = new Map<MemoryNodeType, MemoryNode[]>();
        for (const { node } of memories) {
            if (!grouped.has(node.type)) {
                grouped.set(node.type, []);
            }
            grouped.get(node.type)!.push(node);
        }

        const typeLabels: Record<MemoryNodeType, string> = {
            fact: '📌 Facts',
            belief: '💭 Your beliefs',
            experience: '📖 Experiences',
            emotion: '💝 Feelings',
            preference: '⭐ Preferences',
            goal: '🎯 Goals',
            relationship: '👥 People',
            learning: '📚 Learning',
            confession: '🤫 Private',
            meta: '🔮 Reflections',
        };

        for (const [type, nodes] of grouped) {
            if (nodes.length > 0) {
                lines.push(`${typeLabels[type]}:`);
                for (const node of nodes.slice(0, 3)) {
                    lines.push(`  - ${node.summary || node.content}`);
                }
                lines.push('');
            }
        }
    }

    if (ledgerEntries.length > 0) {
        lines.push('📜 **Significant moments:**');
        lines.push('');

        for (const entry of ledgerEntries.slice(0, 3)) {
            const emoji = {
                milestone: '🏆',
                breakthrough: '💡',
                confession: '🤫',
                promise: '🤝',
                dream: '✨',
                fear: '😰',
                relationship: '❤️',
                conflict: '⚡',
                resolution: '🕊️',
                growth: '🌱',
            }[entry.category] || '📝';

            lines.push(`${emoji} **${entry.title}** (${entry.occurredAt.toLocaleDateString('pt-BR')})`);
            lines.push(`   ${entry.summary}`);
            lines.push('');
        }
    }

    return lines.join('\n');
}

/**
 * Format memories for structured style
 */
function formatStructured(
    memories: RetrievedMemory[],
    ledgerEntries: LedgerEntry[]
): string {
    const lines: string[] = [];

    lines.push('<student_context>');

    if (memories.length > 0) {
        lines.push('  <memories>');
        for (const { node, relevanceScore } of memories) {
            lines.push(`    <memory type="${node.type}" relevance="${relevanceScore.toFixed(2)}">`);
            lines.push(`      ${node.summary || node.content}`);
            lines.push('    </memory>');
        }
        lines.push('  </memories>');
    }

    if (ledgerEntries.length > 0) {
        lines.push('  <ledger>');
        for (const entry of ledgerEntries) {
            lines.push(`    <entry category="${entry.category}" significance="${entry.significance}">`);
            lines.push(`      <title>${entry.title}</title>`);
            lines.push(`      <summary>${entry.summary}</summary>`);
            lines.push('    </entry>');
        }
        lines.push('  </ledger>');
    }

    lines.push('</student_context>');

    return lines.join('\n');
}

/**
 * Format memories for minimal style
 */
function formatMinimal(
    memories: RetrievedMemory[],
    ledgerEntries: LedgerEntry[]
): string {
    const items: string[] = [];

    for (const { node } of memories.slice(0, 5)) {
        items.push(`[${node.type}] ${node.summary || node.content}`);
    }

    for (const entry of ledgerEntries.slice(0, 2)) {
        items.push(`[ledger:${entry.category}] ${entry.title}: ${entry.summary}`);
    }

    return items.join('\n');
}

// ============================================================================
// MAIN CONTEXT BUILDER
// ============================================================================

/**
 * Build context from relevant memories for prompt injection
 */
export async function buildContext(
    request: ContextRequest,
    options?: ContextBuilderOptions
): Promise<ContextResponse> {
    const startTime = Date.now();
    const formatStyle = options?.formatStyle ?? 'narrative';
    const maxTokens = options?.maxTokens ?? 1500;

    let memories: RetrievedMemory[] = [];
    let ledgerEntries: LedgerEntry[] = [];
    let nodesSearched = 0;

    // If we have an embedding, do similarity search
    if (request.currentEmbedding && request.currentEmbedding.length > 0) {
        memories = await findSimilarNodes(request.studentId, request.currentEmbedding, {
            maxNodes: request.maxNodes,
            includeTypes: request.includeTypes,
            excludeTypes: request.excludeTypes,
            minSimilarity: 0.4,
        });

        nodesSearched = (await getMemoryNodes(request.studentId)).length;

        // Also get connected nodes (1 hop)
        for (const { node } of memories.slice(0, 3)) {
            const connected = await getConnectedNodes(request.studentId, node.id, 1);

            for (const connectedNode of connected.slice(0, 2)) {
                if (!memories.find(m => m.node.id === connectedNode.id)) {
                    memories.push({
                        node: connectedNode,
                        relevanceScore: 0.5,
                        retrievalReason: 'Connected to relevant memory',
                    });
                }
            }
        }

        // Strengthen accessed nodes
        for (const { node } of memories) {
            await strengthenNode(request.studentId, node.id, 0.05);
        }
    } else {
        // No embedding - get by gravity
        const nodes = await getMemoryNodes(request.studentId, {
            minGravity: request.minGravity,
            types: request.includeTypes,
            limit: request.maxNodes,
        });

        nodesSearched = nodes.length;

        memories = nodes.map(node => ({
            node,
            relevanceScore: node.gravity / PHI_CONSTANTS.MAX_GRAVITY,
            retrievalReason: 'High importance memory',
        }));
    }

    // Get ledger entries
    if (request.includeLedger) {
        ledgerEntries = await findTriggeredLedgerEntries(
            request.studentId,
            memories.map(m => m.node),
            request.maxLedgerEntries
        );

        // If no triggered entries, get most significant
        if (ledgerEntries.length === 0) {
            ledgerEntries = await getLedgerEntries(request.studentId, {
                minSignificance: 7,
                limit: request.maxLedgerEntries,
            });
        }
    }

    // Format context
    let formattedContext: string;
    switch (formatStyle) {
        case 'structured':
            formattedContext = formatStructured(memories, ledgerEntries);
            break;
        case 'minimal':
            formattedContext = formatMinimal(memories, ledgerEntries);
            break;
        case 'narrative':
        default:
            formattedContext = formatNarrative(memories, ledgerEntries);
    }

    // Truncate if too long
    let estimatedTokenCount = estimateTokens(formattedContext);
    while (estimatedTokenCount > maxTokens && memories.length > 1) {
        memories.pop();
        switch (formatStyle) {
            case 'structured':
                formattedContext = formatStructured(memories, ledgerEntries);
                break;
            case 'minimal':
                formattedContext = formatMinimal(memories, ledgerEntries);
                break;
            default:
                formattedContext = formatNarrative(memories, ledgerEntries);
        }
        estimatedTokenCount = estimateTokens(formattedContext);
    }

    const response: ContextResponse = ContextResponseSchema.parse({
        studentId: request.studentId,
        memories: memories.map(m => ({
            node: m.node,
            relevanceScore: m.relevanceScore,
            retrievalReason: m.retrievalReason,
        })),
        ledgerEntries,
        formattedContext,
        estimatedTokens: estimatedTokenCount,
        stats: {
            nodesSearched,
            nodesReturned: memories.length,
            searchDurationMs: Date.now() - startTime,
        },
    });

    return response;
}

// ============================================================================
// MEMORY FORMATION
// ============================================================================

interface FormMemoryInput {
    studentId: string;
    sessionId: string;
    messageId?: string;  // Optional - may not have message ID yet
    content: string;
    role: 'user' | 'assistant';
    embedding?: number[];
}

/**
 * Form memory from an interaction
 * Analyzes content and creates appropriate nodes/edges
 */
export async function formMemory(input: FormMemoryInput): Promise<{
    nodesCreated: number;
    edgesCreated: number;
    ledgerCreated: boolean;
}> {
    // This would use NLP/LLM to extract:
    // - Facts mentioned
    // - Beliefs expressed
    // - Emotions detected
    // - Goals stated
    // - Relationships mentioned

    // For now, return a placeholder
    // In production, this would call the LLM for extraction

    console.log(`🧠 Form memory from: "${input.content.substring(0, 50)}..."`);

    return {
        nodesCreated: 0,
        edgesCreated: 0,
        ledgerCreated: false,
    };
}

// ============================================================================
// LEDGER EVALUATION
// ============================================================================

/**
 * Evaluate if content is worthy of a ledger entry
 */
export async function evaluateForLedger(
    studentId: string,
    content: string,
    context?: {
        emotionalIntensity?: number;
        topicSignificance?: number;
        isFirstMention?: boolean;
    }
): Promise<{
    isLedgerWorthy: boolean;
    suggestedCategory?: string;
    suggestedSignificance?: number;
    reason?: string;
}> {
    // Keywords that suggest ledger-worthy content
    const ledgerIndicators = {
        milestone: ['first time', 'finally', 'achieved', 'passed', 'won', 'completed'],
        breakthrough: ['understand now', 'realized', 'figured out', 'clicked', 'makes sense'],
        confession: ['never told', 'secret', 'dont tell', 'between us', 'ashamed'],
        promise: ['i promise', 'i will', 'going to', 'commit to', 'swear'],
        dream: ['want to be', 'dream of', 'someday', 'goal is', 'aspire'],
        fear: ['scared', 'afraid', 'worry', 'anxious', 'terrified'],
        relationship: ['my mom', 'my dad', 'best friend', 'boyfriend', 'girlfriend', 'sibling'],
        conflict: ['fight', 'argument', 'disagree', 'problem with', 'hate'],
        resolution: ['made up', 'forgave', 'resolved', 'better now', 'apologized'],
        growth: ['learned', 'changed', 'growing', 'improving', 'better at'],
    };

    const lowerContent = content.toLowerCase();

    for (const [category, keywords] of Object.entries(ledgerIndicators)) {
        for (const keyword of keywords) {
            if (lowerContent.includes(keyword)) {
                const significance = (context?.emotionalIntensity ?? 0.5) * 5 +
                    (context?.topicSignificance ?? 0.5) * 3 +
                    (context?.isFirstMention ? 2 : 0);

                return {
                    isLedgerWorthy: significance >= 5,
                    suggestedCategory: category,
                    suggestedSignificance: Math.min(Math.round(significance), 10),
                    reason: `Contains "${keyword}" indicating ${category}`,
                };
            }
        }
    }

    return {
        isLedgerWorthy: false,
        reason: 'No ledger indicators detected',
    };
}

// ============================================================================
// CONTRADICTION RESOLUTION
// ============================================================================

/**
 * Resolve contradiction between two memory nodes
 */
export async function resolveContradiction(
    studentId: string,
    nodeAId: string,
    nodeBId: string,
    resolution: 'keep_a' | 'keep_b' | 'merge' | 'keep_both'
): Promise<void> {
    // In production, this would:
    // 1. Mark nodes as contradictory
    // 2. Apply resolution strategy
    // 3. Update belief network
    // 4. Log for audit

    console.log(`⚖️ Resolving contradiction: ${nodeAId} vs ${nodeBId} -> ${resolution}`);
}

// ============================================================================
// WORLD OVERLAY (Fog of War)
// ============================================================================

/**
 * Get student's current world overlay
 * Returns what the AI currently "knows" about the student
 */
export async function getWorldOverlay(studentId: string): Promise<{
    knownFacts: string[];
    currentBeliefs: string[];
    activeGoals: string[];
    significantPeople: string[];
    emotionalState: string;
    recentTopics: string[];
}> {
    const nodes = await getMemoryNodes(studentId, {
        minGravity: PHI_CONSTANTS.NOISE_FLOOR * 2,
        limit: 100,
    });

    const byType = new Map<MemoryNodeType, MemoryNode[]>();
    for (const node of nodes) {
        if (!byType.has(node.type)) byType.set(node.type, []);
        byType.get(node.type)!.push(node);
    }

    return {
        knownFacts: (byType.get('fact') || []).map(n => n.summary || n.content).slice(0, 10),
        currentBeliefs: (byType.get('belief') || []).map(n => n.summary || n.content).slice(0, 5),
        activeGoals: (byType.get('goal') || []).map(n => n.summary || n.content).slice(0, 5),
        significantPeople: (byType.get('relationship') || []).map(n => n.summary || n.content).slice(0, 5),
        emotionalState: (byType.get('emotion') || [])[0]?.content || 'neutral',
        recentTopics: nodes
            .sort((a, b) => b.accessedAt.getTime() - a.accessedAt.getTime())
            .slice(0, 5)
            .map(n => n.type),
    };
}

