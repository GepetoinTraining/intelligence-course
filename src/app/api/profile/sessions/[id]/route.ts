import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/profile/sessions/[id] - End session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // In production, this would call Clerk's API to revoke the session

        return NextResponse.json({
            data: {
                success: true,
                sessionId: id,
                message: 'Session terminated',
                note: 'The device will need to sign in again',
            }
        });
    } catch (error) {
        console.error('Error ending session:', error);
        return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
    }
}
