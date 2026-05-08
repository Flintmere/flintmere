#!/usr/bin/env node
// Direct minimal Vertex Gemini 2.5 Pro call. No deps — uses only Node
// built-ins (crypto + fetch). Bypasses LLMRouter, VertexProvider class,
// audit-draft orchestrator, and even google-auth-library (which isn't
// resolvable from /tmp inside the container).
//
// Manual JWT-bearer flow:
//   1. Read SA key file from GOOGLE_APPLICATION_CREDENTIALS
//   2. Sign a self-signed JWT with the SA's RSA private key
//   3. Exchange the JWT at oauth2.googleapis.com for an access token
//   4. Call Vertex Gemini :generateContent with the token
//
// Run inside the scanner container:
//   docker cp apps/scanner/scripts/smoke-vertex-direct.mjs <c>:/tmp/
//   docker exec <c> node /tmp/smoke-vertex-direct.mjs

import { readFileSync } from 'node:fs'
import { createSign } from 'node:crypto'

const project = process.env.GOOGLE_CLOUD_PROJECT
const region =
  process.env.LLM_HARDCASE_REGION ||
  process.env.LLM_PRIMARY_REGION ||
  'europe-west1'
const model = process.env.LLM_HARDCASE_MODEL || 'gemini-2.5-pro'
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

console.log('project:', project)
console.log('region:', region)
console.log('model:', model)
console.log('credentials path:', credPath)

if (!credPath) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS not set')
  process.exit(2)
}

let sa
try {
  sa = JSON.parse(readFileSync(credPath, 'utf8'))
} catch (err) {
  console.error('Failed to read SA key:', err?.message ?? err)
  process.exit(2)
}
console.log('SA client_email:', sa.client_email)
console.log('SA project_id:', sa.project_id)

// ---- Sign JWT for token exchange ----
function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const now = Math.floor(Date.now() / 1000)
const claim = {
  iss: sa.client_email,
  scope: 'https://www.googleapis.com/auth/cloud-platform',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600,
}

const headerB64 = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
const claimB64 = b64url(JSON.stringify(claim))
const signingInput = `${headerB64}.${claimB64}`

let sigBuf
try {
  sigBuf = createSign('RSA-SHA256').update(signingInput).sign(sa.private_key)
} catch (err) {
  console.error('JWT sign failed:', err?.message ?? err)
  process.exit(2)
}
const jwt = `${signingInput}.${b64url(sigBuf)}`
console.log('JWT signed, length:', jwt.length)

// ---- Exchange for access token ----
const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body:
    `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}` +
    `&assertion=${encodeURIComponent(jwt)}`,
})
const tokenData = await tokenRes.json()
if (!tokenData.access_token) {
  console.error('TOKEN EXCHANGE FAILED — status:', tokenRes.status)
  console.error('body:', JSON.stringify(tokenData, null, 2))
  process.exit(2)
}
console.log('access token obtained, length:', tokenData.access_token.length)

// ---- Call Vertex ----
const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/google/models/${model}:generateContent`
console.log('POST', url)

const t0 = Date.now()
const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${tokenData.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: pong' }] }],
    generationConfig: { maxOutputTokens: 16, temperature: 0 },
  }),
  signal: AbortSignal.timeout(45_000),
})
const elapsedMs = Date.now() - t0

console.log('--- status:', res.status, `(${elapsedMs}ms) ---`)
const body = await res.text()
console.log('--- body (first 4KB) ---')
console.log(body.slice(0, 4000))
