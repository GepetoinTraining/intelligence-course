import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq, and, desc, isNull, gte, lte } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/leads - List leads
export async function GET(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(leads.organizationId, orgId));
        }

        if (status) {
            conditions.push(eq(leads.status, status as any));
        }

        if (assignedTo) {
            conditions.push(eq(leads.assignedTo, assignedTo));
        }

        if (source) {
            conditions.push(eq(leads.source, source as any));
        }

        const result = await db
            .select()
            .from(leads)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(leads.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

// POST /api/leads - Create lead
export async function POST(request: NextRequest) {
    const { userId, orgId } = await auth();

    // Allow unauthenticated lead creation (for forms)
    const body = await request.json();
    const organizationId = orgId || body.organizationId;

    if (!organizationId) {
        return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    try {
        const newLead = await db.insert(leads).values({
            organizationId,
            name: body.name,
            email: body.email,
            phone: body.phone,
            whatsapp: body.whatsapp,
            source: body.source,
            sourceDetail: body.sourceDetail,
            utmSource: body.utmSource,
            utmMedium: body.utmMedium,
            utmCampaign: body.utmCampaign,
            interestedIn: body.interestedIn ? JSON.stringify(body.interestedIn) : '[]',
            currentLevel: body.currentLevel,
            preferredSchedule: body.preferredSchedule,
            status: 'new',
            assignedTo: body.assignedTo,
            referredByUserId: body.referredByUserId,
            notes: body.notes,
        }).returning();

        return NextResponse.json({ data: newLead[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating lead:', error);
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }
}

