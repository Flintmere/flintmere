#!/usr/bin/env node
// Audit-assist v0 — Vertex auth + structured-output smoke gate.
//
// Build sequence step 2 hard gate. Operator runs this against the
// Coolify-deployed Vertex setup after the SA key + env vars are in
// place. If it fails, surface the gap before any UI sits on top of an
// unverified base.
//
// Usage:
//   pnpm -F @flintmere/llm build
//   pnpm -F @flintmere/llm smoke:audit-draft
//   # or with overrides:
//   node packages/llm/scripts/smoke-audit-draft.mjs --shop bluetokyo.co.uk --band band-1
//
// Required env:
//   GOOGLE_CLOUD_PROJECT          — e.g. "flintmere-production"
//
// Optional env:
//   GOOGLE_APPLICATION_CREDENTIALS — absolute path to the SA JSON key.
//                                    Unset → Vertex SDK falls back to
//                                    gcloud Application Default
//                                    Credentials (operator-side smoke).
//                                    Set → exact production auth path.
//   LLM_HARDCASE_MODEL             — defaults to "gemini-2.5-pro"
//   LLM_HARDCASE_REGION            — defaults to "europe-west1"

import { z } from 'zod';
import { draftAudit, VertexProvider } from '@flintmere/llm';

// ---- Args ----------------------------------------------------------

const args = parseArgs(process.argv.slice(2));
const shop = args.shop ?? 'bluetokyo.co.uk';
const band = args.band ?? 'band-1';

// ---- Env -----------------------------------------------------------

const project = required('GOOGLE_CLOUD_PROJECT');
const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credsMode = credsPath && credsPath.length > 0 ? 'sa-key' : 'adc';
const model = process.env.LLM_HARDCASE_MODEL ?? 'gemini-2.5-pro';
const location = process.env.LLM_HARDCASE_REGION ?? 'europe-west1';

console.log(
  JSON.stringify({
    event: 'smoke.start',
    project,
    location,
    model,
    shop,
    band,
    credsMode,
  }),
);

// ---- Vertex provider (no router — smoke calls Vertex directly so the
// raw error surfaces. The router + RejectingProvider wiring is unit-
// tested in audit-draft.test.ts; the production route handler at step 4
// rebuilds the router. Smoke is for validating the Vertex round-trip
// only, where a wrapped failover would swallow the diagnostic signal.) -

const vertex = new VertexProvider({
  project,
  location,
  model,
  inputPriceTenthPencePerMillion: 1000,
  outputPriceTenthPencePerMillion: 4000,
});

// ---- Smoke fixture (no Shopify fetch — we're testing Vertex only) ---

const systemPrompt = [
  "You are Flintmere's senior audit drafter. You produce a structured",
  'findings document strictly conforming to the supplied JSON schema.',
  'Voice: terse, evidence-first, British. No marketing language. No',
  'hedging adverbs. Confidence: 0.95+ for evidence, 0.6–0.85 for',
  'inference, below 0.6 for hypothesis. Never invent metrics — flag',
  'gaps as TBD strings in operatorTodos.',
  'Cardinality: exactly 7 pillarFindings, exactly 5 topPriorities.',
  'Output strict JSON only. No prose, no preamble, no code fences.',
].join('\n');

const userPrompt = [
  `Shop: ${shop}`,
  `Vertical: food`,
  `Audit band: ${band}`,
  '',
  '## Deterministic scan summary',
  'Overall score: 58/100 (grade D)',
  'Total products scanned: 42',
  '',
  'Per-pillar:',
  '  - identifiers: 30/100 (D) — 38 of 42 missing barcode',
  '  - titles: 70/100 (B) — three titles >120 chars',
  '  - consistency: 65/100 (C) — vendor field empty on 12 products',
  '  - crawlability: 80/100 (B) — sitemap.xml present, llms.txt absent',
  '  - attributes: 40/100 (D) — allergen statements unstructured on 27',
  '  - mapping: 50/100 (D) — Google product_type unset on 27',
  '  - checkout-eligibility: 90/100 (A) — all variants priced, available',
  '',
  '## Catalog sample (5 of 42 products)',
  'Format: title | vendor | type | tags | variants | price | images | barcode | alt-text',
  '',
  'Single-Origin Honey 340g | Blue Tokyo | Honey | honey,raw | 1v | £14.50 | images:y | barcode:n | alt:n',
  'Beeswax Candle Pillar | Blue Tokyo | Candles | candles,beeswax | 2v | £18.00–£24.00 | images:y | barcode:n | alt:y',
  'Coconut Oil Cold-Pressed 500ml | Blue Tokyo | Oils | coconut,raw | 1v | £11.00 | images:y | barcode:n | alt:n',
  'Honey & Beeswax Gift Jar | Blue Tokyo | Gifts | gift,honey | 1v | £29.00 | images:y | barcode:n | alt:n',
  'Beeswax Candle Tealights x6 | Blue Tokyo | Candles | candles | 1v | £12.00 | images:y | barcode:n | alt:n',
  '',
  '---',
  'Produce the structured findings document. Conform exactly to the supplied',
  'schema. Begin output now.',
].join('\n');

