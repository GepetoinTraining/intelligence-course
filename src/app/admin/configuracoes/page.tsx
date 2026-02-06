'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconSettings } from '@tabler/icons-react';

export default function ConfiguracoesPage() {
    return (
        <ComingSoonPage
            title="Configurações"
            description="Configurações da escola, usuários e permissões."
            icon={<IconSettings size={40} />}
            color="gray"
            features={['Escola', 'Branding', 'Usuários', 'Permissões', 'Integrações']}
        />
    );
}

