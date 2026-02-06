'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RichTextEditor as MantineRTE, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import {
    Stack, Group, Button, Paper, Text, Modal, TextInput, Badge,
    ActionIcon, Tooltip, SegmentedControl, Divider, Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconMath, IconCode, IconEye, IconEdit, IconCopy, IconCheck,
    IconDownload, IconUpload
} from '@tabler/icons-react';
import katex from 'katex';

// Create lowlight instance for code highlighting
const lowlight = createLowlight();

// Import KaTeX CSS (should be in layout or global CSS)
// import 'katex/dist/katex.min.css';

// ==================== LATEX EXTENSION ====================
// Custom extension for inline and block LaTeX

interface LatexInputProps {
    opened: boolean;
    onClose: () => void;
    onInsert: (latex: string, isBlock: boolean) => void;
    initialValue?: string;
}

function LatexInputModal({ opened, onClose, onInsert, initialValue = '' }: LatexInputProps) {
    const [latex, setLatex] = useState(initialValue);
    const [isBlock, setIsBlock] = useState<string>('inline');
    const [preview, setPreview] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (opened) {
            setLatex(initialValue);
        }
    }, [opened, initialValue]);

    useEffect(() => {
        try {
            const html = katex.renderToString(latex || 'x^2 + y^2 = z^2', {
                throwOnError: false,
                displayMode: isBlock === 'block',
            });
            setPreview(html);
            setError('');
        } catch (e: any) {
            setError(e.message);
            setPreview('');
        }
    }, [latex, isBlock]);

    const handleInsert = () => {
        if (latex.trim()) {
            onInsert(latex, isBlock === 'block');
            setLatex('');
            onClose();
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconMath size={20} />
                    <Text fw={600}>Inserir Fórmula LaTeX</Text>
                </Group>
            }
            size="lg"
        >
            <Stack gap="md">
                <SegmentedControl
                    value={isBlock}
                    onChange={setIsBlock}
                    data={[
                        { label: 'Inline (na linha)', value: 'inline' },
                        { label: 'Bloco (centralizado)', value: 'block' },
                    ]}
                    fullWidth
                />

                <TextInput
                    label="Fórmula LaTeX"
                    placeholder="Ex: x^2 + y^2 = z^2"
                    value={latex}
                    onChange={(e) => setLatex(e.target.value)}
                    rightSection={
                        latex && (
                            <ActionIcon variant="subtle" onClick={() => setLatex('')}>
                                <IconCode size={16} />
                            </ActionIcon>
                        )
                    }
                    styles={{ input: { fontFamily: 'monospace' } }}
                />

                {/* Common formulas */}
                <div>
                    <Text size="xs" c="dimmed" mb="xs">Fórmulas comuns:</Text>
                    <Group gap="xs">
                        {[
                            { label: 'Fração', value: '\\frac{a}{b}' },
                            { label: 'Raiz', value: '\\sqrt{x}' },
                            { label: 'Soma', value: '\\sum_{i=1}^{n} x_i' },
                            { label: 'Integral', value: '\\int_{a}^{b} f(x) dx' },
                            { label: 'Matriz', value: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
                            { label: 'Limite', value: '\\lim_{x \\to \\infty} f(x)' },
                        ].map((formula) => (
                            <Badge
                                key={formula.label}
                                variant="light"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setLatex(formula.value)}
                            >
                                {formula.label}
                            </Badge>
                        ))}
                    </Group>
                </div>

                {/* Preview */}
                <Paper p="md" withBorder radius="md" bg="gray.0">
                    <Text size="xs" c="dimmed" mb="xs">Visualização:</Text>
                    {error ? (
                        <Text c="red" size="sm">{error}</Text>
                    ) : (
                        <Box
                            ta={isBlock === 'block' ? 'center' : 'left'}
                            dangerouslySetInnerHTML={{ __html: preview }}
                            style={{ fontSize: isBlock === 'block' ? '1.2em' : '1em' }}
                        />
                    )}
                </Paper>

                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleInsert} disabled={!latex.trim() || !!error}>
                        Inserir
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

