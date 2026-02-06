'use client';

import { useState } from 'react';
import { Group, Paper, Text, Button, Popover, Stack, SimpleGrid } from '@mantine/core';
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface DateRangePickerProps {
    value?: { start: Date | null; end: Date | null };
    onChange?: (range: { start: Date | null; end: Date | null }) => void;
    presets?: { label: string; start: Date; end: Date }[];
}

const DEFAULT_PRESETS = [
    { label: 'Hoje', start: new Date(), end: new Date() },
    { label: 'Últimos 7 dias', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() },
    { label: 'Últimos 30 dias', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
    { label: 'Este mês', start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), end: new Date() },
    { label: 'Mês passado', start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), end: new Date(new Date().getFullYear(), new Date().getMonth(), 0) },
];

export function DateRangePicker({
    value = { start: null, end: null },
    onChange,
    presets = DEFAULT_PRESETS,
}: DateRangePickerProps) {
    const [opened, setOpened] = useState(false);
    const [tempRange, setTempRange] = useState(value);

    const formatDate = (date: Date | null) => {
        if (!date) return '--';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const handlePreset = (preset: { start: Date; end: Date }) => {
        const newRange = { start: preset.start, end: preset.end };
        setTempRange(newRange);
        onChange?.(newRange);
        setOpened(false);
    };

    const handleClear = () => {
        const newRange = { start: null, end: null };
        setTempRange(newRange);
        onChange?.(newRange);
        setOpened(false);
    };

    return (
        <Popover opened={opened} onChange={setOpened} position="bottom-start" withArrow>
            <Popover.Target>
                <Paper
                    component="button"
                    type="button"
                    p="xs"
                    radius="md"
                    withBorder
                    onClick={() => setOpened(!opened)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <IconCalendar size={16} />
                    <Text size="sm">
                        {value.start && value.end
                            ? `${formatDate(value.start)} - ${formatDate(value.end)}`
                            : 'Selecionar período'
                        }
                    </Text>
                </Paper>
            </Popover.Target>
            <Popover.Dropdown>
                <Stack gap="sm">
                    <Text size="xs" fw={600} c="dimmed">Períodos pré-definidos</Text>
                    <SimpleGrid cols={2} spacing="xs">
                        {presets.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="light"
                                size="xs"
                                onClick={() => handlePreset(preset)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </SimpleGrid>
                    <Button variant="subtle" size="xs" color="gray" onClick={handleClear}>
                        Limpar
                    </Button>
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
}

export default DateRangePicker;

