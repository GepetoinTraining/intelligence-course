/**
 * Marketing Event Tracking API
 * POST /api/marketing/tracking
 * 
 * Client-side tracking endpoint for:
 * - Page views
 * - Form interactions
 * - Scroll depth
 * - Custom events
 * - Conversions
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trackingEvents, visitors, sessions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { parseUserAgent, generateShortCode } from '@/lib/qr/utils';

interface TrackingPayload {
    organizationId: string;
    eventType: 'page_view' | 'scroll' | 'click' | 'form_start' | 'form_submit' |
    'video_play' | 'video_complete' | 'lead' | 'purchase' | 'custom';
    eventName?: string;
    pageUrl?: string;
    properties?: Record<string, unknown>;
    valueCents?: number;
    currency?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: TrackingPayload = await request.json();
        const userAgent = request.headers.get('user-agent') || '';

        if (!body.organizationId || !body.eventType) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, eventType' },
                { status: 400 }
            );
        }

        const now = Math.floor(Date.now() / 1000);

        // Get fingerprint and session from cookies
        const fingerprint = request.cookies.get('_fp')?.value;
        const sessionId = request.cookies.get('_sid')?.value;

        let visitorId: string | undefined;

        // Find or create visitor
        if (fingerprint) {
            const visitor = await db.query.visitors.findFirst({
                where: and(
                    eq(visitors.fingerprint, fingerprint),
                    eq(visitors.organizationId, body.organizationId)
                ),
            });

            if (visitor) {
                visitorId = visitor.id;

                // Update last seen
                await db.update(visitors)
                    .set({ lastSeenAt: now })
                    .where(eq(visitors.id, visitor.id));
            } else {
                // Create new visitor
                const deviceInfo = parseUserAgent(userAgent);
                const [newVisitor] = await db.insert(visitors).values({
                    organizationId: body.organizationId,
                    fingerprint,
                    userAgent,
                    deviceType: deviceInfo.deviceType,
                    browser: deviceInfo.browser,
                    os: deviceInfo.os,
                    firstSeenAt: now,
                    lastSeenAt: now,
                }).returning();
                visitorId = newVisitor.id;
            }
        }

        // Record the event
        await db.insert(trackingEvents).values({
            sessionId: sessionId || null,
            visitorId: visitorId || generateShortCode(), // Fallback if no visitor
            organizationId: body.organizationId,
            eventType: body.eventType,
            eventName: body.eventName,
            pageUrl: body.pageUrl,
            properties: body.properties ? JSON.stringify(body.properties) : '{}',
            valueCents: body.valueCents,
            currency: body.currency || 'BRL',
            timestamp: now,
        });

        // Update session event count if we have a session
        if (sessionId) {
            await db.update(sessions)
                .set({
                    events: sql`${sessions.events} + 1`,
                    pageViews: body.eventType === 'page_view'
                        ? sql`${sessions.pageViews} + 1`
                        : sessions.pageViews,
                    bounced: false, // Any event means not bounced
                })
                .where(eq(sessions.id, sessionId));
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json(
            { error: 'Failed to track event' },
            { status: 500 }
        );
    }
}

// Also support GET for beacon/pixel tracking
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const eventType = searchParams.get('e') || 'page_view';
    const organizationId = searchParams.get('org');

    if (!organizationId) {
        // Return 1x1 transparent pixel without tracking
        return new NextResponse(null, {
            status: 204,
        });
    }

    try {
        const now = Math.floor(Date.now() / 1000);
        const fingerprint = request.cookies.get('_fp')?.value;
        const sessionId = request.cookies.get('_sid')?.value;

        // Record minimal event
        await db.insert(trackingEvents).values({
            sessionId: sessionId || null,
            visitorId: fingerprint || generateShortCode(),
            organizationId,
            eventType: eventType as 'page_view',
            pageUrl: searchParams.get('url') || undefined,
            properties: '{}',
            timestamp: now,
        });

        // Return 1x1 transparent GIF
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );

        return new NextResponse(pixel, {
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });

    } catch (error) {
        console.error('Pixel tracking error:', error);
        return new NextResponse(null, { status: 204 });
    }
}


