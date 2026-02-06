'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconCalendar } from '@tabler/icons-react';

export default function AgendaPage() {
    return (
        <ComingSoonPage
            title="Agenda"
            description="Calendários hierárquicos, salas e recursos."
            icon={<IconCalendar size={40} />}
            color="yellow"
            features={['Pessoal', 'Time', 'Líderes', 'Salas', 'Calendário Letivo']}
        />
    );
}

