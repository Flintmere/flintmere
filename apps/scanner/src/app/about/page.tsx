import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { SiteHeader } from '@/components/SiteHeader';

/**
 * /about — How Flintmere decides.
 *
 * Spec: context/design/specs/2026-04-26-about-food-first.md.
 * IA: context/design/ia/2026-04-26-flintmere-com-food-first.md §/about route.
 *
 * Council pre-flight references (per reference-register.md binding):
 *   1. Margaret Howell archive — quiet luxury / restraint as the highest-effort
 *      design. Informs the procurement section: definition list, no decoration.
 *   2. The Gentlewoman — display-scale headlines on near-white, generous
 *      whitespace, single-photo profiles. Informs the type-led hero (photoreal
 *      deferred to image-direction skill).
 *   3. McSweeney's — typographic confidence on near-text-only pages.
 *      Informs the body sections (What we do / Who we are / How we decide).
 *
 * Bracket budget (per spec §Bracket cap, 2 page-level slots):
 *   - Slot 1: hero h1 — How [ Flintmere ] decides.
 *   - Slot 2: how-we-decide h2 — The [ council ] is the process.
 *
 * Council framing rule (BUSINESS.md §Decision-making framework, LOAD-BEARING):
 *   - "I" / "founder" / "John" banned EXCEPT in the Section 4 procurement-
 *     disclosure paragraph where John Morris is named once as accountable
 *     director.
 *
 * Type-only hero — photoreal slot deferred. Per the spec hero photoreal is
 * RECOMMENDED but OPTIONAL; the three council references all point toward
 * type-led restraint. When `image-direction` lands an Adobe-Stock asset, the
 * right-hand slot can ship in a follow-up.
 *
 * Procurement-section facts that NEED operator confirmation before publication:
 *   - Companies House number
 *   - Registered office address
 *   - ICO registration number
 * Until confirmed, the page renders an "available on request" line for those
 * three rows. The verified rows (entity name, jurisdiction, accountable
 * director, VAT status) ship now.
 */

export const metadata: Metadata = {
  title: 'About — How Flintmere decides',
  description:
    'Flintmere is a trading name of Eazy Access Ltd. Decisions pass through the Standing Council — a 39-role specialist review framework with named, binding vetoes held by Accessibility, Data Protection, Consumer psychology, and Regulatory affairs.',
  alternates: { canonical: 'https://flintmere.com/about' },
};

const LAST_UPDATED = '2026-05-01';

