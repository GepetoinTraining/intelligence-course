/**
 * QR Code Scan Tracking & Redirect
 * GET /api/qr/scan/[code]
 * 
 * This endpoint:
 * 1. Records the scan in the database
 * 2. Creates/updates visitor record
 * 3. Redirects to destination URL with UTM parameters
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { qrCodes, qrScans, visitors, sessions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { parseUserAgent, buildTrackingUrl, generateShortCode } from '@/lib/qr/utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';

    try {
        // Find the QR code
        const qrCode = await db.query.qrCodes.findFirst({
            where: eq(qrCodes.code, code),
        });

        if (!qrCode) {
            // QR not found - redirect to 404 or home
            return NextResponse.redirect(new URL('/404', request.url));
        }

        if (qrCode.status !== 'active') {
            // QR expired or paused
            return NextResponse.redirect(new URL('/qr-expired', request.url));
        }

        // Parse device info
        const deviceInfo = parseUserAgent(userAgent);

        // Get or create fingerprint from cookie
        const fingerprint = request.cookies.get('_fp')?.value || generateShortCode();

        // Find or create visitor
        let visitor = await db.query.visitors.findFirst({
            where: eq(visitors.fingerprint, fingerprint),
        });

        const now = Math.floor(Date.now() / 1000);

        if (!visitor) {
            // Create new visitor with QR attribution
            const [newVisitor] = await db.insert(visitors).values({
                organizationId: qrCode.organizationId,
                fingerprint,
                firstSource: qrCode.utmSource || 'qr',
                firstMedium: qrCode.utmMedium || qrCode.locationType || 'offline',
                firstCampaign: qrCode.utmCampaign,
                firstLandingPage: qrCode.destinationUrl,
                userAgent,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                firstSeenAt: now,
                lastSeenAt: now,
            }).returning();
            visitor = newVisitor;
        } else {
            // Update last seen
            await db.update(visitors)
                .set({ lastSeenAt: now })
                .where(eq(visitors.id, visitor.id));
        }

        // Create session
        const [session] = await db.insert(sessions).values({
            visitorId: visitor.id,
            organizationId: qrCode.organizationId,
            source: qrCode.utmSource || 'qr',
            medium: qrCode.utmMedium || qrCode.locationType || 'offline',
            campaign: qrCode.utmCampaign,
            content: qrCode.utmContent || qrCode.code,
            term: qrCode.utmTerm || qrCode.locationName,
            landingPage: qrCode.destinationUrl,
            deviceType: deviceInfo.deviceType,
            pageViews: 1,
            startedAt: now,
        }).returning();

        // Record the scan
        await db.insert(qrScans).values({
            qrCodeId: qrCode.id,
            organizationId: qrCode.organizationId,
            visitorId: visitor.id,
            sessionId: session.id,
            userAgent,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ipAddress: ip, // Consider hashing for privacy
            scannedAt: now,
        });

        // Update QR code stats
        await db.update(qrCodes)
            .set({
                totalScans: sql`${qrCodes.totalScans} + 1`,
                lastScannedAt: now,
                // uniqueScans would need more complex logic
            })
            .where(eq(qrCodes.id, qrCode.id));

        // Build destination URL with UTM parameters
        let destinationUrl = qrCode.destinationUrl || '/';

        // If it's a form, build the form URL
        if (qrCode.destinationType === 'form' && qrCode.formSlug) {
            destinationUrl = `/form/${qrCode.formSlug}`;
        }

        // If it's a landing page
        if (qrCode.destinationType === 'landing_page' && qrCode.landingPageId) {
            // Would need to look up the landing page URL
            // For now, use the destination URL
        }

        // Add tracking parameters
        const finalUrl = buildTrackingUrl(
            new URL(destinationUrl, request.url).toString(),
            {
                qrCode: code,
                source: qrCode.utmSource || 'qr',
                medium: qrCode.utmMedium || qrCode.locationType || 'offline',
                campaign: qrCode.utmCampaign || undefined,
                content: qrCode.utmContent || code,
                term: qrCode.utmTerm || qrCode.locationName || undefined,
            }
        );

        // Set fingerprint cookie and redirect
        const response = NextResponse.redirect(finalUrl);
        response.cookies.set('_fp', fingerprint, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 365 * 24 * 60 * 60, // 1 year
        });

        // Also set session ID for conversion tracking
        response.cookies.set('_sid', session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 60, // 30 minutes
        });

        return response;

    } catch (error) {
        console.error('QR scan error:', error);
        // On error, still redirect to a fallback
        return NextResponse.redirect(new URL('/', request.url));
    }
}
