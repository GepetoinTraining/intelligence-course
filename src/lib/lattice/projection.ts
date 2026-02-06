/**
 * Lattice Projection Engine
 * 
 * Core engine for creating projections and calculating shapes
 */

import { db } from '@/lib/db';
import { latticeProjections, latticeProjectionResults, latticeSkillAssessments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { embed } from '@/lib/embeddings/gemini';
import { cosineSimilarity, centroid } from '@/lib/embeddings/vector';
import { getPersonEvidence } from './evidence';
import { SKILLS, getSkillById, getAdjacentSkills, calculateShadowImpact, POSITION_SCALE } from './skills';
import {
    ProjectionCreateSchema,
    type ProjectionCreate,
    type ShapeData,
    type ShadowRegion,
    type MatchResult,
} from './schemas';

// ============================================================================
// Projection Management
// ============================================================================

/**
 * Create a new projection (query lens)
 */
export async function createProjection(
    input: ProjectionCreate,
    createdBy: string
): Promise<string> {
    const validated = ProjectionCreateSchema.parse(input);

    // Generate embedding for the query
    const queryEmbedding = await embed(validated.queryText);

    const id = crypto.randomUUID();

    await db.insert(latticeProjections).values({
        id,
        organizationId: validated.organizationId,
        createdBy,
        name: validated.name,
        description: validated.description,
        queryText: validated.queryText,
        queryEmbedding: JSON.stringify(queryEmbedding),
        category: validated.category,
        shadowExclusions: JSON.stringify(validated.shadowExclusions || []),
        idealShapeData: validated.idealShapeData
            ? JSON.stringify(validated.idealShapeData)
            : null,
        isPublic: validated.isPublic ? 1 : 0,
    });

    return id;
}

/**
 * Get projection by ID
 */
export async function getProjectionById(id: string) {
    const results = await db
        .select()
        .from(latticeProjections)
        .where(eq(latticeProjections.id, id))
        .limit(1);

    if (results.length === 0) return null;

    const row = results[0];
    return {
        ...row,
        queryEmbedding: JSON.parse(row.queryEmbedding) as number[],
        shadowExclusions: JSON.parse(row.shadowExclusions || '[]') as string[],
        idealShapeData: row.idealShapeData
            ? JSON.parse(row.idealShapeData) as Record<string, number>
            : null,
    };
}

/**
 * List projections
 */
export async function listProjections(options: {
    organizationId?: string;
    category?: string;
    isPublic?: boolean;
    createdBy?: string;
    limit?: number;
    offset?: number;
}) {
    let conditions = [];

    if (options.organizationId) {
        conditions.push(eq(latticeProjections.organizationId, options.organizationId));
    }
    if (options.category) {
        conditions.push(eq(latticeProjections.category, options.category as 'hiring' | 'teacher_course' | 'team_composition' | 'self_development' | 'custom'));
    }
    if (options.isPublic !== undefined) {
        conditions.push(eq(latticeProjections.isPublic, options.isPublic ? 1 : 0));
    }
    if (options.createdBy) {
        conditions.push(eq(latticeProjections.createdBy, options.createdBy));
    }

    const results = await db
        .select()
        .from(latticeProjections)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(latticeProjections.createdAt))
        .limit(options.limit || 20)
        .offset(options.offset || 0);

    return results.map(row => ({
        ...row,
        queryEmbedding: JSON.parse(row.queryEmbedding) as number[],
        shadowExclusions: JSON.parse(row.shadowExclusions || '[]') as string[],
        idealShapeData: row.idealShapeData
            ? JSON.parse(row.idealShapeData) as Record<string, number>
            : null,
    }));
}

// ============================================================================
// Shape Calculation
// ============================================================================

/**
 * Project a person's lattice through a projection lens
 */
