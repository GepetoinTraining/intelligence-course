'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconCalculator } from '@tabler/icons-react';

export default function ContabilPage() {
    return (
        <ComingSoonPage
            title="Contábil"
            description="Plano de contas, lançamentos, NFS-e e SPED."
            icon={<IconCalculator size={40} />}
            color="lime"
            features={['Plano de Contas', 'SPED', 'NFS-e', 'DRE', 'Balanço']}
        />
    );
}

