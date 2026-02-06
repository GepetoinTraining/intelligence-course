import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, users, enrollments, classes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/leads/[id]/convert - Convert lead to student
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        // Get the lead
        const lead = await db
            .select()
            .from(leads)
            .where(eq(leads.id, id))
            .limit(1);

        if (lead.length === 0) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const leadData = lead[0];

        // Create user account for the student
        const newUserId = crypto.randomUUID();

        const newUser = await db.insert(users).values({
            id: newUserId,
            email: leadData.email || `lead_${id}@nodezero.school`,
            name: leadData.name,
            role: 'student',
            organizationId: orgId,
        }).returning();

        // Create enrollment if classId provided
        let enrollment = null;
        if (body.classId) {
            const enrollmentResult = await db.insert(enrollments).values({
                organizationId: orgId,
                personId: newUserId,
                classId: body.classId,
                termId: body.termId,
                leadId: id,
                trialId: body.trialId,
                status: 'active',
                enrolledAt: Math.floor(Date.now() / 1000),
                startsAt: body.startsAt,
            }).returning();

            enrollment = enrollmentResult[0];

            // Update class student count
            await db
                .update(classes)
                .set({
                    currentStudents: (body.currentStudentCount || 0) + 1,
                    updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(classes.id, body.classId));
        }

        // Update lead status
        await db
            .update(leads)
            .set({
                status: 'enrolled',
                convertedToUserId: newUserId,
                convertedAt: Math.floor(Date.now() / 1000),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(leads.id, id));

        return NextResponse.json({
            data: {
                user: newUser[0],
                enrollment,
                leadId: id,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error converting lead:', error);
        return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 });
    }
}