// ==================== MAIN COMPONENT ====================
interface RichTextEditorProps {
    value?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    editable?: boolean;
    minHeight?: number;
    showLatexButton?: boolean;
    showCodeBlock?: boolean;
    showPreview?: boolean;
}

export function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Escreva aqui...',
    editable = true,
    minHeight = 200,
    showLatexButton = true,
    showCodeBlock = true,
    showPreview = true,
}: RichTextEditorProps) {
    const [latexModal, { open: openLatex, close: closeLatex }] = useDisclosure(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [copied, setCopied] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We use code-block-lowlight instead
            }),
            Underline,
            LinkExtension.configure({
                openOnClick: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder,
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: value,
        editable,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    // Update content when value prop changes
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    // Insert LaTeX
    const insertLatex = useCallback((latex: string, isBlock: boolean) => {
        if (!editor) return;

        try {
            const html = katex.renderToString(latex, {
                throwOnError: false,
                displayMode: isBlock,
            });

            const wrapper = isBlock
                ? `<div class="latex-block" data-latex="${encodeURIComponent(latex)}" style="text-align: center; margin: 1rem 0;">${html}</div>`
                : `<span class="latex-inline" data-latex="${encodeURIComponent(latex)}">${html}</span>`;

            editor.chain().focus().insertContent(wrapper).run();
        } catch (e) {
            console.error('LaTeX rendering error:', e);
        }
    }, [editor]);

    // Copy content
    const handleCopy = useCallback(() => {
        if (editor) {
            navigator.clipboard.writeText(editor.getHTML());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [editor]);

    // Export as HTML
    const handleExport = useCallback(() => {
        if (!editor) return;

        const html = editor.getHTML();
        const blob = new Blob([`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        .latex-block { text-align: center; margin: 1rem 0; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; }
    </style>
</head>
<body>
${html}
</body>
</html>
        `], { type: 'text/html' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documento.html';
        a.click();
        URL.revokeObjectURL(url);
    }, [editor]);

    if (!editor) return null;

    return (
        <Stack gap="xs">
            <MantineRTE editor={editor} style={{ minHeight }}>
                <MantineRTE.Toolbar sticky stickyOffset={60}>
                    <MantineRTE.ControlsGroup>
                        <MantineRTE.Bold />
                        <MantineRTE.Italic />
                        <MantineRTE.Underline />
                        <MantineRTE.Strikethrough />
                        <MantineRTE.ClearFormatting />
                    </MantineRTE.ControlsGroup>

                    <MantineRTE.ControlsGroup>
                        <MantineRTE.H1 />
                        <MantineRTE.H2 />
                        <MantineRTE.H3 />
                        <MantineRTE.H4 />
                    </MantineRTE.ControlsGroup>

                    <MantineRTE.ControlsGroup>
                        <MantineRTE.Blockquote />
                        <MantineRTE.Hr />
                        <MantineRTE.BulletList />
                        <MantineRTE.OrderedList />
                    </MantineRTE.ControlsGroup>

                    <MantineRTE.ControlsGroup>
                        <MantineRTE.Link />
                        <MantineRTE.Unlink />
                    </MantineRTE.ControlsGroup>

                    <MantineRTE.ControlsGroup>
                        <MantineRTE.AlignLeft />
                        <MantineRTE.AlignCenter />
                        <MantineRTE.AlignRight />
                        <MantineRTE.AlignJustify />
                    </MantineRTE.ControlsGroup>

                    {showCodeBlock && (
                        <MantineRTE.ControlsGroup>
                            <MantineRTE.Code />
                            <MantineRTE.CodeBlock />
                        </MantineRTE.ControlsGroup>
                    )}

                    {showLatexButton && (
                        <MantineRTE.ControlsGroup>
                            <Tooltip label="Inserir fórmula LaTeX">
                                <ActionIcon variant="default" onClick={openLatex}>
                                    <IconMath size={16} />
                                </ActionIcon>
                            </Tooltip>
                        </MantineRTE.ControlsGroup>
                    )}

                    <MantineRTE.ControlsGroup>
                        <MantineRTE.Undo />
                        <MantineRTE.Redo />
                    </MantineRTE.ControlsGroup>
                </MantineRTE.Toolbar>

                <MantineRTE.Content />
            </MantineRTE>

            {/* Footer actions */}
            <Group justify="space-between">
                <Group gap="xs">
                    {showPreview && (
                        <SegmentedControl
                            size="xs"
                            value={viewMode}
                            onChange={(v) => setViewMode(v as 'edit' | 'preview')}
                            data={[
                                { label: <Group gap={4}><IconEdit size={14} /> Editar</Group>, value: 'edit' },
                                { label: <Group gap={4}><IconEye size={14} /> Preview</Group>, value: 'preview' },
                            ]}
                        />
                    )}
                </Group>
                <Group gap="xs">
                    <Tooltip label={copied ? 'Copiado!' : 'Copiar HTML'}>
                        <ActionIcon variant="subtle" onClick={handleCopy} color={copied ? 'green' : 'gray'}>
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Exportar HTML">
                        <ActionIcon variant="subtle" onClick={handleExport}>
                            <IconDownload size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            {/* Preview mode */}
            {viewMode === 'preview' && (
                <Paper p="md" withBorder radius="md">
                    <div
                        dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                        style={{
                            minHeight: minHeight - 50,
                            fontFamily: 'system-ui, sans-serif',
                        }}
                    />
                </Paper>
            )}

            {/* LaTeX Modal */}
            <LatexInputModal
                opened={latexModal}
                onClose={closeLatex}
                onInsert={insertLatex}
            />
        </Stack>
    );
}

// ==================== LATEX DISPLAY COMPONENT ====================
// For rendering LaTeX strings inline or in blocks

interface LatexProps {
    children: string;
    block?: boolean;
}

export function Latex({ children, block = false }: LatexProps) {
    const [html, setHtml] = useState('');

    useEffect(() => {
        try {
            const rendered = katex.renderToString(children, {
                throwOnError: false,
                displayMode: block,
            });
            setHtml(rendered);
        } catch (e) {
            console.error('LaTeX error:', e);
            setHtml(`<span style="color: red;">LaTeX Error</span>`);
        }
    }, [children, block]);

    if (block) {
        return (
            <Box
                ta="center"
                my="md"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ fontSize: '1.2em' }}
            />
        );
    }

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// ==================== FORMULA EXAMPLES ====================
export const LATEX_EXAMPLES = {
    basic: [
        { label: 'Superscript', latex: 'x^2' },
        { label: 'Subscript', latex: 'x_i' },
        { label: 'Fraction', latex: '\\frac{a}{b}' },
        { label: 'Square root', latex: '\\sqrt{x}' },
        { label: 'Nth root', latex: '\\sqrt[n]{x}' },
    ],
    calculus: [
        { label: 'Integral', latex: '\\int_{a}^{b} f(x) dx' },
        { label: 'Derivative', latex: '\\frac{d}{dx} f(x)' },
        { label: 'Partial', latex: '\\frac{\\partial f}{\\partial x}' },
        { label: 'Limit', latex: '\\lim_{x \\to \\infty} f(x)' },
        { label: 'Sum', latex: '\\sum_{i=1}^{n} x_i' },
        { label: 'Product', latex: '\\prod_{i=1}^{n} x_i' },
    ],
    algebra: [
        { label: 'Matrix 2x2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
        { label: 'Determinant', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
        { label: 'System', latex: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}' },
    ],
    greek: [
        { label: 'Alpha', latex: '\\alpha' },
        { label: 'Beta', latex: '\\beta' },
        { label: 'Gamma', latex: '\\gamma' },
        { label: 'Delta', latex: '\\Delta' },
        { label: 'Theta', latex: '\\theta' },
        { label: 'Pi', latex: '\\pi' },
        { label: 'Sigma', latex: '\\sigma' },
        { label: 'Omega', latex: '\\Omega' },
    ],
    operators: [
        { label: 'Not equal', latex: '\\neq' },
        { label: 'Less/equal', latex: '\\leq' },
        { label: 'Greater/equal', latex: '\\geq' },
        { label: 'Approximately', latex: '\\approx' },
        { label: 'Infinity', latex: '\\infty' },
        { label: 'Plus/minus', latex: '\\pm' },
    ],
};

