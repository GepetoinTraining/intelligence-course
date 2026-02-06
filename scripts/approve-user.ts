/**
 * Utility script to approve pending user accounts
 * 
 * Usage: npx tsx scripts/approve-user.ts <email_or_id> [role]
 * 
 * Examples:
 *   npx tsx scripts/approve-user.ts garcia.pedro.wow@gmail.com owner
 *   npx tsx scripts/approve-user.ts user_39Cjn2l4w4hKlmGEbXGr8rS506i admin
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
    console.log(`\n🔍 Looking for user: ${identifier}\n`);

    // Find user by email or ID
    const users = await db
        .select()
        .from(schema.users)
        .where(
            or(
                eq(schema.users.email, identifier),
                eq(schema.users.id, identifier),
                like(schema.users.email, `%${identifier}%`)
            )
        )
        .limit(5);

    if (users.length === 0) {
        console.log('❌ No users found matching that identifier.\n');

        // List all users
        const allUsers = await db.select().from(schema.users).limit(10);
        if (allUsers.length > 0) {
            console.log('📋 Available users:');
            allUsers.forEach(u => {
                const prefs = typeof u.preferences === 'string'
                    ? JSON.parse(u.preferences)
                    : u.preferences || {};
                console.log(`  - ${u.email} (${u.id})`);
                console.log(`    Role: ${u.role}, Status: ${prefs.approvalStatus || 'unknown'}`);
            });
        }
        return;
    }

    if (users.length > 1) {
        console.log('⚠️  Multiple users found:');
        users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
        console.log('\nPlease be more specific.\n');
        return;
    }

    const user = users[0];
    const currentPrefs = typeof user.preferences === 'string'
        ? JSON.parse(user.preferences)
        : user.preferences || {};

    console.log('📧 Found user:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Requested Role: ${currentPrefs.requestedRole || 'none'}`);
    console.log(`   Approval Status: ${currentPrefs.approvalStatus || 'unknown'}`);

    // Determine the new role
    const finalRole = newRole || currentPrefs.requestedRole || user.role;

    // Update user
    const updatedPrefs = {
        ...currentPrefs,
        approvalStatus: 'approved',
        approvedAt: Date.now(),
        approvedBy: 'script',
        requestedRole: null, // Clear the request
    };

    await db
        .update(schema.users)
        .set({
            role: finalRole,
            preferences: JSON.stringify(updatedPrefs),
            updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(schema.users.id, user.id));

    console.log('\n✅ User approved!');
    console.log(`   New Role: ${finalRole}`);
    console.log(`   Status: approved`);
    console.log('\n🎉 User can now access the dashboard.\n');
}

// Main execution
const [, , identifier, role] = process.argv;

if (!identifier) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           User Approval Utility                           ║
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
║    student, parent, teacher, staff, admin, owner, accountant  ║
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
