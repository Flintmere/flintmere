#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * discover-from-list-articles
 * ---------------------------
 * Plan-B discovery: harvest brand websites by traversing "List of X"
 * Wikipedia articles' WIKILINKS (internal article references), then
 * fetching extlinks per linked article and applying the same
 * official-URL heuristic.
 *
 * Wikipedia's "List of brand" articles tend to link to brand articles
 * via [[Article Name]] wikilinks. Each linked article is usually a
 * brand article with an infobox URL. Yield per list article ~50-200.
 *
 * Usage (from repo root):
 *   node apps/scanner/scripts/discover-from-list-articles.mjs
 *
 * Env:
 *   OUTPUT_DIR  default: data/discovery/<UTC>-lists
 *   DELAY_MS    default: 250
 */

import { mkdir, appendFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const UA = 'FlintmereBot/1.0 (+https://audit.flintmere.com/bot; ops@flintmere.com)';
const API = 'https://en.wikipedia.org/w/api.php';
const DELAY_MS = Number.parseInt(process.env.DELAY_MS ?? '250', 10);

function todayUtc() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const OUTPUT_DIR =
  process.env.OUTPUT_DIR ?? resolve(REPO_ROOT, 'data/discovery', `${todayUtc()}-lists`);

const LIST_ARTICLES = [
  'List_of_coffee_companies',
  'List_of_chocolate_companies',
  'List_of_chocolate_brands',
  'List_of_confectionery_brands',
  'List_of_tea_companies',
  'List_of_breakfast_cereals',
  'List_of_dairy_product_brands',
  'List_of_cheese_brands',
  'List_of_ice_cream_brands',
  'List_of_olive_oil_brands',
  'List_of_hot_sauces',
  'List_of_sodas',
  'List_of_pasta',
  'List_of_microbreweries',
  'List_of_breweries_in_the_United_States',
  'List_of_breweries_in_England',
  'List_of_potato_chip_brands',
  'List_of_pet_food_brands',
  'List_of_food_companies_of_the_United_Kingdom',
  'List_of_British_food_and_drink_companies',
  'List_of_breakfast_foods',
  'List_of_cookies',
  'List_of_cured_meats',
  'List_of_dairy_products',
  'List_of_drinks',
  'List_of_energy_drinks',
  'List_of_juice_brands',
  'List_of_meat_substitutes',
  'List_of_yogurts',
  'List_of_protein_bars',
  'List_of_pre-workout_supplements',
  'List_of_dietary_supplements',
  'List_of_vegan_brands',
  'List_of_organic_food_brands',
];

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
  'amazon.com',
  'amazon.co.uk',
  'ebay.com',
  'walmart.com',
  'target.com',
  'google.com',
  'crunchbase.com',
  'companieshouse.gov.uk',
  'opencorporates.com',
  'allrecipes.com',
  'foodnetwork.com',
  'businesswire.com',
  'prnewswire.com',
  'globenewswire.com',
]);

const NOISE_HOST_PATTERNS = [/\.gov\b/i, /\.edu\b/i, /\.ac\.[a-z]+$/i];
const NOISE_PATH_PATTERNS = [/\.pdf$/i, /\.doc[xm]?$/i];

function isNoiseUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return true;
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (NOISE_DOMAINS.has(host)) return true;
    for (const p of NOISE_HOST_PATTERNS) if (p.test(host)) return true;
    for (const p of NOISE_PATH_PATTERNS) if (p.test(u.pathname)) return true;
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

function tokenise(s) {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !/^(the|and|inc|llc|ltd|company|corp|corporation|group|brands|holdings)$/i.test(t));
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const u = new URL(API);
  u.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString();
  const res = await fetch(u, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Fetch all wikilinks (internal article references) from a list article. */
async function getWikilinks(title) {
  const links = [];
  let plcontinue;
  let safety = 0;
  do {
    const params = {
      action: 'query',
      prop: 'links',
      titles: title,
      pllimit: '500',
      plnamespace: '0',
    };
    if (plcontinue) params.plcontinue = plcontinue;
    let data;
    try {
      data = await api(params);
    } catch (err) {
      console.log(`    [warn] ${err.message}`);
      break;
    }
    const pages = data.query?.pages ?? [];
    for (const page of pages) {
      for (const l of page.links ?? []) links.push(l.title);
    }
    plcontinue = data.continue?.plcontinue;
    await delay(DELAY_MS);
    safety += 1;
  } while (plcontinue && safety < 20);
  return links;
}

/** Convert article titles to page IDs in chunks of 50. */
async function titlesToPageIds(titles) {
  const result = new Map(); // title -> pageId
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const params = {
      action: 'query',
      titles: chunk.join('|'),
      prop: 'info',
    };
    let data;
    try {
      data = await api(params);
    } catch (err) {
      console.log(`    [warn] titlesToPageIds: ${err.message}`);
      continue;
    }
    for (const page of data.query?.pages ?? []) {
      if (typeof page.pageid === 'number') {
        result.set(page.title, page.pageid);
      }
    }
    await delay(DELAY_MS);
  }
  return result;
}

