/**
 * FounderStrip — "Who builds Flintmere" section on the marketing homepage.
 *
 * Post-ADR-0021 redesign — operator Q6 lock: "ink-slab with light".
 *   - Ink-slab background (`--color-ink`) + paper-on-ink text token.
 *   - 1px sage hairline at the top of the slab — decorative-only "with light"
 *     interpretation per the operator-locks doc + Idris/Maren confirmation.
 *     Sage on ink ≈ 3.5:1 — fine for a hairline (no text meaning), forbidden
 *     as text per Noor's ADR 0021 binding conditions.
 *   - Eyebrow uses amber per the manifesto-pattern precedent (amber on ink
 *     reads ~11:1 AAA — safe at small scale).
 */
export function FounderStrip() {
  return (
    <section
      aria-labelledby="different-heading"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper-on-ink)',
        borderTop: '1px solid var(--color-accent-sage)',
      }}
      className="px-8 py-24"
    >
      <div className="mx-auto max-w-[1280px]">
        <p
          className="eyebrow mb-6"
          style={{ color: 'var(--color-accent)' }}
        >
          Who builds Flintmere
        </p>
        <h2 id="different-heading" className="max-w-[22ch]">
          We read{' '}
          <span
            style={{
              borderBottom: '3px solid var(--color-accent)',
              paddingBottom: '4px',
            }}
          >
            every email
          </span>
          . We write{' '}
          <span
            style={{
              borderBottom: '3px solid var(--color-accent)',
              paddingBottom: '4px',
            }}
          >
            every audit
          </span>
          .
        </h2>
        <p
          className="founder-copy mt-8 max-w-[54ch]"
          style={{ color: 'var(--color-paper-on-ink)' }}
        >
          If you book the £97 audit, the team writes the letter and the
          per-product CSV. If you email hello@flintmere.com, we reply —
          usually within two working days. No outsourced support queue.
          No pitch. No sales call.
        </p>
      </div>
    </section>
  );
}
