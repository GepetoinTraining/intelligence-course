import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessons, tasks } from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/lessons/import - Bulk import lessons (+ their tasks) from JSON
// Designed for AI pipeline: methodology → program → AI generates lessons → ingest here
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];
        const created = [];

        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];

            // Ensure title/description are i18n JSON strings
            const titleStr = typeof item.title === 'object'
                ? JSON.stringify(item.title)
                : JSON.stringify({ 'pt-BR': item.title });
            const descStr = typeof item.description === 'object'
                ? JSON.stringify(item.description)
                : JSON.stringify({ 'pt-BR': item.description || '' });

            const [lesson] = await db.insert(lessons).values({
                moduleId: item.moduleId,
                title: titleStr,
                description: descStr,
                content: item.content || '',
                contentFormat: item.contentFormat || 'markdown',
                orderIndex: item.orderIndex ?? idx,
                lessonType: item.lessonType || 'standard',
            }).returning();

            // If the item includes tasks, create them too
            const createdTasks = [];
            if (item.tasks && Array.isArray(item.tasks)) {
                for (let ti = 0; ti < item.tasks.length; ti++) {
                    const t = item.tasks[ti];

                    const taskTitleStr = typeof t.title === 'object'
                        ? JSON.stringify(t.title)
                        : JSON.stringify({ 'pt-BR': t.title });
                    const taskInstrStr = typeof t.instructions === 'object'
                        ? JSON.stringify(t.instructions)
                        : JSON.stringify({ 'pt-BR': t.instructions || '' });

                    const [task] = await db.insert(tasks).values({
                        lessonId: lesson.id,
                        title: taskTitleStr,
                        instructions: taskInstrStr,
                        taskType: t.taskType || 'prompt',
                        config: JSON.stringify(t.config || {}),
                        orderIndex: t.orderIndex ?? ti,
                        maxPoints: t.maxPoints || 10,
                    }).returning();
                    createdTasks.push(task);
                }
            }

            created.push({ ...lesson, tasks: createdTasks });
        }

        return NextResponse.json({
            data: created,
            summary: {
                lessonsCreated: created.length,
                tasksCreated: created.reduce((sum, l) => sum + (l.tasks?.length || 0), 0),
            },
        }, { status: 201 });
    } catch (error) {
        console.error('[lessons/import POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
