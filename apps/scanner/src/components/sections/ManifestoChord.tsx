'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * ManifestoChord — Chapter 4, "Catalog Page Demo" with three rotating
 * product examples and live cascade-highlighting (operator request
 * 2026-04-29: "3 scrolling examples of this data gets highlighted live").
 *
 * Composition (top → bottom):
 *   1. Heading (h2 thesis at chord scale, bracket signature)
 *   2. Rotating demo — three product paragraphs cycle every 7s, with
 *      the structured fields cascade-highlighting amber as the user
 *      watches (Google's parser visualised)
 *   3. Caption — Geist Mono enumeration of the highlighted fields
 *   4. Index dots — manual override for the rotation
 *
 * Motion contract:
 *   - Auto-advance + cascade respect prefers-reduced-motion (single
 *     static example shown, all tokens highlighted on first frame)
 *   - AnimatePresence mode="wait" → fade-out completes before next
 *     example fades in (no overlap)
 *   - Cascade timing: paragraph fades in over 600ms, tokens highlight
 *     sequentially with 350ms stagger, settle at 2.4s total
 *   - Auto-advance fires at 7s (cascade settles by 2.4s, leaving ~4.5s
 *     to read before the next swap)
 *
 * Accessibility:
 *   - h2 reads as the section heading (brackets aria-hidden)
 *   - Demo region is aria-live="polite" so screen reader users get the
 *     active product announced as it changes
 *   - Each product has a sr-only natural-prose narration of its content
 *     (not a stripped-token summary — the prose IS what GMC consumes)
 *   - Index dots are <button> elements with aria-label per index, so
 *     keyboard users can navigate the rotation
 *
 * Council pre-flight: Yann #6 (bracket signature on heading), Noor #8
 * (paper-on-ink AAA, ink-on-amber AAA, reduced-motion safe), Marie #12
 * (cascade is content-revelation, not gratuitous), #11 voice (fictional
 * brands — Hadlow Hill, Camellia & Co., Castelli Bros. — no trademark),
 * #9+#23+#24 Legal Council (representative examples, no real product
 * data), #37 consumer-psych (rotating examples avoid reading-fatigue
 * on the second visit and demonstrate the metaphor across categories).
 */

type Segment =
  | { kind: 'prose'; text: string }
  | { kind: 'token'; text: string };

type Example = {
  prose: string; // sr-only natural-prose version of the whole paragraph
  segments: Segment[]; // visual segmentation with token highlighting
};

const EXAMPLES: Example[] = [
  {
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
    prose:
      'Hand-picked from a single garden in the Nilgiri hills, our flagship blend is a love letter to slow mornings. Brand: Camellia and Co. GTIN: 5061234567890. Net weight: 100 grams. Origin: Nilgiri, India. Each tin holds twenty-five cups of unhurried ritual. Ingredients: organic black tea 95 percent, bergamot oil, blue cornflower petals. Notes of citrus, malt, and morning. Caffeine: medium. Allergens: none declared. Category: Food and Drink, Tea, Loose leaf.',
    segments: [
      { kind: 'prose', text: 'Hand-picked from a single garden in the Nilgiri hills, our flagship blend is a love letter to slow mornings. ' },
      { kind: 'token', text: 'Brand: Camellia & Co.' },
      { kind: 'prose', text: ' ' },
      { kind: 'token', text: 'GTIN: 5061234567890. Net weight: 100 g. Origin: Nilgiri, India.' },
      { kind: 'prose', text: ' Each tin holds twenty-five cups of unhurried ritual. ' },
      { kind: 'token', text: 'Ingredients: organic black tea (95%), bergamot oil, blue cornflower petals.' },
      { kind: 'prose', text: ' Notes of citrus, malt, and morning. ' },
      { kind: 'token', text: 'Caffeine: medium. Allergens: none declared. Category: Food & Drink › Tea › Loose leaf.' },
    ],
  },
  {
    prose:
      'Cold-pressed within four hours of harvest from groves overlooking the Tuscan coast. Brand: Castelli Bros. GTIN: 5062345678901. Net volume: 500 millilitres. Acidity: 0.2 percent. Harvest: October 2025. The bottle is heavy, the oil is greener than you’d believe. A pour for finishing, not for frying. Ingredients: 100 percent Frantoio olive oil, single estate. Best within twelve months of opening. Allergens: none declared. Category: Food, Cooking and Baking, Olive oil.',
    segments: [
      { kind: 'prose', text: 'Cold-pressed within four hours of harvest from groves overlooking the Tuscan coast. ' },
      { kind: 'token', text: 'Brand: Castelli Bros.' },
      { kind: 'prose', text: ' ' },
      { kind: 'token', text: 'GTIN: 5062345678901. Net volume: 500 ml. Acidity: 0.2%. Harvest: October 2025.' },
      { kind: 'prose', text: ' The bottle is heavy, the oil is greener than you’d believe. A pour for finishing, not for frying. ' },
      { kind: 'token', text: 'Ingredients: 100% Frantoio olive oil, single estate.' },
      { kind: 'prose', text: ' Best within twelve months of opening. ' },
      { kind: 'token', text: 'Allergens: none declared. Category: Food › Cooking & Baking › Olive oil.' },
    ],
  },
];

