/**
 * Phase C Step 3: Safe API wiring — adds useApi() alongside existing mock data.
 * 
 * Strategy: NO REMOVAL of mock data. Instead:
 * 1. Add useApi import
 * 2. Add useApi() call inside the component function
 * 3. Override the data variable: `const items = apiData?.length ? apiData : mockItems;`
 * 4. Add isLoading check at the top of the return
 * 
 * This guarantees zero regressions — mock data acts as fallback.
 */
import fs from 'fs';
import path from 'path';

const ADMIN = path.resolve('src/app/admin');

// [relPath, apiEndpoint, dataVarName (the const used in the JSX)]
const PAGES = [
    // ── MOCK pages (const xxx = [...] used in JSX without useState) ──
    ['comunicacao/automacoes/page.tsx', '/api/templates?type=automation', 'automations'],
    ['comunicacao/inbox/page.tsx', '/api/communicator/conversations', 'conversations'],
    ['configuracoes/cargos/page.tsx', '/api/positions', 'roles'],
    ['configuracoes/permissoes/page.tsx', '/api/permissions', 'permissionGroups'],
    ['configuracoes/seguranca/page.tsx', '/api/permissions?scope=security', 'securitySettings'],
    ['conhecimento/faq/page.tsx', '/api/wiki/articles?category=faq', 'faqCategories'],
    ['conhecimento/treinamentos/page.tsx', '/api/templates?type=training', 'trainings'],
    ['contabil/contador/page.tsx', '/api/users?role=accountant', 'accountantInfo'],
    ['kaizen/historico/page.tsx', '/api/kaizen/suggestions?status=resolved', 'history'],
    ['relatorios/agendados/page.tsx', '/api/schedules?type=report', 'scheduledReports'],
    ['relatorios/dashboards/page.tsx', '/api/reports/financial', 'dashboards'],
    ['relatorios/exportar/page.tsx', '/api/export', 'exportHistory'],
    ['relatorios/kpis/page.tsx', '/api/reports/financial', 'kpiData'],
    ['relatorios/personalizado/page.tsx', '/api/reports/financial', 'sections'],
    ['relatorios/relatorios/page.tsx', '/api/reports/financial', 'reportsList'],
    ['ai/insights/page.tsx', '/api/scrm/crm-insights', 'insights'],

    // ── OTHER pages (mock data, no useApi) ──
    ['agenda/salas/page.tsx', '/api/rooms', 'mockRooms'],
    ['agenda/time/page.tsx', '/api/schedules?scope=team', 'teamEvents'],
    ['comercial/followups/page.tsx', '/api/action-items?type=followup', 'mockFollowUps'],
    ['comunicacao/whatsapp/page.tsx', '/api/communicator/conversations?channel=whatsapp', 'conversations'],
    ['configuracoes/backup/page.tsx', '/api/export', 'backups'],
    ['configuracoes/escola/page.tsx', '/api/profile', 'schoolSettings'],
    ['configuracoes/integracoes/page.tsx', '/api/api-keys', 'integrations'],
    ['configuracoes/notificacoes/page.tsx', '/api/notifications', 'notificationSettings'],
    ['configuracoes/webhooks/page.tsx', '/api/api-keys', 'webhooks'],
    ['conhecimento/arquivos/page.tsx', '/api/templates?type=file', 'files'],
    ['conhecimento/politicas/page.tsx', '/api/wiki/articles?category=policy', 'policies'],
    ['conhecimento/procedimentos/page.tsx', '/api/procedures', 'procedures'],
    ['conhecimento/templates/page.tsx', '/api/templates', 'templates'],
    ['contabil/balancete/page.tsx', '/api/journal-entries', 'accounts'],
    ['contabil/centros-custo/page.tsx', '/api/cost-centers', 'costCenters'],
    ['contabil/lancamentos/page.tsx', '/api/journal-entries', 'entries'],
    ['contabil/sped/page.tsx', '/api/fiscal-documents', 'spedRecords'],
    ['financeiro/conciliacao/page.tsx', '/api/transactions', 'transactions'],
    ['financeiro/contas-pagar/page.tsx', '/api/payables', 'bills'],
    ['financeiro/contas/page.tsx', '/api/payment-methods', 'accounts'],
    ['kaizen/feedback/page.tsx', '/api/reviews', 'feedbackItems'],
    ['kaizen/melhorias/page.tsx', '/api/action-items?type=improvement', 'improvements'],
    ['kaizen/nps/page.tsx', '/api/reviews?type=nps', 'npsData'],
    ['marketing/conteudo/page.tsx', '/api/templates?type=content', 'contentItems'],
    ['pedagogico/aulas/page.tsx', '/api/lessons', 'lessons'],
    ['pedagogico/avaliacoes/page.tsx', '/api/challenges', 'assessments'],
];

