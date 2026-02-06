import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/profile/sessions - Get active sessions
// Note: Session management is handled by Clerk
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // In production, this would call Clerk's session API
        // For now, return placeholder structure

        return NextResponse.json({
            data: {
                currentSession: {
                    id: 'current',
                    device: 'This device',
                    lastActive: Math.floor(Date.now() / 1000),
                    isCurrent: true,
                },
                otherSessions: [],
                note: 'Session management is available through /user/security',
            }
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}



