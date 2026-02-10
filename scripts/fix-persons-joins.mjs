/**
 * Fix ALL missing persons JOINs in API routes (v2)
 * 
 * For any query chain that:
 * 1. references persons.xxx (firstName, avatarUrl, etc)
 * 2. has a .xxxJoin(users, ...) or .from(users)
 * 3. does NOT have .xxxJoin(persons, ...)
 * 
 * We add: .leftJoin(persons, eq(users.personId, persons.id))
 * right after the users join/from.
 */
import fs from 'fs';
import path from 'path';

const API_DIR = path.resolve('src/app/api');

function walk(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walk(full));
        else if (entry.name === 'route.ts') results.push(full);
    }
    return results;
}

let fixed = 0;
let alreadyOk = 0;
const manualReview = [];

for (const fullPath of walk(API_DIR)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    const relPath = fullPath.replace(/.*api[\\\/]/, '');

    // Only process files that reference persons columns
    if (!content.match(/persons\.\w+/)) continue;

    // If already has persons join, skip
    if (/Join\(\s*persons\s*,/i.test(content)) {
        alreadyOk++;
        continue;
    }

    let modified = false;

    // Strategy: Find all .from() or .Join(users, ...) calls
    // and add .leftJoin(persons, eq(users.personId, persons.id)) after them

    // Pattern 1: .leftJoin(users, eq(xxx, users.id)) or .innerJoin(users, eq(xxx, users.id))
    const joinUsersPattern = /(\.(leftJoin|innerJoin)\(users,\s*eq\([^)]+\)\))/g;

    if (joinUsersPattern.test(content)) {
        // Reset regex
        joinUsersPattern.lastIndex = 0;

        // Add persons join after FIRST users join only (to avoid duplicates)
        let firstFound = false;
        content = content.replace(joinUsersPattern, (match) => {
            if (!firstFound) {
                firstFound = true;
                return match + '\n            .leftJoin(persons, eq(users.personId, persons.id))';
            }
            return match;
        });
        modified = true;
    }

    // Pattern 2: .from(users) without any join
    if (!modified && /\.from\(users\)/.test(content)) {
        content = content.replace(
            /\.from\(users\)/,
            '.from(users)\n            .leftJoin(persons, eq(users.personId, persons.id))'
        );
        modified = true;
    }

    // Pattern 3: Some queries join via other tables - check for complex patterns
    // e.g., .leftJoin(users, eq(someTable.userId, users.id))
    if (!modified) {
        const complexJoinPattern = /(\.(leftJoin|innerJoin)\(users,\s*eq\([^)]*\)\))/;
        if (complexJoinPattern.test(content)) {
            content = content.replace(
                complexJoinPattern,
                '$1\n            .leftJoin(persons, eq(users.personId, persons.id))'
            );
            modified = true;
        }
    }

    if (modified) {
        // Ensure persons import exists
        if (!content.includes('persons') || !content.match(/import.*persons.*from/s)) {
            // persons is referenced as a column, so it should already be imported
            // Add it to the schema import if missing from the import block
            if (content.includes("from '@/lib/db/schema'") && !content.match(/import\s*{[^}]*persons[^}]*}\s*from\s*'@\/lib\/db\/schema'/s)) {
                content = content.replace(
                    /(import\s*{[^}]*)(}\s*from\s*'@\/lib\/db\/schema')/s,
                    '$1, persons$2'
                );
            }
        }

        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✅ Fixed: ${relPath}`);
        fixed++;
    } else {
        manualReview.push(relPath);
    }
}

console.log(`\n=== Fixed ${fixed} files, ${alreadyOk} already OK ===`);
if (manualReview.length > 0) {
    console.log('\n⚠️ Manual review needed:');
    manualReview.forEach(r => console.log(`   ${r}`));
}
