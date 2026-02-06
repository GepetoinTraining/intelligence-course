import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fiscalDocuments, users } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/fiscal-documents - List fiscal documents
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const recipientDocument = searchParams.get('recipientDocument');
    const issuerDocument = searchParams.get('issuerDocument');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const conditions = [eq(fiscalDocuments.organizationId, orgId)];

        if (documentType) {
            conditions.push(eq(fiscalDocuments.documentType, documentType as any));
        }

        if (status) {
            conditions.push(eq(fiscalDocuments.status, status as any));
        }

        if (startDate) {
            conditions.push(gte(fiscalDocuments.issueDate, parseInt(startDate)));
        }

        if (endDate) {
            conditions.push(lte(fiscalDocuments.issueDate, parseInt(endDate)));
        }

        if (recipientDocument) {
            conditions.push(eq(fiscalDocuments.recipientDocument, recipientDocument));
        }

        if (issuerDocument) {
            conditions.push(eq(fiscalDocuments.issuerDocument, issuerDocument));
        }

        const result = await db
            .select()
            .from(fiscalDocuments)
            .where(and(...conditions))
            .orderBy(desc(fiscalDocuments.issueDate))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching fiscal documents:', error);
        return NextResponse.json({ error: 'Failed to fetch fiscal documents' }, { status: 500 });
    }
}

// POST /api/fiscal-documents - Create fiscal document record
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // For NFS-e, competenceDate defaults to issueDate
        const competenceDate = body.competenceDate || body.issueDate;

        const newDocument = await db.insert(fiscalDocuments).values({
            organizationId: orgId,
            documentType: body.documentType,
            documentNumber: body.documentNumber,
            series: body.series,
            accessKey: body.accessKey,
            verificationCode: body.verificationCode,
            issueDate: body.issueDate,
            competenceDate,
            issuerId: body.issuerId,
            issuerDocument: body.issuerDocument,
            issuerName: body.issuerName,
            recipientId: body.recipientId,
            recipientDocument: body.recipientDocument,
            recipientName: body.recipientName,
            totalAmountCents: body.totalAmountCents,
            netAmountCents: body.netAmountCents,
            // Taxes
            issAmountCents: body.issAmountCents,
            issRate: body.issRate,
            pisAmountCents: body.pisAmountCents,
            cofinsAmountCents: body.cofinsAmountCents,
            irAmountCents: body.irAmountCents,
            csllAmountCents: body.csllAmountCents,
            inssAmountCents: body.inssAmountCents,
            // Withholdings
            issWithheld: body.issWithheld ? 1 : 0,
            irWithheld: body.irWithheld ? 1 : 0,
            pisWithheld: body.pisWithheld ? 1 : 0,
            cofinsWithheld: body.cofinsWithheld ? 1 : 0,
            csllWithheld: body.csllWithheld ? 1 : 0,
            inssWithheld: body.inssWithheld ? 1 : 0,
            // Service info
            serviceCode: body.serviceCode,
            serviceDescription: body.serviceDescription,
            cityServiceCode: body.cityServiceCode,
            // Status
            status: body.status || 'draft',
            // Integration
            externalId: body.externalId,
            xmlUrl: body.xmlUrl,
            pdfUrl: body.pdfUrl,
            // Links
            invoiceId: body.invoiceId,
            payableId: body.payableId,
            payrollId: body.payrollId,
        }).returning();

        return NextResponse.json({ data: newDocument[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating fiscal document:', error);
        return NextResponse.json({ error: 'Failed to create fiscal document' }, { status: 500 });
    }
}



