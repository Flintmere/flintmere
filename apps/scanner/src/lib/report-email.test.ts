import { describe, expect, it } from 'vitest';
import type { CompositeScore } from '@flintmere/scoring';
import { buildReportEmail } from './report-email';
import { verdictHeader } from './copy';
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
        severity: 'high',
        title: 'Missing GTINs on 412 products',
        description:
          'A product with no GTIN can be limited in where Google Merchant Center shows it. It is not disapproved for that alone.',
        affectedCount: 412,
        affectedProductIds: [],
        revenueImpactScore: 80,
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
  it('puts the affected-product count and domain in the subject', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    // High-severity issue affects 412 products → affectedCount = 412.
    expect(email.subject).toContain('meridian-coffee.myshopify.com');
    expect(email.subject).toContain('412');
    expect(email.subject).toContain('products have incomplete data');
  });

  it('uses a good-shape subject when the grade is A and nothing is affected', () => {
    // The claim is gated on the count, not the grade: makeScore()'s
    // default issue affects all 412 products, and a grade-A store in that
    // state must not be told its data is in good shape.
    const email = buildReportEmail({
      score: makeScore({ grade: 'A', score: 92, issues: [] }),
      ...baseInput,
    });
    expect(email.subject).toContain('catalog data in good shape');
    expect(email.subject).toContain('Grade A');
  });

  it('does not use a good-shape subject when a grade-A store has an affected product', () => {
    const email = buildReportEmail({
      score: makeScore({ grade: 'A', score: 92 }),
      ...baseInput,
    });
    expect(email.subject).not.toContain('good shape');
    expect(email.subject).toContain('at least 412 of 412');
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

  it('shows the locked-check count and routes the merchant to the catalog letter', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).toContain('[&nbsp;3&nbsp;]');
    expect(email.html).toContain('£197 catalog letter covers them');
  });

  it('does not pitch the embedded app — it is post-launch', () => {
    // 2026-05-06: removed the "Install Flintmere" door from the email
    // close. The Shopify embedded app is post-launch per the launch
    // decision; the catalog letter + reply are the only paths that
    // resolve to a shipped product right now.
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).not.toContain('Install Flintmere');
    expect(email.text).not.toContain('Install Flintmere');
  });

  it('links Door 1 to the catalog letter page', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).toContain('https://audit.flintmere.com/audit');
    expect(email.html).toContain('Book your catalog letter');
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

  it('surfaces a truncation note when the GMC API read budget is exhausted', () => {
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

describe('buildReportEmail — GTIN consequences match Google behaviour', () => {
  it('does not claim a missing barcode makes a product invisible', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.text.toLowerCase()).not.toContain('invisible');
    expect(email.text.toLowerCase()).not.toContain('cannot match');
  });

  it('reserves disapproval for the invalid-checksum code', () => {
    const checksum = buildReportEmail({
      score: makeScore({
        issues: [
          {
            pillar: 'identifiers',
            code: 'invalid-gtin-checksum',
            severity: 'critical',
            title: 'Invalid GTIN checksum on 3 products',
            description: 'x',
            affectedCount: 3,
            affectedProductIds: [],
            revenueImpactScore: 100,
          },
        ],
      }),
      ...baseInput,
    });
    expect(checksum.text).toContain('disapproves');

    // The other half of "reserves": the missing-gtin case must NOT claim
    // a disapproval. Google limits where it shows a GTIN-less product; it
    // does not disapprove the listing for that alone. makeScore()'s
    // default issue list is the missing-gtin one.
    const missing = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(missing.text).not.toContain('disapproves');
    expect(missing.text).toContain('It is not disapproved for that.');
  });
});

describe('buildReportEmail — no "invisible" claim on any grade', () => {
  it.each(['A', 'B', 'C', 'D', 'F'] as const)('grade %s: subject and body never say invisible', (grade) => {
    const email = buildReportEmail({
      score: makeScore({ grade }),
      ...baseInput,
    });
    expect(email.subject.toLowerCase()).not.toContain('invisible');
    expect(email.html.toLowerCase()).not.toContain('invisible');
    expect(email.text.toLowerCase()).not.toContain('invisible');
  });
});

