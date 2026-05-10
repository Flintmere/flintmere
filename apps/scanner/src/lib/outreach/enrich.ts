/**
 * Auto-enrichment for outreach targets. Fetches each merchant's public
 * About + Contact pages, runs them through a regex pre-pass + Gemini
 * 2.5 Flash structured extraction, returns an EnrichmentDraft that the
 * admin UI can preview and apply with one click.
 *
 * Kindness-contract invariant: the LLM is prompted to extract ONLY
 * what is literally on the page — no inference, no fabrication. Strict
 * Zod validation rejects malformed output. The auto-apply path requires
 * confidence='high' AND email-domain matches the shop_domain.
 *
 * Cost: ~2K input tokens × 117 targets ≈ negligible on Gemini Flash.
 *
 * Politeness: per-target sequential fetch with 1s spacing inside this
 * function; cron schedules its own per-batch rate-limit on top.
 */

import { z } from 'zod';
import { VertexProvider } from '@flintmere/llm';
import type { CompletionOpts } from '@flintmere/llm';

const FETCH_TIMEOUT_MS = 5_000;
const MAX_BODY_BYTES = 200_000;
const MAX_HTML_FOR_LLM = 50_000;

const CANDIDATE_PATHS = [
  '/contact',
  '/contact-us',
  '/pages/contact',
  '/pages/contact-us',
  '/about',
  '/about-us',
  '/pages/about',
  '/pages/about-us',
  '/',
] as const;

const USER_AGENT = 'FlintmereBot/1.0 (+enrichment; https://flintmere.com)';

// ---- Result types ----

export type Confidence = 'high' | 'medium' | 'low' | 'none';

export interface EnrichedField<T> {
  value: T | null;
  confidence: Confidence;
  source: string | null;
  extractedBy: 'regex' | 'llm' | 'none';
  notes?: string;
}

export interface EnrichmentDraft {
  recipientEmail: EnrichedField<string>;
  firstName: EnrichedField<string>;
  fetchedPages: Array<{ url: string; status: number; bytes: number }>;
  llmReasoning: string;
  extractedAt: string;
}

export interface EnrichmentSuccess {
  ok: true;
  draft: EnrichmentDraft;
}

export interface EnrichmentFailure {
  ok: false;
  reason: 'unreachable' | 'parse-error' | 'llm-error' | 'no-pages-fetched';
  message: string;
  pagesAttempted: Array<{ url: string; status: number | null; error?: string }>;
}

export type EnrichmentResult = EnrichmentSuccess | EnrichmentFailure;

// ---- Page fetching ----

async function fetchPage(
  url: string,
): Promise<{ url: string; status: number; html: string | null; bytes: number; error?: string }> {
  try {
    const ctl = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: ctl,
    });
    if (!res.ok) {
      return { url, status: res.status, html: null, bytes: 0 };
    }
    // Stream a bounded byte count.
    const reader = res.body?.getReader();
    if (!reader) return { url, status: res.status, html: null, bytes: 0 };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      chunks.push(value);
    }
    await reader.cancel().catch(() => {});
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const html = buf.toString('utf8');
    return { url, status: res.status, html, bytes: html.length };
  } catch (err) {
    return {
      url,
      status: 0,
      html: null,
      bytes: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function stripHtmlNoise(html: string): string {
  // Remove scripts + styles + svg blocks; collapse whitespace. Keep
  // mailto: + visible text.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---- Regex pre-pass ----

const EMAIL_RE = /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
const MAILTO_RE = /href\s*=\s*"mailto:([^"?]+)"/gi;

function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = MAILTO_RE.exec(html))) {
    if (m[1]) found.add(m[1].toLowerCase().trim());
  }
  const visible = stripHtmlNoise(html);
  while ((m = EMAIL_RE.exec(visible))) {
    if (m[1]) found.add(m[1].toLowerCase().trim());
  }
  return Array.from(found).filter((e) => !e.includes('example.com') && !e.includes('@sentry.io'));
}

function pickBestEmail(emails: string[], shopDomain: string): string | null {
  if (emails.length === 0) return null;
  const apex = shopDomain.replace(/^www\./, '');
  // Prefer emails on the shop's own apex domain (hello@origincoffee.co.uk over hello@gmail.com).
  const onDomain = emails.find((e) => e.endsWith(`@${apex}`) || e.endsWith(`@www.${apex}`));
  if (onDomain) return onDomain;
  // Otherwise take the first non-generic looking address.
  const filtered = emails.filter((e) => !/(noreply|no-reply|donotreply)/i.test(e));
  return filtered[0] ?? emails[0] ?? null;
}

