/**
 * Lattice Evidence Engine
 * 
 * Core engine for capturing, embedding, and managing evidence points
 */

import { db } from '@/lib/db';
import { latticeEvidence, latticeSkillDefinitions } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { embed, embedBatch } from '@/lib/embeddings/gemini';
import { cosineSimilarity, findMostSimilar } from '@/lib/embeddings/vector';
import { SKILLS, getSkillById } from './skills';
import {
    EvidenceCreateSchema,
    EvidenceQuerySchema,
    EvidenceContestSchema,
    type EvidenceCreate,
    type EvidenceQuery,
} from './schemas';

// ============================================================================
// Evidence Capture
// ============================================================================

/**
 * Capture a new evidence point
 * 
 * 1. Validates input
 * 2. Generates embedding using Gemini
 * 3. Calculates skill relevance scores
 * 4. Stores in database
 */
export async function captureEvidence(input: EvidenceCreate): Promise<string> {
    // Validate input
    const validated = EvidenceCreateSchema.parse(input);

    // Generate embedding for the content
    const contentForEmbedding = validated.context
        ? `${validated.content}\n\nContext: ${validated.context}`
        : validated.content;

    const embedding = await embed(contentForEmbedding);

    // Calculate skill relevance scores
    const skillScores = await calculateSkillRelevance(embedding);

    // Generate ID
    const id = crypto.randomUUID();

    // Store in database
    await db.insert(latticeEvidence).values({
        id,
        personId: validated.personId,
        organizationId: validated.organizationId,
        content: validated.content,
        context: validated.context,
        sourceType: validated.sourceType,
        sourceId: validated.sourceId,
        embedding: JSON.stringify(embedding),
        skillScores: JSON.stringify(skillScores),
        status: 'active',
        capturedAt: Math.floor(Date.now() / 1000),
    });

    return id;
}

/**
 * Calculate skill relevance for evidence embedding
 * Returns map of skillId -> relevance score (0-1)
 */
async function calculateSkillRelevance(
    evidenceEmbedding: number[]
): Promise<Record<string, number>> {
    // Get or create skill embeddings
    const skillEmbeddings = await getSkillEmbeddings();

    const scores: Record<string, number> = {};

    for (const [skillId, skillEmbedding] of Object.entries(skillEmbeddings)) {
        const similarity = cosineSimilarity(evidenceEmbedding, skillEmbedding);
        // Convert from [-1, 1] to [0, 1] range
        const normalizedScore = (similarity + 1) / 2;

        // Only include if above threshold
        if (normalizedScore > 0.5) {
            scores[skillId] = normalizedScore;
        }
    }

    return scores;
}

// Cache for skill embeddings
let skillEmbeddingsCache: Record<string, number[]> | null = null;

/**
 * Get embeddings for all skills (cached)
 */
async function getSkillEmbeddings(): Promise<Record<string, number[]>> {
    if (skillEmbeddingsCache) {
        return skillEmbeddingsCache;
    }

    // Generate embeddings for skill descriptions
    const embeddings: Record<string, number[]> = {};

    const skillTexts = SKILLS.map(skill =>
        `${skill.name}: ${skill.description}. Category: ${skill.category}`
    );

    const embeddedSkills = await embedBatch(skillTexts);

    for (let i = 0; i < SKILLS.length; i++) {
        embeddings[SKILLS[i].id] = embeddedSkills[i];
    }

    skillEmbeddingsCache = embeddings;
    return embeddings;
}

// ============================================================================
// Evidence Queries
// ============================================================================

/**
 * Query evidence points with filters
 */
export async function queryEvidence(query: EvidenceQuery) {
    const validated = EvidenceQuerySchema.parse(query);

    let conditions = [];

    if (validated.personId) {
        conditions.push(eq(latticeEvidence.personId, validated.personId));
    }
    if (validated.organizationId) {
        conditions.push(eq(latticeEvidence.organizationId, validated.organizationId));
    }
    if (validated.sourceType) {
        conditions.push(eq(latticeEvidence.sourceType, validated.sourceType as typeof latticeEvidence.sourceType.enumValues[number]));
    }
    if (validated.status) {
        conditions.push(eq(latticeEvidence.status, validated.status as typeof latticeEvidence.status.enumValues[number]));
    }
    if (validated.capturedAfter) {
        conditions.push(gte(latticeEvidence.capturedAt, validated.capturedAfter));
    }
    if (validated.capturedBefore) {
        conditions.push(lte(latticeEvidence.capturedAt, validated.capturedBefore));
    }

    const results = await db
        .select()
        .from(latticeEvidence)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(latticeEvidence.capturedAt))
        .limit(validated.limit)
        .offset(validated.offset);

    return results.map(row => ({
        ...row,
        embedding: JSON.parse(row.embedding) as number[],
        skillScores: JSON.parse(row.skillScores || '{}') as Record<string, number>,
    }));
}

