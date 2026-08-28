'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SCANNER_HOST } from '@/lib/host-routing'

export function CohortUpload() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [source, setSource] = useState('cohort-2026-05-09')
  const [csv, setCsv] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onUpload() {
    if (!csv.trim()) {
      setError('Paste CSV content into the textarea first.')
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/outreach/cohort', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv, source }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        inserted?: number
        updated?: number
        skipped?: number
        message?: string
      }
      if (!res.ok || !data.ok) {
        setError(data.message ?? `Upload failed (${res.status})`)
        return
      }
      setResult(
        `${data.inserted ?? 0} inserted, ${data.updated ?? 0} updated, ${data.skipped ?? 0} skipped.`,
      )
      setCsv('')
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  return (
    <details
      style={{
        border: '1px solid var(--color-line)',
        padding: '1rem 1.25rem',
      }}
    >
      <summary
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8125rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--color-ink-2)',
          cursor: 'pointer',
        }}
      >
        Upload cohort CSV
      </summary>
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
          }}
        >
          source
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              padding: '0.25rem 0.4rem',
              border: '1px solid var(--color-line)',
              background: 'transparent',
              color: 'var(--color-ink)',
            }}
          >
            <option value="cohort-2026-05-09">cohort-2026-05-09</option>
            <option value="round1-2026-05-05">round1-2026-05-05</option>
            <option value="manual">manual</option>
          </select>
        </label>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={`shop_domain,score,grade,product_count,uk_signal,scan_id,re_scan_url
matersandco.com,42,D,318,1,cmop...,https://${SCANNER_HOST}/scan?url=matersandco.com`}
          rows={8}
          disabled={busy || pending}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            padding: '0.5rem',
            border: '1px solid var(--color-line)',
            background: 'transparent',
            color: 'var(--color-ink)',
            minHeight: '8rem',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onUpload}
            disabled={busy || pending || !csv.trim()}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              padding: '0.4rem 1rem',
              border: '1px solid var(--color-ink)',
              background: 'var(--color-ink)',
              color: 'var(--color-paper)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'uploading…' : 'upload'}
          </button>
          {result && <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-2)' }}>{result}</span>}
          {error && (
            <span role="alert" style={{ fontSize: '0.8125rem', color: 'var(--color-alert)' }}>
              {error}
            </span>
          )}
        </div>
      </div>
    </details>
  )
}
