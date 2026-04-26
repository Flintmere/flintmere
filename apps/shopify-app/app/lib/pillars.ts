import { PILLAR_WEIGHTS, type PillarId, type PillarResult } from '@flintmere/scoring';
import { z } from 'zod';

// Single source of truth for pillar display in the embedded app.
// Labels mirror apps/scanner/src/lib/copy.ts §pillarLabelCustomerFacing
// so a merchant sees identical wording across scanner + app.
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
  'checkout-eligibility': 'Agent Checkout Readiness',
  crawlability: 'AI Agent Access',
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
