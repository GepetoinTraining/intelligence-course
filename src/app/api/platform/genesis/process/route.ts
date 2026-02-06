/**
 * Genesis Subconscious Processor Endpoint
 *
 * Called by the Stop hook when a Claude session ends.
 * Receives session summary, feeds it to the subconscious (Haiku),
 * and applies graph operations.
 *
 * This is fire-and-forget from the hook's perspective.
 * Auth: GENESIS_TOKEN bearer only (hooks don't have Clerk sessions).
 */

import { NextRequest } from 'next/server';
import { processSubconscious } from '@/lib/genesis';

export async function POST(req: NextRequest) {
    // Auth: bearer token only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.slice(7);
    if (token !== process.env.GENESIS_TOKEN) {
        return new Response('Invalid token', { status: 403 });
    }

    const ownerPersonId = process.env.GENESIS_OWNER_PERSON_ID;
    if (!ownerPersonId) {
        return new Response('GENESIS_OWNER_PERSON_ID not configured', { status: 500 });
    }

    try {
        const body = await req.json();

        const { sessionSummary, tags, decisions, sourceSessionType } = body;

        if (!sessionSummary) {
            return Response.json({ skipped: true, reason: 'No session summary provided' });
        }

        const result = await processSubconscious(ownerPersonId, {
            sessionSummary,
            tags: tags || [],
            decisions: decisions || [],
            sourceSessionType: sourceSessionType || 'claude_code',
        });

        return Response.json(result);
    } catch (error: any) {
        console.error('[Genesis Process] Error:', error);
        return Response.json(
            { error: error.message || 'Processing failed' },
            { status: 500 },
        );
    }
}
