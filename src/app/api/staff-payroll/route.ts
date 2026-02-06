import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staffPayroll, staffContracts, users, persons } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/staff-payroll - List payroll records
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const staffUserId = searchParams.get('personId');
    const contractId = searchParams.get('contractId');
    const status = searchParams.get('status');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(staffPayroll.organizationId, orgId));
        }

        if (staffUserId) {
            conditions.push(eq(staffPayroll.personId, staffUserId));
        }

        if (contractId) {
            conditions.push(eq(staffPayroll.contractId, contractId));
        }

        if (status) {
            conditions.push(eq(staffPayroll.status, status as any));
        }

        if (periodStart) {
            conditions.push(gte(staffPayroll.periodStart, parseInt(periodStart)));
        }

        if (periodEnd) {
            conditions.push(lte(staffPayroll.periodEnd, parseInt(periodEnd)));
        }

        const result = await db
            .select({
                payroll: staffPayroll,
                contract: {
                    id: staffContracts.id,
                    jobTitle: staffContracts.jobTitle,
                    department: staffContracts.department,
                    contractType: staffContracts.contractType,
                },
                user: {
                    id: users.id,
                    name: persons.firstName,
                    email: persons.primaryEmail,
                }
            })
            .from(staffPayroll)
            .leftJoin(staffContracts, eq(staffPayroll.contractId, staffContracts.id))
            .leftJoin(users, eq(staffPayroll.personId, users.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(staffPayroll.periodStart))
            .limit(limit)
            .offset(offset);

        const flattened = result.map(r => ({
            ...r.payroll,
            userName: r.user?.name,
            personEmail: r.user?.email,
            jobTitle: r.contract?.jobTitle,
            department: r.contract?.department,
            contractType: r.contract?.contractType,
        }));

        return NextResponse.json({ data: flattened });
    } catch (error) {
        console.error('Error fetching payroll:', error);
        return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 });
    }
}

// POST /api/staff-payroll - Create payroll entry
export async function POST(request: NextRequest) {
    const { personId: authUserId, orgId } = await getApiAuthWithOrg();
    if (!authUserId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Calculate net amount if not provided
        const grossAmount = body.grossAmountCents || 0;
        const deductions = body.totalDeductionsCents || 0;
        const additions = body.totalAdditionsCents || 0;
        const netAmount = body.netAmountCents || (grossAmount - deductions + additions);

        const newPayroll = await db.insert(staffPayroll).values({
            organizationId: orgId,
            contractId: body.contractId,
            personId: body.personId,
            periodStart: body.periodStart,
            periodEnd: body.periodEnd,
            paymentDueDate: body.paymentDueDate,
            payrollType: body.payrollType || 'salary',
            grossAmountCents: grossAmount,
            deductions: body.deductions ? JSON.stringify(body.deductions) : '{}',
            totalDeductionsCents: deductions,
            additions: body.additions ? JSON.stringify(body.additions) : '{}',
            totalAdditionsCents: additions,
            netAmountCents: netAmount,
            currency: body.currency || 'BRL',
            hoursWorked: body.hoursWorked,
            hourlyRateCents: body.hourlyRateCents,
            timesheetId: body.timesheetId,
            status: 'draft',
            calculatedBy: authUserId,
            calculatedAt: Date.now(),
            notes: body.notes,
        }).returning();

        return NextResponse.json({ data: newPayroll[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating payroll:', error);
        return NextResponse.json({ error: 'Failed to create payroll' }, { status: 500 });
    }
}




