import { hashIp } from './hash';

/**
 * In-memory rate limiter.
 *
 * Single-droplet deployment per `decisions/0002-coolify-on-do.md` — a Map
 * is sufficient. If the scanner ever runs more than one node, swap the
 * store for Redis (or move to Upstash @upstash/ratelimit) without changing
 * the call sites.
 *
 * Two distinct call sites, each with its own state maps + policies:
 *
 *   `checkScanRateLimit` — public scanner:
 *     • per-IP token bucket — single-source flood protection
 *     • per-domain dedupe TTL — protects merchants' Shopify CDNs from
 *       being repeatedly scanned by different IPs in a tight window.
 *
 *   `checkCheckoutRateLimit` — concierge audit checkout:
 *     • per-email token bucket — catches scripted card-testing on a
 *       single merchant identity + many stolen cards.
 *     • per-IP token bucket — single-source flood protection.
 *     Layered after Turnstile, before Stripe API.
 *
 * Identity for per-IP is the SHA-256 hash already used for ipHash, not
 * the raw IP — keeps PII off the in-memory map and matches what we
 * persist. Email is normalised lowercase + trimmed before keying.
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
  for (const [k, b] of checkoutEmailBuckets) {
    if (b.tokens >= CHECKOUT_EMAIL_POLICY.capacity) checkoutEmailBuckets.delete(k);
  }
  for (const [k, b] of checkoutIpBuckets) {
    if (b.tokens >= CHECKOUT_IP_POLICY.capacity) checkoutIpBuckets.delete(k);
  }
  for (const [k, b] of auditDraftGenerateBuckets) {
    if (b.tokens >= AUDIT_DRAFT_GENERATE_POLICY.capacity)
      auditDraftGenerateBuckets.delete(k);
  }
  for (const [k, b] of leadIpBuckets) {
    if (b.tokens >= LEAD_IP_POLICY.capacity) leadIpBuckets.delete(k);
  }
  for (const [k, b] of scanActionIpBuckets) {
    if (b.tokens >= SCAN_ACTION_POLICY.capacity) scanActionIpBuckets.delete(k);
  }
  for (const [k, b] of oneTimeSecretIpBuckets) {
    if (b.tokens >= ONE_TIME_SECRET_POLICY.capacity) oneTimeSecretIpBuckets.delete(k);
  }
  for (const [k, b] of gmcRequestIpBuckets) {
    if (b.tokens >= GMC_REQUEST_POLICY.capacity) gmcRequestIpBuckets.delete(k);
  }
  for (const [k, b] of oauthFlowIpBuckets) {
    if (b.tokens >= OAUTH_FLOW_POLICY.capacity) oauthFlowIpBuckets.delete(k);
  }
}

// ---------------------------------------------------------------------------
// Concierge-audit checkout rate limit.
//
// Layered after Turnstile (which catches naive bots) and before the Stripe
// PaymentIntent create call. Defends against scripted card-testing — the
// pattern where an attacker scripts ONE email + many stolen card numbers
// to validate which work, exploiting Stripe's per-PI authentication for
// free card-validity probing.
//
// Per-email policy: 5 attempts per hour. Generous for legitimate retries
// (declined card → fix details → retry); tight enough that a scripted
// attack on one identity caps fast.
//
// Per-IP policy: 20 attempts per hour. Generous for shared NAT (corporate
// / mobile / student / VPN); tight enough to flag scripted abuse from a
// single source. Distributed botnets bypass per-IP — defence in depth.
// ---------------------------------------------------------------------------

const checkoutEmailBuckets = new Map<string, Bucket>();
const checkoutIpBuckets = new Map<string, Bucket>();

const CHECKOUT_EMAIL_POLICY: BucketPolicy = {
  capacity: 5,
  refillRate: 5 / 3600, // 5/hour sustained
};

const CHECKOUT_IP_POLICY: BucketPolicy = {
  capacity: 20,
  refillRate: 20 / 3600, // 20/hour sustained
};

export interface CheckoutRateLimitResult {
  ok: boolean;
  reason?: 'email' | 'ip';
  retryAfterSec: number;
}

export function checkCheckoutRateLimit(args: {
  email: string;
  ip: string | null;
  now?: number;
}): CheckoutRateLimitResult {
  const now = args.now ?? Date.now();
  const emailKey = args.email.trim().toLowerCase();
  const ipKey = (args.ip && hashIp(args.ip)) || 'anon';

  maybeSweep(now);

  // Email check first — narrower defence, more specific signal. We don't
  // consume the email token if the IP check would block; otherwise a
  // distributed attack would burn a legitimate user's email budget.
  const ipBucket = consumeToken(checkoutIpBuckets, ipKey, CHECKOUT_IP_POLICY, now, /* dryRun */ true);
  if (!ipBucket.consumed) {
    return { ok: false, reason: 'ip', retryAfterSec: ipBucket.retryAfterSec };
  }

  const emailBucket = consumeToken(
    checkoutEmailBuckets,
    emailKey,
    CHECKOUT_EMAIL_POLICY,
    now,
    /* dryRun */ true,
  );
  if (!emailBucket.consumed) {
    return { ok: false, reason: 'email', retryAfterSec: emailBucket.retryAfterSec };
  }

  // Both checks pass — actually consume both tokens.
  consumeToken(checkoutIpBuckets, ipKey, CHECKOUT_IP_POLICY, now, /* dryRun */ false);
  consumeToken(checkoutEmailBuckets, emailKey, CHECKOUT_EMAIL_POLICY, now, /* dryRun */ false);

  return { ok: true, retryAfterSec: 0 };
}