// ---- LLM extraction ----

const LlmSchema = z.object({
  email: z.object({
    value: z.string().nullable(),
    confidence: z.enum(['high', 'medium', 'low']).nullable(),
    quote: z.string().nullable(),
  }),
  firstName: z.object({
    value: z.string().nullable(),
    confidence: z.enum(['high', 'medium', 'low']).nullable(),
    quote: z.string().nullable(),
  }),
  reasoning: z.string().max(500),
});

type LlmExtraction = z.infer<typeof LlmSchema>;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    email: {
      type: 'object',
      properties: {
        value: { type: 'string', nullable: true },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'], nullable: true },
        quote: { type: 'string', nullable: true },
      },
      required: ['value', 'confidence', 'quote'],
    },
    firstName: {
      type: 'object',
      properties: {
        value: { type: 'string', nullable: true },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'], nullable: true },
        quote: { type: 'string', nullable: true },
      },
      required: ['value', 'confidence', 'quote'],
    },
    reasoning: { type: 'string' },
  },
  required: ['email', 'firstName', 'reasoning'],
} as const;

function buildSystemPrompt(): string {
  return [
    'You extract structured contact data from a Shopify merchant\'s public website HTML.',
    'Your job is to find:',
    '  1. The merchant\'s primary contact email (preferably on their own domain).',
    '  2. The first name of the merchant\'s founder, owner, or primary contact person.',
    '',
    'STRICT RULES (the kindness contract):',
    '  - Only return values that appear LITERALLY in the supplied HTML. Never guess. Never invent.',
    '  - If a name appears only in a customer review or testimonial, that is NOT the founder. Set value to null.',
    '  - Confidence "high" = the value is plainly stated (e.g., "Founded by Sarah Jones in 2014").',
    '  - Confidence "medium" = the value is named on the site but with some ambiguity (e.g., "Our team: Sarah, James, Mike" — first listed is plausibly the lead).',
    '  - Confidence "low" = the value is mentioned but you\'re unsure if it\'s the right person.',
    '  - If you can\'t find a value, return null for both `value` and `confidence`.',
    '  - The `quote` field MUST be a substring of the supplied HTML (the literal text where you found the value). If null, omit the quote.',
    '',
    'Return JSON matching the response schema. Keep `reasoning` to one sentence.',
  ].join('\n');
}

function buildUserPrompt(shopDomain: string, html: string): string {
  return [
    `Shop domain: ${shopDomain}`,
    '',
    'HTML (truncated to public About + Contact pages, scripts and styles stripped):',
    '---',
    html.slice(0, MAX_HTML_FOR_LLM),
    '---',
  ].join('\n');
}

function buildVertex(env: NodeJS.ProcessEnv): VertexProvider {
  const project = env.GOOGLE_CLOUD_PROJECT;
  if (!project) {
    throw new Error('GOOGLE_CLOUD_PROJECT not set');
  }
  return new VertexProvider({
    project,
    location: env.GOOGLE_CLOUD_LOCATION ?? 'europe-west1',
    model: env.OUTREACH_ENRICH_MODEL ?? 'gemini-2.5-flash',
  });
}

async function callLlm(
  vertex: VertexProvider,
  shopDomain: string,
  html: string,
  tag: string,
): Promise<LlmExtraction> {
  const opts: CompletionOpts = {
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(shopDomain, html) },
    ],
    maxOutputTokens: 1024,
    temperature: 0,
    responseMimeType: 'application/json',
    responseSchema: RESPONSE_SCHEMA,
    tag,
  };
  const result = await vertex.complete(opts);
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch (err) {
    throw new Error(`llm-output-not-json: ${err instanceof Error ? err.message : 'unknown'}`);
  }
  return LlmSchema.parse(parsed);
}

// ---- Orchestrator ----

export interface EnrichOptions {
  shopDomain: string;
  /** Pass env for testability; defaults to process.env. */
  env?: NodeJS.ProcessEnv;
}

