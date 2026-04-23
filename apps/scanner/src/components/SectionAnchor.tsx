/**
 * SectionAnchor — editorial background anchor for a section.
 *
 * Two variants:
 *   - numeral: giant Geist-Sans "01", "02"... at 6% ink. Magazine rhythm.
 *   - bracket: giant Geist-Mono "[" or "]" bleeding off one edge at 10% ink.
 *             Signature at scale.
 *
 * Decorative only. `aria-hidden="true"` — never text content.
 * Council seats: #6 Yann (signature), #7 Nina (one hero per section),
 * #3 Kate (editorial), #8 Noor (decorative + contrast-safe), #37
 * Consumer Psychologist (calm anchor, not noise).
 *
 * Parent must be `position: relative; overflow: hidden` — the
 * `.section-anchor-host` utility in globals.css does both.
 */

export type SectionAnchorSide = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface NumeralProps {
  variant: 'numeral';
  numeral: string;
  side?: SectionAnchorSide;
}

interface BracketProps {
  variant: 'bracket';
  bracket: '[' | ']';
  side?: SectionAnchorSide;
}

export type SectionAnchorProps = NumeralProps | BracketProps;

const SIDE_STYLE: Record<SectionAnchorSide, React.CSSProperties> = {
  'top-left': { top: '-0.1em', left: '-0.05em' },
  'top-right': { top: '-0.1em', right: '-0.05em' },
  'bottom-left': { bottom: '-0.15em', left: '-0.05em' },
  'bottom-right': { bottom: '-0.15em', right: '-0.05em' },
};

export function SectionAnchor(props: SectionAnchorProps) {
  const side = props.side ?? 'top-right';
  const style = SIDE_STYLE[side];

  if (props.variant === 'bracket') {
    return (
      <span
        aria-hidden="true"
        className="section-anchor section-anchor--bracket"
        style={style}
      >
        {props.bracket}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="section-anchor section-anchor--numeral"
      style={style}
    >
      {props.numeral}
    </span>
  );
}
