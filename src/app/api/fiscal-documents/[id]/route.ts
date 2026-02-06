import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fiscalDocuments, taxWithholdings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/fiscal-documents/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const document = await db
            .select()
            .from(fiscalDocuments)
            .where(
                and(
                    eq(fiscalDocuments.id, id),
                    eq(fiscalDocuments.organizationId, orgId)
                )
            )
            .limit(1);

        if (document.length === 0) {
            return NextResponse.json({ error: 'Fiscal document not found' }, { status: 404 });
        }

        // Get associated withholdings
        const withholdings = await db
            .select()
            .from(taxWithholdings)
            .where(eq(taxWithholdings.fiscalDocumentId, id));

        return NextResponse.json({
            data: {
                ...document[0],
                withholdings,
            }
        });
    } catch (error) {
        console.error('Error fetching fiscal document:', error);
        return NextResponse.json({ error: 'Failed to fetch fiscal document' }, { status: 500 });
    }
}

// PATCH /api/fiscal-documents/[id] - Update status or add integration info
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Date.now(),
        };

        // Allow updating status
        if (body.status !== undefined) {
            updateData.status = body.status;
        }

        // Integration data
        if (body.externalId !== undefined) updateData.externalId = body.externalId;
        if (body.accessKey !== undefined) updateData.accessKey = body.accessKey;
        if (body.verificationCode !== undefined) updateData.verificationCode = body.verificationCode;
        if (body.xmlUrl !== undefined) updateData.xmlUrl = body.xmlUrl;
        if (body.pdfUrl !== undefined) updateData.pdfUrl = body.pdfUrl;

        // Document number (may come from provider)
        if (body.documentNumber !== undefined) updateData.documentNumber = body.documentNumber;
        if (body.series !== undefined) updateData.series = body.series;

        // Cancellation
        if (body.status === 'cancelled') {
            updateData.cancelledAt = Date.now();
            updateData.cancellationReason = body.cancellationReason;
        }

        const updated = await db
            .update(fiscalDocuments)
            .set(updateData)
            .where(
                and(
                    eq(fiscalDocuments.id, id),
                    eq(fiscalDocuments.organizationId, orgId)
                )
            )
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Fiscal document not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating fiscal document:', error);
        return NextResponse.json({ error: 'Failed to update fiscal document' }, { status: 500 });
    }
}

// DELETE /api/fiscal-documents/[id] - Cancel document (cannot truly delete fiscal docs)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const existing = await db
            .select({ status: fiscalDocuments.status })
            .from(fiscalDocuments)
            .where(
                and(
                    eq(fiscalDocuments.id, id),
                    eq(fiscalDocuments.organizationId, orgId)
                )
            )
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Fiscal document not found' }, { status: 404 });
        }

        // Can only delete drafts
        if (existing[0].status !== 'draft') {
            return NextResponse.json({
                error: 'Apenas documentos em rascunho podem ser excluídos. Documentos emitidos devem ser cancelados.'
            }, { status: 400 });
        }

        // Hard delete for drafts
        await db.delete(fiscalDocuments).where(eq(fiscalDocuments.id, id));

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting fiscal document:', error);
        return NextResponse.json({ error: 'Failed to delete fiscal document' }, { status: 500 });
    }
}
