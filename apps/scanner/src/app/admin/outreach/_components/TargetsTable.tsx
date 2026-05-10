'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface EnrichmentDraftShape {
  recipientEmail?: { value: string | null; confidence: string }
  firstName?: { value: string | null; confidence: string }
  llmReasoning?: string
}

interface Target {
  id: string
  shopDomain: string
  recipientEmail: string | null
  firstName: string | null
  score: number | null
  grade: string | null
  productCount: number | null
  status: string
  subjectVariant: string
  source: string
  createdAt: Date
  sentAt: Date | null
  repliedAt: Date | null
  enrichmentDraft: unknown
  enrichmentAttemptedAt: Date | null
  enrichmentFailedReason: string | null
}

interface TargetsTableProps {
  targets: Target[]
}

export function TargetsTable({ targets }: TargetsTableProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (targets.length === 0) {
    return (
      <p
        role="status"
        style={{
          marginTop: '2rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          color: 'var(--color-ink-2)',
        }}
      >
        No targets in this view. Upload the cohort CSV above or change the filter.
      </p>
    )
  }

  async function patchTarget(id: string, body: Record<string, unknown>) {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/outreach/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string }
        setError(data.message ?? `PATCH failed (${res.status})`)
        return
      }
      startTransition(() => router.refresh())
    } finally {
      setBusy(null)
    }
  }

  async function sendNow(id: string, kind: 'initial' | 'followup') {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/outreach/${id}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        reason?: string
      }
      if (!res.ok || !data.ok) {
        setError(data.reason ?? `send failed (${res.status})`)
        return
      }
      startTransition(() => router.refresh())
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          style={{
            margin: '1rem 0',
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--color-alert)',
            color: 'var(--color-alert)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </p>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-line)', textAlign: 'left' }}>
              <th style={th}>Domain</th>
              <th style={th}>Email</th>
              <th style={th}>First name</th>
              <th style={th}>Score</th>
              <th style={th}>Status</th>
              <th style={th}>Variant</th>
              <th style={th}>Sent</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((t) => (
              <TargetRow
                key={t.id}
                target={t}
                busy={busy === t.id || pending}
                onPatch={(body) => patchTarget(t.id, body)}
                onSend={(kind) => sendNow(t.id, kind)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function TargetRow(props: {
  target: Target
  busy: boolean
  onPatch: (body: Record<string, unknown>) => Promise<void>
  onSend: (kind: 'initial' | 'followup') => Promise<void>
}) {
  const { target: t, busy, onPatch, onSend } = props
  const [email, setEmail] = useState(t.recipientEmail ?? '')
  const [firstName, setFirstName] = useState(t.firstName ?? '')

  const draft = (t.enrichmentDraft && typeof t.enrichmentDraft === 'object')
    ? (t.enrichmentDraft as EnrichmentDraftShape)
    : null
  const draftEmail = draft?.recipientEmail?.value ?? null
  const draftName = draft?.firstName?.value ?? null
  const hasUsableDraft = (draftEmail || draftName) && !t.recipientEmail
  const applyDraft = () => {
    if (draftEmail) setEmail(draftEmail)
    if (draftName) setFirstName(draftName)
  }

  const enrichDirty = email !== (t.recipientEmail ?? '') || firstName !== (t.firstName ?? '')
  const canQueue = t.status === 'enriched' && t.recipientEmail && t.score != null
  const canSend = t.status === 'queued'
  const canFollowup = t.status === 'sent' && t.sentAt && Date.now() - t.sentAt.getTime() > 5 * 24 * 60 * 60 * 1000
  const canMarkReplied = t.status === 'sent' || t.status === 'followed_up'

  return (
    <tr style={{ borderBottom: '1px solid var(--color-line-soft)' }}>
      <td style={td}>
        <div>{t.shopDomain}</div>
        {hasUsableDraft && (
          <div style={draftHintStyle}>
            <button type="button" onClick={applyDraft} disabled={busy} style={draftBtnStyle}>
              apply draft
            </button>
            {draftEmail && <span>{draftEmail} <em style={confStyle}>({draft?.recipientEmail?.confidence})</em></span>}
            {draftName && <span>· {draftName} <em style={confStyle}>({draft?.firstName?.confidence})</em></span>}
          </div>
        )}
        {t.enrichmentFailedReason && !hasUsableDraft && (
          <div style={draftHintStyle}>
            <em style={{ color: 'var(--color-alert)' }}>enrich failed: {t.enrichmentFailedReason}</em>
          </div>
        )}
      </td>
      <td style={td}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hello@example.com"
          disabled={busy}
          style={inputStyle}
        />
      </td>
      <td style={td}>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Sam"
          disabled={busy}
          style={inputStyle}
        />
      </td>
      <td style={td}>
        {t.score != null ? `${t.score}/${t.grade ?? '?'}` : <span style={{ color: 'var(--color-ink-2)' }}>—</span>}
      </td>
      <td style={td}>
        <StatusBadge status={t.status} />
      </td>
      <td style={td}>
        <select
          value={t.subjectVariant}
          onChange={(e) => onPatch({ subjectVariant: e.target.value })}
          disabled={busy}
          style={inputStyle}
        >
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      </td>
      <td style={td}>
        {t.sentAt ? new Date(t.sentAt).toISOString().slice(0, 10) : <span style={{ color: 'var(--color-ink-2)' }}>—</span>}
      </td>
      <td style={{ ...td, whiteSpace: 'nowrap' }}>
        {enrichDirty && (
          <button
            type="button"
            onClick={() => {
              const next: Record<string, unknown> = {}
              if (email !== (t.recipientEmail ?? '')) next.recipientEmail = email || null
              if (firstName !== (t.firstName ?? '')) next.firstName = firstName || null
              if (email && t.score != null) next.status = 'enriched'
              return onPatch(next)
            }}
            disabled={busy}
            style={btnStyle}
          >
            save
          </button>
        )}
        {canQueue && (
          <button
            type="button"
            onClick={() => onPatch({ status: 'queued' })}
            disabled={busy}
            style={btnStyle}
          >
            queue
          </button>
        )}
        {canSend && (
          <button
            type="button"
            onClick={() => onSend('initial')}
            disabled={busy}
            style={btnStyleSend}
          >
            send
          </button>
        )}
        {canFollowup && (
          <button
            type="button"
            onClick={() => onSend('followup')}
            disabled={busy}
            style={btnStyle}
          >
            +5d
          </button>
        )}
        {canMarkReplied && (
          <button
            type="button"
            onClick={() => onPatch({ status: 'replied' })}
            disabled={busy}
            style={btnStyle}
          >
            replied
          </button>
        )}
      </td>
    </tr>
  )
}

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    pending: '#8B8D95',
    enriched: '#5A6B4D',
    queued: '#0A0A0B',
    sent: '#F8BF24',
    followed_up: '#F8BF24',
    replied: '#5A6B4D',
    unsubscribed: '#8B8D95',
    bounced: '#B33A3A',
    dropped: '#8B8D95',
  }
  const colour = palette[status] ?? '#8B8D95'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.1rem 0.5rem',
        border: `1px solid ${colour}`,
        color: colour,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {status}
    </span>
  )
}

