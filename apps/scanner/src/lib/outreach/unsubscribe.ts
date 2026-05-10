/**
 * Unsubscribe-link HMAC for the cold-email outreach pipeline.
 *
 * Uses ADMIN_SESSION_SECRET (operator already manages it) with a
 * domain-separation prefix `outreach-unsub-v1:` so the HMAC cannot be
 * confused with admin session cookies. A leak of a single unsubscribe
 * link cannot forge admin sessions, and a leak of an admin session
 * cookie cannot forge unsubscribe URLs.
 *
 * Why HMAC at all: target IDs are cuid()s — hard to guess but harvestable
 * if recipients forward emails or paste links into chat. HMAC stops
 * crawlers / bots from sweeping `?t=<id>&s=<random>` to mass-unsubscribe
 * the cohort.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const PREFIX = 'outreach-unsub-v1';

function readSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set (≥32 chars) for unsubscribe HMAC');
  }
  return secret;
}

export function signUnsubscribeToken(targetId: string, secret = readSecret()): string {
  return createHmac('sha256', secret)
    .update(`${PREFIX}:${targetId}`)
    .digest('hex');
}

export function verifyUnsubscribeToken(
  targetId: string,
  providedHex: string,
  secret = readSecret(),
): boolean {
  if (!providedHex || providedHex.length !== 64) return false;
  const expected = signUnsubscribeToken(targetId, secret);
  const a = Buffer.from(providedHex, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildUnsubscribeUrl(targetId: string, baseUrl: string): string {
  const token = signUnsubscribeToken(targetId);
  const u = new URL('/api/outreach/unsubscribe', baseUrl);
  u.searchParams.set('t', targetId);
  u.searchParams.set('s', token);
  return u.toString();
}
