/**
 * POST /api/secret — store a client-side-encrypted one-time secret.
 *
 * Body: {
 *   ciphertext: string  (base64; ≤ 10 KB raw bytes)
 *   iv:         string  (base64; exactly 12 bytes — AES-GCM 96-bit IV)
 *   authTag:    string  (base64; exactly 16 bytes — AES-GCM 128-bit tag)
 * }
 * Returns: { ok: true, id, expiresAt }
 *
 * Zero-knowledge contract: the encryption key never reaches the server.
 * The browser generates it locally, encrypts the secret, sends the
 * ciphertext, and embeds the key in the URL fragment for the recipient.
 * The fragment is never sent in HTTP requests by design (RFC 3986 §3.5),
 * so the server never sees, logs, or stores the key. A DB dump or
 * compromised env reveals only ciphertext.
 *
 * Burn-on-read happens at POST /api/secret/[id]/consume, not on this
 * endpoint. Per-IP token bucket (10 burst, 1/min sustained) protects
 * the public endpoint from being used to spam the DB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashIp } from '@/lib/hash';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CIPHERTEXT_BYTES = 10_000;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const TTL_HOURS = 24;

const BodySchema = z.object({
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  authTag: z.string().min(1),
});

interface Bucket {
  tokens: number;
  updatedAt: number;
}
const buckets = new Map<string, Bucket>();
const POLICY = { capacity: 10, refillRate: 1 / 60 };

function checkLimit(ip: string | null, now: number): boolean {
  const key = (ip && hashIp(ip)) || 'anon';
  const b = buckets.get(key) ?? { tokens: POLICY.capacity, updatedAt: now };
  const elapsedSec = Math.max(0, (now - b.updatedAt) / 1000);
  b.tokens = Math.min(POLICY.capacity, b.tokens + elapsedSec * POLICY.refillRate);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return req.headers.get('x-real-ip');
}

function decodeBase64(value: unknown, expectedBytes?: number): Buffer | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  let buf: Buffer;
  try {
    buf = Buffer.from(value, 'base64');
  } catch {
    return null;
  }
  // Buffer.from with invalid base64 returns silently-truncated bytes;
  // round-trip check filters those.
  if (buf.toString('base64').replace(/=+$/, '') !== value.replace(/=+$/, '')) {
    return null;
  }
  if (expectedBytes !== undefined && buf.length !== expectedBytes) return null;
  return buf;
}

export async function POST(req: NextRequest) {
  if (!checkLimit(getClientIp(req), Date.now())) {
    return NextResponse.json(
      { ok: false, code: 'rate-limited' },
      { status: 429 },
    );
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, code: 'invalid-body' }, { status: 400 });
  }

  const ciphertext = decodeBase64(parsed.ciphertext);
  const iv = decodeBase64(parsed.iv, IV_BYTES);
  const authTag = decodeBase64(parsed.authTag, AUTH_TAG_BYTES);

  if (!ciphertext || !iv || !authTag) {
    return NextResponse.json(
      { ok: false, code: 'invalid-payload' },
      { status: 400 },
    );
  }

  if (ciphertext.length === 0) {
    return NextResponse.json({ ok: false, code: 'empty' }, { status: 400 });
  }
  if (ciphertext.length > MAX_CIPHERTEXT_BYTES) {
    return NextResponse.json({ ok: false, code: 'too-large' }, { status: 413 });
  }

  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  const row = await prisma.oneTimeSecret.create({
    data: {
      ciphertext,
      iv,
      authTag,
      expiresAt,
    },
  });

  return NextResponse.json({
    ok: true,
    id: row.id,
    expiresAt: expiresAt.toISOString(),
  });
}
