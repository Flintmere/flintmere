'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/plausible'
import type { Vertical } from '@/lib/audit-draft/schema'
import { StageLedger } from '@/components/StageLedger'

const VERTICALS: Vertical[] = [
  'food',
  'beauty',
  'apparel',
  'home',
  'electronics',
  'other',
]

const BANDS: Array<{ slug: 'band-1' | 'band-2'; label: string; sub: string }> = [
  { slug: 'band-1', label: 'Band 1', sub: 'Up to 1,500 SKUs · £197' },
  { slug: 'band-2', label: 'Band 2', sub: '1,501–5,000 SKUs · £397' },
  // Band 3 is bespoke and routes to a contact flow, not audit-assist.
]

interface DraftFormProps {
  /** When non-null, prefills the form (operator generated a draft, came back to retry). */
  defaultShopUrl?: string
}

export function DraftForm({ defaultShopUrl }: DraftFormProps) {
  const router = useRouter()
  const [shopUrl, setShopUrl] = useState(defaultShopUrl ?? '')
  const [bandSlug, setBandSlug] = useState<'band-1' | 'band-2'>('band-1')
  const [vertical, setVertical] = useState<Vertical>('food')
  const [pending, setPending] = useState(false)
  const [pendingStartedAt, setPendingStartedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setPendingStartedAt(Date.now())
    setError(null)
    try {
      const res = await fetch('/api/admin/audit-draft/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shopUrl, bandSlug, vertical }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        draftId?: string
        message?: string
        code?: string
        telemetry?: {
          shop: string
          bandSlug: string
          model: string
          latencyMs: number
          pillarCount: number
          confidenceAvg: number
        }
      }
      if (!res.ok || !data.draftId) {
        throw new Error(
          data.message ??
            `Audit-assist failed (HTTP ${res.status}${data.code ? ` · ${data.code}` : ''})`,
        )
      }
      // Plausible custom event — cookieless, no PII. `shop` is the
      // normalised public hostname; analytics is fine to count by it.
      if (data.telemetry) {
        track('audit_draft_generated', {
          shop: data.telemetry.shop,
          band: data.telemetry.bandSlug,
          model: data.telemetry.model,
          latency_ms: data.telemetry.latencyMs,
          pillar_count: data.telemetry.pillarCount,
          confidence_avg: data.telemetry.confidenceAvg,
        })
      }
      // Navigate to the new draft. Server component reads ?id= and
      // hydrates the viewer with the persisted row.
      router.push(`/admin/audit-draft?id=${encodeURIComponent(data.draftId)}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.5rem 0 2rem',
        borderBottom: '1px solid var(--color-line-soft)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label
          htmlFor="audit-draft-shop"
          className="eyebrow-micro"
          style={{ margin: 0 }}
        >
          Shop URL
        </label>
        <input
          id="audit-draft-shop"
          name="shopUrl"
          type="text"
          required
          autoComplete="off"
          spellCheck={false}
          value={shopUrl}
          onChange={(e) => setShopUrl(e.target.value)}
          placeholder="bluetokyo.co.uk"
          disabled={pending}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            padding: '0.75rem 1rem',
            border: '1px solid var(--color-ink)',
            background: 'transparent',
            color: 'var(--color-ink)',
            borderRadius: 0,
          }}
        />
      </div>

      <fieldset
        style={{
          border: 0,
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <legend className="eyebrow-micro" style={{ padding: 0 }}>
          Audit band
        </legend>
        <div
          role="radiogroup"
          aria-label="Audit band"
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {BANDS.map((band) => {
            const labelId = `band-${band.slug}-label`
            const selected = band.slug === bandSlug
            return (
              <button
                key={band.slug}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-labelledby={labelId}
                onClick={() => setBandSlug(band.slug)}
                disabled={pending}
                style={{
                  flex: '1 1 220px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.25rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid var(--color-ink)',
                  background: selected ? 'var(--color-ink)' : 'transparent',
                  color: selected
                    ? 'var(--color-paper)'
                    : 'var(--color-ink)',
                  cursor: 'pointer',
                  borderRadius: 0,
                  textAlign: 'left',
                }}
              >
                <span
                  id={labelId}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {band.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    opacity: selected ? 0.85 : 0.7,
                  }}
                >
                  {band.sub}
                </span>
              </button>
            )
          })}
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            color: 'var(--color-mute)',
          }}
        >
          Band 3 (5,001+ SKUs) is bespoke — handled via /contact, not
          audit-assist.
        </p>
      </fieldset>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <label
          htmlFor="audit-draft-vertical"
          className="eyebrow-micro"
          style={{ margin: 0 }}
        >
          Vertical
        </label>
        <select
          id="audit-draft-vertical"
          value={vertical}
          onChange={(e) => setVertical(e.target.value as Vertical)}
          disabled={pending}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            padding: '0.625rem 0.75rem',
            border: '1px solid var(--color-ink)',
            background: 'transparent',
            color: 'var(--color-ink)',
            borderRadius: 0,
            alignSelf: 'flex-start',
            minWidth: '12rem',
          }}
        >
          {VERTICALS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            color: 'var(--color-alert)',
            paddingLeft: '0.75rem',
            borderLeft: '2px solid var(--color-alert)',
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || shopUrl.trim().length < 4}
        style={{
          alignSelf: 'flex-start',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '0.875rem 1.25rem',
          border: '1px solid var(--color-ink)',
          background:
            pending || shopUrl.trim().length < 4
              ? 'var(--color-paper-2)'
              : 'var(--color-ink)',
          color:
            pending || shopUrl.trim().length < 4
              ? 'var(--color-mute)'
              : 'var(--color-paper)',
          cursor:
            pending || shopUrl.trim().length < 4 ? 'not-allowed' : 'pointer',
          borderRadius: 0,
        }}
      >
        {pending ? 'Drafting…' : 'Generate draft →'}
      </button>

      {pending && pendingStartedAt !== null && (
        <StageLedger
          stages={[
            {
              id: 'all',
              label: 'drafting',
              description:
                'resolving scan, fetching catalog, calling model',
            },
          ]}
          currentId="all"
          startedAt={pendingStartedAt}
        />
      )}
    </form>
  )
}
