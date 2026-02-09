/**
 * Fix implicit any[] type errors by adding `: any[]` annotations to all 
 * `const MOCK_ = [];` declarations that don't already have a type annotation.
 * 
 * Run with: node scripts/fix-mock-types.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(__dirname, '..', 'src', 'app', '(dashboard)');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return false;

    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Fix: const MOCK_XXX = []; → const MOCK_XXX: any[] = [];
    content = content.replace(
        /^(const MOCK_\w+)\s*=\s*\[\];/gm,
        '$1: any[] = [];'
    );

    // Also fix: const MOCK_XXX: SomeType[] = []; where SomeType is already there — these are fine
    // But fix duplicate `: any[]: any[]` if script runs twice
    content = content.replace(/: any\[\]: any\[\]/g, ': any[]');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    }
    return false;
}

// Walk all pages recursively
function walkDir(dir) {
    let fixed = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            fixed += walkDir(fullPath);
        } else if (entry.name.endsWith('.tsx')) {
            if (fixFile(fullPath)) {
                console.log(`Fixed: ${path.relative(BASE, fullPath)}`);
                fixed++;
            }
        }
    }
    return fixed;
}

const count = walkDir(BASE);
console.log(`\nFixed ${count} files`);
