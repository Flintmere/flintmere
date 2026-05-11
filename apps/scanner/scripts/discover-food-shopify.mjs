#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * discover-food-shopify
 * --------------------
 * Wikipedia-driven discovery of global food/drink company domains.
 * Crawls a curated list of Wikipedia categories, extracts the most
 * likely "official website" external link per article via simple
 * heuristics, and emits a candidates CSV that compile-store-list
 * can validate as Shopify.
 *
 * Output: data/discovery/<date>/candidates-wikipedia.csv
 *
 * Kindness: 250ms between API calls, FlintmereBot UA, no auth bypass.
 * Wikipedia's MediaWiki API allows ~200 req/sec anon; we run well below.
 *
 * Usage (from repo root):
 *   node apps/scanner/scripts/discover-food-shopify.mjs
 *
 * Env overrides:
 *   OUTPUT_DIR  default: data/discovery/<UTC YYYY-MM-DD>
 *   DELAY_MS    default: 250
 *   MAX_PAGES_PER_CATEGORY  default: 1000  (safety brake on giant cats)
 */

import { mkdir, appendFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const UA = 'FlintmereBot/1.0 (+https://audit.flintmere.com/bot; ops@flintmere.com)';
const API = 'https://en.wikipedia.org/w/api.php';
const DELAY_MS = Number.parseInt(process.env.DELAY_MS ?? '250', 10);
const MAX_PAGES_PER_CATEGORY = Number.parseInt(
  process.env.MAX_PAGES_PER_CATEGORY ?? '1000',
  10,
);

function todayUtc() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const OUTPUT_DIR =
  process.env.OUTPUT_DIR ?? resolve(REPO_ROOT, 'data/discovery', todayUtc());

const DEFAULT_SEED_CATEGORIES = [
  'Category:Food_and_drink_companies_of_the_United_States',
  'Category:Food_and_drink_companies_of_the_United_Kingdom',
  'Category:Food_and_drink_companies_of_Canada',
  'Category:Food_and_drink_companies_of_Australia',
  'Category:Food_and_drink_companies_of_Germany',
  'Category:Food_and_drink_companies_of_France',
  'Category:Food_and_drink_companies_of_Italy',
  'Category:Food_and_drink_companies_of_Spain',
  'Category:Food_and_drink_companies_of_the_Netherlands',
  'Category:Food_and_drink_companies_of_Japan',
  'Category:Food_and_drink_companies_of_India',
  'Category:Food_and_drink_companies_of_New_Zealand',
  'Category:Food_and_drink_companies_of_Ireland',
  'Category:Food_and_drink_companies_of_Sweden',
  'Category:Food_and_drink_companies_of_Norway',
  'Category:Food_and_drink_companies_of_Denmark',
  'Category:Coffee_companies',
  'Category:Tea_companies',
  'Category:Chocolate_companies',
  'Category:Confectionery_companies',
  'Category:Snack_food_manufacturers',
  'Category:Soft_drink_manufacturers',
  'Category:Soft_drink_brands',
  'Category:Bakeries',
  'Category:Wineries',
  'Category:Brewing_companies',
  'Category:Distilleries',
  'Category:Pasta_manufacturers',
  'Category:Cheese_brands',
  'Category:Honey_brands',
  'Category:Hot_sauce_brands',
  'Category:Spice_companies',
  'Category:Olive_oil_brands',
  'Category:Dietary_supplement_brands',
  'Category:Energy_drinks',
  'Category:Health_food_brands',
  'Category:Vegetarian_restaurant_chains',
  'Category:Pet_food_brands',
];

const ROUND2_SEED_CATEGORIES = [
  // Broader food + drink categories I missed in round 1
  'Category:Ice_cream_brands',
  'Category:Candy_brands',
  'Category:Beverage_companies',
  'Category:Bakery_brands',
  'Category:Breakfast_foods',
  'Category:Frozen_food_brands',
  'Category:Dairy_products_companies',
  'Category:Meat_processing_companies',
  'Category:Seafood_companies',
  'Category:Wine_brands',
  'Category:Beer_brands',
  'Category:Whisky_distilleries',
  'Category:Vegan_food_companies',
  'Category:Organic_food_companies',
  'Category:Fair_trade_companies',
  'Category:Cereal_brands',
  'Category:Energy_bar_manufacturers',
  'Category:Sauce_manufacturers',
  'Category:Tea_brands',
  'Category:Coffee_brands',
  // Country subcategories I missed
  'Category:Food_and_drink_companies_of_China',
  'Category:Food_and_drink_companies_of_South_Africa',
  'Category:Food_and_drink_companies_of_Brazil',
  'Category:Food_and_drink_companies_of_Mexico',
  'Category:Food_and_drink_companies_of_Belgium',
  'Category:Food_and_drink_companies_of_Switzerland',
  'Category:Food_and_drink_companies_of_Finland',
  'Category:Food_and_drink_companies_of_Austria',
  'Category:Food_and_drink_companies_of_Poland',
  'Category:Food_and_drink_companies_of_Greece',
  'Category:Food_and_drink_companies_of_Portugal',
  'Category:Food_and_drink_companies_of_South_Korea',
  // "List of" pages — high-yield aggregator articles
  'List_of_coffee_companies',
  'List_of_chocolate_companies',
  'List_of_confectionery_brands',
  'List_of_tea_companies',
  'List_of_breakfast_cereals',
  'List_of_dairy_product_brands',
  'List_of_ice_cream_brands',
  'List_of_olive_oil_brands',
  'List_of_hot_sauces',
  'List_of_sodas',
  'List_of_breweries',
  'List_of_microbreweries',
  'List_of_artisanal_food_brands',
  'List_of_pasta',
];

// Read SEED_SET env: 'round1' | 'round2' | 'all' (default round1).
const SEED_SET = process.env.SEED_SET ?? 'round1';
const SEED_CATEGORIES =
  SEED_SET === 'round2'
    ? ROUND2_SEED_CATEGORIES
    : SEED_SET === 'all'
      ? [...DEFAULT_SEED_CATEGORIES, ...ROUND2_SEED_CATEGORIES]
      : DEFAULT_SEED_CATEGORIES;

// Domains we KNOW are not the official-website target.
const NOISE_DOMAINS = new Set([
  'wikipedia.org',
  'en.wikipedia.org',
  'commons.wikimedia.org',
  'wikidata.org',
  'web.archive.org',
  'archive.org',
  'archive.is',
  'archive.today',
  'sec.gov',
  'edgar.sec.gov',
  'twitter.com',
  'x.com',
  'facebook.com',
  'linkedin.com',
  'instagram.com',
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'pinterest.com',
  'reddit.com',
  'doi.org',
  'jstor.org',
  'crossref.org',
  'pubmed.ncbi.nlm.nih.gov',
  'reuters.com',
  'bloomberg.com',
  'forbes.com',
  'wsj.com',
  'nytimes.com',
  'theguardian.com',
  'bbc.co.uk',
  'bbc.com',
  'cnn.com',
  'cnbc.com',
  'ft.com',
  'businessinsider.com',
  'amazon.com',
  'amazon.co.uk',
  'ebay.com',
  'walmart.com',
  'target.com',
  'google.com',
  'goo.gl',
  'maps.google.com',
  'scholar.google.com',
  'books.google.com',
  'news.google.com',
  'crunchbase.com',
  'companieshouse.gov.uk',
  'opencorporates.com',
  'allrecipes.com',
  'foodnetwork.com',
  'epicurious.com',
  'theverge.com',
  'techcrunch.com',
  'eater.com',
  'thrillist.com',
  'businesswire.com',
  'prnewswire.com',
  'globenewswire.com',
  'macrumors.com',
  'wired.com',
  'fortune.com',
  'usatoday.com',
  'washingtonpost.com',
  'flickr.com',
  'imdb.com',
]);

const NOISE_HOST_PATTERNS = [
  /\.gov\b/i,
  /\.edu\b/i,
  /\.ac\.[a-z]+$/i,
  /^web\.archive\.org$/i,
];

const NOISE_PATH_PATTERNS = [
  /\.pdf$/i,
  /\.doc[xm]?$/i,
  /\.xls[xm]?$/i,
  /\.zip$/i,
  /\.csv$/i,
];

function isNoiseUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return true;
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (NOISE_DOMAINS.has(host)) return true;
    for (const pattern of NOISE_HOST_PATTERNS) if (pattern.test(host)) return true;
    for (const pattern of NOISE_PATH_PATTERNS) if (pattern.test(u.pathname)) return true;
    return false;
  } catch {
    return true;
  }
}

function normaliseDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function tokeniseTitle(title) {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !/^(the|and|inc|llc|ltd|company|corp|corporation|group|brands|holdings)$/i.test(t));
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiQuery(params) {
  const u = new URL(API);
  u.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString();
  const res = await fetch(u, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${u.search.slice(0, 80)}`);
  return res.json();
}

async function getCategoryPageIds(category) {
  const ids = [];
  let cmcontinue;
  let safety = 0;
  do {
    const params = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmlimit: '500',
      cmtype: 'page',
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;
    let data;
    try {
      data = await apiQuery(params);
    } catch (err) {
      console.log(`    [warn] members query failed: ${err.message}`);
      break;
    }
    for (const m of data.query?.categorymembers ?? []) ids.push(m.pageid);
    cmcontinue = data.continue?.cmcontinue;
    await delay(DELAY_MS);
    safety += 1;
    if (ids.length >= MAX_PAGES_PER_CATEGORY) {
      console.log(`    [info] hit MAX_PAGES_PER_CATEGORY (${MAX_PAGES_PER_CATEGORY})`);
      break;
    }
  } while (cmcontinue && safety < 30);
  return ids;
}

/**
 * Fetch external links + title for a chunk of page IDs.
 * Returns Map<pageId, { title: string, links: string[] }>.
 */
async function getPagesWithLinks(pageIds) {
  const out = new Map();
  for (let i = 0; i < pageIds.length; i += 50) {
    const chunk = pageIds.slice(i, i + 50);
    let elcontinue;
    let safety = 0;
    const accumulator = new Map();
    do {
      const params = {
        action: 'query',
        prop: 'extlinks|info',
        pageids: chunk.join('|'),
        ellimit: '500',
      };
      if (elcontinue) params.elcontinue = elcontinue;
      let data;
      try {
        data = await apiQuery(params);
      } catch (err) {
        console.log(`    [warn] extlinks query failed: ${err.message}`);
        break;
      }
      for (const page of data.query?.pages ?? []) {
        const pid = page.pageid;
        if (!accumulator.has(pid)) accumulator.set(pid, { title: page.title, links: [] });
        const links = (page.extlinks ?? []).map((l) => (typeof l === 'string' ? l : l.url ?? l['*']));
        accumulator.get(pid).links.push(...links.filter(Boolean));
      }
      elcontinue = data.continue?.elcontinue;
      await delay(DELAY_MS);
      safety += 1;
    } while (elcontinue && safety < 6);
    for (const [k, v] of accumulator) out.set(k, v);
  }
  return out;
}

/**
 * Pick the most likely "official website" URL from a list of extlinks.
 *  1. Drop noise.
 *  2. Prefer URLs whose host shares a token with the page title.
 *  3. Otherwise the first remaining URL.
 *  4. Always normalise to bare domain (strip www., path, query).
 */
function pickOfficialUrl(title, links) {
  const cleaned = [];
  for (const link of links) {
    if (isNoiseUrl(link)) continue;
    const domain = normaliseDomain(link);
    if (!domain) continue;
    cleaned.push({ link, domain });
  }
  if (cleaned.length === 0) return null;

  const tokens = tokeniseTitle(title);
  if (tokens.length > 0) {
    const matched = cleaned.find(({ domain }) =>
      tokens.some((t) => domain.includes(t)),
    );
    if (matched) return matched.domain;
  }
  return cleaned[0].domain;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const outPath = resolve(OUTPUT_DIR, 'candidates-wikipedia.csv');
  const reportPath = resolve(OUTPUT_DIR, 'candidates-wikipedia.report.json');
  await writeFile(outPath, 'url,vertical\n', 'utf8');

  const seenDomains = new Set();
  const seenPageIds = new Set();
  const summary = [];
  let total = 0;
  const startedAt = new Date().toISOString();

  for (const category of SEED_CATEGORIES) {
    console.log(`\n[wiki] ${category}`);
    let pageIds;
    try {
      pageIds = await getCategoryPageIds(category);
    } catch (err) {
      console.log(`  [skip] ${err.message}`);
      summary.push({ category, members: 0, added: 0, error: err.message });
      continue;
    }
    const fresh = pageIds.filter((id) => !seenPageIds.has(id));
    for (const id of fresh) seenPageIds.add(id);
    console.log(`  members=${pageIds.length} fresh=${fresh.length}`);
    if (fresh.length === 0) {
      summary.push({ category, members: pageIds.length, added: 0 });
      continue;
    }

    let pages;
    try {
      pages = await getPagesWithLinks(fresh);
    } catch (err) {
      console.log(`  [skip extlinks] ${err.message}`);
      summary.push({ category, members: pageIds.length, added: 0, error: err.message });
      continue;
    }

    let added = 0;
    for (const [, { title, links }] of pages) {
      const domain = pickOfficialUrl(title, links);
      if (!domain) continue;
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);
      const cleanUrl = `https://${domain}`;
      await appendFile(outPath, `${cleanUrl},food-and-drink\n`, 'utf8');
      added += 1;
      total += 1;
    }
    console.log(`  +${added} (total=${total})`);
    summary.push({ category, members: pageIds.length, added });
  }

  await writeFile(
    reportPath,
    JSON.stringify(
      {
        startedAt,
        finishedAt: new Date().toISOString(),
        outputCsv: outPath,
        totalUniqueDomains: total,
        seedCategories: SEED_CATEGORIES.length,
        perCategory: summary,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`\n[wiki] done. ${total} unique candidate domains in ${outPath}`);
  console.log(`[wiki] report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
