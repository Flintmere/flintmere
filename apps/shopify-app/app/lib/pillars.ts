import { PILLAR_WEIGHTS, type PillarId, type PillarResult } from '@flintmere/scoring';
import { z } from 'zod';

// Single source of truth for pillar display in the embedded app.
//
// These labels are a HAND-MAINTAINED COPY of
// apps/scanner/src/lib/copy.ts §pillarLabelCustomerFacing — the embedded
// app is a separate deployable and cannot import from apps/scanner, so
// nothing enforces the match. A merchant sees both surfaces, so the copy
// has to be updated in the same PR as the original: on 2026-09-10 the
// scanner renamed "Agent Checkout Readiness" -> "Checkout Readiness" and
// "AI Agent Access" -> "Crawler Access" (we measure access, not agent
// behaviour) and this table kept the old names for a day while asserting
// it mirrored them. Grep the app for the old string too — the legacy-shape
// banner in routes/app._index spells one of these out by hand.
export interface PillarMeta {
  id: PillarId;
  numeral: string;
  name: string;
  weightLabel: string;
}

export const PILLAR_ORDER: readonly PillarId[] = [
  'identifiers',
  'attributes',
  'titles',
  'mapping',
  'consistency',
  'checkout-eligibility',
  'crawlability',
] as const;

const NAMES: Record<PillarId, string> = {
  identifiers: 'Product IDs',
  attributes: 'Structured Attributes',
  titles: 'Title & Description Quality',
  mapping: 'Google Category Match',
  consistency: 'Data Consistency',
  'checkout-eligibility': 'Checkout Readiness',
  crawlability: 'Crawler Access',
};

export const PILLAR_META: readonly PillarMeta[] = PILLAR_ORDER.map((id, i) => ({
  id,
  numeral: String(i + 1).padStart(2, '0'),
  name: NAMES[id],
  weightLabel: `${PILLAR_WEIGHTS[id]}%`,
}));

const PillarResultSchema = z.object({
  pillar: z.enum([
    'identifiers',
    'attributes',
    'titles',
    'mapping',
    'consistency',
    'checkout-eligibility',
    'crawlability',
  ]),
  weight: z.number(),
  score: z.number(),
  maxScore: z.number(),
  locked: z.boolean(),
  lockedReason: z.string().optional(),
});

const PillarsJsonSchema = z.array(PillarResultSchema);

export interface ParsedPillars {
  ok: boolean;
  pillars: Pick<PillarResult, 'pillar' | 'weight' | 'score' | 'maxScore' | 'locked' | 'lockedReason'>[];
  legacyShape: boolean;
}

// Parse the Score.pillars JSON column. Returns ok=false on shape drift so
// the caller can render a graceful banner instead of crashing the dashboard.
// legacyShape=true when a pre-2026-04-20 row is missing crawlability — the
// merchant just needs a re-scan to populate the seventh pillar.
export function parsePillarsJson(raw: unknown): ParsedPillars {
  const result = PillarsJsonSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, pillars: [], legacyShape: false };
  }
  const hasCrawlability = result.data.some((p) => p.pillar === 'crawlability');
  return {
    ok: true,
    pillars: result.data,
    legacyShape: !hasCrawlability,
  };
}
