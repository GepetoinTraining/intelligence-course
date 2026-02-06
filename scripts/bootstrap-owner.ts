/**
 * Bootstrap script: Creates the platform org (NodeZero) and the owner person/user.
 * Run after any database nuke: `npx tsx scripts/bootstrap-owner.ts`
 *
 * This script is ENVIRONMENT-AWARE:
 * - Reads BOOTSTRAP_* from .env (or defaults)
 * - Creates the 'platform' organization (NodeZero)
 * - Creates a person record for the owner
 * - Creates a user record linked to that person
 * - Creates organizationMembership with role='owner'
 * - Optionally creates a second org (school) if BOOTSTRAP_SCHOOL_SLUG is set
 */

import { db } from '../src/lib/db';
import { organizations, persons, users, organizationMemberships } from '../src/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// CONFIG FROM ENV
// ============================================================================

const OWNER_EMAIL = process.env.BOOTSTRAP_OWNER_EMAIL || 'pedro@nodezero.com.br';
const OWNER_NAME = process.env.BOOTSTRAP_OWNER_NAME || 'Pedro';
const OWNER_CLERK_ID = process.env.BOOTSTRAP_OWNER_CLERK_ID || 'dev-owner-clerk-id';
const PLATFORM_SLUG = process.env.BOOTSTRAP_PLATFORM_SLUG || 'nodezero';
const SCHOOL_SLUG = process.env.BOOTSTRAP_SCHOOL_SLUG || '';
const SCHOOL_NAME = process.env.BOOTSTRAP_SCHOOL_NAME || '';

// ============================================================================
// HELPERS
// ============================================================================

function unixNow(): number {
    return Math.floor(Date.now() / 1000);
}

function generateUUID(): string {
    return randomUUID();
}

// ============================================================================
// MAIN BOOTSTRAP
// ============================================================================

