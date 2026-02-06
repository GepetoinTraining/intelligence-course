/**
 * Seed the owner account directly
 * 
 * Usage: npx tsx scripts/seed-owner.ts
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function seedOwner() {
    // Pedro's Clerk user ID (from the screenshot)
    const OWNER_ID = 'user_39Cjn2l4w4hKlmGEbXGr8rS506i';
    const OWNER_EMAIL = 'garcia.pedro.wow@gmail.com';
    const OWNER_NAME = 'Pedro Garcia';

    console.log('\n🔧 Seeding owner account...\n');

    // Check if user exists
    const existing = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, OWNER_ID))
        .limit(1);

    if (existing.length > 0) {
        console.log('User already exists, updating to owner...');
        await db
            .update(schema.users)
            .set({
                role: 'owner',
                preferences: JSON.stringify({
                    approvalStatus: 'approved',
                    approvedAt: Date.now(),
                    onboardingCompletedAt: Date.now(),
                }),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(schema.users.id, OWNER_ID));
    } else {
        console.log('Creating new owner user...');
        await db.insert(schema.users).values({
            id: OWNER_ID,
            email: OWNER_EMAIL,
            name: OWNER_NAME,
            role: 'owner',
            preferences: JSON.stringify({
                approvalStatus: 'approved',
                approvedAt: Date.now(),
                onboardingCompletedAt: Date.now(),
            }),
        });
    }

    // Verify
    const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, OWNER_ID))
        .limit(1);

    console.log('\n✅ Owner account ready!');
    console.log(`   ID: ${user[0].id}`);
    console.log(`   Email: ${user[0].email}`);
    console.log(`   Role: ${user[0].role}`);
    console.log('\n🎉 You can now access the dashboard as owner.\n');
}

seedOwner()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