// ---- Schemas (smoke uses a tighter subset of the canonical) --------

const Confidence = z.number().min(0).max(1);
const Pillar = z.enum([
  'identifiers',
  'titles',
  'consistency',
  'crawlability',
  'attributes',
  'mapping',
  'checkout-eligibility',
]);

const SmokeSchema = z.object({
  meta: z.object({
    shop: z.string(),
    vertical: z.string(),
    bandSlug: z.enum(['band-1', 'band-2', 'band-3']),
    generatedAt: z.string(),
    model: z.string(),
    latencyMs: z.number(),
  }),
  executiveSummary: z.object({
    headline: z.string().max(180),
    body: z.string().max(900),
    confidence: Confidence,
  }),
  pillarFindings: z
    .array(
      z.object({
        pillar: Pillar,
        score: z.number().min(0).max(100),
        rating: z.enum(['A', 'B', 'C', 'D', 'F']),
        observations: z.string(),
        actionableFixes: z.array(z.unknown()),
        confidence: Confidence,
      }),
    )
    .length(7),
  topPriorities: z
    .array(
      z.object({
        rank: z.number().int(),
        title: z.string(),
        rationale: z.string(),
        pillarRef: Pillar,
        confidence: Confidence,
      }),
    )
    .length(5),
  estimatedRevenueImpact: z.object({
    available: z.boolean(),
    summary: z.string(),
  }),
  operatorTodos: z.array(z.string()),
});

const responseSchema = {
  type: 'object',
  properties: {
    meta: {
      type: 'object',
      properties: {
        shop: { type: 'string' },
        vertical: { type: 'string' },
        bandSlug: { type: 'string', enum: ['band-1', 'band-2', 'band-3'] },
        generatedAt: { type: 'string' },
        model: { type: 'string' },
        latencyMs: { type: 'integer', minimum: 0 },
      },
      required: ['shop', 'vertical', 'bandSlug', 'generatedAt', 'model', 'latencyMs'],
    },
    executiveSummary: {
      type: 'object',
      properties: {
        headline: { type: 'string', maxLength: 180 },
        body: { type: 'string', maxLength: 900 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['headline', 'body', 'confidence'],
    },
    pillarFindings: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: {
        type: 'object',
        properties: {
          pillar: { type: 'string', enum: Pillar.options },
          score: { type: 'number', minimum: 0, maximum: 100 },
          rating: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
          observations: { type: 'string' },
          actionableFixes: { type: 'array', items: { type: 'object' } },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['pillar', 'score', 'rating', 'observations', 'actionableFixes', 'confidence'],
      },
    },
    topPriorities: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          rank: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string' },
          rationale: { type: 'string' },
          pillarRef: { type: 'string', enum: Pillar.options },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['rank', 'title', 'rationale', 'pillarRef', 'confidence'],
      },
    },
    estimatedRevenueImpact: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        summary: { type: 'string' },
      },
      required: ['available', 'summary'],
    },
    operatorTodos: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'meta',
    'executiveSummary',
    'pillarFindings',
    'topPriorities',
    'estimatedRevenueImpact',
    'operatorTodos',
  ],
};

// ---- Run -----------------------------------------------------------

try {
  const start = Date.now();
  const result = await draftAudit({
    complete: (opts) => vertex.complete(opts),
    systemPrompt,
    userPrompt,
    schema: SmokeSchema,
    responseSchema,
    maxOutputTokens: 8192,
    temperature: 0.2,
    requestId: `smoke-${Date.now()}`,
    tag: 'smoke-audit-draft',
  });
  const wall = Date.now() - start;

  console.log(
    JSON.stringify(
      {
        event: 'smoke.success',
        wallMs: wall,
        attempts: result.attempts,
        latencyMs: result.latencyMsTotal,
        costTenthPence: result.costTenthPenceTotal,
        headline: result.data.executiveSummary.headline,
        pillarCount: result.data.pillarFindings.length,
        priorityCount: result.data.topPriorities.length,
        operatorTodosCount: result.data.operatorTodos.length,
      },
      null,
      2,
    ),
  );
  process.exit(0);
} catch (err) {
  console.error(
    JSON.stringify(
      {
        event: 'smoke.failure',
        message: err?.message ?? String(err),
        code: err?.code,
        provider: err?.provider,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

// ---- Helpers -------------------------------------------------------

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a?.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(
      JSON.stringify({ event: 'smoke.failure', message: `Missing required env: ${name}` }),
    );
    process.exit(1);
  }
  return v;
}
