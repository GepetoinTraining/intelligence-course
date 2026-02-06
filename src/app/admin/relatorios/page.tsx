'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconChartPie } from '@tabler/icons-react';

export default function RelatoriosPage() {
    return (
        <ComingSoonPage
            title="Relatórios & BI"
            description="Dashboards, KPIs e relatórios personalizados."
            icon={<IconChartPie size={40} />}
            color="indigo"
            features={['Dashboards', 'KPIs', 'Exportações', 'Agendados']}
        />
    );
}

