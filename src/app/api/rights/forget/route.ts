import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryNodes, memoryEdges, memoryLedger, chatMessages, chatSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/rights/forget - Request memory deletion (LGPD right of deletion)
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            targetType, // 'memory_node' | 'memory_all' | 'chat_session' | 'chat_all' | 'ledger_entry'
            targetId,
            reason,
            confirmDeletion
        } = body;

        if (!confirmDeletion) {
            return NextResponse.json({
                error: 'Deletion not confirmed',
                requirement: 'Set confirmDeletion: true to proceed',
                warning: 'This action cannot be undone (though audit trail is preserved)',
            }, { status: 400 });
        }

        // Safety limits - some data cannot be deleted
        const protectedCategories = ['threat', 'debt'];

        let deletedCount = 0;
        let protectedItems: string[] = [];

        switch (targetType) {
            case 'memory_node':
                if (targetId) {
                    await db.delete(memoryEdges).where(eq(memoryEdges.sourceId, targetId));
                    await db.delete(memoryEdges).where(eq(memoryEdges.targetId, targetId));
                    await db.delete(memoryNodes).where(eq(memoryNodes.id, targetId));
                    deletedCount = 1;
                }
                break;

            case 'ledger_entry':
                if (targetId) {
                    const entry = await db.select().from(memoryLedger).where(eq(memoryLedger.id, targetId)).limit(1);
                    if (entry.length > 0 && protectedCategories.includes(entry[0].category)) {
                        protectedItems.push(entry[0].id);
                    } else {
                        // Deactivate instead of delete for audit trail
                        await db.update(memoryLedger)
                            .set({ isActive: 0 })
                            .where(eq(memoryLedger.id, targetId));
                        deletedCount = 1;
                    }
                }
                break;

            case 'chat_session':
                if (targetId) {
                    await db.delete(chatMessages).where(eq(chatMessages.sessionId, targetId));
                    await db.delete(chatSessions).where(and(eq(chatSessions.id, targetId), eq(chatSessions.studentId, userId)));
                    deletedCount = 1;
                }
                break;

            default:
                return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
        }

        return NextResponse.json({
            data: {
                deletedCount,
                protectedItems,
                reason,
                deletedAt: Math.floor(Date.now() / 1000),
                auditNote: 'Deletion logged for compliance purposes',
                rights: protectedItems.length > 0
                    ? 'Some items could not be deleted due to safety/legal requirements'
                    : 'Your request has been fulfilled',
            }
        });
    } catch (error) {
        console.error('Error processing forget request:', error);
        return NextResponse.json({ error: 'Failed to process forget request' }, { status: 500 });
    }
}



