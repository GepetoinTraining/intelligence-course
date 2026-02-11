import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receivables } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/receivables - List receivables
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const payerId = searchParams.get('payerId');
    const studentId = searchParams.get('studentId');
    const dueBefore = searchParams.get('dueBefore');
    const dueAfter = searchParams.get('dueAfter');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(receivables.organizationId, orgId));
        }
        if (status) {
            conditions.push(eq(receivables.status, status as any));
        }
        if (payerId) {
            conditions.push(eq(receivables.payerUserId, payerId));
        }
        if (studentId) {
            conditions.push(eq(receivables.studentUserId, studentId));
        }
        if (dueBefore) {
            conditions.push(lte(receivables.dueDate, parseInt(dueBefore)));
        }
        if (dueAfter) {
            conditions.push(gte(receivables.dueDate, parseInt(dueAfter)));
        }

        const result = await db
            .select()
            .from(receivables)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(receivables.dueDate))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching receivables:', error);
        return NextResponse.json({ error: 'Failed to fetch receivables' }, { status: 500 });
    }
}

// POST /api/receivables - Create receivable
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const netAmountCents = (body.originalAmountCents || 0) - (body.discountCents || 0);

        const newRec = await db.insert(receivables).values({
            organizationId: orgId,
            contractId: body.contractId,
            enrollmentId: body.enrollmentId,
            invoiceId: body.invoiceId,
            payerUserId: body.payerUserId,
            studentUserId: body.studentUserId,
            installmentNumber: body.installmentNumber,
            totalInstallments: body.totalInstallments,
            description: body.description || 'Mensalidade',
            referenceMonth: body.referenceMonth,
            originalAmountCents: body.originalAmountCents,
            discountCents: body.discountCents || 0,
            netAmountCents,
            remainingAmountCents: netAmountCents,
            dueDate: body.dueDate,
            competenceDate: body.competenceDate,
            status: 'pending',
            paymentGatewayId: body.paymentGatewayId,
            splitRuleId: body.splitRuleId,
        }).returning();

        return NextResponse.json({ data: newRec[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating receivable:', error);
        return NextResponse.json({ error: 'Failed to create receivable' }, { status: 500 });
    }
}
