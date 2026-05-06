'use client'

import type { AuditDraft } from '@/lib/audit-draft/schema'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EditableText } from './EditableText'

interface ExecSummaryPaneProps {
  exec: AuditDraft['executiveSummary']
  revenueImpact: AuditDraft['estimatedRevenueImpact']
  onCommitExec: (
    next: AuditDraft['executiveSummary'],
  ) => void
  onCommitRevenue: (next: AuditDraft['estimatedRevenueImpact']) => void
}

export function ExecSummaryPane({
  exec,
  revenueImpact,
  onCommitExec,
  onCommitRevenue,
}: ExecSummaryPaneProps) {
  return (
    <section
      aria-labelledby="audit-draft-exec-summary"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '2rem 0',
        borderBottom: '1px solid var(--color-line-soft)',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p className="eyebrow">Executive summary</p>
        <h2
          id="audit-draft-exec-summary"
          className="bracket"
          style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}
        >
          Summary
        </h2>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p className="eyebrow-micro" style={{ margin: 0 }}>
          Headline
        </p>
        <h3
          style={{
            margin: 0,
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
            fontWeight: 500,
            lineHeight: 1.25,
          }}
        >
          <EditableText
            value={exec.headline}
            onCommit={(headline) => onCommitExec({ ...exec, headline })}
            ariaLabel="Executive summary headline"
            maxLength={180}
            emptyHint="A single-sentence deterministic-anchor headline"
          />
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p className="eyebrow-micro" style={{ margin: 0 }}>
          Body
        </p>
        <div style={{ fontSize: '1rem', lineHeight: 1.55 }}>
          <EditableText
            value={exec.body}
            onCommit={(body) => onCommitExec({ ...exec, body })}
            ariaLabel="Executive summary body"
            multiline
            maxLength={900}
            emptyHint="Two paragraphs of British, evidence-first prose"
          />
        </div>
      </div>

      <ConfidenceLine
        label="Summary confidence"
        value={exec.confidence}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          paddingTop: '1.5rem',
          borderTop: '1px dashed var(--color-line-soft)',
        }}
      >
        <p className="eyebrow-micro" style={{ margin: 0 }}>
          Estimated revenue impact
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            color: 'var(--color-mute)',
          }}
        >
          Modelled?{' '}
          <button
            type="button"
            onClick={() =>
              onCommitRevenue({
                ...revenueImpact,
                available: !revenueImpact.available,
              })
            }
            aria-pressed={revenueImpact.available}
            style={{
              fontFamily: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
              padding: '0.125rem 0.4rem',
              border: '1px solid currentColor',
              background: revenueImpact.available
                ? 'var(--color-ink)'
                : 'transparent',
              color: revenueImpact.available
                ? 'var(--color-paper)'
                : 'inherit',
              cursor: 'pointer',
              textTransform: 'uppercase',
              borderRadius: 0,
            }}
          >
            {revenueImpact.available ? 'Yes' : 'No'}
          </button>
        </p>
        <div style={{ fontSize: '1rem', lineHeight: 1.55 }}>
          <EditableText
            value={revenueImpact.summary}
            onCommit={(summary) => onCommitRevenue({ ...revenueImpact, summary })}
            ariaLabel="Estimated revenue impact summary"
            multiline
            maxLength={600}
            emptyHint="Either the modelled estimate or why it could not be modelled"
          />
        </div>
        {revenueImpact.confidence !== undefined && (
          <ConfidenceLine
            label="Revenue confidence"
            value={revenueImpact.confidence}
          />
        )}
      </div>
    </section>
  )
}

function ConfidenceLine({ label, value }: { label: string; value: number }) {
  return (
    <p
      style={{
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6875rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--color-mute)',
      }}
    >
      <span>{label}</span>
      <ConfidenceBadge value={value} />
    </p>
  )
}
