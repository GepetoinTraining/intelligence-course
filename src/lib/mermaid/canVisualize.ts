/**
 * Mermaid Visualization — Route-to-Diagram Type Mapper
 *
 * Determines whether an API route's data can be visualized as a diagram,
 * and if so, which type. Each DiagramType maps to a specific Tabler icon.
 *
 * ICON → DIAGRAM TYPE MAPPING:
 * ┌──────────────────────┬──────────────────────┬────────────────────────────────┐
 * │  Icon                │  Diagram Type        │  Shows                         │
 * ├──────────────────────┼──────────────────────┼────────────────────────────────┤
 * │  IconGitBranch       │  stateDiagram        │  Status/state transitions      │
 * │  IconHierarchy       │  flowchart           │  Parent-child / funnels        │
 * │  IconArrowsExchange  │  sequenceDiagram     │  Temporal event chains         │
 * │  IconRelationManyToMany │ erDiagram         │  Entity relationships          │
 * │  IconMoodSmile       │  journey             │  Experience/satisfaction maps   │
 * │  IconCalendarEvent   │  gantt               │  Time-based task schedules     │
 * │  IconBrain           │  mindmap             │  Concept/category trees        │
 * └──────────────────────┴──────────────────────┴────────────────────────────────┘
 */

export type DiagramType =
    | 'flowchart'
    | 'sequenceDiagram'
    | 'erDiagram'
    | 'stateDiagram'
    | 'journey'
    | 'gantt'
    | 'mindmap'
    | 'graph';

export interface VisualizationHint {
    type: DiagramType;
    title: string;
    /** Tabler icon name (without 'Icon' prefix) for the toggle button */
    iconName: string;
}

// ============================================================================
// ICON MAPPING — Each diagram type has exactly ONE icon
// ============================================================================

export const DIAGRAM_ICON_MAP: Record<DiagramType, string> = {
    stateDiagram: 'IconGitBranch',
    flowchart: 'IconHierarchy',
    sequenceDiagram: 'IconArrowsExchange',
    erDiagram: 'IconRelationManyToMany',
    journey: 'IconMoodSmile',
    gantt: 'IconCalendarEvent',
    mindmap: 'IconBrain',
    graph: 'IconVectorTriangle',
};

export const DIAGRAM_LABELS: Record<DiagramType, string> = {
    stateDiagram: 'Fluxo de Estados',
    flowchart: 'Diagrama de Fluxo',
    sequenceDiagram: 'Diagrama de Sequência',
    erDiagram: 'Relacionamentos',
    journey: 'Mapa de Experiência',
    gantt: 'Linha do Tempo',
    mindmap: 'Mapa Mental',
    graph: 'Grafo de Conhecimento',
};

// ============================================================================
// ROUTE-SPECIFIC OVERRIDES (known routes → known diagram type)
// ============================================================================

const ROUTE_OVERRIDES: Record<string, VisualizationHint> = {
    // Kaizen — suggestion lifecycle is a clear state machine
    '/api/kaizen/suggestions': {
        type: 'stateDiagram',
        title: 'Ciclo de Sugestões Kaizen',
        iconName: DIAGRAM_ICON_MAP.stateDiagram,
    },
    // Communication — message flow
    '/api/communicator/conversations': {
        type: 'sequenceDiagram',
        title: 'Fluxo de Mensagens',
        iconName: DIAGRAM_ICON_MAP.sequenceDiagram,
    },
    // Templates — automation trigger flow
    '/api/templates': {
        type: 'flowchart',
        title: 'Fluxo de Automações',
        iconName: DIAGRAM_ICON_MAP.flowchart,
    },
    // Meetings — scheduling sequence
    '/api/meetings': {
        type: 'sequenceDiagram',
        title: 'Fluxo de Reuniões',
        iconName: DIAGRAM_ICON_MAP.sequenceDiagram,
    },
    // Schedules — gantt view
    '/api/schedules': {
        type: 'gantt',
        title: 'Grade Horária',
        iconName: DIAGRAM_ICON_MAP.gantt,
    },
    // Rooms — entity relationships
    '/api/rooms': {
        type: 'erDiagram',
        title: 'Mapa de Recursos',
        iconName: DIAGRAM_ICON_MAP.erDiagram,
    },
    // Knowledge graph — org-wide concept network
    '/api/wiki/graph': {
        type: 'graph',
        title: 'Grafo de Conhecimento',
        iconName: DIAGRAM_ICON_MAP.graph,
    },
};

