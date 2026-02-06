/**
 * Job Opening Interview API
 * 
 * POST /api/lattice/jobs - Start new job opening interview
 * GET /api/lattice/jobs - List job openings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { latticeProjections } from '@/lib/db/schema';
import { JobInterviewEngine } from '@/lib/lattice/interview';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Job title is required' },
                { status: 400 }
            );
        }

        // Start interview with Claude
        const engine = new JobInterviewEngine();
        const { message } = await engine.startInterview(title);

        // Create job opening record (as a projection with interview state)
        const now = Math.floor(Date.now() / 1000);

        const [job] = await db.insert(latticeProjections).values({
            name: title,
            description: description || `Job opening: ${title}`,
            category: 'hiring',
            queryText: title,
            queryEmbedding: '[]', // Will be filled after interview
            createdBy: userId,
            organizationId: orgId || null,
            isPublic: 0,
            createdAt: now,
            updatedAt: now,
        }).returning();

        return NextResponse.json({
            success: true,
            jobId: job.id,
            message,
            interviewState: {
                status: 'interviewing',
                messages: [
                    { role: 'assistant', content: message, timestamp: new Date().toISOString() }
                ],
            },
        });
    } catch (error) {
        console.error('Error starting job interview:', error);
        return NextResponse.json(
            { error: 'Failed to start interview' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get job openings (projections created by user/org)
        const jobs = await db
            .select()
            .from(latticeProjections)
            .where(
                orgId
                    ? eq(latticeProjections.organizationId, orgId)
                    : eq(latticeProjections.createdBy, userId)
            )
            .orderBy(desc(latticeProjections.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            success: true,
            jobs: jobs.map(j => ({
                id: j.id,
                title: j.name,
                description: j.description,
                createdAt: j.createdAt,
                hasIdealLattice: j.idealShapeData && j.idealShapeData !== '{}',
            })),
        });
    } catch (error) {
        console.error('Error listing jobs:', error);
        return NextResponse.json(
            { error: 'Failed to list jobs' },
            { status: 500 }
        );
    }
}



