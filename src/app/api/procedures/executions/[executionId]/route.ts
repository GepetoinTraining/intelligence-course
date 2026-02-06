/**
 * Step Completion API
 * 
 * POST /api/procedures/executions/[executionId]/complete-step - Complete a step
 * GET /api/procedures/executions/[executionId] - Get execution details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    procedureTemplates,
    procedureSteps,
    procedureTransitions,
    procedureExecutions,
    stepExecutions,
    processDiscoveryEvents,
    users,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { CompleteStepSchema } from '@/lib/validations/procedures';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ executionId: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { executionId } = await params;

        // Get execution
        const [execution] = await db.select()
            .from(procedureExecutions)
            .where(and(
                eq(procedureExecutions.id, executionId),
                eq(procedureExecutions.organizationId, orgId)
            ))
            .limit(1);

        if (!execution) {
            return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
        }

        // Get procedure
        const [procedure] = await db.select()
            .from(procedureTemplates)
            .where(eq(procedureTemplates.id, execution.procedureId));

        // Get all steps for this procedure
        const steps = await db.select()
            .from(procedureSteps)
            .where(eq(procedureSteps.procedureId, execution.procedureId))
            .orderBy(procedureSteps.displayOrder);

        // Get step executions
        const stepExecs = await db.select()
            .from(stepExecutions)
            .where(eq(stepExecutions.executionId, executionId));

        // Get transitions
        const transitions = await db.select()
            .from(procedureTransitions)
            .where(eq(procedureTransitions.procedureId, execution.procedureId));

        // Map step executions to steps
        const stepsWithExecution = steps.map(step => {
            const stepExec = stepExecs.find(se => se.stepId === step.id);
            return {
                ...step,
                execution: stepExec || null,
                outgoingTransitions: transitions.filter(t => t.fromStepId === step.id),
                incomingTransitions: transitions.filter(t => t.toStepId === step.id),
            };
        });

        // Get assigned user info
        let assignedUser = null;
        if (execution.assignedUserId) {
            assignedUser = await db.query.users.findFirst({
                where: eq(users.id, execution.assignedUserId),
                columns: { id: true, name: true, email: true, avatarUrl: true },
            });
        }

        return NextResponse.json({
            execution: {
                ...execution,
                assignedUser,
            },
            procedure,
            steps: stepsWithExecution,
            transitions,
        });

    } catch (error) {
        console.error('Error fetching execution:', error);
        return NextResponse.json({ error: 'Failed to fetch execution' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ executionId: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { executionId } = await params;
        const body = await request.json();

        // Validate input
        const validation = CompleteStepSchema.safeParse({
            ...body,
            executionId,
        });
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Get execution
        const [execution] = await db.select()
            .from(procedureExecutions)
            .where(and(
                eq(procedureExecutions.id, executionId),
                eq(procedureExecutions.organizationId, orgId)
            ))
            .limit(1);

        if (!execution) {
            return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
        }

        if (execution.status !== 'in_progress') {
            return NextResponse.json({
                error: 'Execution is not in progress'
            }, { status: 400 });
        }

        // Get step execution
        const [stepExec] = await db.select()
            .from(stepExecutions)
            .where(and(
                eq(stepExecutions.executionId, executionId),
                eq(stepExecutions.stepId, data.stepId)
            ))
            .limit(1);

        if (!stepExec) {
            return NextResponse.json({ error: 'Step execution not found' }, { status: 404 });
        }

        if (stepExec.status === 'completed') {
            return NextResponse.json({ error: 'Step already completed' }, { status: 400 });
        }

        // Get step details
        const [step] = await db.select()
            .from(procedureSteps)
            .where(eq(procedureSteps.id, data.stepId))
            .limit(1);

        if (!step) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 });
        }

        // Calculate duration
        const now = Date.now();
        const durationMinutes = stepExec.startedAt
            ? Math.round((now - stepExec.startedAt) / 60000)
            : 0;

        // Find the transition to take
        let transitionTakenId: string | null = null;
        let nextStepIds: string[] = [];

        if (step.stepType === 'decision' && data.decisionOutcome) {
            // For decision steps, find the matching transition
            const transitions = await db.select()
                .from(procedureTransitions)
                .where(and(
                    eq(procedureTransitions.fromStepId, step.id),
                    eq(procedureTransitions.label, data.decisionOutcome)
                ));

            if (transitions.length > 0) {
                transitionTakenId = transitions[0].id;
                nextStepIds = transitions.map(t => t.toStepId);
            }
        } else if (data.transitionToStepCode) {
            // Explicit transition specified
            const [nextStep] = await db.select()
                .from(procedureSteps)
                .where(and(
                    eq(procedureSteps.procedureId, execution.procedureId),
                    eq(procedureSteps.stepCode, data.transitionToStepCode)
                ))
                .limit(1);

            if (nextStep) {
                nextStepIds = [nextStep.id];

                // Find transition
                const [transition] = await db.select()
                    .from(procedureTransitions)
                    .where(and(
                        eq(procedureTransitions.fromStepId, step.id),
                        eq(procedureTransitions.toStepId, nextStep.id)
                    ))
                    .limit(1);

                if (transition) {
                    transitionTakenId = transition.id;
                }
            }
        } else {
            // Find default transitions (no condition)
            const transitions = await db.select()
                .from(procedureTransitions)
                .where(eq(procedureTransitions.fromStepId, step.id))
                .orderBy(procedureTransitions.priority);

            nextStepIds = transitions.map(t => t.toStepId);
            if (transitions.length > 0) {
                transitionTakenId = transitions[0].id;
            }
        }

        // Update step execution
        await db.update(stepExecutions)
            .set({
                status: 'completed',
                completedAt: now,
                durationMinutes,
                performedBy: personId,
                decisionOutcome: data.decisionOutcome,
                transitionTakenId,
                stepData: data.stepData ? JSON.stringify(data.stepData) : stepExec.stepData,
                notes: data.notes,
            })
            .where(eq(stepExecutions.id, stepExec.id));

        // Update transition analytics
        if (transitionTakenId) {
            await db.update(procedureTransitions)
                .set({
                    transitionCount: sql`${procedureTransitions.transitionCount} + 1`,
                })
                .where(eq(procedureTransitions.id, transitionTakenId));
        }

        // Start next steps
        for (const nextStepId of nextStepIds) {
            await db.update(stepExecutions)
                .set({
                    status: 'in_progress',
                    startedAt: now,
                })
                .where(and(
                    eq(stepExecutions.executionId, executionId),
                    eq(stepExecutions.stepId, nextStepId),
                    eq(stepExecutions.status, 'pending')
                ));
        }

        // Update collected data
        const collectedData = JSON.parse(execution.collectedData || '{}');
        if (data.stepData) {
            collectedData[step.stepCode] = data.stepData;
        }

        // Count completed steps
        const [completedCount] = await db.select({
            count: sql<number>`COUNT(*)`,
        })
            .from(stepExecutions)
            .where(and(
                eq(stepExecutions.executionId, executionId),
                eq(stepExecutions.status, 'completed')
            ));

        const newCompletedCount = Number(completedCount.count);
        const totalSteps = execution.totalStepCount || 1;
        const progressPercent = Math.round((newCompletedCount / totalSteps) * 100);

        // Check if execution is complete
        const hasEndStep = step.isEndStep;
        const allComplete = newCompletedCount >= totalSteps;
        const noNextSteps = nextStepIds.length === 0 && !step.isEndStep;

        let newStatus: string = execution.status;
        let completedAt = null;
        let overallDuration = null;

        if (hasEndStep || allComplete || noNextSteps) {
            newStatus = 'completed';
            completedAt = now;
            overallDuration = execution.startedAt
                ? Math.round((now - execution.startedAt) / 60000)
                : 0;
        }

        // Update execution
        await db.update(procedureExecutions)
            .set({
                status: newStatus as any,
                currentStepIds: JSON.stringify(nextStepIds),
                completedStepCount: newCompletedCount,
                progressPercent,
                collectedData: JSON.stringify(collectedData),
                completedAt,
                durationMinutes: overallDuration,
                outcomeType: hasEndStep ? 'success' : (noNextSteps ? 'partial' : null),
                updatedAt: now,
            })
            .where(eq(procedureExecutions.id, executionId));

        // Log discovery event for learning
        await db.insert(processDiscoveryEvents).values({
            organizationId: orgId,
            entityType: execution.entityType,
            entityId: execution.entityId,
            eventType: 'step_completed',
            eventName: step.name,
            eventData: JSON.stringify({
                stepCode: step.stepCode,
                stepType: step.stepType,
                durationMinutes,
                decisionOutcome: data.decisionOutcome,
            }),
            actorId: personId,
            occurredAt: now,
            isProcessed: true,
            matchedProcedureId: execution.procedureId,
            matchedStepId: step.id,
            sessionId: executionId,
        });

        // Update step analytics (async, don't wait)
        updateStepAnalytics(step.id).catch(console.error);

        // Get updated next steps info
        const updatedNextSteps = nextStepIds.length > 0
            ? await db.select()
                .from(procedureSteps)
                .where(sql`${procedureSteps.id} IN (${nextStepIds.map(() => '?').join(', ')})`)
            : [];

        return NextResponse.json({
            success: true,
            completedStep: {
                ...step,
                durationMinutes,
            },
            nextSteps: updatedNextSteps,
            execution: {
                status: newStatus,
                progressPercent,
                completedStepCount: newCompletedCount,
                isComplete: newStatus === 'completed',
            },
        });

    } catch (error) {
        console.error('Error completing step:', error);
        return NextResponse.json({ error: 'Failed to complete step' }, { status: 500 });
    }
}

// Update step analytics asynchronously
async function updateStepAnalytics(stepId: string) {
    try {
        // Get all completed executions for this step
        const completedSteps = await db.select({
            durationMinutes: stepExecutions.durationMinutes,
        })
            .from(stepExecutions)
            .where(and(
                eq(stepExecutions.stepId, stepId),
                eq(stepExecutions.status, 'completed')
            ));

        if (completedSteps.length === 0) return;

        // Calculate statistics
        const durations = completedSteps
            .map(s => s.durationMinutes)
            .filter((d): d is number => d !== null)
            .sort((a, b) => a - b);

        if (durations.length === 0) return;

        const medianIndex = Math.floor(durations.length / 2);
        const p90Index = Math.floor(durations.length * 0.9);

        const median = durations.length % 2 === 0
            ? Math.round((durations[medianIndex - 1] + durations[medianIndex]) / 2)
            : durations[medianIndex];

        const p90 = durations[p90Index] || durations[durations.length - 1];

        // Calculate completion rate
        const [totalCount] = await db.select({
            count: sql<number>`COUNT(*)`,
        })
            .from(stepExecutions)
            .where(eq(stepExecutions.stepId, stepId));

        const completionRate = Math.round((completedSteps.length / Number(totalCount.count)) * 100);

        // Update step
        await db.update(procedureSteps)
            .set({
                medianDurationMinutes: median,
                percentile90DurationMinutes: p90,
                completionRate,
                lastAnalyticsUpdate: Date.now(),
            })
            .where(eq(procedureSteps.id, stepId));

    } catch (error) {
        console.error('Error updating step analytics:', error);
    }
}
