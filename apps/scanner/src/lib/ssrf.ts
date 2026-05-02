import { lookup } from 'node:dns/promises';

/**
 * SSRF defence for outbound fetches whose target host is user-supplied.
 *
 * Scope: shopify-fetcher (the merchant URL the scanner submits) and
 * crawlability-fetcher (robots/llms/sitemap on the same host). Both pass
 * arbitrary user input as the destination — without this gate, a malicious
 * input could point at our internal network or cloud metadata endpoints.
 *
 * Defence in depth:
 *   (1) literal hostname check — catches the trivially-typed cases
 *       (`localhost`, `127.0.0.1`, `[::1]`, `*.local`, IPv4 RFC1918, CGNAT,
 *        IPv6 ULA / link-local, IPv4-mapped IPv6, multicast/reserved).
 *   (2) DNS pre-resolve — defeats names that resolve to private ranges
 *       (`internal.example` → 10.x.x.x). Block if any returned A/AAAA is
 *       non-public.
 *
 * Residual risk: classic DNS rebinding (TTL-zero record flips between
 * resolve-time and fetch-time). The proper fix is to fetch by resolved IP
 * with a Host header and pinned TLS — out of scope here. Acceptable for
 * our threat model on a single droplet; revisit if we run a public preview
 * service or move to multi-tenant background fetching.
 */

const PRIVATE_HOST_LITERAL = new Set([
  'localhost',
  'ip6-localhost',
  'ip6-loopback',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
  '::',
  'broadcasthost',
]);

const SUFFIX_BLOCKLIST = ['.local', '.localhost', '.internal'];

export class SsrfBlockedError extends Error {
  constructor(
    public readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = 'SsrfBlockedError';
  }
}

export function isPrivateHostLiteral(rawHost: string): boolean {
  const host = rawHost.toLowerCase();
  if (PRIVATE_HOST_LITERAL.has(host)) return true;
  if (SUFFIX_BLOCKLIST.some((s) => host.endsWith(s))) return true;
  if (isPrivateIPv4(host)) return true;
  if (isPrivateIPv6(host)) return true;
  return false;
}

export function isPrivateIPv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const o1 = Number(m[1]);
  const o2 = Number(m[2]);
  if (o1 === 10) return true;
  if (o1 === 127) return true;
  if (o1 === 0) return true;
  if (o1 === 169 && o2 === 254) return true; // link-local + AWS/GCP metadata 169.254.169.254
  if (o1 === 192 && o2 === 168) return true;
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return true; // CGNAT 100.64.0.0/10
  if (o1 >= 224) return true; // multicast 224/4 + reserved 240/4
  return false;
}

export function isPrivateIPv6(rawHost: string): boolean {
  // Strip brackets if present (URL form).
  const host = rawHost.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();
  if (!host.includes(':')) return false;
  if (host === '::' || host === '::1') return true;
  // IPv4-mapped IPv6 — ::ffff:a.b.c.d. Defer to v4 check on the trailing literal.
  const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(host);
  if (mapped && mapped[1]) return isPrivateIPv4(mapped[1]);
  // ULA fc00::/7 → first byte 0xfc or 0xfd → segment starts with 'fc' or 'fd'.
  if (/^f[cd][0-9a-f]{0,2}:/.test(host)) return true;
  // Link-local fe80::/10 → fe80..febf.
  if (/^fe[89ab][0-9a-f]?:/.test(host)) return true;
  // Multicast ff00::/8.
  if (/^ff[0-9a-f]{2}:/.test(host)) return true;
  // Discard prefix 100::/64 — reserved.
  if (/^0100:/.test(host)) return true;
  return false;
}

/**
 * Resolve `host` and assert every returned address is publicly routable.
 * Throws SsrfBlockedError on any private / reserved / internal address.
 *
 * Call this BEFORE the fetch. Caller is responsible for ensuring the
 * subsequent fetch hits the same name (TOCTOU residual — see file header).
 */
export async function assertPublicHost(host: string): Promise<void> {
  if (!host) {
    throw new SsrfBlockedError('empty', 'empty host');
  }
  if (isPrivateHostLiteral(host)) {
    throw new SsrfBlockedError('literal', `private host: ${host}`);
  }

  // If the literal IS an IP literal, the literal-check above is sufficient
  // — DNS lookup of an IP returns the IP itself.
  if (isIpLiteral(host)) return;

  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    // Resolution failure surfaces as "unreachable" downstream; not an SSRF
    // event. Don't pretend it's blocked.
    return;
  }

  if (addresses.length === 0) return;

  for (const { address, family } of addresses) {
    const blocked =
      family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
    if (blocked) {
      throw new SsrfBlockedError(
        'resolved-private',
        `${host} resolves to private address ${address}`,
      );
    }
  }
}

function isIpLiteral(host: string): boolean {
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (host.includes(':')) return true;
  return false;
}
