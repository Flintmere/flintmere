import { hashIp } from './hash';

/**
 * In-memory rate limiter for the public scanner.
 *
 * Single-droplet deployment per `decisions/0002-coolify-on-do.md` — a Map
 * is sufficient. If the scanner ever runs more than one node, swap the
 * store for Redis (or move to Upstash @upstash/ratelimit) without changing
 * the call sites.
 *
 * Two policies layered on /api/scan:
 *   • per-IP token bucket — protects against single-source flood
 *   • per-domain dedupe TTL — protects merchants' Shopify CDNs from
 *     being repeatedly scanned by different IPs in a tight window.
 *
 * Identity for per-IP is the SHA-256 hash already used for ipHash, not the
 * raw IP — keeps PII off the in-memory map and matches what we persist.
 */

interface Bucket {
  /** Tokens currently available, fractional. */
  tokens: number;
  /** Last refill epoch in ms. */
  updatedAt: number;
}

interface BucketPolicy {
  /** Max tokens (= max burst). */
  capacity: number;
  /** Tokens added per second. */
  refillRate: number;
}

const ipBuckets = new Map<string, Bucket>();
const domainSeenAt = new Map<string, number>();

// Default policy — generous for human use, tight enough to prevent abuse.
// 1 token = 1 scan. 6 burst, ~1/min sustained.
const DEFAULT_POLICY: BucketPolicy = {
  capacity: 6,
  refillRate: 1 / 60,
};

// Same shop cannot be rescanned by anyone within this window.
const DOMAIN_DEDUPE_MS = 30_000;

// Periodic compaction — drop fully-refilled buckets and stale dedupe rows
// so the map doesn't grow unbounded under sustained traffic. The first
// request in a process pays the housekeeping cost, then it's amortised.
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 5 * 60_000;

export interface RateLimitResult {
  ok: boolean;
  /** Reason when blocked. */
  reason?: 'ip' | 'domain';
  /** Seconds the caller should wait before retrying. */
  retryAfterSec: number;
}

export function checkScanRateLimit(args: {
  ip: string | null;
  normalisedDomain: string;
  now?: number;
  policy?: BucketPolicy;
}): RateLimitResult {
  const now = args.now ?? Date.now();
  const policy = args.policy ?? DEFAULT_POLICY;
  const key = (args.ip && hashIp(args.ip)) || 'anon';

  maybeSweep(now);

  // Per-domain dedupe — even if the IP has tokens, refuse a fresh scan
  // of the same shop within the window.
  const lastDomainAt = domainSeenAt.get(args.normalisedDomain);
  if (lastDomainAt && now - lastDomainAt < DOMAIN_DEDUPE_MS) {
    const retryAfterSec = Math.ceil((DOMAIN_DEDUPE_MS - (now - lastDomainAt)) / 1000);
    return { ok: false, reason: 'domain', retryAfterSec };
  }

  const bucket = ipBuckets.get(key) ?? {
    tokens: policy.capacity,
    updatedAt: now,
  };

  // Refill tokens proportional to elapsed time, clamped to capacity.
  const elapsedSec = Math.max(0, (now - bucket.updatedAt) / 1000);
  bucket.tokens = Math.min(
    policy.capacity,
    bucket.tokens + elapsedSec * policy.refillRate,
  );
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    const need = 1 - bucket.tokens;
    const retryAfterSec = Math.max(1, Math.ceil(need / policy.refillRate));
    ipBuckets.set(key, bucket);
    return { ok: false, reason: 'ip', retryAfterSec };
  }

  bucket.tokens -= 1;
  ipBuckets.set(key, bucket);
  domainSeenAt.set(args.normalisedDomain, now);
  return { ok: true, retryAfterSec: 0 };
}

function maybeSweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, b] of ipBuckets) {
    // Anything fully refilled and idle past the sweep window can go.
    if (b.tokens >= DEFAULT_POLICY.capacity) ipBuckets.delete(k);
  }
  for (const [d, t] of domainSeenAt) {
    if (now - t > DOMAIN_DEDUPE_MS * 4) domainSeenAt.delete(d);
  }
}

/** Test helper — clears state between tests. Not for production use. */
export function __resetRateLimitState() {
  ipBuckets.clear();
  domainSeenAt.clear();
  lastSweep = 0;
}