export async function enrichTarget(opts: EnrichOptions): Promise<EnrichmentResult> {
  const env = opts.env ?? process.env;
  const shopDomain = opts.shopDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');

  // Fetch candidate pages sequentially with 1s spacing.
  const pagesAttempted: EnrichmentFailure['pagesAttempted'] = [];
  const fetched: Array<{ url: string; status: number; html: string; bytes: number }> = [];
  for (const path of CANDIDATE_PATHS) {
    const url = `https://${shopDomain}${path}`;
    const res = await fetchPage(url);
    pagesAttempted.push({
      url,
      status: res.status || null,
      ...(res.error ? { error: res.error } : {}),
    });
    if (res.html && res.status >= 200 && res.status < 400) {
      fetched.push({ url, status: res.status, html: res.html, bytes: res.bytes });
    }
    if (fetched.length >= 3) break;
    await new Promise((r) => setTimeout(r, 1_000));
  }

  if (fetched.length === 0) {
    return {
      ok: false,
      reason: 'no-pages-fetched',
      message: `no pages reachable for ${shopDomain}`,
      pagesAttempted,
    };
  }

  // Regex pass.
  const allEmails = new Set<string>();
  let emailSource: string | null = null;
  for (const p of fetched) {
    const emails = extractEmailsFromHtml(p.html);
    for (const e of emails) allEmails.add(e);
    if (!emailSource && emails.length > 0) emailSource = p.url;
  }
  const regexEmail = pickBestEmail(Array.from(allEmails), shopDomain);

  // LLM pass — combined-page HTML, lightly cleaned.
  const combined = fetched
    .map((p) => `=== ${p.url} ===\n${stripHtmlNoise(p.html)}`)
    .join('\n\n')
    .slice(0, MAX_HTML_FOR_LLM);
  let llm: LlmExtraction | null = null;
  let llmError: string | null = null;
  try {
    const vertex = buildVertex(env);
    llm = await callLlm(vertex, shopDomain, combined, 'outreach-enrich');
  } catch (err) {
    llmError = err instanceof Error ? err.message : String(err);
  }

  // Merge: regex email wins over LLM email if both found (regex is 100%
  // certain — it's a substring). LLM first_name + reasoning carry.
  const emailField: EnrichedField<string> = regexEmail
    ? {
        value: regexEmail,
        confidence: regexEmail.endsWith(`@${shopDomain.replace(/^www\./, '')}`) ? 'high' : 'medium',
        source: emailSource,
        extractedBy: 'regex',
      }
    : llm?.email.value
      ? {
          value: llm.email.value,
          confidence: llm.email.confidence ?? 'low',
          source: fetched[0]?.url ?? null,
          extractedBy: 'llm',
          ...(llm.email.quote ? { notes: llm.email.quote } : {}),
        }
      : { value: null, confidence: 'none', source: null, extractedBy: 'none' };

  const firstNameField: EnrichedField<string> = llm?.firstName.value
    ? {
        value: llm.firstName.value,
        confidence: llm.firstName.confidence ?? 'low',
        source: fetched[0]?.url ?? null,
        extractedBy: 'llm',
        ...(llm.firstName.quote ? { notes: llm.firstName.quote } : {}),
      }
    : { value: null, confidence: 'none', source: null, extractedBy: 'none' };

  if (!llm && !regexEmail) {
    return {
      ok: false,
      reason: 'llm-error',
      message: llmError ?? 'no extraction',
      pagesAttempted,
    };
  }

  return {
    ok: true,
    draft: {
      recipientEmail: emailField,
      firstName: firstNameField,
      fetchedPages: fetched.map((p) => ({ url: p.url, status: p.status, bytes: p.bytes })),
      llmReasoning: llm?.reasoning ?? '(LLM unavailable; regex-only)',
      extractedAt: new Date().toISOString(),
    },
  };
}

/**
 * Decide whether an enrichment draft can be safely auto-applied (no
 * operator click required). Two conditions, both must hold:
 *   1. Email confidence is 'high'
 *   2. Email's domain matches the shop's apex domain
 * First name auto-apply is gated on email auto-apply succeeding —
 * if we trust the email, we trust the name extracted from the same site.
 */
export function canAutoApply(draft: EnrichmentDraft, shopDomain: string): boolean {
  const apex = shopDomain.toLowerCase().replace(/^www\./, '');
  const email = draft.recipientEmail;
  if (email.confidence !== 'high') return false;
  if (!email.value) return false;
  return email.value.toLowerCase().endsWith(`@${apex}`) || email.value.toLowerCase().endsWith(`@www.${apex}`);
}
