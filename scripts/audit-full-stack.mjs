/**
 * Comprehensive Schema → API → Admin Page Audit
 * 
 * Checks:
 * 1. Schema tables → which have API routes?
 * 2. API routes → which reference which schema tables?
 * 3. API routes → which have missing persons JOINs?
 * 4. Admin pages → which API endpoints do they call?
 * 5. Admin pages → which have mock data vs real API?
 * 6. Overall gaps and broken references
 */
import fs from 'fs';
import path from 'path';

// ============================================================================
// 1. SCAN SCHEMA TABLES
// ============================================================================
const schemaFile = fs.readFileSync('src/lib/db/schema.ts', 'utf-8');
const tableRegex = /export const (\w+) = sqliteTable\('(\w+)'/g;
const tables = [];
let m;
while ((m = tableRegex.exec(schemaFile)) !== null) {
    tables.push({ varName: m[1], sqlName: m[2] });
}

// ============================================================================
// 2. SCAN API ROUTES
// ============================================================================
function walk(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walk(full));
        else if (entry.name === 'route.ts') results.push(full);
    }
    return results;
}

const apiRoutes = walk('src/app/api').map(fullPath => {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const relPath = fullPath.replace(/.*api[\\\/]/, '').replace(/[\\\/]route\.ts$/, '');
    const httpPath = '/api/' + relPath.replace(/\\/g, '/');

    // Which tables does this route import?
    const importedTables = tables
        .filter(t => content.includes(t.varName))
        .map(t => t.varName);

    // Which HTTP methods are exported?
    const methods = [];
    if (/export\s+(async\s+)?function\s+GET/i.test(content)) methods.push('GET');
    if (/export\s+(async\s+)?function\s+POST/i.test(content)) methods.push('POST');
    if (/export\s+(async\s+)?function\s+PUT/i.test(content)) methods.push('PUT');
    if (/export\s+(async\s+)?function\s+PATCH/i.test(content)) methods.push('PATCH');
    if (/export\s+(async\s+)?function\s+DELETE/i.test(content)) methods.push('DELETE');

    // Does it use persons table but lack a persons JOIN?
    const usesPersonsCol = /persons\.firstName|persons\.avatarUrl|persons\.primaryEmail|persons\.lastName|persons\.displayName/.test(content);
    const hasPersonsJoin = /Join\(\s*persons\s*,/i.test(content);
    const hasPersonsFrom = /\.from\(\s*persons\s*\)/.test(content);
    const missingPersonsJoin = usesPersonsCol && !hasPersonsJoin && !hasPersonsFrom;

    // Does it have proper auth?
    const hasAuth = content.includes('getApiAuthWithOrg') || content.includes('getApiAuth');

    // Errors/issues
    const issues = [];
    if (missingPersonsJoin) issues.push('MISSING_PERSONS_JOIN');
    if (!hasAuth && !relPath.includes('webhook')) issues.push('NO_AUTH');
    if (importedTables.length === 0 && !relPath.includes('webhook') && !relPath.includes('chat')) {
        issues.push('NO_SCHEMA_TABLES');
    }

    return {
        path: httpPath,
        relPath,
        methods,
        tables: importedTables,
        issues,
        hasAuth,
        lines: content.split('\n').length,
    };
});

// ============================================================================
// 3. SCAN ADMIN PAGES
// ============================================================================
const adminPages = walk('src/app/admin').filter(f => f.endsWith('page.tsx')).map(fullPath => {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const relPath = fullPath.replace(/.*admin[\\\/]/, '').replace(/[\\\/]page\.tsx$/, '');

    // What API endpoints does it call?
    const apiCalls = [];

    // useApi calls
    const useApiMatches = content.matchAll(/useApi[<\s]*[^>]*>\s*\(\s*['"`]([^'"`]+)['"`]/g);
    for (const match of useApiMatches) apiCalls.push(match[1]);

    // fetch calls
    const fetchMatches = content.matchAll(/fetch\s*\(\s*[`'"]([^`'"]*api[^`'"]*)[`'"]/g);
    for (const match of fetchMatches) apiCalls.push(match[1].replace(/\$\{[^}]+\}/g, '*'));

    // Detect data source type
    let dataSource = 'UNKNOWN';
    if (content.includes('useApi')) dataSource = 'useApi';
    else if (content.includes('fetch(')) dataSource = 'FETCH';
    else if (content.includes('ComingSoonPage')) dataSource = 'COMING_SOON';
    else if (content.includes('useState') && !content.includes('fetch')) dataSource = 'STATIC';

    // Has mock data?
    const hasMockData = /const\s+\w+\s*[:=]\s*\[?\s*\{/.test(content) &&
        !content.includes('useApi') && !content.includes('fetch(');

    // Has loading state?
    const hasLoadingState = content.includes('isLoading') || content.includes('loading') || content.includes('Loader');

    // Has error handling?
    const hasErrorState = content.includes('error') && (content.includes('Alert') || content.includes('error &&'));

    return {
        path: '/admin/' + relPath.replace(/\\/g, '/'),
        relPath,
        dataSource,
        apiCalls: [...new Set(apiCalls)],
        hasMockData,
        hasLoadingState,
        hasErrorState,
        lines: content.split('\n').length,
    };
});

// ============================================================================
// 4. CROSS-REFERENCE ANALYSIS
// ============================================================================

// Tables with no API routes
const tablesWithApi = new Set(apiRoutes.flatMap(r => r.tables));
const orphanedTables = tables.filter(t => !tablesWithApi.has(t.varName));

// API routes with issues
const routesWithIssues = apiRoutes.filter(r => r.issues.length > 0);

// Admin pages calling non-existent APIs
const allApiPaths = new Set(apiRoutes.map(r => r.path));
const pagesWithBrokenApis = adminPages.filter(p => {
    return p.apiCalls.some(call => {
        const normalized = call.split('?')[0].replace(/\/\*\//g, '/[id]/');
        // Check if any known API route matches
        return !allApiPaths.has(normalized) &&
            !apiRoutes.some(r => {
                const pattern = r.path.replace(/\[[\w]+\]/g, '[^/]+');
                return new RegExp(`^${pattern}$`).test(normalized);
            });
    });
});

// ============================================================================
// 5. GENERATE REPORT
// ============================================================================

const report = {
    summary: {
        totalSchemaTables: tables.length,
        totalApiRoutes: apiRoutes.length,
        totalAdminPages: adminPages.length,
        tablesWithApiCoverage: tables.length - orphanedTables.length,
        tablesOrphaned: orphanedTables.length,
        apiRoutesWithIssues: routesWithIssues.length,
        pagesUsingApi: adminPages.filter(p => p.dataSource === 'useApi').length,
        pagesUsingFetch: adminPages.filter(p => p.dataSource === 'FETCH').length,
        pagesStatic: adminPages.filter(p => p.dataSource === 'STATIC').length,
        pagesComingSoon: adminPages.filter(p => p.dataSource === 'COMING_SOON').length,
        pagesUnknown: adminPages.filter(p => p.dataSource === 'UNKNOWN').length,
    },
    orphanedTables: orphanedTables.map(t => ({ variable: t.varName, table: t.sqlName })),
    apiIssues: routesWithIssues.map(r => ({
        route: r.path,
        methods: r.methods.join(','),
        issues: r.issues,
    })),
    adminPages: adminPages.map(p => ({
        path: p.path,
        source: p.dataSource,
        apis: p.apiCalls,
        loading: p.hasLoadingState,
        errors: p.hasErrorState,
    })),
    apiRoutes: apiRoutes.map(r => ({
        path: r.path,
        methods: r.methods.join(','),
        tables: r.tables,
        auth: r.hasAuth,
        issues: r.issues,
    })),
};

fs.writeFileSync('audit-report.json', JSON.stringify(report, null, 2));

// Print summary
console.log('=== COMPREHENSIVE AUDIT RESULTS ===\n');
console.log(`📊 Schema Tables:    ${report.summary.totalSchemaTables}`);
console.log(`🔌 API Routes:       ${report.summary.totalApiRoutes}`);
console.log(`📄 Admin Pages:      ${report.summary.totalAdminPages}`);
console.log('');
console.log(`✅ Tables w/ API:    ${report.summary.tablesWithApiCoverage} (${Math.round(report.summary.tablesWithApiCoverage / report.summary.totalSchemaTables * 100)}%)`);
console.log(`❌ Orphaned Tables:  ${report.summary.tablesOrphaned}`);
console.log(`⚠️  Routes w/ Issues: ${report.summary.apiRoutesWithIssues}`);
console.log('');
console.log('Admin Page Data Sources:');
console.log(`  useApi:      ${report.summary.pagesUsingApi}`);
console.log(`  fetch():     ${report.summary.pagesUsingFetch}`);
console.log(`  Static:      ${report.summary.pagesStatic}`);
console.log(`  ComingSoon:  ${report.summary.pagesComingSoon}`);
console.log(`  Unknown:     ${report.summary.pagesUnknown}`);

console.log('\n--- ORPHANED TABLES (no API coverage) ---');
orphanedTables.forEach(t => console.log(`  ${t.varName} → ${t.sqlName}`));

console.log('\n--- API ROUTES WITH ISSUES ---');
routesWithIssues.forEach(r => console.log(`  ${r.path} [${r.methods.join(',')}] → ${r.issues.join(', ')}`));

console.log('\n--- PAGES WITH POSSIBLE BROKEN API CALLS ---');
pagesWithBrokenApis.forEach(p => {
    console.log(`  ${p.path}`);
    p.apiCalls.forEach(api => console.log(`    → ${api}`));
});

console.log('\nFull report: audit-report.json');