/**
 * Get evidence by ID
 */
export async function getEvidenceById(id: string) {
    const results = await db
        .select()
        .from(latticeEvidence)
        .where(eq(latticeEvidence.id, id))
        .limit(1);

    if (results.length === 0) return null;

    const row = results[0];
    return {
        ...row,
        embedding: JSON.parse(row.embedding) as number[],
        skillScores: JSON.parse(row.skillScores || '{}') as Record<string, number>,
    };
}

/**
 * Get all evidence for a person
 */
export async function getPersonEvidence(personId: string, status: string = 'active') {
    return queryEvidence({ personId, status: status as 'active', limit: 1000, offset: 0 });
}

// ============================================================================
// Evidence Management
// ============================================================================

/**
 * Contest an evidence point
 */
export async function contestEvidence(
    evidenceId: string,
    reason: string,
    contestedBy: string
): Promise<boolean> {
    const validated = EvidenceContestSchema.parse({ evidenceId, reason });

    await db
        .update(latticeEvidence)
        .set({
            status: 'contested',
            contestReason: validated.reason,
            contestedAt: Math.floor(Date.now() / 1000),
            contestedBy,
        })
        .where(eq(latticeEvidence.id, validated.evidenceId));

    return true;
}

/**
 * Remove an evidence point (soft delete)
 */
export async function removeEvidence(evidenceId: string): Promise<boolean> {
    await db
        .update(latticeEvidence)
        .set({ status: 'removed' })
        .where(eq(latticeEvidence.id, evidenceId));

    return true;
}

/**
 * Merge evidence points (used during compression)
 */
export async function mergeEvidence(
    sourceIds: string[],
    mergedContent: string,
    personId: string,
    organizationId?: string
): Promise<string> {
    // Create new merged evidence
    const newId = await captureEvidence({
        personId,
        organizationId,
        content: mergedContent,
        context: `Merged from ${sourceIds.length} evidence points`,
        sourceType: 'manual_entry',
    });

    // Mark originals as merged
    for (const id of sourceIds) {
        await db
            .update(latticeEvidence)
            .set({ status: 'merged' })
            .where(eq(latticeEvidence.id, id));
    }

    return newId;
}

// ============================================================================
// Similarity Search
// ============================================================================

/**
 * Find evidence similar to a query
 */
export async function findSimilarEvidence(
    queryText: string,
    personId?: string,
    topK: number = 10
): Promise<Array<{ evidence: Awaited<ReturnType<typeof getEvidenceById>>; similarity: number }>> {
    const queryEmbedding = await embed(queryText);

    // Get all active evidence for this person (or all if no personId)
    const evidence = await queryEvidence({
        personId,
        status: 'active',
        limit: 1000,
        offset: 0,
    });

    if (evidence.length === 0) return [];

    // Calculate similarities
    const withSimilarity = evidence.map(e => ({
        evidence: e,
        similarity: cosineSimilarity(queryEmbedding, e.embedding),
    }));

    // Sort and return top K
    return withSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}

/**
 * Find evidence relevant to a skill
 */
export async function findSkillRelevantEvidence(
    skillId: string,
    personId: string,
    topK: number = 20
): Promise<Array<{ evidence: Awaited<ReturnType<typeof getEvidenceById>>; relevance: number }>> {
    const skill = getSkillById(skillId);
    if (!skill) return [];

    // Use skill description as query
    const queryText = `${skill.name}: ${skill.description}`;

    const results = await findSimilarEvidence(queryText, personId, topK);
    return results.map(r => ({ evidence: r.evidence, relevance: r.similarity }));
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get evidence statistics for a person
 */
export async function getEvidenceStats(personId: string) {
    const evidence = await getPersonEvidence(personId);

    const bySource: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const e of evidence) {
        // Count by source type
        bySource[e.sourceType] = (bySource[e.sourceType] || 0) + 1;

        // Aggregate skill scores to categories
        for (const [skillId, score] of Object.entries(e.skillScores)) {
            const skill = getSkillById(skillId);
            if (skill) {
                byCategory[skill.category] = (byCategory[skill.category] || 0) + score;
            }
        }
    }

    return {
        totalCount: evidence.length,
        bySource,
        byCategory,
        oldestEvidence: evidence[evidence.length - 1]?.capturedAt,
        newestEvidence: evidence[0]?.capturedAt,
    };
}

