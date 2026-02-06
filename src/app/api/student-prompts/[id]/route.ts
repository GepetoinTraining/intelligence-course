import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { studentPrompts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/student-prompts/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(studentPrompts)
            .where(and(eq(studentPrompts.id, id), eq(studentPrompts.userId, userId)))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching student prompt:', error);
        return NextResponse.json({ error: 'Failed to fetch student prompt' }, { status: 500 });
    }
}

// PATCH /api/student-prompts/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.personalSystemPrompt !== undefined) updateData.personalSystemPrompt = body.personalSystemPrompt;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const updated = await db
            .update(studentPrompts)
            .set(updateData)
            .where(and(eq(studentPrompts.id, id), eq(studentPrompts.userId, userId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating student prompt:', error);
        return NextResponse.json({ error: 'Failed to update student prompt' }, { status: 500 });
    }
}

// DELETE /api/student-prompts/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(studentPrompts)
            .where(and(eq(studentPrompts.id, id), eq(studentPrompts.userId, userId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting student prompt:', error);
        return NextResponse.json({ error: 'Failed to delete student prompt' }, { status: 500 });
    }
}
