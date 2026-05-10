import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { dailyCap } from '@/lib/outreach/cap'
import { OUTREACH_STATUS } from '@/lib/outreach/db'
import { TargetsTable } from './_components/TargetsTable'
import { CohortUpload } from './_components/CohortUpload'

export const metadata: Metadata = {
  title: 'Outreach — Flintmere operator',
  robots: 'noindex, nofollow',
}

export const dynamic = 'force-dynamic'

// Council pre-flight references (per memory binding 2026-05-09 + admin
// console parity with /admin/audit-draft):
//   1. /admin/audit-draft — operator console pattern: paper background,
//      bracket H1, eyebrow row, dense type-only table.
//   2. linear.app — calm operator UI; no chrome that doesn't earn its keep.
//   3. data/recruitment/cold-email-template-2026-05-09.md — single source
//      of truth for body content; this UI never restates it.

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminOutreachPage({ searchParams }: PageProps) {
  const admin = await requireAdmin(cookies, process.env)
  if (!admin) redirect('/admin/login?error=unauth')

  const params = await searchParams
  const filterStatus = typeof params.status === 'string' ? params.status : null

  const targets = await prisma.outreachTarget.findMany({
    where: filterStatus ? { status: filterStatus } : undefined,
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    take: 200,
  })

  // Status counts for the filter chips. One round-trip via groupBy.
  const grouped = await prisma.outreachTarget.groupBy({
    by: ['status'],
    _count: { _all: true },
  })
  const statusCounts: Record<string, number> = {}
  for (const row of grouped) statusCounts[row.status] = row._count._all

  // Daily-cap budget — what operator has left to send today.
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const sentToday = await prisma.outreachSend.count({
    where: { sentAt: { gte: startOfDay } },
  })
  const cap = dailyCap()
  const remaining = Math.max(0, cap - sentToday)

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
          maxWidth: '80rem',
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
            <span>Outreach</span>
          </p>
          <h1
            className="bracket"
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.1,
            }}
          >
            Outreach
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: '64ch',
              fontSize: '0.9375rem',
              lineHeight: 1.55,
              color: 'var(--color-ink-2)',
            }}
          >
            Cold-email pipeline for the 2026-05-09 sprint. Sends from
            <code style={{ fontFamily: 'var(--font-mono)', margin: '0 0.4em' }}>
              team.flintmere.com
            </code>
            via Resend with a conservative ramp. Today&rsquo;s budget:
            <strong> {remaining} of {cap} </strong>
            sends remaining ({sentToday} sent today).
          </p>
        </header>

        <section style={{ marginTop: '2rem' }}>
          <CohortUpload />
        </section>

        <nav
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '2rem',
            marginBottom: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
          }}
        >
          {[null, ...Object.values(OUTREACH_STATUS)].map((s) => {
            const label = s ?? 'all'
            const count = s ? statusCounts[s] ?? 0 : Object.values(statusCounts).reduce((a, b) => a + b, 0)
            const active = filterStatus === s || (!filterStatus && !s)
            const href = s ? `?status=${s}` : '?'
            return (
              <a
                key={label}
                href={href}
                style={{
                  padding: '0.25rem 0.6rem',
                  border: '1px solid var(--color-line)',
                  textDecoration: 'none',
                  color: active ? 'var(--color-paper)' : 'var(--color-ink)',
                  background: active ? 'var(--color-ink)' : 'transparent',
                }}
              >
                {label} ({count})
              </a>
            )
          })}
        </nav>

        <TargetsTable targets={targets} />
      </div>
    </main>
  )
}
