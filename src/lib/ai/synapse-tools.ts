/**
 * Synapse MCP Tools
 * 
 * MCP-compatible tool definitions for Synapse AI memory operations.
 * These tools give Claude access to the user's memory graph.
 */

import { z } from 'zod';

// ============================================================================
// TOOL SCHEMAS (Zod for validation)
// ============================================================================

export const QueryMemorySchema = z.object({
    query: z.string().describe('Natural language query to search memories'),
    modality: z.enum(['all', 'episodic', 'semantic', 'procedural', 'emotional', 'sensory']).optional().default('all'),
    limit: z.number().min(1).max(20).optional().default(5),
    minGravity: z.number().min(0).max(1).optional().default(0.3),
});

export const GetLedgerEntriesSchema = z.object({
    category: z.enum(['all', 'promise', 'secret', 'debt', 'threat', 'goal', 'preference']).optional().default('all'),
    limit: z.number().min(1).max(10).optional().default(5),
});

export const CreateMemorySchema = z.object({
    content: z.string().describe('The memory content to store'),
    modality: z.enum(['episodic', 'semantic', 'procedural', 'emotional', 'sensory']),
    gravity: z.number().min(0).max(1).default(0.5).describe('Importance weight (0-1)'),
    tags: z.array(z.string()).optional().default([]),
});

export const CreateLedgerEntrySchema = z.object({
    category: z.enum(['promise', 'secret', 'debt', 'threat', 'goal', 'preference']),
    content: z.string(),
    importance: z.number().min(1).max(10).default(5),
    triggers: z.array(z.string()).optional().default([]),
});

export const UpdateNodeGravitySchema = z.object({
    nodeId: z.string(),
    delta: z.number().min(-0.5).max(0.5).describe('Gravity adjustment (-0.5 to +0.5)'),
    reason: z.string().optional(),
});

// ============================================================================
// TOOL DEFINITIONS (MCP-compatible format)
// ============================================================================

export const SYNAPSE_TOOLS = [
    {
        name: 'query_memory',
        description: `Search the user's memory graph for relevant information. Use this to recall past conversations, learned facts, or emotional context. Returns the most relevant memory nodes based on semantic similarity.`,
        input_schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Natural language query to search memories (e.g., "what did we discuss about goals" or "user preferences for learning")',
                },
                modality: {
                    type: 'string',
                    enum: ['all', 'episodic', 'semantic', 'procedural', 'emotional', 'sensory'],
                    description: 'Filter by memory type. Episodic = events, Semantic = facts, Procedural = skills, Emotional = feelings, Sensory = perceptions',
                    default: 'all',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of memories to return (1-20)',
                    default: 5,
                },
                minGravity: {
                    type: 'number',
                    description: 'Minimum importance threshold (0-1). Higher = more important memories only',
                    default: 0.3,
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_ledger',
        description: `Retrieve critical facts from the user's lossless ledger. The ledger contains information that must NEVER be forgotten: promises made, secrets shared, debts owed, goals set, and preferences expressed. Always check the ledger before making commitments or referencing past agreements.`,
        input_schema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['all', 'promise', 'secret', 'debt', 'threat', 'goal', 'preference'],
                    description: 'Filter by entry type',
                    default: 'all',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum entries to return (1-10)',
                    default: 5,
                },
            },
            required: [],
        },
    },
    {
        name: 'remember',
        description: `Store a new memory node in the user's memory graph. Use this to remember important information from the conversation that should persist across sessions. Choose the appropriate modality and gravity based on importance.`,
        input_schema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The information to remember (be specific and contextual)',
                },
                modality: {
                    type: 'string',
                    enum: ['episodic', 'semantic', 'procedural', 'emotional', 'sensory'],
                    description: 'Memory type: episodic (events), semantic (facts), procedural (skills), emotional (feelings), sensory (perceptions)',
                },
                gravity: {
                    type: 'number',
                    description: 'Importance weight 0-1. Use 0.7+ for important facts, 0.3-0.6 for context, <0.3 for minor details',
                    default: 0.5,
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional tags for categorization',
                    default: [],
                },
            },
            required: ['content', 'modality'],
        },
    },
    {
        name: 'add_to_ledger',
        description: `Add a critical fact to the user's lossless ledger. Only use this for information that must NEVER be forgotten or lost to compression: promises, secrets shared in confidence, debts/obligations, potential threats, explicit goals, or strong preferences.`,
        input_schema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['promise', 'secret', 'debt', 'threat', 'goal', 'preference'],
                    description: 'Type of critical fact',
                },
                content: {
                    type: 'string',
                    description: 'The critical information to preserve forever',
                },
                importance: {
                    type: 'number',
                    description: 'Importance level 1-10',
                    default: 5,
                },
                triggers: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Keywords that should trigger recall of this entry',
                    default: [],
                },
            },
            required: ['category', 'content'],
        },
    },
    {
        name: 'reinforce_memory',
        description: `Adjust a memory node's gravity (importance) based on its relevance in the current conversation. Use positive delta to strengthen important memories, negative to let minor ones fade.`,
        input_schema: {
            type: 'object',
            properties: {
                nodeId: {
                    type: 'string',
                    description: 'The ID of the memory node to adjust',
                },
                delta: {
                    type: 'number',
                    description: 'Gravity adjustment: positive to reinforce, negative to diminish (-0.5 to +0.5)',
                },
                reason: {
                    type: 'string',
                    description: 'Optional reason for adjustment (for audit)',
                },
            },
            required: ['nodeId', 'delta'],
        },
    },
    {
        name: 'get_memory_stats',
        description: `Get statistics about the user's memory graph: node count by modality, average gravity, compression stats, and ledger size. Useful for understanding memory health and when to suggest cleanup.`,
        input_schema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
];

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QueryMemoryInput = z.infer<typeof QueryMemorySchema>;
export type GetLedgerEntriesInput = z.infer<typeof GetLedgerEntriesSchema>;
export type CreateMemoryInput = z.infer<typeof CreateMemorySchema>;
export type CreateLedgerEntryInput = z.infer<typeof CreateLedgerEntrySchema>;
export type UpdateNodeGravityInput = z.infer<typeof UpdateNodeGravitySchema>;

