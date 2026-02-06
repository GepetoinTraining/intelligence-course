'use client';

import { ComingSoonPage } from '@/components/admin/ComingSoonPage';
import { IconBook } from '@tabler/icons-react';

export default function PedagogicoPage() {
    return (
        <ComingSoonPage
            title="Pedagógico"
            description="Cursos, turmas, grade curricular, notas e avaliações."
            icon={<IconBook size={40} />}
            color="purple"
            features={['Cursos', 'Turmas', 'Aulas', 'Notas', 'Certificados']}
        />
    );
}

