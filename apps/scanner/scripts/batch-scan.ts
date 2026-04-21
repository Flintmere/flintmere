/**
 * batch-scan
 * ----------
 * Iterates a validated stores.csv (output of compile-store-list) and
 * scans each store via the running scanner's /api/scan endpoint with
 * the FlintmereBot UA. The scan route detects the UA and writes rows
 * with source='bot' — ready for the aggregates endpoint (#32).
 *
 * Input   : data/benchmark/stores.csv       — from compile-store-list
 * Output  : data/benchmark/scans.jsonl      — one JSON object per row
 * Report  : data/benchmark/scans.report.json — run summary
 *
 * Usage (scanner must be running on BASE_URL):
 *   pnpm --filter scanner benchmark:scan
 *
 * Flags (env):
 *   BASE_URL=http://localhost:3001   scanner HTTP endpoint
 *   INPUT=data/benchmark/stores.csv
 *   OUTPUT=data/benchmark/scans.jsonl
 *   CONCURRENCY=4
 *   PER_SCAN_BUDGET_MS=70000         timeout per request (scanner cap is 60s)
 *   RESUME=true                      skip domains already in OUTPUT
 *
 * Kindness:
 *   - UA: FlintmereBot/1.0 (+https://audit.flintmere.com/bot)
 *   - Small pool (4). Each host is visited only once per run.
 *   - Failures are logged and do not abort the run.
 */

import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BOT_UA = 'FlintmereBot/1.0 (+https://audit.flintmere.com/bot)';
const DEFAULT_BASE_URL = 'http://localhost:3001';
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_BUDGET_MS = 70_000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const BASE_URL = (process.env.BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
const INPUT =
  process.env.INPUT ?? resolve(REPO_ROOT, 'data/benchmark/stores.csv');
const OUTPUT =
  process.env.OUTPUT ?? resolve(REPO_ROOT, 'data/benchmark/scans.jsonl');
const REPORT = OUTPUT.replace(/\.jsonl$/, '.report.json');
const CONCURRENCY = Number(process.env.CONCURRENCY ?? DEFAULT_CONCURRENCY);
const PER_SCAN_BUDGET_MS = Number(
  process.env.PER_SCAN_BUDGET_MS ?? DEFAULT_BUDGET_MS,
);
const RESUME = (process.env.RESUME ?? 'true') !== 'false';

interface Store {
  shopDomain: string;
  canonicalUrl: string;
  vertical: string;
}

type Outcome =
  | {
      kind: 'ok';
      scanId: string;
      grade: string;
      score: number;
      productCount: number;
    }
  | { kind: 'error'; code: string; message: string }
  | { kind: 'timeout' };

interface ResultRow {
  shopDomain: string;
  vertical: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  outcome: Outcome;
}

async function main(): Promise<void> {
  if (!existsSync(INPUT)) {
    console.error(`[batch-scan] input not found: ${INPUT}`);
    console.error(
      '[batch-scan] run `pnpm --filter scanner benchmark:compile` first',
    );
    process.exit(1);
  }

  const stores = parseStoresCsv(await readFile(INPUT, 'utf8'));
  if (stores.length === 0) {
    console.error('[batch-scan] no stores parsed from input');
    process.exit(1);
  }

  await mkdir(dirname(OUTPUT), { recursive: true });

  const alreadyDone = RESUME ? await loadDoneDomains(OUTPUT) : new Set<string>();
  const todo = stores.filter((s) => !alreadyDone.has(s.shopDomain));

  console.log(
    `[batch-scan] ${stores.length} stores · already done=${alreadyDone.size} · to-scan=${todo.length}`,
  );
  console.log(
    `[batch-scan] base=${BASE_URL} · concurrency=${CONCURRENCY} · budget=${PER_SCAN_BUDGET_MS}ms`,
  );

  if (!(await reachable(BASE_URL))) {
    console.error(
      `[batch-scan] scanner not reachable at ${BASE_URL} — start it first:`,
    );
    console.error('  pnpm --filter scanner dev');
    process.exit(1);
  }

  let done = alreadyDone.size;
  let ok = 0;
  let errors = 0;
  const startedAt = new Date().toISOString();
  const byErrorCode: Record<string, number> = {};

  await runPool(todo, CONCURRENCY, async (store) => {
    const row = await scanOne(store);
    await appendFile(OUTPUT, JSON.stringify(row) + '\n', 'utf8');
    done += 1;
    if (row.outcome.kind === 'ok') ok += 1;
    else {
      errors += 1;
      const code =
        row.outcome.kind === 'timeout' ? 'timeout' : row.outcome.code;
      byErrorCode[code] = (byErrorCode[code] ?? 0) + 1;
    }
    if (done % 10 === 0 || done === stores.length) {
      console.log(
        `[batch-scan] progress ${done}/${stores.length} · ok=${ok} · errors=${errors}`,
      );
    }
  });

  await writeFile(
    REPORT,
    JSON.stringify(
      {
        startedAt,
        finishedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        input: INPUT,
        output: OUTPUT,
        concurrency: CONCURRENCY,
        perScanBudgetMs: PER_SCAN_BUDGET_MS,
        totals: {
          stores: stores.length,
          alreadyDone: alreadyDone.size,
          attempted: todo.length,
          ok,
          errors,
        },
        errorsByCode: byErrorCode,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`[batch-scan] done · ok=${ok} · errors=${errors}`);
  console.log(`[batch-scan] wrote ${OUTPUT}`);
  console.log(`[batch-scan] wrote ${REPORT}`);
}

function parseStoresCsv(raw: string): Store[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  if (lines.length === 0) return [];
  const hasHeader = lines[0]!.toLowerCase().startsWith('shop_domain');
  const rows = hasHeader ? lines.slice(1) : lines;
  return rows.map((row) => {
    const cols = row.split(',').map((c) => c.trim());
    return {
      shopDomain: cols[0] ?? '',
      canonicalUrl: cols[1] ?? '',
      vertical: cols[2] ?? 'unknown',
    };
  });
}

async function loadDoneDomains(path: string): Promise<Set<string>> {
  if (!existsSync(path)) return new Set();
  const raw = await readFile(path, 'utf8');
  const out = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line) as { shopDomain?: string };
      if (obj.shopDomain) out.add(obj.shopDomain);
    } catch {
      /* skip malformed lines */
    }
  }
  return out;
}

