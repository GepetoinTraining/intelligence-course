/**
 * Lattice HR Zod Schemas
 * 
 * Type-safe validation for all Lattice data structures
 */

import { z } from 'zod';
import { SKILL_CATEGORIES, POSITION_SCALE } from './skills';

// ============================================================================
// Enums
// ============================================================================

export const SkillCategorySchema = z.enum(SKILL_CATEGORIES);

export const PositionLevelSchema = z.number()
    .min(POSITION_SCALE.SHADOW)
    .max(POSITION_SCALE.CORE);

export const EvidenceSourceTypeSchema = z.enum([
    'ai_conversation',
    'peer_feedback',
    'self_reflection',
    'workshop_completion',
    'capstone_submission',
    'challenge_attempt',
    'collaboration',
    'conflict_resolution',
    'teaching_moment',
    'pressure_response',
    'manual_entry',
]);

export const EvidenceStatusSchema = z.enum([
    'active',
    'contested',
    'removed',
    'merged',
]);

export const ProjectionCategorySchema = z.enum([
    'hiring',
    'teacher_course',
    'team_composition',
    'self_development',
    'custom',
]);

export const ShareStatusSchema = z.enum([
    'active',
    'expired',
    'revoked',
]);

// ============================================================================
// Evidence Schemas
// ============================================================================

export const EmbeddingSchema = z.array(z.number()).length(768);

export const EvidenceCreateSchema = z.object({
    personId: z.string().min(1),
    organizationId: z.string().optional(),
    content: z.string().min(1).max(10000),
    context: z.string().max(2000).optional(),
    sourceType: EvidenceSourceTypeSchema,
    sourceId: z.string().optional(),
});

export const EvidenceSchema = EvidenceCreateSchema.extend({
    id: z.string(),
    embedding: EmbeddingSchema,
    skillScores: z.record(z.string(), z.number()).optional(),
    status: EvidenceStatusSchema,
    contestReason: z.string().optional(),
    contestedAt: z.number().optional(),
    contestedBy: z.string().optional(),
    capturedAt: z.number(),
    createdAt: z.number(),
});

export const EvidenceQuerySchema = z.object({
    personId: z.string().optional(),
    organizationId: z.string().optional(),
    sourceType: EvidenceSourceTypeSchema.optional(),
    status: EvidenceStatusSchema.optional(),
    capturedAfter: z.number().optional(),
    capturedBefore: z.number().optional(),
    limit: z.number().min(1).max(1000).default(100),
    offset: z.number().min(0).default(0),
});

export const EvidenceContestSchema = z.object({
    evidenceId: z.string(),
    reason: z.string().min(10).max(500),
});

// ============================================================================
// Projection Schemas
// ============================================================================

export const ProjectionCreateSchema = z.object({
    organizationId: z.string().optional(),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    queryText: z.string().min(10).max(5000),
    category: ProjectionCategorySchema.default('custom'),
    shadowExclusions: z.array(z.string()).optional(),
    idealShapeData: z.record(z.string(), z.number()).optional(),
    isPublic: z.boolean().default(false),
});

