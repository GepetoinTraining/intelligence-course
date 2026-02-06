import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs, memoryLedger } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/rights/negotiate - Student-AI agreement on remembering
export async function POST(request: NextRequest) {
    const { userId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            topic,
            remembrance, // 'always' | 'session_only' | 'never' | 'ask_each_time'
            duration, // days, or null for permanent
            context,
        } = body;

        if (!topic || !remembrance) {
            return NextResponse.json({ error: 'topic and remembrance required' }, { status: 400 });
        }

        // Get the student's memory graph
        const graph = await db.select().from(memoryGraphs)
            .where(eq(memoryGraphs.studentId, userId)).limit(1);

        if (graph.length === 0) {
            return NextResponse.json({ error: 'Memory graph not found' }, { status: 404 });
        }

        // Create a negotiation agreement as a ledger entry
        const agreement = await db.insert(memoryLedger).values({
            graphId: graph[0].id,
            content: JSON.stringify({
                type: 'remembrance_negotiation',
                topic,
                remembrance,
                duration,
                context,
            }),
            category: 'instruction', // Use valid category
            importance: 1.0, // Agreements are always important
            triggers: JSON.stringify([topic]),
        }).returning();

        return NextResponse.json({
            data: {
                agreement: agreement[0],
                topic,
                remembrance,
                duration: duration ? `${duration} days` : 'permanent',
                message: 'Agreement recorded',
                effect: remembrance === 'never'
                    ? `The AI will not remember information about "${topic}"`
                    : remembrance === 'session_only'
                        ? `Information about "${topic}" will only be remembered during sessions`
                        : remembrance === 'ask_each_time'
                            ? `The AI will ask before remembering "${topic}"`
                            : `The AI will always remember "${topic}"`,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating negotiation:', error);
        return NextResponse.json({ error: 'Failed to create negotiation' }, { status: 500 });
    }
}

