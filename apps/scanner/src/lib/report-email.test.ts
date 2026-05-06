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

const baseInput = {
  unsubscribeUrl: 'https://audit.flintmere.com/api/unsubscribe/abc',
  appUrl: 'https://flintmere.com',
  auditUrl: 'https://audit.flintmere.com/audit',
  recipientEmail: 'founder@meridian-coffee.com',
};

describe('buildReportEmail', () => {
  it('puts the invisible-product count and domain in the subject', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    // Critical issue affects 412 products → invisibleCount = 412.
    expect(email.subject).toContain('meridian-coffee.myshopify.com');
    expect(email.subject).toContain('412');
    expect(email.subject).toContain('invisible to AI agents');
  });

  it('uses a ready-for-agents subject when the grade is A', () => {
    const email = buildReportEmail({
      score: makeScore({ grade: 'A', score: 92 }),
      ...baseInput,
    });
    expect(email.subject).toContain('ready for AI shopping agents');
    expect(email.subject).toContain('Grade A');
  });

  it('embeds the unsubscribe link in HTML + text', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).toContain('https://audit.flintmere.com/api/unsubscribe/abc');
    expect(email.text).toContain('https://audit.flintmere.com/api/unsubscribe/abc');
  });

  it('includes the GTIN non-affiliation disclaimer', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).toContain('not affiliated with GS1');
    expect(email.text).toContain('not affiliated with GS1');
  });

  it('shows the locked-check count and routes the merchant to the audit', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).toContain('[&nbsp;3&nbsp;]');
    expect(email.html).toContain('£197 audit covers them');
  });

  it('does not pitch the embedded app — it is post-launch', () => {
    // 2026-05-06: removed the "Install Flintmere" door from the email
    // close. The Shopify embedded app is post-launch per the launch
    // decision; the audit + reply are the only paths that resolve to a
    // shipped product right now.
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).not.toContain('Install Flintmere');
    expect(email.text).not.toContain('Install Flintmere');
  });

  it('links Door 1 to the concierge audit page', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).toContain('https://audit.flintmere.com/audit');
    expect(email.html).toContain('Book the audit');
    expect(email.html).toContain('from £197');
  });

  it('signs off from the named founder for the Flintmere team', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).toContain('Abdur-Rahman Morris');
    expect(email.text).toContain('Abdur-Rahman Morris');
    expect(email.html).toContain('For the Flintmere team');
    expect(email.text).toContain('For the Flintmere team');
  });

  it('translates the missing-gtin code into founder-speak', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).toContain('Products have no barcode');
    expect(email.text).toContain('Products have no barcode');
  });

  it('escapes untrusted strings in the shop domain', () => {
    const email = buildReportEmail({
      score: makeScore({ shopDomain: "<script>alert('x')</script>" }),
      ...baseInput,
    });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
