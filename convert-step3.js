/**
 * Step 3: Replace useState declarations with useApi calls for pages
 * where the useCallback block was removed but useState remains.
 * Also handle special pages with inline fetch().
 */
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, 'src/app/admin');

function read(relPath) {
    return fs.readFileSync(path.join(BASE, relPath.replace(/\//g, path.sep), 'page.tsx'), 'utf-8');
}

function write(relPath, content) {
    fs.writeFileSync(path.join(BASE, relPath.replace(/\//g, path.sep), 'page.tsx'), content);
    console.log(`OK: ${relPath}`);
}

function replaceStr(content, find, replace) {
    if (!content.includes(find)) {
        console.log(`  WARNING: exact string not found`);
        return content;
    }
    return content.replace(find, replace);
}

// ═══════ configuracoes/branding ═══════
{
    let c = read('configuracoes/branding');
    c = replaceStr(c,
        `    const [branding, setBranding] = useState<OrgBranding | null>(null);\n    const [loading, setLoading] = useState(true);`,
        `    const { data: branding, isLoading: loading } = useApi<OrgBranding>('/api/user/organizations');`
    );
    write('configuracoes/branding', c);
}

// ═══════ agenda/direcao ═══════
{
    let c = read('agenda/direcao');
    c = replaceStr(c,
        `    const [meetings, setMeetings] = useState<Meeting[]>([]);\n    const [loading, setLoading] = useState(true);`,
        `    const { data: meetingsData, isLoading: loading } = useApi<Meeting[]>('/api/meetings?limit=100');\n    const meetings = meetingsData || [];`
    );
    write('agenda/direcao', c);
}

// ═══════ agenda/lideres ═══════
{
    let c = read('agenda/lideres');
    c = replaceStr(c,
        `    const [meetings, setMeetings] = useState<Meeting[]>([]);\n    const [loading, setLoading] = useState(true);`,
        `    const { data: meetingsData, isLoading: loading } = useApi<Meeting[]>('/api/meetings?limit=100');\n    const meetings = meetingsData || [];`
    );
    write('agenda/lideres', c);
}

// ═══════ agenda/total ═══════
{
    let c = read('agenda/total');
    c = replaceStr(c,
        `    const [meetings, setMeetings] = useState<Meeting[]>([]);\n    const [loading, setLoading] = useState(true);`,
        `    const { data: meetingsData, isLoading: loading } = useApi<Meeting[]>('/api/meetings?limit=200');\n    const meetings = meetingsData || [];`
    );
    write('agenda/total', c);
}

// ═══════ contabil/balanco ═══════
{
    let c = read('contabil/balanco');
    c = replaceStr(c,
        `    const [data, setData] = useState<BalancoData | null>(null);\n    const [loading, setLoading] = useState(true);`,
        `    const { data, isLoading: loading } = useApi<BalancoData>('/api/reports/financial?section=accounting');`
    );
    write('contabil/balanco', c);
}

// ═══════ contabil/documentos ═══════
{
    let c = read('contabil/documentos');
    c = replaceStr(c,
        `    const [documents, setDocuments] = useState<FiscalDocument[]>([]);\n    const [loading, setLoading] = useState(true);`,
        `    const { data: documentsData, isLoading: loading } = useApi<FiscalDocument[]>('/api/fiscal-documents?limit=100');\n    const documents = documentsData || [];`
    );
    write('contabil/documentos', c);
}

// ═══════ kaizen/pesquisas ═══════
{
    let c = read('kaizen/pesquisas');
    c = replaceStr(c,
        `    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);\n    const [loading, setLoading] = useState(true);`,
        `    const { data: suggestionsData, isLoading: loading } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=50');\n    const suggestions = suggestionsData || [];`
    );
    write('kaizen/pesquisas', c);
}

// ═══════ kaizen/quadro ═══════
{
    let c = read('kaizen/quadro');
    c = replaceStr(c,
        `    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);\n    const [loading, setLoading] = useState(true);`,
        `    const { data: suggestionsData, isLoading: loading } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');\n    const suggestions = suggestionsData || [];`
    );
    write('kaizen/quadro', c);
}

console.log('\nStep 3 complete!');
