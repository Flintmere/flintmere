/**
 * GMC OAuth refresh-token storage at rest.
 *
 * Per ADR 0023, the refresh token is the only OAuth artefact persisted —
 * access tokens rotate from the refresh token on demand and live in
 * memory + short-TTL cache only. The refresh token is encrypted at rest
 * with AES-256-GCM; the key (`GMC_TOKEN_KEY`, 32 bytes hex) is held by
 * the server, never sent to the merchant, and isolated from
 * `ONETIMESECRET_KEY` (different blast radius).
 *
 * This is NOT the zero-knowledge pattern used by `secret-web-crypto.ts`.
 * That pattern works for one-time hand-offs where the server never needs
 * to read the plaintext. Refresh tokens must be server-readable so we
 * can call Google's token endpoint to rotate access tokens — therefore
 * the key has to live with the server.
 *
 * Threat model:
 *   - DB compromise alone: ciphertext is useless without the key.
 *   - Key compromise alone: cannot decrypt ciphertext stored elsewhere.
 *   - Both: full compromise. Mitigated by env-var key separation +
 *     a manual rotation runbook (when ratified, ADR 0023 §slice 4
 *     territory).
 *   - Tamper: AES-GCM auth tag fails open() with a thrown error; the
 *     caller treats it as `lastErrorCode = 'auth_failed'` and forces a
 *     re-grant.
 *   - IV reuse: catastrophic for AES-GCM; mitigated by fresh
 *     `randomBytes(12)` per `seal()` call.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

export interface SealedToken {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export function sealRefreshToken(plaintext: string): SealedToken {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return { ciphertext, iv, authTag };
}

export function openRefreshToken(sealed: SealedToken): string {
  if (sealed.iv.length !== IV_BYTES) {
    throw new Error(`gmc-token: iv must be ${IV_BYTES} bytes, got ${sealed.iv.length}`);
  }
  if (sealed.authTag.length !== AUTH_TAG_BYTES) {
    throw new Error(
      `gmc-token: authTag must be ${AUTH_TAG_BYTES} bytes, got ${sealed.authTag.length}`,
    );
  }
  const key = loadKey();
  const decipher = createDecipheriv(ALGORITHM, key, sealed.iv);
  decipher.setAuthTag(sealed.authTag);
  const plaintext = Buffer.concat([
    decipher.update(sealed.ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

function loadKey(): Buffer {
  const raw = process.env.GMC_TOKEN_KEY;
  if (!raw) {
    throw new Error(
      'GMC_TOKEN_KEY missing. Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  if (!/^[0-9a-fA-F]+$/.test(raw)) {
    throw new Error('GMC_TOKEN_KEY must be hex-encoded.');
  }
  const key = Buffer.from(raw, 'hex');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `GMC_TOKEN_KEY must be ${KEY_BYTES} bytes (${KEY_BYTES * 2} hex chars), got ${key.length} bytes.`,
    );
  }
  return key;
}
