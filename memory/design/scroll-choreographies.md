# Scroll choreographies — the canonical seven

> Editorial pages live or die by **rhythm**. A page that uses one motion register everywhere falls into a single key — readers tune out. A page that uses seven different mechanics with no logic is chaos. The goal is *one chord per chapter, no two adjacent chapters in the same key*.
>
> This document is the canonical reference. The `design-scroll-choreography` skill draws from it when choosing a mechanic for a new surface.

**Last reviewed:** 2026-04-29 — added to canon after Apple iPhone 17 Pro reference walkthrough. **2026-04-29 update:** added #8 Live cascade highlight after chapter 4 (ManifestoChord) review surfaced a token-level reveal pattern not covered by the original seven.

---

## The seven mechanics

Each entry contains: **what**, **reads as**, **when to use**, **when not to use**, **implementation recipe**, **accessibility contract**, **performance note**, **canonical reference**.

### #1 — Static photo + type lead

**What:** No scroll-driven motion. Strong photoreal image (or product still) + bold display headline + minimal supporting copy. Section enters viewport via the user's natural scroll; nothing inside the section moves in response to scroll.

**Reads as:** Confidence. Editorial cover. *"This is the thing."*

**When to use:**
- The chapter is the page's headline moment (homepage hero, blog cover, marketing-page lead)
- The proposition is strong enough to land without theatrics
- The image alone carries weight (warm-treated photoreal, ≤100KB AVIF, no SaaS stock tropes per `tokens.md` §Imagery)

**When NOT to use:**
- The chapter is in the middle of the page (no motion register = forgettable)
- The content is enumerative (lists, comparisons, walkthroughs)

**Implementation recipe:**
- Section element with `position: relative`, `overflow: hidden` (for image bleeds)
- Photo as `<Image fill priority>` with `objectFit: cover` and `--image-treatment-warm` filter
- Headline at clamp(48, 9vw, 144) Geist Sans 700 with bracket signature
- No `data-reveal`, no scroll-bound transforms — true static

**Accessibility contract:**
- `<Image alt="...">` describes the photographic still in 12–25 words, neutral tone
- Headline as `<h1>`/`<h2>` with semantic role
- Bracket characters wrapped in `aria-hidden="true"` so screen reader hears prose

**Performance:** Highest possible. No JS, no scroll listeners. Image is the only cost.

**Canonical reference:** Flintmere chapter 1 (Hero) — `apps/scanner/src/app/page.tsx` §Chapter 1.

---

### #2 — Sticky-top scroll-over

**What:** Section pins at the top of the viewport (`position: sticky; top: 0`). The next chapter, in normal flow with an opaque background and higher z-index, scrolls *up over* the pinned section like a curtain rising. By the end of the pin range, the next chapter fully covers the pinned one; the pinned section then unsticks and both scroll off as one unit.

**Reads as:** *"This moment matters — pause and read."* The pivot from one beat (the pinned voice/proof) to the next (the demonstration that follows).

**When to use:**
- A trust-building or claim-asserting chapter (founder voice, mission, manifesto)
- The next chapter is the proof or demonstration of what the pinned one asserts
- The reader benefits from the assertion sitting in mind while the proof scrolls past

