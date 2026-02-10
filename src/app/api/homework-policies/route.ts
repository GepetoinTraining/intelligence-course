import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { homeworkPolicies } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/homework-policies - List homework policies
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const conditions = [];
        if (orgId) {
            conditions.push(eq(homeworkPolicies.organizationId, orgId));
        }

        const result = await db
            .select()
            .from(homeworkPolicies)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(desc(homeworkPolicies.createdAt));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('[homework-policies GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/homework-policies - Create a new homework policy
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const [policy] = await db.insert(homeworkPolicies).values({
            organizationId: orgId,
            methodologyId: body.methodologyId,
            name: body.name,
            description: body.description,
            policyType: body.policyType || 'optional',
            frequencyType: body.frequencyType || 'weekly',
            expectedTimeMinutes: body.expectedTimeMinutes,
            maxTimeMinutes: body.maxTimeMinutes,
            countsTowardsGrade: body.countsTowardsGrade !== false,
            gradeWeightPercent: body.gradeWeightPercent ?? 10,
            allowsLateSubmission: body.allowsLateSubmission !== false,
            latePenaltyPerDay: body.latePenaltyPerDay,
            maxLateDays: body.maxLateDays,
            allowsRevision: body.allowsRevision || false,
            maxRevisions: body.maxRevisions,
            isDefault: body.isDefault || false,
            isActive: body.isActive !== false,
        }).returning();

        return NextResponse.json({ data: policy }, { status: 201 });
    } catch (error) {
        console.error('[homework-policies POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
