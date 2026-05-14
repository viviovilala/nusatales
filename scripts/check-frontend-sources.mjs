import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "resources", "js");
const forbiddenPatterns = [
    {
        pattern: /role\s*===\s*["']kreator["']/,
        message: "Frontend role checks must use `creator`, not legacy `kreator`.",
    },
    {
        pattern: /allowedRoles=\{\[[^\]]*["']kreator["']/,
        message: "Protected routes must use `creator`, not legacy `kreator`.",
    },
    {
        pattern: /href=["']\/api\/test["']/,
        message: "Navigation must not point users to the legacy API test endpoint.",
    },
];

const files = [];

function collectFiles(directory) {
    for (const entry of readdirSync(directory)) {
        const path = join(directory, entry);
        const stat = statSync(path);

        if (stat.isDirectory()) {
            collectFiles(path);
            continue;
        }

        if (/\.(js|jsx)$/.test(entry)) {
            files.push(path);
        }
    }
}

collectFiles(root);

const failures = [];

for (const file of files) {
    const content = readFileSync(file, "utf8");

    for (const rule of forbiddenPatterns) {
        if (rule.pattern.test(content)) {
            failures.push(`${file}: ${rule.message}`);
        }
    }
}

if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
}

console.log(`Frontend source checks passed (${files.length} files).`);
