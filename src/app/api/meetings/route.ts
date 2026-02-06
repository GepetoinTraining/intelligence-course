/**
 * Meetings API
 * 
 * GET /api/meetings - List meetings (with calendar filtering)
 * POST /api/meetings - Create a new meeting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    meetings,
    meetingParticipants,
    users,
    userRoleAssignments,
    organizationalRoles,
    roleRelationships,
    activityFeed,
} from '@/lib/db/schema';
import { eq, and, or, gte, lte, desc, inArray } from 'drizzle-orm';
import { CreateMeetingSchema, CalendarQuerySchema } from '@/lib/validations/calendar';

// Helper: Check if user can schedule with targets
async function checkSchedulePermission(
    orgId: string,
    organizerId: string,
    targetUserIds: string[],
    meetingType: string
): Promise<{ canSchedule: boolean; requiresApproval: boolean; approverId?: string; reason?: string }> {
    // Get organizer's roles
    const organizerRoles = await db.select({
        roleId: userRoleAssignments.roleId,
        hierarchyLevel: organizationalRoles.hierarchyLevel,
        permissions: organizationalRoles.permissions,
    })
        .from(userRoleAssignments)
        .innerJoin(organizationalRoles, eq(userRoleAssignments.roleId, organizationalRoles.id))
        .where(and(
            eq(userRoleAssignments.userId, organizerId),
            eq(organizationalRoles.organizationId, orgId)
        ));

    if (organizerRoles.length === 0) {
        return { canSchedule: false, requiresApproval: false, reason: 'User has no assigned roles' };
    }

    // Get highest hierarchy level
    const maxHierarchy = Math.max(...organizerRoles.map(r => r.hierarchyLevel));

    // Owner can schedule with anyone
    if (maxHierarchy >= 100) {
        return { canSchedule: true, requiresApproval: false };
    }

    // Check permissions
    const allPermissions = organizerRoles.flatMap(r => {
        try {
            return JSON.parse(r.permissions || '[]');
        } catch {
            return [];
        }
    });

    // Check for schedule:all permission
    if (allPermissions.includes('schedule:all') || allPermissions.includes('*')) {
        return { canSchedule: true, requiresApproval: false };
    }

    // Get target users' roles to check relationships
    for (const targetId of targetUserIds) {
        if (targetId === organizerId) continue;

        const targetRoles = await db.select({
            roleId: userRoleAssignments.roleId,
            hierarchyLevel: organizationalRoles.hierarchyLevel,
        })
            .from(userRoleAssignments)
            .innerJoin(organizationalRoles, eq(userRoleAssignments.roleId, organizationalRoles.id))
            .where(and(
                eq(userRoleAssignments.userId, targetId),
                eq(organizationalRoles.organizationId, orgId)
            ));

        if (targetRoles.length === 0) continue;

        // Check role relationships
        const relationships = await db.select()
            .from(roleRelationships)
            .where(and(
                eq(roleRelationships.organizationId, orgId),
                inArray(roleRelationships.fromRoleId, organizerRoles.map(r => r.roleId)),
                inArray(roleRelationships.toRoleId, targetRoles.map(r => r.roleId)),
                eq(roleRelationships.isActive, true)
            ));

        for (const rel of relationships) {
            const allowedTypes = JSON.parse(rel.allowedMeetingTypes || '[]');
            if (!allowedTypes.includes(meetingType) && !allowedTypes.includes('*')) {
                continue;
            }

            if (rel.relationshipType === 'can_schedule' || rel.relationshipType === 'manages') {
                return { canSchedule: true, requiresApproval: false };
            }
            if (rel.relationshipType === 'can_request') {
                // Find approver
                const approverId = await findApprover(orgId, rel.requiresApprovalFrom);
                return {
                    canSchedule: true,
                    requiresApproval: true,
                    approverId
                };
            }
            if (rel.relationshipType === 'collaborates') {
                // Peers can schedule internal meetings
                if (meetingType === 'internal' || meetingType === 'one_on_one') {
                    return { canSchedule: true, requiresApproval: false };
                }
            }
        }
    }

    // Check hierarchy - higher levels can schedule with lower
    for (const targetId of targetUserIds) {
        if (targetId === organizerId) continue;

        const targetRoles = await db.select({
            hierarchyLevel: organizationalRoles.hierarchyLevel,
        })
            .from(userRoleAssignments)
            .innerJoin(organizationalRoles, eq(userRoleAssignments.roleId, organizationalRoles.id))
            .where(eq(userRoleAssignments.userId, targetId));

        const targetMaxHierarchy = Math.max(...targetRoles.map(r => r.hierarchyLevel), 0);

        if (maxHierarchy >= targetMaxHierarchy) {
            return { canSchedule: true, requiresApproval: false };
        }
    }

    return {
        canSchedule: false,
        requiresApproval: false,
        reason: 'No permission to schedule with these participants'
    };
}

async function findApprover(orgId: string, approverRoleId: string | null): Promise<string | undefined> {
    if (!approverRoleId) return undefined;

    const approver = await db.select({ userId: userRoleAssignments.userId })
        .from(userRoleAssignments)
        .where(and(
            eq(userRoleAssignments.roleId, approverRoleId),
            eq(userRoleAssignments.isPrimary, true)
        ))
        .limit(1);

    return approver[0]?.userId;
}

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query params
        const startDate = parseInt(request.nextUrl.searchParams.get('startDate') || '0');
        const endDate = parseInt(request.nextUrl.searchParams.get('endDate') || '0');
        const viewUserId = request.nextUrl.searchParams.get('userId') || userId;
        const includeTeam = request.nextUrl.searchParams.get('includeTeam') === 'true';
        const meetingTypesParam = request.nextUrl.searchParams.get('meetingTypes');
        const meetingTypes = meetingTypesParam ? meetingTypesParam.split(',') : null;

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
        }

        // Build user list to fetch meetings for
        let userIds = [viewUserId];

        if (includeTeam) {
            // Get direct reports
            const reports = await db.select({ userId: userRoleAssignments.userId })
                .from(userRoleAssignments)
                .where(eq(userRoleAssignments.reportsTo, viewUserId));
            userIds.push(...reports.map(r => r.userId));
        }

        // Get meetings where user is organizer OR participant
        const organizerMeetings = await db.select()
            .from(meetings)
            .where(and(
                eq(meetings.organizationId, orgId),
                inArray(meetings.organizerId, userIds),
                gte(meetings.scheduledStart, startDate),
                lte(meetings.scheduledEnd, endDate),
                meetingTypes ? inArray(meetings.meetingType, meetingTypes as any[]) : undefined
            ))
            .orderBy(meetings.scheduledStart);

        // Get meetings where user is participant
        const participantMeetingIds = await db.select({ meetingId: meetingParticipants.meetingId })
            .from(meetingParticipants)
            .where(inArray(meetingParticipants.userId, userIds.filter(Boolean)));

        const participantMeetings = participantMeetingIds.length > 0
            ? await db.select()
                .from(meetings)
                .where(and(
                    inArray(meetings.id, participantMeetingIds.map(p => p.meetingId)),
                    gte(meetings.scheduledStart, startDate),
                    lte(meetings.scheduledEnd, endDate),
                    meetingTypes ? inArray(meetings.meetingType, meetingTypes as any[]) : undefined
                ))
            : [];

        // Merge and dedupe
        const allMeetings = [...organizerMeetings];
        for (const m of participantMeetings) {
            if (!allMeetings.find(om => om.id === m.id)) {
                allMeetings.push(m);
            }
        }

        // Sort by start time
        allMeetings.sort((a, b) => a.scheduledStart - b.scheduledStart);

        // Enrich with participants
        const enrichedMeetings = await Promise.all(
            allMeetings.map(async (meeting) => {
                const participants = await db.select({
                    id: meetingParticipants.id,
                    userId: meetingParticipants.userId,
                    externalEmail: meetingParticipants.externalEmail,
                    externalName: meetingParticipants.externalName,
                    role: meetingParticipants.role,
                    responseStatus: meetingParticipants.responseStatus,
                })
                    .from(meetingParticipants)
                    .where(eq(meetingParticipants.meetingId, meeting.id));

                // Get user details for internal participants
                const enrichedParticipants = await Promise.all(
                    participants.map(async (p) => {
                        if (p.userId) {
                            const user = await db.query.users.findFirst({
                                where: eq(users.id, p.userId),
                                columns: { name: true, avatarUrl: true, email: true },
                            });
                            return {
                                ...p,
                                name: user?.name || 'Unknown',
                                avatarUrl: user?.avatarUrl,
                                email: user?.email,
                            };
                        }
                        return {
                            ...p,
                            name: p.externalName || 'External',
                            email: p.externalEmail,
                        };
                    })
                );

                // Get organizer info
                const organizer = await db.query.users.findFirst({
                    where: eq(users.id, meeting.organizerId),
                    columns: { name: true, avatarUrl: true },
                });

                return {
                    ...meeting,
                    organizerName: organizer?.name || 'Unknown',
                    organizerAvatar: organizer?.avatarUrl,
                    participants: enrichedParticipants,
                };
            })
        );

        return NextResponse.json({ meetings: enrichedMeetings });

    } catch (error) {
        console.error('Error fetching meetings:', error);
        return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate input
        const validation = CreateMeetingSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Extract internal user IDs from participants
        const internalUserIds = data.participants
            .filter(p => p.userId)
            .map(p => p.userId!);

        // Check scheduling permissions
        const permission = await checkSchedulePermission(
            orgId,
            userId,
            internalUserIds,
            data.meetingType
        );

        if (!permission.canSchedule) {
            return NextResponse.json({
                error: 'Permission denied',
                reason: permission.reason
            }, { status: 403 });
        }

        // Create the meeting
        const [newMeeting] = await db.insert(meetings).values({
            organizationId: orgId,
            title: data.title,
            description: data.description,
            meetingType: data.meetingType,
            contextType: data.contextType,
            contextId: data.contextId,
            scheduledStart: data.scheduledStart,
            scheduledEnd: data.scheduledEnd,
            timezone: data.timezone,
            isAllDay: data.isAllDay,
            recurrence: data.recurrence ? JSON.stringify(data.recurrence) : null,
            locationType: data.locationType,
            location: data.location,
            videoProvider: data.videoProvider,
            organizerId: userId,
            createdBy: userId,
            agenda: data.agenda,
            requiresApproval: permission.requiresApproval,
            approvalStatus: permission.requiresApproval ? 'pending' : null,
            status: permission.requiresApproval ? 'scheduled' : 'confirmed',
        }).returning();

        // Add participants
        for (const participant of data.participants) {
            await db.insert(meetingParticipants).values({
                meetingId: newMeeting.id,
                userId: participant.userId || null,
                externalEmail: participant.externalEmail || null,
                externalName: participant.externalName || null,
                externalPhone: participant.externalPhone || null,
                role: participant.role,
            });
        }

        // Add organizer as participant
        const organizerAlreadyAdded = data.participants.some(p => p.userId === userId);
        if (!organizerAlreadyAdded) {
            await db.insert(meetingParticipants).values({
                meetingId: newMeeting.id,
                userId,
                role: 'organizer',
                responseStatus: 'accepted',
            });
        }

        // Log activity
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true },
        });

        await db.insert(activityFeed).values({
            organizationId: orgId,
            actorId: userId,
            actorName: user?.name || 'Unknown',
            action: 'meeting_created',
            entityType: 'meeting',
            entityId: newMeeting.id,
            entityName: data.title,
            details: JSON.stringify({
                meetingType: data.meetingType,
                scheduledStart: data.scheduledStart,
                participantCount: data.participants.length,
                requiresApproval: permission.requiresApproval,
            }),
        });

        return NextResponse.json({
            success: true,
            meeting: newMeeting,
            requiresApproval: permission.requiresApproval,
            approverId: permission.approverId,
        });

    } catch (error) {
        console.error('Error creating meeting:', error);
        return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }
}



