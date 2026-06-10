/**
 * Download official PCTB textbooks and import into Convex Study Library.
 *
 * Usage (requires deployed Convex backend):
 *   pnpm convex:seed-library          # one book per convex run
 *   pnpm convex:seed-library:now      # sequential import via Convex action
 *   pnpm convex:seed-library --local  # download locally, upload to Convex storage
 *
 * Sources: Taleem360 mirrors of official PCTB/PECTAA books (see scripts/pctb-manifest.json).
 */

import { readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "pctb-manifest.json"), "utf-8"));

const runNow = process.argv.includes("--now");
const runLocal = process.argv.includes("--local");
const CACHE_DIR = join(__dirname, ".cache", "pctb");

const ALLOWED_HOSTS = [
  "pctb.punjab.gov.pk",
  "taleem360.com",
  "drive.google.com",
  "drive.usercontent.google.com",
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function assertAllowedUrl(url) {
  const parsed = new URL(url);
  if (!ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
    throw new Error(`URL host not allowed: ${parsed.hostname}`);
  }
}

function convexRun(functionName, args = {}) {
  const argsJson = JSON.stringify(args);
  const cmd = `npx convex run ${functionName} ${JSON.stringify(argsJson)}`;
  const out = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

async function downloadPdf(urls, destPath) {
  const errors = [];
  for (const url of urls) {
    assertAllowedUrl(url);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/pdf,*/*" },
        redirect: "follow",
      });
      if (!res.ok) {
        errors.push(`HTTP ${res.status} for ${url}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < 10_000) {
        errors.push(`File too small (${buf.byteLength} bytes) from ${url}`);
        continue;
      }
      mkdirSync(dirname(destPath), { recursive: true });
      const { writeFileSync } = await import("fs");
      writeFileSync(destPath, buf);
      return { bytes: buf.byteLength, sourceUrl: url, contentType: res.headers.get("content-type") ?? "application/pdf" };
    } catch (err) {
      errors.push(`${url}: ${err.message ?? err}`);
    }
  }
  throw new Error(errors.join("; "));
}

async function importLocal(entry) {
  const slug = entry.title.toLowerCase().replace(/\s+/g, "-") + ".pdf";
  const destPath = join(CACHE_DIR, slug);

  if (!existsSync(destPath)) {
    console.log(`Downloading ${entry.title}...`);
    const dl = await downloadPdf(entry.urls, destPath);
    console.log(`  saved ${(dl.bytes / 1_048_576).toFixed(1)} MB from ${dl.sourceUrl}`);
  } else {
    console.log(`Using cached ${entry.title}`);
  }

  const { readFileSync: readFile } = await import("fs");
  const fileBuf = readFile(destPath);
  const uploadUrl = convexRun("seedLibrary:generateSeedUploadUrl");
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: fileBuf,
  });
  if (!uploadRes.ok) {
    throw new Error(`Storage upload failed for ${entry.title}: HTTP ${uploadRes.status}`);
  }
  const { storageId } = await uploadRes.json();

  return convexRun("seedLibrary:insertPlatformSourceInternal", {
    storageId,
    title: entry.title,
    subject: entry.subject,
    classLevel: entry.classLevel,
    fileSize: fileBuf.byteLength,
    contentType: "application/pdf",
  });
}

async function main() {
  console.log(`PCTB Study Library seed — ${manifest.length} books\n`);

  for (const entry of manifest) {
    const urls = entry.urls ?? (entry.url ? [entry.url] : []);
    for (const url of urls) assertAllowedUrl(url);
  }

  if (runLocal) {
    console.log("Local download + Convex storage upload...\n");
    const results = [];
    for (const entry of manifest) {
      try {
        const result = await importLocal(entry);
        results.push(result);
        console.log(result, "\n");
      } catch (err) {
        console.error(`Failed: ${entry.title}`, err.message ?? err);
        results.push({ title: entry.title, status: "failed", error: String(err.message ?? err) });
      }
    }
    printSummary(results);
    return;
  }

  if (runNow) {
    console.log("Running sequential import via Convex action...\n");
    const out = execSync("npx convex run seedLibrary:seedAllPctbBooksNow", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "inherit"],
    });
    console.log(out);
    return;
  }

  if (process.argv.includes("--staggered")) {
    const out = execSync("npx convex run seedLibrary:seedAllPctbBooks", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "inherit"],
    });
    console.log(out);
    return;
  }

  console.log("Importing each book via Convex (downloads from mirror URLs)...\n");
  const results = [];

  for (const entry of manifest) {
    try {
      const out = convexRun("seedLibrary:importPctbBook", {
        urls: entry.urls,
        title: entry.title,
        subject: entry.subject,
        classLevel: entry.classLevel,
      });
      results.push({ title: entry.title, out });
      console.log(JSON.stringify(out), "\n");
    } catch (err) {
      console.error(`Failed: ${entry.title}`, err.message ?? err);
      results.push({ title: entry.title, error: String(err.message ?? err) });
    }
  }

  printSummary(results);
}

function printSummary(results) {
  console.log("\n--- Summary ---");
  for (const r of results) {
    const title = r.title ?? r.out?.title ?? "unknown";
    const status = r.out?.status ?? r.status ?? (r.error ? "failed" : r.skipped === false ? "imported" : "done");
    const detail = r.error ?? (r.sourceId ? `sourceId=${r.sourceId}` : r.out?.sourceId ? `sourceId=${r.out.sourceId}` : "");
    console.log(title, status, detail ? `— ${detail}` : "");
  }
  console.log("\nCheck Admin → Study Library for processing → ready status.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
