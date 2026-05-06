import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openRefreshToken, sealRefreshToken } from './token-storage';

const VALID_KEY = '0'.repeat(64);
const ALTERNATE_KEY = 'f'.repeat(64);

describe('gmc/token-storage', () => {
  beforeEach(() => {
    process.env.GMC_TOKEN_KEY = VALID_KEY;
  });

  afterEach(() => {
    delete process.env.GMC_TOKEN_KEY;
  });

  it('round-trips a refresh token', () => {
    const sealed = sealRefreshToken('1//0gabcDEFGHIJKLmnopqrSTUVwxyz_refresh_token_xyz');
    const plaintext = openRefreshToken(sealed);
    expect(plaintext).toBe('1//0gabcDEFGHIJKLmnopqrSTUVwxyz_refresh_token_xyz');
  });

  it('produces a fresh IV per seal', () => {
    const a = sealRefreshToken('same-token');
    const b = sealRefreshToken('same-token');
    expect(a.iv.equals(b.iv)).toBe(false);
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
  });

  it('rejects ciphertext tamper', () => {
    const sealed = sealRefreshToken('refresh-token');
    const tampered = {
      ...sealed,
      ciphertext: Buffer.from(sealed.ciphertext).fill(0xff, 0, 1),
    };
    expect(() => openRefreshToken(tampered)).toThrow();
  });

  it('rejects authTag tamper', () => {
    const sealed = sealRefreshToken('refresh-token');
    const tampered = {
      ...sealed,
      authTag: Buffer.from(sealed.authTag).fill(0xff, 0, 1),
    };
    expect(() => openRefreshToken(tampered)).toThrow();
  });

  it('rejects iv tamper', () => {
    const sealed = sealRefreshToken('refresh-token');
    const tampered = {
      ...sealed,
      iv: Buffer.from(sealed.iv).fill(0xff, 0, 1),
    };
    expect(() => openRefreshToken(tampered)).toThrow();
  });

  it('rejects wrong-length iv', () => {
    const sealed = sealRefreshToken('refresh-token');
    expect(() =>
      openRefreshToken({ ...sealed, iv: Buffer.alloc(8) }),
    ).toThrow(/iv must be 12 bytes/);
  });

  it('rejects wrong-length authTag', () => {
    const sealed = sealRefreshToken('refresh-token');
    expect(() =>
      openRefreshToken({ ...sealed, authTag: Buffer.alloc(8) }),
    ).toThrow(/authTag must be 16 bytes/);
  });

  it('fails closed when key rotates', () => {
    const sealed = sealRefreshToken('refresh-token');
    process.env.GMC_TOKEN_KEY = ALTERNATE_KEY;
    expect(() => openRefreshToken(sealed)).toThrow();
  });

  it('throws a helpful error when GMC_TOKEN_KEY is missing', () => {
    delete process.env.GMC_TOKEN_KEY;
    expect(() => sealRefreshToken('refresh-token')).toThrow(/GMC_TOKEN_KEY missing/);
  });

  it('rejects a non-hex GMC_TOKEN_KEY', () => {
    process.env.GMC_TOKEN_KEY = 'not-hex-' + 'z'.repeat(56);
    expect(() => sealRefreshToken('refresh-token')).toThrow(/hex-encoded/);
  });

  it('rejects a wrong-length GMC_TOKEN_KEY', () => {
    process.env.GMC_TOKEN_KEY = 'abcd';
    expect(() => sealRefreshToken('refresh-token')).toThrow(/32 bytes \(64 hex chars\)/);
  });

  it('round-trips multibyte plaintext', () => {
    const plaintext = 'ünıcödẹ ✓ refresh — 🔐';
    const sealed = sealRefreshToken(plaintext);
    expect(openRefreshToken(sealed)).toBe(plaintext);
  });

  it('round-trips long plaintext', () => {
    const plaintext = 'a'.repeat(4096);
    const sealed = sealRefreshToken(plaintext);
    expect(openRefreshToken(sealed)).toBe(plaintext);
  });
});