/** Fetch extlinks + title for many page IDs. */
async function getPagesWithLinks(pageIds) {
  const out = new Map();
  for (let i = 0; i < pageIds.length; i += 50) {
    const chunk = pageIds.slice(i, i + 50);
    let elcontinue;
    let safety = 0;
    const accum = new Map();
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
        data = await api(params);
      } catch (err) {
        console.log(`    [warn] getPagesWithLinks: ${err.message}`);
        break;
      }
      for (const page of data.query?.pages ?? []) {
        const pid = page.pageid;
        if (!accum.has(pid)) accum.set(pid, { title: page.title, links: [] });
        const links = (page.extlinks ?? []).map((l) => (typeof l === 'string' ? l : l.url ?? l['*']));
        accum.get(pid).links.push(...links.filter(Boolean));
      }
      elcontinue = data.continue?.elcontinue;
      await delay(DELAY_MS);
      safety += 1;
    } while (elcontinue && safety < 6);
    for (const [k, v] of accum) out.set(k, v);
  }
  return out;
}

function pickOfficialUrl(title, links) {
  const cleaned = [];
  for (const link of links) {
    if (isNoiseUrl(link)) continue;
    const domain = normaliseDomain(link);
    if (!domain) continue;
    cleaned.push({ link, domain });
  }
  if (cleaned.length === 0) return null;
  const tokens = tokenise(title);
  if (tokens.length > 0) {
    const matched = cleaned.find(({ domain }) => tokens.some((t) => domain.includes(t)));
    if (matched) return matched.domain;
  }
  return cleaned[0].domain;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const outPath = resolve(OUTPUT_DIR, 'candidates-list-articles.csv');
  const reportPath = resolve(OUTPUT_DIR, 'candidates-list-articles.report.json');
  await writeFile(outPath, 'url,vertical\n', 'utf8');

  const seenDomains = new Set();
  const allWikilinks = new Set();
  const startedAt = new Date().toISOString();
  const summary = [];

  // Step 1: gather wikilinks from each list article.
  for (const article of LIST_ARTICLES) {
    console.log(`\n[lists] ${article}`);
    let wikilinks = [];
    try {
      wikilinks = await getWikilinks(article);
    } catch (err) {
      console.log(`  [skip] ${err.message}`);
      summary.push({ article, wikilinks: 0, error: err.message });
      continue;
    }
    const fresh = wikilinks.filter((t) => !allWikilinks.has(t));
    for (const t of fresh) allWikilinks.add(t);
    console.log(`  wikilinks=${wikilinks.length} fresh=${fresh.length}`);
    summary.push({ article, wikilinks: wikilinks.length, fresh: fresh.length });
  }

  console.log(`\n[lists] total unique wikilinks gathered: ${allWikilinks.size}`);

  // Step 2: convert titles to page IDs in batches.
  const titles = [...allWikilinks];
  console.log(`[lists] resolving ${titles.length} titles to page IDs...`);
  const titleToId = await titlesToPageIds(titles);
  const pageIds = [...new Set(titleToId.values())];
  console.log(`[lists] resolved ${pageIds.length} page IDs`);

  // Step 3: fetch extlinks for each page, pick official URL.
  console.log(`[lists] fetching extlinks for ${pageIds.length} articles...`);
  const pages = await getPagesWithLinks(pageIds);
  let added = 0;
  for (const [, { title, links }] of pages) {
    const domain = pickOfficialUrl(title, links);
    if (!domain) continue;
    if (seenDomains.has(domain)) continue;
    seenDomains.add(domain);
    await appendFile(outPath, `https://${domain},food-and-drink\n`, 'utf8');
    added += 1;
  }

  await writeFile(
    reportPath,
    JSON.stringify(
      {
        startedAt,
        finishedAt: new Date().toISOString(),
        outputCsv: outPath,
        listArticles: LIST_ARTICLES.length,
        uniqueWikilinks: allWikilinks.size,
        resolvedPageIds: pageIds.length,
        candidatesAdded: added,
        perList: summary,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`\n[lists] done. ${added} unique candidate domains in ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