**When NOT to use:**
- The pinned content is too tall for one viewport (overflow during pin)
- The next chapter has no opaque background to perform the cover (translucent backgrounds break the curtain)
- The reader is meant to compare side-by-side (use #5 instead)

**Implementation recipe:**
```css
.curtain-pair {
  position: relative;
  z-index: 0;
  isolation: isolate; /* essential — prevents stacking-context leaks */
}
.pinned-chapter {
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 0;
}
.scrolling-over-chapter {
  position: relative;
  z-index: 1;
  background: var(--color-paper); /* opaque is mandatory */
  min-height: 100vh;
}
```
Wrap the pinned chapter + the scrolling-over chapter in `.curtain-pair` so the pin range is bounded by the wrapper's bottom edge (not the entire `<main>`).

**Accessibility contract:**
- Pinning is structural (CSS-only, no animation) — works under `prefers-reduced-motion` automatically
- Both chapters keep semantic structure; screen readers narrate them in DOM order regardless of visual stacking
- Keyboard tab order follows DOM order (use `tabindex` cautiously if the pin obscures focusable elements)

**Performance:** CSS-only. Zero JS cost. One stacking context per pair.

**Canonical reference:** Flintmere chapter 3 (Founder strip) → chapter 4 (Manifesto). Apple iPhone 17 Pro feature pin → next-feature transitions.

---

### #3 — Sticky-bottom curtain reveal

**What:** Section pinned at the bottom of the viewport (`position: sticky; bottom: 0; z-index: -1`) behind the page. Content above it scrolls off the top of the viewport, progressively uncovering the pinned section. Used for closing moments — the page builds, then peels away to reveal the chord beneath.

**Reads as:** *A close. The closing chord.* The page arrives somewhere it has been waiting for the whole time.

**When to use:**
- Footer-level closing moments (wordmark, legal-entity strip, closing thesis)
- The "behind the page all along" feeling — typically only the LAST chapter
- Maximum once per page — multiple sticky-bottom reveals dilute each other

**When NOT to use:**
- Mid-page transitions (the close-feeling doesn't fit)
- Two sticky-bottom panels in the same stacking context (they collide; source-order tie-break paints later one over the other — use scoped wrappers if absolutely required)

**Implementation recipe:**
```css
.main-wrap {
  position: relative;
  z-index: 0;
  isolation: isolate;
  background: var(--color-paper);
}
.footer-curtain {
  position: sticky;
  bottom: 0;
  z-index: -1;
  min-height: 100vh;
}
```
Main wrap's `isolation: isolate` is non-negotiable — without it the negative z-index leaks. Scope the rule to the homepage (or the specific surface) so non-curtain pages don't get the negative-z behaviour by accident — see Flintmere `globals.css` `.flintmere-main .flintmere-footer-sticky`.

**Accessibility contract:**
- Same as #2 — CSS-only structural mechanic, no motion involvement
- Footer content stays in DOM order at the end of `<main>`; screen readers narrate naturally

**Performance:** CSS-only, zero JS.

**Canonical reference:** Flintmere chapter 5 (SiteFooter). ABCS Agency `ashleybrookecs.com` footer wordmark reveal.

---

### #4 — Pinned section + scroll-driven state

**What:** Section pins at viewport top (or fills the viewport), and the user's scroll input drives an *internal state change* — active wedge cycles, image gallery advances, slider position moves, value counts up. Scroll progress 0→1 maps to a state range (e.g., 0→6 active pillars).

**Reads as:** *"I'm walking you through this."* Each unit of scroll is a unit of progress through a sequence.

**When to use:**
- Enumerative content (lists, taxonomies, multi-step processes, focal-length galleries)
- Sequence is essential — order matters, each step builds on the last
- The user benefits from controlling pace (manual scroll = read time; can stop and absorb)

**When NOT to use:**
- The content is non-sequential or compare-across (#5 fits better)
- The sequence is shorter than 3 items (a normal section with cascade fade-in is enough)
- The runway exceeds 5–6 viewport heights (scroll fatigue — break the sequence into two chapters)

**Implementation recipe:**
```tsx
'use client';
import { useRef, useState } from 'react';
import { useScroll, useMotionValueEvent, useReducedMotion } from 'motion/react';

const SCROLL_PER_STEP_VH = 50; // 30–60vh per step is the comfortable range

export function ScrollPin({ steps }: { steps: Step[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (reducedMotion) return;
    const next = Math.min(steps.length - 1, Math.max(0, Math.floor(progress * steps.length)));
    if (next !== active) setActive(next);
  });

  if (reducedMotion) return <Component steps={steps} />; // unpinned fallback

  const runwayVh = 100 + steps.length * SCROLL_PER_STEP_VH;
  return (
    <div ref={containerRef} style={{ position: 'relative', height: `${runwayVh}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <Component steps={steps} active={active} onActiveChange={setActive} />
      </div>
    </div>
  );
}
```

**Accessibility contract:**
- `prefers-reduced-motion: reduce` → return the unpinned component with native click/keyboard navigation. Scroll-driven state advance is disabled.
- The underlying component must remain keyboard-navigable when controlled (arrow keys, Tab, Home/End — see `PillarWheel`)
- ARIA: `role="region"` on the pinned container, `aria-live="polite"` if state changes announce content (e.g., active item label)

**Performance:** Single scroll listener via Motion's `useScroll` (passive, RAF-throttled). State updates only when active index changes (cheap). Avoid re-rendering the whole component each scroll tick.

**Canonical reference:** Flintmere chapter 2 (Pillars Wheel scroll-pin) — `PillarWheelScrollPin.tsx`. Apple iPhone camera focal-length scrub (`/iphone-17-pro/`).

---

### #5 — Dual-column pin + scrollable companion

**What:** Two-column layout where one column pins (sticky-top-0) and the other scrolls. Typically the *text* column pins and the *visual* column scrolls — text stays anchored as the reader takes in supporting imagery, code, or feature carousel one beat at a time.

**Reads as:** Editorial spread. *"Stay-and-see."* The left voice persists; the right gallery cycles.

**When to use:**
- Long-form features with multiple supporting visuals (camera feature → 5 photo examples)
- Documentation/explainer chapters where the *what* (text) frames the *how* (visuals)
- Comparison where one side is the constant and the other varies

**When NOT to use:**
- Mobile-only experience (two columns collapse to stack — the dual-column logic doesn't translate)
- Text and visual are equal-weight (use #4 instead)
- The text would dominate too long (>3 viewport heights of pinned text exhausts attention)

**Implementation recipe:**
```css
.dual-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(48px, 6vw, 96px);
}
.pinned-col {
  position: sticky;
  top: clamp(80px, 10vh, 120px); /* leave room for header */
  align-self: start;
  height: fit-content;
}
.scrolling-col > * + * {
  margin-top: 100vh; /* one viewport per panel — adjust per content density */
}
@media (max-width: 768px) {
  .dual-col { grid-template-columns: 1fr; }
  .pinned-col { position: static; }
}
```

**Accessibility contract:**
- Mobile reflow stacks columns — pinning disabled below breakpoint
- Both columns keep semantic structure (`<aside>` for the pinned column if it's secondary, otherwise plain divs)
- Reduced-motion: keep the pin (it's structural), but if the right column has animated transitions between panels, disable those

**Performance:** CSS-only sticky on the pinned column. Right column is normal flow.

**Canonical reference:** Apple `/iphone-17-pro/` camera capabilities section. Stripe documentation pages.

---

### #6 — Stacked card overlay

**What:** Content rendered as a stack of cards. As the user scrolls, each card enters the viewport from below and stacks on top of the previous one with a slight z-offset and shadow. Earlier cards remain visible behind, slightly recessed, building a *deck* of points.

**Reads as:** Cumulative argument. *"Each card builds."*

**When to use:**
- 3–5 sequential points where the reader benefits from seeing the prior context (case studies, principles, decision steps)
- Editorial pieces where the *accumulation* is part of the meaning
- Pricing tier comparisons where each tier sits on top of the last

**When NOT to use:**
- Too many items (>6 cards become a wall of paper — use #4 instead)
- Items are independent and don't accumulate logic (use cascade #7)
- Mobile-first surfaces where the card stack flattens to a stack-list (loses the layering metaphor)

**Implementation recipe:**
```tsx
// Each card uses position: sticky with progressively offset top values
// so they stack as user scrolls. Or use Framer Motion + IntersectionObserver
// for a pinned-scroll-stack with explicit offsets.

