import { readFileSync } from 'node:fs'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ADMIN_COOKIE_NAME,
  buildCookieAttributes,
  issueSession,
} from '@/lib/admin-auth'
import { verifyAndConsume } from '@/lib/magic-link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/magic-link/verify?token=... — operator clicks the link
 * sent by /request. We verify-and-consume atomically, then defence-in-
 * depth re-check the email against ADMIN_EMAIL (catches the rare case
 * where allowlist changed between request and consume), then issue the
 * existing HMAC session cookie + 303 to /admin/audit-draft.
 *
 * Failure modes (unknown / consumed / expired / allowlist mismatch /
 * misconfigured) all collapse to a single redirect: /admin/login?
 * error=invalid-link. Reasons are logged structured but not exposed.
 */
function readSecret(name: string): string {
  const filePath = process.env[`${name}_FILE`]
  if (filePath) {
    try {
      return readFileSync(filePath, 'utf8').trim()
    } catch {
      return ''
    }
  }
  return process.env[name] ?? ''
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  const token = req.nextUrl.searchParams.get('token') ?? ''

  const secret = readSecret('ADMIN_SESSION_SECRET')
  const adminEmail = readSecret('ADMIN_EMAIL')
  if (!secret || !adminEmail) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'magic-link.verify-misconfigured',
        hasSecret: Boolean(secret),
        hasEmail: Boolean(adminEmail),
      }),
    )
    return redirect(baseUrl, '/admin/login?error=server')
  }

  const result = await verifyAndConsume(token)
  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'magic-link.verify-failed',
        reason: result.reason,
        ip: ip ? 'present' : 'absent',
      }),
    )
    return redirect(baseUrl, '/admin/login?error=invalid-link')
  }

  if (!emailsMatch(result.email, adminEmail.toLowerCase().trim())) {
    // Allowlist drifted between request and consume. Treat as invalid.
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'magic-link.verify-allowlist-mismatch',
        ip: ip ? 'present' : 'absent',
      }),
    )
    return redirect(baseUrl, '/admin/login?error=invalid-link')
  }

  const cookieValue = issueSession(adminEmail, secret)
  const response = redirect(baseUrl, '/admin/audit-draft')
  response.headers.append(
    'Set-Cookie',
    `${ADMIN_COOKIE_NAME}=${cookieValue}; ${buildCookieAttributes()}`,
  )
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'magic-link.verify-success',
      ip: ip ? 'present' : 'absent',
    }),
  )
  return response
}

function emailsMatch(a: string, b: string): boolean {
  const ap = Buffer.alloc(128)
  const bp = Buffer.alloc(128)
  Buffer.from(a, 'utf8').copy(ap)
  Buffer.from(b, 'utf8').copy(bp)
  return timingSafeEqual(ap, bp)
}

function redirect(origin: string, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, origin), 303)
}
