import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { costCenters, users, persons } from '@/lib/db/schema';
import { eq, and, asc, isNull } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/cost-centers - List cost centers
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const centerType = searchParams.get('type');
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const hierarchy = searchParams.get('hierarchy') === 'true';

    try {
        const conditions = [eq(costCenters.organizationId, orgId)];

        if (centerType) {
            conditions.push(eq(costCenters.centerType, centerType as any));
        }

        if (activeOnly) {
            conditions.push(eq(costCenters.isActive, 1));
        }

        const result = await db
            .select({
                costCenter: costCenters,
                manager: {
                    id: users.id,
                    name: persons.firstName,
                    email: persons.primaryEmail,
                }
            })
            .from(costCenters)
            .leftJoin(users, eq(costCenters.managerId, users.id))
            .where(and(...conditions))
            .orderBy(asc(costCenters.code));

        const flattened = result.map(r => ({
            ...r.costCenter,
            managerName: r.manager?.name,
            managerEmail: r.manager?.email,
        }));

        // If hierarchy requested, build tree structure
        if (hierarchy) {
            const buildTree = (items: typeof flattened, parentId: string | null = null): any[] => {
                return items
                    .filter(item => item.parentId === parentId)
                    .map(item => ({
                        ...item,
                        children: buildTree(items, item.id),
                    }));
            };
            return NextResponse.json({ data: buildTree(flattened) });
        }

        return NextResponse.json({ data: flattened });
    } catch (error) {
        console.error('Error fetching cost centers:', error);
        return NextResponse.json({ error: 'Failed to fetch cost centers' }, { status: 500 });
    }
}

// POST /api/cost-centers - Create cost center
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Check for duplicate code
        const existing = await db
            .select({ id: costCenters.id })
            .from(costCenters)
            .where(
                and(
                    eq(costCenters.organizationId, orgId),
                    eq(costCenters.code, body.code)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ error: 'Cost center code already exists' }, { status: 400 });
        }

        // Determine level based on parent
        let level = 1;
        if (body.parentId) {
            const parent = await db
                .select({ level: costCenters.level })
                .from(costCenters)
                .where(eq(costCenters.id, body.parentId))
                .limit(1);
            if (parent.length > 0) {
                level = (parent[0].level || 1) + 1;
            }
        }

        const newCenter = await db.insert(costCenters).values({
            organizationId: orgId,
            code: body.code,
            name: body.name,
            description: body.description,
            parentId: body.parentId || null,
            level,
            centerType: body.centerType || 'department',
            managerId: body.managerId || null,
            annualBudgetCents: body.annualBudgetCents,
            monthlyBudgetCents: body.monthlyBudgetCents,
            isActive: 1,
        }).returning();

        return NextResponse.json({ data: newCenter[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating cost center:', error);
        return NextResponse.json({ error: 'Failed to create cost center' }, { status: 500 });
    }
}




