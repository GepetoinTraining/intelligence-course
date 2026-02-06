/**
 * QR Code Generation API
 * POST /api/qr/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { qrGenerator } from '@/lib/qr';
import { QRGenerateOptions } from '@/lib/qr/types';

export async function POST(request: NextRequest) {
    try {
        const body: QRGenerateOptions = await request.json();

        if (!body.data) {
            return NextResponse.json(
                { error: 'Missing required field: data' },
                { status: 400 }
            );
        }

        const result = await qrGenerator.generate({
            ...body,
            format: body.format || 'base64',
        });

        // If PNG format requested, return binary
        if (body.format === 'png') {
            const buffer = result.image as Buffer;
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Disposition': `inline; filename="qr-${Date.now()}.png"`,
                    'Cache-Control': 'public, max-age=31536000',
                },
            });
        }

        // If SVG format requested
        if (body.format === 'svg') {
            return new NextResponse(result.image as string, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'public, max-age=31536000',
                },
            });
        }

        // Default: return JSON with base64
        return NextResponse.json({
            success: true,
            image: result.image,
            mimeType: result.mimeType,
            width: result.width,
            height: result.height,
        });
    } catch (error) {
        console.error('QR generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate QR code', details: String(error) },
            { status: 500 }
        );
    }
}

