'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AuditDraft } from '@/lib/audit-draft/schema'
import type { PersistedAuditDraft } from '@/lib/audit-draft/db'
import { auditDraftToMarkdown } from '@/lib/audit-draft/markdown-export'
import { ExecSummaryPane } from './ExecSummaryPane'
import { PillarPane } from './PillarPane'
import { PrioritiesPane } from './PrioritiesPane'

interface DraftViewerProps {
  /** Persisted row — id, status, telemetry. */
  row: PersistedAuditDraft
  /** Initial editable body — the operator's saved edits if any, else raw. */
  initial: AuditDraft
}

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: Date }
  | { kind: 'error'; message: string }

type CopyState =
  | { kind: 'idle' }
  | { kind: 'copied'; at: Date }
  | { kind: 'error'; message: string }

export function DraftViewer({ row, initial }: DraftViewerProps) {
  const [draft, setDraft] = useState<AuditDraft>(initial)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const [copy, setCopy] = useState<CopyState>({ kind: 'idle' })
  const [, startTransition] = useTransition()
  const router = useRouter()
  const [status, setStatus] = useState<PersistedAuditDraft['status']>(row.status)

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial],
  )

  const persist = useCallback(
    async (body: { editedDraft?: AuditDraft; status?: typeof status; sentAt?: string }) => {
      setSave({ kind: 'saving' })
      try {
        const res = await fetch(`/api/admin/audit-draft/${row.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}))
          throw new Error(detail.message ?? `HTTP ${res.status}`)
        }
        const data = await res.json()
        setSave({ kind: 'saved', at: new Date() })
        if (data?.draft?.status) setStatus(data.draft.status)
        startTransition(() => router.refresh())
      } catch (err) {
        setSave({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
        })
      }
    },
    [row.id, router],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '2rem 0 1.5rem',
          borderBottom: '1px solid var(--color-line)',
        }}
      >
        <p
          className="eyebrow"
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          <span>Audit draft</span>
          <span aria-hidden="true">·</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{row.shop}</span>
          <span aria-hidden="true">·</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{row.bandSlug}</span>
          <span aria-hidden="true">·</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{row.vertical}</span>
        </p>
        <h1
          className="bracket"
          style={{
            margin: 0,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.1,
          }}
        >
          {row.shop}
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            color: 'var(--color-mute)',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <span>Model · {row.modelUsed}</span>
          <span>Latency · {(row.latencyMs / 1000).toFixed(1)}s</span>
          <span>
            Generated ·{' '}
            {new Date(row.generatedAt).toLocaleString('en-GB', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
          <span>Status · {status}</span>
        </p>
      </header>

      <ExecSummaryPane
        exec={draft.executiveSummary}
        revenueImpact={draft.estimatedRevenueImpact}
        onCommitExec={(exec) => setDraft({ ...draft, executiveSummary: exec })}
        onCommitRevenue={(revenue) =>
          setDraft({ ...draft, estimatedRevenueImpact: revenue })
        }
      />

      <section
        aria-labelledby="audit-draft-pillars"
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 0 1rem',
          borderBottom: '1px solid var(--color-line-soft)',
        }}
      >
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <p className="eyebrow">Pillar findings</p>
          <h2
            id="audit-draft-pillars"
            className="bracket"
            style={{ margin: 0, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}
          >
            Seven
          </h2>
        </header>
        {draft.pillarFindings.map((finding, i) => (
          <PillarPane
            key={finding.pillar}
            finding={finding}
            index={i}
            onCommit={(next) => {
              const fs = [...draft.pillarFindings]
              fs[i] = next
              setDraft({
                ...draft,
                pillarFindings: fs as AuditDraft['pillarFindings'],
              })
            }}
          />
        ))}
      </section>

      <PrioritiesPane
        priorities={draft.topPriorities}
        operatorTodos={draft.operatorTodos}
        onCommitPriority={(idx, next) => {
          const ps = [...draft.topPriorities]
          ps[idx] = next
          setDraft({
            ...draft,
            topPriorities: ps as AuditDraft['topPriorities'],
          })
        }}
        onCommitTodos={(operatorTodos) => setDraft({ ...draft, operatorTodos })}
      />

      <ActionBar
        dirty={dirty}
        save={save}
        copy={copy}
        status={status}
        onSave={() => persist({ editedDraft: draft })}
        onMarkSent={() =>
          persist({
            editedDraft: dirty ? draft : undefined,
            status: 'sent',
            sentAt: new Date().toISOString(),
          })
        }
        onCopyMarkdown={async () => {
          try {
            const md = auditDraftToMarkdown({
              draft,
              shop: row.shop,
              bandSlug: row.bandSlug,
              generatedAt: new Date(row.generatedAt),
            })
            await navigator.clipboard.writeText(md)
            setCopy({ kind: 'copied', at: new Date() })
          } catch (err) {
            setCopy({
              kind: 'error',
              message: err instanceof Error ? err.message : String(err),
            })
          }
        }}
      />
    </div>
  )
}

function ActionBar({
  dirty,
  save,
  copy,
  status,
  onSave,
  onMarkSent,
  onCopyMarkdown,
}: {
  dirty: boolean
  save: SaveState
  copy: CopyState
  status: PersistedAuditDraft['status']
  onSave: () => void
  onMarkSent: () => void
  onCopyMarkdown: () => void
}) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        background: 'var(--color-paper)',
        borderTop: '1px solid var(--color-line)',
        padding: '1rem 0',
        marginTop: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        zIndex: 10,
      }}
    >
      <p
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          color: 'var(--color-mute)',
        }}
      >
        {save.kind === 'idle' && (dirty ? 'Unsaved changes.' : 'Up to date.')}
        {save.kind === 'saving' && 'Saving…'}
        {save.kind === 'saved' &&
          `Saved ${save.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
        {save.kind === 'error' && (
          <span style={{ color: 'var(--color-alert)' }}>
            Save failed — {save.message}
          </span>
        )}
        {copy.kind === 'copied' && (
          <span style={{ marginLeft: '0.75rem' }}>
            · Markdown copied{' '}
            {copy.at.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {copy.kind === 'error' && (
          <span style={{ marginLeft: '0.75rem', color: 'var(--color-alert)' }}>
            · Copy failed — {copy.message}
          </span>
        )}
      </p>
      <div
        style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
      >
        <button
          type="button"
          onClick={onCopyMarkdown}
          style={secondaryButton(false)}
        >
          Copy as markdown
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={save.kind === 'saving' || !dirty}
          style={primaryButton(save.kind === 'saving' || !dirty)}
        >
          Save edits
        </button>
        <button
          type="button"
          onClick={onMarkSent}
          disabled={save.kind === 'saving' || status === 'sent'}
          style={secondaryButton(save.kind === 'saving' || status === 'sent')}
        >
          {status === 'sent' ? 'Sent' : 'Mark as sent'}
        </button>
      </div>
    </div>
  )
}

function primaryButton(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '0.625rem 1.25rem',
    border: '1px solid var(--color-ink)',
    background: disabled ? 'var(--color-paper-2)' : 'var(--color-ink)',
    color: disabled ? 'var(--color-mute)' : 'var(--color-paper)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 0,
  }
}

function secondaryButton(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '0.625rem 1.25rem',
    border: '1px solid var(--color-ink)',
    background: 'transparent',
    color: 'var(--color-ink)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    borderRadius: 0,
  }
}
