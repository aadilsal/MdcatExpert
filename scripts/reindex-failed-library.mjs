/**
 * Re-trigger ingest for failed PCTB platform textbooks (e.g. after enabling OCR).
 * Usage: node scripts/reindex-failed-library.mjs
 */

import { execSync } from "child_process";

const query = `return (await ctx.db.query("studySources").collect()).filter(s=>s.sourceKind==="pctb_textbook"&&s.status==="failed").map(s=>({id:s._id,title:s.title}))`;

const out = execSync(
  `npx convex run --inline-query ${JSON.stringify(query)}`,
  { encoding: "utf-8" },
);
const failed = JSON.parse(out.trim());

if (failed.length === 0) {
  console.log("No failed PCTB sources to reindex.");
  process.exit(0);
}

console.log(`Reindexing ${failed.length} failed sources...\n`);

for (const source of failed) {
  console.log(`> ${source.title}`);
  const args = JSON.stringify({ sourceId: source.id });
  execSync(`npx convex run ingestDocument:ingestSource ${JSON.stringify(args)}`, {
    encoding: "utf-8",
    stdio: "inherit",
  });
}

console.log("\nIngest scheduled. Scanned books will OCR in the background (check Admin → Study Library).");
