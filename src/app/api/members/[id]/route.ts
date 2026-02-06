import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
    teamMembers,
    teamPositions,
    positionPermissions,
    permissionAuditLog,
    users,
    persons
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const updateMemberSchema = z.object({
    positionId: z.string().uuid().optional(),
    memberRole: z.enum(['owner', 'lead', 'member', 'guest', 'observer']).optional(),
    customTitle: z.string().optional().nullable(),
    employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern', 'volunteer']).optional(),
    allocation: z.number().min(0).max(1).optional(),
    reportsToMemberId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
});

// GET /api/members/[id] - Get member details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const [member] = await db
            .select({
                id: teamMembers.id,
                teamId: teamMembers.teamId,
                personId: teamMembers.personId,
                positionId: teamMembers.positionId,
                memberRole: teamMembers.memberRole,
                customTitle: teamMembers.customTitle,
                employmentType: teamMembers.employmentType,
                allocation: teamMembers.allocation,
                reportsToMemberId: teamMembers.reportsToMemberId,
                isActive: teamMembers.isActive,
                startDate: teamMembers.startDate,
                endDate: teamMembers.endDate,
                personName: persons.firstName,
                personEmail: persons.primaryEmail,
                personAvatar: persons.avatarUrl,
                positionName: teamPositions.name,
                positionLevel: teamPositions.level,
                positionType: teamPositions.positionType,
            })
            .from(teamMembers)
            .leftJoin(persons, eq(teamMembers.personId, persons.id))
            .leftJoin(teamPositions, eq(teamMembers.positionId, teamPositions.id))
            .where(eq(teamMembers.id, id))
            .limit(1);

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Get permissions from the position
        const permissions = await db
            .select()
            .from(positionPermissions)
            .where(eq(positionPermissions.positionId, member.positionId));

        return NextResponse.json({
            success: true,
            data: {
                ...member,
                permissions,
            },
        });
    } catch (error) {
        console.error('Error fetching member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/members/[id] - Update member (including position change with permission sync)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: authUserId, orgId } = await auth();
        if (!authUserId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = updateMemberSchema.parse(body);

        // Get current member
        const [currentMember] = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.id, id))
            .limit(1);

        if (!currentMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        const positionChanged = validated.positionId && validated.positionId !== currentMember.positionId;
        const oldPositionId = currentMember.positionId;

        // Validate new position if provided
        if (validated.positionId) {
            const [position] = await db
                .select()
                .from(teamPositions)
                .where(and(
                    eq(teamPositions.id, validated.positionId),
                    eq(teamPositions.organizationId, orgId)
                ))
                .limit(1);

            if (!position) {
                return NextResponse.json({ error: 'Position not found' }, { status: 404 });
            }
        }

        // Update member
        const [updated] = await db
            .update(teamMembers)
            .set({
                positionId: validated.positionId,
                memberRole: validated.memberRole,
                customTitle: validated.customTitle,
                employmentType: validated.employmentType,
                allocation: validated.allocation,
                reportsToMemberId: validated.reportsToMemberId,
                isActive: validated.isActive,
                updatedAt: Date.now(),
            })
            .where(eq(teamMembers.id, id))
            .returning();

        // If position changed, log the permission sync event
        if (positionChanged && validated.positionId) {
            // Get old and new position permissions for audit trail
            const [oldPerms, newPerms] = await Promise.all([
                db.select().from(positionPermissions).where(eq(positionPermissions.positionId, oldPositionId)),
                db.select().from(positionPermissions).where(eq(positionPermissions.positionId, validated.positionId)),
            ]);

            // Log the position change in audit log
            await db.insert(permissionAuditLog).values({
                id: randomUUID(),
                organizationId: orgId,
                action: 'modify',
                targetUserId: currentMember.userId,
                targetPositionId: validated.positionId,
                previousValue: JSON.stringify({
                    positionId: oldPositionId,
                    permissionCount: oldPerms.length,
                }),
                newValue: JSON.stringify({
                    positionId: validated.positionId,
                    permissionCount: newPerms.length,
                }),
                performedBy: authUserId,
                performedAt: Date.now(),
                reason: 'Position changed - permissions automatically synced',
            });
        }

        // Get updated data with position info
        const [memberWithDetails] = await db
            .select({
                id: teamMembers.id,
                teamId: teamMembers.teamId,
                userId: teamMembers.userId,
                positionId: teamMembers.positionId,
                memberRole: teamMembers.memberRole,
                allocation: teamMembers.allocation,
                isActive: teamMembers.isActive,
                positionName: teamPositions.name,
                positionLevel: teamPositions.level,
            })
            .from(teamMembers)
            .leftJoin(teamPositions, eq(teamMembers.positionId, teamPositions.id))
            .where(eq(teamMembers.id, id))
            .limit(1);

        return NextResponse.json({
            success: true,
            data: memberWithDetails,
            positionChanged,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('Error updating member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/members/[id] - Remove member from team
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: authUserId, orgId } = await auth();
        if (!authUserId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get member info for audit
        const [member] = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.id, id))
            .limit(1);

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Soft delete by setting isActive = false and endDate
        await db
            .update(teamMembers)
            .set({
                isActive: false,
                endDate: Date.now(),
                updatedAt: Date.now(),
            })
            .where(eq(teamMembers.id, id));

        // Audit log
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'revoke',
            targetUserId: member.userId,
            targetPositionId: member.positionId,
            previousValue: JSON.stringify({ teamId: member.teamId }),
            performedBy: authUserId,
            performedAt: Date.now(),
            reason: 'Removed from team',
        });

        return NextResponse.json({ success: true, removed: true });
    } catch (error) {
        console.error('Error removing member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
