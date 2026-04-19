import { beforeEach, describe, expect, it } from 'vitest';
import { signUnsubToken, verifyUnsubToken } from './unsub-token';

describe('unsub-token', () => {
  beforeEach(() => {
    process.env.UNSUBSCRIBE_SECRET = 'test-secret';
  });

  it('round-trips a signed token', () => {
    const token = signUnsubToken('lead_123');
    const verified = verifyUnsubToken(token);
    expect(verified?.leadId).toBe('lead_123');
  });

  it('rejects a malformed token', () => {
    expect(verifyUnsubToken('not-a-token')).toBeNull();
    expect(verifyUnsubToken('')).toBeNull();
    expect(verifyUnsubToken(Buffer.from('a.b', 'utf8').toString('base64url'))).toBeNull();
  });

  it('rejects a token with bad signature', () => {
    const token = signUnsubToken('lead_123');
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [leadId, expires] = decoded.split('.');
    const tampered = Buffer.from(
      `${leadId}.${expires}.${'0'.repeat(64)}`,
      'utf8',
    ).toString('base64url');
    expect(verifyUnsubToken(tampered)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = signUnsubToken('lead_123', -1);
    expect(verifyUnsubToken(token)).toBeNull();
  });

  it('fails closed when secret changes', () => {
    const token = signUnsubToken('lead_123');
    process.env.UNSUBSCRIBE_SECRET = 'different-secret';
    expect(verifyUnsubToken(token)).toBeNull();
  });
});
