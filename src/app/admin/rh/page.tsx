'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconUserCog } from '@tabler/icons-react';

export default function RHPage() {
    return (
        <ComingSoonPage
            title="RH & Pessoas"
            description="Colaboradores, folha de pagamento, comissões e organograma."
            icon={<IconUserCog size={40} />}
            color="orange"
            features={['Colaboradores', 'Folha', 'Comissões', 'Ponto', 'Férias']}
        />
    );
}

