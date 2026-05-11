#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * aggregate-cohort-from-scans
 * ---------------------------
 * Merges one or more batch-scan output JSONLs into a single recruitment
 * CSV in the format `seed-outreach-cohorts.mjs` expects.
 *
 * Filter: grade in (D, F), shop_domain not already in any existing
 * cohort CSV under data/recruitment/. Deduped across inputs.
 *
 * uk_signal derived from the apex domain (.uk, .co.uk → 1).
 *
 * Usage (from repo root):
 *   node apps/scanner/scripts/aggregate-cohort-from-scans.mjs \
 *     data/discovery/2026-05-11/scans-phase2.jsonl \
 *     data/discovery/2026-05-11/scans-wikipedia.jsonl
 *
 * Output: data/recruitment/cohort-discovery-<UTC>.csv
 *
 * Env:
 *   OUTPUT_CSV    explicit output path (overrides date-stamped default)
 *   ALLOW_GRADES  comma-separated grades to include (default: "D,F")
 *   COHORT_DIR    where to read existing cohort CSVs from for dedup
 *                 (default: data/recruitment)
 *   INCLUDE_C     'true' to also include grade C (defaults false)
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const ALLOWED_GRADES = new Set(
  (process.env.ALLOW_GRADES ?? (process.env.INCLUDE_C === 'true' ? 'C,D,F' : 'D,F'))
    .split(',')
    .map((g) => g.trim().toUpperCase())
    .filter(Boolean),
);

const COHORT_DIR = resolve(REPO_ROOT, process.env.COHORT_DIR ?? 'data/recruitment');

function todayUtc() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const OUTPUT_CSV =
  process.env.OUTPUT_CSV ??
  resolve(COHORT_DIR, `cohort-discovery-${todayUtc()}.csv`);

function isUkDomain(domain) {
  const d = domain.toLowerCase();
  return d.endsWith('.co.uk') || d.endsWith('.uk') || d.endsWith('.org.uk');
}

function normaliseDomain(d) {
  return d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
}

async function readExistingCohortDomains() {
  if (!existsSync(COHORT_DIR)) return new Set();
  const files = await readdir(COHORT_DIR);
  const csvFiles = files.filter(
    (f) => f.endsWith('.csv') && !f.endsWith('.report.csv'),
  );
  const seen = new Set();
  for (const f of csvFiles) {
    const full = join(COHORT_DIR, f);
    let text;
    try {
      text = await readFile(full, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/).slice(1);
    for (const line of lines) {
      const first = line.split(',')[0]?.trim();
      if (first) seen.add(normaliseDomain(first));
    }
  }
  return seen;
}

function parseJsonlScan(line) {
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    return null;
  }
  // batch-scan.ts outcome shape: { kind: 'ok', scanId, grade, score, productCount } | { kind: 'failed', ... }
  if (!obj.shopDomain) return null;
  const outcome = obj.outcome ?? {};
  if (outcome.kind !== 'ok') return null;
  if (typeof outcome.score !== 'number') return null;
  if (typeof outcome.productCount !== 'number') return null;
  if (typeof outcome.grade !== 'string') return null;
  return {
    shopDomain: normaliseDomain(obj.shopDomain),
    score: outcome.score,
    grade: outcome.grade.toUpperCase(),
    productCount: outcome.productCount,
    scanId: outcome.scanId ?? '',
  };
}

async function readScansJsonl(path) {
  const text = await readFile(path, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  for (const line of lines) {
    const row = parseJsonlScan(line);
    if (row) rows.push(row);
  }
  return rows;
}

async function main() {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error('usage: aggregate-cohort-from-scans <scans.jsonl> [<scans2.jsonl> ...]');
    process.exit(2);
  }

  console.log(`[aggregate] inputs:`);
  for (const i of inputs) console.log(`  - ${i}`);
  console.log(`[aggregate] allowed grades: ${[...ALLOWED_GRADES].join(',')}`);
  console.log(`[aggregate] dedup against cohort dir: ${COHORT_DIR}`);

  const existing = await readExistingCohortDomains();
  console.log(`[aggregate] existing cohort domains: ${existing.size}`);

  const seen = new Set();
  const rows = [];
  let total = 0;
  let droppedNoGrade = 0;
  let droppedExisting = 0;
  let droppedDupe = 0;

  for (const input of inputs) {
    if (!existsSync(input)) {
      console.log(`[aggregate] skip missing input: ${input}`);
      continue;
    }
    const parsed = await readScansJsonl(input);
    total += parsed.length;
    for (const r of parsed) {
      if (!ALLOWED_GRADES.has(r.grade)) {
        droppedNoGrade += 1;
        continue;
      }
      if (existing.has(r.shopDomain)) {
        droppedExisting += 1;
        continue;
      }
      if (seen.has(r.shopDomain)) {
        droppedDupe += 1;
        continue;
      }
      seen.add(r.shopDomain);
      const ukSignal = isUkDomain(r.shopDomain) ? 1 : 0;
      const rescanUrl = `https://audit.flintmere.com/scan?url=${r.shopDomain}`;
      rows.push(
        `${r.shopDomain},${r.score},${r.grade},${r.productCount},${ukSignal},${r.scanId},${rescanUrl}`,
      );
    }
  }

  const header = 'shop_domain,score,grade,product_count,uk_signal,scan_id,re_scan_url';
  await writeFile(OUTPUT_CSV, header + '\n' + rows.join('\n') + (rows.length ? '\n' : ''), 'utf8');

  console.log('');
  console.log(`[aggregate] total scan rows read       : ${total}`);
  console.log(`[aggregate] dropped (grade not allowed): ${droppedNoGrade}`);
  console.log(`[aggregate] dropped (already in cohort): ${droppedExisting}`);
  console.log(`[aggregate] dropped (dupe across input): ${droppedDupe}`);
  console.log(`[aggregate] written rows               : ${rows.length}`);
  console.log(`[aggregate] uk_signal=1 rows           : ${rows.filter((l) => l.endsWith(',1,' + l.split(',').slice(5).join(','))).length || rows.filter((l) => l.split(',')[4] === '1').length}`);
  console.log('');
  console.log(`[aggregate] output: ${OUTPUT_CSV}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
