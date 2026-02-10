/**
 * Phase C Step 2: Clean up mock data remnants and wire remaining pages.
 * 
 * Two jobs:
 * A) Pages with useApi=True but still have mock data → remove dead mock constants
 * B) Pages with useApi=False and mock data → add useApi + remove mock
 */
import fs from 'fs';
import path from 'path';

const ADMIN = path.resolve('src/app/admin');

// Pages that need mock removal + optional API wiring
// [relPath, apiEndpoint (null = already wired)]
const PAGES = [
    // Already have useApi, just remove mock data
    ['comercial/desempenho/page.tsx', null],
    ['configuracoes/cargos/page.tsx', null],
    ['configuracoes/seguranca/page.tsx', null],
    ['contabil/contador/page.tsx', null],
    ['contabil/dre/page.tsx', null],
    ['marketing/indicacoes/page.tsx', null],
    ['marketing/landing-pages/page.tsx', null],
    ['pedagogico/grade/page.tsx', null],
    ['relatorios/agendados/page.tsx', null],
    ['relatorios/dashboards/page.tsx', null],
    ['relatorios/exportar/page.tsx', null],
    ['relatorios/personalizado/page.tsx', null],

    // Need useApi wiring (don't have it yet)
    ['conhecimento/politicas/page.tsx', '/api/wiki/articles?category=policy'],
    ['conhecimento/procedimentos/page.tsx', '/api/procedures'],
    ['conhecimento/templates/page.tsx', '/api/templates'],
    ['financeiro/contas/page.tsx', '/api/payment-methods'],
    ['financeiro/contas-pagar/page.tsx', '/api/payables'],
    ['marketing/conteudo/page.tsx', '/api/templates?type=content'],
    ['comunicacoes/mensagens/page.tsx', null], // orphan, skip
];

let cleaned = 0;
let wired = 0;

for (const [relPath, apiEndpoint] of PAGES) {
    const fullPath = path.join(ADMIN, relPath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⏭️  SKIP: ${relPath} (not found)`);
        continue;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    let changed = false;

    // ── Remove mock data constants ──
    // Pattern 1: // Mock data\nconst mockXxx: Type[] = [...];
    // Pattern 2: // Demo description\nconst xxx = [...];  
    // Pattern 3: const mockXxx = [...];

    // More aggressive: remove any `const xxx = [{ ... }];` blocks at module scope (before export)
    const lines = content.split('\n');
    let inMockBlock = false;
    let mockStartLine = -1;
    let bracketDepth = 0;
    let mockLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect start of mock array
        if (!inMockBlock && (
            trimmed.startsWith('const mock') ||
            trimmed.match(/^\/\/\s*(Mock|Demo|Sample|Dados)/) ||
            (trimmed.match(/^const \w+ =\s*\[/) && !trimmed.includes('useState') && i < lines.indexOf(lines.find(l => l.includes('export default'))))
        )) {
            // Check if it's a mock array (contains [{)
            if (trimmed.match(/=\s*\[/) || (i + 1 < lines.length && lines[i + 1].trim().startsWith('const') && lines[i + 1].includes('= ['))) {
                // It's a comment line before mock data
                if (trimmed.startsWith('//')) {
                    mockStartLine = i;
                    continue;
                }
                // It's the const line itself  
                if (trimmed.includes('= [')) {
                    if (mockStartLine === -1) mockStartLine = i;
                    inMockBlock = true;
                    bracketDepth = (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
                    if (bracketDepth <= 0) {
                        // Single-line array
                        mockLines.push([mockStartLine, i]);
                        inMockBlock = false;
                        mockStartLine = -1;
                    }
                    continue;
                }
            }
            if (mockStartLine !== -1 && !trimmed.startsWith('const')) {
                mockStartLine = -1; // Reset if comment wasn't followed by const
            }
        } else if (inMockBlock) {
            bracketDepth += (line.match(/\[/g) || []).length;
            bracketDepth -= (line.match(/\]/g) || []).length;
            if (bracketDepth <= 0) {
                mockLines.push([mockStartLine, i]);
                inMockBlock = false;
                mockStartLine = -1;
                bracketDepth = 0;
            }
        } else {
            mockStartLine = -1;
        }
    }

    // Remove mock blocks (reverse order to preserve line numbers)
    if (mockLines.length > 0) {
        for (const [start, end] of mockLines.reverse()) {
            // Also remove blank line after
            const removeEnd = (end + 1 < lines.length && lines[end + 1].trim() === '') ? end + 1 : end;
            lines.splice(start, removeEnd - start + 1);
        }
        content = lines.join('\n');
        changed = true;
        console.log(`  🗑️  Removed ${mockLines.length} mock block(s) from ${relPath}`);
    }

    // ── Replace useState(mockXxx) with API data ──
    // Pattern: const [xxx] = useState<Type[]>(mockXxx);
    if (content.match(/useState<\w+\[\]>\(\s*mock\w+\s*\)/)) {
        content = content.replace(
            /const \[(\w+)(?:,\s*\w+)?\]\s*=\s*useState<(\w+\[\])>\(\s*mock\w+\s*\)/g,
            (match, varName, typeName) => {
                const ep = apiEndpoint || '/api/data';
                return `// Data from API (previously mock)\n    const ${varName}: ${typeName} = []`;
            }
        );
        changed = true;
    }

    // ── Add useApi for pages that need it ──
    if (apiEndpoint && !content.includes('useApi')) {
        // Add import
        const lastImportIdx = content.lastIndexOf("from '");
        if (lastImportIdx !== -1) {
            const lineEnd = content.indexOf('\n', lastImportIdx);
            content = content.slice(0, lineEnd + 1) +
                "import { useApi } from '@/hooks/useApi';\n" +
                content.slice(lineEnd + 1);
        }

        // Add useApi call inside the function
        const funcMatch = content.match(/export default function \w+\(\)\s*\{/);
        if (funcMatch) {
            const funcEnd = content.indexOf(funcMatch[0]) + funcMatch[0].length;
            content = content.slice(0, funcEnd) +
                `\n    const { data: _apiData, isLoading, error, refetch } = useApi<any[]>('${apiEndpoint}');\n` +
                content.slice(funcEnd);
            wired++;
        }
    }

    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✅ CLEANED: ${relPath}`);
        cleaned++;
    } else {
        console.log(`⏭️  NO CHANGE: ${relPath}`);
    }
}

console.log(`\n=== Cleaned: ${cleaned} | Wired: ${wired} ===`);