export default function About() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="main"
        className="flintmere-main bg-[color:var(--color-paper)]"
      >
        {/* ──────────────────────────────────────────────────────────────
            Section 2 — Hero (bracket slot 1)
            ────────────────────────────────────────────────────────────── */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="mx-auto max-w-[1280px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(80px, 10vw, 160px)',
            paddingBottom: 'clamp(64px, 8vw, 128px)',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute-2)]"
            style={{
              fontSize: '11px',
              letterSpacing: '0.16em',
              marginBottom: 'clamp(28px, 4vw, 56px)',
            }}
          >
            About.
          </p>
          <h1
            id="hero-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[20ch]"
            style={{
              fontSize: 'clamp(56px, 8vw, 96px)',
              letterSpacing: '-0.035em',
              lineHeight: 1.0,
            }}
          >
            How <Bracket size="display">Flintmere</Bracket> decides.
          </h1>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[44ch]"
            style={{
              marginTop: 'clamp(28px, 4vw, 48px)',
              fontSize: '18px',
              lineHeight: 1.55,
            }}
          >
            Catalog readiness for AI agents — built by a council, not a
            founder. Here is how that works.
          </p>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            Section 3 — What we do
            ────────────────────────────────────────────────────────────── */}
        <section
          id="what-we-do"
          aria-labelledby="what-we-do-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(48px, 6vw, 96px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute-2)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em' }}
          >
            What we do.
          </p>
          <h2
            id="what-we-do-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(28px, 3vw, 32px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginTop: 'clamp(16px, 2vw, 24px)',
            }}
          >
            Catalog readiness for AI agents.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: '16px',
              lineHeight: 1.7,
            }}
          >
            Flintmere scores Shopify catalogs for how AI shopping agents —
            ChatGPT, Perplexity, Gemini, Apple Intelligence — read product
            data. We tell merchants which fields are dragging them down, fix
            what is safe to fix automatically, and guide the rest.
          </p>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: '1rem',
              fontSize: '16px',
              lineHeight: 1.7,
            }}
          >
            We do not sell SEO. We make catalogs legible to the agents that
            will decide the next sale.
          </p>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            Section 4 — Who we are (THE procurement-disclosure paragraph)
            Council framing rule load-bearing here. John Morris is named
            ONCE on this page, in this paragraph, as accountable director.
            ────────────────────────────────────────────────────────────── */}
        <section
          id="who"
          aria-labelledby="who-we-are-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(48px, 6vw, 96px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
            borderTop: '1px solid var(--color-line-soft)',
            borderBottom: '1px solid var(--color-line-soft)',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute-2)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em' }}
          >
            Who we are.
          </p>
          <h2
            id="who-we-are-heading"
            className="font-medium text-[color:var(--color-ink)]"
            style={{
              fontSize: 'clamp(28px, 3vw, 32px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginTop: 'clamp(16px, 2vw, 24px)',
            }}
          >
            Three answers, three questions.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: '16px',
              lineHeight: 1.7,
            }}
          >
            Flintmere is operated by{' '}
            <strong className="font-medium text-[color:var(--color-ink)]">
              Eazy Access Ltd
            </strong>
            , a UK-registered company. The accountable director on company
            filings is{' '}
            <strong className="font-medium text-[color:var(--color-ink)]">
              John Morris
            </strong>
            . The decision-making model is the{' '}
            <strong className="font-medium text-[color:var(--color-ink)]">
              Flintmere Standing Council
            </strong>{' '}
            — a 39-role specialist review framework with named, binding
            vetoes held by Accessibility, Data Protection, Consumer
            psychology, and Regulatory affairs. Specialist sub-councils
            convene by domain: Copy reviews customer-facing copy, Design
            gates visual surfaces, Legal gates legal pages, Payment gates
            checkout flows. The legal entity owns the contracts; the named
            director carries accountability; the council shapes every
            product, design, copy, and policy decision. Three answers,
            three questions.
          </p>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            Section 5 — How we decide (bracket slot 2)
            ────────────────────────────────────────────────────────────── */}
        <section
          id="how-we-decide"
          aria-labelledby="how-we-decide-heading"
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(48px, 6vw, 96px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute-2)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em' }}
          >
            How we decide.
          </p>
          <h2
            id="how-we-decide-heading"
            className="font-medium text-[color:var(--color-ink)] max-w-[26ch]"
            style={{
              fontSize: 'clamp(28px, 3vw, 32px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginTop: 'clamp(16px, 2vw, 24px)',
            }}
          >
            The <Bracket size="display">council</Bracket> is the process.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: 'clamp(20px, 3vw, 32px)',
              fontSize: '16px',
              lineHeight: 1.7,
            }}
          >
            Every non-trivial decision — product, design, copy, legal,
            regulatory, pricing — passes through the Standing Council.
            Sub-councils convene by domain: a Copy Council reviews every
            customer-facing sentence; a Legal Council gates every legal
            page; a Design Council gates every visual surface, with
            Accessibility holding a binding veto; a Payment Sub-council
            gates checkout flows. Council seat #39, Regulatory affairs,
            holds veto on standards-publication accuracy.
          </p>
          <p
            className="text-[color:var(--color-ink-2)] max-w-[64ch]"
            style={{
              marginTop: '1rem',
              fontSize: '16px',
              lineHeight: 1.7,
            }}
          >
            This is unusual at our scale. Most SaaS tools at our stage ship
            on one engineer&rsquo;s gut. Flintmere ships through reviewed
            lenses with explicit, named vetoes. It is why our standards
            publication is citable, why our claims survive review, and why
            a sophisticated buyer can rely on what is on this site.
          </p>
          <div style={{ marginTop: 'clamp(28px, 4vw, 48px)' }}>
            <Link
              href="/research"
              className="font-medium text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
              style={{ fontSize: '16px' }}
            >
              Food standard v1 publishes 2026 — see how we maintain it →
            </Link>
            <p
              className="font-mono text-[color:var(--color-mute-2)]"
              style={{
                marginTop: '0.5rem',
                fontSize: '11px',
                letterSpacing: '0.04em',
              }}
            >
              standards.flintmere.com is provisioned; v1 publication follows.
            </p>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            Section 6 — Procurement
            legal-page-draft co-authored. Definition list pattern.
            Companies House number wired (13205428). Registered office
            wired (71–75 Shelton Street, Covent Garden, London, WC2H 9JQ).
            ICO registration in progress — value updates to the ICO number
            when confirmation lands.
            ────────────────────────────────────────────────────────────── */}
        <section
          id="procurement"
          aria-labelledby="procurement-heading"
          className="bg-[color:var(--color-paper-2)]"
        >
          <div
            className="mx-auto max-w-[1024px]"
            style={{
              paddingLeft: 'clamp(24px, 4vw, 48px)',
              paddingRight: 'clamp(24px, 4vw, 48px)',
              paddingTop: 'clamp(48px, 6vw, 80px)',
              paddingBottom: 'clamp(48px, 6vw, 80px)',
            }}
          >
            <p
              className="font-mono uppercase text-[color:var(--color-mute-2)]"
              style={{ fontSize: '11px', letterSpacing: '0.16em' }}
            >
              Procurement.
            </p>
            <h2
              id="procurement-heading"
              className="font-medium text-[color:var(--color-ink)]"
              style={{
                fontSize: 'clamp(24px, 2.5vw, 28px)',
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
                marginTop: 'clamp(16px, 2vw, 24px)',
              }}
            >
              For procurement officers.
            </h2>

            <dl
              className="grid"
              style={{
                marginTop: 'clamp(28px, 4vw, 40px)',
                gridTemplateColumns: 'minmax(180px, 240px) 1fr',
                rowGap: 'clamp(12px, 1.5vw, 18px)',
                columnGap: 'clamp(20px, 3vw, 40px)',
              }}
            >
              <ProcurementRow label="Legal entity" value="Eazy Access Ltd" />
              <ProcurementRow
                label="Trading name"
                value="Flintmere"
              />
              <ProcurementRow
                label="Country of incorporation"
                value="United Kingdom (England & Wales)"
              />
              <ProcurementRow
                label="Companies House number"
                value="13205428"
              />
              <ProcurementRow
                label="Registered office"
                value="71–75 Shelton Street, Covent Garden, London, WC2H 9JQ"
              />
              <ProcurementRow
                label="VAT registration"
                value="Not VAT-registered (Eazy Access Ltd is below the UK threshold)"
              />
              <ProcurementRow
                label="ICO registration"
                value="Registration in progress — confirmation pending"
              />
              <ProcurementRow
                label="Accountable director"
                value="John Morris"
              />
            </dl>

            <ul
              className="list-none"
              style={{
                marginTop: 'clamp(32px, 4vw, 48px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <ProcurementLink href="/privacy" label="Privacy Policy" />
              <ProcurementLink href="/terms" label="Terms of Service" />
              <ProcurementLink href="/cookies" label="Cookie Policy" />
              <ProcurementLink href="/dpa" label="Data Processing Agreement" />
              <ProcurementLink href="/security" label="Security disclosure" />
            </ul>

            <p
              className="font-mono text-[color:var(--color-mute-2)]"
              style={{
                marginTop: 'clamp(40px, 5vw, 64px)',
                fontSize: '11px',
                letterSpacing: '0.04em',
              }}
            >
              This page was last updated {LAST_UPDATED}. Reviewed by the
              Flintmere Legal Council on {LAST_UPDATED}.
            </p>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            Section 7 — Footer CTA (ghost, procurement context)
            ────────────────────────────────────────────────────────────── */}
        <section
          aria-label="Contact"
          className="mx-auto max-w-[1024px] text-center"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(48px, 6vw, 80px)',
            paddingBottom: 'clamp(48px, 6vw, 80px)',
          }}
        >
          <a
            href="mailto:hello@flintmere.com?subject=Flintmere%20%E2%80%94%20enquiry"
            className="inline-flex items-baseline gap-x-2 font-medium text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
            style={{
              fontSize: '18px',
              borderBottom: '1px solid var(--color-line)',
              paddingBottom: '0.25rem',
            }}
          >
            Talk to the Flintmere team →
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

interface ProcurementRowProps {
  label: string;
  value: string;
}

function ProcurementRow({ label, value }: ProcurementRowProps) {
  return (
    <>
      <dt
        className="font-mono uppercase text-[color:var(--color-mute-2)]"
        style={{ fontSize: '11px', letterSpacing: '0.12em', lineHeight: 1.5 }}
      >
        {label}
      </dt>
      <dd
        className="text-[color:var(--color-ink-2)]"
        style={{ fontSize: '15px', lineHeight: 1.55, margin: 0 }}
      >
        {value}
      </dd>
    </>
  );
}

interface ProcurementLinkProps {
  href: string;
  label: string;
}

function ProcurementLink({ href, label }: ProcurementLinkProps) {
  return (
    <li>
      <Link
        href={href}
        className="text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)] transition-colors duration-[var(--duration-instant)]"
        style={{ fontSize: '14px', textDecoration: 'underline' }}
      >
        {label} →
      </Link>
    </li>
  );
}
