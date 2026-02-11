/**
 * Knowledge Graph API
 *
 * GET /api/wiki/graph — Returns the org-wide knowledge graph (nodes + edges)
 *
 * Response shape: { nodes: KnowledgeNode[], edges: KnowledgeEdge[], stats: {...} }
 * This is consumed directly by the Mermaid `graph` diagram type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeNodes, knowledgeEdges } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const GraphQuerySchema = z.object({
    nodeType: z.enum(['concept', 'insight', 'skill', 'belief']).optional(),
    subjectArea: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const params = GraphQuerySchema.parse({
            nodeType: searchParams.get('nodeType') || undefined,
            subjectArea: searchParams.get('subjectArea') || undefined,
            limit: searchParams.get('limit') || undefined,
        });

        // Build node conditions
        const conditions: any[] = [
            eq(knowledgeNodes.organizationId, orgId),
            eq(knowledgeNodes.isActive, 1 as any),
        ];

        if (params.nodeType) {
            conditions.push(eq(knowledgeNodes.nodeType, params.nodeType));
        }

        if (params.subjectArea) {
            conditions.push(eq(knowledgeNodes.subjectArea, params.subjectArea));
        }

        // Fetch nodes
        const nodes = await db.select({
            id: knowledgeNodes.id,
            title: knowledgeNodes.title,
            description: knowledgeNodes.description,
            nodeType: knowledgeNodes.nodeType,
            difficulty: knowledgeNodes.difficulty,
            subjectArea: knowledgeNodes.subjectArea,
            wikiArticleId: knowledgeNodes.wikiArticleId,
            courseId: knowledgeNodes.courseId,
            lessonId: knowledgeNodes.lessonId,
            procedureId: knowledgeNodes.procedureId,
            anunciacaoId: knowledgeNodes.anunciacaoId,
        })
            .from(knowledgeNodes)
            .where(and(...conditions))
            .limit(params.limit);

        // Get node IDs for edge lookup
        const nodeIds = new Set(nodes.map(n => n.id));

        // Fetch edges that connect returned nodes
        let edges: {
            id: string;
            sourceNodeId: string;
            targetNodeId: string;
            relationship: string;
            weight: number | null;
            aiSuggested: boolean | null;
            aiConfidence: number | null;
        }[] = [];

        if (nodeIds.size > 0) {
            const allEdges = await db.select({
                id: knowledgeEdges.id,
                sourceNodeId: knowledgeEdges.sourceNodeId,
                targetNodeId: knowledgeEdges.targetNodeId,
                relationship: knowledgeEdges.relationship,
                weight: knowledgeEdges.weight,
                aiSuggested: knowledgeEdges.aiSuggested,
                aiConfidence: knowledgeEdges.aiConfidence,
            })
                .from(knowledgeEdges);

            // Filter to edges where both source and target are in our node set
            edges = allEdges.filter(e =>
                nodeIds.has(e.sourceNodeId) && nodeIds.has(e.targetNodeId)
            );
        }

        // Stats
        const typeCountsRaw = await db.select({
            nodeType: knowledgeNodes.nodeType,
            count: sql<number>`count(*)`,
        })
            .from(knowledgeNodes)
            .where(and(
                eq(knowledgeNodes.organizationId, orgId),
                eq(knowledgeNodes.isActive, 1 as any),
            ))
            .groupBy(knowledgeNodes.nodeType);

        const typeCounts: Record<string, number> = {};
        typeCountsRaw.forEach(r => { typeCounts[r.nodeType] = r.count; });

        return NextResponse.json({
            data: {
                nodes,
                edges,
                stats: {
                    totalNodes: nodes.length,
                    totalEdges: edges.length,
                    byType: typeCounts,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching knowledge graph:', error);
        return NextResponse.json({ error: 'Failed to fetch knowledge graph' }, { status: 500 });
    }
}
