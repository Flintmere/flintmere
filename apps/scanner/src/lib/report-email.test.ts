import { describe, expect, it } from 'vitest';
import type { CompositeScore } from '@flintmere/scoring';
import { buildReportEmail } from './report-email';

function makeScore(overrides: Partial<CompositeScore> = {}): CompositeScore {
  return {
    shopDomain: 'meridian-coffee.myshopify.com',
    scoredAt: '2026-04-19T10:00:00Z',
    productCount: 412,
    variantCount: 1247,
    score: 64,
    grade: 'C',
    gtinlessCeiling: 82,
    fullCeiling: 100,
    pillars: [
      { pillar: 'identifiers', weight: 20, score: 48, maxScore: 100, locked: false, issues: [] },
      { pillar: 'attributes', weight: 25, score: 0, maxScore: 100, locked: true, lockedReason: 'requires-install', issues: [] },
      { pillar: 'titles', weight: 15, score: 71, maxScore: 100, locked: false, issues: [] },
      { pillar: 'mapping', weight: 15, score: 0, maxScore: 100, locked: true, lockedReason: 'requires-install', issues: [] },
      { pillar: 'consistency', weight: 15, score: 82, maxScore: 100, locked: false, issues: [] },
      { pillar: 'checkout-eligibility', weight: 10, score: 0, maxScore: 100, locked: true, lockedReason: 'requires-install', issues: [] },
    ],
    issues: [
      {
        pillar: 'identifiers',
        code: 'missing-gtin',
        severity: 'critical',
        title: 'Missing GTINs on 412 products',
        description: 'Products without GS1-registered barcodes are excluded from AI agent matching.',
        affectedCount: 412,
        affectedProductIds: [],
        revenueImpactScore: 100,
      },
    ],
    ...overrides,
  };
}

describe('buildReportEmail', () => {
  it('puts the score and domain in the subject with the bracket signature', () => {
    const email = buildReportEmail({
      score: makeScore(),
      unsubscribeUrl: 'https://audit.flintmere.com/api/unsubscribe/abc',
      appUrl: 'https://flintmere.com',
      recipientEmail: 'founder@meridian-coffee.com',
    });
    expect(email.subject).toContain('[ Flintmere Report ]');
    expect(email.subject).toContain('64/100');
    expect(email.subject).toContain('Grade C');
    expect(email.subject).toContain('meridian-coffee.myshopify.com');
  });

  it('embeds the unsubscribe link in HTML + text', () => {
    const email = buildReportEmail({
      score: makeScore(),
      unsubscribeUrl: 'https://audit.flintmere.com/api/unsubscribe/abc',
      appUrl: 'https://flintmere.com',
      recipientEmail: 'founder@meridian-coffee.com',
    });
    expect(email.html).toContain('https://audit.flintmere.com/api/unsubscribe/abc');
    expect(email.text).toContain('https://audit.flintmere.com/api/unsubscribe/abc');
  });

  it('includes the GTIN non-affiliation disclaimer', () => {
    const email = buildReportEmail({
      score: makeScore(),
      unsubscribeUrl: 'u',
      appUrl: 'a',
      recipientEmail: 'x@y.com',
    });
    expect(email.html).toContain('not affiliated with GS1');
    expect(email.text).toContain('not affiliated with GS1');
  });

  it('shows the 3 locked pillars with an install CTA', () => {
    const email = buildReportEmail({
      score: makeScore(),
      unsubscribeUrl: 'u',
      appUrl: 'https://flintmere.com',
      recipientEmail: 'x@y.com',
    });
    expect(email.html).toContain('[&nbsp;3&nbsp;]');
    expect(email.html).toContain('Install Flintmere');
  });

  it('escapes untrusted strings in the shop domain', () => {
    const email = buildReportEmail({
      score: makeScore({ shopDomain: "<script>alert('x')</script>" }),
      unsubscribeUrl: 'u',
      appUrl: 'a',
      recipientEmail: 'x@y.com',
    });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
