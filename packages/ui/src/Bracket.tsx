/**
 * The legibility-bracket signature primitive.
 *
 * Canonical spec: memory/design/tokens.md §Signature.
 * Rule: one bracket per section, two per page max. Bracket nouns / numbers / identifiers,
 * never verbs or fillers.
 *
 * Accessibility rules (memory/design/accessibility.md §The legibility bracket):
 * - On body prose and headings: brackets are part of the sentence. Let screen readers announce them.
 * - On interactive elements (buttons, links): wrap brackets in aria-hidden and pass a clean aria-label on the parent.
 *   Use <Bracket interactive> in that case.
 *
 * Sizes:
 * - default: inherits from the parent (used inline in body / headings).
 * - display: 0.8em — used inside display headings that already set the scale.
 * - micro: 11px / 0.14em tracking — used in mono captions.
 * - saks: clamp(140px, 16vw, 280px), weight 500 — Saks-Fifth-Avenue logotype-
 *   scale event for hero anchors. The bracket characters become the brand
 *   mark at hero scale, not inline formatting. Use sparingly — typically once
 *   per top-level surface as the page's cover-art moment.
 *   (Added 2026-04-29 under design-extravagant skill, dispatch #2.)
 */

import * as React from 'react';

export interface BracketProps {
  children: React.ReactNode;
  size?: 'default' | 'display' | 'micro' | 'saks';
  interactive?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<Required<BracketProps>['size'], string> = {
  default: 'text-[inherit]',
  display: 'text-[0.8em]', // display heading already sets the scale
  micro: 'text-[11px] tracking-[0.14em]',
  saks: 'text-[clamp(96px,12vw,200px)] tracking-[-0.02em] leading-[1]',
};

export function Bracket({
  children,
  size = 'default',
  interactive = false,
  className = '',
}: BracketProps) {
  const sizeClass = SIZE_CLASS[size];

  if (interactive) {
    return (
      <>
        <span
          aria-hidden="true"
          className={`bracket-char ${sizeClass} ${className}`}
          style={{ marginRight: '0.16em' }}
        >
          [
        </span>
        <span
          className={`${sizeClass} ${className}`}
          style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
        >
          {children}
        </span>
        <span
          aria-hidden="true"
          className={`bracket-char ${sizeClass} ${className}`}
          style={{ marginLeft: '0.16em' }}
        >
          ]
        </span>
      </>
    );
  }

  // Saks-scale variant: cover-art moment at hero scale. Inherits .bracket's
  // weight 700 (uniform across bracket sizes) and layers the
  // .flintmere-outline-shimmer canon — ink stroke + amber shimmer-sweep
  // through the letterforms (paper-context). Matches the closing-chord
  // wordmark signature in the footer; together they bracket the page with
  // two typographic anchor moments (operator-locked 2026-04-30).
  if (size === 'saks') {
    return (
      <span
        className={`bracket flintmere-outline-shimmer ${sizeClass} ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span className={`bracket ${sizeClass} ${className}`}>{children}</span>
  );
}
