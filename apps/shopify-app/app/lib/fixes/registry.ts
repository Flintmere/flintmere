// Fix-type registry. Single source of truth mapping issue codes (emitted by
// @flintmere/scoring) to Tier 1 / Tier 2 fix handlers. Drill-down route reads
// this to decide which apply button to render. Worker reads this to dispatch
// to the right handler.

export type FixTier = 1 | 2 | 3;

export interface FixTypeMeta {
  fixType: string;
  tier: FixTier;
  // Issue codes this fix resolves. One-to-many: one fix can resolve multiple
  // related codes; one issue code can map to at most one Tier 1 fix.
  issueCodes: readonly string[];
  displayName: string;
  // One-line merchant-facing description rendered above the apply button.
  description: string;
  // Confirm-modal copy. Keep terse — Polaris prepends "Apply".
  confirmLabel: string;
}

export const FIX_TYPES = {
  'brand-from-vendor': {
    fixType: 'brand-from-vendor',
    tier: 1,
    issueCodes: ['missing-brand'],
    displayName: 'Populate brand from vendor',
    description:
      'Copy the existing Vendor field into a typed `custom.brand` metafield. Reversible for 7 days.',
    confirmLabel: 'Apply to all affected products',
  },
} as const satisfies Record<string, FixTypeMeta>;

export type FixTypeId = keyof typeof FIX_TYPES;

export function fixTypeForIssueCode(code: string): FixTypeMeta | null {
  for (const meta of Object.values(FIX_TYPES) as FixTypeMeta[]) {
    if ((meta.issueCodes as readonly string[]).includes(code)) return meta;
  }
  return null;
}

export function getFixTypeMeta(fixType: string): FixTypeMeta | null {
  return (FIX_TYPES as Record<string, FixTypeMeta>)[fixType] ?? null;
}
