/**
 * Legacy Code Discovery: Find scattered implementations for orphaned tables
 * 
 * Scans the entire src/ directory (excluding node_modules and schema.ts itself)
 * for references to the 176 orphaned table variable names.
 * 
 * Produces a mapping of: orphaned table → [files that reference it]
 */
import fs from 'fs';
import path from 'path';

// The 176 orphaned table variable names from the audit
const orphanedTables = [
    'organizationBranding', 'organizationDomains', 'landingPages',
    'studentRoles', 'parentRoles', 'teacherRoles', 'staffRoles', 'leadRoles', 'ownerRoles',
    'staffSalaryHistory', 'staffSentimentHistory', 'staffInsightCommunications', 'staffTrainingRecords',
    'timeClockEntries', 'timeSheets', 'orgChartPositions', 'positionAssignments',
    'talentPoolCandidates', 'laborProvisionSettings', 'laborProvisionBalances', 'terminationPlans',
    'workScheduleTemplates', 'employeeBenefits', 'scheduleExceptions',
    'personLattice', 'personBankAccounts',
    'aiProviders', 'promptDeltas', 'challengeAttempts', 'badges', 'userBadges',
    'teacherProfiles', 'coursePricing', 'schoolServices',
    'paymentGateways', 'splitRecipients', 'splitRules', 'splitRuleItems',
    'receivablePayments', 'moneyFlows', 'commissionPayouts', 'financialGoals',
    'organizationFinancialSettings', 'organizationLocations',
    'campaignLeads', 'marketingIntegrations', 'contentTypes', 'contentAssets',
    'marketingEvents', 'eventRegistrations', 'marketingPartners', 'contentCalendar',
    'abTestAssignments', 'landingPageDailyMetrics', 'campaignDailyMetrics', 'marketingTargets',
    'salesTeams', 'salesTeamMembers', 'salesCalendar', 'salesActions',
    'brandActivations', 'coupons', 'couponRedemptions', 'sweepstakesEntries',
    'salesPipeline', 'pipelineStageHistory', 'salesTouches', 'salesTeamDailyMetrics',
    'cashiers', 'cashierSessions', 'cashTransactions',
    'receptionVisits', 'intakeInterviews', 'checkoutRecords',
    'contractClauses', 'paymentReminders', 'lateFeeNegotiations', 'makeupClasses',
    'staffAuthorityLevels', 'teachingMethodologies', 'classStructures',
    'homeworkPolicies', 'gradingScales', 'assessmentTypes', 'scoringCriteria',
    'rubrics', 'rubricCriteria', 'rubricPerformanceLevels', 'proficiencyLevels',
    'schoolPrograms', 'programUnits', 'programAssessmentWeights', 'programPassRequirements',
    'classGroups', 'teacherAssignments', 'programClassSchedules', 'programClassSessions',
    'studentAssessments', 'studentGrades', 'gradebookEntries', 'teacherWorkload',
    'homeworkAssignments', 'homeworkSubmissions', 'studentProgressions',
    'pedagogicalNotes', 'pedagogicalNoteReplies', 'pedagogicalNoteAcknowledgements',
    'progressReports', 'parentCommunications', 'teacherAvailability',
    'lessonPlans', 'curriculumMaterials', 'classroomIncidents', 'teacherEvaluations',
    'academicActivities', 'activityRegistrations', 'studentCertificates',
    'substituteTeacherLogs', 'studentLearningProfiles', 'varkAssessmentResponses',
    'generatedStudentMaterials', 'materialSubmissions', 'materialTemplates',
    'memoryContradictions', 'studentWorldOverlay', 'memoryIntegrityHashes',
    'alertAcknowledgments', 'wellbeingSnapshots',
    'privacyConsents', 'dataExportRequests', 'dataDeletionRequests', 'dataAccessAuditLog',
    'bankAccounts', 'fiscalTaxWithholdings', 'fiscalTransactions', 'fiscalTransactionDocuments',
    'accountantApiKeys', 'accountantApiLogs', 'accountantDeliveryConfig', 'accountantDeliveryHistory',
    'latticeSkillDefinitions', 'latticeEvidence', 'latticeShares', 'latticeSkillAssessments',
    'actionItemComments', 'userCalendarSettings', 'meetingTemplates',
    'procedureAnalytics', 'pipelineEvents', 'stakeholderLifecycles',
    'messageReadReceipts', 'communicationTemplates', 'typingIndicators',
    'wikiArticleStubs', 'wikiEvidencePoints', 'knowledgeGenBatches', 'knowledgeGenRuns',
    'wikiEditSessions', 'wikiQualityMetrics',
    'procedureBranches', 'branchChanges', 'branchStakeholders',
    'trialExecutions', 'trialMetricsComparison', 'trialVibeSummary',
    'procedureVersions', 'journeyInstances', 'journeyEvents',
    'dropoffInferences', 'cohortAnalytics', 'cacLtvSnapshots',
    'genesisNodes', 'genesisEdges', 'genesisCubePositions', 'genesisLedger', 'genesisEmbeddings',
];

