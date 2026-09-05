import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SCANNER_HOST } from './host-routing';

// `packages/ui/src/SiteFooter.tsx` cannot import `SCANNER_HOST` from
// `apps/scanner` — that dependency direction runs backwards (packages/ui is
// a separate, consumer-agnostic package). It therefore carries its own
// literal `SCANNER_HOST_URL`, deliberately (see the comment at the top of
// that file). This test is the guard that keeps the two in sync: if
// `SCANNER_HOST` ever changes here without the literal in SiteFooter.tsx
// being updated too, this fails loudly instead of silently serving a
// cross-host link to the wrong domain.
describe('packages/ui SiteFooter host literal agrees with SCANNER_HOST (ADR 0028 Shipment 2)', () => {
  const source = readFileSync(
    join(__dirname, '../../../../packages/ui/src/SiteFooter.tsx'),
    'utf8',
  );

  it('declares SCANNER_HOST_URL matching the scanner app SCANNER_HOST', () => {
    expect(source).toContain(`const SCANNER_HOST_URL = 'https://${SCANNER_HOST}'`);
  });
});
