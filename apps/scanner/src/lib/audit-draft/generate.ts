// Audit-assist v0 — orchestration: scan resolution, catalog fetch, LLM
// call, persist. The route handler is a thin shell that maps the
// `code`-tagged errors thrown here to HTTP status codes.
//
// Why a helper file vs inline-in-route: lets the route stay slim
// (~80 LOC) and lets unit tests target this orchestrator without going
// through Next's request/response shape. The route's own integration
// test mocks `generateAuditDraftForShop` and asserts the status-code
// mapping.

import {
  draftAudit,
  LLMRouter,
  RejectingProvider,
  VertexProvider,
  type CompletionOpts,
} from '@flintmere/llm'
import { prisma } from '../db'
import { type AuditBandSlug, bandBySlug } from '../audit-pricing'
import {
  CatalogSampleError,
  getCatalogSampleForDraft,
  summariseProductsForLLM,
} from './catalog-sample'
import { createAuditDraft, type PersistedAuditDraft } from './db'
import { AUDIT_DRAFT_RESPONSE_SCHEMA } from './json-schema'
import { buildSystemPrompt, buildUserPrompt } from './prompt'
import {
  AuditDraftSchema,
  type AuditDraft,
  type Vertical,
} from './schema'

const SCAN_REUSE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MODEL_ID = 'gemini-2.5-pro'

export class AuditDraftGenerationError extends Error {
  constructor(
    public readonly code:
      | 'config-missing'
      | 'no-recent-scan'
      | 'scan-incomplete'
      | 'catalog-unfetchable'
      | 'vertex-error'
      | 'llm-schema-fail'
      | 'llm-unavailable',
    message: string,
  ) {
    super(message)
    this.name = 'AuditDraftGenerationError'
  }
}

export interface GenerateAuditDraftInput {
  /** Raw URL the operator submitted; may include scheme/path — fetcher normalises. */
  shopUrl: string
  bandSlug: AuditBandSlug
  /** Optional operator hint; defaults to `food` when absent. */
  vertical?: Vertical
}

// Compatible with `process.env` (NodeJS.ProcessEnv extends a string
// dict) so callers pass it without explicit narrowing.
export type AuditDraftRouterEnv = Record<string, string | undefined> & {
  GOOGLE_CLOUD_PROJECT?: string
  LLM_HARDCASE_MODEL?: string
  LLM_HARDCASE_REGION?: string
}

/**
 * Top-level orchestration. Resolves a recent scan (or refuses if none),
 * pulls a catalog sample, calls the LLM through the router, and
 * persists the draft. Returns the persisted row including the assigned
 * id. Errors are tagged with `code` for HTTP-status mapping.
 */
export async function generateAuditDraftForShop(
  input: GenerateAuditDraftInput,
  env: AuditDraftRouterEnv = process.env,
): Promise<PersistedAuditDraft> {
  const vertical: Vertical = input.vertical ?? 'food'
  const band = bandBySlug(input.bandSlug)
  if (!band) {
    // Caller must validate before getting here; defensive.
    throw new AuditDraftGenerationError(
      'config-missing',
      `unknown band slug: ${input.bandSlug}`,
    )
  }

  // 1. Catalog sample (50 products) — drives both the LLM grounding and
  // the normalised hostname we persist on the draft row.
  let sample
  try {
    sample = await getCatalogSampleForDraft(input.shopUrl)
  } catch (err) {
    if (err instanceof CatalogSampleError) {
      throw new AuditDraftGenerationError('catalog-unfetchable', err.message)
    }
    throw err
  }

  // 2. Scan summary — most-recent successful scan within the reuse
  // window. v0 refuses if absent; the operator runs /scan first.
  const scan = await findRecentScan(sample.shop)
  if (!scan) {
    throw new AuditDraftGenerationError(
      'no-recent-scan',
      `no successful scan for ${sample.shop} in the last 7 days`,
    )
  }

  const scanSummary = projectScanSummary(scan)
  if (!scanSummary) {
    throw new AuditDraftGenerationError(
      'scan-incomplete',
      `scan ${scan.id} missing pillar breakdown`,
    )
  }

  // 3. LLM call. Vertex hardcase + RejectingProvider as fallback. The
  // router's auto-failover means a Vertex `provider-error` lands on the
  // RejectingProvider, which throws — that throw surfaces as
  // `llm-unavailable` (mapped to 503 by the route).
  const router = buildAuditDraftRouter(env)
  const sampleText = summariseProductsForLLM(sample.products)
  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt({
    shop: sample.shop,
    vertical,
    bandLabel: `${band.label} (${band.skuRangeLabel})`,
    scan: scanSummary,
    catalogSampleText: sampleText,
    sampleSize: sample.products.length,
    truncated: sample.truncated,
  })

  let result
  try {
    result = await draftAudit<AuditDraft>({
      complete: (opts: CompletionOpts) => router.completeHardCase(opts),
      systemPrompt,
      userPrompt,
      schema: AuditDraftSchema,
      responseSchema: AUDIT_DRAFT_RESPONSE_SCHEMA,
      tag: 'audit-draft',
    })
  } catch (err) {
    throw mapLLMError(err)
  }

  // 4. Persist.
  return createAuditDraft({
    shop: sample.shop,
    vertical,
    bandSlug: input.bandSlug,
    scanId: scan.id,
    modelUsed: MODEL_ID,
    latencyMs: result.latencyMsTotal,
    rawDraft: result.data,
    generatedAt: new Date(),
  })
}

