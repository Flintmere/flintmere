/**
 * Page-scoped CSS for /methodology — choreography, scroll mechanics, and
 * source-row hover states.
 *
 * Why a string and not a CSS module: the page injects this via an inline
 * <style> tag so the choreographies ship server-rendered without any
 * build-time CSS processing. Pollutes nothing globally.
 *
 * The choreographies map to canonical scroll mechanics:
 *   - Pillar spread cascade — mechanic #7 (cascade fade-in), driven by
 *     `animation-timeline: view()` so the entrance is genuinely tied to
 *     viewport position rather than a one-shot IntersectionObserver fire.
 *   - Manifesto curtain rise — mechanic #3 (sticky-bottom curtain reveal),
 *     same view-timeline mechanism, on the headline only.
 *   - Source-row highlight — mechanic #8 (live cascade highlight) at hover
 *     fidelity; full-scroll highlight would strobe across 8 rows.
 *
 * Reduced-motion contract: a single `prefers-reduced-motion: reduce` block
 * at the foot of the file overrides every animation to none, every
 * transition to none, every transform to none. Per the soft scanner
 * contract (CLAUDE.md §Surface-specific reminders) — meaning survives the
 * motion strip; nothing collapses to invisible.
 */

export const methodologyStyles = `
  .methodology-list {
    list-style: none;
    padding: 0;
    margin-top: clamp(20px, 3vw, 32px);
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: var(--color-ink-2);
    font-size: 16px;
    line-height: 1.7;
    max-width: 64ch;
  }

  /* Pinned treemap — sticks to the viewport top through the pillar
     chapter so the seven-pillar geometry stays visible while the eye
     reads each spread. The bottom hairline seals the pin against the
     paper below. */
  .methodology-treemap-pin {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--color-paper);
    border-bottom: 1px solid var(--color-line);
  }

  /* Cascade fade-in for pillar spreads — the numeral, headline, and each
     prose row reveal as the spread enters viewport. Modern browsers get
     the genuine scroll-driven version via animation-timeline; older
     browsers see a single one-shot fade on first paint and that's it. */
  .methodology-spread__index,
  .methodology-spread__body h3,
  .methodology-spread__body-prose > * {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 480ms ease, transform 480ms cubic-bezier(0.2, 0.6, 0.2, 1);
  }

  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: view()) {
      /* Numeral lands fully crisp by the time the spread's top edge has
         travelled 25% of the entry range. Earlier "entry 60%" left it
         half-faded while the user was already reading the body. */
      .methodology-spread__index {
        animation: methodology-rise 1 linear both;
        animation-timeline: view();
        animation-range: entry 0% entry 25%;
      }
      .methodology-spread__body h3 {
        animation: methodology-rise 1 linear both;
        animation-timeline: view();
        animation-range: entry 5% entry 30%;
      }
      .methodology-spread__body-prose > *:nth-child(1) {
        animation: methodology-rise 1 linear both;
        animation-timeline: view();
        animation-range: entry 20% entry 70%;
      }
      .methodology-spread__body-prose > *:nth-child(2) {
        animation: methodology-rise 1 linear both;
        animation-timeline: view();
        animation-range: entry 30% entry 80%;
      }
      .methodology-spread__body-prose > *:nth-child(3) {
        animation: methodology-rise 1 linear both;
        animation-timeline: view();
        animation-range: entry 40% entry 90%;
      }
      .methodology-spread__body-prose > *:nth-child(4) {
        animation: methodology-rise 1 linear both;
        animation-timeline: view();
        animation-range: entry 50% entry 100%;
      }

      .methodology-curtain h2 {
        animation: methodology-curtain-rise 1 linear both;
        animation-timeline: view();
        animation-range: entry 0% entry 80%;
      }
    }
  }

  @keyframes methodology-rise {
    from {
      opacity: 0;
      transform: translateY(28px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes methodology-curtain-rise {
    from {
      opacity: 0;
      transform: translateY(64px);
      letter-spacing: -0.02em;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      letter-spacing: -0.04em;
    }
  }

  /* Manifesto anchor — the [ wrong ] inline bracket on the ink-slab
     curtain. Both the bracket glyphs (rendered by .bracket-inline's
     ::before/::after) and the inner word use amber on the dark ground;
     the ink-slab inversion makes amber-on-ink a high-contrast hit per
     the outline-shimmer canon (saved memory feedback_outline_shimmer_canon
     + tokens.md §Signature). */
  .methodology-curtain__anchor,
  .methodology-curtain__anchor::before,
  .methodology-curtain__anchor::after {
    color: var(--color-accent) !important;
    font-weight: 600;
  }

  /* Sources link — arrow nudges right on hover, underline thickens to
     amber. The row gets a soft amber wash on hover so the eye can track
     down the citation table without scanning. */
  .methodology-sources__link {
    color: var(--color-ink);
    text-decoration: underline;
    text-decoration-color: var(--color-line-soft);
    text-underline-offset: 6px;
    text-decoration-thickness: 1px;
    transition: text-decoration-color 200ms ease;
  }
  .methodology-sources__link:hover {
    text-decoration-color: var(--color-accent);
    text-decoration-thickness: 2px;
  }
  .methodology-sources__arrow {
    display: inline-block;
    margin-left: 0.5em;
    transition: transform 200ms ease;
  }
  .methodology-sources__link:hover .methodology-sources__arrow {
    transform: translateX(4px);
  }
  .methodology-sources__row:hover {
    background: rgba(248, 191, 36, 0.04);
  }

  @media (prefers-reduced-motion: reduce) {
    .methodology-spread__index,
    .methodology-spread__body h3,
    .methodology-spread__body-prose > *,
    .methodology-curtain h2 {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .methodology-sources__arrow,
    .methodology-treemap-pin a {
      transition: none !important;
    }
  }
`;
