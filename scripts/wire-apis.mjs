/**
 * Phase C: Wire mock/static pages to real API endpoints.
 * 
 * For each page:
 * 1. Remove mock data constants (const mockXxx = [...])
 * 2. Add useApi import if missing
 * 3. Replace useState(mockXxx) with useApi('/api/endpoint')
 * 4. Add loading/error/empty states
 */
import fs from 'fs';
import path from 'path';

const ADMIN = path.resolve('src/app/admin');

// ─── Page → API mapping ───────────────────────────────────────────────────
// Each entry: [relPath, apiEndpoint, dataVar, typeName]
const PAGE_API_MAP = [
    // ── Comercial ──
    ['comercial/followups/page.tsx', '/api/action-items?type=followup', 'followUps', 'FollowUp'],

    // ── Agenda ──
    ['agenda/salas/page.tsx', '/api/rooms', 'rooms', 'Room'],
    ['agenda/time/page.tsx', '/api/schedules?scope=team', 'schedules', 'Schedule'],

    // ── Comunicação ──
    ['comunicacao/automacoes/page.tsx', '/api/templates?type=automation', 'automations', 'Automation'],
    ['comunicacao/inbox/page.tsx', '/api/communicator/conversations', 'conversations', 'Conversation'],
    ['comunicacao/whatsapp/page.tsx', '/api/communicator/conversations?channel=whatsapp', 'conversations', 'Conversation'],

    // ── Configurações ──
    ['configuracoes/cargos/page.tsx', '/api/positions', 'positions', 'Position'],
    ['configuracoes/permissoes/page.tsx', '/api/permissions', 'permissions', 'Permission'],
    ['configuracoes/seguranca/page.tsx', '/api/permissions?scope=security', 'securityItems', 'SecurityItem'],
    ['configuracoes/backup/page.tsx', '/api/export', 'backups', 'BackupItem'],
    ['configuracoes/escola/page.tsx', '/api/profile', 'school', 'SchoolProfile'],
    ['configuracoes/integracoes/page.tsx', '/api/api-keys', 'integrations', 'Integration'],
    ['configuracoes/notificacoes/page.tsx', '/api/notifications', 'notifications', 'Notification'],
    ['configuracoes/webhooks/page.tsx', '/api/api-keys', 'webhooks', 'Webhook'],

    // ── Conhecimento ──
    ['conhecimento/faq/page.tsx', '/api/wiki/articles?category=faq', 'faqs', 'FAQ'],
    ['conhecimento/treinamentos/page.tsx', '/api/templates?type=training', 'trainings', 'Training'],
    ['conhecimento/arquivos/page.tsx', '/api/templates?type=file', 'files', 'FileItem'],

    // ── Contábil ──
    ['contabil/contador/page.tsx', '/api/users?role=accountant', 'accountants', 'Accountant'],
    ['contabil/balancete/page.tsx', '/api/journal-entries', 'entries', 'JournalEntry'],
    ['contabil/centros-custo/page.tsx', '/api/cost-centers', 'centers', 'CostCenter'],
    ['contabil/lancamentos/page.tsx', '/api/journal-entries', 'entries', 'JournalEntry'],
    ['contabil/sped/page.tsx', '/api/fiscal-documents', 'documents', 'FiscalDoc'],

    // ── Financeiro ──
    ['financeiro/conciliacao/page.tsx', '/api/transactions', 'transactions', 'Transaction'],

    // ── Kaizen ──
    ['kaizen/historico/page.tsx', '/api/kaizen/suggestions?status=resolved', 'history', 'Suggestion'],
    ['kaizen/feedback/page.tsx', '/api/reviews', 'reviews', 'Review'],
    ['kaizen/melhorias/page.tsx', '/api/action-items?type=improvement', 'improvements', 'Improvement'],
    ['kaizen/nps/page.tsx', '/api/reviews?type=nps', 'surveys', 'NPSSurvey'],

    // ── Pedagógico ──
    ['pedagogico/aulas/page.tsx', '/api/lessons', 'lessons', 'Lesson'],
    ['pedagogico/avaliacoes/page.tsx', '/api/challenges', 'assessments', 'Assessment'],

    // ── Relatórios ──
    ['relatorios/agendados/page.tsx', '/api/schedules?type=report', 'reports', 'ScheduledReport'],
    ['relatorios/dashboards/page.tsx', '/api/reports/financial', 'dashboardData', 'DashboardData'],
    ['relatorios/exportar/page.tsx', '/api/export', 'exports', 'ExportItem'],
    ['relatorios/kpis/page.tsx', '/api/reports/financial', 'kpiData', 'KPIData'],
    ['relatorios/personalizado/page.tsx', '/api/reports/financial', 'reportData', 'ReportData'],
    ['relatorios/relatorios/page.tsx', '/api/reports/financial', 'reportList', 'ReportItem'],

    // ── AI ──
    ['ai/chat/page.tsx', '/api/chat/sessions', 'sessions', 'ChatSession'],
    ['ai/insights/page.tsx', '/api/scrm/crm-insights', 'insights', 'Insight'],
];

let processed = 0;
let skipped = 0;

