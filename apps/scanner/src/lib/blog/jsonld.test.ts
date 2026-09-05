import { describe, expect, it } from 'vitest';
import { SCANNER_HOST } from '../host-routing';
import { postUrl } from './jsonld';

describe('jsonld host default (ADR 0028 Shipment 2)', () => {
  it('defaults to SCANNER_HOST, not a hardcoded literal', () => {
    expect(postUrl('example-slug')).toBe(`https://${SCANNER_HOST}/blog/example-slug`);
  });
});
