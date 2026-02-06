'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconCash } from '@tabler/icons-react';

export default function FinanceiroPage() {
    return (
        <ComingSoonPage
            title="Financeiro"
            description="Recebíveis, pagamentos, faturamento e fluxo de caixa."
            icon={<IconCash size={40} />}
            color="green"
            features={['Recebíveis', 'Pagamentos', 'Inadimplência', 'Conciliação', 'Fluxo de Caixa']}
        />
    );
}

