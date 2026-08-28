#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * preview-outreach-email
 * ----------------------
 * Renders one outreach email (initial OR followup) from the canonical
 * template module. Pure-function — no DB, no network, no env beyond
 * what you pass on the CLI. Use as a pre-launch sanity check.
 *
 * Defaults to the matersandco.com canonical smoke fixture.
 *
 * Usage (from repo root):
 *   node apps/scanner/scripts/preview-outreach-email.mjs
 *   KIND=followup node apps/scanner/scripts/preview-outreach-email.mjs
 *   VARIANT=B SHOP=foo.co.uk SCORE=51 GRADE=D PRODUCT_COUNT=234 \
 *     FIRST_NAME=Jane SENDER=Abdur-Rahman \
 *     node apps/scanner/scripts/preview-outreach-email.mjs
 *
 * Env (all optional):
 *   KIND          'initial' | 'followup'  (default 'initial')
 *   VARIANT       'A' | 'B'                (default 'A')
 *   SHOP          shop_domain              (default 'matersandco.com')
 *   SCORE         integer                  (default 42)
 *   GRADE         single letter            (default 'D')
 *   PRODUCT_COUNT integer                  (default 318)
 *   FIRST_NAME    string or empty          (default 'Sam')
 *   SENDER        operator name            (default 'Abu')
 *   BASE_URL      site origin              (default 'https://catalog.flintmere.com')
 *   SOURCE        cohort source slug       (default 'discovery-2026-05-11')
 *   TARGET_ID     target id (UTM `t=`)     (default 'cuidpreview000000000000000')
 */

// MUST be invoked via `pnpm tsx scripts/preview-outreach-email.mjs`
// (tsx loader handles the .ts imports below).
import { renderInitialEmail, renderFollowupEmail } from '../src/lib/outreach/template.ts';
import { buildUnsubscribeUrl } from '../src/lib/outreach/unsubscribe.ts';

const KIND = process.env.KIND ?? 'initial';
const VARIANT = (process.env.VARIANT ?? 'A').toUpperCase() === 'B' ? 'B' : 'A';
const SHOP = process.env.SHOP ?? 'matersandco.com';
const SCORE = Number.parseInt(process.env.SCORE ?? '42', 10);
const GRADE = process.env.GRADE ?? 'D';
const PRODUCT_COUNT = Number.parseInt(process.env.PRODUCT_COUNT ?? '318', 10);
const FIRST_NAME = process.env.FIRST_NAME ?? 'Sam';
const SENDER = process.env.SENDER ?? 'Abu';
const BASE_URL = (process.env.BASE_URL ?? 'https://catalog.flintmere.com').replace(/\/+$/, '');
const SOURCE = process.env.SOURCE ?? 'discovery-2026-05-11';
const TARGET_ID = process.env.TARGET_ID ?? 'cuidpreview000000000000000';

if (KIND !== 'initial' && KIND !== 'followup') {
  console.error(`KIND must be 'initial' or 'followup'; got '${KIND}'`);
  process.exit(2);
}

// Reuse send.ts's own UTM appender by inlining the same logic
// (avoids importing send.ts which depends on Prisma).
function appendUtm(url) {
  const u = new URL(url);
  u.searchParams.set('utm_source', 'outreach');
  u.searchParams.set('utm_medium', 'email');
  u.searchParams.set('utm_campaign', SOURCE);
  u.searchParams.set('utm_content', KIND);
  u.searchParams.set('t', TARGET_ID);
  return u.toString();
}

// Build a fake but valid HMAC unsubscribe URL for the preview.
// Requires ADMIN_SESSION_SECRET env (any 32+ char string works for preview).
const ORIGINAL_SECRET = process.env.ADMIN_SESSION_SECRET;
if (!ORIGINAL_SECRET || ORIGINAL_SECRET.length < 32) {
  process.env.ADMIN_SESSION_SECRET = 'preview-only-secret-32-chars-minimum-padding';
}
const unsubscribeUrl = buildUnsubscribeUrl(TARGET_ID, BASE_URL);

const tplInput = {
  shopDomain: SHOP,
  shopName: SHOP,
  recipientFirstName: FIRST_NAME || null,
  score: SCORE,
  grade: GRADE,
  productCount: PRODUCT_COUNT,
  senderName: SENDER,
  variant: VARIANT,
  rescanUrl: appendUtm(`${BASE_URL}/scan?url=${encodeURIComponent(SHOP)}`),
  auditUrl: appendUtm(`${BASE_URL}/audit`),
  unsubscribeUrl,
};

const out =
  KIND === 'initial'
    ? renderInitialEmail(tplInput)
    : renderFollowupEmail(tplInput);

console.log('=========================================');
console.log(`PREVIEW · kind=${KIND} · variant=${VARIANT} · shop=${SHOP}`);
console.log('=========================================');
console.log('');
console.log(`SUBJECT: ${out.subject}`);
console.log('');
console.log('--- TEXT BODY ---');
console.log(out.bodyText);
console.log('');
console.log('--- HTML BODY (raw) ---');
console.log(out.bodyHtml);
console.log('');
console.log('--- TEMPLATE INPUT (for reference) ---');
console.log(JSON.stringify(tplInput, null, 2));
