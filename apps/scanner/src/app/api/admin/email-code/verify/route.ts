import { readFileSync } from 'node:fs'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ADMIN_COOKIE_NAME,
  buildCookieAttributes,
  issueSession,
} from '@/lib/admin-auth'
import { verifyAndConsumeOtp } from '@/lib/email-otp'
import { checkAdminLoginRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PENDING_EMAIL_COOKIE = 'flintmere_admin_pending_email'

/**
 * POST /api/admin/email-code/verify — operator submits the 6-digit code
 * they received by email. We pull the email from the
 * `flintmere_admin_pending_email` cookie set in /request, atomically
 * verify-and-consume, then issue the existing HMAC session cookie + 303
 * to /admin/audit-draft. Failure (any reason) → 303 to
 * /admin/login?step=code&error=invalid (no enumeration leak).
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

function redirect(origin: string, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, origin), 303)
}

function clearPendingEmailCookie(response: NextResponse): void {
  const attrs = [
    `Path=/`,
    `Max-Age=0`,
    'HttpOnly',
    'SameSite=Strict',
  ]
  if (process.env.NODE_ENV === 'production') attrs.push('Secure')
  response.headers.append(
    'Set-Cookie',
    `${PENDING_EMAIL_COOKIE}=; ${attrs.join('; ')}`,
  )
}

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  const rl = checkAdminLoginRateLimit({ ip })
  if (!rl.ok) {
    return redirect(baseUrl, '/admin/login?step=code&error=rate-limited')
  }

  let code = ''
  const contentType = req.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { code?: unknown }
      code = typeof body.code === 'string' ? body.code : ''
    } else {
      const form = await req.formData()
      const raw = form.get('code')
      code = typeof raw === 'string' ? raw : ''
    }
  } catch {
    return redirect(baseUrl, '/admin/login?step=code&error=bad-request')
  }

  // Strip whitespace and any thousands separators — operators tend to
  // copy-paste codes with stray spaces. The code itself is digits-only.
  const cleanedCode = code.replace(/\s+/g, '')

  const pendingEmailRaw = req.cookies.get(PENDING_EMAIL_COOKIE)?.value ?? ''
  let pendingEmail = ''
  try {
    pendingEmail = decodeURIComponent(pendingEmailRaw).trim().toLowerCase()
  } catch {
    pendingEmail = ''
  }

  if (!pendingEmail) {
    return redirect(baseUrl, '/admin/login?error=session-expired')
  }

  const secret = readSecret('ADMIN_SESSION_SECRET')
  const adminEmail = readSecret('ADMIN_EMAIL')
  if (!secret || !adminEmail) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'email-otp.verify-misconfigured',
        hasSecret: Boolean(secret),
        hasEmail: Boolean(adminEmail),
      }),
    )
    return redirect(baseUrl, '/admin/login?error=server')
  }

  const result = await verifyAndConsumeOtp({
    email: pendingEmail,
    code: cleanedCode,
  })
  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'email-otp.verify-failed',
        reason: result.reason,
        ip: ip ? 'present' : 'absent',
      }),
    )
    return redirect(baseUrl, '/admin/login?step=code&error=invalid')
  }

  // Defence in depth: even though /request gated on the allowlist, the
  // pending-email cookie could carry a stale value (allowlist rotated
  // mid-flight). Re-check.
  if (result.email !== adminEmail.trim().toLowerCase()) {
    return redirect(baseUrl, '/admin/login?error=session-expired')
  }

  const cookieValue = issueSession(adminEmail, secret)
  const response = redirect(baseUrl, '/admin/audit-draft')
  response.headers.append(
    'Set-Cookie',
    `${ADMIN_COOKIE_NAME}=${cookieValue}; ${buildCookieAttributes()}`,
  )
  clearPendingEmailCookie(response)
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'email-otp.verify-success',
      ip: ip ? 'present' : 'absent',
    }),
  )
  return response
}
