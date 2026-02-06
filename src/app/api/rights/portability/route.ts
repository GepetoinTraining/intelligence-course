import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/rights/portability - Package data for migration
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { targetPlatform, format, includeCategories } = body;

        // Create portability package request
        const portabilityRequest = {
            id: crypto.randomUUID(),
            requestedBy: personId,
            targetPlatform: targetPlatform || 'generic',
            format: format || 'json',
            includeCategories: includeCategories || ['all'],
            status: 'processing',
            requestedAt: Math.floor(Date.now() / 1000),
            estimatedCompletionTime: '24 hours',
        };

        return NextResponse.json({
            data: {
                request: portabilityRequest,
                message: 'Portability package request submitted',
                formats: ['json', 'csv', 'xml'],
                categories: [
                    'profile',
                    'memories',
                    'conversations',
                    'progress',
                    'attendance',
                    'enrollments',
                ],
                note: 'You will receive a download link when ready',
            }
        }, { status: 202 });
    } catch (error) {
        console.error('Error creating portability package:', error);
        return NextResponse.json({ error: 'Failed to create portability package' }, { status: 500 });
    }
}



