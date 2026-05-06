'use client'

import type { AuditDraft, PillarFinding } from '@/lib/audit-draft/schema'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EditableText } from './EditableText'

interface PillarPaneProps {
  finding: PillarFinding
  index: number
  onCommit: (next: PillarFinding) => void
}

export function PillarPane({ finding, index, onCommit }: PillarPaneProps) {
  const titleId = `audit-draft-pillar-${finding.pillar}`
  return (
    <section
      aria-labelledby={titleId}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 200px) 1fr',
        gap: '1.5rem',
        padding: '1.75rem 0',
        borderBottom: '1px solid var(--color-line-soft)',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p
          className="eyebrow-micro"
          style={{ margin: 0, color: 'var(--color-mute)' }}
        >
          Pillar {index + 1}
        </p>
        <h3
          id={titleId}
          className="bracket"
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {finding.pillar}
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '1.5rem',
            lineHeight: 1.1,
          }}
          aria-label={`Score ${finding.score} of 100, rating ${finding.rating}`}
        >
          {finding.score}
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-mute)',
              marginLeft: '0.25rem',
            }}
          >
            /100
          </span>
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-mute)',
          }}
        >
          Rating · {finding.rating}
        </p>
        <ConfidenceBadge value={finding.confidence} />
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p className="eyebrow-micro" style={{ margin: 0 }}>
            Observations
          </p>
          <div style={{ fontSize: '0.9375rem', lineHeight: 1.55 }}>
            <EditableText
              value={finding.observations}
              onCommit={(observations) => onCommit({ ...finding, observations })}
              ariaLabel={`Observations for ${finding.pillar}`}
              multiline
              maxLength={1500}
              emptyHint="What the catalog evidence shows for this pillar"
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p className="eyebrow-micro" style={{ margin: 0 }}>
            Actionable fixes ({finding.actionableFixes.length} of 5)
          </p>
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {finding.actionableFixes.map((fix, fixIdx) => (
              <li
                key={fixIdx}
                style={{
                  borderTop: '1px dashed var(--color-line-soft)',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                  }}
                >
                  <p
                    className="bracket-inline"
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Fix {fixIdx + 1}
                  </p>
                  <EffortImpactToggle
                    label="Effort"
                    value={fix.effort}
                    onChange={(effort) =>
                      replaceFix(finding, onCommit, fixIdx, { ...fix, effort })
                    }
                  />
                  <EffortImpactToggle
                    label="Impact"
                    value={fix.impact}
                    onChange={(impact) =>
                      replaceFix(finding, onCommit, fixIdx, { ...fix, impact })
                    }
                  />
                  <ConfidenceBadge value={fix.confidence} />
                  <button
                    type="button"
                    onClick={() => removeFix(finding, onCommit, fixIdx)}
                    aria-label={`Remove fix ${fixIdx + 1}`}
                    style={{
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '0.125rem 0.4rem',
                      border: '1px solid var(--color-line-soft)',
                      background: 'transparent',
                      color: 'var(--color-mute)',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ fontWeight: 500 }}>
                  <EditableText
                    value={fix.title}
                    onCommit={(title) =>
                      replaceFix(finding, onCommit, fixIdx, { ...fix, title })
                    }
                    ariaLabel={`Fix ${fixIdx + 1} title`}
                    maxLength={120}
                    emptyHint="Short, imperative title"
                  />
                </div>
                <div style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
                  <EditableText
                    value={fix.detail}
                    onCommit={(detail) =>
                      replaceFix(finding, onCommit, fixIdx, { ...fix, detail })
                    }
                    ariaLabel={`Fix ${fixIdx + 1} detail`}
                    multiline
                    maxLength={600}
                    emptyHint="What to do, in operator-readable detail"
                  />
                </div>
              </li>
            ))}
          </ol>
          {finding.actionableFixes.length < 5 && (
            <button
              type="button"
              onClick={() => addFix(finding, onCommit)}
              style={{
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '0.4rem 0.8rem',
                border: '1px solid var(--color-ink)',
                background: 'transparent',
                color: 'var(--color-ink)',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              + Add fix
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function replaceFix(
  finding: PillarFinding,
  onCommit: (next: PillarFinding) => void,
  idx: number,
  next: AuditDraft['pillarFindings'][number]['actionableFixes'][number],
) {
  const fixes = [...finding.actionableFixes]
  fixes[idx] = next
  onCommit({ ...finding, actionableFixes: fixes })
}

function removeFix(
  finding: PillarFinding,
  onCommit: (next: PillarFinding) => void,
  idx: number,
) {
  const fixes = finding.actionableFixes.filter((_, i) => i !== idx)
  onCommit({ ...finding, actionableFixes: fixes })
}

function addFix(
  finding: PillarFinding,
  onCommit: (next: PillarFinding) => void,
) {
  if (finding.actionableFixes.length >= 5) return
  onCommit({
    ...finding,
    actionableFixes: [
      ...finding.actionableFixes,
      {
        title: '',
        detail: '',
        effort: 'medium',
        impact: 'medium',
        confidence: 0.6,
      },
    ],
  })
}

function EffortImpactToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: 'low' | 'medium' | 'high'
  onChange: (next: 'low' | 'medium' | 'high') => void
}) {
  const next = value === 'low' ? 'medium' : value === 'medium' ? 'high' : 'low'
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      aria-label={`${label}: ${value}; click to cycle`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6875rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '0.125rem 0.4rem',
        border: '1px solid currentColor',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        borderRadius: 0,
      }}
    >
      {label} · {value}
    </button>
  )
}
