// Inline mono confidence chip — borrows Stripe's `pi_…` ID pattern (one
// of the four DraftViewer pre-flight references): JetBrains Mono inline
// in body prose on warm cream. We use Geist Mono with the canon paper /
// ink palette and the diagnostic-amber accent for the low tier.
//
// Three tiers map to the LLM's confidence-score discipline:
//   ≥ 0.90 — high (solid ink fill, paper text)        "evidence"
//   0.60–0.89 — medium (outline only)                  "inference"
//   < 0.60 — low (amber fill, ink text)                "hypothesis — review"

interface ConfidenceBadgeProps {
  value: number
}

export function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  const pct = Math.round(value * 100)
  const tier: 'high' | 'medium' | 'low' =
    value >= 0.9 ? 'high' : value >= 0.6 ? 'medium' : 'low'

  return (
    <span
      role="img"
      aria-label={`confidence: ${pct} percent (${tier})`}
      style={{
        ...BASE,
        ...(tier === 'high' ? HIGH : tier === 'medium' ? MEDIUM : LOW),
      }}
    >
      {pct}%
    </span>
  )
}

const BASE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6875rem',
  letterSpacing: '0.06em',
  padding: '0.0625rem 0.4rem',
  border: '1px solid currentColor',
  borderRadius: 0,
  display: 'inline-block',
  whiteSpace: 'nowrap',
  verticalAlign: 'baseline',
  textTransform: 'uppercase',
}

const HIGH: React.CSSProperties = {
  background: 'var(--color-ink)',
  color: 'var(--color-paper)',
  borderColor: 'var(--color-ink)',
}

const MEDIUM: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--color-ink)',
}

const LOW: React.CSSProperties = {
  background: 'var(--color-accent)',
  color: 'var(--color-ink)',
  borderColor: 'var(--color-accent)',
}
