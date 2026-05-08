#!/usr/bin/env node
// Forge a valid Flintmere admin session cookie from the running
// container's ADMIN_SESSION_SECRET + ADMIN_EMAIL. Drops the operator
// past the password gate when login is broken.
//
// Run INSIDE the scanner container (env vars are scoped there):
//   docker cp apps/scanner/scripts/forge-admin-cookie.mjs <container>:/tmp/
//   docker exec <container> node /tmp/forge-admin-cookie.mjs
//
// Output: a single line. Paste into the browser as a cookie named
//   `flintmere_admin` on https://audit.flintmere.com (Path=/, Secure,
//   HttpOnly, SameSite=Strict). 24h validity.

import { createHmac } from 'node:crypto'

const secret = process.env.ADMIN_SESSION_SECRET
const email = process.env.ADMIN_EMAIL

if (!secret || secret.length < 32) {
  console.error('error: ADMIN_SESSION_SECRET missing or shorter than 32 chars')
  process.exit(1)
}
if (!email) {
  console.error('error: ADMIN_EMAIL missing')
  process.exit(1)
}

function base64url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const payload = {
  email,
  exp: Date.now() + 24 * 60 * 60 * 1000,
  v: 1,
}

const payloadB64 = base64url(Buffer.from(JSON.stringify(payload), 'utf8'))
const hmac = createHmac('sha256', secret).update(payloadB64).digest()
const cookie = `${payloadB64}.${base64url(hmac)}`

console.log(cookie)
