'use client';

/**
 * ManifestoChord — Chapter 4, "Catalogs as data".
 *
 * Choreography: #9 THE REDUCTION CASCADE × 3 (outside the canonical 8 in
 * memory/design/scroll-choreographies.md, ratified by council 2026-04-30).
 *
 * Mechanic: section pins at viewport top for 300vh of scroll runway —
 * three sequential reduction cascades, one per example. As the user
 * scrolls each 100vh slice, the current example's marketing prose fades
 * opacity 1 → 0 while structured-data tokens remain solid amber. Cross
 * the boundary, the paragraph swaps to the next example with full prose
 * visible, and the cascade replays.
 *
 * Three demonstrations across categories (hot sauce → tea → olive oil)
 * make the metaphor undeniable. The closing caption strengthens
 * throughout — by the end of the third cascade, it's fully resolved.
 *
 * Implementation:
 *   - Plain rAF-throttled scroll listener (proven pattern from chapter 2
 *     pillar wheel). No Framer Motion timing dependencies.
 *   - Single CSS custom property `--prose-fade` on the section drives
 *     prose opacity via the `.manifesto-prose-segment` rule in globals.css
 *   - Paragraph re-mounts on key={exampleIndex} with a CSS entrance
 *     animation (manifesto-paragraph-enter)
 *   - Tokens use <strong> for semantic emphasis to assistive tech
 *
 * Accessibility:
 *   - Visible paragraph is aria-hidden; sr-only narrates the natural
 *     prose so screen readers get clean text regardless of fade state
 *   - aria-live="polite" on the demo region announces example changes
 *   - Reduced-motion: all 3 examples render at end-state (tokens only)
 *     stacked statically in normal flow — no pin, no scroll runway
 *
 * Council pre-flight: #1 Massimo (typographic event), #2 Composition
 * (three demonstrations earn the runway), #3 Marie (scroll-driven mass
 * fade), #8 Noor (sr-only narration + reduced-motion end-state),
 * #11 founder voice (the company thesis enacted three times),
 * #34 conversion (visitor leaves the section primed for the closing
 * chord), #16 copy (closing caption locked declarative).
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useReducedMotion } from 'motion/react';

type Segment = { kind: 'prose'; text: string } | { kind: 'token'; text: string };

type Example = {
  numeral: string;
  category: string;
  prose: string;
  segments: Segment[];
};

const EXAMPLES: Example[] = [
  {
    numeral: '01',
    category: 'hot sauce',
    prose:
      'Made in small batches at our family farm in Sussex. Brand: Hadlow Hill. Each bottle is a labour of love, slow-fermented in oak barrels for that perfect heritage flavour your dinner guests will love. GTIN: 5060123456789. Net weight: 250 ml. Heat level: 4 of 5, medium-hot. This isn’t just hot sauce — it’s an experience, a journey, a story bottled. Ingredients: red habanero 52 percent, aged cider vinegar, sea salt, garlic, smoked paprika. Hand-poured, hand-labelled, hand-loved. Allergens: contains sulphites. Category: Food, Condiments, Hot sauce.',
    segments: [
      { kind: 'prose', text: 'Made in small batches at our family farm in Sussex. ' },
      { kind: 'token', text: 'Brand: Hadlow Hill.' },
      { kind: 'prose', text: ' Each bottle is a labour of love, slow-fermented in oak barrels for that perfect heritage flavour your dinner guests will love. ' },
      { kind: 'token', text: 'GTIN: 5060123456789. Net weight: 250 ml. Heat level: 4/5 (medium-hot).' },
      { kind: 'prose', text: ' This isn’t just hot sauce — it’s an experience, a journey, a story bottled. ' },
      { kind: 'token', text: 'Ingredients: red habanero (52%), aged cider vinegar, sea salt, garlic, smoked paprika.' },
      { kind: 'prose', text: ' Hand-poured, hand-labelled, hand-loved. ' },
      { kind: 'token', text: 'Allergens: contains sulphites. Category: Food › Condiments › Hot sauce.' },
    ],
  },
  {
    numeral: '02',
    category: 'tea',
    prose:
      'Hand-picked from a single garden in the Nilgiri hills, our flagship blend is a love letter to slow mornings. Brand: Camellia and Co. GTIN: 5061234567890. Net weight: 100 grams. Origin: Nilgiri, India. Each tin holds twenty-five cups of unhurried ritual. Ingredients: organic black tea 95 percent, bergamot oil, blue cornflower petals. Notes of citrus, malt, and morning. Caffeine: medium. Allergens: none declared. Category: Food and Drink, Tea, Loose leaf.',
    segments: [
      { kind: 'prose', text: 'Hand-picked from a single garden in the Nilgiri hills, our flagship blend is a love letter to slow mornings. ' },
      { kind: 'token', text: 'Brand: Camellia & Co.' },
      { kind: 'prose', text: ' Each tin holds twenty-five cups of unhurried ritual. ' },
      { kind: 'token', text: 'GTIN: 5061234567890. Net weight: 100 g. Origin: Nilgiri, India.' },
      { kind: 'prose', text: ' Notes of citrus, malt, and morning. ' },
      { kind: 'token', text: 'Ingredients: organic black tea (95%), bergamot oil, blue cornflower petals.' },
      { kind: 'prose', text: ' Brewed in twelve countries, we’re told. ' },
      { kind: 'token', text: 'Caffeine: medium. Allergens: none declared. Category: Food & Drink › Tea › Loose leaf.' },
    ],
  },
  {
    numeral: '03',
    category: 'olive oil',
    prose:
      'Cold-pressed within four hours of harvest from groves overlooking the Tuscan coast. Brand: Castelli Bros. GTIN: 5062345678901. Net volume: 500 millilitres. Acidity: 0.2 percent. Harvest: October 2025. The bottle is heavy, the oil is greener than you’d believe. A pour for finishing, not for frying. Ingredients: 100 percent Frantoio olive oil, single estate. Best within twelve months of opening. Allergens: none declared. Category: Food, Cooking and Baking, Olive oil.',
    segments: [
      { kind: 'prose', text: 'Cold-pressed within four hours of harvest from groves overlooking the Tuscan coast. ' },
      { kind: 'token', text: 'Brand: Castelli Bros.' },
      { kind: 'prose', text: ' The bottle is heavy, the oil is greener than you’d believe. A pour for finishing, not for frying. ' },
      { kind: 'token', text: 'GTIN: 5062345678901. Net volume: 500 ml. Acidity: 0.2%. Harvest: October 2025.' },
      { kind: 'prose', text: ' Best within twelve months of opening. ' },
      { kind: 'token', text: 'Ingredients: 100% Frantoio olive oil, single estate.' },
      { kind: 'prose', text: ' Suitable for slow-roast and salads alike. ' },
      { kind: 'token', text: 'Allergens: none declared. Category: Food › Cooking & Baking › Olive oil.' },
    ],
  },
];

const tokenStyle: CSSProperties = {
  background: 'var(--color-accent)',
  color: 'var(--color-accent-ink)',
  padding: '0.04em 0.32em',
  fontWeight: 700,
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone',
};

// Container = 1 base viewport + N × 100vh runway. Each example gets 100vh
// of scroll for its reduction cascade. Total = 400vh for 3 examples.
const RUNWAY_PER_EXAMPLE_VH = 100;
const TOTAL_RUNWAY_VH = 100 + EXAMPLES.length * RUNWAY_PER_EXAMPLE_VH;

export function ManifestoChord() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [fade, setFade] = useState(0);
  const [overall, setOverall] = useState(0);
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (reducedMotion) {
      setFade(1);
      setOverall(1);
      return;
    }
    const update = () => {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      if (range <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / range));

      const total = EXAMPLES.length;
      const ei = Math.min(total - 1, Math.floor(progress * total));
      const localProgress = progress * total - ei;
      // Active fade window 0→0.7; hold tail 0.7→1.0 so the user has time
      // to absorb the end-state before the example swaps.
      const localFade = Math.min(1, localProgress / 0.7);

      setExampleIndex(ei);
      setFade(localFade);
      setOverall(progress);
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

  const example = EXAMPLES[exampleIndex] ?? EXAMPLES[0]!;

  const renderSegments = (ex: Example): ReactNode =>
    ex.segments.map((s, i) =>
      s.kind === 'prose' ? (
        <span key={i} className="manifesto-prose-segment">
          {s.text}
        </span>
      ) : (
        <strong key={i} style={tokenStyle}>
          {s.text}
        </strong>
      ),
    );

  // Reduced-motion fallback: render all 3 examples stacked at end-state
  // (tokens only, prose hidden) in normal flow. The static end-state IS
  // the message — no scroll choreography needed when motion is suppressed.
  if (reducedMotion) {
    return (
      <section
        id="manifesto"
        aria-labelledby="manifesto-heading"
        className="bg-[color:var(--color-paper)]"
        style={{
          paddingLeft: 'clamp(24px, 6vw, 96px)',
          paddingRight: 'clamp(24px, 6vw, 96px)',
          paddingTop: 'clamp(96px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 14vh, 200px)',
          ['--prose-fade' as string]: 1,
        }}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <ManifestoHeading />
          <ol
            aria-label="Catalog page examples — what AI agents extract"
            className="list-none m-0 p-0"
            style={{ marginTop: 'clamp(40px, 5vh, 80px)' }}
          >
            {EXAMPLES.map((ex, i) => (
              <li
                key={i}
                style={{
                  marginBottom: 'clamp(40px, 5vh, 80px)',
                }}
              >
                <p
                  className="font-mono"
                  style={{
                    fontSize: 'clamp(11px, 0.95vw, 13px)',
                    letterSpacing: '0.18em',
                    color: 'var(--color-mute)',
                    fontWeight: 500,
                    marginBottom: 'clamp(12px, 1.5vw, 20px)',
                  }}
                  aria-hidden="true"
                >
                  // {ex.numeral} — {ex.category}
                </p>
                <span className="sr-only">{ex.prose}</span>
                <p
                  className="font-sans"
                  aria-hidden="true"
                  style={{
                    fontSize: 'clamp(20px, 1.8vw, 28px)',
                    lineHeight: 1.55,
                    letterSpacing: '-0.005em',
                    color: 'var(--color-mute)',
                  }}
                >
                  {renderSegments(ex)}
                </p>
              </li>
            ))}
          </ol>
          <ClosingCaption opacity={1} />
        </div>
      </section>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: `${TOTAL_RUNWAY_VH}vh`,
      }}
    >
      <section
        id="manifesto"
        aria-labelledby="manifesto-heading"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'var(--color-paper)',
          paddingLeft: 'clamp(24px, 6vw, 96px)',
          paddingRight: 'clamp(24px, 6vw, 96px)',
          paddingTop: 'clamp(56px, 8vh, 112px)',
          paddingBottom: 'clamp(56px, 8vh, 112px)',
          overflow: 'hidden',
          ['--prose-fade' as string]: fade,
        }}
      >
        <div className="mx-auto w-full max-w-[1100px]">
          <ManifestoHeading />

          {/* Example label — changes per example, gives category context */}
          <p
            className="font-mono"
            style={{
              fontSize: 'clamp(11px, 0.95vw, 13px)',
              letterSpacing: '0.18em',
              color: 'var(--color-mute)',
              fontWeight: 500,
              marginTop: 'clamp(28px, 3.5vh, 56px)',
              marginBottom: 'clamp(16px, 2vw, 28px)',
              textTransform: 'uppercase',
            }}
            aria-hidden="true"
          >
            // {example.numeral} of {String(EXAMPLES.length).padStart(2, '0')} — {example.category}
          </p>

          {/* The paragraph — re-mounted per example via key={exampleIndex}.
              Prose spans fade via --prose-fade; tokens remain. Entrance
              animation defined in globals.css §manifesto-paragraph-enter. */}
          <p
            key={exampleIndex}
            className="font-sans manifesto-paragraph"
            aria-live="polite"
            style={{
              fontSize: 'clamp(20px, 1.8vw, 28px)',
              lineHeight: 1.55,
              letterSpacing: '-0.005em',
              color: 'var(--color-mute)',
            }}
          >
            <span className="sr-only">{example.prose}</span>
            <span aria-hidden="true">{renderSegments(example)}</span>
          </p>

          {/* Closing caption — opacity rises with overall progress, so it
              gains presence as the cascade plays out three times. By the
              end of the runway, it's fully resolved. */}
          <ClosingCaption opacity={Math.max(0.3, overall)} />
        </div>
      </section>
    </div>
  );
}

