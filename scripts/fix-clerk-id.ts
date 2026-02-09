import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    // Step 1: Get users from Clerk
    const clerkRes = await fetch('https://api.clerk.com/v1/users?limit=10', {
        headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        }
    });

    if (!clerkRes.ok) {
        console.error('Clerk API error:', await clerkRes.text());
        return;
    }

    const clerkUsers = await clerkRes.json();
    console.log(`Found ${clerkUsers.length} Clerk users:\n`);

    for (const u of clerkUsers) {
        const email = u.email_addresses?.[0]?.email_address || 'no-email';
        console.log(`  Clerk ID: ${u.id}`);
        console.log(`  Email: ${email}`);
        console.log(`  Name: ${u.first_name} ${u.last_name}`);
        console.log('');
    }

    // Step 2: Find the pedro user
    const pedro = clerkUsers.find((u: any) =>
        u.email_addresses?.some((e: any) => e.email_address === 'garcia.pedro.wow@gmail.com')
    );

    if (!pedro) {
        console.log('❌ pedro user not found in Clerk!');
        return;
    }

    const realClerkId = pedro.id;
    console.log(`✅ Real Clerk ID for Pedro: ${realClerkId}`);

    // Step 3: Check what's in the DB
    const { createClient } = await import('@libsql/client');
    const c = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

    const dbUser = await c.execute('SELECT id, person_id FROM users');
    console.log(`\nDB users: ${dbUser.rows.length}`);
    dbUser.rows.forEach(r => console.log(`  DB user ID: ${r.id}, personId: ${r.person_id}`));

    // Step 4: Update the user ID if different
    if (dbUser.rows.length > 0 && dbUser.rows[0].id !== realClerkId) {
        console.log(`\n⚠️  MISMATCH! DB has: ${dbUser.rows[0].id}, Clerk has: ${realClerkId}`);
        console.log('Updating DB to use real Clerk ID...');

        await c.execute({
            sql: 'UPDATE users SET id = ? WHERE id = ?',
            args: [realClerkId, dbUser.rows[0].id as string]
        });

        // Verify
        const verify = await c.execute('SELECT id, person_id FROM users');
        console.log(`\n✅ Updated! DB user ID is now: ${verify.rows[0].id}`);
    } else {
        console.log('\n✅ IDs already match, no update needed.');
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
