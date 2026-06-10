import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const TARGET_DIRS = [
  path.join(root, "src/app/(app)"),
  path.join(root, "src/components"),
];

const SKIP_FILES = new Set([
  path.join(root, "src/components/landing/theme-toggle.tsx"),
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) files.push(full);
  }
  return files;
}

const REPLACEMENTS = [
  // Cards & panels
  ["bg-white rounded-xl border border-gray-100", "bg-surface rounded-xl border border-surface-border"],
  ["bg-white rounded-2xl border border-gray-100", "bg-surface rounded-2xl border border-surface-border"],
  ["bg-white rounded-3xl border border-gray-100", "bg-surface rounded-3xl border border-surface-border"],
  ["bg-white rounded-4xl border border-gray-100", "bg-surface rounded-4xl border border-surface-border"],
  ["bg-white rounded-[2.5rem] border border-gray-100", "bg-surface rounded-[2.5rem] border border-surface-border"],
  ["bg-white rounded-[3rem] border border-gray-100", "bg-surface rounded-[3rem] border border-surface-border"],
  ["bg-white rounded-xl border border-gray-100 shadow-card", "bg-surface rounded-xl border border-surface-border shadow-card dark:shadow-none"],
  ["bg-white rounded-4xl border border-gray-100 shadow-sm", "bg-surface rounded-4xl border border-surface-border shadow-sm dark:shadow-none"],
  ["bg-white rounded-2xl border border-gray-100 shadow-sm", "bg-surface rounded-2xl border border-surface-border shadow-sm dark:shadow-none"],
  ["bg-white rounded-3xl border border-gray-100 shadow-sm", "bg-surface rounded-3xl border border-surface-border shadow-sm dark:shadow-none"],
  ["shadow-card hover:shadow-card-hover", "shadow-card hover:shadow-card-hover dark:shadow-none dark:hover:shadow-none"],
  ["shadow-card overflow-hidden", "shadow-card dark:shadow-none overflow-hidden"],
  ["shadow-xl shadow-gray-200/20", "shadow-xl shadow-gray-200/20 dark:shadow-none"],
  ["shadow-xl shadow-gray-200/50", "shadow-xl shadow-gray-200/50 dark:shadow-none"],
  // Standalone bg-white on cards (no border pattern)
  ["text-center py-20 bg-white rounded-4xl border border-gray-100", "text-center py-20 bg-surface rounded-4xl border border-surface-border"],
  ["bg-white rounded-4xl p-8 border border-gray-100", "bg-surface rounded-4xl p-8 border border-surface-border"],
  ["bg-white rounded-4xl p-10 border border-gray-100", "bg-surface rounded-4xl p-10 border border-surface-border"],
  ["bg-white rounded-[2.5rem] p-8 border border-gray-100", "bg-surface rounded-[2.5rem] p-8 border border-surface-border"],
  // Inputs
  ["border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950", "border border-gray-200 dark:border-slate-800 bg-surface-input dark:bg-slate-950"],
  ["border border-gray-200 bg-white text-sm", "border border-gray-200 dark:border-slate-800 bg-surface-input dark:bg-slate-950 text-gray-900 dark:text-gray-100 text-sm"],
  ["rounded-xl border border-gray-200 bg-white", "rounded-xl border border-gray-200 dark:border-slate-800 bg-surface-input dark:bg-slate-950"],
  // Dividers & borders
  ["border-b border-gray-100 flex", "border-b border-surface-border flex"],
  ["border-b border-gray-100\"", "border-b border-surface-border\""],
  ["divide-y divide-gray-50", "divide-y divide-gray-50 dark:divide-slate-800"],
  ["border-t border-gray-50", "border-t border-gray-50 dark:border-slate-800"],
  ["border-b border-gray-50", "border-b border-gray-50 dark:border-slate-800"],
  ["border border-gray-100", "border border-surface-border"],
  ["border-gray-100 ", "border-surface-border "],
  ["border-2 border-gray-100", "border-2 border-surface-border"],
  ["border-b border-gray-100", "border-b border-surface-border"],
  ["border-t border-gray-100", "border-t border-surface-border"],
  ["border-r border-gray-100", "border-r border-surface-border"],
  ["bg-gray-50/50 rounded", "bg-gray-50/50 dark:bg-slate-800/30 rounded"],
  ["bg-gray-50 border-r border-gray-100", "bg-gray-50 dark:bg-slate-900/50 border-r border-surface-border"],
  // Hover states
  ["hover:bg-gray-50/50 transition-colors", "hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"],
  ["hover:bg-gray-50 transition-colors", "hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"],
  ["hover:bg-gray-50 hover:text-gray-900", "hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white"],
  // Text (only when dark: not already on same attribute - handled by skip logic)
];

function hasDarkVariant(str, token) {
  const idx = str.indexOf(token);
  if (idx === -1) return false;
  // If dark: variant for this property already exists nearby, skip
  const slice = str.slice(Math.max(0, idx - 20), idx + token.length + 40);
  if (token.startsWith("bg-") && /dark:bg-/.test(slice)) return true;
  if (token.startsWith("text-gray-9") && /dark:text-/.test(slice)) return true;
  if (token.startsWith("border-gray") && /dark:border-/.test(slice)) return true;
  return false;
}

function fixTextColors(content) {
  let result = content;
  const textPairs = [
    ["text-gray-900", "text-gray-900 dark:text-gray-100"],
    ["text-gray-800", "text-gray-800 dark:text-gray-200"],
    ["text-gray-700", "text-gray-700 dark:text-gray-300"],
    ["text-gray-600", "text-gray-600 dark:text-gray-400"],
    ["text-gray-500", "text-gray-500 dark:text-gray-400"],
  ];
  for (const [from, to] of textPairs) {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    result = result.replace(regex, (match, offset) => {
      const lineStart = result.lastIndexOf("\n", offset) + 1;
      const lineEnd = result.indexOf("\n", offset);
      const line = result.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      if (line.includes("dark:text-")) return match;
      if (hasDarkVariant(line, from)) return match;
      return to;
    });
  }
  return result;
}

function fixBgWhiteRemaining(content) {
  // Catch bg-white not yet converted (e.g. in template strings)
  return content.replace(/\bbg-white\b/g, (match, offset) => {
    const lineStart = content.lastIndexOf("\n", offset) + 1;
    const lineEnd = content.indexOf("\n", offset);
    const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (line.includes("dark:bg-") || line.includes("bg-surface")) return match;
    // Skip intentional light-only elements (toggle knobs, inverted buttons)
    if (
      line.includes("dark:bg-white") ||
      line.includes("dark:text-gray-900") ||
      line.includes("w-4 h-4 bg-white rounded-full") ||
      line.includes("bg-white/") ||
      line.includes("from-white")
    ) {
      return match;
    }
    return "bg-surface";
  });
}

let totalChanged = 0;

for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    if (SKIP_FILES.has(file)) continue;
    let content = fs.readFileSync(file, "utf8");
    const original = content;

    for (const [from, to] of REPLACEMENTS) {
      content = content.split(from).join(to);
    }
    content = fixTextColors(content);
    content = fixBgWhiteRemaining(content);

    if (content !== original) {
      fs.writeFileSync(file, content);
      totalChanged++;
      console.log("Updated:", path.relative(root, file));
    }
  }
}

console.log(`\nDone. ${totalChanged} files updated.`);
