/**
 * Lattice Projection [id] API
 * 
 * GET - Get projection details
 * POST - Execute projection / find matches
 * DELETE - Delete projection
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
    getProjectionById,
    projectLattice,
    findMatches
} from '@/lib/lattice/projection';
import { db } from '@/lib/db';
import { latticeProjections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface Context {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;
        const projection = await getProjectionById(id);

        if (!projection) {
            return NextResponse.json(
                { error: 'Projection not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: projection });
    } catch (error) {
        console.error('Get projection error:', error);
        return NextResponse.json(
            { error: 'Failed to get projection' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest, context: Context) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;
        const body = await request.json();

        // Check action type
        if (body.action === 'project') {
            // Project a single person's lattice
            const personId = body.personId || userId;

            const shape = await projectLattice(personId, id);

            return NextResponse.json({
                data: shape,
                personId,
                projectionId: id,
            });
        }

        if (body.action === 'match') {
            // Find matches among candidates
            const matches = await findMatches(id, body.candidateIds || [], {
                minFitScore: body.minFitScore,
                excludeShadowViolations: body.excludeShadowViolations ?? true,
                limit: body.limit || 20,
            });

            return NextResponse.json({
                data: matches,
                projectionId: id,
            });
        }

        return NextResponse.json(
            { error: 'Invalid action. Use "project" or "match"' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Projection action error:', error);
        return NextResponse.json(
            { error: 'Failed to execute projection' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, context: Context) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;
        const projection = await getProjectionById(id);

        if (!projection) {
            return NextResponse.json(
                { error: 'Projection not found' },
                { status: 404 }
            );
        }

        // Only creator can delete
        if (projection.createdBy !== userId) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        await db
            .delete(latticeProjections)
            .where(eq(latticeProjections.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete projection error:', error);
        return NextResponse.json(
            { error: 'Failed to delete projection' },
            { status: 500 }
        );
    }
}
