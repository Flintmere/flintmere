#!/usr/bin/env node
// Smoke-test audit-assist by hitting the API endpoint directly with a
// freshly-forged session cookie. Bypasses the browser, login form, and
// password gate entirely.
//
// Run from laptop against prod (preferred — login UI is currently broken):
//   SMOKE_HOST=https://audit.flintmere.com \
//   ADMIN_SESSION_SECRET=<copy from Coolify env> \
//   ADMIN_EMAIL=<copy from Coolify env> \
//   SMOKE_SHOP=matersandco.com \
//   node apps/scanner/scripts/smoke-audit-draft-direct.mjs
//
// Or inside the scanner container (legacy — defaults to localhost:3000):
//   docker cp apps/scanner/scripts/smoke-audit-draft-direct.mjs <container>:/tmp/
//   docker exec <container> node /tmp/smoke-audit-draft-direct.mjs

import { createHmac } from 'node:crypto'

const host = (process.env.SMOKE_HOST ?? 'http://localhost:3000').replace(/\/$/, '')
const secret = process.env.ADMIN_SESSION_SECRET
const email = process.env.ADMIN_EMAIL
if (!secret || secret.length < 32) {
  console.error('error: ADMIN_SESSION_SECRET missing or too short')
  process.exit(1)
}
if (!email) {
  console.error('error: ADMIN_EMAIL missing')
  process.exit(1)
}

const b64url = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const payload = b64url(
  Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 60 * 60 * 1000, v: 1 }),
    'utf8',
  ),
)
const hmac = createHmac('sha256', secret).update(payload).digest()
const cookie = `${payload}.${b64url(hmac)}`

console.log('--- target host:', host, '---')
console.log('--- forged cookie len:', cookie.length, '---')
console.log('--- POSTing /api/admin/audit-draft/generate ---')

const t0 = Date.now()
const res = await fetch(`${host}/api/admin/audit-draft/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: `flintmere_admin=${cookie}`,
  },
  body: JSON.stringify({
    shopUrl: process.env.SMOKE_SHOP || 'matersandco.com',
    bandSlug: process.env.SMOKE_BAND || 'band-1',
  }),
  signal: AbortSignal.timeout(150_000),
})
const elapsedMs = Date.now() - t0

console.log('--- status:', res.status, `(${elapsedMs}ms) ---`)
const text = await res.text()
try {
  const json = JSON.parse(text)
  if (json.ok) {
    console.log('--- SUCCESS ---')
    console.log('draftId:', json.draftId)
    console.log('shop:', json.telemetry?.shop)
    console.log('band:', json.telemetry?.bandSlug)
    console.log('model:', json.telemetry?.model)
    console.log('latency_ms (orchestrator total):', json.telemetry?.latencyMs)
    console.log('pillar count:', json.telemetry?.pillarCount)
    console.log('confidence avg:', json.telemetry?.confidenceAvg)
    // Follow-up GET — pull the full draft body so we can read it
    // without going through the (currently broken) admin UI.
    console.log('--- GETting /api/admin/audit-draft/' + json.draftId + ' ---')
    const draftRes = await fetch(
      `${host}/api/admin/audit-draft/${json.draftId}`,
      {
        headers: { Cookie: `flintmere_admin=${cookie}` },
        signal: AbortSignal.timeout(30_000),
      },
    )
    const draftJson = await draftRes.json().catch(() => null)
    const draft = draftJson?.draft?.rawDraft
    if (draft) {
      console.log('headline:', draft.executiveSummary?.headline)
      console.log('exec body:', draft.executiveSummary?.body)
      console.log('top priorities:')
      for (const p of draft.topPriorities ?? []) {
        console.log(`  ${p.rank}. [${p.pillarRef}] ${p.title}`)
      }
      console.log('pillar findings (', draft.pillarFindings?.length, '):')
      for (const f of draft.pillarFindings ?? []) {
        console.log(
          `  ${f.pillar} — score ${f.score} (${f.rating}) — ${f.actionableFixes?.length ?? 0} fixes`,
        )
      }
      console.log('estimated revenue impact:')
      console.log(' ', draft.estimatedRevenueImpact?.summary)
      console.log('operator todos:', draft.operatorTodos?.length, 'items')
    } else {
      console.log('(failed to fetch full draft)')
      console.log(JSON.stringify(draftJson, null, 2).slice(0, 800))
    }
  } else {
    console.log('--- FAILURE ---')
    console.log('code:', json.code)
    console.log('message:', json.message)
    if (json.detail) console.log('detail:', json.detail)
    console.log('full body:', JSON.stringify(json, null, 2))
  }
} catch {
  console.log('--- non-JSON body ---')
  console.log(text.slice(0, 2000))
}
