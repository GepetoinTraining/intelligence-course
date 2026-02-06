/**
 * Genesis MCP Tool Definitions
 *
 * These are the tools exposed via the MCP protocol to any Claude instance.
 * Ported from genesis/mcp/src/tools.rs with additions (reinforce, status).
 */

export const GENESIS_TOOLS = [
    {
        name: 'remember',
        description: 'Store a memory node in the Genesis graph. Use for decisions, insights, patterns, or important context that should persist across sessions. Do NOT store conversation noise — only load-bearing information.',
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'The memory content — be concise, capture the decision or insight, not the discussion' },
                nodeType: {
                    type: 'string',
                    enum: ['conversation', 'concept', 'insight', 'decision', 'pattern', 'question', 'contradiction', 'fact'],
                    description: 'Type of memory node',
                },
                tags: { type: 'array', items: { type: 'string' }, description: 'Tags for cross-session gravity bumping' },
                depth: { type: 'number', description: 'Distance from soul: 0 = core identity, 1 = periphery. Default 0.5' },
                gravity: { type: 'number', description: 'Importance 0-10. Default 5.0' },
                relatedTo: { type: 'array', items: { type: 'string' }, description: 'Node IDs to create edges to' },
                sourceSessionType: {
                    type: 'string',
                    enum: ['claude_code', 'claude_desktop', 'claude_web', 'antigravity', 'subconscious', 'manual'],
                },
            },
            required: ['content', 'nodeType'],
        },
    },
    {
        name: 'recall',
        description: 'Search the Genesis graph semantically. Returns nodes ranked by embedding similarity weighted by gravity and depth.',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Semantic search query' },
                maxResults: { type: 'number', description: 'Max nodes to return. Default 10' },
                nodeTypes: { type: 'array', items: { type: 'string' }, description: 'Filter by type' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
                minGravity: { type: 'number', description: 'Minimum gravity threshold' },
                includeEdges: { type: 'boolean', description: 'Include connected nodes. Default true' },
            },
            required: ['query'],
        },
    },
    {
        name: 'relate',
        description: 'Create a relationship edge between two memory nodes.',
        inputSchema: {
            type: 'object',
            properties: {
                sourceId: { type: 'string', description: 'Source node ID' },
                targetId: { type: 'string', description: 'Target node ID' },
                relationType: {
                    type: 'string',
                    enum: ['references', 'develops', 'contradicts', 'branches', 'causes', 'supports', 'temporal', 'semantic', 'precedes'],
                },
                weight: { type: 'number', description: 'Strength 0-1. Default 1.0' },
                context: { type: 'string', description: 'Why this connection exists' },
            },
            required: ['sourceId', 'targetId', 'relationType'],
        },
    },
    {
        name: 'observe',
        description: 'Record an observation, inference, or commitment to the immutable ledger. This is the narrative layer — things that must never be lost or compressed.',
        inputSchema: {
            type: 'object',
            properties: {
                entryType: {
                    type: 'string',
                    enum: ['observation', 'inference', 'commitment', 'question', 'decision', 'pattern', 'surfaced'],
                },
                content: { type: 'string' },
                confidence: { type: 'number', description: '0-1. How confident. Default 1.0' },
                nodeId: { type: 'string', description: 'Related genesis node ID' },
            },
            required: ['entryType', 'content'],
        },
    },
    {
        name: 'forget',
        description: 'Push a node toward periphery by increasing its depth. Information fades but is never deleted.',
        inputSchema: {
            type: 'object',
            properties: {
                nodeId: { type: 'string', description: 'Node to push toward periphery' },
                amount: { type: 'number', description: 'How much to increase depth. Default 0.1' },
            },
            required: ['nodeId'],
        },
    },
    {
        name: 'reinforce',
        description: 'Bump gravity on nodes matching tags or IDs. Use when a topic comes up repeatedly across sessions — the more it recurs, the heavier it gets.',
        inputSchema: {
            type: 'object',
            properties: {
                tags: { type: 'array', items: { type: 'string' }, description: 'Bump all nodes with these tags' },
                nodeIds: { type: 'array', items: { type: 'string' }, description: 'Specific node IDs to bump' },
                amount: { type: 'number', description: 'Gravity increase. Default 0.5' },
            },
        },
    },
    {
        name: 'who_am_i',
        description: 'Get current context: cube position, top memories, recent ledger entries. Call this at session start to understand who you are talking to.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'status',
        description: 'Get graph statistics: total nodes, edges, average depth, top-gravity nodes, recent activity.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
] as const;

export type GenesisToolName = typeof GENESIS_TOOLS[number]['name'];
