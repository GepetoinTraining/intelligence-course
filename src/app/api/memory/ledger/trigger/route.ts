import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryLedger, memoryGraphs } from '@/lib/db/schema';
import { eq, desc, and, gt } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/memory/ledger/trigger - Trigger relevant ledger entries
export async function POST(request: NextRequest) {
    const { userId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { studentId, context, keywords } = body;

        if (!studentId || !context) {
            return NextResponse.json({ error: 'studentId and context required' }, { status: 400 });
        }

        // Get the student's memory graph
        const graph = await db
            .select()
            .from(memoryGraphs)
            .where(eq(memoryGraphs.studentId, studentId))
            .limit(1);

        if (graph.length === 0) {
            return NextResponse.json({ data: { triggered: [] } });
        }

        // Get active ledger entries above threshold
        const entries = await db
            .select()
            .from(memoryLedger)
            .where(and(
                eq(memoryLedger.graphId, graph[0].id),
                eq(memoryLedger.isActive, 1),
                gt(memoryLedger.importance, 0.5)
            ))
            .orderBy(desc(memoryLedger.importance))
            .limit(10);

        // Filter by keywords if provided
        let triggered = entries;
        if (keywords && Array.isArray(keywords) && keywords.length > 0) {
            triggered = entries.filter(entry => {
                const triggers = JSON.parse(entry.triggers || '[]');
                return keywords.some(kw =>
                    triggers.some((t: string) => t.toLowerCase().includes(kw.toLowerCase())) ||
                    entry.content.toLowerCase().includes(kw.toLowerCase())
                );
            });
        }

        // Update access counts
        for (const entry of triggered) {
            await db
                .update(memoryLedger)
                .set({
                    accessCount: (entry.accessCount || 0) + 1,
                    lastAccessed: Math.floor(Date.now() / 1000),
                })
                .where(eq(memoryLedger.id, entry.id));
        }

        return NextResponse.json({
            data: {
                triggered: triggered.map(e => ({
                    id: e.id,
                    summary: e.summary,
                    category: e.category,
                    importance: e.importance,
                    content: e.content,
                })),
            }
        });
    } catch (error) {
        console.error('Error triggering ledger:', error);
        return NextResponse.json({ error: 'Failed to trigger ledger' }, { status: 500 });
    }
}

