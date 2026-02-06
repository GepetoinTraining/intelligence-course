import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, leads, enrollments, classes, courses, persons } from '@/lib/db/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';

// ============================================================================
// GET: Fetch full funnel data (CAC → LTV)
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { personId: clerkUserId } = await getApiAuthWithOrg();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user
        const [currentUser] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
        if (!currentUser?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const assigneeFilter = searchParams.get('assignee');

        // ========================================
        // 1. Fetch Leads (CAC Phase)
        // ========================================

        let leadsQuery = db.select({
            id: leads.id,
            name: leads.name,
            email: leads.email,
            phone: leads.phone,
            stage: leads.status,
            source: leads.source,
            interestedIn: leads.interestedIn,
            assignedToId: leads.assignedTo,
            createdAt: leads.createdAt,
            updatedAt: leads.updatedAt,
            lastContactAt: leads.lastContactAt,
            nextFollowupAt: leads.nextFollowupAt,
        })
            .from(leads)
            .where(eq(leads.organizationId, currentUser.organizationId));

        const leadsData = await leadsQuery;

        // Get assigned user names
        const assignedUserIds = [...new Set(leadsData.map(l => l.assignedToId).filter(Boolean))] as string[];
        const assignedUsers = assignedUserIds.length > 0
            ? await db.select({
                id: users.id,
                name: persons.firstName,
                avatarUrl: persons.avatarUrl,
            }).from(users).where(sql`${users.id} IN (${sql.join(assignedUserIds.map(id => sql`${id}`), sql`, `)})`)
            : [];

        const userMap = new Map(assignedUsers.map(u => [u.id, u]));

        // ========================================
        // 2. Fetch Enrollments (Conversion + LTV Phase)
        // ========================================

        const enrollmentsData = await db.select({
            id: enrollments.id,
            personId: enrollments.personId,
            status: enrollments.status,
            enrolledAt: enrollments.enrolledAt,
            classId: enrollments.classId,
            leadId: enrollments.leadId,
        })
            .from(enrollments)
            .where(eq(enrollments.organizationId, currentUser.organizationId));

        // Get enrolled user details
        const enrolledUserIds = [...new Set(enrollmentsData.map(e => e.personId))];
        const enrolledUsers = enrolledUserIds.length > 0
            ? await db.select({
                id: users.id,
                name: persons.firstName,
                email: persons.primaryEmail,
                avatarUrl: persons.avatarUrl,
            }).from(users).where(sql`${users.id} IN (${sql.join(enrolledUserIds.map(id => sql`${id}`), sql`, `)})`)
            : [];

        const enrolledUserMap = new Map(enrolledUsers.map(u => [u.id, u]));

        // Get class details
        const classIds = [...new Set(enrollmentsData.map(e => e.classId))];
        const classesData = classIds.length > 0
            ? await db.select({
                id: classes.id,
                name: classes.name,
                courseId: classes.courseId,
            }).from(classes).where(sql`${classes.id} IN (${sql.join(classIds.map(id => sql`${id}`), sql`, `)})`)
            : [];

        const classMap = new Map(classesData.map(c => [c.id, c]));

        // ========================================
        // 3. Build unified funnel items
        // ========================================

        const now = Date.now();
        const items: any[] = [];

        // CAC items (leads not yet enrolled)
        const enrolledLeadIds = new Set(enrollmentsData.filter(e => e.leadId).map(e => e.leadId));

        for (const lead of leadsData) {
            if (lead.stage === 'enrolled' || enrolledLeadIds.has(lead.id)) continue;

            const assignedUser = lead.assignedToId ? userMap.get(lead.assignedToId) : null;
            const createdAt = lead.createdAt || now;
            const daysInStage = Math.floor((now - (lead.updatedAt || createdAt)) / (1000 * 60 * 60 * 24));

            let interests: string[] = [];
            try {
                interests = lead.interestedIn ? JSON.parse(lead.interestedIn) : [];
            } catch { }

            items.push({
                id: lead.id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                stage: lead.stage || 'new',
                status: 'lead',
                assignedTo: assignedUser ? {
                    id: assignedUser.id,
                    name: assignedUser.name || 'Sem nome',
                    avatarUrl: assignedUser.avatarUrl,
                } : null,
                value: 0, // Potential value - could be calculated from interested courses
                daysInStage,
                lastContact: lead.lastContactAt,
                nextFollowup: lead.nextFollowupAt,
                source: lead.source,
                course: interests[0] || null,
                tags: [],
            });
        }

        // LTV items (enrollments)
        for (const enrollment of enrollmentsData) {
            const user = enrolledUserMap.get(enrollment.personId);
            if (!user) continue;

            const classInfo = enrollment.classId ? classMap.get(enrollment.classId) : null;
            const enrolledAt = enrollment.enrolledAt || now;
            const daysInStage = Math.floor((now - enrolledAt) / (1000 * 60 * 60 * 24));

            // Map enrollment status to funnel stage
            let stage = 'enrolled';
            if (enrollment.status === 'active') stage = 'active';
            else if (enrollment.status === 'paused') stage = 'paused';
            else if (enrollment.status === 'completed') stage = 'completed';
            else if (enrollment.status === 'dropped') stage = 'at_risk';

            items.push({
                id: enrollment.id,
                name: user.name || user.email || 'Aluno',
                email: user.email,
                phone: null,
                stage,
                status: 'student',
                assignedTo: null, // Could be assigned to teacher
                value: 2500, // Monthly fee - should come from tuition data
                daysInStage,
                lastContact: null,
                nextFollowup: null,
                source: null,
                course: classInfo?.name || 'Curso',
                tags: enrollment.status === 'paused' ? ['Pausado'] : [],
            });
        }

        // Filter by assignee if requested
        let filteredItems = items;
        if (assigneeFilter === 'me') {
            filteredItems = items.filter(i => i.assignedTo?.id === clerkUserId);
        }

        // ========================================
        // 4. Calculate summary metrics
        // ========================================

        const cacStages = ['new', 'contacted', 'qualified', 'trial_scheduled', 'trial_completed', 'proposal_sent'];
        const ltvStages = ['active', 'at_risk', 'paused'];

        const cacItems = filteredItems.filter(i => cacStages.includes(i.stage));
        const ltvItems = filteredItems.filter(i => ltvStages.includes(i.stage));
        const enrolledItems = filteredItems.filter(i => i.stage === 'enrolled');

        const summary = {
            cac: {
                count: cacItems.length,
                value: cacItems.reduce((s, i) => s + i.value, 0),
            },
            enrolled: {
                count: enrolledItems.length,
                value: enrolledItems.reduce((s, i) => s + i.value, 0),
            },
            ltv: {
                count: ltvItems.length,
                value: ltvItems.reduce((s, i) => s + i.value, 0),
            },
            conversionRate: cacItems.length > 0 ? (enrolledItems.length / cacItems.length) * 100 : 0,
        };

        return NextResponse.json({
            items: filteredItems,
            summary,
        });
    } catch (error) {
        console.error('Error fetching funnel:', error);
        return NextResponse.json({ error: 'Failed to fetch funnel' }, { status: 500 });
    }
}

// ============================================================================
// POST: Move item to next stage
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const { personId: clerkUserId } = await getApiAuthWithOrg();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { itemId, itemType, newStage, notes } = body;

        if (!itemId || !newStage) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000) * 1000;

        if (itemType === 'lead') {
            await db.update(leads)
                .set({
                    status: newStage,
                    updatedAt: now,
                })
                .where(eq(leads.id, itemId));
        } else if (itemType === 'enrollment') {
            await db.update(enrollments)
                .set({
                    status: newStage,
                    updatedAt: now,
                })
                .where(eq(enrollments.id, itemId));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating funnel item:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}