describe('buildReportEmail — the verdict headline agrees with its own count', () => {
  // Review finding 2. The headline used to come from the grade and the
  // subhead from the count, so they could flatly contradict: grade B
  // rendered "Most of your catalog data is complete." directly above
  // "412 of 412 products carry a gap." A UK food merchant with no
  // barcodes at all is exactly the affectedCount === productCount case.
  const everyProductAffected = (grade: CompositeScore['grade']) =>
    makeScore({
      grade,
      issues: [
        {
          pillar: 'identifiers',
          code: 'missing-gtin',
          severity: 'high',
          title: 'Missing GTINs on 412 products',
          description: 'x',
          affectedCount: 412, // === productCount
          affectedProductIds: [],
          revenueImpactScore: 80,
        },
      ],
    });

  it.each(['A', 'B', 'C', 'D', 'F'] as const)(
    'grade %s: never claims the catalog is complete while every product carries a gap',
    (grade) => {
      const email = buildReportEmail({
        score: everyProductAffected(grade),
        ...baseInput,
      });
      const body = `${email.subject}\n${email.text}`.toLowerCase();
      expect(body).not.toContain('catalog data is complete');
      expect(body).not.toContain('in good shape');
      expect(body).toContain('most of your catalog data is incomplete');
    },
  );

  it('hedges the affected count as a floor, not an exact total', () => {
    // affectedCountFor takes the MAX over critical/high issues, so two
    // disjoint issues under-report the true union. Every render of the
    // number must say "at least".
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.subject).toContain('at least');
    expect(email.text).toContain('At least');
  });

  it('does not claim a gap when no product carries a critical or high issue', () => {
    const email = buildReportEmail({
      score: makeScore({ grade: 'A', score: 94, issues: [] }),
      ...baseInput,
    });
    expect(email.text).toContain('No critical or high-priority gap affects a product.');
    expect(email.text).not.toContain('carry a gap');
  });
});

describe('buildReportEmail — scan scope line (Task 7)', () => {
  // Same trust-anchor as the on-page ScanScopeLine: a merchant reading
  // only the email must not mistake a sampled barcode count for a
  // whole-catalog count.
  it('states "barcodes not read" when the scope carries barcodesRead: 0', () => {
    const email = buildReportEmail({
      score: makeScore(),
      ...baseInput,
      scanScope: {
        sampledCount: 120,
        actualProductCount: 120,
        truncated: false,
        barcodesRead: 0,
      },
    });
    expect(email.html).toContain('barcodes not read');
    expect(email.text).toContain('barcodes not read');
  });

  it('renders no scope line at all when scanScope is absent', () => {
    // Reports rebuilt from a scan persisted before the barcode pass
    // shipped carry no scanScope — omit the line rather than guess.
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.html).not.toContain('Scanned');
    expect(email.text).not.toContain('Scanned');
  });
});

describe('verdictHeader — every branch is true for every reachable input', () => {
  // verdictHeader takes `grade: string`, so it accepts 'A+' even though
  // CompositeScore['grade'] has no such member and no caller can produce
  // one. Sweeping it here covers the branch the email-level sweep cannot
  // reach without lying about the type.
  const GRADES = ['A+', 'A', 'B', 'C', 'D', 'F'] as const;

  it.each(GRADES)(
    'grade %s: headline never claims completeness when every product is affected',
    (grade) => {
      const { headline, subhead } = verdictHeader({
        grade,
        affectedCount: 412,
        totalProducts: 412,
      });
      expect(headline.toLowerCase()).not.toContain('data is complete');
      expect(headline.toLowerCase()).not.toContain('good shape');
      expect(headline).toBe('Most of your catalog data is incomplete.');
      expect(subhead).toContain('At least 412 of 412');
    },
  );

  it.each(GRADES)('grade %s: a single site-level failure is not called "most"', (grade) => {
    // robots-blocks-all is critical with affectedCount 1. "Most of your
    // catalog data is incomplete" asserted from the grade alone was false
    // here; the quantifier now comes from the count.
    const { headline } = verdictHeader({ grade, affectedCount: 1, totalProducts: 412 });
    expect(headline.toLowerCase()).not.toContain('most');
    expect(headline).toContain('At least 1 of your 412');
  });

  it('does not call an exact half "most"', () => {
    const { headline } = verdictHeader({ grade: 'C', affectedCount: 206, totalProducts: 412 });
    expect(headline.toLowerCase()).not.toContain('most');
  });

  it('handles a zero product count without dividing by zero', () => {
    const { headline, subhead } = verdictHeader({
      grade: 'F',
      affectedCount: 0,
      totalProducts: 0,
    });
    expect(headline).toBe('No product carries a critical gap.');
    expect(subhead).toContain('0 products checked');
  });
});
