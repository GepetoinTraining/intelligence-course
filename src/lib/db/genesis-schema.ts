/**
 * GENESIS: Cross-Session Memory Graph (Platform-Only Module)
 *
 * This is Pedro's personal memory system. It runs inside the NodeZero platform
 * organization and is invisible to all school tenants.
 *
 * Origin: C:\Users\CLIENTE\genesis\ (Rust MCP + Tauri app)
 * Ported to TypeScript/Drizzle to run on Vercel alongside the SaaS platform.
 *
 * Key differences from Synapse (student memory):
 * - Hypersphere topology with depth (distance from soul) instead of flat gravity
 * - Trust cube (trust_level × access_depth × role_clarity) per user
 * - No compression, no auditor, no guardrails
 * - Subconscious processor (stateless Haiku) maintains the graph between sessions
 *
 * AUTH: Platform org owner only. 403 for everyone else.
 */

import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { persons } from './schema';
import { organizations } from './schema';

const uuid = () => sql`(lower(hex(randomblob(16))))`;
const timestamp = () => sql`(unixepoch())`;

// ============================================================================
// GENESIS: Memory Nodes
// ============================================================================

export const genesisNodes = sqliteTable('genesis_nodes', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Content
    content: text('content').notNull(),
    summary: text('summary'),
    nodeType: text('node_type', {
        enum: ['conversation', 'concept', 'insight', 'decision', 'pattern', 'question', 'contradiction', 'fact']
    }).notNull(),

    // Hypersphere topology
    depth: real('depth').notNull().default(1.0),           // Distance from soul (0 = core identity, 1 = periphery)
    gravity: real('gravity').notNull().default(1.0),       // Importance weight (0-10)

    // Access control (trust cube gating)
    accessLevel: integer('access_level').notNull().default(1), // Minimum trust to see this node

    // Tags for cross-session gravity bumping
    tags: text('tags').default('[]'), // JSON array of strings

    // Temporal
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    accessedAt: integer('accessed_at').default(timestamp()),
    accessCount: integer('access_count').default(0),

    // Source tracking — which Claude instance created this
    sourceSessionType: text('source_session_type', {
        enum: ['claude_code', 'claude_desktop', 'claude_web', 'antigravity', 'subconscious', 'manual']
    }),
    sourceSessionId: text('source_session_id'),
}, (table) => [
    index('idx_genesis_nodes_person').on(table.personId),
    index('idx_genesis_nodes_org').on(table.organizationId),
    index('idx_genesis_nodes_gravity').on(table.gravity),
    index('idx_genesis_nodes_depth').on(table.depth),
    index('idx_genesis_nodes_type').on(table.nodeType),
]);

// ============================================================================
// GENESIS: Memory Edges
// ============================================================================

export const genesisEdges = sqliteTable('genesis_edges', {
    id: text('id').primaryKey().default(uuid()),
    sourceId: text('source_id').notNull().references(() => genesisNodes.id, { onDelete: 'cascade' }),
    targetId: text('target_id').notNull().references(() => genesisNodes.id, { onDelete: 'cascade' }),

    relationType: text('relation_type', {
        enum: ['references', 'develops', 'contradicts', 'branches', 'causes', 'supports', 'temporal', 'semantic', 'precedes']
    }).notNull(),

    weight: real('weight').notNull().default(1.0),    // Strength of relationship (0-1)
    context: text('context'),                          // Why this connection exists

    createdAt: integer('created_at').default(timestamp()),
    strengthenedCount: integer('strengthened_count').default(0),
    lastStrengthened: integer('last_strengthened'),
}, (table) => [
    index('idx_genesis_edges_source').on(table.sourceId),
    index('idx_genesis_edges_target').on(table.targetId),
    index('idx_genesis_edges_type').on(table.relationType),
]);

// ============================================================================
// GENESIS: Trust Cube Positions
// ============================================================================

export const genesisCubePositions = sqliteTable('genesis_cube_positions', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Trust topology — 3D position in the hypersphere
    trustLevel: real('trust_level').notNull().default(1.0),      // 0-10: stranger → co-creator
    accessDepth: real('access_depth').notNull().default(1.0),    // 0-10: public → subconscious
    roleClarity: real('role_clarity').notNull().default(2.0),    // 0-10: undefined → SELF

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_genesis_cube_person').on(table.personId),
]);

// ============================================================================
// GENESIS: Immutable Ledger
// ============================================================================

export const genesisLedger = sqliteTable('genesis_ledger', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    nodeId: text('node_id').references(() => genesisNodes.id),

    entryType: text('entry_type', {
        enum: ['observation', 'inference', 'commitment', 'question', 'decision', 'pattern', 'surfaced']
    }).notNull(),

    content: text('content').notNull(),
    confidence: real('confidence').notNull().default(1.0), // 0-1

    // Source tracking
    sourceSessionType: text('source_session_type', {
        enum: ['claude_code', 'claude_desktop', 'claude_web', 'antigravity', 'subconscious', 'manual']
    }),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_genesis_ledger_person').on(table.personId),
    index('idx_genesis_ledger_type').on(table.entryType),
    index('idx_genesis_ledger_time').on(table.createdAt),
]);

// ============================================================================
// GENESIS: Embeddings (768-dim vectors for semantic search)
// ============================================================================

export const genesisEmbeddings = sqliteTable('genesis_embeddings', {
    nodeId: text('node_id').primaryKey().references(() => genesisNodes.id, { onDelete: 'cascade' }),
    vector: text('vector').notNull(),                       // JSON array of 768 floats
    modelVersion: text('model_version').notNull().default('nomic-embed-text-v2-moe'),
    createdAt: integer('created_at').default(timestamp()),
});

// ============================================================================
// GENESIS: Type Exports
// ============================================================================

export type GenesisNode = typeof genesisNodes.$inferSelect;
export type GenesisNodeInsert = typeof genesisNodes.$inferInsert;
export type GenesisEdge = typeof genesisEdges.$inferSelect;
export type GenesisEdgeInsert = typeof genesisEdges.$inferInsert;
export type GenesisCubePosition = typeof genesisCubePositions.$inferSelect;
export type GenesisLedgerEntry = typeof genesisLedger.$inferSelect;
export type GenesisLedgerEntryInsert = typeof genesisLedger.$inferInsert;
export type GenesisEmbedding = typeof genesisEmbeddings.$inferSelect;
