import type { Metadata } from 'next';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { ContactForm } from '@/components/ContactForm';

/**
 * Standards root — the food regulatory standard, holding page.
 *
 * Per the C1 three-host extension (council 2026-05-03), this page lives
 * at `apps/scanner/src/app/standards/` and is reached two ways:
 *   1. `standards.flintmere.com/` — middleware rewrites to `/standards`
 *      so the user-facing URL stays the clean root. Canonical.
 *   2. `flintmere.com/standards` — middleware 301 to standards host.
 *
 * Phase 1 (this commit): holding page + email capture via the contact
 * form (topic=partnership, source=/standards-holding so triage can
 * grep on it). Phase 2 (post-ingestion-engine, June 2026+) replaces
 * this content with the actual taxonomy.
 *
 * `force-static` — content surface, no DB or LLM dependencies. A
 * scanner-side runtime failure (DB error, LLM timeout) leaves this page
 * serving from the static cache so the authority surface stays up
 * independent of product code health.
 */

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Flintmere Standards — the food regulatory standard',
  description:
    'A reference standard for how food merchants should describe their catalog so AI agents and shopping channels can read it correctly. Allergens, ingredients, country-of-origin, GS1 paths. Publishing in the second half of 2026.',
  alternates: { canonical: 'https://standards.flintmere.com/' },
  openGraph: {
    title: 'Flintmere Standards — the food regulatory standard',
    description:
      'A reference standard for how food merchants should describe their catalog so AI agents and shopping channels can read it correctly. Publishing in the second half of 2026.',
    url: 'https://standards.flintmere.com/',
    type: 'website',
  },
};

export default function StandardsHolding() {
  return (
    <>
      <main
        id="main"
        className="flintmere-main bg-[color:var(--color-paper)]"
      >
        <section
          aria-labelledby="standards-heading"
          className="mx-auto max-w-[1080px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(80px, 10vw, 160px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{
              fontSize: '11px',
              letterSpacing: '0.16em',
              marginBottom: 'clamp(28px, 4vw, 56px)',
            }}
          >
            Standards.
          </p>
          <h1
            id="standards-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[18ch]"
            style={{
              fontSize: 'var(--scale-h1-anchor)',
              letterSpacing: '-0.04em',
              lineHeight: 0.98,
            }}
          >
            The food <Bracket size="display">regulatory</Bracket> standard.
          </h1>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[56ch]"
            style={{
              marginTop: 'clamp(28px, 4vw, 48px)',
              fontSize: '20px',
              lineHeight: 1.5,
            }}
          >
            A reference for how food merchants should describe their catalog
            so AI agents and shopping channels can read it correctly.
            Allergens, ingredients, country-of-origin, GS1 paths. Citation
            authority, not a product paywall.
          </p>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[56ch]"
            style={{
              marginTop: '20px',
              fontSize: '17px',
              lineHeight: 1.55,
            }}
          >
            Publishing in the second half of 2026, after the ingestion
            engine ships and the first cohort of merchant catalogs has been
            verified against it. Free to read. Free to cite.
          </p>
        </section>

        <section
          aria-labelledby="standards-what-heading"
          className="mx-auto max-w-[1080px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(40px, 6vw, 96px)',
            paddingBottom: 'clamp(40px, 6vw, 96px)',
            borderTop: '1px solid var(--color-line)',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{
              fontSize: '11px',
              letterSpacing: '0.16em',
              marginBottom: '20px',
            }}
          >
            What it covers.
          </p>
          <h2
            id="standards-what-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[28ch]"
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            Six pillars. Each one a hidden multiplier on whether a food SKU
            shows up where shoppers and agents look for it.
          </h2>
          <ul
            className="text-[color:var(--color-ink-2)]"
            style={{
              marginTop: 'clamp(28px, 4vw, 48px)',
              listStyle: 'none',
              padding: 0,
              display: 'grid',
              gap: 14,
              fontSize: '17px',
              lineHeight: 1.55,
              maxWidth: '64ch',
            }}
          >
            {[
              'Allergen disclosure — the 14 declarable allergens, plus crops without protected status.',
              'Ingredient ordering — descending by weight, with sub-ingredient parentheticals where required.',
              'Country-of-origin — primary plus QUID where the marketing claim depends on it.',
              'GS1 barcode path — GTIN allocation, the case for Variable Measure, when prefix-7 is wrong.',
              'Storage + use-by — ambient vs chilled vs frozen, opened-shelf-life vs sealed.',
              'Channel readability — Google Shopping, Amazon Fresh, Ocado, Deliveroo. The schemas that read each pillar.',
            ].map((line) => (
              <li
                key={line}
                style={{
                  paddingLeft: 0,
                  borderLeft: '1px solid var(--color-line)',
                  paddingInlineStart: 16,
                }}
              >
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="standards-waitlist-heading"
          className="mx-auto max-w-[1080px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(40px, 6vw, 96px)',
            paddingBottom: 'clamp(80px, 10vw, 160px)',
            borderTop: '1px solid var(--color-line)',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{
              fontSize: '11px',
              letterSpacing: '0.16em',
              marginBottom: '20px',
            }}
          >
            Tell us when.
          </p>
          <h2
            id="standards-waitlist-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[24ch]"
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              marginBottom: 'clamp(20px, 3vw, 32px)',
            }}
          >
            Get a note when the first version of the standard publishes.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[56ch]"
            style={{
              fontSize: '17px',
              lineHeight: 1.55,
              marginBottom: 'clamp(28px, 4vw, 40px)',
            }}
          >
            One email when v1 lands. No newsletter, no drip, no sales
            sequence. Tell us a bit about your catalog and which pillars
            matter most to you so the first version covers what you need.
          </p>
          <ContactForm
            defaultTopic="partnership"
            lockTopic
            source="/standards-holding"
            embedded
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