const th: React.CSSProperties = {
  padding: '0.5rem 0.5rem',
  fontSize: '0.6875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--color-ink-2)',
  fontWeight: 500,
}
const td: React.CSSProperties = {
  padding: '0.5rem 0.5rem',
  verticalAlign: 'middle',
}
const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8125rem',
  padding: '0.25rem 0.4rem',
  border: '1px solid var(--color-line)',
  background: 'transparent',
  color: 'var(--color-ink)',
  width: '100%',
  minWidth: '8rem',
}
const btnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  padding: '0.25rem 0.6rem',
  border: '1px solid var(--color-ink)',
  background: 'transparent',
  color: 'var(--color-ink)',
  cursor: 'pointer',
  marginRight: '0.25rem',
}
const btnStyleSend: React.CSSProperties = {
  ...btnStyle,
  background: 'var(--color-ink)',
  color: 'var(--color-paper)',
}
const draftHintStyle: React.CSSProperties = {
  marginTop: '0.25rem',
  fontSize: '0.6875rem',
  color: 'var(--color-ink-2)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  alignItems: 'center',
}
const draftBtnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.625rem',
  padding: '0.1rem 0.4rem',
  border: '1px solid var(--color-line)',
  background: 'transparent',
  color: 'var(--color-ink)',
  cursor: 'pointer',
}
const confStyle: React.CSSProperties = {
  fontStyle: 'normal',
  color: 'var(--color-ink-2)',
  fontSize: '0.6875rem',
}
