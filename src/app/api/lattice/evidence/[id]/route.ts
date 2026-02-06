/**
 * Lattice Evidence [id] API
 * 
 * GET - Get single evidence
 * DELETE - Remove evidence
 * POST - Contest evidence
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import {
    getEvidenceById,
    removeEvidence,
    contestEvidence
} from '@/lib/lattice/evidence';

interface Context {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;
        const evidence = await getEvidenceById(id);

        if (!evidence) {
            return NextResponse.json(
                { error: 'Evidence not found' },
                { status: 404 }
            );
        }

        // Check ownership (only owner can see their evidence)
        if (evidence.personId !== personId) {
            // TODO: Check if user has share access
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        return NextResponse.json({ data: evidence });
    } catch (error) {
        console.error('Get evidence error:', error);
        return NextResponse.json(
            { error: 'Failed to get evidence' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, context: Context) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;
        const evidence = await getEvidenceById(id);

        if (!evidence) {
            return NextResponse.json(
                { error: 'Evidence not found' },
                { status: 404 }
            );
        }

        // Only owner can delete
        if (evidence.personId !== personId) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        await removeEvidence(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove evidence error:', error);
        return NextResponse.json(
            { error: 'Failed to remove evidence' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest, context: Context) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;
        const body = await request.json();

        // Check action type
        if (body.action === 'contest') {
            const evidence = await getEvidenceById(id);

            if (!evidence) {
                return NextResponse.json(
                    { error: 'Evidence not found' },
                    { status: 404 }
                );
            }

            // Only owner can contest
            if (evidence.personId !== personId) {
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403 }
                );
            }

            await contestEvidence(id, body.reason, personId);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Evidence action error:', error);
        return NextResponse.json(
            { error: 'Failed to perform action' },
            { status: 500 }
        );
    }
}
