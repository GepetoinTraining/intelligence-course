import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const payerId = searchParams.get('payerId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(invoices.organizationId, orgId));
        }

        if (payerId) {
            conditions.push(eq(invoices.payerUserId, payerId));
        }

        if (studentId) {
            conditions.push(eq(invoices.studentUserId, studentId));
        }

        if (status) {
            conditions.push(eq(invoices.status, status as any));
        }

        const result = await db
            .select()
            .from(invoices)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(invoices.dueDate))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

// POST /api/invoices - Create invoice
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Calculate net amount (gross - discount + fees)
        const grossAmount = body.grossAmount || 0;
        const discountAmount = body.discountAmount || 0;
        const feeAmount = body.feeAmount || 0;
        const netAmount = grossAmount - discountAmount + feeAmount;

        const newInvoice = await db.insert(invoices).values({
            organizationId: orgId,
            payerUserId: body.payerUserId,
            payerName: body.payerName,
            payerEmail: body.payerEmail,
            payerTaxId: body.payerTaxId,
            studentUserId: body.studentUserId,
            studentName: body.studentName,
            courseId: body.courseId,
            description: body.description || 'Monthly Tuition',
            grossAmount,
            discountAmount,
            feeAmount,
            netAmount,
            currency: body.currency || 'BRL',
            installmentNumber: body.installmentNumber,
            totalInstallments: body.totalInstallments,
            dueDate: body.dueDate,
            status: 'pending',
            splitConfig: body.splitConfig ? JSON.stringify(body.splitConfig) : '{}',
        }).returning();

        return NextResponse.json({ data: newInvoice[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}