export async function projectLattice(
    personId: string,
    projectionId: string
): Promise<ShapeData> {
    const projection = await getProjectionById(projectionId);
    if (!projection) {
        throw new Error('Projection not found');
    }

    // Get all evidence for this person
    const evidence = await getPersonEvidence(personId);

    if (evidence.length === 0) {
        return createEmptyShape();
    }

    // Calculate relevance of each evidence to the projection
    const relevantEvidence = evidence.map(e => ({
        ...e,
        projectionRelevance: cosineSimilarity(e.embedding, projection.queryEmbedding),
    })).filter(e => e.projectionRelevance > 0.3); // Threshold

    // Calculate skill positions
    const skillPositions = await calculateSkillPositions(relevantEvidence);

    // Calculate category scores
    const categoryScores = calculateCategoryScores(skillPositions);

    // Detect shadow regions
    const shadowRegions = detectShadowRegions(skillPositions);

    // Calculate overall score
    const overallScore = calculateOverallScore(skillPositions, shadowRegions);

    // Calculate shape bounds for visualization
    const bounds = calculateShapeBounds(relevantEvidence);

    const shapeData: ShapeData = {
        positions: skillPositions,
        categoryScores,
        overallScore,
        totalEvidenceCount: relevantEvidence.length,
        shadowRegions,
        bounds,
    };

    // Increment usage count
    await db
        .update(latticeProjections)
        .set({
            usageCount: (projection.usageCount || 0) + 1,
            updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(latticeProjections.id, projectionId));

    return shapeData;
}

/**
 * Calculate skill positions from evidence
 */
async function calculateSkillPositions(
    evidence: Array<{
        skillScores: Record<string, number>;
        projectionRelevance: number;
    }>
): Promise<Record<string, number>> {
    const positions: Record<string, number> = {};
    const counts: Record<string, number> = {};

    // Initialize all skills at MID
    for (const skill of SKILLS) {
        positions[skill.id] = 0;
        counts[skill.id] = 0;
    }

    // Aggregate evidence scores
    for (const e of evidence) {
        for (const [skillId, score] of Object.entries(e.skillScores)) {
            // Weight by projection relevance
            const weightedScore = score * e.projectionRelevance;
            positions[skillId] = (positions[skillId] || 0) + weightedScore;
            counts[skillId] = (counts[skillId] || 0) + 1;
        }
    }

    // Normalize to position scale (-2 to +2)
    for (const skillId of Object.keys(positions)) {
        if (counts[skillId] > 0) {
            const avgScore = positions[skillId] / counts[skillId];
            // Map from (0.5-1) range to (-2 to +2) range
            // 0.5 → -2, 0.75 → 0, 1.0 → +2
            positions[skillId] = (avgScore - 0.5) * 8 - 2;
            // Clamp to valid range
            positions[skillId] = Math.max(-2, Math.min(2, positions[skillId]));
        }
    }

    return positions;
}

/**
 * Calculate category aggregate scores
 */
function calculateCategoryScores(
    skillPositions: Record<string, number>
): Record<string, number> {
    const categoryScores: Record<string, { sum: number; count: number }> = {};

    for (const skill of SKILLS) {
        const position = skillPositions[skill.id] || 0;

        if (!categoryScores[skill.category]) {
            categoryScores[skill.category] = { sum: 0, count: 0 };
        }

        categoryScores[skill.category].sum += position;
        categoryScores[skill.category].count += 1;
    }

    const result: Record<string, number> = {};
    for (const [category, data] of Object.entries(categoryScores)) {
        result[category] = data.count > 0 ? data.sum / data.count : 0;
    }

    return result;
}

/**
 * Detect shadow regions and their effects
 */
function detectShadowRegions(
    skillPositions: Record<string, number>
): ShadowRegion[] {
    const shadowRegions: ShadowRegion[] = [];

    for (const [skillId, position] of Object.entries(skillPositions)) {
        // Check if in shadow territory (< -1.5)
        if (position < -1.5) {
            const impacts = calculateShadowImpact(skillId, position);

            shadowRegions.push({
                skillId,
                intensity: Math.abs(position + 1) / 1, // 0-1 intensity
                affectedSkills: impacts.map(i => i.affectedSkillId),
                impact: impacts.reduce((sum, i) => sum + i.impact, 0),
            });
        }
    }

    return shadowRegions;
}

/**
 * Calculate overall score (0-100)
 */
function calculateOverallScore(
    skillPositions: Record<string, number>,
    shadowRegions: ShadowRegion[]
): number {
    // Average position, normalized to 0-100
    const total = Object.values(skillPositions).reduce((sum, p) => sum + p, 0);
    const avg = total / Object.keys(skillPositions).length;

    // Map from (-2,+2) to (0,100)
    let score = ((avg + 2) / 4) * 100;

    // Penalty for shadow regions
    const shadowPenalty = shadowRegions.reduce((sum, s) => sum + s.intensity * 10, 0);
    score = Math.max(0, score - shadowPenalty);

    return Math.round(score);
}

/**
 * Calculate shape bounds for 3D visualization
 */
function calculateShapeBounds(
    evidence: Array<{ embedding: number[] }>
): { min: number[]; max: number[]; centroid: number[] } | undefined {
    if (evidence.length === 0) return undefined;

    // Use first 3 dimensions for visualization bounds
    const DIMS = 3;

    const min = new Array(DIMS).fill(Infinity);
    const max = new Array(DIMS).fill(-Infinity);

    for (const e of evidence) {
        for (let d = 0; d < DIMS; d++) {
            min[d] = Math.min(min[d], e.embedding[d]);
            max[d] = Math.max(max[d], e.embedding[d]);
        }
    }

    const cent = centroid(evidence.map(e => e.embedding.slice(0, DIMS)));

    return { min, max, centroid: cent };
}

/**
 * Create empty shape for persons with no evidence
 */
function createEmptyShape(): ShapeData {
    const positions: Record<string, number> = {};
    for (const skill of SKILLS) {
        positions[skill.id] = 0; // All at MID
    }

    return {
        positions,
        categoryScores: {},
        overallScore: 50,
        totalEvidenceCount: 0,
        shadowRegions: [],
    };
}

// ============================================================================
// Matching
// ============================================================================

/**
 * Find matches for a projection
 */
export async function findMatches(
    projectionId: string,
    candidateIds: string[],
    options: {
        minFitScore?: number;
        excludeShadowViolations?: boolean;
        limit?: number;
    } = {}
): Promise<MatchResult[]> {
    const projection = await getProjectionById(projectionId);
    if (!projection) {
        throw new Error('Projection not found');
    }

    const results: MatchResult[] = [];

    for (const personId of candidateIds) {
        const shape = await projectLattice(personId, projectionId);

        // Calculate fit score
        let fitScore = shape.overallScore;

        // Check against ideal shape if available
        if (projection.idealShapeData) {
            const idealFit = calculateIdealFit(shape.positions, projection.idealShapeData);
            fitScore = (fitScore + idealFit) / 2;
        }

        // Check for shadow exclusion violations
        const exclusionViolations = projection.shadowExclusions.filter(
            skillId => shape.shadowRegions.some(s => s.skillId === skillId)
        );

        // Skip if has violations and we're excluding them
        if (options.excludeShadowViolations && exclusionViolations.length > 0) {
            continue;
        }

        // Skip if below minimum fit score
        if (options.minFitScore && fitScore < options.minFitScore) {
            continue;
        }

        // Identify strengths and gaps
        const strengths = Object.entries(shape.positions)
            .filter(([_, position]) => position >= 1)
            .map(([skillId, position]) => ({ skillId, position }))
            .sort((a, b) => b.position - a.position)
            .slice(0, 5);

        const gaps = Object.entries(shape.positions)
            .filter(([_, position]) => position < 0)
            .map(([skillId, position]) => ({
                skillId,
                position,
                required: 0, // Could be from ideal shape
            }))
            .sort((a, b) => a.position - b.position)
            .slice(0, 5);

        results.push({
            personId,
            fitScore,
            shapeData: shape,
            shadowViolations: shape.shadowRegions.map(s => s.skillId),
            exclusionViolations,
            strengths,
            gaps,
        });
    }

    // Sort by fit score and limit
    return results
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, options.limit || 20);
}

