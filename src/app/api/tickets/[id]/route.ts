'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportTickets, ticketMessages } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

/**
 * GET /api/tickets/[id]
 * Get a single ticket with all its messages
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const [ticket] = await db
            .select()
            .from(supportTickets)
            .where(eq(supportTickets.id, id));

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Fetch messages
        const messages = await db
            .select()
            .from(ticketMessages)
            .where(eq(ticketMessages.ticketId, id))
            .orderBy(ticketMessages.createdAt);

        return NextResponse.json({ data: { ...ticket, messages } });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
    }
}

/**
 * PATCH /api/tickets/[id]
 * Update ticket status, priority, assignment, etc.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const now = Math.floor(Date.now() / 1000);
        const updates: Record<string, any> = {
            updatedAt: now,
        };

        if (body.status !== undefined) {
            updates.status = body.status;
            if (body.status === 'resolved') {
                updates.resolvedAt = now;
            }
            if (body.status === 'closed') {
                updates.closedAt = now;
            }
        }
        if (body.priority !== undefined) updates.priority = body.priority;
        if (body.category !== undefined) updates.category = body.category;
        if (body.assignedToId !== undefined) {
            updates.assignedToId = body.assignedToId;
            updates.assignedToName = body.assignedToName || '';
        }
        if (body.subject !== undefined) updates.subject = body.subject;
        if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);
        if (body.satisfaction !== undefined) updates.satisfaction = body.satisfaction;

        const [updated] = await db
            .update(supportTickets)
            .set(updates)
            .where(eq(supportTickets.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error('Error updating ticket:', error);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}

/**
 * DELETE /api/tickets/[id]
 * Delete a ticket and its messages
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Messages cascade-delete from FK
        const [deleted] = await db
            .delete(supportTickets)
            .where(eq(supportTickets.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
    }
}
