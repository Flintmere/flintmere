/**
 * Outreach batch approval — ADR 0026.
 *
 * The weekly agent stages targets as status='ready_for_approval' with a
 * batchId. The daily brief carries a signed approve link; clicking it
 * flips the batch to 'queued', which the EXISTING outreach-initial cron
 * sends under the existing daily cap / unsubscribe / idempotency rules.
 *
 * Token format mirrors lib/outreach/unsubscribe.ts: domain-separated
 * HMAC-SHA256 over ADMIN_SESSION_SECRET, hex, timing-safe compare.
 * Stateless: payload = base64url('batchId:expiryMs'), token =
 * `${payload}.${signature}`.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '../db';
import { OUTREACH_STATUS } from './db';

const DOMAIN = 'outreach-approve-v1';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type VerifyResult =
  | { ok: true; batchId: string }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' };

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(`${DOMAIN}:${payloadB64}`).digest('hex');
}

export function signApproveToken(batchId: string, secret: string, now: Date = new Date()): string {
  const payloadB64 = Buffer.from(`${batchId}:${now.getTime() + TTL_MS}`, 'utf8').toString('base64url');
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export function verifyApproveToken(token: string, secret: string, now: Date = new Date()): VerifyResult {
  const dot = token.indexOf('.');
  if (dot <= 0) return { ok: false, reason: 'malformed' };
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payloadB64, secret);
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))
  ) {
    return { ok: false, reason: 'bad-signature' };
  }
  const decoded = Buffer.from(payloadB64, 'base64url').toString('utf8');
  const sep = decoded.lastIndexOf(':');
  if (sep <= 0) return { ok: false, reason: 'malformed' };
  const batchId = decoded.slice(0, sep);
  const expiryMs = Number(decoded.slice(sep + 1));
  if (!Number.isFinite(expiryMs)) return { ok: false, reason: 'malformed' };
  if (now.getTime() > expiryMs) return { ok: false, reason: 'expired' };
  return { ok: true, batchId };
}

/** Narrow prisma surface so tests inject a fake (contact-purge.test.ts pattern). */
export interface ApprovalPrisma {
  outreachTarget: {
    updateMany(args: {
      where: { batchId: string; status: string };
      data: { status: string; approvedAt: Date };
    }): Promise<{ count: number }>;
    count(args: { where: { batchId: string; approvedAt: { not: null } } }): Promise<number>;
  };
}

export interface ApproveBatchResult {
  approved: number;
  alreadyApproved: number;
}

export async function approveBatch(
  batchId: string,
  client: ApprovalPrisma = prisma,
  now: Date = new Date(),
): Promise<ApproveBatchResult> {
  const { count } = await client.outreachTarget.updateMany({
    where: { batchId, status: OUTREACH_STATUS.readyForApproval },
    data: { status: OUTREACH_STATUS.queued, approvedAt: now },
  });
  const alreadyApproved = count === 0
    ? await client.outreachTarget.count({ where: { batchId, approvedAt: { not: null } } })
    : 0;
  return { approved: count, alreadyApproved };
}

export function buildApproveUrl(batchId: string, secret: string, baseUrl: string): string {
  const u = new URL('/api/approve', baseUrl);
  u.searchParams.set('token', signApproveToken(batchId, secret));
  return u.toString();
}
