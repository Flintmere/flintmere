import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

// Verifies the X-Cron-Secret header for Coolify-scheduled cron routes
// against process.env.CRON_SECRET. Constant-time, no length leak.
//
// Why HMAC-then-timing-safe-compare: the supplied header can be any
// length; node:crypto.timingSafeEqual requires equal-length buffers.
// A naive `if (a.length !== b.length) return false` short-circuits in
// JS and leaks the expected secret's byte length via response timing.
// HMAC-SHA256 yields a fixed 32-byte digest regardless of input length,
// so timingSafeEqual operates on equal-length buffers unconditionally.
//
// COMPARE_NAMESPACE is a domain separator, not a secret — both supplied
// and expected are HMAC'd with the same key. Equal digests imply equal
// inputs by SHA-256 collision resistance.

const COMPARE_NAMESPACE = 'flintmere-cron-secret-v1'

function digest(value: string): Buffer {
  return createHmac('sha256', COMPARE_NAMESPACE).update(value).digest()
}

// Returns null on success — caller proceeds. Returns a NextResponse to
// return verbatim on failure (503 if the secret is unconfigured, 403 if
// header missing or mismatch).
function verifySharedSecret(
  suppliedHeader: string | null,
  expected: string | undefined,
  envName: string,
): NextResponse | null {
  if (!expected || expected.length < 32) {
    return NextResponse.json(
      { error: `${envName} not configured (must be ≥32 chars)` },
      { status: 503 },
    )
  }

  const supplied = suppliedHeader ?? ''
  if (!timingSafeEqual(digest(supplied), digest(expected))) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 403 })
  }

  return null
}

export function verifyCronSecret(
  suppliedHeader: string | null,
): NextResponse | null {
  return verifySharedSecret(suppliedHeader, process.env.CRON_SECRET, 'CRON_SECRET')
}

// Agent intake routes (/api/agent/*) verify a SEPARATELY-SCOPED secret.
// The remote weekly agent's environment holds AGENT_API_SECRET only, so
// a compromise of that environment cannot fire /api/cron/* routes (which
// send outreach email and post to X immediately). The agent secret's
// damage ceiling is: queue banned-phrase-checked posts (≥12h lead, so
// the daily brief surfaces them first) and stage outreach batches that
// cannot send without the operator's approve click.
export function verifyAgentSecret(
  suppliedHeader: string | null,
): NextResponse | null {
  return verifySharedSecret(suppliedHeader, process.env.AGENT_API_SECRET, 'AGENT_API_SECRET')
}
