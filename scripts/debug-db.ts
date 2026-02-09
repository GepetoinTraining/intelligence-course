import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

async function main() {
    const r = await c.execute('SELECT * FROM organization_memberships');
    console.log(`organization_memberships: ${r.rows.length} rows\n`);
    r.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));

    console.log('\n---\n');

    const u = await c.execute('SELECT id, person_id, onboarding_completed, preferences FROM users');
    console.log(`users: ${u.rows.length} rows\n`);
    u.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
