import { readFileSync } from 'node:fs'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ADMIN_COOKIE_NAME,
  buildCookieAttributes,
  issueSession,
  verifyPassword,
} from '@/lib/admin-auth'
import { checkAdminLoginRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Resolve a secret from either an env var or a file path env var.
 * Coolify v4 shell-expands `$<letter>` patterns inside env-var values,
 * which corrupts the scrypt hash whenever the salt or hash bytes
 * happen to base64-encode to a letter after a `$`. File-secret mount
 * bypasses the substitution layer entirely. Pattern: if
 * `<NAME>_FILE` points at a readable path, use the file contents
 * (trimmed). Otherwise fall back to `<NAME>` env var.
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

/**
 * POST /api/admin/login — single-admin auth for audit-assist v0.
 *
 * Body shape: { password: string }. Verifies against
 * ADMIN_LOGIN_PASSWORD_HASH (scrypt, set by operator via Coolify), and
 * on success issues a session cookie and 303-redirects to
 * /admin/audit-draft. On failure: 303-redirects to /admin/login?error=1
 * (or rate-limited variant) so the form re-renders with feedback —
 * works without JavaScript.
 *
 * Per security-posture.md: rate-limited (per-IP, 10 per 10 min). Bcrypt-
 * equivalent scrypt cost-N=2^14 makes any brute force expensive against
 * a strong password. SameSite=Strict cookie gives CSRF immunity.
 */
export async function POST(req: NextRequest) {
  // Behind Traefik (Coolify), `req.nextUrl.origin` resolves to the
  // container bind address (e.g. https://0.0.0.0:3001) because Next does
  // not trust X-Forwarded-Host by default. Use the project-canonical
  // public-origin env var (matches unsubscribe/lead/email routes).
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

  // Form posts → x-www-form-urlencoded; tolerate JSON too for callers that
  // post programmatically (operator scripts, etc.).
  let password = ''
  const contentType = req.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { password?: unknown }
      password = typeof body.password === 'string' ? body.password : ''
    } else {
      const form = await req.formData()
      const raw = form.get('password')
      password = typeof raw === 'string' ? raw : ''
    }
  } catch {
    return redirect(baseUrl, '/admin/login?error=bad-request')
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const rl = checkAdminLoginRateLimit({ ip })
  if (!rl.ok) {
    return redirect(baseUrl, '/admin/login?error=rate-limited')
  }

  const storedHash = readSecret('ADMIN_LOGIN_PASSWORD_HASH')
  const secret = readSecret('ADMIN_SESSION_SECRET')
  const adminEmail = readSecret('ADMIN_EMAIL')

  if (!storedHash || !secret || !adminEmail) {
    // Misconfigured — log structured but show the operator the same
    // generic failure as a wrong password (don't leak the env state).
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'admin-login.misconfigured',
        hasHash: Boolean(storedHash),
        hasSecret: Boolean(secret),
        hasEmail: Boolean(adminEmail),
      }),
    )
    return redirect(baseUrl, '/admin/login?error=server')
  }

  const ok = await verifyPassword(password, storedHash)
  if (!ok) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'admin-login.failed',
        ip: ip ? 'present' : 'absent',
      }),
    )
    return redirect(baseUrl, '/admin/login?error=invalid')
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
      event: 'admin-login.success',
      ip: ip ? 'present' : 'absent',
    }),
  )
  return response
}

function redirect(origin: string, path: string): NextResponse {
  // 303 — POST form → GET landing page. Standard post/redirect/get.
  return NextResponse.redirect(new URL(path, origin), 303)
}