function ManifestoHeading() {
  return (
    <h2
      id="manifesto-heading"
      className="font-sans"
      style={{
        fontSize: 'clamp(36px, 4.5vw, 72px)',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1.05,
        color: 'var(--color-ink)',
      }}
    >
      <span style={{ display: 'block' }}>
        <span
          className="font-mono"
          aria-hidden="true"
          style={{ fontWeight: 700, marginRight: '0.18em' }}
        >
          [
        </span>
        Catalogs as data
        <span
          className="font-mono"
          aria-hidden="true"
          style={{ fontWeight: 700, marginLeft: '0.12em' }}
        >
          ]
        </span>
        .
      </span>
      <span style={{ display: 'block' }}>Or catalogs nowhere.</span>
    </h2>
  );
}

function ClosingCaption({ opacity }: { opacity: number }) {
  return (
    <p
      className="font-mono uppercase"
      style={{
        marginTop: 'clamp(28px, 3.5vh, 56px)',
        fontSize: 'clamp(11px, 0.95vw, 13px)',
        letterSpacing: '0.18em',
        color: 'var(--color-ink)',
        fontWeight: 700,
        lineHeight: 1.6,
        opacity,
        transition: 'opacity 0.2s linear',
      }}
    >
      // this is what an AI agent reads on your store.
      <br />
      // the rest is invisible.
    </p>
  );
}
