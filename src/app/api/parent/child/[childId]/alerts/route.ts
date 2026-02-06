import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safetyAlerts, familyLinks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ childId: string }>;
}

// GET /api/parent/child/[childId]/alerts - Alerts relevant to this child (sanitized)
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;

    try {
        // Verify parent-child relationship
        const familyLink = await db
            .select()
            .from(familyLinks)
            .where(and(eq(familyLinks.parentId, personId), eq(familyLinks.studentId, childId)))
            .limit(1);

        if (familyLink.length === 0) {
            return NextResponse.json({ error: 'No relationship found' }, { status: 403 });
        }

        // Get alerts for this child - sanitized for parent view
        const alerts = await db
            .select({
                id: safetyAlerts.id,
                level: safetyAlerts.level,
                detectedAt: safetyAlerts.detectedAt,
                acknowledgedAt: safetyAlerts.acknowledgedAt,
                resolvedAt: safetyAlerts.resolvedAt,
            })
            .from(safetyAlerts)
            .where(eq(safetyAlerts.studentId, childId))
            .orderBy(desc(safetyAlerts.detectedAt))
            .limit(20);

        // Provide context without revealing sensitive details
        const sanitizedAlerts = alerts.map(alert => ({
            ...alert,
            description: getParentFriendlyDescription(alert.level),
            actionRequired: !alert.resolvedAt && ['yellow', 'orange', 'red'].includes(alert.level),
        }));

        return NextResponse.json({
            data: sanitizedAlerts,
            note: 'Alert details are summarized to protect student privacy while keeping parents informed.',
        });
    } catch (error) {
        console.error('Error fetching child alerts:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

function getParentFriendlyDescription(level: string): string {
    switch (level) {
        case 'green':
            return 'Routine observation - no action needed';
        case 'yellow':
            return 'Mild concern noted - school is monitoring';
        case 'orange':
            return 'Moderate concern - please contact school coordinator';
        case 'red':
            return 'Urgent matter - you will be contacted directly';
        default:
            return 'Status update';
    }
}
