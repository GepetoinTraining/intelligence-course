import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoItems } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/todos - List todo items
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        const conditions = [eq(todoItems.userId, userId)];

        if (status) {
            const validStatus = status === 'pending' ? 'active' : status === 'in_progress' ? 'active' : status;
            conditions.push(eq(todoItems.status, validStatus as 'active' | 'completed' | 'archived'));
        }

        const todos = await db
            .select()
            .from(todoItems)
            .where(and(...conditions))
            .orderBy(desc(todoItems.createdAt))
            .limit(limit);

        return NextResponse.json({ data: todos });
    } catch (error) {
        console.error('Error fetching todos:', error);
        return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
    }
}

// POST /api/todos - Create todo item
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, priority, urgency, energyCost, futureImpact, lessonId } = body;

        if (!title) {
            return NextResponse.json({ error: 'title required' }, { status: 400 });
        }

        const newTodo = await db.insert(todoItems).values({
            userId,
            title,
            description,
            priority,
            urgency,
            energyCost,
            futureImpact,
            lessonId,
            status: 'active',
        }).returning();

        return NextResponse.json({ data: newTodo[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating todo:', error);
        return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
    }
}

