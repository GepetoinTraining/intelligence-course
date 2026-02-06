'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconRefreshDot } from '@tabler/icons-react';

export default function KaizenPage() {
    return (
        <ComingSoonPage
            title="Kaizen"
            description="Melhoria contínua, sugestões, feedback e NPS."
            icon={<IconRefreshDot size={40} />}
            color="amber"
            features={['Sugestões', 'Feedback', 'Retrospectivas', 'NPS', 'Pesquisas']}
        />
    );
}

