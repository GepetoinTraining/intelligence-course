'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportTickets, ticketMessages } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

/**
 * POST /api/tickets/[id]/messages
 * Add a reply or internal note to a ticket
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Verify ticket exists
        const [ticket] = await db
            .select()
            .from(supportTickets)
            .where(eq(supportTickets.id, id));

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const body = await request.json();
        const now = Math.floor(Date.now() / 1000);

        // Create message
        const [message] = await db.insert(ticketMessages).values({
            ticketId: id,
            authorId: body.authorId || personId,
            authorName: body.authorName || 'Agente',
            authorRole: body.authorRole || 'agent',
            content: body.content,
            contentType: body.contentType || 'text',
            isInternal: body.isInternal ? 1 : 0,
            attachments: body.attachments ? JSON.stringify(body.attachments) : null,
        }).returning();

        // Update ticket
        const ticketUpdates: Record<string, any> = {
            updatedAt: now,
            messageCount: (ticket.messageCount || 0) + 1,
        };

        // Track first response time (only for agent replies, not internal notes)
        if (!ticket.firstResponseAt && body.authorRole === 'agent' && !body.isInternal) {
            ticketUpdates.firstResponseAt = now;
        }

        // Auto-update status based on reply
        if (body.authorRole === 'agent' && !body.isInternal) {
            if (ticket.status === 'open') {
                ticketUpdates.status = 'in_progress';
            }
            if (ticket.status === 'waiting_internal') {
                ticketUpdates.status = 'waiting_customer';
            }
        } else if (body.authorRole === 'requester') {
            if (ticket.status === 'waiting_customer') {
                ticketUpdates.status = 'in_progress';
            }
        }

        // Apply new status if explicitly provided
        if (body.newStatus) {
            ticketUpdates.status = body.newStatus;
            if (body.newStatus === 'resolved') {
                ticketUpdates.resolvedAt = now;
            }
        }

        await db
            .update(supportTickets)
            .set(ticketUpdates)
            .where(eq(supportTickets.id, id));

        return NextResponse.json({ data: message }, { status: 201 });
    } catch (error) {
        console.error('Error adding message:', error);
        return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
    }
}
