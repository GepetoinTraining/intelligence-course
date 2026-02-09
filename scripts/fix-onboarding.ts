import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const c = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

async function main() {
    const userId = 'user_39Cjn2l4w4hKlmGEbXGr8rS506i';

    // Get current prefs
    const r = await c.execute({ sql: 'SELECT preferences FROM users WHERE id = ?', args: [userId] });
    const currentPrefs = JSON.parse(r.rows[0].preferences as string || '{}');
    console.log('Current prefs:', currentPrefs);

    // Add onboardingCompletedAt
    currentPrefs.onboardingCompletedAt = Date.now();

    await c.execute({
        sql: 'UPDATE users SET preferences = ?, onboarding_completed = 1 WHERE id = ?',
        args: [JSON.stringify(currentPrefs), userId]
    });

    // Verify
    const v = await c.execute({ sql: 'SELECT preferences, onboarding_completed FROM users WHERE id = ?', args: [userId] });
    console.log('Updated prefs:', JSON.parse(v.rows[0].preferences as string));
    console.log('onboarding_completed:', v.rows[0].onboarding_completed);
    console.log('\n✅ Done — onboarding flag set.');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
