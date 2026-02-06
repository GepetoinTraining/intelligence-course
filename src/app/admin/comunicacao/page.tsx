'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconMessageCircle } from '@tabler/icons-react';

export default function ComunicacaoPage() {
    return (
        <ComingSoonPage
            title="Comunicação"
            description="Mensagens internas, avisos, comunicador e WhatsApp."
            icon={<IconMessageCircle size={40} />}
            color="cyan"
            features={['Inbox', 'Avisos', 'Comunicador', 'WhatsApp', 'Templates']}
        />
    );
}

