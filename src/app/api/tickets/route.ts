'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportTickets, ticketMessages } from '@/lib/db/schema';
import { eq, desc, and, or, sql, count } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// SLA deadlines by priority (in seconds)
const SLA_DEADLINES: Record<string, number> = {
    urgent: 4 * 3600,      // 4 hours
    high: 8 * 3600,        // 8 hours
    medium: 24 * 3600,     // 24 hours
    low: 72 * 3600,        // 72 hours
};

function generateTicketNumber() {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `TKT-${year}-${rand}`;
}

/**
 * GET /api/tickets
 * List tickets for current org with filtering
 */
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(supportTickets.organizationId, orgId));
        }
        if (status && status !== 'all') {
            if (status === 'active') {
                conditions.push(
                    or(
                        eq(supportTickets.status, 'open'),
                        eq(supportTickets.status, 'in_progress'),
                        eq(supportTickets.status, 'waiting_customer'),
                        eq(supportTickets.status, 'waiting_internal')
                    )!
                );
            } else {
                conditions.push(eq(supportTickets.status, status as any));
            }
        }
        if (priority) {
            conditions.push(eq(supportTickets.priority, priority as any));
        }
        if (category) {
            conditions.push(eq(supportTickets.category, category as any));
        }
        if (assignedTo) {
            conditions.push(eq(supportTickets.assignedToId, assignedTo));
        }

        const tickets = await db
            .select()
            .from(supportTickets)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(supportTickets.createdAt))
            .limit(limit);

        // Summary stats
        const allTickets = orgId
            ? await db.select().from(supportTickets).where(eq(supportTickets.organizationId, orgId))
            : await db.select().from(supportTickets);

        const now = Math.floor(Date.now() / 1000);
        const summary = {
            total: allTickets.length,
            open: allTickets.filter(t => t.status === 'open').length,
            inProgress: allTickets.filter(t => t.status === 'in_progress').length,
            waitingCustomer: allTickets.filter(t => t.status === 'waiting_customer').length,
            waitingInternal: allTickets.filter(t => t.status === 'waiting_internal').length,
            resolved: allTickets.filter(t => t.status === 'resolved').length,
            closed: allTickets.filter(t => t.status === 'closed').length,
            urgent: allTickets.filter(t => t.priority === 'urgent').length,
            high: allTickets.filter(t => t.priority === 'high').length,
            overdueSla: allTickets.filter(t =>
                t.slaDeadline && t.slaDeadline < now &&
                t.status !== 'resolved' && t.status !== 'closed'
            ).length,
            avgResponseTime: null as number | null,
        };

        // Calculate avg first response time
        const responded = allTickets.filter(t => t.firstResponseAt && t.createdAt);
        if (responded.length > 0) {
            const totalTime = responded.reduce((sum, t) => sum + ((t.firstResponseAt || 0) - (t.createdAt || 0)), 0);
            summary.avgResponseTime = Math.round(totalTime / responded.length);
        }

        return NextResponse.json({ data: tickets, summary });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

/**
 * POST /api/tickets
 * Create a new support ticket
 */
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const now = Math.floor(Date.now() / 1000);
        const priority = body.priority || 'medium';
        const slaDeadline = now + (SLA_DEADLINES[priority] || SLA_DEADLINES.medium);

        const [ticket] = await db.insert(supportTickets).values({
            organizationId: orgId,
            number: generateTicketNumber(),
            subject: body.subject,
            description: body.description || '',
            category: body.category || 'other',
            priority,
            status: 'open',
            requesterId: body.requesterId || personId,
            requesterName: body.requesterName || '',
            requesterEmail: body.requesterEmail || '',
            assignedToId: body.assignedToId,
            assignedToName: body.assignedToName,
            channel: body.channel || 'web',
            tags: body.tags ? JSON.stringify(body.tags) : null,
            slaDeadline,
            messageCount: body.description ? 1 : 0,
        }).returning();

        // If description provided, create initial message
        if (body.description) {
            await db.insert(ticketMessages).values({
                ticketId: ticket.id,
                authorId: body.requesterId || personId,
                authorName: body.requesterName || 'Solicitante',
                authorRole: 'requester',
                content: body.description,
                isInternal: 0,
            });
        }

        return NextResponse.json({ data: ticket }, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }
}
