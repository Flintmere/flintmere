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
  const all: Record<string, string> = { ...params, oauth_signature: signature };
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
