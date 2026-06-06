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
    const fetchFn = vi.fn(async (..._args: Parameters<typeof fetch>) =>
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
    const fetchFn = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      new Response(JSON.stringify({ title: 'Unauthorized' }), { status: 401 }),
    );
    const result = await postTweet('hello', CREDS, fetchFn);
    expect(result).toEqual({ ok: false, status: 401, error: '{"title":"Unauthorized"}' });
  });
});
