import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, memoryGraphs, memoryNodes, memoryEdges, memoryLedger, chatSessions, chatMessages, progress, attendance, enrollments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/rights/export/[studentId] - Export all data (LGPD right of portability)
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    if (personId !== studentId) {
        return NextResponse.json({ error: 'You can only export your own data' }, { status: 403 });
    }

    try {
        // Gather all data
        const user = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
        const graph = await db.select().from(memoryGraphs).where(eq(memoryGraphs.studentId, studentId)).limit(1);

        let nodes: any[] = [];
        let edges: any[] = [];
        let ledger: any[] = [];
        if (graph.length > 0) {
            nodes = await db.select().from(memoryNodes).where(eq(memoryNodes.graphId, graph[0].id));
            edges = await db.select().from(memoryEdges).where(eq(memoryEdges.graphId, graph[0].id));
            ledger = await db.select().from(memoryLedger).where(eq(memoryLedger.graphId, graph[0].id));
        }

        const sessions = await db.select().from(chatSessions).where(eq(chatSessions.studentId, studentId));

        const allMessages: any[] = [];
        for (const session of sessions) {
            const messages = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, session.id));
            allMessages.push(...messages.map(m => ({ ...m, sessionId: session.id })));
        }

        const progressRecords = await db.select().from(progress).where(eq(progress.personId, studentId));
        const attendanceRecords = await db.select().from(attendance).where(eq(attendance.personId, studentId));
        const enrollmentRecords = await db.select().from(enrollments).where(eq(enrollments.personId, studentId));

        const exportData = {
            exportedAt: new Date().toISOString(),
            exportedFor: studentId,
            format: 'JSON',
            version: '1.0',
            data: {
                profile: user[0] || null,
                memoryGraph: graph[0] || null,
                memoryNodes: nodes,
                memoryEdges: edges,
                ledgerEntries: ledger,
                chatSessions: sessions,
                chatMessages: allMessages,
                progress: progressRecords,
                attendance: attendanceRecords,
                enrollments: enrollmentRecords,
            },
            schema: {
                description: 'Complete data export following LGPD portability requirements',
                contact: 'dpo@intelligence-course.com',
            },
        };

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="data-export-${studentId}-${Date.now()}.json"`,
            },
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
