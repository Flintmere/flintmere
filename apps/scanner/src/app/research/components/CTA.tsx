import Link from 'next/link';

/**
 * Chapter 8 — Closing CTA on ink. Visual antecedent to the footer
 * curtain — same ink, sage hairline, amber CTA. Dual CTA: free
 * scan (next-edition contribution) + concierge audit (from £197 per ADR 0022).
 */
export function CTA() {
  return (
    <section
      aria-labelledby="research-cta-heading"
      className="relative"
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper)',
      }}
    >
      <div
        className="mx-auto w-full max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 5vw, 64px)',
          paddingRight: 'clamp(24px, 5vw, 64px)',
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 12vh, 160px)',
        }}
      >
        <p
          data-reveal
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            letterSpacing: '0.18em',
            color: 'var(--color-accent)',
            fontWeight: 500,
            marginBottom: 'clamp(32px, 4vw, 64px)',
            ['--reveal-delay' as string]: '60ms',
          }}
        >
          <span aria-hidden="true">// </span>the next edition
        </p>

        <h2
          id="research-cta-heading"
          data-reveal
          className="font-sans font-medium tracking-[-0.04em] leading-[0.92]"
          style={{
            fontSize: 'clamp(40px, 6vw, 96px)',
            maxWidth: '22ch',
            color: 'var(--color-paper)',
            ['--reveal-delay' as string]: '200ms',
          }}
        >
          Run a free scan. Your score sits inside the next monthly refresh.
        </h2>

        <div
          data-reveal
          aria-hidden="true"
          className="mt-10 lg:mt-14"
          style={{
            height: '2px',
            width: 'clamp(160px, 14vw, 280px)',
            background: 'var(--color-accent-sage)',
            opacity: 0.85,
            ['--reveal-delay' as string]: '500ms',
          }}
        />

        <p
          data-reveal
          className="font-sans mt-10 lg:mt-14"
          style={{
            maxWidth: '60ch',
            fontSize: 'clamp(15px, 1.1vw, 18px)',
            lineHeight: 1.55,
            color: 'var(--color-mute-inv)',
            ['--reveal-delay' as string]: '700ms',
          }}
        >
          Scans initiated by store owners are tagged separately from
          FlintmereBot crawls and contribute to next month&rsquo;s
          aggregates. You keep your report; we keep the anonymised score.
          The more stores in the dataset, the tighter the benchmark
          becomes for everyone.
        </p>

        <div
          data-reveal
          className="mt-10 lg:mt-12 flex flex-wrap gap-3"
          style={{ ['--reveal-delay' as string]: '900ms' }}
        >
          <Link
            href="/scan"
            className="inline-flex items-center gap-3 px-7 py-3.5 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Run the free scan
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/audit"
            className="inline-flex items-center gap-3 px-7 py-3.5 border border-[color:var(--color-paper)] text-[color:var(--color-paper)] font-mono text-[12px] font-medium tracking-[0.14em] uppercase hover:bg-[color:var(--color-paper)] hover:text-[color:var(--color-ink)] transition-colors duration-[var(--duration-instant)]"
          >
            Or book the concierge audit (from £197)
          </Link>
        </div>
      </div>
    </section>
  );
}