// CSS-only minimum:
.card {
  position: sticky;
  top: calc(80px + var(--card-index) * 16px); /* stagger offset */
  margin-top: 60vh; /* scroll runway between cards */
  background: var(--color-paper-2);
  border: 1px solid var(--color-line-soft);
  box-shadow: var(--shadow-paper-1);
}
```

**Accessibility contract:**
- Cards stay in DOM order; screen readers narrate sequentially
- Each card has `<h3>` heading inside; sequence is implicit
- Reduced-motion: drop the sticky stacking, render as plain stacked cards with normal scroll

**Performance:** CSS-only, multiple sticky elements (cheap). One repaint per card entry.

**Canonical reference:** Apple iOS feature cards (Liquid Glass, Lock Screen, Call Screening). Linear changelog cards.

---

### #7 — Cascade fade-in

**What:** Section enters viewport via the user's scroll; child elements (heading, body, CTA, supporting copy) fade up sequentially with stagger delays. Each element appears after the previous, building the section in front of the reader.

**Reads as:** Energetic but lightweight. *Everyday motion.* The page is alive but not theatrical.

**When to use:**
- Most sections that don't warrant a stronger mechanic
- Body content, secondary chapters, supporting beats
- Pages where motion needs to feel *present* but not *dominant*

**When NOT to use:**
- The section has structural weight (use #1 static, #2 sticky-top, or #4 pinned instead)
- The cascade would compete with another active mechanic (e.g., right next to a sticky-top scroll-over)
- Above-the-fold content (cascade-on-load can flash; prefer static or skeleton)

**Implementation recipe:**
```tsx
// Pair with the existing ViewportReveal contract.
<section>
  <p data-reveal style={{ '--reveal-delay': '0ms' }}>// eyebrow</p>
  <h2 data-reveal style={{ '--reveal-delay': '120ms' }}>Headline</h2>
  <p data-reveal style={{ '--reveal-delay': '240ms' }}>Body copy</p>
  <a data-reveal style={{ '--reveal-delay': '360ms' }}>CTA</a>
