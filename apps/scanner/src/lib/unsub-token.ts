import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signed unsubscribe tokens. One-click (PECR/GDPR requirement).
 * Token format: base64url(leadId.expiresAt.signature)
 * Signature is HMAC-SHA256 over "leadId.expiresAt" with UNSUBSCRIBE_SECRET.
 */

const DEFAULT_TTL_DAYS = 365;

function secret(): string {
  const raw = process.env.UNSUBSCRIBE_SECRET;
  if (!raw) {
    throw new Error(
      'UNSUBSCRIBE_SECRET missing. Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  return raw;
}

export interface ValidatedToken {
  leadId: string;
  expiresAt: number;
}

export function signUnsubToken(leadId: string, ttlDays = DEFAULT_TTL_DAYS): string {
  const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload = `${leadId}.${expiresAt}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`, 'utf8').toString('base64url');
}

export function verifyUnsubToken(token: string): ValidatedToken | null {
  let decoded: string;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const parts = decoded.split('.');
  if (parts.length !== 3) return null;
  const [leadId, expiresAtStr, sig] = parts;
  if (!leadId || !expiresAtStr || !sig) return null;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  const expected = createHmac('sha256', secret())
    .update(`${leadId}.${expiresAt}`)
    .digest('hex');

  let sigBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    sigBuf = Buffer.from(sig, 'hex');
    expectedBuf = Buffer.from(expected, 'hex');
  } catch {
    return null;
  }

  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  return { leadId, expiresAt };
}
