/**
 * AI Companion Memory System
 * 
 * A topology-based memory system for AI companions that:
 * - Forms graph-based memories from interactions
 * - Compresses memories using φ-based thresholds
 * - Retrieves relevant context using embeddings
 * - Maintains a ledger of significant events
 * - Respects privacy boundaries
 * 
 * Based on Genesis principles of trust topology and context relevance.
 */

// ============================================================================
// SCHEMA EXPORTS
// ============================================================================

export {
    // Phi Constants
    PHI_CONSTANTS,

    // Node types and schemas
    MemoryNodeSchema,
    MemoryNodeTypeSchema,
    type MemoryNode,
    type MemoryNodeType,

    // Edge types and schemas
    MemoryEdgeSchema,
    MemoryEdgeTypeSchema,
    type MemoryEdge,
    type MemoryEdgeType,

    // Graph schema
    MemoryGraphSchema,
    type MemoryGraph,

    // Ledger types and schemas
    LedgerEntrySchema,
    LedgerCategorySchema,
    type LedgerEntry,
    type LedgerCategory,

    // Session schema
    MemorySessionSchema,
    type MemorySession,

    // Context schemas
    ContextRequestSchema,
    ContextResponseSchema,
    type ContextRequest,
    type ContextResponse,

    // Compression schema
    CompressionReportSchema,
    type CompressionReport,

    // Utility functions
    calculateDecayedGravity,
    isEligibleForPruning,
    cosineSimilarityToRelevance,
    estimateTokens,
} from './memory';

// ============================================================================
// QUERY EXPORTS
// ============================================================================

export {
    // Node operations
    createMemoryNode,
    getMemoryNode,
    getMemoryNodes,
    updateMemoryNode,
    strengthenNode,
    deleteMemoryNode,

    // Edge operations
    createMemoryEdge,
    getNodeEdges,
    getConnectedNodes,
    strengthenEdge,
    deleteMemoryEdge,

    // Ledger operations
    createLedgerEntry,
    getLedgerEntries,
    acknowledgeLedgerEntry,
    contestLedgerEntry,

    // Session operations
    startSession,
    endSession,
    incrementSessionCounters,

    // Graph operations
    getMemoryGraph,
    clearAllMemory,
    exportMemoryGraph,
} from './memory-queries';

// ============================================================================
// COMPRESSION EXPORTS
// ============================================================================

export {
    // Layer operations
    pruneLayer1,
    clusterLayer2,

    // Full compression
    runCompression,
    type CompressionOptions,

    // Triggers
    shouldTriggerCompression,
    endOfSessionCompression,

    // Decay
    decayNodes,
} from './compression';

// ============================================================================
// CONTEXT BUILDER EXPORTS
// ============================================================================

export {
    // Main context building
    buildContext,

    // Memory formation
    formMemory,

    // Ledger evaluation
    evaluateForLedger,

    // Contradiction handling
    resolveContradiction,

    // World state
    getWorldOverlay,
} from './context-builder';

// ============================================================================
// MCP BRIDGE EXPORTS
// ============================================================================

export {
    // MCP Tool Definitions
    MEMORY_MCP_TOOLS,

    // Tool Execution
    executeMemoryTool,
    type MCPToolResult,

    // Context for Prompts
    getMemoryContextForPrompt,

    // Session Management
    startMemorySession,
    endMemorySession,

    // Database Sync
    syncGraphToDatabase,
} from './mcp-memory-bridge';

// ============================================================================
// SYNAPSE EXECUTOR EXPORTS
// ============================================================================

export {
    // Enhanced executor (uses Memory Topology)
    executeSynapseToolV2,
} from './synapse-executor-v2';

export {
    // Legacy tools
    SYNAPSE_TOOLS,
} from './synapse-tools';

// ============================================================================
// AI AUDITOR EXPORTS (Ethics & Wellbeing)
// ============================================================================

export {
    // Core Auditor
    AIAuditor,
    getAuditor,

    // Integration Hooks
    onSessionEnd,
    generateStudentWellbeingReport,
    verifyStudentMemoryIntegrity,

    // Types
    type EscalationLevel,
    type RiskIndicator,
    type WellbeingReport,
    type SessionMetadata,
    type AuditEntry,

    // Schemas
    EscalationLevelSchema,
    SessionMetadataSchema,
    RiskIndicatorSchema,
    WellbeingReportSchema,
    AuditEntrySchema,
} from './auditor';

// ============================================================================
// STUDENT RIGHTS & ENCRYPTION EXPORTS (LGPD)
// ============================================================================

