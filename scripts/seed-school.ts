/**
 * Seed script for Node Zero School Management
 * 
 * Run with: npx tsx scripts/seed-school.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../src/lib/db/schema';
import path from 'path';

// Resolve local db path relative to project root
const dbUrl = process.env.TURSO_DATABASE_URL!;
const resolvedUrl = dbUrl.startsWith('file:')
    ? `file:${path.resolve(process.cwd(), dbUrl.replace('file:', ''))}`
    : dbUrl;

// Initialize database
const client = createClient({
    url: resolvedUrl,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const db = drizzle(client, { schema });

async function seed() {
    console.log('🌱 Starting school seed...\n');

    // ========================================
    // COURSE TYPES
    // ========================================
    console.log('📚 Seeding course types...');

    const courseTypes = [
        {
            id: 'english',
            name: 'English',
            hasLevels: 1,
            hasModules: 1,
            defaultDurationWeeks: 24,
            defaultHoursPerWeek: 2,
            defaultMonthlyPrice: 35000, // R$ 350,00
        },
        {
            id: 'spanish',
            name: 'Spanish',
            hasLevels: 1,
            hasModules: 1,
            defaultDurationWeeks: 24,
            defaultHoursPerWeek: 2,
            defaultMonthlyPrice: 35000,
        },
        {
            id: 'intelligence',
            name: 'AI Intelligence',
            hasLevels: 0,
            hasModules: 1,
            defaultDurationWeeks: 12,
            defaultHoursPerWeek: 2,
            defaultMonthlyPrice: 45000, // R$ 450,00
        },
        {
            id: 'private',
            name: 'Private Lessons',
            hasLevels: 0,
            hasModules: 0,
            defaultDurationWeeks: null,
            defaultHoursPerWeek: 1,
            defaultMonthlyPrice: 15000, // R$ 150,00 per hour
        },
        {
            id: 'conversation',
            name: 'Conversation Club',
            hasLevels: 0,
            hasModules: 0,
            defaultDurationWeeks: null,
            defaultHoursPerWeek: 1.5,
            defaultMonthlyPrice: 10000, // R$ 100,00
        },
    ];

    for (const ct of courseTypes) {
        await db.insert(schema.courseTypes).values(ct).onConflictDoNothing();
    }
    console.log(`  ✓ ${courseTypes.length} course types\n`);

    // ========================================
    // CEFR LEVELS (for English/Spanish)
    // ========================================
    console.log('📊 Seeding CEFR levels...');

    const levels = [
        // English levels
        { courseTypeId: 'english', code: 'A1', name: 'Beginner', orderIndex: 1, estimatedHours: 90 },
        { courseTypeId: 'english', code: 'A2', name: 'Elementary', orderIndex: 2, estimatedHours: 90 },
        { courseTypeId: 'english', code: 'B1', name: 'Intermediate', orderIndex: 3, estimatedHours: 120 },
        { courseTypeId: 'english', code: 'B2', name: 'Upper Intermediate', orderIndex: 4, estimatedHours: 120 },
        { courseTypeId: 'english', code: 'C1', name: 'Advanced', orderIndex: 5, estimatedHours: 150 },
        { courseTypeId: 'english', code: 'C2', name: 'Proficiency', orderIndex: 6, estimatedHours: 150 },

        // Spanish levels
        { courseTypeId: 'spanish', code: 'A1', name: 'Principiante', orderIndex: 1, estimatedHours: 90 },
        { courseTypeId: 'spanish', code: 'A2', name: 'Básico', orderIndex: 2, estimatedHours: 90 },
        { courseTypeId: 'spanish', code: 'B1', name: 'Intermedio', orderIndex: 3, estimatedHours: 120 },
        { courseTypeId: 'spanish', code: 'B2', name: 'Intermedio Alto', orderIndex: 4, estimatedHours: 120 },
        { courseTypeId: 'spanish', code: 'C1', name: 'Avanzado', orderIndex: 5, estimatedHours: 150 },
        { courseTypeId: 'spanish', code: 'C2', name: 'Dominio', orderIndex: 6, estimatedHours: 150 },
    ];

    for (const level of levels) {
        await db.insert(schema.levels).values(level).onConflictDoNothing();
    }
    console.log(`  ✓ ${levels.length} levels\n`);

    // ========================================
    // AI PROVIDERS
    // ========================================
    console.log('🤖 Seeding AI providers...');

    const providers = [
        {
            id: 'anthropic',
            name: 'Anthropic',
            models: JSON.stringify([
                { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', maxTokens: 8192 },
                { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 8192 },
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 4096 },
            ]),
            isActive: 1,
            baseUrl: 'https://api.anthropic.com',
        },
        {
            id: 'openai',
            name: 'OpenAI',
            models: JSON.stringify([
                { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 4096 },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 4096 },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096 },
            ]),
            isActive: 1,
            baseUrl: 'https://api.openai.com/v1',
        },
        {
            id: 'google',
            name: 'Google',
            models: JSON.stringify([
                { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 8192 },
            ]),
            isActive: 0,
            baseUrl: 'https://generativelanguage.googleapis.com',
        },
    ];

    for (const provider of providers) {
        await db.insert(schema.aiProviders).values(provider).onConflictDoNothing();
    }
    console.log(`  ✓ ${providers.length} AI providers\n`);

    // ========================================
    // SAMPLE ORGANIZATION (for testing)
    // ========================================
    console.log('🏫 Seeding sample organization...');

    await db.insert(schema.organizations).values({
        id: 'org_nodezero',
        name: 'Node Zero Language School',
        slug: 'nodezero',
        plan: 'professional',
    }).onConflictDoNothing();
    console.log(`  ✓ 1 organization\n`);

    // ========================================
    // SAMPLE ROOMS
    // ========================================
    console.log('🚪 Seeding sample rooms...');

    const rooms = [
        { organizationId: 'org_nodezero', name: 'Sala 1', capacity: 12, roomType: 'classroom' as const, floor: 'Ground', amenities: '["whiteboard", "projector", "ac"]' },
        { organizationId: 'org_nodezero', name: 'Sala 2', capacity: 8, roomType: 'classroom' as const, floor: 'Ground', amenities: '["whiteboard", "ac"]' },
        { organizationId: 'org_nodezero', name: 'Lab', capacity: 15, roomType: 'lab' as const, floor: 'Ground', amenities: '["computers", "projector", "ac"]' },
        { organizationId: 'org_nodezero', name: 'Online', capacity: 100, roomType: 'online' as const, defaultMeetUrl: 'https://meet.google.com/xxx-xxxx-xxx', amenities: '[]' },
    ];

    for (const room of rooms) {
        await db.insert(schema.rooms).values(room).onConflictDoNothing();
    }
    console.log(`  ✓ ${rooms.length} rooms\n`);

    // ========================================
    // SAMPLE TERM
    // ========================================
    console.log('📅 Seeding sample term...');

    const now = Math.floor(Date.now() / 1000);
    const sixMonthsLater = now + (180 * 24 * 60 * 60);

    await db.insert(schema.terms).values({
        organizationId: 'org_nodezero',
        name: '2026.1',
        enrollmentOpens: now - (30 * 24 * 60 * 60),
        enrollmentCloses: now + (30 * 24 * 60 * 60),
        classesStart: now,
        classesEnd: sixMonthsLater,
        status: 'active',
        isCurrent: 1,
    }).onConflictDoNothing();
    console.log(`  ✓ 1 term\n`);

    // ========================================
    // BADGES
    // ========================================
    console.log('🏆 Seeding badges...');

    const badges = [
        { id: 'first_run', name: 'First Contact', description: 'Complete your first AI interaction', icon: '🚀', category: 'completion' as const, criteria: '{"runs": 1}', rarity: 'common' as const },
        { id: 'ten_runs', name: 'Getting Started', description: 'Complete 10 AI interactions', icon: '⭐', category: 'completion' as const, criteria: '{"runs": 10}', rarity: 'common' as const },
        { id: 'hundred_runs', name: 'Seasoned Prompter', description: 'Complete 100 AI interactions', icon: '🌟', category: 'completion' as const, criteria: '{"runs": 100}', rarity: 'rare' as const },
        { id: 'first_break', name: 'Character Breaker', description: 'Break your first AI character', icon: '💀', category: 'graveyard' as const, criteria: '{"breaks": 1}', rarity: 'uncommon' as const },
        { id: 'unbreakable', name: 'Unbreakable', description: 'Maintain character for 20+ turns', icon: '🔒', category: 'technique' as const, criteria: '{"turns": 20}', rarity: 'epic' as const },
        { id: 'orbit_master', name: 'Orbit Master', description: 'Use orbit technique successfully 10 times', icon: '🌙', category: 'technique' as const, criteria: '{"technique": "orbit", "count": 10}', rarity: 'uncommon' as const },
        { id: 'slingshot_master', name: 'Slingshot Pro', description: 'Use slingshot technique successfully 10 times', icon: '🎯', category: 'technique' as const, criteria: '{"technique": "slingshot", "count": 10}', rarity: 'uncommon' as const },
        { id: 'black_hole', name: 'Black Hole Expert', description: 'Use black_hole technique successfully 10 times', icon: '⚫', category: 'technique' as const, criteria: '{"technique": "black_hole", "count": 10}', rarity: 'rare' as const },
        { id: 'constellation', name: 'Constellation Builder', description: 'Create 10 knowledge nodes', icon: '✨', category: 'special' as const, criteria: '{"nodes": 10}', rarity: 'rare' as const },
        { id: 'peer_reviewer', name: 'Helpful Reviewer', description: 'Complete 5 peer reviews', icon: '📝', category: 'social' as const, criteria: '{"reviews": 5}', rarity: 'uncommon' as const },
        { id: 'capstone_complete', name: 'Module Graduate', description: 'Complete a module capstone', icon: '🎓', category: 'completion' as const, criteria: '{"capstones": 1}', rarity: 'epic' as const },
    ];

    for (const badge of badges) {
        await db.insert(schema.badges).values(badge).onConflictDoNothing();
    }
    console.log(`  ✓ ${badges.length} badges\n`);

    console.log('✅ School seed complete!\n');
}

// Run seed
seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    });
