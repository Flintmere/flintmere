import { readFileSync } from 'node:fs'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createMagicLink, MAGIC_LINK_DEFAULT_TTL_MINUTES } from '@/lib/magic-link'
import { checkAdminLoginRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/magic-link/request — operator submits their email; if it
 * matches the ADMIN_EMAIL allowlist we generate a token, store its hash, and
 * email a one-shot sign-in link. If it doesn't match, we drop ~150ms of
 * silence and respond identically — the response shape never reveals
 * whether the address is allowlisted.
 *
 * Posture:
 *   - Per-IP rate limit (reuses checkAdminLoginRateLimit). 10 per 10 min.
 *   - Allowlist comparison is timing-safe.
 *   - Non-allowlisted addresses sleep ~150ms to flatten the timing channel
 *     against the createMagicLink + sendEmail latency window.
 *   - Always 303 redirects to /admin/login?check=email on success/silent;
 *     no JS required.
 *
 * Reads ADMIN_EMAIL via the _FILE secret-mount pattern (commit 24b1a97) so
 * the existing Coolify secret-shell-expansion fix continues to work.
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

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

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

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const rl = checkAdminLoginRateLimit({ ip })
  if (!rl.ok) {
    return redirect(baseUrl, '/admin/login?error=rate-limited')
  }

  const adminEmail = readSecret('ADMIN_EMAIL')
  if (!adminEmail) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'magic-link.misconfigured',
        hasAdminEmail: false,
      }),
    )
    return redirect(baseUrl, '/admin/login?error=server')
  }

  const submitted = email.trim().toLowerCase()
  const allow = adminEmail.trim().toLowerCase()
  if (!emailsMatch(submitted, allow)) {
    // Non-allowlisted: sleep to flatten timing, log silently, redirect to
    // the same confirmation page. Never differentiate response.
    await sleep(150)
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'magic-link.request-rejected',
        ip: ip ? 'present' : 'absent',
      }),
    )
    return redirect(baseUrl, '/admin/login?check=email')
  }

  const { rawToken, expiresAt } = await createMagicLink({ email: allow })
  const link = `${baseUrl}/api/admin/magic-link/verify?token=${encodeURIComponent(rawToken)}`

  const ttlMinutes = MAGIC_LINK_DEFAULT_TTL_MINUTES
  await sendEmail({
    to: allow,
    subject: 'Sign in — Flintmere',
    text: buildText(link, ttlMinutes),
    html: buildHtml(link, ttlMinutes),
    tags: [{ name: 'kind', value: 'admin-magic-link' }],
  })

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: 'magic-link.request-sent',
      ip: ip ? 'present' : 'absent',
      expiresAt: expiresAt.toISOString(),
    }),
  )
  return redirect(baseUrl, '/admin/login?check=email')
}

function emailsMatch(a: string, b: string): boolean {
  // Pad both to fixed length so timing-safe compare is constant-cost.
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

const INK = '#141518'
const PAPER = '#F7F4EE'
const MUTE = '#8B8D95'
const LINE = '#D5D2C8'

function buildText(link: string, ttlMinutes: number): string {
  return [
    'Sign in to Flintmere',
    '',
    `This link signs you in once and expires in ${ttlMinutes} minutes.`,
    '',
    link,
    '',
    'If you did not request this, ignore the email — the link expires on its own.',
    '',
    '— Flintmere',
  ].join('\n')
}

function buildHtml(link: string, ttlMinutes: number): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:${PAPER};color:${INK};font-family:-apple-system,BlinkMacSystemFont,'Geist Sans','Inter',Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid ${LINE};padding:32px;">
  <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTE};margin-bottom:8px;">Flintmere — operator</div>
  <h1 style="margin:0 0 16px 0;font-family:ui-monospace,Menlo,monospace;font-size:20px;line-height:1.3;color:${INK};font-weight:500;">[ Sign in ]</h1>
  <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:${INK};">This link signs you in once and expires in ${ttlMinutes} minutes.</p>
  <p style="margin:0 0 24px 0;">
    <a href="${link}" style="display:inline-block;padding:14px 20px;background:${INK};color:${PAPER};text-decoration:none;font-family:ui-monospace,Menlo,monospace;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">Continue →</a>
  </p>
  <p style="margin:0 0 8px 0;font-size:12px;color:${MUTE};">Or paste this URL:</p>
  <p style="margin:0 0 24px 0;font-family:ui-monospace,Menlo,monospace;font-size:12px;color:${INK};word-break:break-all;">${link}</p>
  <p style="margin:0;padding-top:18px;border-top:1px solid ${LINE};font-size:12px;color:${MUTE};">If you did not request this, ignore the email — the link expires on its own.</p>
</div></body></html>`
}
