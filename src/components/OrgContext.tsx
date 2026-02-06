'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { OrgWithBranding } from '@/lib/org';

const OrgContext = createContext<OrgWithBranding | null>(null);

export function OrgProvider({
    org,
    children
}: {
    org: OrgWithBranding;
    children: ReactNode
}) {
    return (
        <OrgContext.Provider value={org}>
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    const org = useContext(OrgContext);
    if (!org) {
        throw new Error('useOrg must be used within OrgProvider');
    }
    return org;
}

export function useOrgOptional() {
    return useContext(OrgContext);
}

