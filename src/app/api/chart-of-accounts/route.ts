import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chartOfAccounts } from '@/lib/db/schema';
import { eq, and, asc, isNull } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/chart-of-accounts - List chart of accounts
export async function GET(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountType = searchParams.get('type');
    const parentId = searchParams.get('parentId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const hierarchy = searchParams.get('hierarchy') === 'true';

    try {
        const conditions = [eq(chartOfAccounts.organizationId, orgId)];

        if (accountType) {
            conditions.push(eq(chartOfAccounts.accountType, accountType as any));
        }

        if (parentId === 'null') {
            conditions.push(isNull(chartOfAccounts.parentId));
        } else if (parentId) {
            conditions.push(eq(chartOfAccounts.parentId, parentId));
        }

        if (activeOnly) {
            conditions.push(eq(chartOfAccounts.isActive, 1));
        }

        const result = await db
            .select()
            .from(chartOfAccounts)
            .where(and(...conditions))
            .orderBy(asc(chartOfAccounts.code));

        // If hierarchy requested, build tree structure
        if (hierarchy) {
            const buildTree = (items: typeof result, parentId: string | null = null): any[] => {
                return items
                    .filter(item => item.parentId === parentId)
                    .map(item => ({
                        ...item,
                        children: buildTree(items, item.id),
                    }));
            };
            return NextResponse.json({ data: buildTree(result) });
        }

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching chart of accounts:', error);
        return NextResponse.json({ error: 'Failed to fetch chart of accounts' }, { status: 500 });
    }
}

// POST /api/chart-of-accounts - Create account
export async function POST(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Check for duplicate code
        const existing = await db
            .select({ id: chartOfAccounts.id })
            .from(chartOfAccounts)
            .where(
                and(
                    eq(chartOfAccounts.organizationId, orgId),
                    eq(chartOfAccounts.code, body.code)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ error: 'Account code already exists' }, { status: 400 });
        }

        // Determine level based on parent
        let level = 1;
        if (body.parentId) {
            const parent = await db
                .select({ level: chartOfAccounts.level })
                .from(chartOfAccounts)
                .where(eq(chartOfAccounts.id, body.parentId))
                .limit(1);
            if (parent.length > 0) {
                level = (parent[0].level || 1) + 1;
            }
        }

        const newAccount = await db.insert(chartOfAccounts).values({
            organizationId: orgId,
            code: body.code,
            name: body.name,
            description: body.description,
            accountType: body.accountType,
            nature: body.nature,
            classification: body.classification,
            parentId: body.parentId || null,
            level,
            allowsPosting: body.allowsPosting !== false ? 1 : 0,
            isSystem: 0,
            isActive: 1,
            cofinsApplicable: body.cofinsApplicable ? 1 : 0,
            pisApplicable: body.pisApplicable ? 1 : 0,
            csllApplicable: body.csllApplicable ? 1 : 0,
            irpjApplicable: body.irpjApplicable ? 1 : 0,
        }).returning();

        return NextResponse.json({ data: newAccount[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}

