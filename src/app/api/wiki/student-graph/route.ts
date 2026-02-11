/**
 * Student Knowledge Graph API
 *
 * GET /api/wiki/student-graph — Returns the authenticated student's personal mastery graph
 *
 * Response: { masteryData[], stats: { total, mastered, practicing, introduced } }
 * Joins studentKnowledge with knowledgeNodes to return enriched mastery info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { studentKnowledge, knowledgeNodes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch student mastery joined with node metadata
        const masteryData = await db.select({
            // Student knowledge fields
            id: studentKnowledge.id,
            mastery: studentKnowledge.mastery,
            source: studentKnowledge.source,
            viewCount: studentKnowledge.viewCount,
            timeSpentSeconds: studentKnowledge.timeSpentSeconds,
            assessmentScore: studentKnowledge.assessmentScore,
            lastInteractedAt: studentKnowledge.lastInteractedAt,
            // Knowledge node fields
            nodeId: knowledgeNodes.id,
            nodeTitle: knowledgeNodes.title,
            nodeType: knowledgeNodes.nodeType,
            nodeDescription: knowledgeNodes.description,
            difficulty: knowledgeNodes.difficulty,
            subjectArea: knowledgeNodes.subjectArea,
        })
            .from(studentKnowledge)
            .innerJoin(knowledgeNodes, eq(studentKnowledge.nodeId, knowledgeNodes.id))
            .where(and(
                eq(studentKnowledge.personId, personId),
                eq(studentKnowledge.organizationId, orgId),
            ));

        // Compute stats
        const stats = {
            total: masteryData.length,
            mastered: masteryData.filter(m => m.mastery === 'mastered').length,
            practicing: masteryData.filter(m => m.mastery === 'practicing').length,
            introduced: masteryData.filter(m => m.mastery === 'introduced').length,
            notStarted: masteryData.filter(m => m.mastery === 'not_started').length,
            totalTimeMinutes: Math.round(
                masteryData.reduce((sum, m) => sum + (m.timeSpentSeconds || 0), 0) / 60
            ),
        };

        return NextResponse.json({
            data: {
                masteryData,
                stats,
            },
        });
    } catch (error) {
        console.error('Error fetching student knowledge graph:', error);
        return NextResponse.json({ error: 'Failed to fetch student graph' }, { status: 500 });
    }
}
