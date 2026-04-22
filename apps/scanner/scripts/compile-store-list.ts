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
 * Validation strategy:
 *   1. Primary: GET /products.json?limit=1 — 2xx + JSON body with non-empty
 *      products array ⇒ validated 'products-json'.
 *   2. Fallback: when /products.json returns 403/404/429 (the typical
 *      "blocked, not missing" responses from Cloudflare + Shopify Plus),
 *      GET /sitemap_products_1.xml. If it returns 2xx with at least one
 *      <loc>…/products/…</loc> entry ⇒ validated 'sitemap'. The
 *      batch-scan worker runs its own sitemap fallback for scoring.
 *
 * Kindness rules (per memory/project_benchmark_decisions.md + /bot page):
 *   - UA: FlintmereBot/1.0 (+https://audit.flintmere.com/bot)
 *   - Concurrency 2 + 2s-per-worker floor → ~60 req/min from our IP,
 *     inside Shopify's global per-IP allowance and matching the
 *     "1 req/2s per host" rule published on /bot.
 *   - Each candidate hits at most two endpoints: /products.json, then
 *     (only if the primary was blocked) /sitemap_products_1.xml.
 *   - No retries on hard failures.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BOT_UA = 'FlintmereBot/1.0 (+https://audit.flintmere.com/bot)';
const REQUEST_TIMEOUT_MS = 10_000;
// Shopify's edge CDN applies a per-IP throttle pooled across all the
// stores it fronts. At concurrency=8 with no inter-request delay we
// tripped it — 136/150 came back 429 on the first run. With CONCURRENCY=2
// and a 2s-per-worker floor we stay at ~60 req/min from our IP, inside
// Shopify's global per-IP allowance and matching the "1 req/2s per host"
// kindness rule we publish on /bot.
const DEFAULT_CONCURRENCY = 2;
const REQUEST_INTERVAL_MS = 2_000;
const REQUEST_JITTER_MS = 500;

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
  | 'not-shopify'
  | 'no-sitemap';

// Two validation paths. 'products-json' is the strong one — we got a
// structured catalog snapshot back. 'sitemap' means /products.json was
// blocked (403/404/429 — typical Cloudflare + Shopify-Plus behaviour)
// so we fell through to /sitemap_products_1.xml, which Shopify publishes
// for SEO and almost never blocks. Sitemap-validated stores are real
// Shopify storefronts but the batch-scan worker needs the same fallback
// to actually score them. Both paths are kindness-compliant.
type ValidationPath = 'products-json' | 'sitemap';

interface Validated {
  shopDomain: string;
  canonicalUrl: string;
  vertical: string;
  productsVisibleSample: number;
  validationPath: ValidationPath;
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
        validatedByPath: tallyPaths(validated),
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
  // 403/404/429 on /products.json is the "blocked, not missing" signal —
  // Cloudflare / Shopify-Plus anti-scrape. Fall through to the public
  // sitemap. 5xx and other non-2xx stay rejections because they signal
  // the origin is actually sick.
  if (!res.response.ok) {
    if (
      res.response.status === 403 ||
      res.response.status === 404 ||
      res.response.status === 429
    ) {
      await drainBody(res.response);
      return sitemapFallback(c, host, base, res.response.status);
    }
    await drainBody(res.response);
    return {
      kind: 'reject',
      reason: 'non-2xx',
      detail: `status ${res.response.status}`,
    };
  }

  const ct = res.response.headers.get('content-type') ?? '';
  if (!ct.includes('json')) {
    return sitemapFallback(c, host, base, `content-type ${ct}`);
  }

  let body: unknown;
  try {
    body = await res.response.json();
  } catch {
    return sitemapFallback(c, host, base, 'products.json bad body');
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !Array.isArray((body as { products?: unknown }).products)
  ) {
    return sitemapFallback(c, host, base, 'products.json shape wrong');
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
      validationPath: 'products-json',
      checkedAt: new Date().toISOString(),
    },
  };
}

// Shopify exposes /sitemap_products_1.xml publicly for SEO, and
// Cloudflare rarely blocks it because Googlebot needs it. When
// /products.json is 403/404/429'd, a sitemap with at least one
// <loc>…/products/…</loc> entry is enough to prove a live Shopify
// storefront. The batch-scan worker handles scoring; compile only
// proves "this is a real store worth scanning".
async function sitemapFallback(
  c: Candidate,
  host: string,
  base: string,
  productsJsonDetail: string | number,
): Promise<ValidateResult> {
  const sitemapUrl = `${base}/sitemap_products_1.xml`;
  const res = await timedFetch(sitemapUrl, 'application/xml');
  if (res.kind === 'timeout') {
    return {
      kind: 'reject',
      reason: 'timeout',
      detail: `sitemap timeout (products.json: ${productsJsonDetail})`,
    };
  }
  if (res.kind === 'error') {
    return {
      kind: 'reject',
      reason: 'unreachable',
      detail: `sitemap: ${res.message}`,
    };
  }
  if (!res.response.ok) {
    await drainBody(res.response);
    return {
      kind: 'reject',
      reason: 'no-sitemap',
      detail: `sitemap ${res.response.status} (products.json: ${productsJsonDetail})`,
    };
  }

  const xml = await res.response.text();
  const count = countProductLocs(xml);
  if (count === 0) {
    return {
      kind: 'reject',
      reason: 'no-sitemap',
      detail: `sitemap had no /products/ entries (products.json: ${productsJsonDetail})`,
    };
  }

  return {
    kind: 'ok',
    value: {
      shopDomain: host,
      canonicalUrl: base,
      vertical: c.vertical || 'unknown',
      productsVisibleSample: count,
      validationPath: 'sitemap',
      checkedAt: new Date().toISOString(),
    },
  };
}

// Count entries like <loc>https://host/products/slug</loc>. We don't
// need a full XML parser — the sitemap shape is fixed and regex is
// cheaper than hauling in a dep for this one call.
function countProductLocs(xml: string): number {
  const matches = xml.match(/<loc>[^<]*\/products\/[^<]*<\/loc>/gi);
  return matches ? matches.length : 0;
}

async function drainBody(r: Response): Promise<void> {
  try {
    await r.body?.cancel();
  } catch {
    // best-effort — the body stream may already be consumed
  }
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

async function timedFetch(
  url: string,
  accept = 'application/json',
): Promise<FetchOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': BOT_UA,
        accept,
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
      const started = Date.now();
      await worker(items[i]!);
      if (cursor < items.length) {
        const elapsed = Date.now() - started;
        const jitter = Math.floor(Math.random() * REQUEST_JITTER_MS);
        const wait = Math.max(0, REQUEST_INTERVAL_MS - elapsed + jitter);
        if (wait > 0) await sleep(wait);
      }
    }
  });
  await Promise.all(runners);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function formatOutputCsv(rows: Validated[]): string {
  const header =
    'shop_domain,canonical_url,vertical,products_visible_sample,validation_path,checked_at';
  const body = rows
    .map(
      (r) =>
        [
          r.shopDomain,
          r.canonicalUrl,
          r.vertical,
          r.productsVisibleSample,
          r.validationPath,
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

function tallyPaths(v: Validated[]): Record<ValidationPath, number> {
  const acc: Record<string, number> = { 'products-json': 0, sitemap: 0 };
  for (const x of v) acc[x.validationPath] = (acc[x.validationPath] ?? 0) + 1;
  return acc as Record<ValidationPath, number>;
}

main().catch((err) => {
  console.error('[compile-store-list] fatal', err);
  process.exit(1);
});
