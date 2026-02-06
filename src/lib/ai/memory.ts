/**
 * AI Memory System - Zod Schemas
 * 
 * Memory topology system for AI Companions with:
 * - Graph-based memory structure (nodes + edges)
 * - Ledger for significant events
 * - φ (phi) constants for compression thresholds
 * 
 * Based on Genesis principles: Trust topology, context relevance, and entropy management.
 */

import { z } from 'zod';

// ============================================================================
// PHI CONSTANTS (Golden Ratio Based)
// ============================================================================

export const PHI_CONSTANTS = {
    NOISE_FLOOR: 0.382,      // Below this gravity = noise, eligible for pruning
    DENSITY_THRESHOLD: 0.618, // Clustering density threshold
    PHI: 1.618,              // Golden ratio for scaling
    DECAY_HALF_LIFE: 7,      // Days until gravity halves
    MIN_GRAVITY: 0.1,        // Absolute minimum gravity
    MAX_GRAVITY: 10.0,       // Maximum gravity cap
    COMPRESSION_THRESHOLD: 500, // Node count to trigger compression
} as const;

// ============================================================================
// MEMORY NODE SCHEMA
// ============================================================================

export const MemoryNodeTypeSchema = z.enum([
    'fact',           // Concrete information (name, age, favorite color)
    'belief',         // Opinions, worldviews ("I think...", "I believe...")
    'experience',     // Events, stories, happenings
    'emotion',        // Emotional states or reactions
    'preference',     // Likes, dislikes, preferences
    'goal',           // Aspirations, objectives
    'relationship',   // People, pets, connections
    'learning',       // Academic or skill-related
    'confession',     // Private admissions (high privacy)
    'meta',           // Memory about memory (self-reference)
]);

export const MemoryNodeSchema = z.object({
    id: z.string().uuid(),
    studentId: z.string().uuid(),

    // Content
    type: MemoryNodeTypeSchema,
    content: z.string().min(1).max(2000),
    summary: z.string().max(200).optional(), // Compressed summary

    // Embedding
    embedding: z.array(z.number()).length(768).optional(), // Gemini embedding

    // Topology
    gravity: z.number().min(0).max(10).default(1.0), // Importance weight
    entropy: z.number().min(0).max(1).default(0), // Information loss from compression
    depth: z.number().int().min(0).default(0), // Distance from root concepts

    // Privacy
    privacyLevel: z.enum(['public', 'family', 'private', 'sacred']).default('private'),
    encrypted: z.boolean().default(false),

    // Temporal
    createdAt: z.date(),
    updatedAt: z.date(),
    accessedAt: z.date(),
    accessCount: z.number().int().min(0).default(0),

    // Source
    sourceSessionId: z.string().uuid().optional(),
    sourceMessageId: z.string().uuid().optional(),

    // Compression
    isCompressed: z.boolean().default(false),
    mergedFrom: z.array(z.string().uuid()).optional(), // IDs of merged nodes
    originalGravity: z.number().optional(), // Pre-compression gravity
});

export type MemoryNode = z.infer<typeof MemoryNodeSchema>;
export type MemoryNodeType = z.infer<typeof MemoryNodeTypeSchema>;

// ============================================================================
// MEMORY EDGE SCHEMA
// ============================================================================

export const MemoryEdgeTypeSchema = z.enum([
    'relates',        // General association
    'causes',         // A leads to B
    'contradicts',    // A conflicts with B
    'supports',       // A reinforces B
    'temporal',       // A before/after B
    'semantic',       // Meaning-based similarity
    'causal',         // Cause and effect
    'part_of',        // Hierarchical containment
    'referenced_in',  // Mentioned together
]);