</section>
```
The CSS contract is already defined in `globals.css` `[data-reveal]` — opacity 0 + translateY(8) → opacity 1 + translateY(0) on `.is-visible`. The `ViewportReveal` component handles the IntersectionObserver toggle.

**Accessibility contract:**
- Global `@media (prefers-reduced-motion: reduce)` block in `globals.css` scales transition-duration to 0.01ms — reduced-motion users land on the end-state instantly. No additional handling required.
- Children remain in DOM order; semantic structure unaffected

**Performance:** Single IntersectionObserver per ViewportReveal wrapper. Zero scroll-listener cost.

**Canonical reference:** Flintmere section openers throughout (`page.tsx` chapter 2 opener). Used as the default mechanic when nothing stronger is justified.

#### Refinement: Word-cascade with beat

For **display headlines only** (≥48px), the cascade can drop down a level — each *word* fades in independently rather than each *element*. Apple iPhone product pages use this pattern as the signature text move; it makes display headlines land word-by-word like footsteps rather than appearing as a block.

**When to use:**
- Display headlines on chapter openers (chord-scale, ≥48px)
- Two-line headlines with weight-shift between lines (assertion → punchline)
- Hero or chapter-cover moments where reader cadence matters

**When NOT to use:**
- Body copy (per-word cascade is fatiguing at body scale)
- Eyebrows / captions / labels (too small for per-word stagger to register)
- Surfaces with heavy motion already (avoid stacking — one cadence per chapter)

**Timing constants (Apple-pattern):**
- Entry delay before line 1: **200ms** (lets eyebrow settle first)
- Stagger per word in line 1: **120ms**
- Pause between lines: **300ms** (the beat)
- Stagger per word in line 2: **150ms** (slower for punchline emphasis)
- Hairline / following decoration: appears after line 2 completes (~3000ms total for a typical 9+5-word two-liner)

**Implementation recipe:**
```tsx
const LINE_1 = 'Your headline first line.'.split(' ');
const LINE_2 = 'Punchline second line.'.split(' ');
const ENTRY_DELAY = 200, STAGGER_1 = 120, LINE_GAP = 300, STAGGER_2 = 150;
const line1Total = ENTRY_DELAY + LINE_1.length * STAGGER_1;

<h2>
  <span className="sr-only">{LINE_1.join(' ')} {LINE_2.join(' ')}</span>
  <span aria-hidden="true">
    <span className="block font-medium">
      {LINE_1.map((word, i) => (
        <span key={i} data-reveal style={{
          display: 'inline-block',
          marginRight: i < LINE_1.length - 1 ? '0.28em' : 0,
          ['--reveal-delay' as string]: `${ENTRY_DELAY + i * STAGGER_1}ms`,
        }}>{word}</span>
      ))}
    </span>
    <span className="block font-bold mt-2">
      {LINE_2.map((word, i) => (
        <span key={i} data-reveal style={{
          display: 'inline-block',
          marginRight: i < LINE_2.length - 1 ? '0.28em' : 0,
          ['--reveal-delay' as string]: `${line1Total + LINE_GAP + i * STAGGER_2}ms`,
        }}>{word}</span>
      ))}
    </span>
  </span>
