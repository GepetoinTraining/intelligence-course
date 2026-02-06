'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconClipboardCheck } from '@tabler/icons-react';

export default function OperacionalPage() {
    return (
        <ComingSoonPage
            title="Operacional"
            description="Check-in, matrículas, contratos e gestão de alunos."
            icon={<IconClipboardCheck size={40} />}
            color="teal"
            features={['Check-in', 'Matrículas', 'Alunos', 'Contratos', 'Renovações']}
        />
    );
}

