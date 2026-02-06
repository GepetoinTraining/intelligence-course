/**
 * Notes API
 * 
 * GET /api/notes - List notes for an entity
 * POST /api/notes - Create a new note
 * PATCH /api/notes/[id] - Update a note
 * DELETE /api/notes/[id] - Delete a note
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { notes, users, activityFeed } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const entityType = request.nextUrl.searchParams.get('entityType');
        const entityId = request.nextUrl.searchParams.get('entityId');

        if (!entityType || !entityId) {
            return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 });
        }

        // Get notes for the entity
        const entityNotes = await db.select({
            id: notes.id,
            title: notes.title,
            content: notes.content,
            contentType: notes.contentType,
            noteType: notes.noteType,
            isPrivate: notes.isPrivate,
            isPinned: notes.isPinned,
            attachments: notes.attachments,
            createdBy: notes.createdBy,
            createdAt: notes.createdAt,
            updatedAt: notes.updatedAt,
        }).from(notes)
            .where(and(
                eq(notes.entityType, entityType),
                eq(notes.entityId, entityId),
                eq(notes.organizationId, orgId)
            ))
            .orderBy(desc(notes.isPinned), desc(notes.createdAt));

        // Get user info for each note
        const notesWithUsers = await Promise.all(
            entityNotes.map(async (note) => {
                const user = await db.query.users.findFirst({
                    where: eq(users.id, note.createdBy),
                    columns: { name: true, avatarUrl: true },
                });
                return {
                    ...note,
                    createdByName: user?.name || 'Unknown',
                    createdByAvatar: user?.avatarUrl,
                    attachments: note.attachments ? JSON.parse(note.attachments) : [],
                };
            })
        );

        return NextResponse.json({ notes: notesWithUsers });

    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { entityType, entityId, title, content, noteType, isPrivate } = body;

        if (!entityType || !entityId || !content) {
            return NextResponse.json({ error: 'entityType, entityId, and content required' }, { status: 400 });
        }

        // Get user name for activity feed
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true },
        });

        // Create the note
        const [newNote] = await db.insert(notes).values({
            organizationId: orgId,
            entityType,
            entityId,
            title: title || null,
            content,
            noteType: noteType || 'general',
            isPrivate: isPrivate || false,
            createdBy: userId,
        }).returning();

        // Log to activity feed
        await db.insert(activityFeed).values({
            organizationId: orgId,
            actorId: userId,
            actorName: user?.name || 'Unknown',
            action: 'note_created',
            entityType,
            entityId,
            details: JSON.stringify({
                noteId: newNote.id,
                noteType: noteType || 'general',
                hasTitle: !!title,
            }),
        });

        return NextResponse.json({
            success: true,
            note: {
                ...newNote,
                createdByName: user?.name || 'Unknown',
                attachments: [],
            }
        });

    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
}