// ============================================================================
// DATA-SHAPE DETECTION — Heuristic analysis of response data
// ============================================================================

function hasStatusField(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    const sample = data[0];
    return typeof sample === 'object' && sample !== null && ('status' in sample || 'state' in sample);
}

function hasTimestampSequence(data: unknown): boolean {
    if (!Array.isArray(data) || data.length < 2) return false;
    const sample = data[0];
    if (typeof sample !== 'object' || sample === null) return false;
    return 'createdAt' in sample || 'timestamp' in sample || 'scheduledAt' in sample || 'scheduledStart' in sample;
}

function hasParentChild(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    const sample = data[0];
    if (typeof sample !== 'object' || sample === null) return false;
    return 'parentId' in sample || 'parent_id' in sample || 'children' in sample;
}

function hasForeignKeys(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    const sample = data[0];
    if (typeof sample !== 'object' || sample === null) return false;
    const keys = Object.keys(sample);
    const fkCount = keys.filter(k => k.endsWith('Id') || k.endsWith('_id')).length;
    return fkCount >= 2; // At least 2 FK = entity relationship
}

function hasRatingOrScore(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    const sample = data[0];
    if (typeof sample !== 'object' || sample === null) return false;
    return 'rating' in sample || 'score' in sample || 'nps' in sample || 'satisfaction' in sample;
}

function hasDateRange(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    const sample = data[0];
    if (typeof sample !== 'object' || sample === null) return false;
    return ('startDate' in sample && 'endDate' in sample) ||
        ('startTime' in sample && 'endTime' in sample) ||
        ('validFrom' in sample && 'validUntil' in sample);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Determine if a given route + data combination can be visualized as a diagram.
 * Returns a VisualizationHint with the diagram type + icon, or null.
 */
export function canVisualize(route: string, data: unknown): VisualizationHint | null {
    // 1. Check explicit route overrides first
    const baseRoute = route.split('?')[0];
    const override = ROUTE_OVERRIDES[baseRoute];
    if (override) return override;

    // 2. Heuristic detection on data shape
    if (hasStatusField(data)) {
        return {
            type: 'stateDiagram',
            title: 'Fluxo de Estados',
            iconName: DIAGRAM_ICON_MAP.stateDiagram,
        };
    }

    if (hasParentChild(data)) {
        return {
            type: 'flowchart',
            title: 'Estrutura Hierárquica',
            iconName: DIAGRAM_ICON_MAP.flowchart,
        };
    }

    if (hasRatingOrScore(data)) {
        return {
            type: 'journey',
            title: 'Mapa de Experiência',
            iconName: DIAGRAM_ICON_MAP.journey,
        };
    }

    if (hasDateRange(data)) {
        return {
            type: 'gantt',
            title: 'Linha do Tempo',
            iconName: DIAGRAM_ICON_MAP.gantt,
        };
    }

    if (hasForeignKeys(data)) {
        return {
            type: 'erDiagram',
            title: 'Relacionamentos',
            iconName: DIAGRAM_ICON_MAP.erDiagram,
        };
    }

    if (hasTimestampSequence(data)) {
        return {
            type: 'sequenceDiagram',
            title: 'Sequência de Eventos',
            iconName: DIAGRAM_ICON_MAP.sequenceDiagram,
        };
    }

    // 3. No topological meaning detected
    return null;
}
