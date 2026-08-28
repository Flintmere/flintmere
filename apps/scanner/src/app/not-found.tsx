import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Bracket } from '@flintmere/ui';
import { LEGACY_SCANNER_HOST, MARKETING_HOST, SCANNER_HOST } from '@/lib/host-routing';
import { marketingUrl, scannerUrl } from '@/lib/host-url';

// Root not-found. Without this, Next.js's built-in default emits a stray
// <title>404…</title> + <meta robots noindex> alongside the root layout's
// metadata, leaving conflicting tags on every 404. This component takes
// ownership: clean noindex, no conflicting title.
//
// Composition (council 2026-05-03 — A24 + Bloomberg + Cereal references):
// hairline-framed monospace credit strip top + bottom; left-offset
// heroic [ 404 ] in the saks-bracket variant (auto-applies the canon
// outline-shimmer); host-aware paragraph; two CTAs; film-credits closer.
// Non-linear by deliberate offset, not by motion.
export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false, follow: false },
};

const RULE_STYLE: React.CSSProperties = {
  height: 1,
  background: 'var(--color-ink)',
  width: '100%',
};

const CREDIT_STRIP_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-2)',
};

export default async function NotFound() {
  const hdrs = await headers();
  const requestHost = (
    hdrs.get('x-forwarded-host') ??
    hdrs.get('host') ??
    ''
  )
    .split(':')[0]!
    .toLowerCase();

  // Unknown paths are not redirected, so the legacy scanner host renders
  // this page too. Treat it as the scanner host or a 404 there would
  // offer marketing wayfinding to someone who wanted the scanner.
  const onScanner =
    requestHost === SCANNER_HOST || requestHost === LEGACY_SCANNER_HOST;
  const otherHost = onScanner ? MARKETING_HOST : SCANNER_HOST;
  const otherSurface = onScanner
    ? 'pricing, the methodology, or the research benchmark'
    : 'the scanner, the catalog letter, or the bot policy';

  const year = new Date().getUTCFullYear();

  return (
    <main id="main">
      <section
        className="mx-auto max-w-[1280px] px-6 md:px-8"
        style={{ paddingTop: 'clamp(48px, 8vh, 96px)', paddingBottom: 'clamp(48px, 8vh, 96px)' }}
      >
        {/* Top credit strip — A24 cover-card eyebrow */}
        <div style={RULE_STYLE} aria-hidden="true" />
        <div
          className="flex items-center justify-between"
          style={{ ...CREDIT_STRIP_STYLE, paddingTop: 12, paddingBottom: 12 }}
        >
          <span>Flintmere</span>
          <span className="hidden sm:inline">Not found · roll continues</span>
          <span>{year}</span>
        </div>
        <div style={RULE_STYLE} aria-hidden="true" />

        {/* Heroic [ 404 ] — saks bracket auto-applies outline-shimmer.
            Left-offset (justify-start) instead of centred — Bloomberg-cover
            move; the whitespace on the right is part of the composition. */}
        <div
          className="flex items-end justify-start"
          style={{ minHeight: 'clamp(220px, 38vh, 460px)', paddingTop: 'clamp(40px, 8vh, 96px)' }}
        >
          <h1
            className="m-0"
            style={{ lineHeight: 0.9, marginLeft: '-0.06em' }}
            aria-label="404 not found"
          >
            <Bracket size="saks">404</Bracket>
          </h1>
        </div>

        {/* The sentence + host paragraph. Sits below the hero, indented to
            match the bracket's optical left edge. */}
        <div className="max-w-[56ch]" style={{ paddingTop: 'clamp(24px, 4vh, 48px)' }}>
          <p
            className="m-0"
            style={{
              fontSize: 'clamp(22px, 2.6vw, 32px)',
              lineHeight: 1.2,
              fontWeight: 500,
              color: 'var(--color-ink)',
            }}
          >
            The page you wanted isn&rsquo;t here.
          </p>
          {requestHost && (
            <p
              className="mt-4 m-0"
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: 'var(--color-ink-2)',
              }}
            >
              You&rsquo;re on{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {requestHost}
              </span>
              . If you&rsquo;re looking for {otherSurface}, those live on{' '}
              <a
                href={`https://${otherHost}`}
                style={{ textDecoration: 'underline' }}
              >
                {otherHost}
              </a>
              . Otherwise the URL is wrong or the page has moved.
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <a href={scannerUrl('/scan')} className="btn btn-accent">
              Run the free scan →
            </a>
            <a href={marketingUrl('/')} className="btn">
              Back to home
            </a>
          </div>
        </div>

        {/* Bottom credit strip — film-credits closer */}
        <div style={{ ...RULE_STYLE, marginTop: 'clamp(64px, 12vh, 144px)' }} aria-hidden="true" />
        <div
          className="flex items-center justify-between"
          style={{ ...CREDIT_STRIP_STYLE, paddingTop: 12, paddingBottom: 12 }}
        >
          <span>404 · {requestHost || 'unknown host'}</span>
          <span className="hidden sm:inline">A Flintmere production</span>
          <span>{year}</span>
        </div>
        <div style={RULE_STYLE} aria-hidden="true" />
      </section>
    </main>
  );
}
