import { describe, expect, it } from 'vitest';
import {
  signUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
} from './unsubscribe';

const SECRET = 'a'.repeat(64); // 64 char hex == 32 bytes; meets ≥32 length floor.

describe('signUnsubscribeToken', () => {
  it('returns a 64-char hex string (sha256)', () => {
    const t = signUnsubscribeToken('target-1', SECRET);
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same target + secret', () => {
    expect(signUnsubscribeToken('target-1', SECRET)).toBe(signUnsubscribeToken('target-1', SECRET));
  });

  it('differs across target IDs', () => {
    expect(signUnsubscribeToken('target-1', SECRET)).not.toBe(
      signUnsubscribeToken('target-2', SECRET),
    );
  });

  it('differs across secrets', () => {
    const other = 'b'.repeat(64);
    expect(signUnsubscribeToken('target-1', SECRET)).not.toBe(
      signUnsubscribeToken('target-1', other),
    );
  });
});

describe('verifyUnsubscribeToken', () => {
  it('accepts a valid token', () => {
    const t = signUnsubscribeToken('target-1', SECRET);
    expect(verifyUnsubscribeToken('target-1', t, SECRET)).toBe(true);
  });

  it('rejects a token signed for a different target (cross-target replay)', () => {
    const t = signUnsubscribeToken('target-1', SECRET);
    expect(verifyUnsubscribeToken('target-2', t, SECRET)).toBe(false);
  });

  it('rejects truncated, padded, or empty tokens', () => {
    const t = signUnsubscribeToken('target-1', SECRET);
    expect(verifyUnsubscribeToken('target-1', '', SECRET)).toBe(false);
    expect(verifyUnsubscribeToken('target-1', t.slice(0, 60), SECRET)).toBe(false);
    expect(verifyUnsubscribeToken('target-1', `${t}0`, SECRET)).toBe(false);
  });

  it('rejects non-hex provided tokens of correct length', () => {
    expect(verifyUnsubscribeToken('target-1', 'z'.repeat(64), SECRET)).toBe(false);
  });
});

describe('buildUnsubscribeUrl', () => {
  it('builds an absolute URL with t and s query params', () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    const url = buildUnsubscribeUrl('target-1', 'https://audit.flintmere.com');
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://audit.flintmere.com');
    expect(parsed.pathname).toBe('/api/outreach/unsubscribe');
    expect(parsed.searchParams.get('t')).toBe('target-1');
    expect(parsed.searchParams.get('s')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('builds an unsubscribe URL with HMAC matching signUnsubscribeToken', () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    const url = buildUnsubscribeUrl('target-1', 'https://audit.flintmere.com');
    const s = new URL(url).searchParams.get('s');
    expect(s).toBe(signUnsubscribeToken('target-1', SECRET));
  });
});
