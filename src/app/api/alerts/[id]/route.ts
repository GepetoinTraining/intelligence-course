import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safetyAlerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/alerts/[id] - Get specific alert
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const alert = await db
            .select()
            .from(safetyAlerts)
            .where(eq(safetyAlerts.id, id))
            .limit(1);

        if (alert.length === 0) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        return NextResponse.json({ data: alert[0] });
    } catch (error) {
        console.error('Error fetching alert:', error);
        return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 });
    }
}
