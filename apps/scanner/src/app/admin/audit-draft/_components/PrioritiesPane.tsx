'use client'

import type { AuditDraft, TopPriority } from '@/lib/audit-draft/schema'
import { PILLARS } from '@/lib/audit-draft/schema'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EditableText } from './EditableText'

interface PrioritiesPaneProps {
  priorities: AuditDraft['topPriorities']
  operatorTodos: AuditDraft['operatorTodos']
  onCommitPriority: (idx: number, next: TopPriority) => void
  onCommitTodos: (next: AuditDraft['operatorTodos']) => void
}

export function PrioritiesPane({
  priorities,
  operatorTodos,
  onCommitPriority,
  onCommitTodos,
}: PrioritiesPaneProps) {
  return (
    <section
      aria-labelledby="audit-draft-priorities"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '2rem 0',
        borderBottom: '1px solid var(--color-line-soft)',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p className="eyebrow">Top priorities</p>
        <h2
          id="audit-draft-priorities"
          className="bracket"
          style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}
        >
          Five
        </h2>
      </header>

      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {priorities.map((p, i) => (
          <li
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr',
              gap: '1.25rem',
              padding: '1.25rem 0',
              borderTop:
                i === 0 ? 'none' : '1px dashed var(--color-line-soft)',
            }}
          >
            <p
              className="bracket-inline"
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '1.5rem',
                lineHeight: 1.1,
              }}
              aria-label={`Priority rank ${p.rank}`}
            >
              {p.rank}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: '1.0625rem',
                  lineHeight: 1.35,
                }}
              >
                <EditableText
                  value={p.title}
                  onCommit={(title) => onCommitPriority(i, { ...p, title })}
                  ariaLabel={`Priority ${p.rank} title`}
                  maxLength={120}
                  emptyHint="Single-sentence title"
                />
              </div>
              <div style={{ fontSize: '0.9375rem', lineHeight: 1.55 }}>
                <EditableText
                  value={p.rationale}
                  onCommit={(rationale) =>
                    onCommitPriority(i, { ...p, rationale })
                  }
                  ariaLabel={`Priority ${p.rank} rationale`}
                  multiline
                  maxLength={400}
                  emptyHint="Why it ranks here, evidence-grounded"
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <PillarSelect
                  value={p.pillarRef}
                  onChange={(pillarRef) =>
                    onCommitPriority(i, { ...p, pillarRef })
                  }
                  ariaLabel={`Priority ${p.rank} pillar reference`}
                />
                <ConfidenceBadge value={p.confidence} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-line-soft)',
        }}
      >
        <p className="eyebrow-micro" style={{ margin: 0 }}>
          Operator TBDs ({operatorTodos.length})
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            color: 'var(--color-mute)',
            lineHeight: 1.5,
          }}
        >
          Items the LLM declined to fabricate. Resolve each before send,
          either by editing the draft to fill the gap or by removing the
          TBD if it&apos;s no longer applicable.
        </p>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {operatorTodos.map((todo, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                lineHeight: 1.55,
                color: 'var(--color-ink-2)',
                paddingLeft: '0.75rem',
                borderLeft: '2px solid var(--color-accent)',
              }}
            >
              <div style={{ flex: 1 }}>
                <EditableText
                  value={todo}
                  onCommit={(next) => {
                    const updated = [...operatorTodos]
                    if (next.length === 0) {
                      onCommitTodos(updated.filter((_, i) => i !== idx))
                    } else {
                      updated[idx] = next
                      onCommitTodos(updated)
                    }
                  }}
                  ariaLabel={`Operator TBD ${idx + 1}`}
                  multiline
                  maxLength={280}
                  emptyHint="(empty — will be removed on blur)"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onCommitTodos(operatorTodos.filter((_, i) => i !== idx))
                }
                aria-label={`Remove TBD ${idx + 1}`}
                style={{
                  fontFamily: 'inherit',
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
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onCommitTodos([...operatorTodos, ''])}
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
          + Add TBD
        </button>
      </div>
    </section>
  )
}

function PillarSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: TopPriority['pillarRef']
  onChange: (next: TopPriority['pillarRef']) => void
  ariaLabel: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TopPriority['pillarRef'])}
      aria-label={ariaLabel}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6875rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '0.125rem 0.4rem',
        border: '1px solid var(--color-ink)',
        background: 'transparent',
        color: 'var(--color-ink)',
        borderRadius: 0,
        cursor: 'pointer',
      }}
    >
      {PILLARS.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  )
}
