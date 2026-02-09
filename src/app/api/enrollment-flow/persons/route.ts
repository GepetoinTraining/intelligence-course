import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { persons, personContacts } from '@/lib/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/enrollment-flow/persons - Create or search for persons (parent + student)
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action } = body; // 'search' or 'create'

        if (action === 'search') {
            // Search by email, phone, CPF, or name
            const { query } = body;
            if (!query || query.length < 3) {
                return NextResponse.json({ data: [] });
            }

            const searchResults = await db
                .select()
                .from(persons)
                .where(
                    or(
                        sql`lower(${persons.firstName} || ' ' || coalesce(${persons.lastName}, '')) LIKE lower(${'%' + query + '%'})`,
                        sql`${persons.primaryEmail} LIKE ${'%' + query + '%'}`,
                        sql`${persons.primaryPhone} LIKE ${'%' + query + '%'}`,
                        eq(persons.taxId, query.replace(/[^\d]/g, '')),
                    )
                )
                .limit(10);

            return NextResponse.json({
                data: searchResults.map(p => ({
                    id: p.id,
                    name: [p.firstName, p.lastName].filter(Boolean).join(' '),
                    firstName: p.firstName,
                    lastName: p.lastName,
                    email: p.primaryEmail,
                    phone: p.primaryPhone,
                    taxId: p.taxId,
                    birthDate: p.birthDate,
                    avatarUrl: p.avatarUrl,
                })),
            });
        }

        if (action === 'create') {
            const { firstName, lastName, email, phone, taxId, taxIdType, birthDate, gender } = body;

            if (!firstName) {
                return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
            }

            // Check if person already exists by email or CPF
            if (email || taxId) {
                const existing = await db
                    .select()
                    .from(persons)
                    .where(
                        or(
                            email ? eq(persons.primaryEmail, email) : sql`0`,
                            taxId ? eq(persons.taxId, taxId.replace(/[^\d]/g, '')) : sql`0`
                        )
                    )
                    .limit(1);

                if (existing.length > 0) {
                    return NextResponse.json({
                        data: existing[0],
                        existing: true,
                        message: 'Pessoa já cadastrada no sistema',
                    });
                }
            }

            // Create new person
            const newPerson = await db.insert(persons).values({
                firstName,
                lastName: lastName || null,
                primaryEmail: email || null,
                primaryPhone: phone || null,
                taxId: taxId ? taxId.replace(/[^\d]/g, '') : null,
                taxIdType: taxIdType || (taxId ? 'cpf' : null),
                birthDate: birthDate ? Math.floor(new Date(birthDate).getTime() / 1000) : null,
                gender: gender || null,
                status: 'active',
            }).returning();

            // Add address contact if provided
            if (body.address) {
                await db.insert(personContacts).values({
                    personId: newPerson[0].id,
                    contactType: 'address',
                    contactValue: body.address.addressLine1 || '',
                    addressLine1: body.address.addressLine1,
                    addressLine2: body.address.addressLine2,
                    city: body.address.city,
                    state: body.address.state,
                    postalCode: body.address.postalCode,
                    country: 'BR',
                    isPrimary: 1,
                });
            }

            return NextResponse.json({
                data: newPerson[0],
                existing: false,
            }, { status: 201 });
        }

        return NextResponse.json({ error: 'Invalid action. Use "search" or "create".' }, { status: 400 });
    } catch (error) {
        console.error('Error in enrollment persons:', error);
        return NextResponse.json({ error: 'Failed to process person request' }, { status: 500 });
    }
}
