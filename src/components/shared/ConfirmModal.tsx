'use client';

import { Modal, Stack, Group, Button, Text, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconTrash, IconCheck } from '@tabler/icons-react';

interface ConfirmModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmModal({
    opened,
    onClose,
    onConfirm,
    title = 'Confirmar ação',
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    type = 'danger',
    loading = false,
}: ConfirmModalProps) {
    const colors = {
        danger: 'red',
        warning: 'orange',
        info: 'blue',
    };

    const icons = {
        danger: IconTrash,
        warning: IconAlertTriangle,
        info: IconCheck,
    };

    const color = colors[type];
    const Icon = icons[type];

    return (
        <Modal opened={opened} onClose={onClose} title={title} centered size="sm">
            <Stack gap="lg">
                <Group gap="md" wrap="nowrap">
                    <ThemeIcon size={48} variant="light" color={color} radius="xl">
                        <Icon size={24} />
                    </ThemeIcon>
                    <Text size="sm">{message}</Text>
                </Group>
                <Group justify="flex-end" gap="sm">
                    <Button variant="subtle" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button color={color} onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default ConfirmModal;