export const MemoryEdgeSchema = z.object({
    id: z.string().uuid(),
    sourceNodeId: z.string().uuid(),
    targetNodeId: z.string().uuid(),

    type: MemoryEdgeTypeSchema,
    weight: z.number().min(0).max(1).default(0.5), // Strength of connection

    // Metadata
    context: z.string().max(500).optional(), // Why this connection exists
    bidirectional: z.boolean().default(true),

    // Temporal
    createdAt: z.date(),
    strengthenedCount: z.number().int().min(0).default(0),
    lastStrengthened: z.date().optional(),
});

export type MemoryEdge = z.infer<typeof MemoryEdgeSchema>;
export type MemoryEdgeType = z.infer<typeof MemoryEdgeTypeSchema>;

// ============================================================================
// MEMORY GRAPH SCHEMA
// ============================================================================

export const MemoryGraphSchema = z.object({
    studentId: z.string().uuid(),

    nodes: z.array(MemoryNodeSchema),
    edges: z.array(MemoryEdgeSchema),

    // Metadata
    version: z.number().int().min(1).default(1),
    lastCompressed: z.date().optional(),
    totalEntropyLoss: z.number().min(0).default(0),

    // Stats
    stats: z.object({
        totalNodes: z.number().int().min(0),
        totalEdges: z.number().int().min(0),
        avgGravity: z.number().min(0),
        maxDepth: z.number().int().min(0),
        compressionRatio: z.number().min(0).max(1),
    }).optional(),
});

export type MemoryGraph = z.infer<typeof MemoryGraphSchema>;

// ============================================================================
// LEDGER ENTRY SCHEMA (Significant Events)
// ============================================================================

export const LedgerCategorySchema = z.enum([
    'milestone',      // Achievement, first-time event
    'breakthrough',   // Understanding gained
    'confession',     // Private admission
    'promise',        // Commitment made
    'dream',          // Aspiration shared
    'fear',           // Vulnerability revealed
    'relationship',   // Important person mentioned
    'conflict',       // Disagreement or struggle
    'resolution',     // Problem solved
    'growth',         // Character development
]);

export const LedgerEntrySchema = z.object({
    id: z.string().uuid(),
    studentId: z.string().uuid(),

    category: LedgerCategorySchema,
    title: z.string().min(1).max(100),
    summary: z.string().min(1).max(500),

    // Significance
    significance: z.number().min(1).max(10).default(5),
    emotionalWeight: z.number().min(-1).max(1).default(0), // -1 = negative, 1 = positive

    // Related memories
    relatedNodeIds: z.array(z.string().uuid()),

    // Trigger context
    triggerContext: z.string().max(1000).optional(),

    // Privacy
    privacyLevel: z.enum(['public', 'family', 'private', 'sacred']).default('private'),

    // Temporal
    occurredAt: z.date(),
    recordedAt: z.date(),

    // Flags
    acknowledged: z.boolean().default(false), // Student confirmed accuracy
    contestable: z.boolean().default(true),   // Can be disputed
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
export type LedgerCategory = z.infer<typeof LedgerCategorySchema>;

// ============================================================================
// MEMORY SESSION SCHEMA
// ============================================================================

export const MemorySessionSchema = z.object({
    id: z.string().uuid(),
    studentId: z.string().uuid(),
    companionId: z.string().optional(),

    // Timing
    startedAt: z.date(),
    endedAt: z.date().optional(),
    durationMinutes: z.number().min(0).optional(),

    // Content
    messageCount: z.number().int().min(0).default(0),
    nodesCreated: z.number().int().min(0).default(0),
    edgesCreated: z.number().int().min(0).default(0),

    // Emotional analysis (aggregated, no content)
    emotionalProfile: z.object({
        dominant: z.string().optional(),
        valence: z.number().min(-1).max(1).optional(), // -1 = negative, 1 = positive
        arousal: z.number().min(0).max(1).optional(),  // 0 = calm, 1 = excited
        stability: z.number().min(0).max(1).optional(), // Emotional consistency
    }).optional(),

    // Topics discussed (without revealing content)
    topicsDiscussed: z.array(z.string()).optional(),

    // Flags
    compressed: z.boolean().default(false),
    sensitiveContent: z.boolean().default(false),
});

export type MemorySession = z.infer<typeof MemorySessionSchema>;

// ============================================================================
// CONTEXT REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const ContextRequestSchema = z.object({
    studentId: z.string().uuid(),
    currentMessage: z.string(),
    currentEmbedding: z.array(z.number()).optional(),

    // Retrieval parameters
    maxNodes: z.number().int().min(1).max(50).default(10),
    minGravity: z.number().min(0).max(10).default(PHI_CONSTANTS.NOISE_FLOOR),
    includeTypes: z.array(MemoryNodeTypeSchema).optional(),
    excludeTypes: z.array(MemoryNodeTypeSchema).optional(),

    // Time window
    maxAgeDays: z.number().int().min(0).optional(),

    // Include ledger
    includeLedger: z.boolean().default(true),
    maxLedgerEntries: z.number().int().min(0).max(20).default(5),
});