/**
 * Builds the LLMRouter audit-assist uses. Vertex as primary AND
 * hardcase (single-provider; we don't double-cost on calls). Rejecting
 * in the fallback slot — fail-loud rather than silently routing to
 * OpenAI for catalog-text drafting (per the plan: "no silent fallback
 * to OpenAI on this route").
 */
export function buildAuditDraftRouter(env: AuditDraftRouterEnv): LLMRouter {
  const project = env.GOOGLE_CLOUD_PROJECT
  if (!project) {
    throw new AuditDraftGenerationError(
      'config-missing',
      'GOOGLE_CLOUD_PROJECT env var unset',
    )
  }
  const vertex = new VertexProvider({
    project,
    location: env.LLM_HARDCASE_REGION ?? 'europe-west1',
    model: env.LLM_HARDCASE_MODEL ?? MODEL_ID,
    inputPriceTenthPencePerMillion: 1000, // £0.0010 / 1K in
    outputPriceTenthPencePerMillion: 4000, // £0.0040 / 1K out
  })
  return new LLMRouter({
    primary: vertex,
    hardcase: vertex,
    fallback: new RejectingProvider(),
  })
}

// ---- Internal -------------------------------------------------------

interface RecentScan {
  id: string
  scoreJson: unknown
  productCount: number | null
  score: number | null
  grade: string | null
}

async function findRecentScan(
  normalisedDomain: string,
): Promise<RecentScan | null> {
  const cutoff = new Date(Date.now() - SCAN_REUSE_WINDOW_MS)
  const row = await prisma.scan.findFirst({
    where: {
      normalisedDomain,
      status: 'complete',
      completedAt: { gte: cutoff },
    },
    orderBy: { completedAt: 'desc' },
    select: {
      id: true,
      scoreJson: true,
      productCount: true,
      score: true,
      grade: true,
    },
  })
  return row
}

interface PillarBreakdownEntry {
  pillar: string
  score: number
  rating?: string
  grade?: string
  issues?: Array<{ title?: string; affectedCount?: number }>
}

function projectScanSummary(scan: RecentScan) {
  const json = scan.scoreJson as
    | {
        score?: number
        grade?: string
        productCount?: number
        pillars?: PillarBreakdownEntry[]
      }
    | null
    | undefined
  if (!json || !Array.isArray(json.pillars) || json.pillars.length === 0) {
    return null
  }
  return {
    overallScore: scan.score ?? json.score ?? 0,
    grade: scan.grade ?? json.grade ?? '—',
    productCount: scan.productCount ?? json.productCount ?? 0,
    pillars: json.pillars.map(projectPillar),
  }
}

function projectPillar(p: PillarBreakdownEntry) {
  const rating = (p.rating ?? p.grade ?? deriveRating(p.score)) as
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'F'
  const issues = Array.isArray(p.issues) ? p.issues : []
  // Compact "X of Y" style summary across this pillar's issues. We
  // collapse to top-3 by affectedCount to keep the prompt budget tight.
  const top = issues
    .filter((i) => typeof i?.affectedCount === 'number')
    .sort((a, b) => (b.affectedCount ?? 0) - (a.affectedCount ?? 0))
    .slice(0, 3)
  const summary = top.length
    ? top
        .map(
          (i) =>
            `${i.affectedCount ?? 0} affected: ${(i.title ?? '').slice(0, 80)}`,
        )
        .join('; ')
    : 'no issues recorded'
  return {
    pillar: p.pillar as
      | 'identifiers'
      | 'titles'
      | 'consistency'
      | 'crawlability'
      | 'attributes'
      | 'mapping'
      | 'checkout-eligibility',
    score: p.score,
    rating,
    issuesSummary: summary,
  }
}

function deriveRating(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function mapLLMError(err: unknown): AuditDraftGenerationError {
  if (err instanceof AuditDraftGenerationError) return err
  // packages/llm throws LLMError; we look it up structurally to avoid
  // a value import that would couple production callers to provider SDKs.
  const code =
    err instanceof Error && 'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : null
  const msg = err instanceof Error ? err.message : String(err)
  if (code === 'safety-filter' || code === 'invalid-input' || code === 'auth') {
    return new AuditDraftGenerationError('vertex-error', msg)
  }
  if (msg.includes('schema-parse failed')) {
    return new AuditDraftGenerationError('llm-schema-fail', msg)
  }
  // RejectingProvider throws plain Error / non-LLMError — treat as
  // unavailable. (Same end-state as a router-classified provider-error
  // that fell over to RejectingProvider.)
  return new AuditDraftGenerationError('llm-unavailable', msg)
}
