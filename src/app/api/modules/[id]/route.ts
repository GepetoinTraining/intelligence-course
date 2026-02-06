import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { modules, lessons } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/modules/[id] - Get module with lessons
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const module = await db
            .select()
            .from(modules)
            .where(eq(modules.id, id))
            .limit(1);

        if (module.length === 0) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        // Get lessons for this module
        const moduleLessons = await db
            .select()
            .from(lessons)
            .where(eq(lessons.moduleId, id))
            .orderBy(asc(lessons.orderIndex));

        return NextResponse.json({
            data: {
                ...module[0],
                lessons: moduleLessons
            }
        });
    } catch (error) {
        console.error('Error fetching module:', error);
        return NextResponse.json({ error: 'Failed to fetch module' }, { status: 500 });
    }
}

// PATCH /api/modules/[id] - Update module
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.title !== undefined) updateData.title = JSON.stringify(body.title);
        if (body.subtitle !== undefined) updateData.subtitle = JSON.stringify(body.subtitle);
        if (body.description !== undefined) updateData.description = JSON.stringify(body.description);
        if (body.emoji !== undefined) updateData.emoji = body.emoji;
        if (body.orderIndex !== undefined) updateData.orderIndex = body.orderIndex;
        if (body.isPublished !== undefined) updateData.isPublished = body.isPublished ? 1 : 0;
        if (body.unlockAfterModuleId !== undefined) updateData.unlockAfterModuleId = body.unlockAfterModuleId;
        if (body.estimatedMinutes !== undefined) updateData.estimatedMinutes = body.estimatedMinutes;

        const updated = await db
            .update(modules)
            .set(updateData)
            .where(eq(modules.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating module:', error);
        return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
    }
}

// DELETE /api/modules/[id] - Archive module
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(modules)
            .set({ archivedAt: Math.floor(Date.now() / 1000) })
            .where(eq(modules.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error archiving module:', error);
        return NextResponse.json({ error: 'Failed to archive module' }, { status: 500 });
    }
}
