import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/challenges - List challenges
// Note: Challenges feature is not yet implemented in the schema
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        data: [],
        note: 'Challenges feature is not yet implemented',
    });
}

// POST /api/challenges - Create challenge
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        error: 'Challenges feature is not yet implemented',
    }, { status: 501 });
}



