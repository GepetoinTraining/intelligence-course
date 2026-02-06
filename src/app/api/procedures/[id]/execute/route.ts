/**
 * Procedure Executions API
 * 
 * GET /api/procedures/[id]/execute - List executions for a procedure
 * POST /api/procedures/[id]/execute - Start a new execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    procedureTemplates,
    procedureSteps,
    procedureExecutions,
    stepExecutions,
    users,
} from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { StartExecutionSchema } from '@/lib/validations/procedures';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: procedureId } = await params;

        // Parse query params
        const status = request.nextUrl.searchParams.get('status');
        const entityType = request.nextUrl.searchParams.get('entityType');
        const entityId = request.nextUrl.searchParams.get('entityId');
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

        // Build conditions
        const conditions = [
            eq(procedureExecutions.organizationId, orgId),
            eq(procedureExecutions.procedureId, procedureId),
        ];

        if (status) {
            conditions.push(eq(procedureExecutions.status, status as any));
        }
        if (entityType) {
            conditions.push(eq(procedureExecutions.entityType, entityType));
        }
        if (entityId) {
            conditions.push(eq(procedureExecutions.entityId, entityId));
        }

        const executions = await db.select()
            .from(procedureExecutions)
            .where(and(...conditions))
            .orderBy(desc(procedureExecutions.createdAt))
            .limit(limit);

        // Enrich with user info and current step details
        const enrichedExecutions = await Promise.all(
            executions.map(async (exec) => {
                let assignedUser = null;
                if (exec.assignedUserId) {
                    const user = await db.query.users.findFirst({
                        where: eq(users.id, exec.assignedUserId),
                        columns: { id: true, name: true, avatarUrl: true },
                    });
                    assignedUser = user;
                }

                // Get current steps
                const currentStepIds = JSON.parse(exec.currentStepIds || '[]');
                let currentSteps: any[] = [];
                if (currentStepIds.length > 0) {
                    currentSteps = await db.select()
                        .from(procedureSteps)
                        .where(and(
                            ...currentStepIds.map((id: string) => eq(procedureSteps.id, id))
                        ));
                }

                return {
                    ...exec,
                    assignedUser,
                    currentSteps,
                };
            })
        );

        return NextResponse.json({ executions: enrichedExecutions });

    } catch (error) {
        console.error('Error fetching executions:', error);
        return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: procedureId } = await params;
        const body = await request.json();

        // Verify procedure exists and is active
        const [procedure] = await db.select()
            .from(procedureTemplates)
            .where(and(
                eq(procedureTemplates.id, procedureId),
                eq(procedureTemplates.organizationId, orgId)
            ))
            .limit(1);

        if (!procedure) {
            return NextResponse.json({ error: 'Procedure not found' }, { status: 404 });
        }

        if (procedure.status !== 'active' && procedure.status !== 'draft') {
            return NextResponse.json({
                error: 'Cannot start execution for this procedure status'
            }, { status: 400 });
        }

        // Validate input
        const validation = StartExecutionSchema.safeParse({
            ...body,
            procedureId,
        });
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Get all steps for this procedure
        const steps = await db.select()
            .from(procedureSteps)
            .where(eq(procedureSteps.procedureId, procedureId))
            .orderBy(procedureSteps.displayOrder);

        if (steps.length === 0) {
            return NextResponse.json({
                error: 'Procedure has no steps defined'
            }, { status: 400 });
        }

        // Find start step(s)
        const startSteps = steps.filter(s => s.isStartStep);
        const initialStepIds = startSteps.length > 0
            ? startSteps.map(s => s.id)
            : [steps[0].id]; // Default to first step if no start step marked

        // Calculate target completion time
        let targetCompletionAt = data.targetCompletionAt;
        if (!targetCompletionAt && procedure.targetDurationHours) {
            targetCompletionAt = Date.now() + (procedure.targetDurationHours * 60 * 60 * 1000);
        }

        // Create execution
        const [execution] = await db.insert(procedureExecutions).values({
            organizationId: orgId,
            procedureId,
            entityType: data.entityType,
            entityId: data.entityId,
            status: 'in_progress',
            currentStepIds: JSON.stringify(initialStepIds),
            totalStepCount: steps.length,
            completedStepCount: 0,
            progressPercent: 0,
            startedAt: Date.now(),
            targetCompletionAt,
            assignedUserId: data.assignedUserId || personId,
            collectedData: data.initialData ? JSON.stringify(data.initialData) : '{}',
            triggeredBy: 'manual',
            createdBy: personId,
        }).returning();

        // Create step executions for all steps
        for (const step of steps) {
            const isInitialStep = initialStepIds.includes(step.id);
            await db.insert(stepExecutions).values({
                executionId: execution.id,
                stepId: step.id,
                status: isInitialStep ? 'in_progress' : 'pending',
                startedAt: isInitialStep ? Date.now() : null,
            });
        }

        return NextResponse.json({
            success: true,
            execution,
            currentSteps: steps.filter(s => initialStepIds.includes(s.id)),
        });

    } catch (error) {
        console.error('Error starting execution:', error);
        return NextResponse.json({ error: 'Failed to start execution' }, { status: 500 });
    }
}
