import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courseTypes, levels, classes, schedules, terms } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/enrollment-flow/courses
// Returns available course types with their levels and open class counts
export async function GET() {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get all course types
        const allCourseTypes = await db.select().from(courseTypes);

        // Get levels per course type
        const allLevels = await db
            .select()
            .from(levels)
            .orderBy(levels.orderIndex);

        // Get open class count per courseType (only open/in_progress classes in this org)
        const classCounts = await db
            .select({
                courseTypeId: classes.courseTypeId,
                openClasses: sql<number>`count(*)`.as('open_classes'),
                totalSpots: sql<number>`sum(${classes.maxStudents})`.as('total_spots'),
                filledSpots: sql<number>`sum(${classes.currentStudents})`.as('filled_spots'),
            })
            .from(classes)
            .where(
                and(
                    eq(classes.organizationId, orgId),
                    sql`${classes.status} IN ('open', 'in_progress')`
                )
            )
            .groupBy(classes.courseTypeId);

        // Get current term
        const currentTerm = await db
            .select()
            .from(terms)
            .where(
                and(
                    eq(terms.organizationId, orgId),
                    eq(terms.isCurrent, 1)
                )
            )
            .limit(1);

        // Assemble the response
        const result = allCourseTypes.map(ct => {
            const ctLevels = allLevels.filter(l => l.courseTypeId === ct.id);
            const counts = classCounts.find(c => c.courseTypeId === ct.id);

            return {
                ...ct,
                levels: ctLevels,
                openClasses: counts?.openClasses || 0,
                availableSpots: (counts?.totalSpots || 0) - (counts?.filledSpots || 0),
            };
        });

        return NextResponse.json({
            data: result,
            currentTerm: currentTerm[0] || null,
        });
    } catch (error) {
        console.error('Error fetching courses for enrollment:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}
