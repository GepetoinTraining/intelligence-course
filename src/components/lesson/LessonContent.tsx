'use client';

import { Text, Title, List, Code, Table, Anchor, Paper } from '@mantine/core';

interface LessonContentProps {
    content: string;
    format: string;
}

// Simple markdown parser for lesson content
function parseMarkdown(content: string): React.ReactNode[] {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let inTable = false;
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code blocks
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                elements.push(
                    <Code key={`code-${i}`} block mb="md" style={{ whiteSpace: 'pre-wrap' }}>
                        {codeContent.trim()}
                    </Code>
                );
                codeContent = '';
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeContent += line + '\n';
            continue;
        }

        // Tables
        if (line.startsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableRows = [];
            }
            // Skip separator rows
            if (line.includes('---')) continue;

            const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
            tableRows.push(cells);
            continue;
        } else if (inTable) {
            // End of table
            if (tableRows.length > 0) {
                const headers = tableRows[0];
                const rows = tableRows.slice(1);
                elements.push(
                    <Table key={`table-${i}`} mb="md" withTableBorder>
                        <Table.Thead>
                            <Table.Tr>
                                {headers.map((h, j) => <Table.Th key={j}>{h}</Table.Th>)}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {rows.map((row, j) => (
                                <Table.Tr key={j}>
                                    {row.map((cell, k) => <Table.Td key={k}>{cell}</Table.Td>)}
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                );
            }
            inTable = false;
            tableRows = [];
        }

        // Empty lines
        if (!line.trim()) {
            continue;
        }

        // Headers
        if (line.startsWith('# ')) {
            elements.push(<Title key={i} order={1} mb="md">{line.slice(2)}</Title>);
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<Title key={i} order={2} mb="md" mt="xl">{line.slice(3)}</Title>);
            continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<Title key={i} order={3} mb="sm" mt="lg">{line.slice(4)}</Title>);
            continue;
        }

        // Lists
        if (line.startsWith('- ')) {
            // Collect all list items
            const items: string[] = [line.slice(2)];
            while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
                i++;
                items.push(lines[i].slice(2));
            }
            elements.push(
                <List key={i} mb="md">
                    {items.map((item, j) => (
                        <List.Item key={j}>{formatInlineText(item)}</List.Item>
                    ))}
                </List>
            );
            continue;
        }

        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
            const items: string[] = [line.replace(/^\d+\.\s/, '')];
            while (i + 1 < lines.length && /^\d+\.\s/.test(lines[i + 1])) {
                i++;
                items.push(lines[i].replace(/^\d+\.\s/, ''));
            }
            elements.push(
                <List key={i} type="ordered" mb="md">
                    {items.map((item, j) => (
                        <List.Item key={j}>{formatInlineText(item)}</List.Item>
                    ))}
                </List>
            );
            continue;
        }

        // Regular paragraph
        elements.push(
            <Text key={i} mb="md">
                {formatInlineText(line)}
            </Text>
        );
    }

    return elements;
}

// Format inline markdown (bold, italic, code, links)
function formatInlineText(text: string): React.ReactNode {
    // Simple implementation - handle **bold** and `code`
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
            if (boldMatch.index > 0) {
                parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
            }
            parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
            remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
            continue;
        }

        // Inline code
        const codeMatch = remaining.match(/`(.+?)`/);
        if (codeMatch && codeMatch.index !== undefined) {
            if (codeMatch.index > 0) {
                parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
            }
            parts.push(<Code key={key++}>{codeMatch[1]}</Code>);
            remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
            continue;
        }

        // No more matches
        parts.push(<span key={key++}>{remaining}</span>);
        break;
    }

    return <>{parts}</>;
}

export function LessonContent({ content, format }: LessonContentProps) {
    if (format === 'markdown') {
        return <div>{parseMarkdown(content)}</div>;
    }

    // For other formats, just show as preformatted text
    return (
        <Code block style={{ whiteSpace: 'pre-wrap' }}>
            {content}
        </Code>
    );
}

