/**
 * Lattice Evidence API
 * 
 * POST - Capture new evidence
 * GET - Query evidence points
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import {
    captureEvidence,
    queryEvidence,
    getEvidenceStats
} from '@/lib/lattice/evidence';
import { EvidenceCreateSchema, EvidenceQuerySchema } from '@/lib/lattice/schemas';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate and capture
        const validated = EvidenceCreateSchema.parse({
            ...body,
            personId: body.personId || userId, // Default to current user
        });

        const evidenceId = await captureEvidence(validated);

        return NextResponse.json({
            success: true,
            id: evidenceId,
        });
    } catch (error) {
        console.error('Evidence capture error:', error);

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to capture evidence' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);

        // Check if requesting stats
        if (searchParams.get('stats') === 'true') {
            const personId = searchParams.get('personId') || userId;
            const stats = await getEvidenceStats(personId);
            return NextResponse.json({ data: stats });
        }

        // Parse query params
        const query = EvidenceQuerySchema.parse({
            personId: searchParams.get('personId') || userId,
            organizationId: searchParams.get('organizationId'),
            sourceType: searchParams.get('sourceType'),
            status: searchParams.get('status') || 'active',
            capturedAfter: searchParams.get('capturedAfter')
                ? parseInt(searchParams.get('capturedAfter')!)
                : undefined,
            capturedBefore: searchParams.get('capturedBefore')
                ? parseInt(searchParams.get('capturedBefore')!)
                : undefined,
            limit: searchParams.get('limit')
                ? parseInt(searchParams.get('limit')!)
                : 100,
            offset: searchParams.get('offset')
                ? parseInt(searchParams.get('offset')!)
                : 0,
        });

        const evidence = await queryEvidence(query);

        return NextResponse.json({
            data: evidence,
            pagination: {
                limit: query.limit,
                offset: query.offset,
                hasMore: evidence.length === query.limit,
            },
        });
    } catch (error) {
        console.error('Evidence query error:', error);
        return NextResponse.json(
            { error: 'Failed to query evidence' },
            { status: 500 }
        );
    }
}

