import { readFileSync } from 'node:fs'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import {
  createEmailOtp,
  EMAIL_OTP_DEFAULT_TTL_MINUTES,
} from '@/lib/email-otp'
import { checkAdminLoginRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PENDING_EMAIL_COOKIE = 'flintmere_admin_pending_email'
const PENDING_EMAIL_TTL_SECONDS = 60 * 15 // 15 min — comfortably > code TTL

/**
 * POST /api/admin/email-code/request — operator submits their email; if
 * it matches the ADMIN_EMAIL allowlist we generate a 6-digit code,
 * persist its hash, and email the operator the code. Sets a short-lived
 * `flintmere_admin_pending_email` cookie carrying the email through to
 * the verify step. Always 303s back to /admin/login?step=code regardless
 * of whether the email matched (no enumeration leak).
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

function emailsMatch(a: string, b: string): boolean {
  const ap = Buffer.alloc(128)
  const bp = Buffer.alloc(128)
  Buffer.from(a, 'utf8').copy(ap)
  Buffer.from(b, 'utf8').copy(bp)
  return timingSafeEqual(ap, bp)
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

function redirect(origin: string, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, origin), 303)
}

function pendingEmailCookieAttributes(): string {
  const attrs = [
    `Path=/`,
    `Max-Age=${PENDING_EMAIL_TTL_SECONDS}`,
    'HttpOnly',
    'SameSite=Strict',
  ]
  // Mirror admin-auth.ts buildCookieAttributes — Secure on any HTTPS deploy,
  // not just production. Coolify staging/preview is HTTPS but NODE_ENV may
  // be unset (caught 2026-05-09 pre-launch audit).
  if ((process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https:'))
    attrs.push('Secure')
  return attrs.join('; ')
}

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  const rl = checkAdminLoginRateLimit({ ip })
  if (!rl.ok) {
    return redirect(baseUrl, '/admin/login?error=rate-limited')
  }

  let email = ''
  const contentType = req.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { email?: unknown }
      email = typeof body.email === 'string' ? body.email : ''
    } else {
      const form = await req.formData()
      const raw = form.get('email')
      email = typeof raw === 'string' ? raw : ''
    }
  } catch {
    return redirect(baseUrl, '/admin/login?error=bad-request')
  }

  const adminEmail = readSecret('ADMIN_EMAIL')
  if (!adminEmail) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'email-otp.request-misconfigured',
        hasAdminEmail: false,
      }),
    )
    return redirect(baseUrl, '/admin/login?error=server')
  }

  const submitted = email.trim().toLowerCase()
  const allow = adminEmail.trim().toLowerCase()

  if (!emailsMatch(submitted, allow)) {
    // Non-allowlisted: sleep to flatten timing, log silently, redirect
    // to the same step=code confirmation page. Never differentiate
    // the response shape.
    await sleep(150)
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'email-otp.request-rejected',
        ip: ip ? 'present' : 'absent',
      }),
    )
    return redirect(baseUrl, '/admin/login?step=code')
  }

  const { rawCode, expiresAt } = await createEmailOtp({ email: allow })
  const ttlMinutes = EMAIL_OTP_DEFAULT_TTL_MINUTES

  await sendEmail({
    to: allow,
    subject: `Your Flintmere sign-in code: ${rawCode}`,
    text: buildText(rawCode, ttlMinutes),
    html: buildHtml(rawCode, ttlMinutes),
    tags: [{ name: 'kind', value: 'admin-email-otp' }],
  })

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'email-otp.request-sent',
      ip: ip ? 'present' : 'absent',
      expiresAt: expiresAt.toISOString(),
    }),
  )

  const response = redirect(baseUrl, '/admin/login?step=code')
  response.headers.append(
    'Set-Cookie',
    `${PENDING_EMAIL_COOKIE}=${encodeURIComponent(allow)}; ${pendingEmailCookieAttributes()}`,
  )
  return response
}

const INK = '#141518'
const PAPER = '#F7F4EE'
const MUTE = '#8B8D95'
const LINE = '#D5D2C8'

function buildText(code: string, ttlMinutes: number): string {
  return [
    'Sign in to Flintmere',
    '',
    `Your one-shot sign-in code:`,
    '',
    `    ${code}`,
    '',
    `Type it on the sign-in page within ${ttlMinutes} minutes.`,
    '',
    'If you did not request this, ignore the email — the code expires on its own.',
    '',
    '— Flintmere',
  ].join('\n')
}

function buildHtml(code: string, ttlMinutes: number): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:${PAPER};color:${INK};font-family:-apple-system,BlinkMacSystemFont,'Geist Sans','Inter',Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid ${LINE};padding:32px;">
  <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTE};margin-bottom:8px;">Flintmere — operator</div>
  <h1 style="margin:0 0 16px 0;font-family:ui-monospace,Menlo,monospace;font-size:20px;line-height:1.3;color:${INK};font-weight:500;">[ Sign in ]</h1>
  <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:${INK};">Type this one-shot code on the sign-in page. It expires in ${ttlMinutes} minutes.</p>
  <p style="margin:0 0 32px 0;text-align:center;">
    <span style="display:inline-block;padding:18px 28px;background:${INK};color:${PAPER};font-family:ui-monospace,Menlo,monospace;font-size:32px;letter-spacing:0.3em;font-weight:500;">${code}</span>
  </p>
  <p style="margin:0;padding-top:18px;border-top:1px solid ${LINE};font-size:12px;color:${MUTE};">If you did not request this, ignore the email — the code expires on its own.</p>
</div></body></html>`
}
