import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safetyAlerts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/auditor/alerts - List alerts with filtering (for auditors)
export async function GET(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        const conditions = [];
        if (orgId) conditions.push(eq(safetyAlerts.organizationId, orgId));
        if (level) conditions.push(eq(safetyAlerts.level, level as 'green' | 'yellow' | 'orange' | 'red'));

        let query = db.select().from(safetyAlerts);

        const alerts = await db
            .select()
            .from(safetyAlerts)
            .orderBy(desc(safetyAlerts.detectedAt))
            .limit(limit);

        // Aggregate by level
        const summary = {
            green: alerts.filter(a => a.level === 'green').length,
            yellow: alerts.filter(a => a.level === 'yellow').length,
            orange: alerts.filter(a => a.level === 'orange').length,
            red: alerts.filter(a => a.level === 'red').length,
            unacknowledged: alerts.filter(a => !a.acknowledgedAt).length,
            unresolved: alerts.filter(a => !a.resolvedAt).length,
        };

        return NextResponse.json({ data: alerts, summary });
    } catch (error) {
        console.error('Error fetching auditor alerts:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

