import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/templates - List email templates
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const templateType = searchParams.get('templateType');
    const triggerEvent = searchParams.get('triggerEvent');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(emailTemplates.organizationId, orgId));
        }

        if (templateType) {
            conditions.push(eq(emailTemplates.templateType, templateType as 'marketing' | 'transactional' | 'notification' | 'system'));
        }

        if (triggerEvent) {
            conditions.push(eq(emailTemplates.triggerEvent, triggerEvent));
        }

        const result = await db
            .select()
            .from(emailTemplates)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(emailTemplates.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

// POST /api/templates - Create template
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newTemplate = await db.insert(emailTemplates).values({
            organizationId: orgId || body.organizationId,
            name: body.name,
            templateType: body.templateType || 'marketing',
            triggerEvent: body.triggerEvent,
            subject: body.subject,
            bodyHtml: body.bodyHtml,
            bodyText: body.bodyText,
            variables: body.variables ? JSON.stringify(body.variables) : '[]',
            isActive: body.isActive !== false ? 1 : 0,
        }).returning();

        return NextResponse.json({ data: newTemplate[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}



