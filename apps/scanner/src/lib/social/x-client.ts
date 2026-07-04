/**
 * Minimal X API v2 client — create-tweet + carousel media upload. ADR 0026.
 *
 * OAuth 1.0a user-context signing is hand-rolled with node:crypto:
 * the official SDK is unmaintained and the signing surface we need is
 * ~50 lines (anti-waste rule 1 considered; no maintained wizard exists
 * for this). Spec: https://developer.x.com/en/docs/authentication/oauth-1-0a
 *
 * Media goes through the v2 endpoints (v1.1 upload.twitter.com is retired):
 * POST /2/media/upload (multipart; media_category as a form field so the
 * OAuth base string stays oauth_*-only — same signer as JSON bodies), then
 * POST /2/media/metadata for per-image alt text, then media_ids on the tweet.
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

/** One carousel slide: PNG bytes + its alt text (required — accessibility floor). */
export interface TweetImage {
  bytes: Uint8Array;
  alt: string;
}

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

const MEDIA_UPLOAD_URL = 'https://api.x.com/2/media/upload';
const MEDIA_METADATA_URL = 'https://api.x.com/2/media/metadata';

type MediaStepResult =
  | { ok: true; id: string }
  | { ok: false; status: number; error: string };

async function uploadMedia(
  image: TweetImage,
  creds: XCredentials,
  fetchFn: typeof fetch,
): Promise<MediaStepResult> {
  const form = new FormData();
  // slice() copies onto a plain ArrayBuffer — Blob's BlobPart rejects the
  // ArrayBufferLike-backed Uint8Array Prisma hands back (≤950KB, negligible).
  form.append('media', new Blob([image.bytes.slice()], { type: 'image/png' }), 'slide.png');
  // Form field, not query param: multipart bodies contribute nothing to the
  // OAuth signature base, so buildOAuthHeader stays correct unchanged.
  form.append('media_category', 'tweet_image');
  const res = await fetchFn(MEDIA_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: buildOAuthHeader('POST', MEDIA_UPLOAD_URL, creds) },
    body: form,
  });
  const bodyText = await res.text();
  if (!res.ok) return { ok: false, status: res.status, error: bodyText };
  try {
    const parsed = JSON.parse(bodyText) as { data?: { id?: string } };
    if (!parsed.data?.id) return { ok: false, status: res.status, error: bodyText };
    return { ok: true, id: parsed.data.id };
  } catch {
    return { ok: false, status: res.status, error: bodyText };
  }
}

async function setAltText(
  mediaId: string,
  text: string,
  creds: XCredentials,
  fetchFn: typeof fetch,
): Promise<MediaStepResult> {
  const res = await fetchFn(MEDIA_METADATA_URL, {
    method: 'POST',
    headers: {
      Authorization: buildOAuthHeader('POST', MEDIA_METADATA_URL, creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: mediaId, metadata: { alt_text: { text } } }),
  });
  const bodyText = await res.text();
  if (!res.ok) return { ok: false, status: res.status, error: bodyText };
  return { ok: true, id: mediaId };
}

export async function postTweet(
  text: string,
  creds: XCredentials,
  fetchFn: typeof fetch = fetch,
  images: TweetImage[] = [],
): Promise<PostTweetResult> {
  // Upload + alt-tag every slide BEFORE the tweet exists: any failure aborts
  // the whole publish (fail-the-row semantics — no partial carousels, no
  // image without alt). Orphaned uploads expire server-side.
  const mediaIds: string[] = [];
  for (const image of images) {
    const uploaded = await uploadMedia(image, creds, fetchFn);
    if (!uploaded.ok) return uploaded;
    const tagged = await setAltText(uploaded.id, image.alt, creds, fetchFn);
    if (!tagged.ok) return tagged;
    mediaIds.push(uploaded.id);
  }
  const url = 'https://api.x.com/2/tweets';
  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      Authorization: buildOAuthHeader('POST', url, creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      mediaIds.length > 0 ? { text, media: { media_ids: mediaIds } } : { text },
    ),
  });
  const bodyText = await res.text();
  if (res.status === 201) {
    try {
      const parsed = JSON.parse(bodyText) as { data?: { id?: string } };
      return { ok: true, id: parsed.data?.id ?? '' };
    } catch {
      return { ok: false, status: res.status, error: bodyText };
    }
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
