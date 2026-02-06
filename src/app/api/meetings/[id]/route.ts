/**
 * Meeting Detail API
 * 
 * GET /api/meetings/[id] - Get meeting details
 * PATCH /api/meetings/[id] - Update meeting
 * DELETE /api/meetings/[id] - Cancel meeting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { meetings, meetingParticipants, users, activityFeed } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { UpdateMeetingSchema, MeetingApprovalSchema } from '@/lib/validations/calendar';

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

        const meeting = await db.query.meetings.findFirst({
            where: and(
                eq(meetings.id, id),
                eq(meetings.organizationId, orgId)
            ),
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Get participants with user details
        const participants = await db.select({
            id: meetingParticipants.id,
            userId: meetingParticipants.userId,
            externalEmail: meetingParticipants.externalEmail,
            externalName: meetingParticipants.externalName,
            externalPhone: meetingParticipants.externalPhone,
            role: meetingParticipants.role,
            responseStatus: meetingParticipants.responseStatus,
            respondedAt: meetingParticipants.respondedAt,
            attended: meetingParticipants.attended,
        })
            .from(meetingParticipants)
            .where(eq(meetingParticipants.meetingId, id));

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
            columns: { name: true, avatarUrl: true, email: true },
        });

        // Get approver info if applicable
        let approver = null;
        if (meeting.approvedBy) {
            approver = await db.query.users.findFirst({
                where: eq(users.id, meeting.approvedBy),
                columns: { name: true, avatarUrl: true },
            });
        }

        return NextResponse.json({
            meeting: {
                ...meeting,
                organizerName: organizer?.name || 'Unknown',
                organizerAvatar: organizer?.avatarUrl,
                organizerEmail: organizer?.email,
                approverName: approver?.name,
                approverAvatar: approver?.avatarUrl,
                followUpActions: meeting.followUpActions ? JSON.parse(meeting.followUpActions) : [],
            },
            participants: enrichedParticipants,
        });

    } catch (error) {
        console.error('Error fetching meeting:', error);
        return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Get current meeting
        const meeting = await db.query.meetings.findFirst({
            where: and(
                eq(meetings.id, id),
                eq(meetings.organizationId, orgId)
            ),
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Check if user can edit (organizer or admin)
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { role: true, name: true },
        });

        if (meeting.organizerId !== userId && !['owner', 'admin'].includes(user?.role || '')) {
            return NextResponse.json({ error: 'Only organizer can edit meeting' }, { status: 403 });
        }

        // Handle approval action separately
        if (body.approvalAction) {
            const approvalValidation = MeetingApprovalSchema.safeParse(body.approvalAction);
            if (!approvalValidation.success) {
                return NextResponse.json({ error: 'Invalid approval data' }, { status: 400 });
            }

            await db.update(meetings)
                .set({
                    approvalStatus: approvalValidation.data.approved ? 'approved' : 'rejected',
                    approvedBy: userId,
                    approvedAt: Date.now(),
                    approvalNotes: approvalValidation.data.notes,
                    status: approvalValidation.data.approved ? 'confirmed' : 'cancelled',
                    updatedAt: Date.now(),
                })
                .where(eq(meetings.id, id));

            await db.insert(activityFeed).values({
                organizationId: orgId,
                actorId: userId,
                actorName: user?.name || 'Unknown',
                action: approvalValidation.data.approved ? 'meeting_approved' : 'meeting_rejected',
                entityType: 'meeting',
                entityId: id,
                entityName: meeting.title,
            });

            const updated = await db.query.meetings.findFirst({
                where: eq(meetings.id, id),
            });

            return NextResponse.json({ success: true, meeting: updated });
        }

        // Validate update data
        const validation = UpdateMeetingSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const updates = {
            ...validation.data,
            updatedAt: Date.now(),
        };

        // Handle reschedule
        if (validation.data.scheduledStart &&
            validation.data.scheduledStart !== meeting.scheduledStart) {
            updates.status = 'rescheduled';
        }

        await db.update(meetings)
            .set(updates)
            .where(eq(meetings.id, id));

        await db.insert(activityFeed).values({
            organizationId: orgId,
            actorId: userId,
            actorName: user?.name || 'Unknown',
            action: 'meeting_updated',
            entityType: 'meeting',
            entityId: id,
            entityName: meeting.title,
        });

        const updatedMeeting = await db.query.meetings.findFirst({
            where: eq(meetings.id, id),
        });

        return NextResponse.json({ success: true, meeting: updatedMeeting });

    } catch (error) {
        console.error('Error updating meeting:', error);
        return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json().catch(() => ({}));

        const meeting = await db.query.meetings.findFirst({
            where: and(
                eq(meetings.id, id),
                eq(meetings.organizationId, orgId)
            ),
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Check permission
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { role: true, name: true },
        });

        if (meeting.organizerId !== userId && !['owner', 'admin'].includes(user?.role || '')) {
            return NextResponse.json({ error: 'Only organizer can cancel meeting' }, { status: 403 });
        }

        // Soft delete - mark as cancelled
        await db.update(meetings)
            .set({
                status: 'cancelled',
                cancelledAt: Date.now(),
                cancelledBy: userId,
                cancellationReason: body.reason || null,
                updatedAt: Date.now(),
            })
            .where(eq(meetings.id, id));

        await db.insert(activityFeed).values({
            organizationId: orgId,
            actorId: userId,
            actorName: user?.name || 'Unknown',
            action: 'meeting_cancelled',
            entityType: 'meeting',
            entityId: id,
            entityName: meeting.title,
            details: JSON.stringify({ reason: body.reason }),
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error cancelling meeting:', error);
        return NextResponse.json({ error: 'Failed to cancel meeting' }, { status: 500 });
    }
}
