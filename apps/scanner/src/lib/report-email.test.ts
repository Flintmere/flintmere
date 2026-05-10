import { describe, expect, it } from 'vitest';
import type { CompositeScore } from '@flintmere/scoring';
import { buildReportEmail } from './report-email';
import type { GmcGroundTruth } from './gmc/types';

function makeGmcGroundTruth(
  overrides: Partial<GmcGroundTruth> = {},
): GmcGroundTruth {
  return {
    fetchedAt: '2026-05-08T09:30:00Z',
    gmcAccountId: '123456789',
    gmcAccountName: 'Meridian Coffee Roasters',
    totalProductsRead: 412,
    truncated: false,
    destinationCounts: { approved: 312, disapproved: 47, pending: 53 },
    topIssues: [
      {
        code: 'missing_value',
        description: '[gtin] Missing value',
        severity: 'error',
        productCount: 41,
        sampleProducts: [
          { offerId: 'sku-001', title: 'Single-origin Ethiopian — 250g' },
          { offerId: 'sku-002', title: 'House blend espresso — 1kg' },
        ],
      },
      {
        code: 'invalid_value',
        description: '[gtin] Invalid value',
        severity: 'error',
        productCount: 6,
        sampleProducts: [
          { offerId: 'sku-099', title: 'Decaf Brazilian — 500g' },
        ],
      },
    ],
    ...overrides,
  };
}

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

describe('buildReportEmail — GMC ground truth section (ADR 0023 slice 3)', () => {
  it('omits the GMC banner when no ground truth was fetched', () => {
    const email = buildReportEmail({
      score: makeScore(),
      ...baseInput,
      gmcGroundTruth: null,
    });
    expect(email.html).not.toContain('ground truth');
    expect(email.html).not.toContain('Currently disapproved');
    expect(email.text).not.toContain('Currently disapproved');
  });

  it('omits the GMC banner when the field is absent on the input', () => {
    // Backwards-compat: callers that don't yet pass gmcGroundTruth get
    // the same render they had before slice 3 landed.
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).not.toContain('Currently disapproved');
  });

  it('renders the deterministic disapproval lede when ground truth is present', () => {
    const email = buildReportEmail({
      score: makeScore(),
      ...baseInput,
      gmcGroundTruth: makeGmcGroundTruth(),
    });
    expect(email.html).toContain('Currently disapproved');
    expect(email.html).toContain('read directly from your Google Merchant Center');
    // Lede: "47 of 412 products disapproved" (412 = 312 approved + 47 disapproved + 53 pending)
    expect(email.html).toContain('47 of 412 products disapproved');
    // Subline carries the per-status counts + account label.
    expect(email.html).toContain('312 approved');
    expect(email.html).toContain('53 pending');
    expect(email.html).toContain('Meridian Coffee Roasters');
  });

  it("renders Google's verbatim issue descriptions and codes", () => {
    // Per ADR 0023: "direct disapproval-reason quotes (Google's own language)".
    // We must NOT translate the description through founder-speak — the
    // proof of "we read your real GMC" is Google's own copy.
    const email = buildReportEmail({
      score: makeScore(),
      ...baseInput,
      gmcGroundTruth: makeGmcGroundTruth(),
    });
    expect(email.html).toContain('[gtin] Missing value');
    expect(email.html).toContain('code: missing_value');
    expect(email.html).toContain('41 products');
  });

  it('includes sample product titles in the email (private surface)', () => {
    // Sample product titles are appropriate in the email (sent only to
    // the merchant) but excluded from the public score page panel.
    const email = buildReportEmail({
      score: makeScore(),
      ...baseInput,
      gmcGroundTruth: makeGmcGroundTruth(),
    });
    expect(email.html).toContain('Single-origin Ethiopian — 250g');
    expect(email.text).toContain('Single-origin Ethiopian — 250g');
  });

  it('surfaces a truncation note when the read budget exhausted', () => {
    const email = buildReportEmail({
      score: makeScore(),
      ...baseInput,
      gmcGroundTruth: makeGmcGroundTruth({
        truncated: true,
        totalProductsRead: 250,
      }),
    });
    // HTML escapes apostrophes; assert against the unambiguous substring.
    expect(email.html).toContain('API budget ran out');
    expect(email.html).toContain('250 products');
    // Text variant carries the unescaped form.
    expect(email.text).toContain("Google's API budget ran out");
  });

  it('drops to an all-approved lede when no products are disapproved', () => {
    const email = buildReportEmail({
      score: makeScore(),
      ...baseInput,
      gmcGroundTruth: makeGmcGroundTruth({
        destinationCounts: { approved: 412, disapproved: 0, pending: 0 },
        topIssues: [],
      }),
    });
    // Lede pivots to the all-approved framing — the banner eyebrow keeps
    // its fixed identity ("Currently disapproved") because that's what
    // the section IS, but the deterministic anchor flips to the
    // good-news shape.
    expect(email.html).toContain('412 products approved by Google');
  });
});
