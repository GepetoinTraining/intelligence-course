import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { missions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/missions - List missions
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const conditions = [];
        if (orgId) {
            conditions.push(eq(missions.organizationId, orgId));
        }

        const result = await db
            .select()
            .from(missions)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(desc(missions.createdAt));

        // Parse JSON fields
        const parsed = result.map(m => ({
            ...m,
            conceptTags: JSON.parse(m.conceptTags || '[]'),
        }));

        return NextResponse.json({ data: parsed });
    } catch (error) {
        console.error('[missions GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/missions - Create a new mission (manual or from AI)
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Support bulk import (array) or single creation
        const items = Array.isArray(body) ? body : [body];
        const created = [];

        for (const item of items) {
            const [mission] = await db.insert(missions).values({
                organizationId: orgId,
                title: item.title,
                description: item.description,
                instructions: item.instructions,
                missionType: item.missionType || 'learning',
                difficulty: item.difficulty || 'intermediate',
                xpReward: item.xpReward || 100,
                conceptTags: JSON.stringify(item.conceptTags || []),
                lessonId: item.lessonId,
                moduleId: item.moduleId,
                createdBy: personId,
                generatedByAi: item.generatedByAi || false,
                aiPromptUsed: item.aiPromptUsed,
                isActive: item.isActive !== false,
                startsAt: item.startsAt,
                expiresAt: item.expiresAt,
            }).returning();
            created.push(mission);
        }

        return NextResponse.json({ data: created.length === 1 ? created[0] : created }, { status: 201 });
    } catch (error) {
        console.error('[missions POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
