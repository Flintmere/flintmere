/**
 * CompareSection — "What other tools do / What Flintmere does" two-panel
 * block on the marketing homepage.
 *
 * Extracted from `apps/scanner/src/app/page.tsx` as part of the pre-emptive
 * homepage split (refactor only — no behaviour change). Pure-presentational;
 * no props, no state.
 */
export function CompareSection() {
  return (
    <section aria-labelledby="compare-heading" className="grid md:grid-cols-2 border-y border-[color:var(--color-line)]">
      <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-[color:var(--color-line)]">
        <p className="eyebrow mb-6">What other tools do</p>
        <span className="sr-only">
          What other tools do — items struck through:
        </span>
        <ul className="compare-list compare-list--struck list-none p-0 m-0 space-y-4 text-[color:var(--color-mute)]">
          <li>Repurpose a Google-ranking tool for AI agents</li>
          <li>Resell barcodes from non-GS1 sources</li>
          <li>Charge per-product, so a big catalog triples your bill</li>
          <li>One-time audit, then silence</li>
          <li>Hide the founder behind a support queue</li>
        </ul>
      </div>
      <div className="p-12 md:p-16 bg-[color:var(--color-paper-2)]">
        <p className="eyebrow mb-6" id="compare-heading">What Flintmere does</p>
        <ul className="compare-list list-none p-0 m-0 space-y-4">
          <li>Built from the first line for ChatGPT, Perplexity and Claude — not Google</li>
          <li>Honest barcode guidance: buy GS1 barcodes from GS1 UK, we help you import them</li>
          <li>Flat monthly price. Scan as often as you like. No credits.</li>
          <li>We re-scan your catalog nightly. Drift alerts on the cadence your tier specifies — weekly on Growth, daily on Scale and above</li>
          <li>We read every reply — usually within two working days</li>
        </ul>
      </div>
    </section>
  );
}