interface ConsumeResult {
  consumed: boolean;
  retryAfterSec: number;
}

function consumeToken(
  map: Map<string, Bucket>,
  key: string,
  policy: BucketPolicy,
  now: number,
  dryRun: boolean,
): ConsumeResult {
  const bucket = map.get(key) ?? {
    tokens: policy.capacity,
    updatedAt: now,
  };
  const elapsedSec = Math.max(0, (now - bucket.updatedAt) / 1000);
  const refilled = Math.min(
    policy.capacity,
    bucket.tokens + elapsedSec * policy.refillRate,
  );

  if (refilled < 1) {
    const need = 1 - refilled;
    const retryAfterSec = Math.max(1, Math.ceil(need / policy.refillRate));
    if (!dryRun) {
      bucket.tokens = refilled;
      bucket.updatedAt = now;
      map.set(key, bucket);
    }
    return { consumed: false, retryAfterSec };
  }

  if (!dryRun) {
    bucket.tokens = refilled - 1;
    bucket.updatedAt = now;
    map.set(key, bucket);
  }
  return { consumed: true, retryAfterSec: 0 };
}

// ---------------------------------------------------------------------------
// Admin-login rate limit (audit-assist v0).
//
// Per-IP only. The login route accepts a single password — there's no
// email or shop key to scope by. 10 attempts per 10 minutes leaves ample
// headroom for legitimate fat-fingering (operator types it wrong 5
// times during a tired evening) while making any brute force attack
// useless against a 12-char+ password.
// ---------------------------------------------------------------------------

const adminLoginIpBuckets = new Map<string, Bucket>();

const ADMIN_LOGIN_IP_POLICY: BucketPolicy = {
  capacity: 10,
  refillRate: 10 / 600, // 10 per 10 minutes sustained
};

export function checkAdminLoginRateLimit(args: {
  ip: string | null;
  now?: number;
}): RateLimitResult {
  const now = args.now ?? Date.now();
  const ipKey = (args.ip && hashIp(args.ip)) || 'anon';
  maybeSweep(now);

  const result = consumeToken(
    adminLoginIpBuckets,
    ipKey,
    ADMIN_LOGIN_IP_POLICY,
    now,
    /* dryRun */ false,
  );
  if (!result.consumed) {
    return { ok: false, reason: 'ip', retryAfterSec: result.retryAfterSec };
  }
  return { ok: true, retryAfterSec: 0 };
}

// ---------------------------------------------------------------------------
// Audit-draft generate rate limit (audit-assist v0).
//
// Per-cookie (= per-operator at v0). 5 generations per hour caps cost
// at ~£0.30/hour worst-case (5 × £0.06 per Gemini 2.5 Pro draft).
// Loose enough for legitimate operator iteration; tight enough that a
// stuck loop or accidental refresh storm can't burn the LLM budget.
// ---------------------------------------------------------------------------

const auditDraftGenerateBuckets = new Map<string, Bucket>();

const AUDIT_DRAFT_GENERATE_POLICY: BucketPolicy = {
  capacity: 5,
  refillRate: 5 / 3600, // 5/hour sustained
};

export function checkAuditDraftGenerateRateLimit(args: {
  cookieValue: string;
  now?: number;
}): RateLimitResult {
  const now = args.now ?? Date.now();
  const key = args.cookieValue || 'anon';
  maybeSweep(now);

  const result = consumeToken(
    auditDraftGenerateBuckets,
    key,
    AUDIT_DRAFT_GENERATE_POLICY,
    now,
    /* dryRun */ false,
  );
  if (!result.consumed) {
    return { ok: false, reason: 'ip', retryAfterSec: result.retryAfterSec };
  }
  return { ok: true, retryAfterSec: 0 };
}

// ---------------------------------------------------------------------------
// Lead-capture rate limit (scanner /api/lead).
//
// /api/lead accepts (email, scanId) and triggers a Resend email send.
// Without a rate limit, anyone holding a valid scanId UUID can spray
// arbitrary email addresses — burning Resend quota and salting the lead
// list with addresses the merchant didn't enter. The DB unique
// (email, scanId) index prevents row duplication but not address-spray.
//
// Per-IP only — the email is the variable being attacked, so keying by
// email would be self-defeating. 10 attempts per hour covers legitimate
// retries (typo → fix → resend) with margin; tight enough that a
// scripted spray caps fast. Added 2026-05-09 pre-launch audit (P1-5).
// ---------------------------------------------------------------------------

const leadIpBuckets = new Map<string, Bucket>();

const LEAD_IP_POLICY: BucketPolicy = {
  capacity: 10,
  refillRate: 10 / 3600, // 10/hour sustained
};

