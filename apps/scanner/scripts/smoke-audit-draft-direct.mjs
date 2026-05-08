#!/usr/bin/env node
// Smoke-test audit-assist by hitting the API endpoint directly with a
// freshly-forged session cookie. Bypasses the browser, login form, and
// password gate entirely. Intended to run INSIDE the scanner container
// (uses the container's ADMIN_SESSION_SECRET to forge the cookie and
// localhost:3000 to reach the route handler).
//
// Run:
//   docker cp apps/scanner/scripts/smoke-audit-draft-direct.mjs <container>:/tmp/
//   docker exec <container> node /tmp/smoke-audit-draft-direct.mjs

import { createHmac } from 'node:crypto'

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

console.log('--- forged cookie len:', cookie.length, '---')
console.log('--- POSTing /api/admin/audit-draft/generate ---')

const t0 = Date.now()
const res = await fetch('http://localhost:3000/api/admin/audit-draft/generate', {
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
    console.log('model:', json.draft?.meta?.model)
    console.log('latency_ms (LLM):', json.draft?.meta?.latencyMs)
    console.log('headline:', json.draft?.executiveSummary?.headline)
    console.log('pillar count:', json.draft?.pillarFindings?.length)
    console.log('top priorities count:', json.draft?.topPriorities?.length)
    console.log('--- (full draft truncated; persisted to Postgres) ---')
  } else {
    console.log('--- FAILURE ---')
    console.log('code:', json.code)
    console.log('message:', json.message)
    console.log('full body:', JSON.stringify(json, null, 2))
  }
} catch {
  console.log('--- non-JSON body ---')
  console.log(text.slice(0, 2000))
}
