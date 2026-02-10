/**
 * Step 2: Replace the fetch boilerplate body with useApi() calls.
 * For each page, this script:
 * 1. Finds the useCallback/fetch/useEffect pattern
 * 2. Replaces the useState declarations and removes the fetch function + useEffect
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'src/app/admin');

function processFile(relPath, replacements) {
    const filePath = path.join(BASE, relPath.replace(/\//g, path.sep), 'page.tsx');
    let content = fs.readFileSync(filePath, 'utf-8');

    replacements.forEach(({ find, replace }) => {
        if (typeof find === 'string') {
            if (content.includes(find)) {
                content = content.replace(find, replace);
            } else {
                console.log(`  WARNING: string pattern not found in ${relPath}`);
            }
        } else {
            // regex
            if (find.test(content)) {
                content = content.replace(find, replace);
            } else {
                console.log(`  WARNING: regex pattern not found in ${relPath}`);
            }
        }
    });

    fs.writeFileSync(filePath, content);
    console.log(`OK: ${relPath}`);
}

// Generic pattern: match the whole useCallback block + useEffect
// Pattern: const fetchXxx = useCallback(async () => { ... }, [deps]); useEffect(() => { fetchXxx(); }, [fetchXxx]);
const fetchBlockRegex = (fnName) => new RegExp(
    `\\s*const ${fnName} = useCallback\\(async \\(\\) => \\{[\\s\\S]*?\\}, \\[[^\\]]*\\]\\);\\s*\\n\\s*useEffect\\(\\(\\) => \\{\\s*${fnName}\\(\\);\\s*\\}, \\[${fnName}\\]\\);`,
    ''
);

// Also match: useEffect(() => { fetchData(); }, [fetchData]); (with optional newline variations) 
const useEffectRegex = (fnName) => new RegExp(
    `\\s*useEffect\\(\\(\\) => \\{\\s*${fnName}\\(\\);?\\s*\\}, \\[${fnName}\\]\\);`,
    ''
);

// ═══════════════════════════════════════════════════════════════════════
// comunicacao/rascunhos - fetches conversations, filters to drafts
// ═══════════════════════════════════════════════════════════════════════
processFile('comunicacao/rascunhos', [
    {
        find: `    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');`,
        replace: `    const { data: apiData, isLoading: loading, error } = useApi<{ conversations: Conversation[] }>('/api/communicator/conversations?limit=100');
    const allConversations = apiData?.conversations || (Array.isArray(apiData) ? apiData : []);
    const conversations = useMemo(() => allConversations.filter((c: Conversation) => c.messageCount === 0 || c.isArchived), [allConversations]);
    const [search, setSearch] = useState('');`
    },
    {
        find: fetchBlockRegex('fetchData'),
        replace: ''
    }
]);

// ═══════════════════════════════════════════════════════════════════════
// ai/analises
// ═══════════════════════════════════════════════════════════════════════
processFile('ai/analises', [
    {
        find: /    const \[alerts, setAlerts\] = useState<SafetyAlert\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        replace: `    const { data: alertsData, isLoading: loading } = useApi<SafetyAlert[]>('/api/auditor/alerts?limit=50');
    const alerts = alertsData || [];`
    },
    {
        find: fetchBlockRegex('fetchAlerts'),
        replace: ''
    }
]);

// ═══════════════════════════════════════════════════════════════════════
// ai/uso
// ═══════════════════════════════════════════════════════════════════════
processFile('ai/uso', [
    {
        find: /    const \[sessions, setSessions\] = useState<ChatSession\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        replace: `    const { data: sessionsData, isLoading: loading } = useApi<ChatSession[]>('/api/chat/sessions?limit=100');
    const sessions = sessionsData || [];`
    },
    {
        find: fetchBlockRegex('fetchSessions'),
        replace: ''
    }
]);

// ═══════════════════════════════════════════════════════════════════════
// configuracoes/api-keys
// ═══════════════════════════════════════════════════════════════════════
processFile('configuracoes/api-keys', [
    {
        find: /    const \[keys, setKeys\] = useState<ApiKeyRecord\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        replace: `    const { data: keysData, isLoading: loading, refetch } = useApi<ApiKeyRecord[]>('/api/api-keys');
    const keys = keysData || [];`
    },
    {
        find: fetchBlockRegex('fetchKeys'),
        replace: ''
    }
]);

// ═══════════════════════════════════════════════════════════════════════
// configuracoes/auditoria
// ═══════════════════════════════════════════════════════════════════════
processFile('configuracoes/auditoria', [
    {
        find: /    const \[logs, setLogs\] = useState<NotificationEntry\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        replace: `    const { data: logsData, isLoading: loading } = useApi<NotificationEntry[]>('/api/notifications?limit=100');
    const logs = logsData || [];`
    },
    {
        find: fetchBlockRegex('fetchLogs'),
        replace: ''
    }
]);

// ═══════════════════════════════════════════════════════════════════════
// agenda/letivo
// ═══════════════════════════════════════════════════════════════════════
processFile('agenda/letivo', [
    {
        find: /    const \[schedules, setSchedules\] = useState<ScheduleEntry\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        replace: `    const { data: schedulesData, isLoading: loading } = useApi<ScheduleEntry[]>('/api/schedules?limit=500');
    const schedules = schedulesData || [];`
    },
    {
        find: fetchBlockRegex('fetchSchedules'),
        replace: ''
    }
]);

// ═══════════════════════════════════════════════════════════════════════
// agenda/recursos
// ═══════════════════════════════════════════════════════════════════════
processFile('agenda/recursos', [
    {
        find: /    const \[rooms, setRooms\] = useState<Room\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        replace: `    const { data: roomsData, isLoading: loading, refetch } = useApi<Room[]>('/api/rooms');
    const rooms = roomsData || [];`
    },
    {
        find: fetchBlockRegex('fetchRooms'),
        replace: ''
    }
]);

// ═══════════════════════════════════════════════════════════════════════
// kaizen/retrospectivas
// ═══════════════════════════════════════════════════════════════════════
processFile('kaizen/retrospectivas', [
    {
        find: /    const \[suggestions, setSuggestions\] = useState<Suggestion\[\]>\(\[\]\);\s*\n\s*const \[loading, setLoading\] = useState\(true\);/,
        replace: `    const { data: suggestionsData, isLoading: loading } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=20&sort=recent');
    const suggestions = suggestionsData || [];`
    },
    {
        find: fetchBlockRegex('fetchData'),
        replace: ''
    }
]);

console.log('\nStep 2 batch complete!');
