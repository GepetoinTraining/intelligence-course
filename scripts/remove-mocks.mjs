/**
 * Mock Data Removal Script
 * 
 * This script removes mock data from all page files in the dashboard.
 * It replaces MOCK_ constant initializations with empty arrays/objects
 * while preserving the variable declarations and types.
 * 
 * Run with: node scripts/remove-mocks.mjs
 */

import fs from 'fs';
import path from 'path';

const BASE = path.resolve('src/app/(dashboard)');

// All files with MOCK_ data, relative to BASE
const FILES_WITH_MOCKS = [
    // Student
    'student/workshop/page.tsx',
    'student/todo/page.tsx',
    'student/techniques/page.tsx',
    'student/review/page.tsx',
    'student/constellation/page.tsx',
    'student/capstone/page.tsx',
    'student/challenges/page.tsx',
    // Teacher
    'teacher/classes/[classId]/page.tsx',
    'teacher/student/[id]/page.tsx',
    'teacher/grades/page.tsx',
    'teacher/attendance/page.tsx',
    // Staff
    'staff/scrm/page.tsx',
    'staff/scrm/[id]/page.tsx',
    'staff/sales-manager/page.tsx',
    'staff/payments/page.tsx',
    'staff/marketing/utm-builder/page.tsx',
    'staff/marketing/page.tsx',
    'staff/marketing/landing-builder/page.tsx',
    'staff/marketing/copy-generator/page.tsx',
    'staff/marketing/calendar/page.tsx',
    // School
    'school/page.tsx',
    'school/enrollments/page.tsx',
    'school/products/page.tsx',
    'school/discounts/page.tsx',
    'school/terms/page.tsx',
    'school/schedules/page.tsx',
    'school/classes/page.tsx',
    'school/rooms/page.tsx',
    'school/modules/page.tsx',
    'school/lessons/page.tsx',
    'school/courses/page.tsx',
    'school/courses/[courseId]/page.tsx',
    // Owner
    'owner/page.tsx',
    'owner/employees/page.tsx',
    'owner/reports/page.tsx',
    'owner/unit-economics/page.tsx',
    'owner/payables/page.tsx',
    'owner/crm/page.tsx',
    // Parent
    'parent/page.tsx',
    'parent/billing/page.tsx',
    // Marketing
    'marketing/templates/page.tsx',
    'marketing/referrals/page.tsx',
    'marketing/campaigns/page.tsx',
    // Other
    'inbox/page.tsx',
    'inbox/[threadId]/page.tsx',
    'journal/page.tsx',
    'financial/page.tsx',
    'graveyard/page.tsx',
    'prompts/page.tsx',
];

let totalFiles = 0;
let totalMocks = 0;
let skippedFiles = [];

for (const relPath of FILES_WITH_MOCKS) {
    const filePath = path.join(BASE, relPath);

    if (!fs.existsSync(filePath)) {
        skippedFiles.push(relPath);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Strategy: Find each `const MOCK_XXX: Type = [...]` or `{...}` and replace the 
    // initializer with `[]` or `{}`
    // 
    // We need to handle:
    // 1. const MOCK_X: Type[] = [ ... ];  → const MOCK_X: Type[] = [];
    // 2. const MOCK_X: Type = { ... };    → const MOCK_X: Type = {} as Type;
    // 3. const MOCK_X = [ ... ];          → const MOCK_X = [];
    // 4. const MOCK_X = { ... };          → const MOCK_X = {} as any;
    // 5. const MOCK_X: Record<...> = { ... }; → empty

    // Match MOCK_ declarations and find their initializer boundaries
    const mockPattern = /^(const MOCK_\w+(?:\s*:\s*[^=]+)?)\s*=\s*/gm;
    let match;
    const replacements = [];

    while ((match = mockPattern.exec(content)) !== null) {
        const declEnd = match.index + match[0].length;
        const startChar = content[declEnd];

        if (startChar === '[') {
            // Find matching ]
            let depth = 0;
            let i = declEnd;
            let inString = false;
            let stringChar = '';

            for (; i < content.length; i++) {
                const c = content[i];

                if (inString) {
                    if (c === '\\') { i++; continue; }
                    if (c === stringChar) inString = false;
                    continue;
                }

                if (c === "'" || c === '"' || c === '`') {
                    inString = true;
                    stringChar = c;
                    continue;
                }

                if (c === '[') depth++;
                if (c === ']') {
                    depth--;
                    if (depth === 0) {
                        // Found the end — replace [content] with []
                        replacements.push({
                            start: declEnd,
                            end: i + 1, // includes ]
                            replacement: '[]',
                        });
                        totalMocks++;
                        break;
                    }
                }
            }
        } else if (startChar === '{') {
            // Find matching }
            let depth = 0;
            let i = declEnd;
            let inString = false;
            let stringChar = '';

            for (; i < content.length; i++) {
                const c = content[i];

                if (inString) {
                    if (c === '\\') { i++; continue; }
                    if (c === stringChar) inString = false;
                    continue;
                }

                if (c === "'" || c === '"' || c === '`') {
                    inString = true;
                    stringChar = c;
                    continue;
                }

                // Skip template literals with expressions
                if (c === '{') depth++;
                if (c === '}') {
                    depth--;
                    if (depth === 0) {
                        // Extract the type annotation to create proper empty object
                        const declPart = match[1];
                        const typeMatch = declPart.match(/:\s*(.+)$/);
                        let emptyObj;

                        if (typeMatch) {
                            const typeName = typeMatch[1].trim();
                            // For Record types or complex types, use 'as any'
                            if (typeName.startsWith('Record<') || typeName.includes('{')) {
                                emptyObj = '{} as any';
                            } else {
                                emptyObj = `{} as ${typeName}`;
                            }
                        } else {
                            emptyObj = '{} as any';
                        }

                        replacements.push({
                            start: declEnd,
                            end: i + 1,
                            replacement: emptyObj,
                        });
                        totalMocks++;
                        break;
                    }
                }
            }
        }
    }

    // Apply replacements in reverse order (so positions stay valid)
    if (replacements.length > 0) {
        for (const r of replacements.reverse()) {
            content = content.slice(0, r.start) + r.replacement + content.slice(r.end);
        }

        fs.writeFileSync(filePath, content, 'utf-8');
        totalFiles++;
        console.log(`✅ ${relPath} — ${replacements.length} mock(s) emptied`);
    }
}

console.log(`\n📊 Summary:`);
console.log(`   Files modified: ${totalFiles}`);
console.log(`   Mock arrays/objects emptied: ${totalMocks}`);
if (skippedFiles.length > 0) {
    console.log(`   Skipped (not found): ${skippedFiles.join(', ')}`);
}
