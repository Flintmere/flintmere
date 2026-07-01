import { describe, expect, it } from 'vitest';
import {
  badgeUrl,
  scoreUrl,
  truncateDomain,
  validateDomainSegment,
} from './badge-url';

describe('validateDomainSegment', () => {
  it.each([
    ['acme.myshopify.com', 'acme.myshopify.com'],
    ['ACME.Myshopify.com', 'acme.myshopify.com'],
    ['sub.shop.co.uk', 'sub.shop.co.uk'],
    ['a-b.example.com', 'a-b.example.com'],
    ['example.com ', 'example.com'],
  ])('accepts %s', (raw, expected) => {
    expect(validateDomainSegment(raw)).toBe(expected);
  });

  it.each([
    '',
    'example',
    '.example.com',
    'example..com',
    '-example.com',
    'example-.com',
    'https://example.com',
    'example.com/path',
    '../etc/passwd',
    'example.com?x=1',
    '<script>alert(1)</script>',
    'a'.repeat(254) + '.com',
  ])('rejects %s', (raw) => {
    expect(validateDomainSegment(raw)).toBeNull();
  });

  it('rejects malformed percent-encoding', () => {
    expect(validateDomainSegment('%E0%A4%A')).toBeNull();
  });

  it('decodes valid percent-encoded input', () => {
    expect(validateDomainSegment('acme.myshopify.com')).toBe('acme.myshopify.com');
    expect(validateDomainSegment('acme%2Emyshopify.com')).toBe('acme.myshopify.com');
  });
});

describe('scoreUrl', () => {
  it('builds canonical marketing-host URL', () => {
    expect(scoreUrl('acme.myshopify.com')).toBe(
      'https://flintmere.com/score/acme.myshopify.com',
    );
  });
});

describe('badgeUrl', () => {
  it('builds canonical marketing-host badge URL', () => {
    expect(badgeUrl('acme.myshopify.com')).toBe(
      'https://flintmere.com/badge/acme.myshopify.com',
    );
  });
});

describe('truncateDomain', () => {
  it('passes a typical domain through untouched', () => {
    expect(truncateDomain('demo-foods.myshopify.com')).toBe(
      'demo-foods.myshopify.com',
    );
  });

  it('leaves a domain exactly at the 26-char cap untouched', () => {
    const at = 'a'.repeat(26);
    expect(truncateDomain(at)).toBe(at);
  });

  it('truncates an over-long domain to 26 chars with a trailing ellipsis', () => {
    const out = truncateDomain('x'.repeat(40));
    expect(out).toBe('x'.repeat(23) + '...');
    expect(out).toHaveLength(26);
  });
});
