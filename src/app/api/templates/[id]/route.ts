import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/templates/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(emailTemplates)
            .where(eq(emailTemplates.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

// PATCH /api/templates/[id]
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

        if (body.name !== undefined) updateData.name = body.name;
        if (body.templateType !== undefined) updateData.templateType = body.templateType;
        if (body.triggerEvent !== undefined) updateData.triggerEvent = body.triggerEvent;
        if (body.subject !== undefined) updateData.subject = body.subject;
        if (body.bodyHtml !== undefined) updateData.bodyHtml = body.bodyHtml;
        if (body.bodyText !== undefined) updateData.bodyText = body.bodyText;
        if (body.variables !== undefined) updateData.variables = JSON.stringify(body.variables);
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

        const updated = await db
            .update(emailTemplates)
            .set(updateData)
            .where(eq(emailTemplates.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}

// DELETE /api/templates/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(emailTemplates)
            .set({ isActive: 0, updatedAt: Math.floor(Date.now() / 1000) })
            .where(eq(emailTemplates.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deactivating template:', error);
        return NextResponse.json({ error: 'Failed to deactivate template' }, { status: 500 });
    }
}
