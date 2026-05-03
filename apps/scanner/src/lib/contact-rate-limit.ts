import { hashIp } from './hash';

/**
 * In-memory rate limiter for /api/contact.
 *
 * Mirrors the token-bucket pattern from `rate-limit.ts` (single-droplet
 * per ADR 0002, swap for Redis if/when scanner runs multi-node) but uses
 * separate state so a scan flood can't starve the contact form and vice
 * versa.
 *
 * Two layered buckets:
 *   • per-IP — protects against single-source flood
 *   • per-email — protects against single-address spam (different IPs but
 *     same throwaway address). Email is normalised + lowercased before key.
 *
 * Policy: 5 burst, refill ~5/hour. So a human can submit a few times in
 * quick succession (multi-topic enquiries are real) without triggering the
 * limit; a script trying 50 in an hour gets cut off after the first burst.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

interface BucketPolicy {
  capacity: number;
  refillRate: number; // tokens/sec
}

const ipBuckets = new Map<string, Bucket>();
const emailBuckets = new Map<string, Bucket>();

const IP_POLICY: BucketPolicy = {
  capacity: 5,
  refillRate: 5 / 3600, // 5 per hour sustained
};

const EMAIL_POLICY: BucketPolicy = {
  capacity: 3,
  refillRate: 3 / 3600, // 3 per hour sustained
};

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 5 * 60_000;

export interface ContactRateLimitResult {
  ok: boolean;
  reason?: 'ip' | 'email';
  retryAfterSec: number;
}

export function checkContactRateLimit(args: {
  ip: string | null;
  email: string;
  now?: number;
}): ContactRateLimitResult {
  const now = args.now ?? Date.now();
  maybeSweep(now);

  const ipKey = (args.ip && hashIp(args.ip)) || 'anon';
  const emailKey = args.email.trim().toLowerCase();

  const ipResult = consume(ipBuckets, ipKey, IP_POLICY, now);
  if (!ipResult.ok) {
    return { ok: false, reason: 'ip', retryAfterSec: ipResult.retryAfterSec };
  }

  const emailResult = consume(emailBuckets, emailKey, EMAIL_POLICY, now);
  if (!emailResult.ok) {
    // The IP token was already deducted above; on a same-process retry the
    // user is still within the email policy. That's the intended behaviour:
    // we don't refund the IP slot just because the email matched.
    return {
      ok: false,
      reason: 'email',
      retryAfterSec: emailResult.retryAfterSec,
    };
  }

  return { ok: true, retryAfterSec: 0 };
}

function consume(
  store: Map<string, Bucket>,
  key: string,
  policy: BucketPolicy,
  now: number,
): { ok: boolean; retryAfterSec: number } {
  const bucket = store.get(key) ?? {
    tokens: policy.capacity,
    updatedAt: now,
  };

  const elapsedSec = Math.max(0, (now - bucket.updatedAt) / 1000);
  bucket.tokens = Math.min(
    policy.capacity,
    bucket.tokens + elapsedSec * policy.refillRate,
  );
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    const need = 1 - bucket.tokens;
    const retryAfterSec = Math.max(1, Math.ceil(need / policy.refillRate));
    store.set(key, bucket);
    return { ok: false, retryAfterSec };
  }

  bucket.tokens -= 1;
  store.set(key, bucket);
  return { ok: true, retryAfterSec: 0 };
}

function maybeSweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, b] of ipBuckets) {
    if (b.tokens >= IP_POLICY.capacity) ipBuckets.delete(k);
  }
  for (const [k, b] of emailBuckets) {
    if (b.tokens >= EMAIL_POLICY.capacity) emailBuckets.delete(k);
  }
}

/** Test helper. */
export function __resetContactRateLimitState() {
  ipBuckets.clear();
  emailBuckets.clear();
  lastSweep = 0;
}
