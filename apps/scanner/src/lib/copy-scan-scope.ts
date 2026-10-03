// Owns `scanScopeLine` — the single sentence that states how much of a
// merchant's catalog was actually scanned, and (when known) how many of
// those products had a barcode read. Split out of copy.ts on 2026-09-10:
// the function is self-contained (no shared helpers, nothing else in
// copy.ts depends on it) and the brief for this change (Task 7,
// 2026-09-09-fetcher-barcode-plan) already named a dedicated test file
// for it — moving the implementation to match keeps copy.ts under the
// project's 600-line ceiling without splitting anything that belongs
// together.

/**
 * Scope line shown above every results lede — gives the merchant
 * calibration on what we scanned BEFORE they read the £-figure. Per
 * BUSINESS.md:19 council ruling 2026-04-27 #3: trust-anchor sits ahead of
 * the headline so the merchant absorbs the sampling story before the
 * number lands.
 */
export function scanScopeLine(args: {
  sampledCount: number
  actualProductCount: number | null
  truncated: boolean
  /** Absent on scans persisted before the barcode pass shipped. */
  barcodesRead?: number | null
}): string {
  const sampled = args.sampledCount.toLocaleString()
  const scanned = args.truncated
    ? `Scanned ${sampled} of ${
        args.actualProductCount !== null
          ? args.actualProductCount.toLocaleString()
          : `${sampled}+`
      } products`
    : `Scanned ${sampled} products`

  // Barcodes come from a per-product endpoint and are sampled, so the
  // count differs from the scan's. Stated only when it differs — a small
  // catalog reads exactly as it did before this shipped.
  let barcodes = ''
  if (typeof args.barcodesRead === 'number' && args.barcodesRead === 0) {
    barcodes = ' · barcodes not read'
  } else if (
    typeof args.barcodesRead === 'number' &&
    args.barcodesRead < args.sampledCount
  ) {
    barcodes = ` · barcodes on ${args.barcodesRead.toLocaleString()}`
  }

  return `${scanned}${barcodes} · 60 seconds`
}