export {
    // Grouped exports
    StudentRights,
    Encryption,
    Recovery,
    DomainAccess,
    Consent,

    // Individual functions - Rights
    exerciseRightOfAccess,
    exerciseRightOfRectification,
    exerciseRightOfDeletion,
    exerciseRightOfPortability,
    getRememberingAgreement,
    updateRememberingAgreement,

    // Individual functions - Encryption
    deriveKey,
    generateStudentKey,
    encryptRelationalData,
    decryptRelationalData,

    // Individual functions - Recovery
    initiateKeyRecovery,
    completeKeyRecovery,

    // Individual functions - Access Control
    canAccessDomain,
    filterByDomainAccess,

    // Individual functions - Consent
    recordParentConsent,
    hasValidConsent,

    // Types
    type DataDomain,
    type EncryptedPayload,
    type DataExport,
    type DeletionRequest,
    type RememberingAgreement,
    type AccessContext,
    type ConsentRecord,

    // Schemas
    DataDomainSchema,
    EncryptedPayloadSchema,
    DataExportSchema,
    DeletionRequestSchema,
    RememberingAgreementSchema,
} from './student-rights';

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

import { startSession, endSession, incrementSessionCounters } from './memory-queries';
import { buildContext } from './context-builder';
import { endOfSessionCompression } from './compression';
import { PHI_CONSTANTS } from './memory';
import type { ContextRequest, ContextResponse, MemorySession, CompressionReport } from './memory';

/**
 * Complete session lifecycle wrapper
 */
export async function runMemorySession(
    studentId: string,
    companionId?: string
): Promise<{
    session: MemorySession;
    buildContext: (message: string, embedding?: number[]) => Promise<ContextResponse>;
    recordInteraction: (type: 'message' | 'node' | 'edge') => Promise<void>;
    end: (emotionalProfile?: MemorySession['emotionalProfile'], topics?: string[]) => Promise<{
        session: MemorySession;
        compression: CompressionReport | null;
    }>;
}> {
    const session = await startSession(studentId, companionId);

    return {
        session,

        async buildContext(message: string, embedding?: number[]): Promise<ContextResponse> {
            const request: ContextRequest = {
                studentId,
                currentMessage: message,
                currentEmbedding: embedding,
                maxNodes: 10,
                minGravity: PHI_CONSTANTS.NOISE_FLOOR,
                includeLedger: true,
                maxLedgerEntries: 5,
            };
            return buildContext(request);
        },

        async recordInteraction(type: 'message' | 'node' | 'edge'): Promise<void> {
            await incrementSessionCounters(studentId, session.id, {
                messages: type === 'message' ? 1 : 0,
                nodes: type === 'node' ? 1 : 0,
                edges: type === 'edge' ? 1 : 0,
            });
        },

        async end(emotionalProfile, topics): Promise<{
            session: MemorySession;
            compression: CompressionReport | null;
        }> {
            const endedSession = await endSession(studentId, session.id, emotionalProfile, topics);
            const compression = await endOfSessionCompression(studentId, session.id);

            return {
                session: endedSession!,
                compression,
            };
        },
    };
}

/**
 * Quick context retrieval for a message
 */
export async function getContextForMessage(
    studentId: string,
    message: string,
    embedding?: number[]
): Promise<string> {
    const response = await buildContext({
        studentId,
        currentMessage: message,
        currentEmbedding: embedding,
        maxNodes: 8,
        minGravity: PHI_CONSTANTS.NOISE_FLOOR,
        includeLedger: true,
        maxLedgerEntries: 3,
    }, {
        formatStyle: 'narrative',
        maxTokens: 1000,
    });

    return response.formattedContext;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize memory system for a new student
 */
export async function initializeStudentMemory(
    studentId: string,
    initialData?: {
        name?: string;
        age?: number;
        grade?: string;
    }
): Promise<void> {
    const { createMemoryNode, createLedgerEntry } = await import('./memory-queries');

    // Create initial fact nodes if data provided
    if (initialData?.name) {
        await createMemoryNode(studentId, {
            type: 'fact',
            content: `Student's name is ${initialData.name}`,
            gravity: 5.0, // High gravity for name
            privacyLevel: 'public',
        });
    }

    if (initialData?.age) {
        await createMemoryNode(studentId, {
            type: 'fact',
            content: `Student is ${initialData.age} years old`,
            gravity: 3.0,
            privacyLevel: 'family',
        });
    }

    if (initialData?.grade) {
        await createMemoryNode(studentId, {
            type: 'learning',
            content: `Student is in ${initialData.grade}`,
            gravity: 2.0,
            privacyLevel: 'public',
        });
    }

    // Create welcome ledger entry
    await createLedgerEntry(studentId, {
        category: 'milestone',
        title: 'First meeting',
        summary: 'Started our journey together',
        significance: 8,
        emotionalWeight: 0.8,
        relatedNodeIds: [],
    });

    console.log(`🌟 Initialized memory for student ${studentId}`);
}

