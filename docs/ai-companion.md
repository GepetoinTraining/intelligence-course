# AI Companion System

## Overview

The AI Companion is a personalized AI agent assigned to each student throughout their learning journey. Unlike typical chatbots, the AI Companion develops persistent memory and adapts to the student's learning style over time.

---

## Core Philosophy

> **Memory is topology, not content.**

The AI Companion doesn't store raw conversation logs. Instead, it maintains a **graph structure** of memories with:
- **Nodes**: Discrete memory units
- **Edges**: Relationships between memories
- **Gravity**: Importance weight (decays over time)
- **Compression**: Older memories are compressed, preserving structure over content

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AI COMPANION SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   MEMORY GRAPH      │    │        LEDGER               │ │
│  │   (Lossy Topology)  │    │    (Lossless RAG)           │ │
│  │                     │    │                             │ │
│  │  Nodes ──Edges──►   │    │  • Promises made            │ │
│  │    │      │         │    │  • Secrets learned          │ │
│  │    ▼      ▼         │    │  • Debts owed/owing         │ │
│  │  gravity  weight    │    │  • Threats identified       │ │
│  │  salience valence   │    │  • Critical facts           │ │
│  │                     │    │                             │ │
│  │  Compressed via     │    │  Retrieved via triggers     │ │
│  │  SNR-based passes   │    │  when context matches       │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              WORLD GRAPH OVERLAY                         ││
│  │  Student's perspective on canonical world graph          ││
│  │  • Known nodes (fog of war)                              ││
│  │  • Attitude overrides (opinions of places/people)        ││
│  │  • Familiarity levels                                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Dual Memory System

### 1. Memory Graph (Lossy)

The graph stores **topology**—the structure of memories and their relationships—rather than verbatim content.

**Node Types (Modalities)**:
| Modality | Description | Example |
|----------|-------------|---------|
| `episodic` | Specific events | "Student got frustrated on 2026-01-15" |
| `semantic` | Facts and concepts | "Student understands recursion" |
| `procedural` | Skills and how-tos | "Student prefers step-by-step explanations" |
| `emotional` | Feelings and reactions | "Positive association with coding challenges" |
| `sensory` | Perceptual details | "Mentioned liking dark mode interfaces" |

**Edge Types**:
| Category | Types |
|----------|-------|
| Temporal | `PRECEDES`, `CAUSES`, `ENABLES` |
| Semantic | `RELATES_TO`, `CONTRADICTS`, `SUPPORTS`, `REFINES`, `ABSTRACTS` |
| Emotional | `EVOKES`, `REMINDS_OF` |
| Entity | `INVOLVES`, `ABOUT`, `LOCATED_AT` |

**Node Properties**:
```typescript
interface MemoryNode {
  id: string;
  content: string;           // The memory content
  contentHash: string;       // For integrity verification
  gravity: number;           // 0-1, importance (decays)
  salience: number;          // Initial importance (doesn't decay)
  confidence: number;        // How certain about this memory
  modality: MemoryModality;
  timestamp: Date;
  strength: number;          // Connection strength
  lastAccessed: Date;
  embedding: Float32Array;   // For semantic search
}
```

### 2. Ledger (Lossless)

Critical facts that must never be forgotten or compressed.

**Categories**:
| Category | Description | Example |
|----------|-------------|---------|
| `promise` | Commitments made | "I will help you with your project" |
| `secret` | Confidential information | "Student mentioned bullying" |
| `debt` | Obligations | "Owe explanation about neural networks" |
| `threat` | Safety concerns | "Expression of anxiety about tests" |
| `fact` | Important truths | "Student is dyslexic" |
| `instruction` | Explicit preferences | "Don't give answers, guide me to find them" |
| `observation` | Notable patterns | "Works best in morning sessions" |

**Ledger Entry**:
```typescript
interface LedgerEntry {
  id: string;
  content: string;          // Full content
  summary: string;          // Short version
  category: LedgerCategory;
  importance: number;       // 0-1
  triggerThreshold: number; // When to surface
  triggers: string[];       // Keywords/phrases
  triggerEntities: string[]; // People/places
  isActive: boolean;
  expiresAt?: Date;
}
```

---

