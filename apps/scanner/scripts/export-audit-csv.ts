/**
 * export-audit-csv
 * ----------------
 * Concierge-audit fulfilment helper. Takes a shop URL, runs the same
 * public-fetch + scoring pipeline the live scanner uses, and writes
 * two operator artefacts:
 *
 *   data/audits/<domain>-<YYYY-MM-DD>.csv         per-product worst-first
 *   data/audits/<domain>-<YYYY-MM-DD>.summary.md  catalog-level findings
 *
 * Usage:
 *   SHOP=example.com pnpm --filter scanner audit:csv
 *   SHOP=https://farmgirl.com OUT=./scratch.csv pnpm --filter scanner audit:csv
 *   SHOP=mystore.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_xxx pnpm --filter scanner audit:csv
 *
 * Env:
 *   SHOP                 required — the merchant URL, with or without scheme
 *   OUT                  optional — override CSV path (summary.md sits beside it)
 *   MAX_PAGES            optional — public-fetch page cap (default 4 = 1,000 products)
 *   MAX_PRODUCTS         optional — admin-fetch product cap (default 5,000)
 *   SHOPIFY_ADMIN_TOKEN  optional — when set, uses Shopify Admin GraphQL
 *                        to pull metafields, GMC categories, and checkout
 *                        context (the three OAuth-locked pillars). Token
 *                        is never persisted; it lives only in this
 *                        process for the duration of the script run.
 *                        Reach via flintmere.com/secret (zero-knowledge).
 *
 * Coverage.
 *   - Without SHOPIFY_ADMIN_TOKEN: public /products.json scan — four
 *     pillars run (identifiers, titles, consistency, crawlability).
 *     Attributes, GMC mapping, and checkout eligibility stay locked.
 *   - With SHOPIFY_ADMIN_TOKEN: Admin GraphQL pull — same four pillars
 *     plus richer metafield + GMC-category + checkout-context data
 *     surfaced in the summary for the operator to fold into the letter.
 *     The three pillars stay structurally locked in the scoring engine
 *     for now (their checker implementations land in the next iteration);
 *     the admin pull populates the data they need so the next change is
 *     pure-engine work.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scoreCatalog, type Issue, type PillarId } from '@flintmere/scoring';

import { fetchCatalog, normaliseDomain } from '../src/lib/shopify-fetcher';
import { fetchCrawlability } from '../src/lib/crawlability-fetcher';
import {
  fetchCatalogViaAdmin,
  ShopifyAdminFetchError,
  type AdminFetchedCatalog,
} from '../src/lib/shopify-admin-fetcher';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const DEFAULT_OUT_DIR = resolve(REPO_ROOT, 'data', 'audits');

interface ProductRow {
  rank: number;
  severity_score: number;
  product_id: string;
  handle: string;
  title: string;
  url: string;
  variants: number;
  median_price: string;
  has_gtin: 'Y' | 'N';
  gtin_coverage: string;
  has_brand: 'Y' | 'N';
  has_alt_text_all: 'Y' | 'N';
  images_count: number;
  issues_count: number;
  issue_codes: string;
  suggested_fix: string;
}

const SEVERITY_WEIGHT: Record<Issue['severity'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const PILLAR_LABEL: Record<PillarId, string> = {
  identifiers: 'Product IDs',
  attributes: 'Structured attributes',
  titles: 'Title & description quality',
  mapping: 'Google category match',
  consistency: 'Data consistency',
  'checkout-eligibility': 'Agent checkout readiness',
  crawlability: 'AI agent access',
};

async function main(): Promise<void> {
  const shop = process.env.SHOP;
  if (!shop) {
    console.error(
      'Usage: SHOP=example.com pnpm --filter scanner audit:csv',
    );
    process.exit(1);
  }

  const maxPages = Number(process.env.MAX_PAGES ?? '4');
  const maxProducts = Number(process.env.MAX_PRODUCTS ?? '5000');
  const adminToken = process.env.SHOPIFY_ADMIN_TOKEN ?? null;

  const domain = normaliseDomain(shop);
  const today = new Date().toISOString().slice(0, 10);
  const baseName = `${domain.replace(/[^a-z0-9.-]/g, '_')}-${today}`;
  const csvPath =
    process.env.OUT ?? resolve(DEFAULT_OUT_DIR, `${baseName}.csv`);
  const summaryPath = csvPath.replace(/\.csv$/i, '.summary.md');

  let products: AdminFetchedCatalog['catalog']['products'];
  let truncated: boolean;
  let totalProductCount: number | null;
  let admin: AdminFetchedCatalog | null = null;

  if (adminToken) {
    console.log(`Fetching catalog via Shopify Admin GraphQL (${domain})…`);
    try {
      admin = await fetchCatalogViaAdmin(domain, adminToken, { maxProducts });
    } catch (err) {
      if (err instanceof ShopifyAdminFetchError) {
        console.error(`Admin fetch failed (${err.code}): ${err.message}`);
        console.error(
          'Either fix the token / shop / scopes and re-run, or remove SHOPIFY_ADMIN_TOKEN to fall back to the public scan.',
        );
        process.exit(1);
      }
      throw err;
    }
    products = admin.catalog.products;
    truncated = admin.truncated;
    totalProductCount = admin.totalProductCount;
    console.log(
      `Fetched ${products.length} products via admin` +
        (admin.truncated ? ` (capped at ${maxProducts}; merchant has ${admin.totalProductCount} total)` : ''),
    );
  } else {
    console.log(`Fetching catalog from ${domain} (public)…`);
    const fetched = await fetchCatalog(`https://${domain}`, { maxPages });
    products = fetched.catalog.products;
    truncated = fetched.truncated;
    totalProductCount = fetched.actualProductCount;
    console.log(
      `Fetched ${products.length} products` +
        (truncated
          ? ` (truncated; merchant has ${totalProductCount ?? 'unknown'} total)`
          : ''),
    );
  }

  console.log(`Fetching crawlability files…`);
  const crawl = await fetchCrawlability(domain);

  console.log(`Scoring…`);
  const catalog = admin?.catalog ?? { shopDomain: domain, products, scoredAt: new Date().toISOString() };
  const score = scoreCatalog(catalog, { crawlability: crawl });

  const rows = buildProductRows(products, score.issues, domain);

  await mkdir(dirname(csvPath), { recursive: true });
  await writeFile(csvPath, rowsToCsv(rows), 'utf8');
  await writeFile(
    summaryPath,
    buildSummary(score, { truncated, totalProductCount }, admin, domain),
    'utf8',
  );

  console.log(`\nWrote:`);
  console.log(`  ${csvPath}`);
  console.log(`  ${summaryPath}`);
  console.log(
    `\nScore ${score.score}/100 (${score.grade}) · ${score.productCount} products · ${score.variantCount} variants` +
      (admin ? ' · admin data captured' : ' · public data only'),
  );
}

function buildProductRows(
  products: { id: string; handle: string; title: string; variants: { price: string; barcode?: string | null }[]; images: { altText?: string | null }[]; vendor?: string | null; brandMetafield?: string | null }[],
  issues: Issue[],
  domain: string,
): ProductRow[] {
  const issuesByProduct = new Map<string, Issue[]>();
  for (const issue of issues) {
    for (const productId of issue.affectedProductIds) {
      const arr = issuesByProduct.get(productId) ?? [];
      arr.push(issue);
      issuesByProduct.set(productId, arr);
    }
  }

  const rows: ProductRow[] = products.map((product) => {
    const productIssues = issuesByProduct.get(product.id) ?? [];
    const severityScore = productIssues.reduce(
      (sum, issue) =>
        sum + SEVERITY_WEIGHT[issue.severity] * issue.revenueImpactScore,
      0,
    );

    const variantsWithGtin = product.variants.filter(
      (v) => v.barcode && v.barcode.trim(),
    ).length;
    const totalVariants = product.variants.length;
    const hasBrand =
      Boolean(product.brandMetafield && product.brandMetafield.trim()) ||
      Boolean(product.vendor && product.vendor.trim());
    const altTextAll =
      product.images.length > 0 &&
      product.images.every((i) => i.altText && i.altText.trim());

    const prices = product.variants
      .map((v) => Number.parseFloat(v.price))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const median =
      prices.length === 0
        ? 0
        : prices[Math.floor(prices.length / 2)] ?? 0;

    return {
      rank: 0,
      severity_score: severityScore,
      product_id: product.id,
      handle: product.handle,
      title: product.title,
      url: `https://${domain}/products/${product.handle}`,
      variants: totalVariants,
      median_price: median.toFixed(2),
      has_gtin: variantsWithGtin > 0 ? 'Y' : 'N',
      gtin_coverage: `${variantsWithGtin}/${totalVariants}`,
      has_brand: hasBrand ? 'Y' : 'N',
      has_alt_text_all: altTextAll ? 'Y' : 'N',
      images_count: product.images.length,
      issues_count: productIssues.length,
      issue_codes: productIssues
        .map((i) => i.code)
        .sort()
        .join('; '),
      suggested_fix: '',
    };
  });

  rows.sort((a, b) => b.severity_score - a.severity_score);
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  return rows;
}

function rowsToCsv(rows: ProductRow[]): string {
  const headers: (keyof ProductRow)[] = [
    'rank',
    'severity_score',
    'product_id',
    'handle',
    'title',
    'url',
    'variants',
    'median_price',
    'has_gtin',
    'gtin_coverage',
    'has_brand',
    'has_alt_text_all',
    'images_count',
    'issues_count',
    'issue_codes',
    'suggested_fix',
  ];

  const headerLine = headers.join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => csvCell(row[h])).join(','),
  );

  return [headerLine, ...dataLines].join('\n') + '\n';
}

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildSummary(
  score: ReturnType<typeof scoreCatalog>,
  meta: { truncated: boolean; totalProductCount: number | null },
  admin: AdminFetchedCatalog | null,
  domain: string,
): string {
  const lines: string[] = [];
  lines.push(`# Audit summary — ${domain}`);
  lines.push('');
  lines.push(`Scored at: ${score.scoredAt}`);
  lines.push(`Data source: ${admin ? 'Shopify Admin GraphQL (token-authorised)' : 'public /products.json'}`);
  lines.push(
    `Catalog: ${score.productCount} products · ${score.variantCount} variants` +
      (meta.truncated
        ? ` (sampled — merchant has ${meta.totalProductCount ?? 'unknown'} total)`
        : ''),
  );
  lines.push(`Score: **${score.score}/100** · grade **${score.grade}**`);
  lines.push(
    `Ceilings: gtinless ${score.gtinlessCeiling} · full ${score.fullCeiling}`,
  );
  lines.push('');
  lines.push('## Pillar breakdown');
  lines.push('');
  lines.push('| Pillar | Weight | Score | Status |');
  lines.push('| --- | --- | --- | --- |');
  for (const pillar of score.pillars) {
    const status = pillar.locked
      ? `locked — ${pillar.lockedReason ?? 'requires-install'}`
      : `${pillar.score}/${pillar.maxScore}`;
    lines.push(
      `| ${PILLAR_LABEL[pillar.pillar]} | ${pillar.weight} | ${pillar.locked ? '—' : pillar.score} | ${status} |`,
    );
  }
  lines.push('');
  lines.push('## Top issues (catalog-major)');
  lines.push('');
  if (score.issues.length === 0) {
    lines.push('None detected on public-data pillars.');
  } else {
    for (const issue of score.issues.slice(0, 10)) {
      lines.push(
        `- **${issue.title}** (${issue.severity}, ${PILLAR_LABEL[issue.pillar]}) — ${issue.description}`,
      );
    }
  }

  if (admin) {
    lines.push('');
    lines.push('## Admin-only data (token-captured, awaiting pillar implementations)');
    lines.push('');

    const productsWithMetafields = Array.from(admin.metafieldsByProduct.values()).filter((m) => m.length > 0).length;
    const productsWithGmcCategory = Array.from(admin.googleProductCategoryByProduct.values()).filter(Boolean).length;
    const totalProducts = admin.catalog.products.length;

    lines.push(
      `- **Structured-attribute coverage:** ${productsWithMetafields}/${totalProducts} products have at least one metafield. Sample namespaces: ${sampleMetafieldNamespaces(admin)}.`,
    );
    lines.push(
      `- **Google product category coverage:** ${productsWithGmcCategory}/${totalProducts} products have a category set. ${productsWithGmcCategory === 0 ? '*All uncategorised — high-priority finding for the letter.*' : ''}`,
    );
    lines.push(
      `- **Customer-accounts version:** ${admin.checkoutContext.customerAccountsVersion ?? 'not exposed by API version'} (relevant to checkout-eligibility for the agent-readiness pillar).`,
    );
    lines.push('');
    lines.push(
      `*The structured-attribute, GMC-mapping, and checkout-eligibility pillars are still locked in the scoring engine — the admin data above is for the operator to fold into the letter manually until the pillar checkers ship.*`,
    );
  }

  lines.push('');
  lines.push('## Letter-writing notes');
  lines.push('');
  if (admin) {
    lines.push(
      'The merchant provided an Admin token, so the metafield, GMC-category, and checkout-context data above is measured. Use those numbers in the letter alongside the four scored pillars.',
    );
  } else {
    lines.push(
      'Three pillars are locked behind OAuth on this public scan — *Structured attributes*, *Google category match*, *Agent checkout readiness*. The merchant can deepen the audit at any time by sending a read-only Shopify Admin token via flintmere.com/secret.',
    );
  }
  lines.push('');
  lines.push(
    `The CSV beside this file lists every product, sorted worst-first, with a blank \`suggested_fix\` column. Fill that column for the top N rows per band: Band 1 → top 10, Band 2 → top 25, Band 3 → top 25 from a representative sample.`,
  );
  lines.push('');
  return lines.join('\n');
}

function sampleMetafieldNamespaces(admin: AdminFetchedCatalog): string {
  const seen = new Set<string>();
  for (const fields of admin.metafieldsByProduct.values()) {
    for (const f of fields) seen.add(f.namespace);
    if (seen.size >= 5) break;
  }
  return seen.size === 0 ? 'none' : Array.from(seen).join(', ');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
