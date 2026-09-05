#!/usr/bin/env node
// Seed the outreach pipeline with the two cohort CSVs by POSTing them to
// /api/admin/outreach/cohort. Uses the X-Admin-Smoke-Token header (same
// pattern as smoke-audit-draft-direct.mjs) so it bypasses the magic-link
// sign-in flow.
//
// Run from laptop against prod:
//   SMOKE_HOST=https://catalog.flintmere.com \
//   ADMIN_SESSION_SECRET=<copy from Coolify env> \
//   node apps/scanner/scripts/seed-outreach-cohorts.mjs
//
// Override which files / sources to upload via env:
//   COHORT_PATH=<path>     SOURCE_COHORT=<slug>     (default: cohort-2026-05-09)
//   SUPPLEMENT_PATH=<path> SOURCE_SUPPLEMENT=<slug> (default: round1-2026-05-05)
//
// Skip either by setting its PATH to 'skip'.

import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const host = (process.env.SMOKE_HOST ?? 'https://catalog.flintmere.com').replace(/\/$/, '')
const secret = process.env.ADMIN_SESSION_SECRET
if (!secret || secret.length < 32) {
  console.error('error: ADMIN_SESSION_SECRET missing or too short (need ≥32 chars)')
  process.exit(1)
}

const REPO_ROOT = resolve(import.meta.dirname, '../../..')
const cohortPath = process.env.COHORT_PATH ?? `${REPO_ROOT}/data/recruitment/cohort-food-outreach-2026-05-09.csv`
const supplementPath = process.env.SUPPLEMENT_PATH ?? `${REPO_ROOT}/data/recruitment/round1-supplement-2026-05-10.csv`
const sourceCohort = process.env.SOURCE_COHORT ?? 'cohort-2026-05-09'
const sourceSupplement = process.env.SOURCE_SUPPLEMENT ?? 'round1-2026-05-05'

// Smoke-token mirrors lib/admin-auth.ts §SMOKE_TOKEN_TAG_PREFIX.
const SMOKE_TOKEN_WINDOW_MS = 60 * 60 * 1000
const bucket = Math.floor(Date.now() / SMOKE_TOKEN_WINDOW_MS)
const smokeToken = createHmac('sha256', secret)
  .update(`smoke-v2:${bucket}`)
  .digest('hex')

const headers = {
  'Content-Type': 'application/json',
  'X-Admin-Smoke-Token': smokeToken,
}

async function upload(path, source) {
  if (path === 'skip') {
    console.log(`-- skip source=${source}`)
    return
  }
  let csv
  try {
    csv = readFileSync(path, 'utf8')
  } catch (err) {
    console.error(`-- read failed for ${path}: ${err.message}`)
    return
  }
  const lineCount = csv.split(/\r?\n/).filter((l) => l.trim().length > 0).length
  console.log(`-- POST source=${source} (${lineCount} lines incl header) ← ${path}`)
  const t0 = Date.now()
  const res = await fetch(`${host}/api/admin/outreach/cohort`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ csv, source }),
    signal: AbortSignal.timeout(60_000),
  })
  const elapsedMs = Date.now() - t0
  const text = await res.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { raw: text.slice(0, 400) }
  }
  console.log(`   status: ${res.status} (${elapsedMs}ms)`)
  console.log(`   body:   ${JSON.stringify(parsed)}`)
  if (!res.ok) {
    console.error(`   ERROR — upload failed for source=${source}`)
  }
}

console.log(`--- target host: ${host}`)
console.log(`--- smoke token: ${smokeToken.slice(0, 8)}…${smokeToken.slice(-8)}`)
console.log('')
await upload(cohortPath, sourceCohort)
await upload(supplementPath, sourceSupplement)
