import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  GMC_AUTH_URL,
  GMC_SCOPES,
  STATE_TTL_MS,
  buildAuthUrl,
  isFeatureEnabled,
  normaliseShopDomain,
  signState,
  verifyState,
} from './oauth';

describe('gmc/oauth — state', () => {
  beforeEach(() => {
    process.env.GMC_STATE_SECRET = 'test-state-secret';
  });

  afterEach(() => {
    delete process.env.GMC_STATE_SECRET;
  });

  it('round-trips a signed state', () => {
    const token = signState({ normalisedDomain: 'acme.com', auditId: 'aud_123' });
    const verified = verifyState(token);
    expect(verified?.normalisedDomain).toBe('acme.com');
    expect(verified?.auditId).toBe('aud_123');
    expect(typeof verified?.issuedAt).toBe('number');
    expect(typeof verified?.nonce).toBe('string');
  });

  it('produces a fresh nonce per sign', () => {
    const a = signState({ normalisedDomain: 'acme.com', auditId: 'aud_123' });
    const b = signState({ normalisedDomain: 'acme.com', auditId: 'aud_123' });
    expect(a).not.toBe(b);
  });

  it('rejects a tampered payload', () => {
    const token = signState({ normalisedDomain: 'acme.com', auditId: 'aud_123' });
    const [payload, sig] = token.split('.');
    const tampered = `${payload}AA.${sig}`;
    expect(verifyState(tampered)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const token = signState({ normalisedDomain: 'acme.com', auditId: 'aud_123' });
    const [payload, sig] = token.split('.');
    const flipped = sig!.slice(0, -2) + (sig!.endsWith('0') ? '01' : '00');
    expect(verifyState(`${payload}.${flipped}`)).toBeNull();
  });

  it('rejects expired state', () => {
    const token = signState(
      { normalisedDomain: 'acme.com', auditId: 'aud_123' },
      Date.now() - STATE_TTL_MS - 1000,
    );
    expect(verifyState(token)).toBeNull();
  });

  it('rejects clock-future state', () => {
    const token = signState(
      { normalisedDomain: 'acme.com', auditId: 'aud_123' },
      Date.now() + 5 * 60 * 1000,
    );
    expect(verifyState(token)).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifyState('')).toBeNull();
    expect(verifyState('no-dot')).toBeNull();
    expect(verifyState('payload.not-hex-z')).toBeNull();
    expect(verifyState('!.deadbeef')).toBeNull();
  });

  it('fails closed when secret rotates', () => {
    const token = signState({ normalisedDomain: 'acme.com', auditId: 'aud_123' });
    process.env.GMC_STATE_SECRET = 'different-secret';
    expect(verifyState(token)).toBeNull();
  });

  it('throws a helpful error when GMC_STATE_SECRET missing', () => {
    delete process.env.GMC_STATE_SECRET;
    expect(() => signState({ normalisedDomain: 'acme.com', auditId: 'aud_123' })).toThrow(
      /GMC_STATE_SECRET missing/,
    );
  });
});

describe('gmc/oauth — buildAuthUrl', () => {
  beforeEach(() => {
    process.env.GMC_STATE_SECRET = 'test-state-secret';
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
  });

  afterEach(() => {
    delete process.env.GMC_STATE_SECRET;
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
  });

  it('produces a Google OAuth URL with all required params', () => {
    const url = buildAuthUrl({
      state: 'state-token',
      redirectUri: 'https://audit.flintmere.com/api/auth/google/callback',
    });
    const parsed = new URL(url);
    expect(`${parsed.origin}${parsed.pathname}`).toBe(GMC_AUTH_URL);
    expect(parsed.searchParams.get('client_id')).toBe(
      'test-client-id.apps.googleusercontent.com',
    );
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      'https://audit.flintmere.com/api/auth/google/callback',
    );
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toBe(GMC_SCOPES.join(' '));
    expect(parsed.searchParams.get('access_type')).toBe('offline');
    expect(parsed.searchParams.get('prompt')).toBe('consent');
    expect(parsed.searchParams.get('state')).toBe('state-token');
  });

  it('throws when client id missing', () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    expect(() => buildAuthUrl({ state: 'x', redirectUri: 'https://x/cb' })).toThrow(
      /GOOGLE_OAUTH_CLIENT_ID missing/,
    );
  });
});

describe('gmc/oauth — scope canon', () => {
  it('declares the canonical Content API read scope', () => {
    expect(GMC_SCOPES).toEqual(['https://www.googleapis.com/auth/content']);
  });
});

describe('gmc/oauth — feature flag', () => {
  afterEach(() => {
    delete process.env.FEATURE_GMC_OAUTH;
  });

  it('defaults to off', () => {
    delete process.env.FEATURE_GMC_OAUTH;
    expect(isFeatureEnabled()).toBe(false);
  });

  it('off when set to anything other than "true"', () => {
    process.env.FEATURE_GMC_OAUTH = '1';
    expect(isFeatureEnabled()).toBe(false);
    process.env.FEATURE_GMC_OAUTH = 'TRUE';
    expect(isFeatureEnabled()).toBe(false);
    process.env.FEATURE_GMC_OAUTH = 'yes';
    expect(isFeatureEnabled()).toBe(false);
  });

  it('on when set to exactly "true"', () => {
    process.env.FEATURE_GMC_OAUTH = 'true';
    expect(isFeatureEnabled()).toBe(true);
  });
});

describe('gmc/oauth — normaliseShopDomain', () => {
  it('strips https + path', () => {
    expect(normaliseShopDomain('https://acme.com/products')).toBe('acme.com');
  });

  it('strips http + path', () => {
    expect(normaliseShopDomain('http://acme.com/foo/bar?q=1')).toBe('acme.com');
  });

  it('strips www', () => {
    expect(normaliseShopDomain('https://www.acme.com')).toBe('acme.com');
  });

  it('lowercases', () => {
    expect(normaliseShopDomain('ACME.com')).toBe('acme.com');
  });

  it('trims whitespace', () => {
    expect(normaliseShopDomain('  acme.com  ')).toBe('acme.com');
  });

  it('handles bare domain', () => {
    expect(normaliseShopDomain('acme.com')).toBe('acme.com');
  });

  it('preserves subdomain other than www', () => {
    expect(normaliseShopDomain('https://shop.acme.com')).toBe('shop.acme.com');
  });
});
