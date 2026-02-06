'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconSpeakerphone } from '@tabler/icons-react';

export default function MarketingPage() {
    return (
        <ComingSoonPage
            title="Marketing"
            description="Gerencie campanhas, leads, origens e analytics de marketing."
            icon={<IconSpeakerphone size={40} />}
            color="pink"
            features={['Campanhas', 'Leads', 'Landing Pages', 'Analytics', 'Indicações']}
        />
    );
}

