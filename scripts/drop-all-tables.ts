import { createClient } from '@libsql/client';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    // Get all user tables
    const result = await client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%' AND name != 'libsql_wasm_func_table'"
    );

    const tables = result.rows.map((row) => row.name as string);
    console.log(`Found ${tables.length} tables to drop`);

    if (tables.length === 0) {
        console.log('No tables to drop.');
        return;
    }

    // Disable foreign keys for clean drop
    await client.execute('PRAGMA foreign_keys = OFF');

    for (const table of tables) {
        await client.execute(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`  Dropped: ${table}`);
    }

    await client.execute('PRAGMA foreign_keys = ON');
    console.log(`\nDone — dropped ${tables.length} tables.`);
}

main().catch(console.error);
