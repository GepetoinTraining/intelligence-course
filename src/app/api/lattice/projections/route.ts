/**
 * Lattice Projections API
 * 
 * POST - Create new projection
 * GET - List projections
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createProjection, listProjections } from '@/lib/lattice/projection';
import { ProjectionCreateSchema, ProjectionQuerySchema } from '@/lib/lattice/schemas';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate
        const validated = ProjectionCreateSchema.parse(body);

        const projectionId = await createProjection(validated, userId);

        return NextResponse.json({
            success: true,
            id: projectionId,
        });
    } catch (error) {
        console.error('Create projection error:', error);

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation error', details: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create projection' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);

        const options = {
            organizationId: searchParams.get('organizationId') || undefined,
            category: searchParams.get('category') || undefined,
            isPublic: searchParams.get('isPublic') === 'true' ? true : undefined,
            createdBy: searchParams.get('mine') === 'true' ? userId : undefined,
            limit: searchParams.get('limit')
                ? parseInt(searchParams.get('limit')!)
                : 20,
            offset: searchParams.get('offset')
                ? parseInt(searchParams.get('offset')!)
                : 0,
        };

        const projections = await listProjections(options);

        return NextResponse.json({
            data: projections,
            pagination: {
                limit: options.limit,
                offset: options.offset,
                hasMore: projections.length === options.limit,
            },
        });
    } catch (error) {
        console.error('List projections error:', error);
        return NextResponse.json(
            { error: 'Failed to list projections' },
            { status: 500 }
        );
    }
}