for (const [relPath, apiEndpoint, dataVar, typeName] of PAGE_API_MAP) {
    const fullPath = path.join(ADMIN, relPath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⏭️  SKIP (not found): ${relPath}`);
        skipped++;
        continue;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');

    // Skip if already uses useApi
    if (content.includes('useApi')) {
        console.log(`⏭️  SKIP (already useApi): ${relPath}`);
        skipped++;
        continue;
    }

    let changed = false;

    // ── Step 1: Add useApi import ──
    if (!content.includes("import { useApi }")) {
        // Add after last import line
        const lastImport = content.lastIndexOf("from '");
        if (lastImport !== -1) {
            const lineEnd = content.indexOf('\n', lastImport);
            const insertPoint = lineEnd + 1;

            // Also add loading components if missing
            const needsLoader = !content.includes('Loader');
            const needsAlert = !content.includes('Alert');
            const needsCenter = !content.includes('Center');

            let addImports = "import { useApi } from '@/hooks/useApi';\n";

            // Add missing Mantine components for loading/error states
            const mantineImportMatch = content.match(/(import \{[^}]*\} from '@mantine\/core';)/s);
            if (mantineImportMatch) {
                let mantineBlock = mantineImportMatch[1];
                let additions = [];
                if (needsLoader) additions.push('Loader');
                if (needsAlert) additions.push('Alert');
                if (needsCenter) additions.push('Center');

                if (additions.length > 0) {
                    mantineBlock = mantineBlock.replace(
                        "} from '@mantine/core'",
                        `    ${additions.join(',\n    ')},\n} from '@mantine/core'`
                    );
                    content = content.replace(mantineImportMatch[1], mantineBlock);
                }
            }

            // Add IconAlertCircle if missing
            if (!content.includes('IconAlertCircle')) {
                const tablerMatch = content.match(/(import \{[^}]*\} from '@tabler\/icons-react';)/s);
                if (tablerMatch) {
                    const newTabler = tablerMatch[1].replace(
                        "} from '@tabler/icons-react'",
                        "    IconAlertCircle,\n} from '@tabler/icons-react'"
                    );
                    content = content.replace(tablerMatch[1], newTabler);
                }
            }

            content = content.slice(0, insertPoint) + addImports + content.slice(insertPoint);
            changed = true;
        }
    }

    // ── Step 2: Remove mock data constant ──
    // Pattern: const mockXxx: Type[] = [\n  ...\n];
    // or: const xxx = [\n  ...\n];
    const mockConstRegex = /\/\/\s*(?:Mock|Demo|Sample|Dados de exemplo)[^\n]*\n(?:const \w+(?::\s*\w+\[\])?\s*=\s*\[[\s\S]*?\];\s*\n)/;
    content = content.replace(mockConstRegex, '');

    // Also try without comment
    const mockConstRegex2 = /const mock\w+(?::\s*\w+\[\])?\s*=\s*\[[\s\S]*?\];\s*\n/;
    content = content.replace(mockConstRegex2, '');

    // ── Step 3: Replace useState(mockXxx) with useApi ──
    // Pattern: const [xxx, setXxx] = useState<Type[]>(mockXxx);
    // or: const [xxx] = useState<Type[]>(mockXxx);
    const useStateRegex = /const \[(\w+)(?:,\s*set\w+)?\]\s*=\s*useState<\w+\[\]>\(\w+\);\s*\n/;
    const useStateMatch = content.match(useStateRegex);

    if (useStateMatch) {
        const varName = useStateMatch[1];
        const replacement = `const { data: _apiData, isLoading, error, refetch } = useApi<any[]>('${apiEndpoint}');\n    const ${varName} = _apiData || [];\n`;
        content = content.replace(useStateRegex, replacement);
        changed = true;

        // ── Step 4: Add loading/error states ──
        // Insert after the useApi line, before the return statement
        const returnIdx = content.indexOf('    return (');
        if (returnIdx !== -1) {
            const loadingBlock = `
    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

`;
            // Only add if not already present
            if (!content.includes('if (isLoading)')) {
                content = content.slice(0, returnIdx) + loadingBlock + content.slice(returnIdx);
                changed = true;
            }
        }
    } else {
        // For pages without useState(mockXxx) pattern, try to find the data variable
        // and just add useApi at the top of the function
        const funcMatch = content.match(/export default function \w+\(\)\s*\{/);
        if (funcMatch) {
            const funcEnd = content.indexOf(funcMatch[0]) + funcMatch[0].length;
            const apiLine = `\n    const { data: _apiData, isLoading, error, refetch } = useApi<any[]>('${apiEndpoint}');\n`;

            if (!content.includes('isLoading')) {
                content = content.slice(0, funcEnd) + apiLine + content.slice(funcEnd);
                changed = true;

                // Add loading/error
                const returnIdx = content.indexOf('    return (');
                if (returnIdx !== -1 && !content.includes('if (isLoading)')) {
                    const loadingBlock = `
    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

`;
                    content = content.slice(0, returnIdx) + loadingBlock + content.slice(returnIdx);
                }
            }
        }
    }

    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✅ WIRED: ${relPath} → ${apiEndpoint}`);
        processed++;
    } else {
        console.log(`⚠️  NO CHANGE: ${relPath}`);
        skipped++;
    }
}

console.log(`\n=== Processed: ${processed} | Skipped: ${skipped} ===`);
