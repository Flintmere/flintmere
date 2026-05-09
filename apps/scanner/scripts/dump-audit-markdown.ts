/**
 * dump-audit-markdown
 * -------------------
 * Fetches a persisted audit draft from prod via the admin GET endpoint
 * (using the smoke-token bypass while /admin/login is broken) and
 * renders the markdown body to stdout. Operator pipes to a file, opens
 * in their editor, runs the 7-pass calibration checklist, and sends.
 *
 * Usage:
 *   SMOKE_HOST=https://audit.flintmere.com \
 *   ADMIN_SESSION_SECRET=<from Coolify> \
 *   DRAFT_ID=cmoysfi5d0000mpjel803b0be \
 *   pnpm --filter scanner audit:markdown > data/audits/matersandco-letter.md
 */

import { createHmac } from 'node:crypto'
import { auditDraftToMarkdown } from '../src/lib/audit-draft/markdown-export'
import type { AuditDraft } from '../src/lib/audit-draft/schema'
import type { AuditBandSlug } from '../src/lib/audit-pricing'

interface DraftResponse {
  ok: boolean
  draft?: {
    id: string
    shop: string
    bandSlug: AuditBandSlug
    rawDraft: AuditDraft
    editedDraft: AuditDraft | null
    generatedAt: string
  }
  code?: string
  message?: string
  detail?: string
}

const host = (process.env.SMOKE_HOST ?? 'https://audit.flintmere.com').replace(
  /\/$/,
  '',
)
const secret = process.env.ADMIN_SESSION_SECRET
const draftId = process.env.DRAFT_ID

if (!secret || secret.length < 32) {
  console.error('error: ADMIN_SESSION_SECRET missing or too short')
  process.exit(1)
}
if (!draftId) {
  console.error('error: DRAFT_ID missing (e.g. DRAFT_ID=cmoysfi5d0000mpjel803b0be)')
  process.exit(1)
}

// Smoke-token rotates hourly per smoke-v2 design (apps/scanner/src/lib/
// admin-auth.ts §SMOKE_TOKEN_TAG_PREFIX). HMAC over `smoke-v2:<bucket>`
// where bucket = floor(unix-ms / 3_600_000). Server accepts current OR
// previous bucket → 1-2h validity. Compute at script start; if the run
// straddles >2 boundaries the operator re-runs.
const SMOKE_TOKEN_WINDOW_MS = 60 * 60 * 1000
const bucket = Math.floor(Date.now() / SMOKE_TOKEN_WINDOW_MS)
const smokeToken = createHmac('sha256', secret)
  .update(`smoke-v2:${bucket}`)
  .digest('hex')

const res = await fetch(`${host}/api/admin/audit-draft/${draftId}`, {
  headers: { 'X-Admin-Smoke-Token': smokeToken },
  signal: AbortSignal.timeout(30_000),
})

if (!res.ok) {
  const text = await res.text()
  console.error(`error: GET returned HTTP ${res.status}`)
  console.error(text.slice(0, 800))
  process.exit(1)
}

const json = (await res.json()) as DraftResponse
if (!json.ok || !json.draft) {
  console.error('error: response not ok')
  console.error(JSON.stringify(json, null, 2))
  process.exit(1)
}

const { draft } = json
// Prefer the operator's edited draft if it exists, else the model's
// raw output. On Day 2 (first pass) editedDraft is null.
const body = draft.editedDraft ?? draft.rawDraft

const markdown = auditDraftToMarkdown({
  draft: body,
  shop: draft.shop,
  bandSlug: draft.bandSlug,
  generatedAt: new Date(draft.generatedAt),
})

process.stdout.write(markdown)