export type ContextRequest = z.infer<typeof ContextRequestSchema>;

export const ContextResponseSchema = z.object({
    studentId: z.string().uuid(),

    // Retrieved memories
    memories: z.array(z.object({
        node: MemoryNodeSchema,
        relevanceScore: z.number().min(0).max(1),
        retrievalReason: z.string(),
    })),

    // Retrieved ledger entries
    ledgerEntries: z.array(LedgerEntrySchema),

    // Formatted context for prompt injection
    formattedContext: z.string(),

    // Token estimate
    estimatedTokens: z.number().int().min(0),

    // Retrieval stats
    stats: z.object({
        nodesSearched: z.number().int(),
        nodesReturned: z.number().int(),
        searchDurationMs: z.number(),
    }),
});

export type ContextResponse = z.infer<typeof ContextResponseSchema>;

// ============================================================================
// COMPRESSION REPORT SCHEMA
// ============================================================================

export const CompressionReportSchema = z.object({
    sessionId: z.string().uuid().optional(),
    runAt: z.date(),

    // Before
    nodesBefore: z.number().int(),
    edgesBefore: z.number().int(),

    // After
    nodesAfter: z.number().int(),
    edgesAfter: z.number().int(),

    // Changes
    nodesPruned: z.number().int(),
    nodesMerged: z.number().int(),
    edgesPruned: z.number().int(),

    // Entropy
    entropyIntroduced: z.number().min(0).max(1),
    totalEntropyLoss: z.number().min(0),

    // Layers applied
    layer1Applied: z.boolean(), // Low-gravity pruning
    layer2Applied: z.boolean(), // Spectral clustering

    // Duration
    durationMs: z.number().min(0),
});

export type CompressionReport = z.infer<typeof CompressionReportSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate decayed gravity based on time since last access
 */
export function calculateDecayedGravity(
    originalGravity: number,
    daysSinceAccess: number,
    halfLife: number = PHI_CONSTANTS.DECAY_HALF_LIFE
): number {
    const decayFactor = Math.pow(0.5, daysSinceAccess / halfLife);
    const decayed = originalGravity * decayFactor;
    return Math.max(decayed, PHI_CONSTANTS.MIN_GRAVITY);
}

/**
 * Check if a node is eligible for pruning
 */
export function isEligibleForPruning(node: MemoryNode): boolean {
    const daysSinceAccess = (Date.now() - node.accessedAt.getTime()) / (1000 * 60 * 60 * 24);
    const effectiveGravity = calculateDecayedGravity(node.gravity, daysSinceAccess);
    return effectiveGravity < PHI_CONSTANTS.NOISE_FLOOR;
}

/**
 * Calculate similarity score from cosine similarity to relevance
 */
export function cosineSimilarityToRelevance(similarity: number): number {
    // Transform -1..1 to 0..1 with emphasis on high similarity
    return Math.max(0, (similarity + 1) / 2);
}

/**
 * Estimate token count for a string
 */
export function estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
}

