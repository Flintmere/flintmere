import { Bracket, SiteFooter } from '@flintmere/ui';

// Rendered when the connect link's audit-id param is missing or points at
// a catalog letter that's neither paid nor delivered. Standalone page (its own
// <main> + <SiteFooter />) — does not share the three-state chrome.

export function ExpiredLink() {
  return (
    <main id="main" className="flintmere-main">
      <section
        style={{
          background: 'var(--color-paper)',
          padding: '128px 24px 96px',
          textAlign: 'center',
        }}
      >
        <p className="eyebrow" style={{ color: 'var(--color-mute)' }}>
          Link expired
        </p>
        <h1
          style={{
            margin: '24px auto 16px',
            maxWidth: '20ch',
            fontSize: 'clamp(36px, 6vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
          }}
        >
          This connection link is no longer <Bracket>active</Bracket>.
        </h1>
        <p
          style={{
            maxWidth: '52ch',
            margin: '0 auto',
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--color-ink-2)',
          }}
        >
          Reply to your catalog letter delivery email and we&rsquo;ll send a
          fresh link within one working day.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
