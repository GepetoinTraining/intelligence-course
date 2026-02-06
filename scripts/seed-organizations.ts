/**
 * Seed initial organizations
 * - NodeZero (platform)
 * - Eco Escola Coworking Educacional (first school tenant)
 */

import { db } from '../src/lib/db';
import {
    organizations,
    organizationMemberships,
    organizationBranding,
    persons
} from '../src/lib/db/schema';

async function seedOrganizations() {
    console.log('🌱 Seeding organizations...\n');

    // =========================================================================
    // 1. NodeZero Platform
    // =========================================================================

    const nodeZeroId = 'nodezero-platform-001';

    await db.insert(organizations).values({
        id: nodeZeroId,
        type: 'platform',
        name: 'NodeZero',
        slug: 'nodezero',
        displayName: 'NodeZero',

        // Branding
        primaryColor: '#7048e8',  // Violet

        // Contact
        email: 'contato@nodezero.solutions',
        website: 'https://nodezero.solutions',

        // Platform config
        plan: 'enterprise',
        status: 'active',

        // All modules enabled for platform
        enabledModules: JSON.stringify([
            'management', 'pedagogical', 'marketing', 'sales',
            'hr', 'accounting', 'operations', 'payments',
            'toolbox', 'relationships', 'ai-companion',
            'analytics', 'communications'
        ]),

        // No limits for platform
        maxStudents: 999999,
        maxStaff: 999999,
        maxStorageMb: 999999,
    }).onConflictDoNothing();

    console.log('✅ NodeZero platform created');

    // NodeZero branding
    await db.insert(organizationBranding).values({
        organizationId: nodeZeroId,

        // Colors
        primaryColorLight: '#9775fa',
        primaryColorDark: '#5f3dc4',
        secondaryColor: '#1c7ed6',
        accentColor: '#fd7e14',

        // Typography
        fontHeading: 'Inter',
        fontBody: 'Inter',

        // Social
        socialLinkedin: 'https://linkedin.com/company/nodezero',
        socialInstagram: 'https://instagram.com/nodezero.solutions',

        // Footer
        footerText: 'Built with 💜 by Pedro Garcia, Claude, Grok & Gemini',
        showPoweredBy: 0,  // It IS NodeZero, no need for "Powered by"
    }).onConflictDoNothing();

    console.log('✅ NodeZero branding created');

    // =========================================================================
    // 2. Eco Escola Coworking Educacional
    // =========================================================================

    const ecoEscolaId = 'eco-escola-001';

    await db.insert(organizations).values({
        id: ecoEscolaId,
        type: 'school',
        parentOrganizationId: nodeZeroId,

        name: 'Eco Escola',
        slug: 'eco-escola',
        displayName: 'Eco Escola Coworking Educacional',

        // Branding
        primaryColor: '#40c057',  // Green (eco)

        // Contact
        email: 'contato@ecoescola.com.br',
        phone: '+55 47 99999-9999',
        whatsapp: '+55 47 99999-9999',

        // Address
        city: 'Joinville',
        state: 'SC',
        country: 'BR',

        // Brazilian legal (placeholder)
        // cnpj: '00.000.000/0001-00',
        // razaoSocial: 'Eco Escola Coworking Educacional Ltda',
        // nomeFantasia: 'Eco Escola',
        regimeTributario: 'simples',

        // SaaS Plan - All modules for testing
        plan: 'enterprise',
        status: 'active',

        enabledModules: JSON.stringify([
            'management', 'pedagogical', 'marketing', 'sales',
            'hr', 'accounting', 'operations', 'payments',
            'toolbox', 'relationships', 'ai-companion',
            'analytics', 'communications'
        ]),

        // Test limits
        maxStudents: 1000,
        maxStaff: 100,
        maxStorageMb: 10240,  // 10GB

        onboardingProgress: JSON.stringify({
            companyInfo: false,
            branding: false,
            address: false,
            fiscal: false,
            firstCourse: false,
            firstStaff: false,
        }),
    }).onConflictDoNothing();

    console.log('✅ Eco Escola created');

    // Eco Escola branding
    await db.insert(organizationBranding).values({
        organizationId: ecoEscolaId,

        // Colors (eco/nature theme)
        primaryColorLight: '#69db7c',
        primaryColorDark: '#2f9e44',
        secondaryColor: '#1c7ed6',
        accentColor: '#fab005',

        backgroundColor: '#ffffff',
        backgroundColorDark: '#1a1b1e',

        // Typography
        fontHeading: 'Outfit',
        fontBody: 'Inter',

        // Social (placeholder)
        socialInstagram: 'https://instagram.com/ecoescola',
        socialWhatsapp: '+55 47 99999-9999',

        // Footer
        footerText: '© 2026 Eco Escola Coworking Educacional. Todos os direitos reservados.',
        showPoweredBy: 1,  // "Powered by NodeZero"
    }).onConflictDoNothing();

    console.log('✅ Eco Escola branding created');

    // =========================================================================
    // Summary
    // =========================================================================

    console.log('\n📊 Organizations seeded:');
    console.log('  • NodeZero (platform) - nodezero.solutions/');
    console.log('  • Eco Escola (school) - nodezero.solutions/eco-escola/');
    console.log('\n✨ Done!');
}

// Run
seedOrganizations()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Error seeding organizations:', err);
        process.exit(1);
    });
