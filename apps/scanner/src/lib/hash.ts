import { createHash } from 'node:crypto';

/** One-way hash for IP addresses so we can count unique sessions without storing raw IPs. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip).update(getSalt()).digest('hex').slice(0, 24);
}

/**
 * Resolve the IP hash salt. The salt makes hashes unguessable — without it,
 * an attacker could pre-hash IP ranges and look up which buckets are touched
 * (privacy leak + rate-limit evasion).
 *
 * Production: throws if missing or still set to the .env.example placeholder.
 * The error fires at first rate-limit check, not at module load, so dev/test
 * paths that don't exercise the scanner remain unaffected.
 *
 * Dev/test: falls back to a documented dev-only sentinel so local pnpm dev
 * + vitest don't require IP_HASH_SALT in every shell.
 *
 * Tightened 2026-05-09 pre-launch audit — was `?? 'flintmere-default-salt'`,
 * which gave production a known-fixed salt when the env var was absent.
 */
function getSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt || salt === 'flintmere-default-salt-change-me') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'IP_HASH_SALT missing or still set to the .env.example placeholder. ' +
          'Generate with: openssl rand -hex 32',
      );
    }
    return 'flintmere-default-dev-salt-not-for-production';
  }
  return salt;
}
