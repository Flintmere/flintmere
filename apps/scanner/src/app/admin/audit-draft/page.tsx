import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-auth'
import { getAuditDraft } from '@/lib/audit-draft/db'
import { DraftForm } from './_components/DraftForm'
import { DraftViewer } from './_components/DraftViewer'

export const metadata: Metadata = {
  title: 'Audit draft — Flintmere operator',
  robots: 'noindex, nofollow',
}

export const dynamic = 'force-dynamic'

// Council pre-flight references (per memory binding):
//   1. audit.flintmere.com/scan — mono uppercase labels, bracketed
//      signature, two-beat-lede, prose body in British voice. Viewer
//      reads as a longer, editable cousin of this.
//   2. linear.app — negative-space discipline, one display moment
//      per section, calm utility UI.
//   3. stripe.com docs — JetBrains Mono inline in body prose. The
//      ConfidenceBadge inherits this pattern.
//   4. order-form.shop — typography-led indie magazine, explicit
//      grid. The per-pillar pane reads as a typed-grid row.
//
// Trust-load-bearing surface: type-only register, no photoreal
// imagery, bracket signature carries the brand work.

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function AdminAuditDraftPage({ searchParams }: PageProps) {
  if (process.env.FEATURE_AUDIT_ASSIST !== 'true') {
    notFound()
  }

  const admin = await requireAdmin(cookies, process.env)
  if (!admin) {
    redirect('/admin/login?error=unauth')
  }

  const params = await searchParams
  const draftId = typeof params.id === 'string' ? params.id : null

  let row = null
  if (draftId) {
    row = await getAuditDraft(draftId)
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--color-paper)',
        color: 'var(--color-ink)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          maxWidth: '64rem',
          margin: '0 auto',
          padding: '3rem 1.5rem 6rem',
        }}
      >
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          <p
            className="eyebrow"
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
          >
            <span>Flintmere</span>
            <span aria-hidden="true">·</span>
            <span>Operator</span>
            <span aria-hidden="true">·</span>
            <span>Audit-assist</span>
          </p>
          <h1
            className="bracket"
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.1,
            }}
          >
            Audit draft
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: '52ch',
              fontSize: '0.9375rem',
              lineHeight: 1.55,
              color: 'var(--color-ink-2)',
            }}
          >
            Generate a Gemini-drafted audit on a real merchant catalog,
            edit the structured findings inline, and mark sent when the
            email goes out. The first five drafts route through{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>claim-review</code>{' '}
            before any merchant-facing copy ships.
          </p>
        </header>

        <DraftForm defaultShopUrl={row?.shop} />

        {draftId && !row && (
          <section
            aria-live="polite"
            style={{
              padding: '2rem 0',
              borderBottom: '1px solid var(--color-line-soft)',
            }}
          >
            <p
              role="alert"
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                color: 'var(--color-alert)',
              }}
            >
              No draft found for id <code>{draftId}</code>.
            </p>
          </section>
        )}

        {row && (
          <DraftViewer
            row={row}
            initial={(row.editedDraft ?? row.rawDraft) as never}
          />
        )}
      </div>
    </main>
  )
}
