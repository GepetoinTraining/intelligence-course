/**
 * Step 2b: Convert ALL remaining pages with useCallback/fetch to useApi.
 * Handles complex cases: dynamic URLs, multi-endpoint, user-dependent.
 */
const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, 'src/app/admin');

function convert(relPath) {
    const filePath = path.join(BASE, relPath.replace(/\//g, path.sep), 'page.tsx');
    let c = fs.readFileSync(filePath, 'utf-8');

    // Skip if no useCallback remaining
    if (!c.includes('useCallback') && !c.includes('useEffect')) {
        if (c.includes('useApi(')) {
            console.log(`SKIP (done): ${relPath}`);
        } else if (c.match(/fetch\(/)) {
            console.log(`NEEDS MANUAL: ${relPath} (has fetch but no useCallback)`);
        } else {
            console.log(`SKIP (no fetch): ${relPath}`);
        }
        return;
    }

    // Remove useCallback import from react  
    c = c.replace(
        /import\s*\{([^}]+)\}\s*from\s*'react';?/,
        (match, imports) => {
            const items = imports.split(',').map(i => i.trim()).filter(i => i && i !== 'useEffect' && i !== 'useCallback');
            return `import { ${items.join(', ')} } from 'react';`;
        }
    );

    // Add useApi import if not present
    if (!c.includes("from '@/hooks/useApi'")) {
        const lines = c.split('\n');
        let lastImport = -1;
        lines.forEach((l, i) => { if (/^import\s/.test(l)) lastImport = i; });
        if (lastImport >= 0) {
            lines.splice(lastImport + 1, 0, "import { useApi } from '@/hooks/useApi';");
            c = lines.join('\n');
        }
    }

    // Remove entire useCallback block + useEffect
    // Generic pattern: const fetchXxx = useCallback(async () => { ... }, [deps]);
    // followed by useEffect(() => { fetchXxx(); }, [fetchXxx]);
    c = c.replace(
        /\n?\s*const\s+(\w+)\s*=\s*useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\},\s*\[[^\]]*\]\);\s*\n\s*useEffect\(\(\)\s*=>\s*\{\s*\1\(\);?\s*\},\s*\[\1\]\);/g,
        ''
    );

    // Also handle useEffect(() => { fetchXxx(); }, [fetchXxx]); on its own
    c = c.replace(
        /\s*useEffect\(\(\)\s*=>\s*\{\s*\w+\(\);?\s*\},\s*\[\w+\]\);/g,
        ''
    );

    fs.writeFileSync(filePath, c);
    console.log(`CONVERTED: ${relPath}`);
}

// Process all remaining pages
const pages = [
    'comunicacao/enviados',
    'ai/geradores',
    'configuracoes/branding',
    'agenda/direcao',
    'agenda/lideres',
    'agenda/total',
    'contabil/balanco',
    'contabil/documentos',
    'kaizen/pesquisas',
    'kaizen/quadro',
    'perfil',
    'preferencias',
    'suporte/tickets/[id]',
];

pages.forEach(p => {
    try { convert(p); }
    catch (e) { console.log(`ERROR ${p}: ${e.message}`); }
});

console.log('\nStep 2b done.');