export function checkLeadRateLimit(args: {
  ip: string | null;
  now?: number;
}): RateLimitResult {
  const now = args.now ?? Date.now();
  const ipKey = (args.ip && hashIp(args.ip)) || 'anon';
  maybeSweep(now);

  const result = consumeToken(
    leadIpBuckets,
    ipKey,
    LEAD_IP_POLICY,
    now,
    /* dryRun */ false,
  );
  if (!result.consumed) {
    return { ok: false, reason: 'ip', retryAfterSec: result.retryAfterSec };
  }
  return { ok: true, retryAfterSec: 0 };
}

// ---------------------------------------------------------------------------
// Possession-gated public endpoints (added 2026-05-10 pre-launch P1 pass).
//
// Four separate buckets, each with a policy tuned to the endpoint group's
// risk profile. All per-IP (no email / cookie key on these paths).
//
//   • scan-action       — /api/scan/[id] GET, /api/scan/[id]/publish (POST/DEL),
//                         /api/scan/[id]/publish-public-page (POST/DEL).
//                         Possession-gated by scan UUID. 30/hour: generous
//                         for legitimate merchant repeat-interaction; tight
//                         enough that ID-enumeration floods cap fast.
//
//   • one-time-secret   — /api/secret/[id]/consume. Existence-probing risk:
//                         404 vs 410 distinguishes "live" from "burned" IDs.
//                         60/hour: legitimate consume is one-shot per ID,
//                         so 60 attempts/hour from one IP is already
//                         abusive but doesn't block legitimate browser
//                         multi-fetch (preflight + GET + POST).
//
//   • gmc-request       — /api/audit/gmc-access-request. POST writes to DB.
//                         5/hour: matches lead-capture posture (write +
//                         downstream email risk).
//
//   • oauth-flow        — /api/auth/google/start + /disconnect. DB lookups
//                         + outbound redirect. 60/hour: OAuth flows can
//                         legitimately involve multiple starts (back-button,
//                         token-expiry, error-recovery) without being abuse.
// ---------------------------------------------------------------------------

const scanActionIpBuckets = new Map<string, Bucket>();
const oneTimeSecretIpBuckets = new Map<string, Bucket>();
const gmcRequestIpBuckets = new Map<string, Bucket>();
const oauthFlowIpBuckets = new Map<string, Bucket>();

const SCAN_ACTION_POLICY: BucketPolicy = {
  capacity: 30,
  refillRate: 30 / 3600,
};
const ONE_TIME_SECRET_POLICY: BucketPolicy = {
  capacity: 20,
  refillRate: 60 / 3600,
};
const GMC_REQUEST_POLICY: BucketPolicy = {
  capacity: 5,
  refillRate: 5 / 3600,
};
const OAUTH_FLOW_POLICY: BucketPolicy = {
  capacity: 20,
  refillRate: 60 / 3600,
};

function checkPerIpBucket(
  map: Map<string, Bucket>,
  policy: BucketPolicy,
  ip: string | null,
  now: number,
): RateLimitResult {
  const ipKey = (ip && hashIp(ip)) || 'anon';
  maybeSweep(now);
  const result = consumeToken(map, ipKey, policy, now, /* dryRun */ false);
  if (!result.consumed) {
    return { ok: false, reason: 'ip', retryAfterSec: result.retryAfterSec };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function checkScanActionRateLimit(args: {
  ip: string | null;
  now?: number;
}): RateLimitResult {
  return checkPerIpBucket(
    scanActionIpBuckets,
    SCAN_ACTION_POLICY,
    args.ip,
    args.now ?? Date.now(),
  );
}

export function checkOneTimeSecretConsumeRateLimit(args: {
  ip: string | null;
  now?: number;
}): RateLimitResult {
  return checkPerIpBucket(
    oneTimeSecretIpBuckets,
    ONE_TIME_SECRET_POLICY,
    args.ip,
    args.now ?? Date.now(),
  );
}

export function checkGmcAccessRequestRateLimit(args: {
  ip: string | null;
  now?: number;
}): RateLimitResult {
  return checkPerIpBucket(
    gmcRequestIpBuckets,
    GMC_REQUEST_POLICY,
    args.ip,
    args.now ?? Date.now(),
  );
}

export function checkOauthFlowRateLimit(args: {
  ip: string | null;
  now?: number;
}): RateLimitResult {
  return checkPerIpBucket(
    oauthFlowIpBuckets,
    OAUTH_FLOW_POLICY,
    args.ip,
    args.now ?? Date.now(),
  );
}

/** Test helper — clears state between tests. Not for production use. */
export function __resetRateLimitState() {
  ipBuckets.clear();
  domainSeenAt.clear();
  checkoutEmailBuckets.clear();
  checkoutIpBuckets.clear();
  adminLoginIpBuckets.clear();
  auditDraftGenerateBuckets.clear();
  leadIpBuckets.clear();
  scanActionIpBuckets.clear();
  oneTimeSecretIpBuckets.clear();
  gmcRequestIpBuckets.clear();
  oauthFlowIpBuckets.clear();
  lastSweep = 0;
}
