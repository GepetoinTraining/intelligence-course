import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payables } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/payables - List payables
export async function GET(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const dueBefore = searchParams.get('dueBefore');
    const dueAfter = searchParams.get('dueAfter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(payables.organizationId, orgId));
        }

        if (status) {
            conditions.push(eq(payables.status, status as any));
        }

        if (category) {
            conditions.push(eq(payables.category, category as any));
        }

        if (dueBefore) {
            conditions.push(lte(payables.dueDate, parseInt(dueBefore)));
        }

        if (dueAfter) {
            conditions.push(gte(payables.dueDate, parseInt(dueAfter)));
        }

        const result = await db
            .select()
            .from(payables)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(payables.dueDate))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching payables:', error);
        return NextResponse.json({ error: 'Failed to fetch payables' }, { status: 500 });
    }
}

// POST /api/payables - Create payable
export async function POST(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newPayable = await db.insert(payables).values({
            organizationId: orgId,
            vendorName: body.vendorName,
            vendorDocument: body.vendorDocument,
            invoiceNumber: body.invoiceNumber,
            invoiceUrl: body.invoiceUrl,
            description: body.description,
            category: body.category || 'other',
            amountCents: body.amountCents,
            issueDate: body.issueDate,
            dueDate: body.dueDate,
            status: 'pending',
            isRecurring: body.isRecurring ? 1 : 0,
            recurrenceInterval: body.recurrenceInterval,
            parentPayableId: body.parentPayableId,
            notes: body.notes,
            createdBy: userId,
        }).returning();

        return NextResponse.json({ data: newPayable[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating payable:', error);
        return NextResponse.json({ error: 'Failed to create payable' }, { status: 500 });
    }
}