</h2>
```

**Accessibility:**
- Wrap word-cascade in `aria-hidden="true"` parent; provide `<span className="sr-only">` with the natural prose so screen readers narrate the heading as one continuous phrase, not 14 word-fragments
- `prefers-reduced-motion: reduce` → global `globals.css` block scales transition-duration to 0.01ms, words land instantly on entry

**Canonical reference:** Flintmere chapter 2 opener (`page.tsx` §pillars-heading) — 9-word + 5-word two-liner with weight-shift, cadence completes at ~3000ms.

---

### #8 — Live cascade highlight

**What:** Section reveals **structured tokens within prose** sequentially via stagger animation. The prose stays muted; only the data tokens (brand, GTIN, weight, ingredients, allergens, category — the things a parser extracts) light up in succession, visualising the act of an AI agent reading the page in real time. The page IS the demonstration of how machines see text — not described, *enacted*.

**Reads as:** Enactive demonstration. *"Watch the parser read."* The reader sees what gets extracted and what doesn't. The metaphor lands without prose explaining it.

**When to use:**
- Demonstrating AI agent / scanner / parser extraction of structured data from unstructured copy
- Educational content where the *reveal of structure* is the editorial point
- "Show, don't tell" demonstrations of catalog readiness, log parsing, document AI, structured-output models
- Pairs with #4 (pinned + scroll-driven advance) for multi-example demonstrations across product categories or content types

**When NOT to use:**
- General body content (#7 cascade fade-in does this without token-level highlight, and is lighter-weight)
- Content where the prose itself is the message (highlighting tokens distracts from the read)
- Surfaces with strict performance budgets (per-token animation has measurable cost on long paragraphs)
- Single-state surfaces with no varying examples — one cascade is a moment; the metaphor lands stronger across multiple examples

**Implementation recipe:**

Define content as a `Segment[]` with two kinds — `prose` (mute, static) and `token` (cascade-highlighted):

```tsx
type Segment =
  | { kind: 'prose'; text: string }
  | { kind: 'token'; text: string };

const segments: Segment[] = [
  { kind: 'prose', text: 'Made in small batches at our family farm. ' },
  { kind: 'token', text: 'Brand: Hadlow Hill.' },
  { kind: 'prose', text: ' Each bottle is a labour of love. ' },
  { kind: 'token', text: 'GTIN: 5060123456789. Net weight: 250 ml.' },
  // ...
];
```

Render via `motion.span` per token with cascading delay:

```tsx
{segments.map((segment, i) => {
  if (segment.kind === 'prose') {
    return <span key={i} style={{ color: 'var(--color-mute)' }}>{segment.text}</span>;
  }
  return (
    <motion.span
      key={i}
      initial={reducedMotion ? false : { background: 'rgba(248,191,36,0)', color: 'var(--color-mute)' }}
      animate={{ background: 'rgba(248,191,36,1)', color: 'var(--color-accent-ink)' }}
      transition={{ delay: 0.6 + tokenIndex * 0.35, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '0.04em 0.32em', fontWeight: 700, boxDecorationBreak: 'clone' }}
    >
      {segment.text}
    </motion.span>
  );
})}
```

Stagger constants: **350ms per token** (canonical), **600ms initial delay** before first token (lets the prose settle). Total cascade time = `600 + tokens × 350`ms. For 4 tokens: ~2 seconds.

Pair with #4 if multiple examples: pin the section, scroll progress drives example index, cascade re-fires on each index change via `key={index}` on the `motion.div` parent (forces remount).

**Accessibility contract:**
- The visible cascade is **`aria-hidden="true"`** — the metaphor is purely visual; screen reader users can't perceive amber highlighting
- Provide a **`<span className="sr-only">`** with the **full natural-prose version** of the paragraph so screen readers narrate the content as readable text, not stripped tokens
- The caption naming the highlighted fields (e.g., `// brand · gtin · weight · ingredients — what google reads`) is **NOT aria-hidden** — it gives screen readers an audio-equivalent of the visual metaphor
- `prefers-reduced-motion: reduce` → tokens render in **settled state** (amber bg, ink text) on first frame; no animation, no stagger
- Tokens must hit AAA contrast in their settled state (ink on amber ≈ 9.8:1 ✓)

