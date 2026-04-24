import { describe, expect, it } from 'vitest';
import { scoreUrl, validateDomainSegment } from './badge-url';

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
