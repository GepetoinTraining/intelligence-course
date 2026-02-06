'use client';

import { Badge, BadgeProps } from '@mantine/core';

type StatusType =
    | 'active' | 'inactive' | 'pending' | 'completed' | 'draft' | 'published'
    | 'paid' | 'overdue' | 'cancelled' | 'approved' | 'rejected' | 'processing'
    | 'enrolled' | 'trial' | 'waitlist' | 'dropped' | 'graduated'
    | 'present' | 'absent' | 'late' | 'excused'
    | 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

interface StatusBadgeProps extends Omit<BadgeProps, 'color'> {
    status: StatusType | string;
    customLabel?: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    // General
    active: { color: 'green', label: 'Ativo' },
    inactive: { color: 'gray', label: 'Inativo' },
    pending: { color: 'yellow', label: 'Pendente' },
    completed: { color: 'green', label: 'Concluído' },
    draft: { color: 'gray', label: 'Rascunho' },
    published: { color: 'blue', label: 'Publicado' },

    // Financial
    paid: { color: 'green', label: 'Pago' },
    overdue: { color: 'red', label: 'Atrasado' },
    cancelled: { color: 'red', label: 'Cancelado' },
    approved: { color: 'green', label: 'Aprovado' },
    rejected: { color: 'red', label: 'Rejeitado' },
    processing: { color: 'blue', label: 'Processando' },

    // Enrollment
    enrolled: { color: 'green', label: 'Matriculado' },
    trial: { color: 'cyan', label: 'Trial' },
    waitlist: { color: 'orange', label: 'Lista de Espera' },
    dropped: { color: 'red', label: 'Desistente' },
    graduated: { color: 'violet', label: 'Formado' },

    // Attendance
    present: { color: 'green', label: 'Presente' },
    absent: { color: 'red', label: 'Ausente' },
    late: { color: 'orange', label: 'Atrasado' },
    excused: { color: 'blue', label: 'Justificado' },

    // Leads
    new: { color: 'blue', label: 'Novo' },
    contacted: { color: 'cyan', label: 'Contactado' },
    qualified: { color: 'violet', label: 'Qualificado' },
    converted: { color: 'green', label: 'Convertido' },
    lost: { color: 'red', label: 'Perdido' },
};

export function StatusBadge({ status, customLabel, variant = 'light', ...props }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || { color: 'gray', label: status };

    return (
        <Badge color={config.color} variant={variant} {...props}>
            {customLabel || config.label}
        </Badge>
    );
}

export default StatusBadge;

