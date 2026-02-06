import { notFound } from 'next/navigation';
import { getOrgBySlug } from '@/lib/org';
import { OrgProvider } from '@/components/OrgContext';
import { Metadata } from 'next';

interface OrgLayoutProps {
    children: React.ReactNode;
    params: Promise<{ orgSlug: string }>;
}

/**
 * Generate metadata for org pages
 */
export async function generateMetadata({
    params
}: {
    params: Promise<{ orgSlug: string }>
}): Promise<Metadata> {
    const { orgSlug } = await params;
    const org = await getOrgBySlug(orgSlug);

    if (!org) return { title: 'Not Found' };

    return {
        title: org.displayName || org.name,
        description: `${org.displayName || org.name} - Powered by NodeZero`,
        openGraph: {
            title: org.displayName || org.name,
            images: org.branding?.ogImageUrl ? [org.branding.ogImageUrl] : [],
        },
    };
}

/**
 * Layout for organization-scoped routes
 * Fetches org from DB and provides via context
 */
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const { orgSlug } = await params;
    const org = await getOrgBySlug(orgSlug);

    if (!org) {
        notFound();
    }

    // Build CSS custom properties from branding
    const cssVars: Record<string, string> = {};

    if (org.primaryColor) {
        cssVars['--org-primary'] = org.primaryColor;
    }
    if (org.branding?.primaryColorLight) {
        cssVars['--org-primary-light'] = org.branding.primaryColorLight;
    }
    if (org.branding?.primaryColorDark) {
        cssVars['--org-primary-dark'] = org.branding.primaryColorDark;
    }
    if (org.branding?.secondaryColor) {
        cssVars['--org-secondary'] = org.branding.secondaryColor;
    }
    if (org.branding?.accentColor) {
        cssVars['--org-accent'] = org.branding.accentColor;
    }
    if (org.branding?.backgroundColor) {
        cssVars['--org-bg'] = org.branding.backgroundColor;
    }
    if (org.branding?.backgroundColorDark) {
        cssVars['--org-bg-dark'] = org.branding.backgroundColorDark;
    }

    return (
        <OrgProvider org={org}>
            <div style={cssVars as React.CSSProperties}>
                {children}
            </div>
        </OrgProvider>
    );
}
