/**
 * Fix double commas in import statements caused by safe-wire-apis.mjs
 * Pattern: `,\n,` or `,,` → `,`
 */
import fs from 'fs';
import path from 'path';

const ADMIN = path.resolve('src/app/admin');

function walk(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walk(full));
        else if (entry.name === 'page.tsx') results.push(full);
    }
    return results;
}

let fixed = 0;

for (const fullPath of walk(ADMIN)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    let original = content;

    // Fix double commas: `,,` → `,`
    content = content.replace(/,,/g, ',');

    // Fix trailing comma before `}` in imports: `,\n}` is fine in TS, no issue

    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        const relPath = fullPath.replace(/.*admin./, '');
        console.log(`✅ Fixed: ${relPath}`);
        fixed++;
    }
}

console.log(`\n=== Fixed ${fixed} files ===`);
