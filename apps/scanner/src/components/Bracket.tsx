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
 */

import type { ReactNode } from 'react';

export interface BracketProps {
  children: ReactNode;
  size?: 'default' | 'display' | 'micro';
  interactive?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<Required<BracketProps>['size'], string> = {
  default: 'text-[inherit]',
  display: 'text-[0.8em]', // display heading already sets the scale
  micro: 'text-[11px] tracking-[0.14em]',
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
        <span aria-hidden="true" className={`bracket-char ${sizeClass} ${className}`}>
          [&nbsp;
        </span>
        <span
          className={`${sizeClass} ${className}`}
          style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
        >
          {children}
        </span>
        <span aria-hidden="true" className={`bracket-char ${sizeClass} ${className}`}>
          &nbsp;]
        </span>
      </>
    );
  }

  return (
    <span className={`bracket ${sizeClass} ${className}`}>{children}</span>
  );
}
