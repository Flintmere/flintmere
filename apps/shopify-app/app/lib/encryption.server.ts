/**
 * AES-256-GCM token encryption per memory/product-engineering/security-posture.md.
 *
 * Shopify access tokens are NEVER stored in plaintext. The encryption key lives
 * in SHOPIFY_TOKEN_ENCRYPTION_KEY (32 bytes, base64). Rotate annually with a
 * dual-read window.
 *
 * Output format: base64(iv + ciphertext + authTag) — single field to store.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function key(): Buffer {
  const raw = process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'SHOPIFY_TOKEN_ENCRYPTION_KEY missing. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    throw new Error(
      `SHOPIFY_TOKEN_ENCRYPTION_KEY must be 32 bytes (base64); got ${buf.length}`,
    );
  }
  return buf;
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, authTag]).toString('base64');
}

export function decryptToken(packed: string): string {
  const buf = Buffer.from(packed, 'base64');
  if (buf.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Encrypted token payload is too short.');
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(buf.length - TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