export const ProjectionSchema = ProjectionCreateSchema.extend({
    id: z.string(),
    createdBy: z.string(),
    queryEmbedding: EmbeddingSchema,
    usageCount: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

export const ProjectionQuerySchema = z.object({
    organizationId: z.string().optional(),
    category: ProjectionCategorySchema.optional(),
    isPublic: z.boolean().optional(),
    search: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
});

// ============================================================================
// Sharing Schemas
// ============================================================================

export const ShareCreateSchema = z.object({
    granteeId: z.string().optional(),
    granteeEmail: z.string().email().optional(),
    projectionId: z.string().optional(),
    canSeeShape: z.boolean().default(true),
    canSeePoints: z.boolean().default(false),
    canSeeTimeline: z.boolean().default(false),
    expiresAt: z.number().optional(),
    maxViews: z.number().min(1).optional(),
});

export const ShareSchema = ShareCreateSchema.extend({
    id: z.string(),
    ownerId: z.string(),
    accessToken: z.string().optional(),
    viewCount: z.number(),
    status: ShareStatusSchema,
    createdAt: z.number(),
    lastAccessedAt: z.number().optional(),
});

export const ShareAccessSchema = z.object({
    accessToken: z.string(),
});

// ============================================================================
// Skill Assessment Schemas
// ============================================================================

export const SkillAssessmentSchema = z.object({
    id: z.string(),
    personId: z.string(),
    skillId: z.string(),
    position: PositionLevelSchema,
    confidence: z.number().min(0).max(1),
    evidenceCount: z.number().min(0),
    castsShadow: z.boolean(),
    shadowIntensity: z.number().min(0).max(1),
    lastCalculatedAt: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

export const SkillPositionMapSchema = z.record(z.string(), z.object({
    position: PositionLevelSchema,
    confidence: z.number().min(0).max(1),
    evidenceCount: z.number(),
}));

// ============================================================================
// Shape Schemas
// ============================================================================

export const ShadowRegionSchema = z.object({
    skillId: z.string(),
    intensity: z.number().min(0).max(1),
    affectedSkills: z.array(z.string()),
    impact: z.number(),
});

export const ShapeDataSchema = z.object({
    // Skill positions
    positions: z.record(z.string(), PositionLevelSchema),

    // Category aggregates
    categoryScores: z.record(z.string(), z.number()),

    // Overall metrics
    overallScore: z.number().min(-100).max(100),
    totalEvidenceCount: z.number(),

    // Shadow analysis
    shadowRegions: z.array(ShadowRegionSchema),

    // Shape boundaries (for visualization)
    bounds: z.object({
        min: z.array(z.number()),
        max: z.array(z.number()),
        centroid: z.array(z.number()),
    }).optional(),
});

export const ProjectionResultSchema = z.object({
    id: z.string(),
    personId: z.string(),
    projectionId: z.string(),
    shapeData: ShapeDataSchema,
    shadowRegions: z.array(ShadowRegionSchema),
    fitScore: z.number().min(0).max(100).optional(),
    exclusionViolations: z.array(z.string()),
    evidencePointsUsed: z.number(),
    timeRangeStart: z.number().optional(),
    timeRangeEnd: z.number().optional(),
    calculatedAt: z.number(),
    expiresAt: z.number().optional(),
});

// ============================================================================
// Matching Schemas
// ============================================================================

export const MatchResultSchema = z.object({
    personId: z.string(),
    personName: z.string().optional(),
    fitScore: z.number().min(0).max(100),
    shapeData: ShapeDataSchema,
    shadowViolations: z.array(z.string()),
    exclusionViolations: z.array(z.string()),
    strengths: z.array(z.object({
        skillId: z.string(),
        position: z.number(),
    })),
    gaps: z.array(z.object({
        skillId: z.string(),
        position: z.number(),
        required: z.number(),
    })),
});

export const MatchQuerySchema = z.object({
    projectionId: z.string(),
    candidateIds: z.array(z.string()).optional(),
    organizationId: z.string().optional(),
    minFitScore: z.number().min(0).max(100).optional(),
    excludeShadowViolations: z.boolean().default(true),
    limit: z.number().min(1).max(100).default(20),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Evidence = z.infer<typeof EvidenceSchema>;
export type EvidenceCreate = z.infer<typeof EvidenceCreateSchema>;
export type EvidenceQuery = z.infer<typeof EvidenceQuerySchema>;
export type EvidenceContest = z.infer<typeof EvidenceContestSchema>;

export type Projection = z.infer<typeof ProjectionSchema>;
export type ProjectionCreate = z.infer<typeof ProjectionCreateSchema>;
export type ProjectionQuery = z.infer<typeof ProjectionQuerySchema>;

export type Share = z.infer<typeof ShareSchema>;
export type ShareCreate = z.infer<typeof ShareCreateSchema>;
export type ShareAccess = z.infer<typeof ShareAccessSchema>;

export type SkillAssessment = z.infer<typeof SkillAssessmentSchema>;
export type SkillPositionMap = z.infer<typeof SkillPositionMapSchema>;

export type ShadowRegion = z.infer<typeof ShadowRegionSchema>;
export type ShapeData = z.infer<typeof ShapeDataSchema>;
export type ProjectionResult = z.infer<typeof ProjectionResultSchema>;

export type MatchResult = z.infer<typeof MatchResultSchema>;
export type MatchQuery = z.infer<typeof MatchQuerySchema>;

