import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classes, schedules, rooms, persons, courseTypes, levels, terms } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/enrollment-flow/classes?courseTypeId=xxx&levelId=yyy
// Returns available classes with schedules, teacher info, and vacancy count
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const courseTypeId = searchParams.get('courseTypeId');
    const levelId = searchParams.get('levelId');
    const termId = searchParams.get('termId');

    try {
        // Build conditions
        const conditions = [
            eq(classes.organizationId, orgId),
            sql`${classes.status} IN ('open', 'in_progress')`,
        ];

        if (courseTypeId) {
            conditions.push(eq(classes.courseTypeId, courseTypeId));
        }
        if (levelId) {
            conditions.push(eq(classes.levelId, levelId));
        }
        if (termId) {
            conditions.push(eq(classes.termId, termId));
        }

        // Fetch classes with teacher info
        const classResults = await db
            .select({
                class: classes,
                teacher: {
                    id: persons.id,
                    firstName: persons.firstName,
                    lastName: persons.lastName,
                    avatarUrl: persons.avatarUrl,
                },
            })
            .from(classes)
            .leftJoin(persons, eq(classes.teacherId, persons.id))
            .where(and(...conditions))
            .orderBy(classes.name);

        // Fetch schedules for these classes
        const classIds = classResults.map(c => c.class.id);

        let classSchedules: any[] = [];
        if (classIds.length > 0) {
            classSchedules = await db
                .select({
                    schedule: schedules,
                    room: {
                        id: rooms.id,
                        name: rooms.name,
                    },
                })
                .from(schedules)
                .leftJoin(rooms, eq(schedules.roomId, rooms.id))
                .where(
                    and(
                        sql`${schedules.classId} IN (${sql.join(classIds.map(id => sql`${id}`), sql`, `)})`,
                        eq(schedules.isActive, 1)
                    )
                )
                .orderBy(schedules.dayOfWeek, schedules.startTime);
        }

        // Fetch course type and level names for display
        const allCourseTypes = await db.select().from(courseTypes);
        const allLevels = await db.select().from(levels);

        // Assemble response
        const dayNames = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

        const result = classResults.map(cr => {
            const clsSchedules = classSchedules.filter(s => s.schedule.classId === cr.class.id);
            const ct = allCourseTypes.find(t => t.id === cr.class.courseTypeId);
            const lvl = allLevels.find(l => l.id === cr.class.levelId);

            const vacancy = (cr.class.maxStudents || 15) - (cr.class.currentStudents || 0);

            return {
                id: cr.class.id,
                name: cr.class.name,
                status: cr.class.status,
                courseType: ct ? { id: ct.id, name: ct.name } : null,
                level: lvl ? { id: lvl.id, name: lvl.name, code: lvl.code } : null,
                teacher: cr.teacher ? {
                    id: cr.teacher.id,
                    name: [cr.teacher.firstName, cr.teacher.lastName].filter(Boolean).join(' '),
                    avatarUrl: cr.teacher.avatarUrl,
                } : null,
                maxStudents: cr.class.maxStudents || 15,
                currentStudents: cr.class.currentStudents || 0,
                vacancy,
                isFull: vacancy <= 0,
                monthlyPrice: ct?.defaultMonthlyPrice || null,
                schedules: clsSchedules.map(s => ({
                    id: s.schedule.id,
                    dayOfWeek: s.schedule.dayOfWeek,
                    dayName: dayNames[s.schedule.dayOfWeek] || `Dia ${s.schedule.dayOfWeek}`,
                    startTime: s.schedule.startTime,
                    endTime: s.schedule.endTime,
                    room: s.room ? { id: s.room.id, name: s.room.name } : null,
                })),
                startsAt: cr.class.startsAt,
                endsAt: cr.class.endsAt,
            };
        });

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching classes for enrollment:', error);
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
}