async function bootstrap() {
    console.log('🚀 Bootstrap Owner Script');
    console.log('='.repeat(50));
    console.log(`Owner Email: ${OWNER_EMAIL}`);
    console.log(`Owner Name: ${OWNER_NAME}`);
    console.log(`Platform Slug: ${PLATFORM_SLUG}`);
    console.log(`School Slug: ${SCHOOL_SLUG || '(none)'}`);
    console.log('='.repeat(50));

    const now = unixNow();

    // -------------------------------------------------------------------------
    // STEP 1: Create Platform Organization (if not exists)
    // -------------------------------------------------------------------------
    console.log('\n📦 Step 1: Platform Organization');

    let platformOrg = await db.select()
        .from(organizations)
        .where(eq(organizations.slug, PLATFORM_SLUG))
        .limit(1);

    let platformOrgId: string;

    if (platformOrg.length > 0) {
        platformOrgId = platformOrg[0].id;
        console.log(`   ✓ Platform already exists: ${platformOrgId}`);
    } else {
        platformOrgId = generateUUID();
        await db.insert(organizations).values({
            id: platformOrgId,
            type: 'platform',
            name: 'NodeZero',
            slug: PLATFORM_SLUG,
            status: 'active',
            createdAt: now,
            updatedAt: now,
        });
        console.log(`   ✓ Created platform: ${platformOrgId}`);
    }

    // -------------------------------------------------------------------------
    // STEP 2: Create Person for Owner
    // -------------------------------------------------------------------------
    console.log('\n👤 Step 2: Owner Person');

    let existingPerson = await db.select()
        .from(persons)
        .where(eq(persons.primaryEmail, OWNER_EMAIL.toLowerCase()))
        .limit(1);

    let personId: string;

    if (existingPerson.length > 0) {
        personId = existingPerson[0].id;
        console.log(`   ✓ Person already exists: ${personId}`);
    } else {
        personId = generateUUID();
        const nameParts = OWNER_NAME.split(' ');
        await db.insert(persons).values({
            id: personId,
            firstName: nameParts[0] || OWNER_NAME,
            lastName: nameParts.slice(1).join(' ') || null,
            primaryEmail: OWNER_EMAIL.toLowerCase(),
            status: 'active',
            createdAt: now,
            updatedAt: now,
        });
        console.log(`   ✓ Created person: ${personId}`);
    }

    // -------------------------------------------------------------------------
    // STEP 3: Create User (Clerk bridge)
    // -------------------------------------------------------------------------
    console.log('\n🔐 Step 3: User Record (Clerk Bridge)');

    let existingUser = await db.select()
        .from(users)
        .where(eq(users.id, OWNER_CLERK_ID))
        .limit(1);

    if (existingUser.length > 0) {
        console.log(`   ✓ User already exists: ${OWNER_CLERK_ID}`);
        // Update personId if needed
        if (existingUser[0].personId !== personId) {
            await db.update(users)
                .set({ personId, updatedAt: now })
                .where(eq(users.id, OWNER_CLERK_ID));
            console.log(`   ✓ Updated user.personId`);
        }
    } else {
        await db.insert(users).values({
            id: OWNER_CLERK_ID,
            personId,
            onboardingCompleted: true,
            createdAt: now,
            updatedAt: now,
        });
        console.log(`   ✓ Created user: ${OWNER_CLERK_ID}`);
    }

    // -------------------------------------------------------------------------
    // STEP 4: Create Organization Membership (Owner of Platform)
    // -------------------------------------------------------------------------
    console.log('\n🎖️ Step 4: Platform Owner Membership');

    let existingMembership = await db.select()
        .from(organizationMemberships)
        .where(and(
            eq(organizationMemberships.personId, personId),
            eq(organizationMemberships.organizationId, platformOrgId),
            eq(organizationMemberships.role, 'owner')
        ))
        .limit(1);

    if (existingMembership.length > 0) {
        console.log(`   ✓ Membership already exists`);
    } else {
        await db.insert(organizationMemberships).values({
            id: generateUUID(),
            personId,
            organizationId: platformOrgId,
            role: 'owner',
            status: 'active',
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
        });
        console.log(`   ✓ Created owner membership for platform`);
    }

    // -------------------------------------------------------------------------
    // STEP 5: Optional School Organization
    // -------------------------------------------------------------------------
    if (SCHOOL_SLUG && SCHOOL_NAME) {
        console.log('\n🏫 Step 5: School Organization');

        let schoolOrg = await db.select()
            .from(organizations)
            .where(eq(organizations.slug, SCHOOL_SLUG))
            .limit(1);

        let schoolOrgId: string;

        if (schoolOrg.length > 0) {
            schoolOrgId = schoolOrg[0].id;
            console.log(`   ✓ School already exists: ${schoolOrgId}`);
        } else {
            schoolOrgId = generateUUID();
            await db.insert(organizations).values({
                id: schoolOrgId,
                type: 'school',
                parentOrganizationId: platformOrgId,
                name: SCHOOL_NAME,
                slug: SCHOOL_SLUG,
                status: 'active',
                createdAt: now,
                updatedAt: now,
            });
            console.log(`   ✓ Created school: ${schoolOrgId}`);
        }

        // School owner membership
        let schoolMembership = await db.select()
            .from(organizationMemberships)
            .where(and(
                eq(organizationMemberships.personId, personId),
                eq(organizationMemberships.organizationId, schoolOrgId),
                eq(organizationMemberships.role, 'owner')
            ))
            .limit(1);

        if (schoolMembership.length > 0) {
            console.log(`   ✓ School membership already exists`);
        } else {
            await db.insert(organizationMemberships).values({
                id: generateUUID(),
                personId,
                organizationId: schoolOrgId,
                role: 'owner',
                status: 'active',
                joinedAt: now,
                createdAt: now,
                updatedAt: now,
            });
            console.log(`   ✓ Created owner membership for school`);
        }
    }

    // -------------------------------------------------------------------------
    // DONE
    // -------------------------------------------------------------------------
    console.log('\n' + '='.repeat(50));
    console.log('✅ Bootstrap complete!');
    console.log(`   Owner: ${OWNER_EMAIL}`);
    console.log(`   Person ID: ${personId}`);
    console.log(`   Platform: ${PLATFORM_SLUG} (${platformOrgId})`);
    if (SCHOOL_SLUG) {
        console.log(`   School: ${SCHOOL_SLUG}`);
    }
    console.log('='.repeat(50));
}

// Run
bootstrap()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Bootstrap failed:', err);
        process.exit(1);
    });