async function reachable(base: string): Promise<boolean> {
  try {
    const res = await fetch(`${base}/bot`, {
      method: 'GET',
      headers: { 'user-agent': BOT_UA },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function scanOne(store: Store): Promise<ResultRow> {
  const startedAt = new Date();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_SCAN_BUDGET_MS);
  try {
    const res = await fetch(`${BASE_URL}/api/scan`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': BOT_UA,
      },
      body: JSON.stringify({
        shopUrl: store.canonicalUrl || store.shopDomain,
        vertical: store.vertical && store.vertical !== 'unknown' ? store.vertical : undefined,
      }),
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      grade?: string;
      score?: number;
      productCount?: number;
      code?: string;
      message?: string;
    };
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    if (res.ok && body.id && body.grade) {
      return {
        shopDomain: store.shopDomain,
        vertical: store.vertical,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs,
        outcome: {
          kind: 'ok',
          scanId: body.id,
          grade: body.grade,
          score: body.score ?? 0,
          productCount: body.productCount ?? 0,
        },
      };
    }
    return {
      shopDomain: store.shopDomain,
      vertical: store.vertical,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs,
      outcome: {
        kind: 'error',
        code: body.code ?? `http-${res.status}`,
        message: body.message ?? 'scan failed',
      },
    };
  } catch (err) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        shopDomain: store.shopDomain,
        vertical: store.vertical,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs,
        outcome: { kind: 'timeout' },
      };
    }
    return {
      shopDomain: store.shopDomain,
      vertical: store.vertical,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs,
      outcome: {
        kind: 'error',
        code: 'fetch-failed',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool<T>(
  items: T[],
  size: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.max(1, size) }, async () => {
    while (cursor < items.length) {
      const i = cursor;
      cursor += 1;
      await worker(items[i]!);
    }
  });
  await Promise.all(runners);
}

main().catch((err) => {
  console.error('[batch-scan] fatal', err);
  process.exit(1);
});
