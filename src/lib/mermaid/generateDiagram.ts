/**
 * Mermaid Syntax Generator — Deterministic Templates
 *
 * Transforms API data into valid Mermaid syntax strings.
 * Each diagram type has a template function that takes structured data
 * and returns Mermaid-compatible text. Zero AI cost.
 */

import type { DiagramType } from './canVisualize';

// ============================================================================
// STATUS FLOW → stateDiagram
// ============================================================================

interface StatusItem {
    status?: string;
    state?: string;
    [key: string]: unknown;
}

function generateStateDiagram(data: StatusItem[], title: string): string {
    // Count items per status
    const statusCounts = new Map<string, number>();
    const items = Array.isArray(data) ? data : [];

    items.forEach(item => {
        const status = item.status || item.state || 'unknown';
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    // Build state transitions (ordered status sequence)
    const statuses = Array.from(statusCounts.keys());
    let diagram = `stateDiagram-v2\n`;
    diagram += `    direction LR\n`;

    // State definitions with counts
    statuses.forEach(s => {
        const count = statusCounts.get(s) || 0;
        const label = s.replace(/_/g, ' ');
        diagram += `    ${sanitize(s)} : ${label} (${count})\n`;
    });

    // Transitions (sequential flow)
    diagram += `\n    [*] --> ${sanitize(statuses[0] || 'start')}\n`;
    for (let i = 0; i < statuses.length - 1; i++) {
        diagram += `    ${sanitize(statuses[i])} --> ${sanitize(statuses[i + 1])}\n`;
    }
    if (statuses.length > 0) {
        diagram += `    ${sanitize(statuses[statuses.length - 1])} --> [*]\n`;
    }

    return diagram;
}

// ============================================================================
// HIERARCHY → flowchart
// ============================================================================

interface HierarchyItem {
    id?: string;
    name?: string;
    title?: string;
    parentId?: string;
    parent_id?: string;
    status?: string;
    [key: string]: unknown;
}

function generateFlowchart(data: HierarchyItem[], title: string): string {
    const items = Array.isArray(data) ? data.slice(0, 25) : [];
    let diagram = `flowchart TD\n`;

    items.forEach(item => {
        const id = sanitize(item.id || String(Math.random()));
        const label = item.name || item.title || id;
        const parentId = item.parentId || item.parent_id;
        const statusClass = item.status === 'active' ? ':::active' :
            item.status === 'completed' ? ':::completed' : '';

        diagram += `    ${id}["${escapeLabel(label)}"]${statusClass}\n`;

        if (parentId) {
            diagram += `    ${sanitize(parentId)} --> ${id}\n`;
        }
    });

    // Add styling
    diagram += `\n    classDef active fill:#4CAF50,color:#fff\n`;
    diagram += `    classDef completed fill:#2196F3,color:#fff\n`;

    return diagram;
}

// ============================================================================
// TEMPORAL SEQUENCE → sequenceDiagram
// ============================================================================

interface SequenceItem {
    id?: string;
    title?: string;
    name?: string;
    type?: string;
    createdAt?: number;
    timestamp?: number;
    organizerName?: string;
    [key: string]: unknown;
}

function generateSequenceDiagram(data: SequenceItem[], title: string): string {
    const items = Array.isArray(data) ? data.slice(0, 15) : [];
    let diagram = `sequenceDiagram\n`;
    diagram += `    autonumber\n`;

    // Extract actors from data
    const actors = new Set<string>();
    actors.add('Sistema');
    items.forEach(item => {
        const actor = item.organizerName || item.type || 'Usuário';
        actors.add(actor);
    });

    // Add participants
    actors.forEach(a => {
        diagram += `    participant ${sanitize(a)} as ${escapeLabel(a)}\n`;
    });

    // Add messages
    items.forEach(item => {
        const from = item.organizerName || item.type || 'Usuário';
        const label = item.title || item.name || 'Ação';
        diagram += `    ${sanitize(from)}->>Sistema: ${escapeLabel(label)}\n`;
    });

    return diagram;
}

// ============================================================================
// ENTITY RELATIONSHIPS → erDiagram
// ============================================================================

interface EntityItem {
    [key: string]: unknown;
}

function generateERDiagram(data: EntityItem[], title: string): string {
    const items = Array.isArray(data) ? data.slice(0, 10) : [];
    if (items.length === 0) return 'erDiagram\n    EMPTY ||--o{ DATA : "sem dados"\n';

    const sample = items[0];
    const keys = Object.keys(sample);
    const fkFields = keys.filter(k => k.endsWith('Id') || k.endsWith('_id'));
    const mainEntity = title.replace(/\s+/g, '');

    let diagram = `erDiagram\n`;
    diagram += `    ${mainEntity} {\n`;

    // Add non-FK fields as entity attributes
    keys.filter(k => !fkFields.includes(k)).slice(0, 8).forEach(k => {
        const type = typeof sample[k] === 'number' ? 'int' : 'string';
        diagram += `        ${type} ${k}\n`;
    });
    diagram += `    }\n`;

    // Add relationships for FK fields
    fkFields.forEach(fk => {
        const related = fk.replace(/Id$/, '').replace(/_id$/, '').replace(/^./, c => c.toUpperCase());
        diagram += `    ${mainEntity} }o--|| ${related} : "pertence a"\n`;
    });

    return diagram;
}

// ============================================================================
// EXPERIENCE SCORES → journey
// ============================================================================

interface ScoreItem {
    name?: string;
    title?: string;
    category?: string;
    rating?: number;
    score?: number;
    [key: string]: unknown;
}

function generateJourney(data: ScoreItem[], title: string): string {
    const items = Array.isArray(data) ? data.slice(0, 10) : [];
    let diagram = `journey\n`;
    diagram += `    title ${escapeLabel(title)}\n`;

    // Group by category
    const byCategory = new Map<string, ScoreItem[]>();
    items.forEach(item => {
        const cat = item.category || 'Geral';
        const arr = byCategory.get(cat) || [];
        arr.push(item);
        byCategory.set(cat, arr);
    });

    byCategory.forEach((catItems, category) => {
        diagram += `    section ${escapeLabel(category)}\n`;
        catItems.forEach(item => {
            const label = item.name || item.title || 'Item';
            const score = Math.max(1, Math.min(5, item.rating || item.score || 3));
            diagram += `        ${escapeLabel(label)}: ${score}\n`;
        });
    });

    return diagram;
}

// ============================================================================
// DATE RANGES → gantt
// ============================================================================

interface DateRangeItem {
    name?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    dayOfWeek?: number;
    [key: string]: unknown;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function generateGantt(data: DateRangeItem[], title: string): string {
    const items = Array.isArray(data) ? data.slice(0, 20) : [];
    let diagram = `gantt\n`;
    diagram += `    title ${escapeLabel(title)}\n`;
    diagram += `    dateFormat HH:mm\n`;
    diagram += `    axisFormat %H:%M\n`;

    // Group by day if dayOfWeek exists
    const byDay = new Map<number, DateRangeItem[]>();
    items.forEach(item => {
        const day = item.dayOfWeek ?? 1;
        const arr = byDay.get(day) || [];
        arr.push(item);
        byDay.set(day, arr);
    });

    byDay.forEach((dayItems, day) => {
        diagram += `    section ${DAY_NAMES[day] || `Dia ${day}`}\n`;
        dayItems.forEach(item => {
            const label = item.name || item.title || 'Atividade';
            const start = item.startTime || item.startDate || '08:00';
            const end = item.endTime || item.endDate || '09:00';
            const active = item.status === 'active' ? 'active,' : '';
            diagram += `        ${escapeLabel(label)} :${active} ${start}, ${end}\n`;
        });
    });

    return diagram;
}

// ============================================================================
// MINDMAP
// ============================================================================

function generateMindmap(data: unknown[], title: string): string {
    const items = Array.isArray(data) ? data.slice(0, 15) : [];
    let diagram = `mindmap\n`;
    diagram += `  root((${escapeLabel(title)}))\n`;

    // Group by type/category if available
    const groups = new Map<string, string[]>();
    items.forEach((raw) => {
        const item = raw as Record<string, unknown>;
        const group = String(item.type || item.category || 'Geral');
        const label = String(item.name || item.title || item.id || '');
        const arr = groups.get(group) || [];
        arr.push(label);
        groups.set(group, arr);
    });

    groups.forEach((labels, group) => {
        diagram += `    ${escapeLabel(group)}\n`;
        labels.slice(0, 5).forEach(label => {
            diagram += `      ${escapeLabel(label)}\n`;
        });
    });

    return diagram;
}

// ============================================================================
// KNOWLEDGE GRAPH → graph (network visualization)
// Renders knowledge_nodes + knowledge_edges as a concept network
// ============================================================================

interface KnowledgeNodeItem {
    id?: string;
    title?: string;
    nodeType?: 'concept' | 'insight' | 'skill' | 'belief';
    description?: string;
    difficulty?: string;
    subjectArea?: string;
}

interface KnowledgeEdgeItem {
    sourceNodeId?: string;
    targetNodeId?: string;
    relationship?: string;
    weight?: number;
}

interface KnowledgeGraphPayload {
    nodes?: KnowledgeNodeItem[];
    edges?: KnowledgeEdgeItem[];
}

// Relationship → edge label in PT-BR
const EDGE_LABELS: Record<string, string> = {
    supports: 'apoia',
    contradicts: 'contradiz',
    extends: 'estende',
    requires: 'requer',
    inspires: 'inspira',
    inverse: 'inverso',
    contains: 'contém',
};

// Node type → shape wrapper
const NODE_SHAPES: Record<string, [string, string]> = {
    concept: ['[', ']'],          // rectangle
    insight: ['([', '])'],        // stadium
    skill: ['{{', '}}'],       // hexagon
    belief: ['((', '))'],       // circle
};

function generateKnowledgeGraph(data: unknown[], title: string): string {
    // Handle both array-of-nodes and {nodes, edges} payloads
    let nodes: KnowledgeNodeItem[] = [];
    let edges: KnowledgeEdgeItem[] = [];

    if (data.length === 1 && typeof data[0] === 'object' && data[0] !== null) {
        const payload = data[0] as KnowledgeGraphPayload;
        if (payload.nodes) { nodes = payload.nodes; edges = payload.edges || []; }
        else { nodes = data as KnowledgeNodeItem[]; }
    } else {
        nodes = data as KnowledgeNodeItem[];
    }

    nodes = nodes.slice(0, 30); // Cap for readability
    edges = edges.slice(0, 50);

    let diagram = `graph LR\n`;

    // Node definitions with type-based shapes
    nodes.forEach(node => {
        const id = sanitize(node.id || String(Math.random()));
        const label = escapeLabel(node.title || id);
        const type = node.nodeType || 'concept';
        const [open, close] = NODE_SHAPES[type] || ['[', ']'];
        diagram += `    ${id}${open}"${label}"${close}\n`;
    });

    diagram += `\n`;

    // Edge definitions with relationship labels
    edges.forEach(edge => {
        const src = sanitize(edge.sourceNodeId || '');
        const tgt = sanitize(edge.targetNodeId || '');
        if (!src || !tgt) return;

        const rel = edge.relationship || 'supports';
        const label = EDGE_LABELS[rel] || rel;
        const style = rel === 'contradicts' ? '-.->' : '-->';

        diagram += `    ${src} ${style}|${label}| ${tgt}\n`;
    });

    // Type-based styling
    diagram += `\n`;
    diagram += `    classDef concept fill:#228be6,color:#fff,stroke:#1971c2\n`;
    diagram += `    classDef insight fill:#40c057,color:#fff,stroke:#2f9e44\n`;
    diagram += `    classDef skill fill:#fd7e14,color:#fff,stroke:#e8590c\n`;
    diagram += `    classDef belief fill:#be4bdb,color:#fff,stroke:#9c36b5\n`;

    // Apply classes
    const byType = new Map<string, string[]>();
    nodes.forEach(node => {
        const id = sanitize(node.id || '');
        const type = node.nodeType || 'concept';
        const arr = byType.get(type) || [];
        arr.push(id);
        byType.set(type, arr);
    });

    byType.forEach((ids, type) => {
        if (ids.length > 0) {
            diagram += `    class ${ids.join(',')} ${type}\n`;
        }
    });

    return diagram;
}

// ============================================================================
// HELPERS
// ============================================================================

function sanitize(s: string): string {
    return s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'node';
}

function escapeLabel(s: string): string {
    return s.replace(/"/g, "'").replace(/[[\]{}()#;]/g, '');
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

const GENERATORS: Record<DiagramType, (data: any[], title: string) => string> = {
    stateDiagram: generateStateDiagram,
    flowchart: generateFlowchart,
    sequenceDiagram: generateSequenceDiagram,
    erDiagram: generateERDiagram,
    journey: generateJourney,
    gantt: generateGantt,
    mindmap: generateMindmap,
    graph: generateKnowledgeGraph,
};

export interface DiagramResult {
    syntax: string;
    diagramType: DiagramType;
}

/**
 * Generate Mermaid diagram syntax from API data.
 * Fully deterministic — no AI call needed.
 */
export function generateDiagram(
    diagramType: DiagramType,
    data: unknown,
    title: string,
): DiagramResult {
    const items = Array.isArray(data) ? data : [data];
    const generator = GENERATORS[diagramType];
    const syntax = generator(items, title);

    return { syntax, diagramType };
}
