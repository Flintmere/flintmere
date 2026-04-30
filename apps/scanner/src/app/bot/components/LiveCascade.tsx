'use client';

/**
 * /bot Chapter 3 — Live cascade (THE STAR).
 *
 * Choreography: #4 + #8 paired (sanctioned per scroll-choreographies §9).
 *
 * Mechanic: section pins at viewport top for 400vh of scroll runway —
 * one base viewport + 100vh per example × 3 examples. Each 100vh slice
 * advances the active example index; the right-column mock document
 * re-mounts via key={exampleIndex} and re-fires its on-mount cascade so
 * the structured-data tokens light up amber as the parser walks them.
 *
 * Three demonstrations across the three surfaces FlintmereBot reads:
 *   /robots.txt      — what the store tells crawlers
 *   /products.json   — Shopify's public product feed
 *   JSON-LD          — what an agent extracts from a product page
 *
 * The page IS the demonstration of what the bot does. The metaphor is
 * enacted, not described — Stripe-docs typography reference.
 *
 * Implementation:
 *   - Plain rAF-throttled scroll listener (proven from ManifestoChord +
 *     PillarWheelScrollPin). No Framer Motion timing dependency.
 *   - exampleIndex derived from scroll progress over 400vh runway.
 *   - Right-column document panel re-mounts on key change so the token
 *     cascade replays per example.
 *   - Tokens use <strong> for semantic emphasis to assistive tech.
 *
 * Accessibility:
 *   - Visible mono panel is aria-hidden; sr-only narration at section
 *     opener describes what the bot reads (binding per
 *     scroll-choreographies.md §Composition rule #8).
 *   - aria-live="polite" on the example-label so transitions are
 *     announced.
 *   - Reduced-motion: all 3 examples render in end-state (tokens already
 *     amber) stacked vertically in normal flow — no pin, no scroll runway,
 *     no rAF listener.
 *
 * Council pre-flight: #6 Yann (signature — bracketed numerals as ledger),
 * #6 Idris (motion punctuation), #8 Noor (sr-only + reduced-motion + AAA
 * contrast on tokens), #15 Staff (mirrors ManifestoChord, no new deps).
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

type Segment =
  | { kind: 'prose'; text: string }
  | { kind: 'token'; text: string }
  | { kind: 'newline' };

interface Example {
  numeral: string;
  label: string;
  endpoint: string;
  prose: string; // sr-only natural-prose narration of what the example shows
  segments: Segment[];
}

const EXAMPLES: Example[] = [
  {
    numeral: '01',
    label: 'From your /robots.txt',
    endpoint: '/robots.txt',
    prose:
      "On a public Shopify storefront, FlintmereBot first reads /robots.txt to see what the store tells crawlers. The structured tokens we extract are the User-agent directive, Allow and Disallow paths, and the Sitemap URL.",
    segments: [
      { kind: 'token', text: 'User-agent: *' },
      { kind: 'newline' },
      { kind: 'token', text: 'Allow: /' },
      { kind: 'newline' },
      { kind: 'token', text: 'Disallow: /admin' },
      { kind: 'newline' },
      { kind: 'token', text: 'Sitemap: https://store.com/sitemap.xml' },
    ],
  },
  {
    numeral: '02',
    label: 'From /products.json',
    endpoint: '/products.json',
    prose:
      "FlintmereBot then reads /products.json — Shopify's public product feed, which Shopify itself exposes on every storefront. The structured tokens we extract include product id, title, vendor, barcode (GTIN), price, and image alt text.",
    segments: [
      { kind: 'prose', text: '{ "products": [' },
      { kind: 'newline' },
      { kind: 'prose', text: '  { ' },
      { kind: 'token', text: '"id": 7245' },
      { kind: 'prose', text: ', ' },
      { kind: 'token', text: '"title": "Hadlow Hill hot sauce 250ml"' },
      { kind: 'prose', text: ',' },
      { kind: 'newline' },
      { kind: 'prose', text: '    ' },
      { kind: 'token', text: '"vendor": "Hadlow Hill"' },
      { kind: 'prose', text: ', ' },
      { kind: 'token', text: '"product_type": "Condiments"' },
      { kind: 'prose', text: ',' },
      { kind: 'newline' },
      { kind: 'prose', text: '    "variants": [{ ' },
      { kind: 'token', text: '"barcode": "5060123456789"' },
      { kind: 'prose', text: ', ' },
      { kind: 'token', text: '"price": "8.50"' },
      { kind: 'prose', text: ' }],' },
      { kind: 'newline' },
      { kind: 'prose', text: '    "images": [{ "src": "…", ' },
      { kind: 'token', text: '"alt": "Hot sauce bottle"' },
      { kind: 'prose', text: ' }] }' },
      { kind: 'newline' },
      { kind: 'prose', text: '] }' },
    ],
  },
  {
    numeral: '03',
    label: "From a product page's JSON-LD",
    endpoint: '<script type="application/ld+json">',
    prose:
      "Finally FlintmereBot reads the JSON-LD block embedded in each product page — the structured-data block that AI shopping agents read when deciding to recommend the product. The tokens we extract are the schema.org type, product name, GTIN-13, brand, offer price, and currency.",
    segments: [
      { kind: 'prose', text: '{ ' },
      { kind: 'token', text: '"@type": "Product"' },
      { kind: 'prose', text: ',' },
      { kind: 'newline' },
      { kind: 'prose', text: '  ' },
      { kind: 'token', text: '"name": "Hadlow Hill hot sauce 250ml"' },
      { kind: 'prose', text: ',' },
      { kind: 'newline' },
      { kind: 'prose', text: '  ' },
      { kind: 'token', text: '"gtin13": "5060123456789"' },
      { kind: 'prose', text: ',' },
      { kind: 'newline' },
      { kind: 'prose', text: '  "brand": { ' },
      { kind: 'token', text: '"name": "Hadlow Hill"' },
      { kind: 'prose', text: ' },' },
      { kind: 'newline' },
      { kind: 'prose', text: '  "offers": { ' },
      { kind: 'token', text: '"price": "8.50"' },
      { kind: 'prose', text: ', ' },
      { kind: 'token', text: '"priceCurrency": "GBP"' },
      { kind: 'prose', text: ' } }' },
    ],
  },
];

// Container = 1 base viewport + N × 100vh runway. 4 viewport heights total.
const RUNWAY_PER_EXAMPLE_VH = 100;
const TOTAL_RUNWAY_VH = 100 + EXAMPLES.length * RUNWAY_PER_EXAMPLE_VH;

const TOKEN_INITIAL_DELAY = 600; // ms before the first token in each example fires
const TOKEN_STAGGER = 350; // ms between tokens — canon per scroll-choreographies #8

const proseStyle: CSSProperties = {
  color: 'var(--color-mute)',
};

function tokenStyle(delayMs: number, fired: boolean): CSSProperties {
  return {
    background: fired ? 'var(--color-accent)' : 'transparent',
    color: fired ? 'var(--color-accent-ink)' : 'var(--color-mute)',
    padding: '0.04em 0.32em',
    fontWeight: 700,
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
    transition: `background var(--duration-short) var(--ease-sharp) ${delayMs}ms, color var(--duration-short) var(--ease-sharp) ${delayMs}ms`,
  };
}

interface CodePanelProps {
  example: Example;
  // When true, all tokens are pre-fired (reduced-motion or prebake).
  preFired?: boolean;
}

function CodePanel({ example, preFired = false }: CodePanelProps) {
  const [fired, setFired] = useState(preFired);

  useEffect(() => {
    if (preFired) {
      setFired(true);
      return;
    }
    // On mount (per-example via key= remount), trigger the cascade.
    const t = window.setTimeout(() => setFired(true), 60);
    return () => window.clearTimeout(t);
  }, [preFired]);

  const out: ReactNode[] = [];
  let tokenIndex = 0;
  example.segments.forEach((s, i) => {
    if (s.kind === 'newline') {
      out.push(<br key={`br-${i}`} aria-hidden="true" />);
      return;
    }
    if (s.kind === 'prose') {
      out.push(
        <span key={`p-${i}`} style={proseStyle}>
          {s.text}
        </span>,
      );
      return;
    }
    const idx = tokenIndex++;
    const delay = TOKEN_INITIAL_DELAY + idx * TOKEN_STAGGER;
    out.push(
      <strong key={`t-${i}`} style={tokenStyle(fired ? 0 : delay, fired)}>
        {s.text}
      </strong>,
    );
  });

  return (
    <pre
      aria-hidden="true"
      className="font-mono"
      style={{
        margin: 0,
        padding: 'clamp(20px, 2vw, 32px)',
        background: 'var(--color-paper-2)',
        border: '1px solid var(--color-line)',
        fontSize: 'clamp(13px, 1.05vw, 16px)',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        overflowX: 'auto',
        color: 'var(--color-mute)',
      }}
    >
      {out}
    </pre>
  );
}

function ChapterHeading() {
  return (
    <>
      <p
        data-reveal
        className="font-mono uppercase"
        style={{
          fontSize: 'clamp(11px, 1.2vw, 13px)',
          letterSpacing: '0.18em',
          color: 'var(--color-mute)',
          fontWeight: 500,
          marginBottom: 'clamp(32px, 4vw, 64px)',
          ['--reveal-delay' as string]: '60ms',
        }}
      >
        <span aria-hidden="true">// </span>what flintmerebot extracts
      </p>
      <h2
        id="cascade-heading"
        className="font-sans font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)]"
        style={{ fontSize: 'clamp(40px, 5.5vw, 88px)', maxWidth: '20ch' }}
        data-reveal
      >
        Watch a parser read three documents.
      </h2>
    </>
  );
}

export function LiveCascade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (reducedMotion) return;
    const update = () => {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      if (range <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / range));
      const ei = Math.min(EXAMPLES.length - 1, Math.floor(progress * EXAMPLES.length));
      setExampleIndex(ei);
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    update();
    requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  // Reduced-motion fallback: render all 3 examples stacked vertically with
  // tokens pre-fired. The static end-state IS the message.
  if (reducedMotion) {
    return (
      <section
        id="cascade"
        aria-labelledby="cascade-heading"
        className="bg-[color:var(--color-paper)]"
        style={{
          paddingLeft: 'clamp(24px, 5vw, 64px)',
          paddingRight: 'clamp(24px, 5vw, 64px)',
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 14vh, 200px)',
        }}
      >
        <div className="mx-auto w-full max-w-[1280px]">
          <ChapterHeading />
          <p className="sr-only">
            FlintmereBot reads three public surfaces on a Shopify storefront:
            robots.txt, /products.json, and JSON-LD on individual product pages.
            From these we extract identifiers like GTIN, structured fields like
            brand, and prices.
          </p>
          <ol
            className="list-none m-0 p-0"
            style={{ marginTop: 'clamp(48px, 6vw, 96px)' }}
          >
            {EXAMPLES.map((ex) => (
              <li
                key={ex.numeral}
                style={{ marginBottom: 'clamp(48px, 6vw, 96px)' }}
              >
                <p className="sr-only">{ex.prose}</p>
                <p
                  className="font-mono uppercase"
                  aria-hidden="true"
                  style={{
                    fontSize: 'clamp(11px, 1vw, 13px)',
                    letterSpacing: '0.18em',
                    color: 'var(--color-mute-2)',
                    fontWeight: 500,
                    marginBottom: 12,
                  }}
                >
                  [ {ex.numeral} ] · {ex.label}
                </p>
                <CodePanel example={ex} preFired />
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  const current = EXAMPLES[exampleIndex] ?? EXAMPLES[0]!;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', height: `${TOTAL_RUNWAY_VH}vh` }}
    >
      <section
        id="cascade"
        aria-labelledby="cascade-heading"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'var(--color-paper)',
          paddingLeft: 'clamp(24px, 5vw, 64px)',
          paddingRight: 'clamp(24px, 5vw, 64px)',
          paddingTop: 'clamp(56px, 8vh, 112px)',
          paddingBottom: 'clamp(56px, 8vh, 112px)',
          overflow: 'hidden',
        }}
      >
        <div className="mx-auto w-full max-w-[1280px]">
          <ChapterHeading />
          <p className="sr-only">
            FlintmereBot reads three public surfaces on a Shopify storefront:
            robots.txt, /products.json, and JSON-LD on individual product pages.
            From these we extract identifiers like GTIN, structured fields like
            brand, and prices.
          </p>

          <div
            className="grid grid-cols-1 lg:grid-cols-[minmax(220px,_1fr)_minmax(0,_2fr)]"
            style={{
              marginTop: 'clamp(40px, 5vh, 80px)',
              gap: 'clamp(32px, 4vw, 64px)',
            }}
          >
            {/* Caption column */}
            <div className="lg:pt-2">
              <p
                className="font-mono"
                aria-live="polite"
                style={{
                  fontSize: 'clamp(20px, 2vw, 32px)',
                  letterSpacing: '-0.01em',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                }}
              >
                [ {current.numeral} / 03 ]
              </p>
              <p
                aria-live="polite"
                className="font-sans"
                style={{
                  marginTop: 'clamp(12px, 1.5vw, 20px)',
                  fontSize: 'clamp(18px, 1.4vw, 24px)',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.3,
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                }}
              >
                {current.label}
              </p>
              <div
                aria-hidden="true"
                className="mt-6"
                style={{
                  height: '2px',
                  width: 'clamp(120px, 10vw, 200px)',
                  background: 'var(--color-accent-sage)',
                  opacity: 0.85,
                }}
              />
              <p
                className="font-mono mt-6"
                style={{
                  fontSize: 'clamp(11px, 0.95vw, 13px)',
                  letterSpacing: '0.04em',
                  lineHeight: 1.7,
                  color: 'var(--color-mute-2)',
                }}
                aria-hidden="true"
              >
                Mute prose · Amber tokens = extracted
              </p>
            </div>

            {/* Right column — re-mount on example change so cascade replays */}
            <div>
              <CodePanel key={current.numeral} example={current} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