function walk(dir, exts) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walk(full, exts));
        else if (exts.some(ext => entry.name.endsWith(ext))) results.push(full);
    }
    return results;
}

// Scan ALL .ts, .tsx files in src/ (excluding schema.ts itself and migration files)
const allFiles = walk('src', ['.ts', '.tsx']).filter(f =>
    !f.includes('schema.ts') &&
    !f.includes('migrations') &&
    !f.includes('.d.ts')
);

console.log(`Scanning ${allFiles.length} files for references to ${orphanedTables.length} orphaned tables...\n`);

const tableRefs = new Map(); // tableName -> [{file, line, context}]
const fileRefs = new Map();  // filePath -> [tableName, ...]

for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relPath = filePath.replace(/\\/g, '/');

    for (const tableName of orphanedTables) {
        // Look for the table variable name used as a code identifier (not just substring)
        // Must be preceded by word boundary or import
        const regex = new RegExp(`\\b${tableName}\\b`, 'g');

        for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
                if (!tableRefs.has(tableName)) tableRefs.set(tableName, []);
                tableRefs.get(tableName).push({
                    file: relPath,
                    line: i + 1,
                    context: lines[i].trim().substring(0, 120),
                });

                if (!fileRefs.has(relPath)) fileRefs.set(relPath, new Set());
                fileRefs.get(relPath).add(tableName);
            }
            regex.lastIndex = 0;
        }
    }
}

// ============================================================================
// OUTPUT RESULTS
// ============================================================================

// Sort tables by number of references (most referenced first)
const sortedTables = [...tableRefs.entries()].sort((a, b) => b[1].length - a[1].length);

// Sort files by number of tables referenced (most tables first)
const sortedFiles = [...fileRefs.entries()].sort((a, b) => b[1].size - a[1].size);

const report = {
    summary: {
        totalOrphaned: orphanedTables.length,
        tablesWithRefs: tableRefs.size,
        tablesWithNoRefs: orphanedTables.length - tableRefs.size,
        filesWithRefs: fileRefs.size,
    },
    // Tables that have existing code referencing them
    tablesWithCode: sortedTables.map(([name, refs]) => ({
        table: name,
        refCount: refs.length,
        files: [...new Set(refs.map(r => r.file))],
        // Classify: is it in route.ts, page.tsx, component, or lib?
        locations: {
            api: refs.filter(r => r.file.includes('/api/')).length,
            page: refs.filter(r => r.file.includes('page.tsx')).length,
            component: refs.filter(r => r.file.includes('/components/') || r.file.includes('Component')).length,
            lib: refs.filter(r => r.file.includes('/lib/')).length,
            other: refs.filter(r => !r.file.includes('/api/') && !r.file.includes('page.tsx') && !r.file.includes('/components/') && !r.file.includes('/lib/')).length,
        },
    })),
    // Tables with zero references anywhere
    trulyOrphaned: orphanedTables.filter(t => !tableRefs.has(t)),
    // Files that reference the most orphaned tables (legacy hotspots)
    legacyHotspots: sortedFiles.slice(0, 50).map(([file, tables]) => ({
        file,
        tableCount: tables.size,
        tables: [...tables],
    })),
};

fs.writeFileSync('legacy-discovery.json', JSON.stringify(report, null, 2));

// Print summary
console.log('=== LEGACY CODE DISCOVERY ===\n');
console.log(`Orphaned tables: ${report.summary.totalOrphaned}`);
console.log(`Tables with existing code: ${report.summary.tablesWithRefs} (${Math.round(report.summary.tablesWithRefs / report.summary.totalOrphaned * 100)}%)`);
console.log(`Truly orphaned (zero refs): ${report.summary.tablesWithNoRefs}`);
console.log(`Files with legacy code: ${report.summary.filesWithRefs}`);

console.log('\n--- TOP LEGACY HOTSPOT FILES (most table references) ---');
report.legacyHotspots.slice(0, 20).forEach(h => {
    console.log(`  [${h.tableCount} tables] ${h.file}`);
});

console.log('\n--- TABLES WITH MOST REFERENCES ---');
report.tablesWithCode.slice(0, 30).forEach(t => {
    const loc = [];
    if (t.locations.api > 0) loc.push(`${t.locations.api} api`);
    if (t.locations.page > 0) loc.push(`${t.locations.page} page`);
    if (t.locations.component > 0) loc.push(`${t.locations.component} comp`);
    if (t.locations.lib > 0) loc.push(`${t.locations.lib} lib`);
    if (t.locations.other > 0) loc.push(`${t.locations.other} other`);
    console.log(`  [${t.refCount} refs] ${t.table} (${loc.join(', ')})`);
});

console.log('\n--- TRULY ORPHANED (zero references anywhere) ---');
report.trulyOrphaned.forEach(t => console.log(`  ❌ ${t}`));

console.log('\nFull report: legacy-discovery.json');
