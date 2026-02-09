/**
 * Replace all `any` and `any[]` mock data annotations with proper shared types.
 *
 * This script:
 * 1. Reads each target file
 * 2. Adds the import for shared types from '@/types/domain'
 * 3. Replaces `any[]` with the correct typed array
 * 4. Replaces `{} as any as any` and `{} as any` objects with properly typed defaults
 * 5. Removes @ts-nocheck directives where no longer needed
 *
 * Run with: node scripts/enforce-types.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..', 'src', 'app');

// ============================================================================
// REPLACEMENT RULES
// Each rule maps a file (relative to src/app) to its type replacements
// ============================================================================

const RULES = [
    // ── owner/page.tsx ──────────────────────────────────────────────
    {
        file: '(dashboard)/owner/page.tsx',
        imports: ['FinancialSummary', 'MonthlyFinancial', 'CashFlowProjection'],
        replacements: [
            {
                from: /const MOCK_FINANCIALS = \{[\s\S]*?\} as any;/,
                to: `const MOCK_FINANCIALS: FinancialSummary = {
    revenue: { current: 0, previous: 0 },
    expenses: { current: 0, previous: 0 },
    profit: { current: 0, previous: 0 },
    students: { current: 0, previous: 0 },
    pendingPayments: 0,
    payrollDue: 0,
};`,
            },
            {
                from: /const MOCK_MONTHLY_2026: any\[\] = \[\];/,
                to: 'const MOCK_MONTHLY_2026: MonthlyFinancial[] = [];',
            },
            {
                from: /const MOCK_MONTHLY_2025: any\[\] = \[\];/,
                to: 'const MOCK_MONTHLY_2025: MonthlyFinancial[] = [];',
            },
            {
                from: /const MOCK_CASH_FLOW = \{[\s\S]*?\} as any;/,
                to: `const MOCK_CASH_FLOW: CashFlowProjection = {
    currentBalance: 0,
    projectedInflows: [],
    projectedOutflows: [],
};`,
            },
        ],
    },

    // ── owner/reports/page.tsx ───────────────────────────────────────
    {
        file: '(dashboard)/owner/reports/page.tsx',
        imports: ['RevenueByCourse', 'PaymentMethodSummary', 'Defaulter', 'TeacherRef', 'CostBreakdown', 'BalanceteItem', 'DREItem', 'BalancoPatrimonial'],
        removeNoCheck: true,
        replacements: [
            {
                from: /const MOCK_REVENUE_BY_COURSE: any\[\] = \[\];/,
                to: 'const MOCK_REVENUE_BY_COURSE: RevenueByCourse[] = [];',
            },
            {
                from: /const MOCK_PAYMENT_METHODS: any\[\] = \[\];/,
                to: 'const MOCK_PAYMENT_METHODS: PaymentMethodSummary[] = [];',
            },
            {
                from: /const MOCK_DEFAULTERS: any\[\] = \[\];/,
                to: 'const MOCK_DEFAULTERS: Defaulter[] = [];',
            },
            {
                from: /const MOCK_TEACHERS: any\[\] = \[\];/,
                to: 'const MOCK_TEACHERS: TeacherRef[] = [];',
            },
            {
                from: /const MOCK_COST_BREAKDOWN = \{[\s\S]*?\} as any;/,
                to: `const MOCK_COST_BREAKDOWN: CostBreakdown = {
    salaries: 0, bonuses: 0, benefits: 0, training: 0, total: 1, asPercentOfRevenue: 0,
};`,
            },
            {
                from: /const MOCK_BALANCETE: any\[\] = \[\];/,
                to: 'const MOCK_BALANCETE: BalanceteItem[] = [];',
            },
            {
                from: /const MOCK_DRE: any\[\] = \[\];/,
                to: 'const MOCK_DRE: DREItem[] = [];',
            },
            {
                from: /const MOCK_BALANCO = \{[\s\S]*?\} as any;/,
                to: `const MOCK_BALANCO: BalancoPatrimonial = {
    ativo: { circulante: [], naoCirculante: [] },
    passivo: { circulante: [], naoCirculante: [] },
    patrimonioLiquido: [],
};`,
            },
        ],
    },

    // ── school/page.tsx ─────────────────────────────────────────────
    {
        file: '(dashboard)/school/page.tsx',
        imports: ['SchoolCashflow', 'Payment', 'CourseSummary'],
        replacements: [
            {
                from: /const MOCK_CASHFLOW = \{[\s\S]*?\} as any;/,
                to: `const MOCK_CASHFLOW: SchoolCashflow = {
    students: { total: 0, active: 0, defaulting: 0 },
    revenue: { current: 0, previous: 0 },
};`,
            },
            {
                from: /const MOCK_PAYMENTS: any\[\] = \[\];/,
                to: 'const MOCK_PAYMENTS: Payment[] = [];',
            },
            {
                from: /const MOCK_COURSES: any\[\] = \[\];/,
                to: 'const MOCK_COURSES: CourseSummary[] = [];',
            },
        ],
    },

    // ── school/classes/page.tsx ──────────────────────────────────────
    {
        file: '(dashboard)/school/classes/page.tsx',
        imports: ['SelectOption', 'LevelRef', 'TeacherRef', 'RoomRef'],
        replacements: [
            {
                from: /const MOCK_COURSE_TYPES: any\[\] = \[\];/,
                to: 'const MOCK_COURSE_TYPES: SelectOption[] = [];',
            },
            {
                from: /const MOCK_LEVELS: any\[\] = \[\];/,
                to: 'const MOCK_LEVELS: LevelRef[] = [];',
            },
            {
                from: /const MOCK_TEACHERS: any\[\] = \[\];/,
                to: 'const MOCK_TEACHERS: TeacherRef[] = [];',
            },
            {
                from: /const MOCK_ROOMS: any\[\] = \[\];/,
                to: 'const MOCK_ROOMS: RoomRef[] = [];',
            },
        ],
    },

    // ── school/courses/[courseId]/page.tsx ────────────────────────────
    {
        file: '(dashboard)/school/courses/[courseId]/page.tsx',
        imports: ['TeacherRef', 'ServiceRef'],
        replacements: [
            {
                from: /const MOCK_TEACHERS: any\[\] = \[\];/,
                to: 'const MOCK_TEACHERS: TeacherRef[] = [];',
            },
            {
                from: /const MOCK_SERVICES: any\[\] = \[\];/,
                to: 'const MOCK_SERVICES: ServiceRef[] = [];',
            },
        ],
    },

    // ── school/enrollments/page.tsx ──────────────────────────────────
    {
        file: '(dashboard)/school/enrollments/page.tsx',
        imports: ['ClassRef'],
        replacements: [
            {
                from: /const MOCK_CLASSES: any\[\] = \[\];/,
                to: 'const MOCK_CLASSES: ClassRef[] = [];',
            },
        ],
    },

    // ── school/lessons/page.tsx ──────────────────────────────────────
    {
        file: '(dashboard)/school/lessons/page.tsx',
        imports: ['ModuleRef'],
        replacements: [
            {
                from: /const MOCK_MODULES: any\[\] = \[\];/,
                to: 'const MOCK_MODULES: ModuleRef[] = [];',
            },
        ],
    },

    // ── teacher/grades/page.tsx ──────────────────────────────────────
    {
        file: '(dashboard)/teacher/grades/page.tsx',
        imports: ['ClassRef', 'ModuleRef'],
        replacements: [
            {
                from: /const MOCK_CLASSES: any\[\] = \[\];/,
                to: 'const MOCK_CLASSES: ClassRef[] = [];',
            },
            {
                from: /const MOCK_MODULES: any\[\] = \[\];/,
                to: 'const MOCK_MODULES: ModuleRef[] = [];',
            },
            {
                from: /const MOCK_SUBMISSIONS: Record<string, CapstoneSubmission\[\]> = \{\} as any as any;/,
                to: 'const MOCK_SUBMISSIONS: Record<string, CapstoneSubmission[]> = {};',
            },
        ],
    },

    // ── student/todo/page.tsx ────────────────────────────────────────
    {
        file: '(dashboard)/student/todo/page.tsx',
        imports: ['StudentProgress'],
        replacements: [
            {
                from: /const MOCK_STUDENT_PROGRESS = \{\} as any as any;/,
                to: `const MOCK_STUDENT_PROGRESS: StudentProgress = {
    level: 0,
    currentXP: 0,
    nextLevelXP: 100,
    completedModules: 0,
    totalModules: 0,
    streak: 0,
};`,
            },
        ],
    },

    // ── staff/scrm/[id]/page.tsx ─────────────────────────────────────
    {
        file: '(dashboard)/staff/scrm/[id]/page.tsx',
        imports: ['SCRMProfile'],
        replacements: [
            {
                from: /const MOCK_PROFILES: Record<string, SCRMProfile> = \{\} as any as any;/,
                to: 'const MOCK_PROFILES: Record<string, SCRMProfile> = {};',
            },
        ],
    },

    // ── inbox/[threadId]/page.tsx ────────────────────────────────────
    {
        file: '(dashboard)/inbox/[threadId]/page.tsx',
        imports: ['Thread'],
        replacements: [
            {
                from: /const MOCK_THREADS: Record<string, Thread> = \{\} as any as any;/,
                to: 'const MOCK_THREADS: Record<string, Thread> = {};',
            },
        ],
    },
];

// ============================================================================
// EXECUTION
// ============================================================================

let totalFixed = 0;

for (const rule of RULES) {
    const filePath = path.resolve(SRC, rule.file);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠ File not found: ${rule.file}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    let changeCount = 0;

    // 1. Apply replacements
    for (const { from, to } of rule.replacements) {
        const before = content;
        content = content.replace(from, to);
        if (content !== before) changeCount++;
    }

    // 2. Add import (if not already present and if we made changes)
    if (changeCount > 0 && rule.imports && rule.imports.length > 0) {
        const importLine = `import type { ${rule.imports.join(', ')} } from '@/types/domain';`;

        // Check if import already exists
        if (!content.includes("from '@/types/domain'")) {
            // Insert after the last import line
            const lines = content.split('\n');
            let lastImportIdx = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(/^import\s/) || lines[i].match(/^} from/)) {
                    lastImportIdx = i;
                }
            }
            if (lastImportIdx >= 0) {
                lines.splice(lastImportIdx + 1, 0, importLine);
                content = lines.join('\n');
            }
        }
    }

    // 3. Remove @ts-nocheck if requested
    if (rule.removeNoCheck) {
        content = content.replace(/\/\/ @ts-nocheck[^\n]*\n/, '');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ ${rule.file} — ${changeCount} replacement(s)`);
        totalFixed++;
    } else {
        console.log(`⊘ ${rule.file} — no changes needed`);
    }
}

console.log(`\n🏁 Done: ${totalFixed} files updated`);
