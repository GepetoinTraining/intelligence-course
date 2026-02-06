'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconRobot } from '@tabler/icons-react';

export default function AIPage() {
    return (
        <ComingSoonPage
            title="Assistente IA"
            description="Chat inteligente, geradores e análises com IA."
            icon={<IconRobot size={40} />}
            color="violet"
            features={['Chat', 'Geradores', 'Análises', 'Insights']}
        />
    );
}

