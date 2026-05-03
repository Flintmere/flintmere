/**
 * Cloudflare Turnstile — server-side token verification.
 *
 * Exposed as a single `verifyTurnstile(token, ip)` helper for any public
 * form to wire in. POSTs to the canonical siteverify endpoint with
 * FormData per Cloudflare's reference implementation.
 *
 * Failure modes.
 *   - `TURNSTILE_SECRET_KEY` unset:
 *       In `production` we fail closed (return `{ ok: false }`) and log
 *       loudly. Anywhere else we bypass — the helper returns `{ ok: true }`
 *       so local dev and tests don't have to mock or stub.
 *   - Missing token: hard reject.
 *   - Network / verification error: hard reject with the Cloudflare
 *     error-codes string for log triage.
 *
 * Endpoint contract verified against the public Turnstile docs at
 * developers.cloudflare.com/turnstile (siteverify).
 */

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const VERIFY_TIMEOUT_MS = 5_000;

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export interface TurnstileResult {
  ok: boolean;
  /** Cloudflare error-codes joined by comma, or a synthetic reason string. */
  reason?: string;
}

export async function verifyTurnstile(
  token: string | null | undefined,
  ip: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          event: 'turnstile-misconfigured',
          message:
            'TURNSTILE_SECRET_KEY is unset in production. Failing closed.',
        }),
      );
      return { ok: false, reason: 'misconfigured' };
    }
    return { ok: true };
  }

  if (!token || token.trim().length === 0) {
    return { ok: false, reason: 'missing-token' };
  }

  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, reason: `http-${res.status}` };
    }

    const data = (await res.json()) as SiteverifyResponse;
    if (data.success) {
      return { ok: true };
    }

    const codes = (data['error-codes'] ?? []).join(',');
    return { ok: false, reason: codes || 'verification-failed' };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: 'timeout' };
    }
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'turnstile-network-error',
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return { ok: false, reason: 'network' };
  } finally {
    clearTimeout(timer);
  }
}
