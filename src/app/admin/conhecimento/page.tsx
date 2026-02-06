'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconLibrary } from '@tabler/icons-react';

export default function ConhecimentoPage() {
    return (
        <ComingSoonPage
            title="Conhecimento"
            description="Wiki interna, procedimentos, políticas e FAQ."
            icon={<IconLibrary size={40} />}
            color="grape"
            features={['Wiki', 'Procedimentos', 'Políticas', 'FAQ', 'Templates']}
        />
    );
}