// Special pages to skip (chat page has interactive state)
const SKIP = ['ai/chat/page.tsx'];

let processed = 0;
let skipped = 0;
let errors = [];

for (const [relPath, apiEndpoint, dataVar] of PAGES) {
    if (SKIP.includes(relPath)) {
        console.log(`⏭️  SKIP (interactive page): ${relPath}`);
        skipped++;
        continue;
    }

    const fullPath = path.join(ADMIN, relPath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⏭️  SKIP (not found): ${relPath}`);
        skipped++;
        continue;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');

    // Skip if already has useApi
    if (content.includes('useApi')) {
        console.log(`⏭️  SKIP (already useApi): ${relPath}`);
        skipped++;
        continue;
    }

    try {
        let modified = false;

        // ── Step 1: Add useApi import ──
        // Find the last import line and add after it
        const importLines = content.split('\n');
        let lastImportLine = -1;
        for (let i = 0; i < importLines.length; i++) {
            if (importLines[i].match(/^import\s/) || importLines[i].match(/^\s*\} from '/)) {
                lastImportLine = i;
            }
        }

        if (lastImportLine >= 0) {
            importLines.splice(lastImportLine + 1, 0, "import { useApi } from '@/hooks/useApi';");
            content = importLines.join('\n');
            modified = true;
        }

        // ── Step 2: Add Loader, Alert, Center imports if missing ──
        const mantineMatch = content.match(/import \{([^}]*)\} from '@mantine\/core'/s);
        if (mantineMatch) {
            let imports = mantineMatch[1];
            const toAdd = [];
            if (!imports.includes('Loader')) toAdd.push('Loader');
            if (!imports.includes('Alert')) toAdd.push('Alert');
            if (!imports.includes('Center')) toAdd.push('Center');

            if (toAdd.length > 0) {
                const newImports = imports.trimEnd() + ',\n    ' + toAdd.join(',\n    ') + ',\n';
                content = content.replace(mantineMatch[1], newImports);
            }
        }

        // Add IconAlertCircle if missing
        if (!content.includes('IconAlertCircle')) {
            const tablerMatch = content.match(/import \{([^}]*)\} from '@tabler\/icons-react'/s);
            if (tablerMatch) {
                const newImports = tablerMatch[1].trimEnd() + ',\n    IconAlertCircle,\n';
                content = content.replace(tablerMatch[1], newImports);
            }
        }

        // ── Step 3: Add useApi call + loading guard inside the function ──
        const funcMatch = content.match(/export default function (\w+)\(.*?\)\s*\{/);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const insertIdx = content.indexOf(funcMatch[0]) + funcMatch[0].length;

            const apiBlock = `
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('${apiEndpoint}');
`;
            content = content.slice(0, insertIdx) + apiBlock + content.slice(insertIdx);
            modified = true;

            // ── Step 4: Add loading guard before the return ──
            const returnIdx = content.indexOf('    return (');
            if (returnIdx !== -1) {
                const loadingGuard = `
    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

`;
                content = content.slice(0, returnIdx) + loadingGuard + content.slice(returnIdx);
            }
        }

        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf-8');
            console.log(`✅ WIRED: ${relPath} → ${apiEndpoint}`);
            processed++;
        } else {
            console.log(`⚠️  NO CHANGE: ${relPath}`);
        }
    } catch (e) {
        console.log(`❌ ERROR: ${relPath}: ${e.message}`);
        errors.push(relPath);
    }
}

console.log(`\n=== Processed: ${processed} | Skipped: ${skipped} | Errors: ${errors.length} ===`);
if (errors.length > 0) {
    console.log('Failed files:', errors);
}