**Performance:**
- Per-token `motion.span` for the active example only (other examples not in DOM if combined with #4 + AnimatePresence)
- Mount cost: ~4–6 motion components per cascade (typical token count)
- Cascade fires on entry (or on state change in #4 hybrid); no continuous scroll listener required
- Reduced-motion path skips the motion components entirely (cheaper render)

**Canonical reference:** Flintmere chapter 4 (ManifestoChord) — `apps/scanner/src/components/sections/ManifestoChord.tsx`. Demonstrates the cascade across three rotating product examples (Hadlow Hill / Camellia & Co. / Castelli Bros.), each with 4 token highlights staggered 350ms apart.

**Pairing:** designed to pair with **#4 pinned + scroll-driven state** when multiple examples need to advance. Solo (without #4) it works for single-state surfaces where the section enters viewport once and the cascade plays once.

---

## Decision matrix

When designing a new surface, walk this tree:

| Question | If YES → mechanic |
|---|---|
| Is this the homepage hero / blog cover / page lead? | **#1 Static photo + type lead** |
| Is this the page's closing chord (footer wordmark, manifesto close)? | **#3 Sticky-bottom curtain reveal** (only once per page) |
| Is this a trust beat asserted before its proof in the next chapter? | **#2 Sticky-top scroll-over** |
| Is this section *demonstrating* parsing / AI reading / extraction of structured tokens from prose? | **#8 Live cascade highlight** (often paired with #4 if multi-example) |
| Is the content a sequence of 3+ enumerated steps/items where order matters? | **#4 Pinned section + scroll-driven state** |
| Are there 3–5 cards/points that build cumulatively? | **#6 Stacked card overlay** |
| Is there a persistent voice + a varying companion (text + gallery)? | **#5 Dual-column pin + scrollable companion** |
| None of the above — does the section need to feel alive but not dominant? | **#7 Cascade fade-in** (default fallback) |

## Composition rules (binding)

1. **No two adjacent chapters in the same mechanic.** Page rhythm is the point. Adjacent identical mechanics flatten into one beat.
2. **Maximum one #3 (sticky-bottom curtain reveal) per page.** It's the close. Multiple closes mean no close.
3. **Maximum one #1 (static) per page above the fold.** Static is the cover; the cover happens once.
4. **#4 and #5 each need ≥2 viewport heights of scroll runway minimum.** Below that, downgrade to #7 cascade.
5. **#2 (sticky-top) requires the next chapter to have an opaque background.** Translucency breaks the curtain.
6. **Multiple sticky elements at z:-1 in the same stacking context collide.** Use scoped wrappers with `isolation: isolate`. (Flintmere `.flintmere-curtain-pair` is the canonical pattern.)
7. **Reduced-motion fallback is mandatory for #4.** The pinned scroll-driven state must collapse to native click/keyboard navigation under `prefers-reduced-motion: reduce`. (Sticky positioning on its own is structural and survives reduced-motion automatically — only the *scroll-driven advance* needs explicit handling.)
8. **#8 must include sr-only natural prose.** The visual cascade is aria-hidden; without an sr-only fallback, screen reader users get nothing. The caption naming the highlighted fields is a soft second-line of defence but does not replace the prose narration.
9. **#8 + #4 is a sanctioned pairing**, not a violation of "one mechanic per chapter." Treat them as one composite mechanic ("scroll-driven cascade carousel") for variety-budget purposes — counts as one entry against the page's mechanic count.

## Page-level pacing budget

A typical Flintmere marketing page has 4–6 chapters. The variety budget per page:

- **3–5 distinct mechanics** is the target — enough variety, not chaos
- **At most 6 mechanics** (the seventh becomes scrollers' fatigue)
- **Cascade fade-in (#7)** can repeat across multiple sections without counting against the variety budget — it's the *default*, not a *featured* mechanic

A page with 5 chapters might use: #1 hero / #4 pinned scroll-driven / #5 dual-column pin / #4+#8 cascade carousel / #3 sticky-bottom curtain. Five distinct mechanics across five chapters. (This is Flintmere's homepage post-Batch B 2026-04-29.)

## Cross-references

- `memory/design/motion.md` — broader motion canon (easing tokens, durations, signature motion); scroll choreographies are a specialised motion family within it.
- `memory/design/accessibility.md` — Noor's veto rules, reduced-motion contract.
- `memory/design/tokens.md` — colour, type, signature; backgrounds for #2 and #3 must be opaque canon colours.
- Skill: `design-scroll-choreography` — picks the right mechanic for a surface using this document.