/**
 * Calculate fit score against ideal shape
 */
function calculateIdealFit(
    actualPositions: Record<string, number>,
    idealPositions: Record<string, number>
): number {
    let totalDiff = 0;
    let count = 0;

    for (const [skillId, ideal] of Object.entries(idealPositions)) {
        const actual = actualPositions[skillId] || 0;
        const diff = Math.abs(actual - ideal);
        totalDiff += diff;
        count++;
    }

    if (count === 0) return 100;

    // Average difference (0-4 scale) mapped to 0-100
    const avgDiff = totalDiff / count;
    const fit = Math.max(0, 100 - (avgDiff / 4) * 100);

    return Math.round(fit);
}

// ============================================================================
// Shape Comparison
// ============================================================================

/**
 * Compare two shapes
 */
export function compareShapes(
    shapeA: ShapeData,
    shapeB: ShapeData
): {
    similarity: number;
    differences: Array<{ skillId: string; diff: number }>;
    complementary: Array<{ skillId: string; benefit: string }>;
} {
    const differences: Array<{ skillId: string; diff: number }> = [];
    const complementary: Array<{ skillId: string; benefit: string }> = [];

    let totalDiff = 0;
    let count = 0;

    for (const skillId of Object.keys(shapeA.positions)) {
        const posA = shapeA.positions[skillId] || 0;
        const posB = shapeB.positions[skillId] || 0;
        const diff = posA - posB;

        totalDiff += Math.abs(diff);
        count++;

        if (Math.abs(diff) > 1) {
            differences.push({ skillId, diff });
        }

        // Check for complementary skills (one strong, one weak)
        if (posA >= 1 && posB <= -1) {
            complementary.push({
                skillId,
                benefit: 'Person A can mentor Person B'
            });
        } else if (posB >= 1 && posA <= -1) {
            complementary.push({
                skillId,
                benefit: 'Person B can mentor Person A'
            });
        }
    }

    // Similarity score (0-100)
    const avgDiff = count > 0 ? totalDiff / count : 0;
    const similarity = Math.max(0, 100 - (avgDiff / 4) * 100);

    return {
        similarity: Math.round(similarity),
        differences: differences.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)),
        complementary,
    };
}

