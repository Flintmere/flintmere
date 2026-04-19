import { createHash } from 'node:crypto';

/** One-way hash for IP addresses so we can count unique sessions without storing raw IPs. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? 'flintmere-default-salt';
  return createHash('sha256').update(ip).update(salt).digest('hex').slice(0, 24);
}
