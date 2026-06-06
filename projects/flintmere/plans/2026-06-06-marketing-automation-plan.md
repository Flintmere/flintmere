# Marketing Automation Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual marketing cadence with an automated pipeline: agents draft X posts / blog posts / outreach batches; the scanner app posts to X, sends approved outreach, and emails a truthful daily report with one-click approve links.

**Architecture:** Spec at `projects/flintmere/plans/2026-06-06-marketing-automation-spec.md`. New `SocialPost` queue table consumed by a cron route posting via X API (OAuth 1.0a, hand-rolled signing, no new deps). Outreach approval = HMAC link flips `ready_for_approval` targets to `queued`; the existing send pipeline does the rest. Daily brief rewired from the dead cadence snapshot to live pipeline state.

**Tech Stack:** Next.js App Router (apps/scanner), Prisma/Postgres, Vitest (colocated `.test.ts`, fake-client pattern), Resend, X API v2, PostHog Query API (EU), tsx scripts.

**Ground-truth patterns (verified 2026-06-06):**
- Cron auth: `verifyCronSecret(hdrs.get('x-cron-secret'))` from `src/lib/cron-auth.ts` (`CRON_SECRET` env, ≥32 chars).
- HMAC convention: `createHmac('sha256', ADMIN_SESSION_SECRET)` with a domain-separation prefix, hex digest, `timingSafeEqual` — see `src/lib/outreach/unsubscribe.ts:28-44`.
- Outreach statuses (`src/lib/outreach/db.ts:13-23`): `pending, enriched, queued, sent, followed_up, replied, unsubscribed, bounced, dropped`. Initial-send eligibility: `status='queued'` + non-null email/score/grade/productCount. Daily cap ramp 5→30 in `src/lib/outreach/cap.ts`.
- Base URL: `env.NEXT_PUBLIC_APP_URL` (`src/lib/env.ts`).
- Tests: `pnpm -F scanner test` (vitest, `src/**/*.test.ts`), fake in-memory clients (see `src/lib/contact-purge.test.ts:16-49`), no vi.mock of prisma.
- Scripts: tsx, registered in `apps/scanner/package.json` scripts.
- CI: lint only (`.github/workflows/lint.yml`). Typecheck/test run locally.
- PostHog: EU project 195011; Query API verified live via `POST https://eu.posthog.com/api/projects/$POSTHOG_PROJECT_ID/query/` with `Authorization: Bearer $POSTHOG_PERSONAL_API_KEY` (both env vars already in Coolify).
- ADR next number: **0026** (0025 = PostHog, merged in PR #59 on main).

---

### Task 0: Branch setup

**Files:** none (git only)

- [ ] **Step 1: Fresh branch from origin/main** (anti-waste rule 7 — do NOT build on `chore/cookies-clause-merge`; it predates the PostHog merge). The main checkout carries unrelated dirty verify-engine files — leave them; work in a worktree:

```bash
git -C /Users/abuaa/Projects/Flintmere fetch origin
git -C /Users/abuaa/Projects/Flintmere worktree add ../Flintmere-marketing -b feat/marketing-automation origin/main
cd /Users/abuaa/Projects/Flintmere-marketing
cp /Users/abuaa/Projects/Flintmere/apps/scanner/.env* apps/scanner/ 2>/dev/null || true
pnpm install
```

(`.env` copy: gitignored env files don't travel into worktrees — this broke verify agents on 2026-06-06; see handover.)

- [ ] **Step 2: Verify baseline green**

```bash
pnpm -F scanner lint && pnpm -F scanner typecheck && pnpm -F scanner test
```
Expected: 0 errors, 602+ tests pass.

---

### Task 1: Schema — `SocialPost` + outreach approval fields

**Files:**
- Modify: `apps/scanner/prisma/schema.prisma` (append model; extend `OutreachTarget` at ~line 307)

- [ ] **Step 1: Add `SocialPost` model** at the end of schema.prisma:

```prisma
/// Agent-drafted social posts queued for deterministic publishing by
/// /api/cron/social-post. Per ADR 0026 — marketing automation pipeline.
/// status: queued → posted | failed. Failed rows are never auto-retried;
/// the daily brief flags them and the weekly agent re-queues or rewrites.
model SocialPost {
  id           String    @id @default(cuid())
  channel      String    // 'x' only for now
  body         String    @db.Text
  altText      String?   @map("alt_text") @db.Text
  utmCampaign  String    @map("utm_campaign")
  status       String    @default("queued")
  scheduledAt  DateTime  @map("scheduled_at")
  postedAt     DateTime? @map("posted_at")
  externalId   String?   @map("external_id")
  errorMessage String?   @map("error_message") @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")

  @@index([status, scheduledAt])
  @@map("scanner_social_posts")
}
```

- [ ] **Step 2: Add approval fields to `OutreachTarget`** (after `enrichmentFailedReason`, before `sends`):

```prisma
  // Marketing-automation batch approval (ADR 0026). Agent stages targets
  // with status='ready_for_approval' + batchId; /api/approve flips them
  // to 'queued' and stamps approvedAt. batchId NULL ⇒ legacy path,
  // untouched by approval flow.
  batchId    String?   @map("batch_id")
  approvedAt DateTime? @map("approved_at")
```

And add `@@index([batchId])` next to the existing `@@index` lines.

- [ ] **Step 3: Generate migration + client**

```bash
pnpm -F scanner prisma:migrate -- --name marketing_automation_social_posts_and_approval
pnpm -F scanner prisma:generate
```
Expected: new folder `apps/scanner/prisma/migrations/<timestamp>_marketing_automation_social_posts_and_approval/migration.sql`. Open it and prepend a comment line: `-- Per ADR 0026 — marketing automation pipeline (SocialPost queue + outreach batch approval).` Additive only — no existing-row transforms, so no #18 DBA review needed.

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm -F scanner typecheck
git add apps/scanner/prisma && git commit -m "feat(scanner): SocialPost model + outreach batch-approval fields (ADR 0026)"
```

---

### Task 2: `ready_for_approval` status + approval lib

**Files:**
- Modify: `apps/scanner/src/lib/outreach/db.ts:13-23` (add status)
- Create: `apps/scanner/src/lib/outreach/approval.ts`
- Test: `apps/scanner/src/lib/outreach/approval.test.ts`

- [ ] **Step 1: Add status to the vocabulary** in `db.ts` `OUTREACH_STATUS` (after `enriched`):

```typescript
  readyForApproval: 'ready_for_approval',
```

- [ ] **Step 2: Write failing tests** — `approval.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  signApproveToken,
  verifyApproveToken,
  approveBatch,
  type ApprovalPrisma,
} from './approval';

const SECRET = 'a'.repeat(64);

describe('approve token', () => {
  it('round-trips a valid token', () => {
    const token = signApproveToken('batch-1', SECRET, new Date('2026-06-06T00:00:00Z'));
    const result = verifyApproveToken(token, SECRET, new Date('2026-06-08T00:00:00Z'));
    expect(result).toEqual({ ok: true, batchId: 'batch-1' });
  });

  it('rejects a tampered token', () => {
    const token = signApproveToken('batch-1', SECRET, new Date('2026-06-06T00:00:00Z'));
    const [payload] = token.split('.');
    const forged = `${payload}.${'0'.repeat(64)}`;
    expect(verifyApproveToken(forged, SECRET, new Date('2026-06-07T00:00:00Z'))).toEqual({
      ok: false,
      reason: 'bad-signature',
    });
  });

  it('rejects an expired token (7 days)', () => {
    const token = signApproveToken('batch-1', SECRET, new Date('2026-06-06T00:00:00Z'));
    expect(verifyApproveToken(token, SECRET, new Date('2026-06-14T00:00:01Z'))).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('rejects garbage', () => {
    expect(verifyApproveToken('not-a-token', SECRET, new Date())).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });
});

describe('approveBatch', () => {
  function makeFakePrisma(rows: Array<{ id: string; batchId: string | null; status: string; approvedAt: Date | null }>) {
    return {
      client: {
        outreachTarget: {
          updateMany: async ({ where, data }: {
            where: { batchId: string; status: string };
            data: { status: string; approvedAt: Date };
          }) => {
            let count = 0;
            for (const r of rows) {
              if (r.batchId === where.batchId && r.status === where.status) {
                r.status = data.status;
                r.approvedAt = data.approvedAt;
                count++;
              }
            }
            return { count };
          },
          count: async ({ where }: { where: { batchId: string; approvedAt: { not: null } } }) =>
            rows.filter((r) => r.batchId === where.batchId && r.approvedAt !== null).length,
        },
      } satisfies ApprovalPrisma,
      rows,
    };
  }

  it('flips ready_for_approval rows to queued and stamps approvedAt', async () => {
    const { client, rows } = makeFakePrisma([
      { id: 't1', batchId: 'b1', status: 'ready_for_approval', approvedAt: null },
      { id: 't2', batchId: 'b1', status: 'ready_for_approval', approvedAt: null },
      { id: 't3', batchId: 'b2', status: 'ready_for_approval', approvedAt: null },
      { id: 't4', batchId: 'b1', status: 'sent', approvedAt: null },
    ]);
    const result = await approveBatch('b1', client);
    expect(result).toEqual({ approved: 2, alreadyApproved: 0 });
    expect(rows[0]!.status).toBe('queued');
    expect(rows[2]!.status).toBe('ready_for_approval'); // other batch untouched
    expect(rows[3]!.status).toBe('sent'); // non-pending untouched
  });

  it('is idempotent — second call approves zero, reports alreadyApproved', async () => {
    const { client } = makeFakePrisma([
      { id: 't1', batchId: 'b1', status: 'ready_for_approval', approvedAt: null },
    ]);
    await approveBatch('b1', client);
    const second = await approveBatch('b1', client);
    expect(second).toEqual({ approved: 0, alreadyApproved: 1 });
  });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
pnpm -F scanner test -- approval
```
Expected: FAIL — module `./approval` not found.

- [ ] **Step 4: Implement** `approval.ts`:

```typescript
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
```

- [ ] **Step 5: Run tests**

```bash
pnpm -F scanner test -- approval
```
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/scanner/src/lib/outreach && git commit -m "feat(scanner): outreach batch approval — HMAC tokens + ready_for_approval status"
```

---

### Task 3: `GET /api/approve` route

**Files:**
- Create: `apps/scanner/src/app/api/approve/route.ts`

No route-level test (route is a thin shell over the tested lib; matches existing cron-route convention).

- [ ] **Step 1: Implement route**

```typescript
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
      ? 'This link has expired. Tomorrow’s brief carries a fresh one.'
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
```

- [ ] **Step 2: Lint + typecheck + commit**

```bash
pnpm -F scanner lint && pnpm -F scanner typecheck
git add apps/scanner/src/app/api/approve && git commit -m "feat(scanner): GET /api/approve — one-click outreach batch approval"
```

---

### Task 4: X client (OAuth 1.0a, no new deps)

**Files:**
- Create: `apps/scanner/src/lib/social/x-client.ts`
- Test: `apps/scanner/src/lib/social/x-client.test.ts`

- [ ] **Step 1: Failing tests** — `x-client.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { buildOAuthHeader, postTweet, type XCredentials } from './x-client';

const CREDS: XCredentials = {
  apiKey: 'consumer-key',
  apiKeySecret: 'consumer-secret',
  accessToken: 'access-token',
  accessTokenSecret: 'access-secret',
};

describe('buildOAuthHeader', () => {
  it('produces a deterministic header for fixed nonce + timestamp', () => {
    const header = buildOAuthHeader(
      'POST',
      'https://api.x.com/2/tweets',
      CREDS,
      { nonce: 'fixed-nonce', timestampSec: 1780000000 },
    );
    expect(header).toContain('OAuth ');
    expect(header).toContain('oauth_consumer_key="consumer-key"');
    expect(header).toContain('oauth_token="access-token"');
    expect(header).toContain('oauth_signature_method="HMAC-SHA1"');
    expect(header).toContain('oauth_timestamp="1780000000"');
    expect(header).toContain('oauth_nonce="fixed-nonce"');
    // Signature is deterministic given fixed inputs — pin determinism so
    // any signing-logic regression fails loudly.
    expect(header).toMatch(/oauth_signature="[A-Za-z0-9%]+"/);
    const again = buildOAuthHeader('POST', 'https://api.x.com/2/tweets', CREDS, {
      nonce: 'fixed-nonce',
      timestampSec: 1780000000,
    });
    expect(again).toBe(header);
  });
});

describe('postTweet', () => {
  it('returns the tweet id on 201', async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ data: { id: '1234567890', text: 'hello' } }), { status: 201 }),
    );
    const result = await postTweet('hello', CREDS, fetchFn);
    expect(result).toEqual({ ok: true, id: '1234567890' });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.x.com/2/tweets');
    expect((init!.headers as Record<string, string>)['Authorization']).toContain('OAuth ');
    expect(init!.body).toBe(JSON.stringify({ text: 'hello' }));
  });

  it('returns the response body as error on non-2xx', async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ title: 'Unauthorized' }), { status: 401 }),
    );
    const result = await postTweet('hello', CREDS, fetchFn);
    expect(result).toEqual({ ok: false, status: 401, error: '{"title":"Unauthorized"}' });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm -F scanner test -- x-client` → FAIL (module not found).

- [ ] **Step 3: Implement** `x-client.ts`:

```typescript
/**
 * Minimal X API v2 client — create-tweet only. ADR 0026.
 *
 * OAuth 1.0a user-context signing is hand-rolled with node:crypto:
 * the official SDK is unmaintained and the signing surface we need is
 * ~50 lines (anti-waste rule 1 considered; no maintained wizard exists
 * for this). Spec: https://developer.x.com/en/docs/authentication/oauth-1-0a
 *
 * Read response BODIES on failure, not just status (anti-waste rule 3).
 */

import { createHmac, randomBytes } from 'node:crypto';

export interface XCredentials {
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export type PostTweetResult =
  | { ok: true; id: string }
  | { ok: false; status: number; error: string };

/** RFC 3986 percent-encoding (encodeURIComponent misses !'()*). */
function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export interface OAuthOverrides {
  nonce?: string;
  timestampSec?: number;
}

export function buildOAuthHeader(
  method: 'POST' | 'GET',
  url: string,
  creds: XCredentials,
  overrides: OAuthOverrides = {},
): string {
  const params: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: overrides.nonce ?? randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(overrides.timestampSec ?? Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  };
  // JSON-body requests contribute no body params to the signature base.
  const paramString = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k]!)}`)
    .join('&');
  const base = [method, rfc3986(url), rfc3986(paramString)].join('&');
  const signingKey = `${rfc3986(creds.apiKeySecret)}&${rfc3986(creds.accessTokenSecret)}`;
  const signature = createHmac('sha1', signingKey).update(base).digest('base64');
  const all = { ...params, oauth_signature: signature };
  return (
    'OAuth ' +
    Object.keys(all)
      .sort()
      .map((k) => `${rfc3986(k)}="${rfc3986(all[k]!)}"`)
      .join(', ')
  );
}

export async function postTweet(
  text: string,
  creds: XCredentials,
  fetchFn: typeof fetch = fetch,
): Promise<PostTweetResult> {
  const url = 'https://api.x.com/2/tweets';
  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      Authorization: buildOAuthHeader('POST', url, creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  const bodyText = await res.text();
  if (res.status === 201) {
    const parsed = JSON.parse(bodyText) as { data?: { id?: string } };
    return { ok: true, id: parsed.data?.id ?? '' };
  }
  return { ok: false, status: res.status, error: bodyText };
}

export function readXCredentials(env: NodeJS.ProcessEnv = process.env): XCredentials | null {
  const { X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = env;
  if (!X_API_KEY || !X_API_KEY_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) return null;
  return {
    apiKey: X_API_KEY,
    apiKeySecret: X_API_KEY_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessTokenSecret: X_ACCESS_TOKEN_SECRET,
  };
}
```

- [ ] **Step 4: Run tests** — `pnpm -F scanner test -- x-client` → PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/scanner/src/lib/social && git commit -m "feat(scanner): minimal X v2 client with OAuth 1.0a signing"
```

---

### Task 5: Social queue lib + `POST /api/cron/social-post`

**Files:**
- Create: `apps/scanner/src/lib/social/queue.ts`
- Test: `apps/scanner/src/lib/social/queue.test.ts`
- Create: `apps/scanner/src/app/api/cron/social-post/route.ts`

- [ ] **Step 1: Failing tests** — `queue.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { runSocialPostBatch, type SocialQueuePrisma, type Poster } from './queue';

interface Row {
  id: string; channel: string; body: string; status: string;
  scheduledAt: Date; postedAt: Date | null; externalId: string | null; errorMessage: string | null;
}

function makeFakePrisma(rows: Row[]): SocialQueuePrisma {
  return {
    socialPost: {
      findMany: async ({ where, orderBy: _o, take }) =>
        rows
          .filter((r) => r.status === where.status && r.scheduledAt <= where.scheduledAt.lte)
          .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
          .slice(0, take),
      update: async ({ where, data }) => {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
    },
  };
}

const NOW = new Date('2026-06-10T10:00:00Z');

function row(id: string, scheduledAt: Date, status = 'queued'): Row {
  return { id, channel: 'x', body: `post ${id}`, status, scheduledAt, postedAt: null, externalId: null, errorMessage: null };
}

describe('runSocialPostBatch', () => {
  it('posts due rows oldest-first and marks them posted', async () => {
    const rows = [row('a', new Date('2026-06-09T09:00:00Z')), row('b', new Date('2026-06-10T09:00:00Z')), row('c', new Date('2026-06-11T09:00:00Z'))];
    const posted: string[] = [];
    const poster: Poster = async (text) => { posted.push(text); return { ok: true, id: `x-${posted.length}` }; };
    const result = await runSocialPostBatch(makeFakePrisma(rows), poster, NOW);
    expect(posted).toEqual(['post a', 'post b']); // c not due
    expect(result).toEqual({ attempted: 2, posted: 2, failed: 0 });
    expect(rows[0]!.status).toBe('posted');
    expect(rows[0]!.externalId).toBe('x-1');
    expect(rows[2]!.status).toBe('queued');
  });

  it('marks failures with the error body and continues', async () => {
    const rows = [row('a', new Date('2026-06-09T09:00:00Z')), row('b', new Date('2026-06-09T10:00:00Z'))];
    const poster: Poster = async (text) =>
      text === 'post a' ? { ok: false, status: 429, error: 'rate limited' } : { ok: true, id: 'x-ok' };
    const result = await runSocialPostBatch(makeFakePrisma(rows), poster, NOW);
    expect(result).toEqual({ attempted: 2, posted: 1, failed: 1 });
    expect(rows[0]!.status).toBe('failed');
    expect(rows[0]!.errorMessage).toBe('429: rate limited');
    expect(rows[1]!.status).toBe('posted');
  });

  it('does nothing when queue is empty', async () => {
    const result = await runSocialPostBatch(makeFakePrisma([]), async () => ({ ok: true, id: 'x' }), NOW);
    expect(result).toEqual({ attempted: 0, posted: 0, failed: 0 });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm -F scanner test -- social/queue` → FAIL.

- [ ] **Step 3: Implement** `queue.ts`:

```typescript
/**
 * SocialPost queue consumer — ADR 0026. Picks due queued rows (≤3 per
 * run; cadence is 2–3/week so this is purely defensive), posts via the
 * injected poster, marks posted/failed. Failed rows are terminal until
 * the weekly agent re-queues — no auto-retry, no silent loops.
 */

import { prisma } from '../db';
import type { PostTweetResult } from './x-client';

const MAX_PER_RUN = 3;

export type Poster = (text: string) => Promise<PostTweetResult>;

export interface SocialQueuePrisma {
  socialPost: {
    findMany(args: {
      where: { status: string; scheduledAt: { lte: Date } };
      orderBy: { scheduledAt: 'asc' };
      take: number;
    }): Promise<Array<{ id: string; body: string }>>;
    update(args: {
      where: { id: string };
      data:
        | { status: 'posted'; postedAt: Date; externalId: string }
        | { status: 'failed'; errorMessage: string };
    }): Promise<unknown>;
  };
}

export interface SocialBatchResult {
  attempted: number;
  posted: number;
  failed: number;
}

export async function runSocialPostBatch(
  client: SocialQueuePrisma = prisma,
  poster: Poster,
  now: Date = new Date(),
): Promise<SocialBatchResult> {
  const due = await client.socialPost.findMany({
    where: { status: 'queued', scheduledAt: { lte: now } },
    orderBy: { scheduledAt: 'asc' },
    take: MAX_PER_RUN,
  });
  let posted = 0;
  let failed = 0;
  for (const post of due) {
    const result = await poster(post.body);
    if (result.ok) {
      await client.socialPost.update({
        where: { id: post.id },
        data: { status: 'posted', postedAt: now, externalId: result.id },
      });
      posted++;
    } else {
      await client.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed', errorMessage: `${result.status}: ${result.error}`.slice(0, 2000) },
      });
      failed++;
    }
  }
  return { attempted: due.length, posted, failed };
}
```

- [ ] **Step 4: Run tests** — `pnpm -F scanner test -- social/queue` → PASS (3 tests).

- [ ] **Step 5: Cron route** — `route.ts` (mirrors `api/cron/outreach-initial/route.ts`):

```typescript
/**
 * Posts due SocialPost rows to X — ADR 0026. Invoked by Coolify cron
 * (hourly) with the x-cron-secret header, same contract as the other
 * cron routes. Missing X credentials is a soft state, not an error:
 * the queue holds and the daily brief tells the operator to finish
 * the one-time key setup.
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron-auth';
import { runSocialPostBatch } from '@/lib/social/queue';
import { postTweet, readXCredentials } from '@/lib/social/x-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function POST(): Promise<NextResponse> {
  const hdrs = await headers();
  const authError = verifyCronSecret(hdrs.get('x-cron-secret'));
  if (authError) return authError;

  try {
    const creds = readXCredentials();
    if (!creds) {
      return NextResponse.json(
        { event: 'social-post-cron', skipped: 'x-credentials-missing' },
        { status: 200 },
      );
    }
    const result = await runSocialPostBatch(undefined, (text) => postTweet(text, creds));
    return NextResponse.json({ event: 'social-post-cron', ...result }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        event: 'social-post-cron-failed',
        code: 'internal-error',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    );
  }
}
```

Note: `runSocialPostBatch(undefined, …)` — TypeScript default params substitute `prisma` for an explicit `undefined` first argument; no signature change needed.

- [ ] **Step 6: Lint + typecheck + full tests + commit**

```bash
pnpm -F scanner lint && pnpm -F scanner typecheck && pnpm -F scanner test
git add apps/scanner/src/lib/social apps/scanner/src/app/api/cron/social-post
git commit -m "feat(scanner): social-post queue consumer + cron route"
```

---

### Task 6: Agent-facing scripts (queue posts, stage outreach batch)

**Files:**
- Create: `apps/scanner/scripts/queue-social-posts.ts`
- Create: `apps/scanner/scripts/stage-outreach-batch.ts`
- Modify: `apps/scanner/package.json` (two script entries)

These are tsx scripts the weekly agent runs; the lexical ban check is a second net behind the agent's in-session voice gates.

- [ ] **Step 1: `queue-social-posts.ts`**

```typescript
/**
 * Insert agent-drafted X posts into the SocialPost queue — ADR 0026.
 *
 * Usage: pnpm -F scanner social:queue -- path/to/posts.json
 * JSON shape: [{ "body": "...", "utmCampaign": "kebab-slug",
 *               "scheduledAt": "2026-06-11T10:00:00Z", "altText": null }]
 *
 * Refuses any body containing a banned phrase (memory/VOICE.md — this
 * list mirrors lib/daily-brief/compose.ts) or exceeding 280 chars.
 */

import { readFileSync } from 'node:fs';
import { prisma } from '../src/lib/db';

const BANNED = [
  'leverage', 'unlock', 'transform', 'synergy', 'supercharge', 'world-class',
  'industry-leading', 'ai-powered', 'best-in-class', 'ai-driven', 'game-changing',
  'revolutionary', 'disruptive', 'next-generation', 'guaranteed', 'bulletproof',
  'trusted by',
];

interface PostInput {
  body: string;
  utmCampaign: string;
  scheduledAt: string;
  altText?: string | null;
}

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) throw new Error('usage: social:queue -- <posts.json>');
  const posts = JSON.parse(readFileSync(path, 'utf8')) as PostInput[];
  if (!Array.isArray(posts) || posts.length === 0) throw new Error('posts.json must be a non-empty array');

  for (const p of posts) {
    if (p.body.length > 280) throw new Error(`post exceeds 280 chars: ${p.body.slice(0, 60)}…`);
    const lower = p.body.toLowerCase();
    const hit = BANNED.find((b) => lower.includes(b));
    if (hit) throw new Error(`banned phrase "${hit}" in: ${p.body.slice(0, 60)}…`);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(p.scheduledAt)) throw new Error(`scheduledAt must be ISO: ${p.scheduledAt}`);
  }

  for (const p of posts) {
    const created = await prisma.socialPost.create({
      data: {
        channel: 'x',
        body: p.body,
        altText: p.altText ?? null,
        utmCampaign: p.utmCampaign,
        scheduledAt: new Date(p.scheduledAt),
      },
    });
    console.log(`queued ${created.id} for ${p.scheduledAt}: ${p.body.slice(0, 60)}…`);
  }
  console.log(`done — ${posts.length} queued`);
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: `stage-outreach-batch.ts`**

```typescript
/**
 * Stage an outreach batch for operator approval — ADR 0026.
 *
 * Flips up to N 'enriched' targets (oldest first, send-eligible data
 * guards) to 'ready_for_approval' under a fresh batchId, then prints
 * the batchId + approve URL. The daily brief re-surfaces the approve
 * link every day until clicked.
 *
 * Usage: pnpm -F scanner outreach:stage -- 20
 */

import { prisma } from '../src/lib/db';
import { OUTREACH_STATUS } from '../src/lib/outreach/db';
import { buildApproveUrl } from '../src/lib/outreach/approval';

async function main(): Promise<void> {
  const limit = Number(process.argv[2] ?? '20');
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) throw new Error('limit must be 1–30');

  const candidates = await prisma.outreachTarget.findMany({
    where: {
      status: OUTREACH_STATUS.enriched,
      recipientEmail: { not: null },
      score: { not: null },
      grade: { not: null },
      productCount: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, shopDomain: true },
  });
  if (candidates.length === 0) {
    console.log('no enriched targets available — run discovery/enrichment first');
    return;
  }

  const batchId = `batch-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
  await prisma.outreachTarget.updateMany({
    where: { id: { in: candidates.map((c) => c.id) } },
    data: { status: OUTREACH_STATUS.readyForApproval, batchId },
  });

  const secret = process.env.ADMIN_SESSION_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://audit.flintmere.com';
  console.log(`staged ${candidates.length} targets under ${batchId}`);
  for (const c of candidates) console.log(`  - ${c.shopDomain}`);
  if (secret) console.log(`approve URL: ${buildApproveUrl(batchId, secret, baseUrl)}`);
  else console.log('(ADMIN_SESSION_SECRET unset locally — approve link will appear in the daily brief)');
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Register in `apps/scanner/package.json` scripts** (alphabetical with the others):

```json
    "social:queue": "tsx scripts/queue-social-posts.ts",
    "outreach:stage": "tsx scripts/stage-outreach-batch.ts",
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm -F scanner typecheck
git add apps/scanner/scripts apps/scanner/package.json
git commit -m "feat(scanner): agent scripts — queue social posts, stage outreach batch"
```

---

### Task 7: Daily brief rewrite — pipeline report instead of dead cadence

**Files:**
- Modify: `apps/scanner/src/lib/daily-brief/types.ts`
- Modify: `apps/scanner/src/lib/daily-brief/state.ts`
- Modify: `apps/scanner/src/lib/daily-brief/compose.ts`
- Modify: `apps/scanner/src/lib/daily-brief/email.ts` (deterministic needs-you section)
- Create: `apps/scanner/src/lib/daily-brief/posthog-rollup.ts`
- Delete: `apps/scanner/src/lib/daily-brief/cadence-snapshot.ts`, `apps/scanner/scripts/sync-cadence.ts`, the `"sync-cadence"` package.json entry
- Modify: `apps/scanner/src/lib/daily-brief/daily-brief.test.ts` + `apps/scanner/src/app/api/cron/daily-brief/route.ts` (state fields)

This is the largest task. Sequence: types → collectors → compose prompt → email section → delete cadence → fix route + tests.

- [ ] **Step 1: Extend `types.ts`** — replace the cadence fields on `BriefState` and add the pipeline snapshot:

```typescript
export interface SocialSnapshot {
  /** Posted in the last 24h: body excerpt + external id. */
  postedLast24h: Array<{ body: string; externalId: string | null }>;
  /** Queued for the next 7 days. */
  queuedNext7d: Array<{ body: string; scheduledAt: Date }>;
  /** Failed, unresolved (status='failed'). Always surfaced. */
  failed: Array<{ body: string; errorMessage: string | null }>;
  /** True when X env credentials are absent — operator setup pending. */
  xCredentialsMissing: boolean;
  /** Newest SocialPost.createdAt — heartbeat proxy for the weekly agent
   *  (it inserts posts every run). Null = agent has never run. */
  lastAgentInsertAt: Date | null;
}

export interface ApprovalSnapshot {
  /** Batches with targets still in ready_for_approval. */
  pending: Array<{ batchId: string; count: number; oldestStagedAt: Date; approveUrl: string | null }>;
}

export interface PosthogRollup {
  visitors7d: number;
  scans7d: number;
  /** False when the Query API call fails — surfaced in warnings. */
  available: boolean;
}
```

In `BriefState`: delete `cadenceContent`, `cadenceSource`, `cadenceSnapshotAt`, `playbookContent`; add:

```typescript
  social: SocialSnapshot;
  approvals: ApprovalSnapshot;
  /** Monday only; null other days. */
  posthog: PosthogRollup | null;
```

(Playbook read retires with the cadence — the brief is now a report, not a task relay. If the operator playbook returns later it can be re-added deliberately.)

- [ ] **Step 2: PostHog rollup** — `posthog-rollup.ts`:

```typescript
/**
 * Monday metrics rollup via the PostHog Query API (EU, project 195011 —
 * ADR 0025). Uses the same env vars the /admin/health signal uses:
 * POSTHOG_PERSONAL_API_KEY (secret) + POSTHOG_PROJECT_ID.
 */

import type { PosthogRollup } from './types';

export async function fetchPosthogRollup(
  fetchFn: typeof fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
): Promise<PosthogRollup> {
  const key = env.POSTHOG_PERSONAL_API_KEY;
  const project = env.POSTHOG_PROJECT_ID;
  if (!key || !project) return { visitors7d: 0, scans7d: 0, available: false };
  try {
    const query = async (hogql: string): Promise<number> => {
      const res = await fetchFn(`https://eu.posthog.com/api/projects/${project}/query/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
      });
      if (!res.ok) throw new Error(`posthog query ${res.status}: ${await res.text()}`);
      const json = (await res.json()) as { results?: unknown[][] };
      return Number(json.results?.[0]?.[0] ?? 0);
    };
    const [visitors7d, scans7d] = await Promise.all([
      query("select count(distinct person_id) from events where timestamp > now() - interval 7 day and event = '$pageview'"),
      query("select count() from events where timestamp > now() - interval 7 day and event = 'scan_completed'"),
    ]);
    return { visitors7d, scans7d, available: true };
  } catch {
    return { visitors7d: 0, scans7d: 0, available: false };
  }
}
```

**Implementer note:** confirm the scan-completion event name against `src/lib/analytics.ts` on main (PR #59 defined the event taxonomy). Substitute the actual name if it differs from `scan_completed`.

- [ ] **Step 3: Rewrite collectors in `state.ts`** — delete the cadence import, `readPlaybook`, `findRepoRoot`, `PLAYBOOK_PATH_FROM_ROOT`; add (alongside the existing `snapshotOutreach`, same `Promise.allSettled` + warnings pattern):

```typescript
async function snapshotSocial(now: Date): Promise<SocialSnapshot> {
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [posted, queued, failed, newest] = await Promise.all([
    prisma.socialPost.findMany({
      where: { status: 'posted', postedAt: { gte: dayAgo } },
      select: { body: true, externalId: true },
    }),
    prisma.socialPost.findMany({
      where: { status: 'queued', scheduledAt: { lte: week } },
      orderBy: { scheduledAt: 'asc' },
      select: { body: true, scheduledAt: true },
    }),
    prisma.socialPost.findMany({
      where: { status: 'failed' },
      select: { body: true, errorMessage: true },
    }),
    prisma.socialPost.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ]);
  return {
    postedLast24h: posted,
    queuedNext7d: queued,
    failed,
    xCredentialsMissing: !process.env.X_API_KEY,
    lastAgentInsertAt: newest?.createdAt ?? null,
  };
}

async function snapshotApprovals(): Promise<ApprovalSnapshot> {
  const groups = await prisma.outreachTarget.groupBy({
    by: ['batchId'],
    where: { status: OUTREACH_STATUS.readyForApproval, batchId: { not: null } },
    _count: { _all: true },
    _min: { updatedAt: true },
  });
  const secret = process.env.ADMIN_SESSION_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://audit.flintmere.com';
  return {
    pending: groups.map((g) => ({
      batchId: g.batchId!,
      count: g._count._all,
      oldestStagedAt: g._min.updatedAt ?? new Date(0),
      approveUrl: secret ? buildApproveUrl(g.batchId!, secret, baseUrl) : null,
    })),
  };
}
```

Wire into `collectBriefState` via the existing `Promise.allSettled` pattern (each rejection appends a warning, returns an empty snapshot). Monday gate for PostHog: `const isMonday = formatLondonWeekday(now) === 'Mon';` → `posthog: isMonday ? await fetchPosthogRollup() : null` (also via allSettled; on rejection set `posthog: { visitors7d: 0, scans7d: 0, available: false }` + warning).

- [ ] **Step 4: Rewrite the compose prompt** in `compose.ts`. Keep the voice/banned-phrase/British blocks verbatim. Replace the "Source material" block and the cadence task-extraction instruction with:

```
Source material (in priority order):
  1. Live pipeline state (social queue, outreach approvals, PostHog) —
     authoritative for what HAPPENED and what's SCHEDULED.
  2. The operator does NOT execute marketing tasks. Agents draft, the
     app publishes. Mention an operator action ONLY when state demands
     a human: a pending approve link, a failed X post, missing X
     credentials, a stale agent heartbeat.

Report shape: lead with what shipped since yesterday, then what's
scheduled next, then (only if any) the needs-you list. If nothing
needs the operator, say so in one line — that is the normal, good case.
```

Rewrite `buildUserPrompt(state)` to serialise the new state (posted/queued/failed posts, pending approval batches with counts + URLs, outreach counters, Monday PostHog block, warnings). Delete the playbook/cadence blocks. Update `fallbackBrief` to emit the deterministic report from state (posted/queued/failed lists + approve URLs + outreach counters) — there is no cadence content to fall back to any more.

- [ ] **Step 5: Deterministic needs-you footer** in `email.ts` — alongside the existing prepended health check, append after the LLM body:

```typescript
function renderPipelineFooter(state: BriefState): string {
  const lines: string[] = [];
  for (const b of state.approvals.pending) {
    const link = b.approveUrl ? ` — approve: ${b.approveUrl}` : '';
    lines.push(`- [ approve ] ${b.count} outreach emails (${b.batchId})${link}`);
  }
  for (const f of state.social.failed) {
    lines.push(`- [ failed ] X post "${f.body.slice(0, 50)}…" — ${f.errorMessage ?? 'unknown'}`);
  }
  if (state.social.xCredentialsMissing && state.social.queuedNext7d.length > 0) {
    lines.push('- [ setup ] X API keys missing — posts are queued but cannot publish. developer.x.com → create app on @flintmere_ → 4 keys → Coolify env (X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET) → redeploy.');
  }
  const heartbeat = state.social.lastAgentInsertAt;
  const eightDays = 8 * 24 * 60 * 60 * 1000;
  if (heartbeat && Date.now() - heartbeat.getTime() > eightDays) {
    lines.push(`- [ stale ] weekly content agent last ran ${heartbeat.toISOString().slice(0, 10)} — check the scheduled routine.`);
  }
  if (lines.length === 0) return '';
  return ['', '---', '', '## Needs you', '', ...lines].join('\n');
}
```

Concatenate into both `renderHtml` and `renderText` inputs (same place the health check is prepended).

- [ ] **Step 6: Delete the cadence machinery**

```bash
git rm apps/scanner/src/lib/daily-brief/cadence-snapshot.ts apps/scanner/scripts/sync-cadence.ts
```
Remove `"sync-cadence"` from package.json scripts. Fix `daily-brief/route.ts:49-62` if it references removed state fields.

- [ ] **Step 7: Update tests** — `daily-brief.test.ts`: replace cadence-based `BriefState` fixtures with the new shape (empty `social`/`approvals` snapshots + `posthog: null` for existing rendering tests). Add new tests:

```typescript
it('footer lists pending approval batch with link', () => {
  const state = baseState({
    approvals: { pending: [{ batchId: 'b1', count: 20, oldestStagedAt: new Date(), approveUrl: 'https://audit.flintmere.com/api/approve?token=t' }] },
  });
  const text = renderText(brief, state);
  expect(text).toContain('[ approve ] 20 outreach emails (b1)');
  expect(text).toContain('/api/approve?token=t');
});

it('footer absent when nothing needs the operator', () => {
  const text = renderText(brief, baseState({}));
  expect(text).not.toContain('Needs you');
});

it('footer flags missing X credentials only when posts are queued', () => {
  const state = baseState({
    social: { ...emptySocial(), xCredentialsMissing: true, queuedNext7d: [{ body: 'p', scheduledAt: new Date() }] },
  });
  expect(renderText(brief, state)).toContain('[ setup ] X API keys missing');
});
```

(`baseState`/`emptySocial` are small local fixture helpers — define them in the test file: `emptySocial()` returns all-empty arrays + `xCredentialsMissing: false` + `lastAgentInsertAt: null`; `baseState(overrides)` merges onto a minimal valid `BriefState`.)

- [ ] **Step 8: Full suite + commit**

```bash
pnpm -F scanner lint && pnpm -F scanner typecheck && pnpm -F scanner test
git add -A apps/scanner && git commit -m "feat(scanner): daily brief reports live pipeline state; cadence snapshot retired"
```

---

### Task 8: ADR 0026 + runbook supersession

**Files:**
- Create: `projects/flintmere/decisions/0026-marketing-automation-pipeline.md`
- Modify: `projects/flintmere/plans/2026-05-11-marketing-launch-and-cadence.md` (frontmatter `status: live…` → `status: superseded by 2026-06-06-marketing-automation-spec.md (ADR 0026)`)

- [ ] **Step 1: Write ADR 0026** following the 0023 header convention (Status / Date / Layers on / Independent of / Source / Affects). Status: Accepted. Date: 2026-06-06. Layers on: ADR 0025 (PostHog — Monday rollup), the 2026-05-11 runbook (superseded), `memory/marketing/outreach.md` (PECR gates preserved). Source: operator session 2026-06-06 — *"why are these tasks not automated and looped over … a proper plan for marketing this site that does not entail me doing manual tasks."* Decision content: the four spec decisions (§2 of the spec), the approve-link legal-gate mechanism, X API adoption for @flintmere_, LinkedIn deferral with re-entry trigger (company page becomes creatable). Affects: list the files created in Tasks 1–7. Canon pre-flight sources: `memory/marketing/outreach.md`, `memory/VOICE.md`, `apps/scanner/src/lib/audit-pricing.ts`.

- [ ] **Step 2: Commit**

```bash
git add projects/flintmere && git commit -m "docs(adr): 0026 — marketing automation pipeline; runbook superseded"
```

---

### Task 9: Verify, PR, deploy notes

- [ ] **Step 1: Full local gate**

```bash
pnpm -F scanner lint && pnpm -F scanner typecheck && pnpm -F scanner test && pnpm -F scanner build
```
Expected: all green. Build needs the `.env` files copied in Task 0.

- [ ] **Step 2: Push + PR**

```bash
git push -u origin feat/marketing-automation
gh pr create --title "feat: marketing automation pipeline (ADR 0026)" --body "$(cat <<'EOF'
Implements projects/flintmere/plans/2026-06-06-marketing-automation-spec.md.

- SocialPost queue + /api/cron/social-post (X API v2, OAuth 1.0a, no new deps)
- Outreach batch approval: ready_for_approval status + HMAC one-click /api/approve
- Daily brief rewritten: live pipeline report + needs-you footer; cadence snapshot retired
- Agent scripts: social:queue, outreach:stage
- ADR 0026; 2026-05-11 runbook superseded

Operator post-merge: Coolify env (4 X keys when ready), add hourly Coolify cron for /api/cron/social-post (x-cron-secret, same as existing crons), redeploy.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Post-merge deployment checklist** (operator/agent):
  1. Coolify: add scheduled task `POST https://audit.flintmere.com/api/cron/social-post` hourly with header `x-cron-secret: $CRON_SECRET` (mirror the outreach cron config).
  2. Redeploy scanner.
  3. Verify: next morning's daily brief shows the pipeline report shape (and the `[ setup ]` X-keys line if keys not yet added).

---

### Task 10: Weekly content-agent routine (after Task 9 deploys)

**Files:** none in-repo (Claude Code scheduled routine via `/schedule`)

- [ ] **Step 1: Create the routine** — `/schedule` a weekly agent, Tue 09:00 Europe/London, repo `/Users/abuaa/Projects/Flintmere`, with this prompt:

```
Weekly Flintmere marketing run (ADR 0026, spec: projects/flintmere/plans/2026-06-06-marketing-automation-spec.md).

1. git fetch && create a fresh branch from origin/main.
2. EVERY WEEK — X posts: invoke /social (target=x) to draft 2–3 posts on the
   seven narrative anchors (memory/marketing/content-history.md), real numbers
   only, prices from apps/scanner/src/lib/audit-pricing.ts, UTM
   ?utm_source=x&utm_medium=organic&utm_campaign=<slug>. Self-check against
   memory/VOICE.md bans. Write JSON and run:
   pnpm -F scanner social:queue -- <file>   (scheduledAt spread Tue/Thu/Sat 10:00 BST)
3. ALTERNATE FORTNIGHTS:
   - Week A — blog: /seo brief from memory/marketing/seo.md clusters → /writer
     → /claim-review → /canon-audit → land via /web-implementation → append
     memory/marketing/content-history.md → PR. Run lint+typecheck+test; if green,
     merge the PR (squash). Queue one cross-promo X post for publish day.
   - Week B — outreach: ensure ≥20 enriched targets exist (run discovery/enrich
     scripts if needed, public sources only per memory/marketing/outreach.md),
     then: pnpm -F scanner outreach:stage -- 20
     Append the batch intent to memory/marketing/outreach.md in the PR.
4. Log a one-line run summary; failures must be stated plainly — the daily
   brief flags a stale heartbeat if SocialPost inserts stop.
Fortnight parity: blog on ISO-even weeks, outreach on ISO-odd weeks.
```

- [ ] **Step 2: First-run supervision** — run the routine once manually (`/schedule` run-now) and review its drafts before letting the cron cadence take over.

---

## Self-review (done at authoring time)

- **Spec coverage:** §4 data model → Task 1; §5.1 → Tasks 4–5; §5.2 → Tasks 2–3; §5.3 → Task 7; §6 → Tasks 6+10; §7 → Task 9 step 3 + email footer; §8 failure table → Tasks 5/7; §9 testing → in-task TDD; §12 → Task 8. LinkedIn deferral needs no code.
- **Deviations from spec (intentional):** approval flips status to `queued` instead of changing the send predicate (simpler, reuses cap/eligibility untouched); agent heartbeat derived from `SocialPost.createdAt` (no new table); playbook read retired with the cadence.
- **Type consistency:** `ApprovalPrisma`/`SocialQueuePrisma` narrow interfaces match call sites; `OUTREACH_STATUS.readyForApproval` used in lib code everywhere (raw string only in test fixtures).
