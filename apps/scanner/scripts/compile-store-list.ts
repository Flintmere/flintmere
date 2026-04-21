/**
 * compile-store-list
 * ------------------
 * Validates a list of candidate URLs as live public Shopify storefronts
 * and emits a clean CSV the batch-scan worker (#31) can iterate.
 *
 * Input  : data/benchmark/candidates.csv   — url[,vertical]  (operator-supplied)
 * Output : data/benchmark/stores.csv       — validated rows ready for scanning
 * Report : data/benchmark/stores.report.json — run summary + rejection reasons
 *
 * Usage (from repo root):
 *   pnpm --filter scanner benchmark:compile
 *
 * Flags (positional env vars):
 *   INPUT=path/to/candidates.csv  OUTPUT=path/to/stores.csv  CONCURRENCY=8
 *
 * Kindness rules (per memory/project_benchmark_decisions.md + /bot page):
 *   - UA: FlintmereBot/1.0 (+https://audit.flintmere.com/bot)
 *   - Per-run cap: 8 concurrent hosts, 10s per request
 *   - Each candidate hits at most two endpoints: /products.json?limit=1 and /
 *   - No retries on hard failures; a single bad fetch rejects the candidate
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BOT_UA = 'FlintmereBot/1.0 (+https://audit.flintmere.com/bot)';
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_CONCURRENCY = 8;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const INPUT =
  process.env.INPUT ?? resolve(REPO_ROOT, 'data/benchmark/candidates.csv');
const OUTPUT =
  process.env.OUTPUT ?? resolve(REPO_ROOT, 'data/benchmark/stores.csv');
const REPORT = OUTPUT.replace(/\.csv$/, '.report.json');
const CONCURRENCY = Number(process.env.CONCURRENCY ?? DEFAULT_CONCURRENCY);

interface Candidate {
  url: string;
  vertical: string;
}

type RejectReason =
  | 'invalid-url'
  | 'private-host'
  | 'unreachable'
  | 'timeout'
  | 'non-2xx'
  | 'no-products-json'
  | 'empty-catalog'
  | 'not-shopify';

interface Validated {
  shopDomain: string;
  canonicalUrl: string;
  vertical: string;
  productsVisibleSample: number;
  checkedAt: string;
}

interface Rejected {
  url: string;
  vertical: string;
  reason: RejectReason;
  detail?: string;
}

async function main(): Promise<void> {
  if (!existsSync(INPUT)) {
    console.error(`[compile-store-list] input not found: ${INPUT}`);
    console.error(
      '[compile-store-list] create a CSV with one URL per line (header: url[,vertical])',
    );
    process.exit(1);
  }

  const candidates = parseCsv(await readFile(INPUT, 'utf8'));
  if (candidates.length === 0) {
    console.error('[compile-store-list] no candidates parsed from input');
    process.exit(1);
  }

  console.log(
    `[compile-store-list] ${candidates.length} candidates · concurrency=${CONCURRENCY} · timeout=${REQUEST_TIMEOUT_MS}ms`,
  );

  const validated: Validated[] = [];
  const rejected: Rejected[] = [];
  const seen = new Set<string>();
  let done = 0;

  await runPool(candidates, CONCURRENCY, async (c) => {
    const outcome = await validate(c);
    done += 1;
    if (done % 25 === 0) {
      console.log(
        `[compile-store-list] progress ${done}/${candidates.length} · ok=${validated.length} · rejected=${rejected.length}`,
      );
    }
    if (outcome.kind === 'ok') {
      if (seen.has(outcome.value.shopDomain)) {
        rejected.push({
          url: c.url,
          vertical: c.vertical,
          reason: 'not-shopify',
          detail: 'duplicate domain',
        });
        return;
      }
      seen.add(outcome.value.shopDomain);
      validated.push(outcome.value);
    } else {
      rejected.push({
        url: c.url,
        vertical: c.vertical,
        reason: outcome.reason,
        detail: outcome.detail,
      });
    }
  });

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, formatOutputCsv(validated), 'utf8');
  await writeFile(
    REPORT,
    JSON.stringify(
      {
        startedAt: new Date().toISOString(),
        input: INPUT,
        output: OUTPUT,
        totals: {
          candidates: candidates.length,
          validated: validated.length,
          rejected: rejected.length,
        },
        rejectedByReason: tallyRejections(rejected),
        rejected,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(
    `[compile-store-list] done · validated=${validated.length} · rejected=${rejected.length}`,
  );
  console.log(`[compile-store-list] wrote ${OUTPUT}`);
  console.log(`[compile-store-list] wrote ${REPORT}`);
}

function parseCsv(raw: string): Candidate[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  if (lines.length === 0) return [];

  const first = lines[0]!.toLowerCase();
  const hasHeader = first.startsWith('url');
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((row) => {
    const [url, vertical] = row.split(',').map((c) => c.trim());
    return {
      url: url ?? '',
      vertical: vertical ?? 'unknown',
    };
  });
}

type ValidateResult =
  | { kind: 'ok'; value: Validated }
  | { kind: 'reject'; reason: RejectReason; detail?: string };

async function validate(c: Candidate): Promise<ValidateResult> {
  let host: string;
  try {
    host = normaliseHost(c.url);
  } catch (err) {
    return {
      kind: 'reject',
      reason: 'invalid-url',
      detail: err instanceof Error ? err.message : 'cannot parse',
    };
  }

  if (isPrivateHost(host)) {
    return { kind: 'reject', reason: 'private-host', detail: host };
  }

  const base = `https://${host}`;
  const productsUrl = `${base}/products.json?limit=1`;

  const res = await timedFetch(productsUrl);
  if (res.kind === 'timeout') {
    return { kind: 'reject', reason: 'timeout', detail: productsUrl };
  }
  if (res.kind === 'error') {
    return { kind: 'reject', reason: 'unreachable', detail: res.message };
  }
  if (!res.response.ok) {
    return {
      kind: 'reject',
      reason: 'non-2xx',
      detail: `status ${res.response.status}`,
    };
  }

  const ct = res.response.headers.get('content-type') ?? '';
  if (!ct.includes('json')) {
    return {
      kind: 'reject',
      reason: 'no-products-json',
      detail: `content-type ${ct}`,
    };
  }

  let body: unknown;
  try {
    body = await res.response.json();
  } catch {
    return { kind: 'reject', reason: 'no-products-json', detail: 'bad json' };
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !Array.isArray((body as { products?: unknown }).products)
  ) {
    return {
      kind: 'reject',
      reason: 'not-shopify',
      detail: 'no products array',
    };
  }

  const products = (body as { products: unknown[] }).products;
  if (products.length === 0) {
    return { kind: 'reject', reason: 'empty-catalog' };
  }

  return {
    kind: 'ok',
    value: {
      shopDomain: host,
      canonicalUrl: base,
      vertical: c.vertical || 'unknown',
      productsVisibleSample: products.length,
      checkedAt: new Date().toISOString(),
    },
  };
}

function normaliseHost(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('empty url');
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(candidate);
  const host = url.hostname.toLowerCase();
  if (!host) throw new Error('no hostname');
  return host;
}

function isPrivateHost(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.local')) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^127\./.test(host)) return true;
  return false;
}

type FetchOutcome =
  | { kind: 'ok'; response: Response }
  | { kind: 'timeout' }
  | { kind: 'error'; message: string };

async function timedFetch(url: string): Promise<FetchOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': BOT_UA,
        accept: 'application/json',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    return { kind: 'ok', response };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { kind: 'timeout' };
    }
    return {
      kind: 'error',
      message: err instanceof Error ? err.message : String(err),
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

function formatOutputCsv(rows: Validated[]): string {
  const header =
    'shop_domain,canonical_url,vertical,products_visible_sample,checked_at';
  const body = rows
    .map(
      (r) =>
        [
          r.shopDomain,
          r.canonicalUrl,
          r.vertical,
          r.productsVisibleSample,
          r.checkedAt,
        ]
          .map(csvEscape)
          .join(','),
    )
    .join('\n');
  return `${header}\n${body}\n`;
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function tallyRejections(r: Rejected[]): Record<RejectReason, number> {
  const acc: Record<string, number> = {};
  for (const x of r) acc[x.reason] = (acc[x.reason] ?? 0) + 1;
  return acc as Record<RejectReason, number>;
}

main().catch((err) => {
  console.error('[compile-store-list] fatal', err);
  process.exit(1);
});
