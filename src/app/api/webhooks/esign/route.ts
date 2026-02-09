import { NextRequest, NextResponse } from 'next/server';
import { handleSignatureWebhook, WebhookPayload } from '@/lib/esign';

// ============================================================================
// E-SIGNATURE WEBHOOK RECEIVER
// Receives callbacks from ZapSign, D4Sign when documents are signed/refused/expired
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const provider = request.nextUrl.searchParams.get('provider') || 'zapsign';

        let payload: WebhookPayload;

        if (provider === 'zapsign') {
            // ZapSign webhook format
            payload = {
                provider: 'zapsign',
                event: body.event_type || body.type || '',
                documentId: body.doc?.token || body.token || '',
                signerEmail: body.signer?.email || '',
                signerName: body.signer?.name || '',
                signedAt: body.signed_at || body.signer?.signed_at || '',
                allSigned: body.doc?.status === 'signed' || body.all_signed === true,
                rawPayload: body,
            };
        } else if (provider === 'd4sign') {
            // D4Sign webhook format
            payload = {
                provider: 'd4sign',
                event: body.type_post || '',
                documentId: body.uuid || '',
                signerEmail: body.email || '',
                signerName: body.name_post || '',
                signedAt: body.date || '',
                allSigned: body.type_post === '3', // D4Sign: 3 = all signed
                rawPayload: body,
            };
        } else {
            return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
        }

        await handleSignatureWebhook(payload);

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
        console.error('[E-Sign Webhook] Error:', error);
        // Always return 200 to prevent retries on processing errors
        return NextResponse.json({ received: true, error: error.message }, { status: 200 });
    }
}

// Also handle GET for webhook verification (some providers ping GET first)
export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'esign-webhook' });
}
