import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contractTemplates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/contract-templates - List contract templates
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const conditions = [];
        if (orgId) {
            conditions.push(eq(contractTemplates.organizationId, orgId));
        }

        const templates = await db
            .select()
            .from(contractTemplates)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(desc(contractTemplates.createdAt));

        return NextResponse.json({ data: templates });
    } catch (error) {
        console.error('[contract-templates GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/contract-templates - Create a new contract template
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const [template] = await db.insert(contractTemplates).values({
            organizationId: orgId,
            name: body.name,
            description: body.description,
            contractType: body.contractType || 'enrollment',
            contentMd: body.contentMd || '',
            variables: JSON.stringify(body.variables || []),
            clauseStructure: JSON.stringify(body.clauseStructure || []),
            complexity: body.complexity || 'medium',
            createdBy: personId,
        }).returning();

        return NextResponse.json({ data: template }, { status: 201 });
    } catch (error) {
        console.error('[contract-templates POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
