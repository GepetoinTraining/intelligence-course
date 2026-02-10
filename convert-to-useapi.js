/**
 * Converts admin pages from raw fetch() to useApi() hook.
 * This script:
 * 1. Reads each page file
 * 2. Replaces the import line to remove useEffect/useCallback, add useApi
 * 3. Replaces the fetch boilerplate (useState + useCallback + fetch + useEffect) with useApi calls
 * 4. Writes the file back
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src/app/admin');

// Configuration for each page: what APIs it fetches and how to replace the state
const pageConfigs = [
    // comunicacao/rascunhos
    {
        path: 'comunicacao/rascunhos/page.tsx',
        fetchPattern: /const fetchData = useCallback\(async \(\) => \{[\s\S]*?\}, \[.*?\]\);\s*\n\s*useEffect\(\(\) => \{[^}]*\}, \[fetchData\]\);/,
        statePattern: /const \[conversations, setConversations\] = useState<Conversation\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);\s*\n\s*const \[error, setError\] = useState<string \| null>\(null\);\s*\n\s*const \[search, setSearch\] = useState\(''\);/,
        stateReplacement: `const { data: apiData, isLoading: loading, error } = useApi<{ conversations: Conversation[] }>('/api/communicator/conversations?limit=100');
    const allConversations = apiData?.conversations || (Array.isArray(apiData) ? apiData : []);
    const conversations = useMemo(() => allConversations.filter((c: Conversation) => c.messageCount === 0 || c.isArchived), [allConversations]);
    const [search, setSearch] = useState('');`,
    },
    // ai/analises  
    {
        path: 'ai/analises/page.tsx',
        fetchPattern: /const fetchAlerts = useCallback\(async \(\) => \{[\s\S]*?\}, \[.*?\]\);\s*\n\s*useEffect\(\(\) => \{[^}]*\}, \[fetch\w*\]\);/,
        statePattern: /const \[alerts, setAlerts\] = useState<SafetyAlert\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        stateReplacement: `const { data: alertsData, isLoading: loading } = useApi<SafetyAlert[]>('/api/auditor/alerts?limit=50');
    const alerts = alertsData || [];`,
    },
    // ai/uso
    {
        path: 'ai/uso/page.tsx',
        fetchPattern: /const fetchSessions = useCallback\(async \(\) => \{[\s\S]*?\}, \[.*?\]\);\s*\n\s*useEffect\(\(\) => \{[^}]*\}, \[fetch\w*\]\);/,
        statePattern: /const \[sessions, setSessions\] = useState<ChatSession\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        stateReplacement: `const { data: sessionsData, isLoading: loading } = useApi<ChatSession[]>('/api/chat/sessions?limit=100');
    const sessions = sessionsData || [];`,
    },
    // configuracoes/api-keys
    {
        path: 'configuracoes/api-keys/page.tsx',
        fetchPattern: /const fetchKeys = useCallback\(async \(\) => \{[\s\S]*?\}, \[.*?\]\);\s*\n\s*useEffect\(\(\) => \{[^}]*\}, \[fetch\w*\]\);/,
        statePattern: /const \[keys, setKeys\] = useState<ApiKeyRecord\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        stateReplacement: `const { data: keysData, isLoading: loading, refetch } = useApi<ApiKeyRecord[]>('/api/api-keys');
    const keys = keysData || [];`,
    },
    // configuracoes/auditoria
    {
        path: 'configuracoes/auditoria/page.tsx',
        fetchPattern: /const fetchLogs = useCallback\(async \(\) => \{[\s\S]*?\}, \[.*?\]\);\s*\n\s*useEffect\(\(\) => \{[^}]*\}, \[fetch\w*\]\);/,
        statePattern: /const \[logs, setLogs\] = useState<NotificationEntry\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        stateReplacement: `const { data: logsData, isLoading: loading } = useApi<NotificationEntry[]>('/api/notifications?limit=100');
    const logs = logsData || [];`,
    },
    // agenda/letivo
    {
        path: 'agenda/letivo/page.tsx',
        fetchPattern: /const fetchSchedules = useCallback\(async \(\) => \{[\s\S]*?\}, \[.*?\]\);\s*\n\s*useEffect\(\(\) => \{[^}]*\}, \[fetch\w*\]\);/,
        statePattern: /const \[schedules, setSchedules\] = useState<ScheduleEntry\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        stateReplacement: `const { data: schedulesData, isLoading: loading } = useApi<ScheduleEntry[]>('/api/schedules?limit=500');
    const schedules = schedulesData || [];`,
    },
    // agenda/recursos
    {
        path: 'agenda/recursos/page.tsx',
        fetchPattern: /const fetchRooms = useCallback\(async \(\) => \{[\s\S]*?\}, \[.*?\]\);\s*\n\s*useEffect\(\(\) => \{[^}]*\}, \[fetch\w*\]\);/,
        statePattern: /const \[rooms, setRooms\] = useState<Room\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        stateReplacement: `const { data: roomsData, isLoading: loading, refetch } = useApi<Room[]>('/api/rooms');
    const rooms = roomsData || [];`,
    },
    // kaizen/retrospectivas
    {
        path: 'kaizen/retrospectivas/page.tsx',
        fetchPattern: /const fetchData = useCallback\(async \(\) => \{[\s\S]*?\}, \[.*?\]\);\s*\n\s*useEffect\(\(\) => \{[^}]*\}, \[fetchData\]\);/,
        statePattern: /const \[suggestions, setSuggestions\] = useState<Suggestion\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        stateReplacement: `const { data: suggestionsData, isLoading: loading } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=20&sort=recent');
    const suggestions = suggestionsData || [];`,
    },
];

let converted = 0;
let skipped = 0;
let errors = [];

// For all remaining pages, do a simpler generic approach:
// Find & replace the import line, then find+remove the fetch boilerplate
const allPages = [
    'comunicacao/rascunhos',
    'ai/analises',
    'ai/geradores',
    'ai/uso',
    'configuracoes/api-keys',
    'configuracoes/auditoria',
    'configuracoes/branding',
    'agenda/direcao',
    'agenda/letivo',
    'agenda/lideres',
    'agenda/recursos',
    'agenda/total',
    'contabil/balanco',
    'contabil/documentos',
    'kaizen/pesquisas',
    'kaizen/quadro',
    'kaizen/retrospectivas',
    'perfil',
    'preferencias',
    'suporte/tickets/[id]',
];

allPages.forEach(p => {
    const filePath = path.join(BASE, p.replace(/\//g, path.sep), 'page.tsx');
    try {
        let content = fs.readFileSync(filePath, 'utf-8');

        // Skip if already converted
        if (content.includes("from '@/hooks/useApi'")) {
            console.log(`SKIP (already has useApi): ${p}`);
            skipped++;
            return;
        }

        // Step 1: Fix react imports - remove useEffect/useCallback
        content = content.replace(
            /import\s*\{([^}]+)\}\s*from\s*'react';?/,
            (match, imports) => {
                const cleaned = imports
                    .split(',')
                    .map(i => i.trim())
                    .filter(i => i && i !== 'useEffect' && i !== 'useCallback')
                    .join(', ');
                return `import { ${cleaned} } from 'react';`;
            }
        );

        // Step 2: Add useApi import after the last import
        const lines = content.split('\n');
        let lastImportIdx = -1;
        lines.forEach((line, i) => {
            if (line.match(/^import\s+/) || line.match(/^\s*\}\s*from\s+'/)) {
                lastImportIdx = i;
            }
        });
        if (lastImportIdx >= 0) {
            lines.splice(lastImportIdx + 1, 0, "import { useApi } from '@/hooks/useApi';");
            content = lines.join('\n');
        }

        fs.writeFileSync(filePath, content);
        converted++;
        console.log(`STEP1 OK: ${p} (imports updated)`);
    } catch (err) {
        errors.push(`${p}: ${err.message}`);
        console.log(`ERROR: ${p}: ${err.message}`);
    }
});

console.log(`\nStep 1 complete: ${converted} imports updated, ${skipped} skipped, ${errors.length} errors`);
