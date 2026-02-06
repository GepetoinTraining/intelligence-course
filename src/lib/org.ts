import { db } from '@/lib/db';
import { organizations, organizationBranding } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cache } from 'react';

export type OrgWithBranding = {
    id: string;
    type: 'platform' | 'school';
    name: string;
    slug: string;
    displayName: string | null;
    primaryColor: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    city: string | null;
    state: string | null;
    plan: string | null;
    enabledModules: string[];
    branding: {
        logoLightUrl: string | null;
        logoDarkUrl: string | null;
        logoIconUrl: string | null;
        ogImageUrl: string | null;
        primaryColorLight: string | null;
        primaryColorDark: string | null;
        secondaryColor: string | null;
        accentColor: string | null;
        backgroundColor: string | null;
        backgroundColorDark: string | null;
        textColor: string | null;
        fontHeading: string | null;
        fontBody: string | null;
        heroImageUrl: string | null;
        socialInstagram: string | null;
        socialWhatsapp: string | null;
        socialLinkedin: string | null;
        footerText: string | null;
        showPoweredBy: boolean;
    } | null;
};

/**
 * Get organization by slug with branding
 * Cached per request
 */
export const getOrgBySlug = cache(async (slug: string): Promise<OrgWithBranding | null> => {
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.slug, slug),
    });

    if (!org) return null;

    const branding = await db.query.organizationBranding.findFirst({
        where: eq(organizationBranding.organizationId, org.id),
    });

    return {
        id: org.id,
        type: org.type as 'platform' | 'school',
        name: org.name,
        slug: org.slug,
        displayName: org.displayName,
        primaryColor: org.primaryColor,
        email: org.email,
        phone: org.phone,
        whatsapp: org.whatsapp,
        website: org.website,
        city: org.city,
        state: org.state,
        plan: org.plan,
        enabledModules: org.enabledModules ? JSON.parse(org.enabledModules) : [],
        branding: branding ? {
            logoLightUrl: branding.logoLightUrl,
            logoDarkUrl: branding.logoDarkUrl,
            logoIconUrl: branding.logoIconUrl,
            ogImageUrl: branding.ogImageUrl,
            primaryColorLight: branding.primaryColorLight,
            primaryColorDark: branding.primaryColorDark,
            secondaryColor: branding.secondaryColor,
            accentColor: branding.accentColor,
            backgroundColor: branding.backgroundColor,
            backgroundColorDark: branding.backgroundColorDark,
            textColor: branding.textColor,
            fontHeading: branding.fontHeading,
            fontBody: branding.fontBody,
            heroImageUrl: branding.heroImageUrl,
            socialInstagram: branding.socialInstagram,
            socialWhatsapp: branding.socialWhatsapp,
            socialLinkedin: branding.socialLinkedin,
            footerText: branding.footerText,
            showPoweredBy: branding.showPoweredBy === 1,
        } : null,
    };
});

/**
 * Check if org has a specific module enabled
 */
export function hasModule(org: OrgWithBranding, moduleId: string): boolean {
    return org.enabledModules.includes(moduleId);
}

