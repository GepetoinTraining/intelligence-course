import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Resolve local db path - for file: URLs, use full path from project root
const dbUrl = process.env.TURSO_DATABASE_URL!;
const resolvedUrl = dbUrl.startsWith('file:')
    ? `file:${process.cwd().replace(/\\/g, '/')}/${dbUrl.replace('file:', '')}`
    : dbUrl;

const client = createClient({
    url: resolvedUrl,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });

// Re-export schema for convenience
export * from './schema';

// Type helper for transactions
export type Database = typeof db;

