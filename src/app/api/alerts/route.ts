import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safetyAlerts } from '@/lib/db/schema';
import { eq, desc, and, isNull, isNotNull } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/alerts - List alerts with filtering
export async function GET(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];
        if (orgId) conditions.push(eq(safetyAlerts.organizationId, orgId));
        if (level) conditions.push(eq(safetyAlerts.level, level as 'green' | 'yellow' | 'orange' | 'red'));
        if (studentId) conditions.push(eq(safetyAlerts.studentId, studentId));
        if (status === 'resolved') conditions.push(isNotNull(safetyAlerts.resolvedAt));
        if (status === 'unresolved') conditions.push(isNull(safetyAlerts.resolvedAt));

        const alerts = await db
            .select()
            .from(safetyAlerts)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(safetyAlerts.detectedAt))
            .limit(limit);

        return NextResponse.json({ data: alerts });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

// POST /api/alerts - Create alert
export async function POST(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized - organization required' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            studentId,
            level,
            reason,
            detectedBy
        } = body;

        if (!studentId || !level || !reason) {
            return NextResponse.json({ error: 'studentId, level, and reason required' }, { status: 400 });
        }

        const newAlert = await db.insert(safetyAlerts).values({
            studentId,
            organizationId: orgId,
            level,
            reason,
            detectedBy: detectedBy || 'system',
        }).returning();

        return NextResponse.json({ data: newAlert[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating alert:', error);
        return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }
}