## Memory Formation

After each interaction, the AI Companion evaluates whether to form new memories:

```typescript
async function formMemory(interaction: ChatMessage) {
  // Calculate signal-to-noise ratio
  const snr = calculateSNR(interaction.content);
  
  // Low SNR = not worth remembering
  if (snr < 100) return;
  
  // Extract memory nodes
  const nodes = await extractMemoryNodes(interaction);
  
  // Create relationships to existing nodes
  const edges = await findRelatedNodes(nodes, existingGraph);
  
  // Check for ledger-worthy content
  for (const node of nodes) {
    if (await shouldPromoteToLedger(node)) {
      await addToLedger(node);
    }
  }
  
  // Add to graph
  await addNodesToGraph(nodes, edges);
}
```

### SNR-Based Processing

The Signal-to-Noise Ratio determines how much processing a memory gets:

| SNR | Processing | Example |
|-----|------------|---------|
| < 100 | Don't store | "Hello", "Thanks" |
| 100-400 | 1 compression pass | Casual conversation |
| 400-800 | 2 compression passes | Meaningful discussion |
| 800+ | 3 compression passes | Critical revelation |

---

## Compression Algorithm

Memory compression uses a **double-layer** approach:

### Layer 1: Prune

Remove low-gravity nodes while tracking entropy loss:

```typescript
function prunePass(graph: MemoryGraph) {
  const threshold = PHI_CONSTANTS.NOISE_FLOOR; // 0.382
  
  const nodesToRemove = graph.nodes.filter(n => n.gravity < threshold);
  
  // Track what we're losing
  const lossVector = calculateEntropyLoss(nodesToRemove);
  
  // Remove nodes and their edges
  for (const node of nodesToRemove) {
    removeNodeWithEdges(graph, node);
  }
  
  return { graph, lossVector };
}
```

### Layer 2: Cluster & Merge

Use spectral clustering to group related nodes:

```typescript
function clusterPass(graph: MemoryGraph) {
  // Build adjacency matrix from edges
  const adjacency = buildAdjacencyMatrix(graph.edges);
  
  // Spectral clustering
  const clusters = spectralCluster(adjacency, graph.nodes);
  
  // Merge each cluster into a summary node
  for (const cluster of clusters) {
    if (cluster.nodes.length > 1) {
      const summaryNode = mergeNodes(cluster.nodes);
      replaceClusterWithSummary(graph, cluster, summaryNode);
    }
  }
  
  return graph;
}
```

### Phi (φ) Constants

The system uses golden ratio constants:

| Constant | Value | Use |
|----------|-------|-----|
| `φ_NOISE_FLOOR` | 0.382 | Minimum gravity threshold |
| `φ_DENSITY` | 0.618 | Density threshold for clustering |
| `φ` | 1.618 | Golden ratio |
| `φ_MAX_PASSES` | 2.618 | Maximum compression cycles |

---

## Context Building

When the AI Companion needs context for a response:

```typescript
async function buildContext(query: string, graph: MemoryGraph, ledger: LedgerEntry[]) {
  // 1. Find relevant memories by embedding similarity
  const queryEmbedding = await embed(query);
  const relevantNodes = await similaritySearch(queryEmbedding, graph.nodes, {
    limit: 20,
    minSimilarity: 0.7
  });
  
  // 2. Traverse graph for connected context
  const connectedNodes = expandByEdges(relevantNodes, graph.edges, {
    maxHops: 2,
    minEdgeWeight: 0.5
  });
  
  // 3. Trigger ledger entries
  const triggeredLedger = ledger.filter(entry => 
    entry.triggers.some(t => query.toLowerCase().includes(t.toLowerCase()))
  );
  
  // 4. Format for prompt
  return formatContextPrompt({
    memories: [...relevantNodes, ...connectedNodes],
    ledgerEntries: triggeredLedger,
    worldOverlay: await getWorldOverlay(graph.studentId)
  });
}
```

### Context Prompt Format

```
<COMPANION_MEMORY>
You remember about this student:
- They prefer step-by-step explanations [procedural, gravity=0.8]
- Last session they were working on recursion [episodic, 2026-01-15]
- They mentioned struggling with abstract concepts [semantic, gravity=0.7]

Critical facts (ledger):
- [instruction] "Don't give answers, guide me to find them"
- [observation] Works best with visual metaphors
</COMPANION_MEMORY>
```

