/**
 * FounderStrip — "Who builds Flintmere" section on the marketing homepage.
 *
 * Extracted from `apps/scanner/src/app/page.tsx` as part of the pre-emptive
 * homepage split (refactor only — no behaviour change). Pure-presentational;
 * no props, no state.
 */
export function FounderStrip() {
  return (
    <section aria-labelledby="different-heading" className="mx-auto max-w-[1280px] px-8 py-24">
      <p className="eyebrow mb-6">Who builds Flintmere</p>
      <h2 id="different-heading" className="max-w-[22ch]">
        We read every email. We write every audit.
      </h2>
      <p className="founder-copy mt-8 max-w-[54ch] text-[color:var(--color-ink-2)]">
        If you book the £97 audit, the team writes the letter and the
        per-product CSV. If you email hello@flintmere.com, we reply —
        usually within two working days. No outsourced support queue.
        No pitch. No sales call.
      </p>
    </section>
  );
}
