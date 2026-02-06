/**
 * Utility script to approve pending user accounts
 * 
 * Usage: npx dotenv-cli -e .env.local -- npx tsx scripts/approve-user.ts <email_or_id> [role]
 * 
 * Examples:
 *   npx tsx scripts/approve-user.ts garcia.pedro.wow@gmail.com owner
 *   npx tsx scripts/approve-user.ts user_39Cjn2l4w4hKlmGEbXGr8rS506i admin
 * 
 * Post-migration: Now queries via persons table (canonical identity)
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, or, like } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function approveUser(identifier: string, newRole?: string) {
    console.log(`\n🔍 Looking for person: ${identifier}\n`);

    // Find person by email or ID
    const people = await db
        .select()
        .from(schema.persons)
        .where(
            or(
                eq(schema.persons.primaryEmail, identifier),
                eq(schema.persons.id, identifier),
                like(schema.persons.primaryEmail, `%${identifier}%`)
            )
        )
        .limit(5);

    if (people.length === 0) {
        console.log('❌ No persons found matching that identifier.\n');

        // List all persons
        const allPersons = await db.select().from(schema.persons).limit(10);
        if (allPersons.length > 0) {
            console.log('📋 Available persons:');
            allPersons.forEach(p => {
                console.log(`  - ${p.primaryEmail || '(no email)'} — ${p.firstName} ${p.lastName || ''} (${p.id})`);
                console.log(`    Status: ${p.status}`);
            });
        }

        // Also list users (Clerk bridges)
        const allUsers = await db.select().from(schema.users).limit(10);
        if (allUsers.length > 0) {
            console.log('\n📋 Clerk user bridges:');
            allUsers.forEach(u => {
                console.log(`  - ${u.id} → personId: ${u.personId || '(unmapped)'}`);
            });
        }
        return;
    }

    if (people.length > 1) {
        console.log('⚠️  Multiple persons found:');
        people.forEach(p => console.log(`  - ${p.primaryEmail || '(no email)'} — ${p.firstName} (${p.id})`));
        console.log('\nPlease be more specific.\n');
        return;
    }

    const person = people[0];

    // Find the linked user record
    const userRecords = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.personId, person.id))
        .limit(1);

    const user = userRecords[0];
    const currentPrefs = user
        ? (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences || {})
        : {};

    console.log('📧 Found person:');
    console.log(`   Email: ${person.primaryEmail}`);
    console.log(`   Name: ${person.firstName} ${person.lastName || ''}`);
    console.log(`   Status: ${person.status}`);
    if (user) {
        console.log(`   Clerk User ID: ${user.id}`);
        console.log(`   Approval Status: ${currentPrefs.approvalStatus || 'unknown'}`);
    } else {
        console.log(`   ⚠️ No Clerk user bridge linked to this person`);
    }

    // Check organization memberships for role
    const memberships = await db
        .select()
        .from(schema.organizationMemberships)
        .where(eq(schema.organizationMemberships.personId, person.id));

    if (memberships.length > 0) {
        console.log(`   Org Memberships:`);
        memberships.forEach(m => {
            console.log(`     - Org: ${m.organizationId}, Role: ${m.role}`);
        });
    }

    // If we have a user record, update its preferences to mark as approved
    if (user) {
        const updatedPrefs = {
            ...currentPrefs,
            approvalStatus: 'approved',
            approvedAt: Date.now(),
            approvedBy: 'script',
            requestedRole: null,
        };

        await db
            .update(schema.users)
            .set({
                preferences: JSON.stringify(updatedPrefs),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(schema.users.id, user.id));

        // If a role was specified, update the org membership
        if (newRole && memberships.length > 0) {
            await db
                .update(schema.organizationMemberships)
                .set({ role: newRole as typeof schema.organizationMemberships.$inferInsert['role'] })
                .where(eq(schema.organizationMemberships.personId, person.id));
            console.log(`\n✅ Person approved with role: ${newRole}`);
        } else {
            console.log('\n✅ Person approved!');
        }
    } else {
        console.log('\n⚠️ No user record to update. Person exists but has no Clerk bridge.');
    }

    console.log('🎉 Done.\n');
}

// Main execution
const [, , identifier, role] = process.argv;

if (!identifier) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           User Approval Utility (Person-Canonical)        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Usage:                                                    ║
║    npx tsx scripts/approve-user.ts <email_or_id> [role]   ║
║                                                            ║
║  Examples:                                                 ║
║    npx tsx scripts/approve-user.ts john@example.com       ║
║    npx tsx scripts/approve-user.ts user_abc123 admin      ║
║    npx tsx scripts/approve-user.ts pedro owner            ║
║                                                            ║
║  Valid Roles:                                              ║
║    student, parent, teacher, staff, admin, owner           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
    process.exit(0);
}

approveUser(identifier, role)
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
