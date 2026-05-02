/**
 * export-design-partner-cohort
 * ----------------------------
 * Read-only export of the design-partner recruitment cohort for Phase 1
 * Day 6 of the 30-day plan (`context/plans/2026-04-30-phase-1-finish-out-30-day-plan.md`).
 *
 * Two modes (set via SOURCE):
 *
 *   SOURCE=lead (default)
 *     Joins Lead × Scan. Produces a sendable cohort with merchant emails.
 *     Empty when no real users have submitted email after a scan.
 *
 *   SOURCE=scan
 *     Reads Scan only — no email column. Produces a TARGET LIST: one row
 *     per merchant we've already scored, for the operator to manually
 *     research a contact email per row (store contact page, LinkedIn,
 *     founder bio). Use when SOURCE=lead returns empty.
 *
 * Filter (defaults — conservative; override via env vars):
 *   - vertical = 'food-and-drink'                             (VERTICAL — DB stores long form)
 *   - product_count BETWEEN 100 AND 5000                      (MIN_SKU / MAX_SKU)
 *   - grade IN ('C','D','F')                                  (MAX_GRADE — 'C' default)
 *   - shop_url contains '.co.uk' OR '.uk' TLD                 (UK_TLD_ONLY=true default)
 *   - published_to_benchmark = true                           (REQUIRE_BENCHMARK_OPTIN — only enforced in lead mode)
 *   - lead.unsubscribed_at IS NULL                            (always — non-negotiable per #24, lead mode only)
 *   - scan.status = 'complete'                                (always — never target failed scans)
 *
 * Output:
 *   data/recruitment/cohort-design-partners-<MODE>-<YYYY-MM-DD>.csv  (gitignored — PII)
 *   data/recruitment/cohort-design-partners-<MODE>-<YYYY-MM-DD>.report.json
 *
 * Usage (from repo root):
 *   pnpm --filter scanner cohort:design-partners                       # SOURCE=lead default
 *   SOURCE=scan pnpm --filter scanner cohort:design-partners           # target-list mode
 *
 * Override examples:
 *   UK_TLD_ONLY=false                       → drop the TLD filter (widens to .com)
 *   REQUIRE_BENCHMARK_OPTIN=false           → drop the strong-opt-in floor (lead mode only)
 *   MAX_GRADE=D                             → only D and F (tighter)
 *   MIN_SKU=200 MAX_SKU=3000                → tighten SKU band
 *
 * PECR / GDPR posture:
 *   - lead mode: REQUIRE_BENCHMARK_OPTIN=true (default) restricts contact to
 *     merchants who opted into benchmark publication — the strongest opt-in
 *     signal we have. unsubscribed_at IS NULL is a hard floor.
 *   - scan mode: NO emails are exported. The operator is expected to find
 *     contact emails manually from public sources (store contact page,
 *     LinkedIn, founder bio). Outreach to those addresses is B2B cold email,
 *     defensible under PECR if the merchant operates as a corporate entity
 *     and the message offers a clear opt-out from the first send.
 *   - Emails (lead mode) are written to the CSV file only — never logged to stdout.
 *   - Output dir `data/recruitment/` is gitignored.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../src/generated/prisma';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

type Source = 'lead' | 'scan';
const SOURCE_RAW = (process.env.SOURCE ?? 'lead').toLowerCase();
if (SOURCE_RAW !== 'lead' && SOURCE_RAW !== 'scan') {
  console.error(`[export-design-partner-cohort] SOURCE must be 'lead' or 'scan' — got ${SOURCE_RAW}`);
  process.exit(1);
}
const SOURCE: Source = SOURCE_RAW;

const VERTICAL = process.env.VERTICAL ?? 'food-and-drink';
const MIN_SKU = Number(process.env.MIN_SKU ?? 100);
const MAX_SKU = Number(process.env.MAX_SKU ?? 5000);
const MAX_GRADE = (process.env.MAX_GRADE ?? 'C').toUpperCase();
const UK_TLD_ONLY = (process.env.UK_TLD_ONLY ?? 'true') !== 'false';
const REQUIRE_BENCHMARK_OPTIN =
  (process.env.REQUIRE_BENCHMARK_OPTIN ?? 'true') !== 'false';

const GRADE_LADDER = ['A', 'B', 'C', 'D', 'F'] as const;
type Grade = (typeof GRADE_LADDER)[number];

function gradesAtOrBelow(threshold: string): Grade[] {
  const idx = GRADE_LADDER.indexOf(threshold as Grade);
  if (idx < 0) {
    throw new Error(
      `MAX_GRADE must be one of ${GRADE_LADDER.join('|')} — got ${threshold}`,
    );
  }
  return GRADE_LADDER.slice(idx);
}

const TODAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = resolve(REPO_ROOT, 'data/recruitment');
const OUT_CSV = resolve(OUT_DIR, `cohort-design-partners-${SOURCE}-${TODAY}.csv`);
const OUT_REPORT = resolve(OUT_DIR, `cohort-design-partners-${SOURCE}-${TODAY}.report.json`);

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error(
      '[export-design-partner-cohort] DATABASE_URL not set; cannot connect to scanner DB',
    );
    process.exit(1);
  }

  const grades = gradesAtOrBelow(MAX_GRADE);

  console.log('[export-design-partner-cohort] mode + filters:');
  console.log(`  source                = ${SOURCE}`);
  console.log(`  vertical              = ${VERTICAL}`);
  console.log(`  product_count         = ${MIN_SKU}..${MAX_SKU}`);
  console.log(`  grade                 ∈ {${grades.join(', ')}}`);
  console.log(`  uk_tld_only           = ${UK_TLD_ONLY}`);
  if (SOURCE === 'lead') {
    console.log(`  require_benchmark     = ${REQUIRE_BENCHMARK_OPTIN}`);
    console.log(`  unsubscribed_at IS NULL (hard floor)`);
  }
  console.log(`  scan.status           = complete`);

  const prisma = new PrismaClient();
  try {
    const tldClause = UK_TLD_ONLY
      ? [
          { shopUrl: { contains: '.co.uk', mode: 'insensitive' as const } },
          { shopUrl: { contains: '.uk/', mode: 'insensitive' as const } },
          { shopUrl: { endsWith: '.uk', mode: 'insensitive' as const } },
        ]
      : undefined;

    const scanWhere = {
      status: 'complete' as const,
      vertical: VERTICAL,
      productCount: { gte: MIN_SKU, lte: MAX_SKU },
      grade: { in: grades },
      ...(tldClause ? { OR: tldClause } : {}),
    };

    const rows =
      SOURCE === 'lead' ? await collectLeads(prisma, scanWhere) : await collectScans(prisma, scanWhere);

    const gradeTally = rows.reduce<Record<string, number>>((acc, r) => {
      const g = r.grade ?? 'unknown';
      acc[g] = (acc[g] ?? 0) + 1;
      return acc;
    }, {});

    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(OUT_CSV, formatCsv(rows, SOURCE), 'utf8');
    await writeFile(
      OUT_REPORT,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          source: SOURCE,
          filters: {
            vertical: VERTICAL,
            productCount: { min: MIN_SKU, max: MAX_SKU },
            grades,
            ukTldOnly: UK_TLD_ONLY,
            requireBenchmarkOptin: SOURCE === 'lead' ? REQUIRE_BENCHMARK_OPTIN : null,
          },
          totals: {
            cohortSize: rows.length,
          },
          gradeTally,
        },
        null,
        2,
      ),
      'utf8',
    );

    console.log(`[export-design-partner-cohort] cohort size: ${rows.length}`);
    console.log(`  by grade: ${JSON.stringify(gradeTally)}`);
    console.log(`  csv:    ${OUT_CSV}`);
    console.log(`  report: ${OUT_REPORT}`);

    if (rows.length === 0 && SOURCE === 'lead') {
      console.log(
        "[export-design-partner-cohort] empty lead cohort — try SOURCE=scan to produce a target list (no emails) instead",
      );
    } else if (rows.length === 0) {
      console.log(
        '[export-design-partner-cohort] empty scan cohort — consider widening filters (UK_TLD_ONLY=false, MAX_GRADE=D, etc.)',
      );
    } else if (rows.length < 10) {
      console.log(
        `[export-design-partner-cohort] cohort smaller than the Day-6 target of 10 — consider widening filters`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

interface CohortRow {
  email?: string;
  shopUrl: string;
  normalisedDomain: string;
  vertical: string | null;
  productCount: number | null;
  score: number | null;
  grade: string | null;
  publishedToBenchmark: boolean;
  scanCreatedAt: Date;
  consentedAt?: Date;
  reportOpenedAt?: Date | null;
}

type ScanWhere = Parameters<PrismaClient['scan']['findMany']>[0] extends infer A
  ? A extends { where?: infer W }
    ? W
    : never
  : never;

async function collectLeads(prisma: PrismaClient, scanWhere: ScanWhere): Promise<CohortRow[]> {
  const leads = await prisma.lead.findMany({
    where: {
      unsubscribedAt: null,
      scan: {
        ...scanWhere,
        ...(REQUIRE_BENCHMARK_OPTIN ? { publishedToBenchmark: true } : {}),
      },
    },
    select: {
      email: true,
      consentedAt: true,
      reportOpenedAt: true,
      scan: {
        select: {
          shopUrl: true,
          normalisedDomain: true,
          vertical: true,
          productCount: true,
          score: true,
          grade: true,
          publishedToBenchmark: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ scan: { score: 'asc' } }, { scan: { createdAt: 'desc' } }],
  });

  // De-duplicate by email — a merchant who scanned multiple stores gets one
  // outreach. Keep the lowest-score scan as the most pertinent signal.
  const seen = new Set<string>();
  const rows: CohortRow[] = [];
  for (const l of leads) {
    const key = l.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      email: l.email,
      shopUrl: l.scan.shopUrl,
      normalisedDomain: l.scan.normalisedDomain,
      vertical: l.scan.vertical,
      productCount: l.scan.productCount,
      score: l.scan.score,
      grade: l.scan.grade,
      publishedToBenchmark: l.scan.publishedToBenchmark,
      scanCreatedAt: l.scan.createdAt,
      consentedAt: l.consentedAt,
      reportOpenedAt: l.reportOpenedAt,
    });
  }
  return rows;
}

async function collectScans(prisma: PrismaClient, scanWhere: ScanWhere): Promise<CohortRow[]> {
  const scans = await prisma.scan.findMany({
    where: scanWhere,
    select: {
      shopUrl: true,
      normalisedDomain: true,
      vertical: true,
      productCount: true,
      score: true,
      grade: true,
      publishedToBenchmark: true,
      createdAt: true,
    },
    orderBy: [{ score: 'asc' }, { createdAt: 'desc' }],
  });

  // De-duplicate by normalised_domain — multiple scans of the same store
  // collapse to one row (kept the lowest score / most recent).
  const seen = new Set<string>();
  const rows: CohortRow[] = [];
  for (const s of scans) {
    const key = s.normalisedDomain;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      shopUrl: s.shopUrl,
      normalisedDomain: s.normalisedDomain,
      vertical: s.vertical,
      productCount: s.productCount,
      score: s.score,
      grade: s.grade,
      publishedToBenchmark: s.publishedToBenchmark,
      scanCreatedAt: s.createdAt,
    });
  }
  return rows;
}

function formatCsv(rows: CohortRow[], source: Source): string {
  if (source === 'lead') {
    const header =
      'email,shop_url,normalised_domain,vertical,product_count,score,grade,published_to_benchmark,scan_created_at,consented_at,report_opened_at';
    const body = rows
      .map((r) =>
        [
          r.email ?? '',
          r.shopUrl,
          r.normalisedDomain,
          r.vertical ?? '',
          r.productCount ?? '',
          r.score ?? '',
          r.grade ?? '',
          r.publishedToBenchmark ? 'true' : 'false',
          r.scanCreatedAt.toISOString(),
          r.consentedAt ? r.consentedAt.toISOString() : '',
          r.reportOpenedAt ? r.reportOpenedAt.toISOString() : '',
        ]
          .map(csvEscape)
          .join(','),
      )
      .join('\n');
    return `${header}\n${body}\n`;
  }

  // scan mode — target list, no email; researched-contact column blank for the operator
  const header =
    'shop_url,normalised_domain,vertical,product_count,score,grade,published_to_benchmark,scan_created_at,researched_contact_email,researched_contact_name,researched_contact_source,outreach_status,notes';
  const body = rows
    .map((r) =>
      [
        r.shopUrl,
        r.normalisedDomain,
        r.vertical ?? '',
        r.productCount ?? '',
        r.score ?? '',
        r.grade ?? '',
        r.publishedToBenchmark ? 'true' : 'false',
        r.scanCreatedAt.toISOString(),
        '', // researched_contact_email — operator fills in
        '', // researched_contact_name
        '', // researched_contact_source — store/linkedin/founder-bio
        '', // outreach_status — pending/sent/replied/declined/converted
        '', // notes
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

main().catch((err) => {
  console.error('[export-design-partner-cohort] fatal', err);
  process.exit(1);
});
