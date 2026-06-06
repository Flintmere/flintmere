/**
 * One-click outreach-batch approval from the daily brief email — ADR 0026.
 *
 * GET with side effect is deliberate: single-operator internal link,
 * HMAC-gated, idempotent (re-clicks render "already approved"). A POST
 * form would double the operator's clicks for zero risk reduction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApproveToken, approveBatch } from '@/lib/outreach/approval';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function page(title: string, line: string, status: number): NextResponse {
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="robots" content="noindex"><title>${title} — Flintmere</title>
<style>body{font-family:ui-monospace,monospace;background:#FAF8F4;color:#0A0A0B;
display:grid;place-items:center;min-height:100vh;margin:0}
main{text-align:center;padding:2rem}h1{font-size:1.25rem;font-weight:600}</style>
</head><body><main><h1>[ ${title} ]</h1><p>${line}</p></main></body></html>`;
  return new NextResponse(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return page('unavailable', 'Approval is not configured on this deployment.', 503);
  }
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const verdict = verifyApproveToken(token, secret);
  if (!verdict.ok) {
    const line = verdict.reason === 'expired'
      ? `This link has expired. Tomorrow’s brief carries a fresh one.`
      : 'This link is not valid.';
    return page('not approved', line, verdict.reason === 'expired' ? 410 : 403);
  }
  const result = await approveBatch(verdict.batchId);
  if (result.approved > 0) {
    return page('approved', `${result.approved} emails will send within the existing daily cap.`, 200);
  }
  if (result.alreadyApproved > 0) {
    return page('already approved', 'This batch was approved earlier. Nothing further to do.', 200);
  }
  return page('nothing to approve', 'No emails are waiting in this batch.', 404);
}