const ROTATION_MS = 12000;
const FADE_DURATION = 1.0;

const proseStyle: CSSProperties = {
  color: 'var(--color-mute)',
};

const tokenSettledStyle: CSSProperties = {
  background: 'var(--color-accent)',
  color: 'var(--color-accent-ink)',
  padding: '0.04em 0.32em',
  fontWeight: 700,
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone',
};

export function ManifestoChord() {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % EXAMPLES.length);
    }, ROTATION_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const example = EXAMPLES[index] ?? EXAMPLES[0]!;

  // Cascade ordering — count tokens to space the highlight delays evenly.
  const tokenCount = example.segments.filter((s) => s.kind === 'token').length;
  let tokenIdx = -1;

  return (
    <section
      id="manifesto"
      aria-labelledby="manifesto-heading"
      className="relative flex flex-col justify-center bg-[color:var(--color-paper)]"
      style={{
        minHeight: '100vh',
        zIndex: 1,
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
        paddingTop: 'clamp(96px, 14vh, 200px)',
        paddingBottom: 'clamp(96px, 14vh, 200px)',
      }}
    >
      <h2
        id="manifesto-heading"
        className="font-sans"
        style={{
          fontSize: 'clamp(48px, 6vw, 96px)',
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

      {/* Demo region — three rotating examples. aria-live announces each
          new product to screen readers. The visible cascade is aria-hidden
          so screen readers get the natural-prose version (sr-only). */}
      <div
        role="region"
        aria-label="Catalog page examples"
        aria-live="polite"
        aria-atomic="true"
        className="relative w-full"
        style={{
          marginTop: 'clamp(48px, 6vh, 96px)',
          minHeight: 'clamp(280px, 36vh, 440px)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
            transition={{ duration: FADE_DURATION, ease: [0.4, 0, 0.2, 1] }}
            className="font-sans"
            style={{
              fontSize: 'clamp(22px, 2.4vw, 34px)',
              lineHeight: 1.55,
              letterSpacing: '-0.005em',
              textAlign: 'left',
            }}
          >
            <span className="sr-only">{example.prose}</span>
            <p aria-hidden="true">
              {example.segments.map((segment, i) => {
                if (segment.kind === 'prose') {
                  return (
                    <span key={i} style={proseStyle}>
                      {segment.text}
                    </span>
                  );
                }
                tokenIdx += 1;
                return (
                  <Token
                    key={i}
                    text={segment.text}
                    delay={reducedMotion ? 0 : 0.6 + tokenIdx * 0.35}
                    immediate={reducedMotion}
                  />
                );
              })}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <p
        className="font-mono uppercase"
        style={{
          marginTop: 'clamp(32px, 4vh, 56px)',
          fontSize: 'clamp(11px, 0.95vw, 13px)',
          letterSpacing: '0.18em',
          color: 'var(--color-mute-2)',
          fontWeight: 500,
          lineHeight: 1.6,
          textAlign: 'left',
        }}
      >
        // brand · gtin · weight · ingredients · allergens · category —
        what google reads. the rest is invisible.
      </p>

      {/* Index dots — manual override for the rotation. */}
      <div
        role="tablist"
        aria-label="Choose a catalog example"
        className="flex items-center"
        style={{
          marginTop: 'clamp(28px, 3.5vh, 48px)',
          gap: 'clamp(10px, 1vw, 14px)',
        }}
      >
        {EXAMPLES.map((_, i) => {
          const active = i === index;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Show example ${i + 1} of ${EXAMPLES.length}`}
              onClick={() => setIndex(i)}
              style={{
                width: active ? '28px' : '8px',
                height: '8px',
                borderRadius: '999px',
                background: active
                  ? 'var(--color-ink)'
                  : 'var(--color-line-soft)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition:
                  'width var(--duration-short) var(--ease-sharp), background var(--duration-short) var(--ease-sharp)',
              }}
            />
          );
        })}
      </div>

      <p className="sr-only" aria-hidden="true">
        {tokenCount} structured fields highlighted out of the full paragraph.
        The rest is invisible to AI shopping agents.
      </p>
    </section>
  );
}

interface TokenProps {
  text: string;
  delay: number;
  immediate: boolean;
}

function Token({ text, delay, immediate }: TokenProps): ReactNode {
  if (immediate) {
    return <span style={tokenSettledStyle}>{text}</span>;
  }
  return (
    <motion.span
      initial={{
        background: 'rgba(248, 191, 36, 0)',
        color: 'var(--color-mute)',
        fontWeight: 700,
      }}
      animate={{
        background: 'rgba(248, 191, 36, 1)',
        color: 'var(--color-accent-ink)',
      }}
      transition={{
        delay,
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        padding: '0.04em 0.32em',
        fontWeight: 700,
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
      }}
    >
      {text}
    </motion.span>
  );
}
