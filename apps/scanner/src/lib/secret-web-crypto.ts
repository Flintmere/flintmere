/**
 * Browser-side AES-256-GCM helpers for the one-time-secret service.
 *
 * Used by:
 *   - SecretNewForm — generate key, encrypt plaintext, return ciphertext +
 *     IV + authTag bytes (sent to /api/secret), and the base64-encoded
 *     key (placed in the URL fragment, never sent to the server).
 *   - SecretReveal — read fragment key, fetch ciphertext from
 *     /api/secret/[id]/consume, decrypt locally.
 *
 * Standards: Web Crypto API only. AES-GCM, 256-bit key, 96-bit IV from
 * crypto.getRandomValues, 128-bit auth tag (Web Crypto returns it
 * appended to the ciphertext output by default; we split it off so the
 * server can store and replay them separately, matching the wire shape
 * of node:crypto AES-GCM).
 */

const KEY_ALGO: AesKeyGenParams = { name: 'AES-GCM', length: 256 };
const KEY_USAGES: KeyUsage[] = ['encrypt', 'decrypt'];
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

export interface EncryptedPayload {
  /** Raw ciphertext bytes, no auth tag appended. */
  ciphertext: Uint8Array;
  /** 12 bytes. */
  iv: Uint8Array;
  /** 16 bytes. */
  authTag: Uint8Array;
  /** Base64url-encoded raw key bytes — goes in the URL fragment. */
  keyFragment: string;
}

export async function encryptForOneTimeSecret(
  plaintext: string,
): Promise<EncryptedPayload> {
  const subtle = getSubtle();

  const key = await subtle.generateKey(KEY_ALGO, true, KEY_USAGES);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  const sealedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: bufferSource(iv) },
    key,
    bufferSource(encoded),
  );
  const sealed = new Uint8Array(sealedBuffer);

  // Web Crypto AES-GCM appends the 16-byte auth tag to the ciphertext.
  // We split so the server can store ciphertext / iv / authTag in the
  // same DB columns the v1 server-side path used.
  const authTag = sealed.slice(sealed.length - AUTH_TAG_BYTES);
  const ciphertext = sealed.slice(0, sealed.length - AUTH_TAG_BYTES);

  const rawKey = new Uint8Array(await subtle.exportKey('raw', key));
  const keyFragment = base64UrlEncode(rawKey);

  return { ciphertext, iv, authTag, keyFragment };
}

export async function decryptOneTimeSecret(args: {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  keyFragment: string;
}): Promise<string> {
  const subtle = getSubtle();

  const rawKey = base64UrlDecode(args.keyFragment);
  const key = await subtle.importKey(
    'raw',
    bufferSource(rawKey),
    KEY_ALGO,
    false,
    ['decrypt'],
  );

  // Web Crypto expects ciphertext + auth tag concatenated for decrypt.
  const sealed = new Uint8Array(args.ciphertext.length + args.authTag.length);
  sealed.set(args.ciphertext, 0);
  sealed.set(args.authTag, args.ciphertext.length);

  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv: bufferSource(args.iv) },
    key,
    bufferSource(sealed),
  );
  return new TextDecoder().decode(plaintext);
}

/**
 * TypeScript's lib.dom.d.ts narrows Web Crypto's BufferSource to
 * `ArrayBufferView<ArrayBuffer>`, which excludes our generic
 * `Uint8Array<ArrayBufferLike>` even at runtime-equivalent shapes.
 * Coerce via the underlying ArrayBuffer so the call sites typecheck
 * without an `as BufferSource` cast at every use.
 */
function bufferSource(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(
    view.byteOffset,
    view.byteOffset + view.byteLength,
  ) as ArrayBuffer;
}

export function base64Encode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

export function base64Decode(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function base64UrlEncode(bytes: Uint8Array): string {
  return base64Encode(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + padding(value.length);
  return base64Decode(padded);
}

function padding(len: number): string {
  const remainder = len % 4;
  if (remainder === 0) return '';
  return '='.repeat(4 - remainder);
}

function getSubtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error(
      'Web Crypto SubtleCrypto is not available. This page requires HTTPS or localhost.',
    );
  }
  return crypto.subtle;
}
