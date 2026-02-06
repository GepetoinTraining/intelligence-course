/**
 * Meeting Transcription API
 * 
 * POST /api/communicator/meetings/[meetingId]/transcripts - Start/add transcript
 * GET /api/communicator/meetings/[meetingId]/transcripts - Get transcripts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    meetings,
    meetingParticipants,
    meetingTranscripts,
    meetingNotes,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import {
    StartTranscriptionSchema,
    AddTranscriptChunkSchema,
    CreateMeetingNoteSchema,
} from '@/lib/validations/communicator';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { meetingId } = await params;

        // Verify meeting access
        const [meeting] = await db.select()
            .from(meetings)
            .where(and(
                eq(meetings.id, meetingId),
                eq(meetings.organizationId, orgId)
            ))
            .limit(1);

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Get all transcripts
        const transcripts = await db.select()
            .from(meetingTranscripts)
            .where(eq(meetingTranscripts.meetingId, meetingId))
            .orderBy(meetingTranscripts.chunkIndex);

        // Combine all chunks into full transcript
        const fullTranscript = transcripts
            .map(t => t.rawTranscript)
            .join('\n\n');

        // Get user's private notes
        const [userNotes] = await db.select()
            .from(meetingNotes)
            .where(and(
                eq(meetingNotes.meetingId, meetingId),
                eq(meetingNotes.personId, personId)
            ))
            .limit(1);

        return NextResponse.json({
            meeting: {
                id: meeting.id,
                title: meeting.title,
                scheduledStart: meeting.scheduledStart,
            },
            transcripts: transcripts.map(t => ({
                id: t.id,
                chunkIndex: t.chunkIndex,
                rawTranscript: t.rawTranscript,
                speakerLabels: JSON.parse(t.speakerLabels || '{}'),
                startTimestamp: t.startTimestamp,
                endTimestamp: t.endTimestamp,
                durationSeconds: t.durationSeconds,
                languageDetected: t.languageDetected,
                confidenceScore: t.confidenceScore,
                recordedBy: t.recordedBy,
                createdAt: t.createdAt,
            })),
            fullTranscript,
            totalDurationSeconds: transcripts.reduce((sum, t) => sum + (t.durationSeconds || 0), 0),
            userNotes: userNotes ? {
                id: userNotes.id,
                content: userNotes.content,
                isPrivate: userNotes.isPrivate,
                updatedAt: userNotes.updatedAt,
            } : null,
        });

    } catch (error) {
        console.error('Error fetching transcripts:', error);
        return NextResponse.json({ error: 'Failed to fetch transcripts' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { meetingId } = await params;
        const body = await request.json();

        // Verify meeting access and participant status
        const [meeting] = await db.select()
            .from(meetings)
            .where(and(
                eq(meetings.id, meetingId),
                eq(meetings.organizationId, orgId)
            ))
            .limit(1);

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Check if user is a participant
        const [participant] = await db.select()
            .from(meetingParticipants)
            .where(and(
                eq(meetingParticipants.meetingId, meetingId),
                eq(meetingParticipants.personId, personId)
            ))
            .limit(1);

        // Allow organizer or participant to add transcripts
        const isOrganizer = meeting.organizerId === personId;
        const isParticipant = !!participant;

        if (!isOrganizer && !isParticipant) {
            return NextResponse.json({ error: 'Not authorized to add transcripts' }, { status: 403 });
        }

        const action = body.action || 'add_chunk';

        if (action === 'start') {
            // Start new transcription session
            const validation = StartTranscriptionSchema.safeParse({
                ...body,
                meetingId,
            });

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const { deviceType, language } = validation.data;

            // Create initial transcript record
            const [transcript] = await db.insert(meetingTranscripts).values({
                meetingId,
                recordedBy: personId,
                deviceType,
                chunkIndex: 0,
                rawTranscript: '',
                startTimestamp: Date.now(),
                languageDetected: language,
            }).returning();

            return NextResponse.json({
                success: true,
                transcriptionId: transcript.id,
                message: 'Transcription started',
            });

        } else if (action === 'add_chunk') {
            // Add transcript chunk
            const validation = AddTranscriptChunkSchema.safeParse({
                ...body,
                meetingId,
            });

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const {
                transcriptionId,
                rawTranscript,
                startTimestamp,
                endTimestamp,
                speakerLabels,
                confidenceScore,
            } = validation.data;

            // Get the last chunk index for this transcription session
            const [lastChunk] = await db.select({ chunkIndex: meetingTranscripts.chunkIndex })
                .from(meetingTranscripts)
                .where(eq(meetingTranscripts.meetingId, meetingId))
                .orderBy(desc(meetingTranscripts.chunkIndex))
                .limit(1);

            const nextChunkIndex = (lastChunk?.chunkIndex || 0) + 1;

            const [newChunk] = await db.insert(meetingTranscripts).values({
                meetingId,
                recordedBy: personId,
                chunkIndex: nextChunkIndex,
                rawTranscript,
                speakerLabels: speakerLabels ? JSON.stringify(speakerLabels) : '{}',
                startTimestamp,
                endTimestamp,
                durationSeconds: Math.round((endTimestamp - startTimestamp) / 1000),
                confidenceScore,
            }).returning();

            return NextResponse.json({
                success: true,
                chunk: {
                    id: newChunk.id,
                    chunkIndex: newChunk.chunkIndex,
                    durationSeconds: newChunk.durationSeconds,
                },
            });

        } else if (action === 'save_notes') {
            // Save meeting notes
            const validation = CreateMeetingNoteSchema.safeParse({
                ...body,
                meetingId,
            });

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const { content, contentFormat, isPrivate } = validation.data;

            // Upsert notes
            const [existingNotes] = await db.select()
                .from(meetingNotes)
                .where(and(
                    eq(meetingNotes.meetingId, meetingId),
                    eq(meetingNotes.personId, personId)
                ))
                .limit(1);

            let notes;
            if (existingNotes) {
                [notes] = await db.update(meetingNotes)
                    .set({
                        content,
                        contentFormat,
                        isPrivate,
                        updatedAt: Date.now(),
                    })
                    .where(eq(meetingNotes.id, existingNotes.id))
                    .returning();
            } else {
                [notes] = await db.insert(meetingNotes).values({
                    meetingId,
                    personId,
                    content,
                    contentFormat,
                    isPrivate,
                }).returning();
            }

            return NextResponse.json({
                success: true,
                notes: {
                    id: notes.id,
                    content: notes.content,
                    isPrivate: notes.isPrivate,
                    updatedAt: notes.updatedAt,
                },
            });

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error handling transcript:', error);
        return NextResponse.json({ error: 'Failed to process transcript' }, { status: 500 });
    }
}