---

## World Overlay

Each student has a "fog of war" perspective on shared knowledge:

```typescript
interface WorldOverlay {
  studentId: string;
  
  // What concepts the student knows exist
  knownNodes: Set<string>;
  
  // What connections they've discovered
  knownEdges: Set<string>;
  
  // Personal opinions about concepts
  nodeOverrides: Map<string, {
    attitude: number;      // -1 to 1 (dislike to like)
    familiarity: number;   // 0 to 1 (unknown to expert)
    notes: string;         // Personal observations
  }>;
}
```

**Key Principle**: AI Companion can only reference knowledge within the student's overlay. It won't mention concepts they haven't been introduced to yet.

---

## Contradiction Handling

When conflicting memories are detected:

```typescript
async function detectContradiction(nodeA: MemoryNode, nodeB: MemoryNode) {
  // Check semantic contradiction
  const embeddingA = nodeA.embedding;
  const embeddingB = nodeB.embedding;
  
  // High similarity but opposite valence = potential contradiction
  if (cosineSimilarity(embeddingA, embeddingB) > 0.8) {
    if (nodeA.valence * nodeB.valence < 0) {
      return createContradiction(nodeA, nodeB);
    }
  }
  
  // Use LLM to verify
  const llmCheck = await llm.checkContradiction(nodeA.content, nodeB.content);
  if (llmCheck.isContradiction) {
    return createContradiction(nodeA, nodeB);
  }
  
  return null;
}
```

**Resolution Strategies**:
| Strategy | When Used |
|----------|-----------|
| `newer_wins` | Default for factual updates |
| `stronger_wins` | Higher gravity takes precedence |
| `manual` | Flagged for student review |

---

## Gravity Decay

Memory importance decays over time:

```typescript
function applyGravityDecay(node: MemoryNode, now: Date) {
  const daysSinceAccess = (now - node.lastAccessed) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.pow(0.5, daysSinceAccess / HALF_LIFE_DAYS);
  
  // Decay gravity but never below residual
  node.gravity = Math.max(
    node.salience * 0.1,  // Residual (10% of initial)
    node.gravity * decayFactor
  );
  
  return node;
}
```

| Memory Age | Gravity (starting at 1.0) |
|------------|---------------------------|
| 0 days | 1.0 |
| 7 days | 0.5 (half-life) |
| 14 days | 0.25 |
| 30 days | ~0.06 |

Accessing a memory resets its `lastAccessed`, boosting gravity.

---

## Compression Triggers

Compression runs automatically when:

1. **End of session**: Batch compression after student logs out
2. **Node threshold**: When `node_count > MAX_NODES` (default: 1000)
3. **Manual trigger**: Student requests memory cleanup

```typescript
async function maybeCompress(graph: MemoryGraph) {
  if (graph.nodeCount > MAX_NODES) {
    const result = await compress(graph);
    await saveGraph(result);
    await createIntegrityHash(graph.studentId);
  }
}
```

---

## Encryption

All memory content is encrypted with a student-derived key:

```typescript
async function encryptMemory(content: string, studentId: string) {
  // Key derived from student password + institution salt
  // Only student can decrypt
  const key = await deriveKey(studentPassword, INSTITUTION_SALT);
  return encrypt(content, key);
}
```

**Important**: The institution stores encrypted data but cannot read it without student participation.

---

## Integration Points

### Where Memory Forms
1. After each AI chat message
2. After lesson completion
3. After prompt runs
4. Teacher/system injected observations

### Where Memory Is Retrieved
1. Building chat context
2. Generating personalized responses
3. Progress assessments
4. Wellbeing indicators (metadata only for auditor)

---

## Files Structure

```
src/lib/ai/
├── memory.ts           # Zod schemas
├── memory-queries.ts   # CRUD operations
├── compression.ts      # SNR-based compression
├── context-builder.ts  # Context assembly
├── embeddings.ts       # Vector generation
└── auditor.ts          # Safety monitoring (metadata)
```

---

*Last updated: 2026-02-03*
