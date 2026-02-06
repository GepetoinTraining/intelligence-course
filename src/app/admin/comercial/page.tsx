'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconBriefcase } from '@tabler/icons-react';

export default function ComercialPage() {
    return (
        <ComingSoonPage
            title="Comercial"
            description="Pipeline de vendas, oportunidades, propostas e metas."
            icon={<IconBriefcase size={40} />}
            color="blue"
            features={['Pipeline', 'Oportunidades', 'Propostas', 'Follow-ups', 'Metas']}
        />
    );
}

