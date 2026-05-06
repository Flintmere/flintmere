import { describe, expect, it } from 'vitest';
import { revenueLede } from './copy';

// Locks the deterministic-anchor two-beat for State 1 and the backward-compat
// single-sentence fallback for older persisted scans. The earlier shape
// (single £-range sentence as headline) read as a guess on a 2.3× spread —
// the two-beat shape anchors on a deterministic count first, demotes the
// probabilistic £-band to a subline. See feedback memory:
// "feedback_probability_range_in_headline_reads_as_guess".

describe('revenueLede', () => {
  describe('two-beat path (count + signal both supplied)', () => {
    it('leads with the count anchor, demotes the £-band to subline', () => {
      const { headline, subline } = revenueLede({
        low: 210_000,
        high: 480_000,
        productCount: 1_000,
        productsWithAnySignal: 506,
      });
      expect(headline).toBe(
        '506 of your 1,000 products are missing data Google Shopping looks for.',
      );
      expect(subline).toBe(
        'Roughly £210k–£480k of annual demand is at risk while these stay suppressed.',
      );
    });

    it('collapses range when low === high (single point estimate)', () => {
      const { headline, subline } = revenueLede({
        low: 210_000,
        high: 210_000,
        productCount: 1_000,
        productsWithAnySignal: 506,
      });
      expect(headline).toBe(
        '506 of your 1,000 products are missing data Google Shopping looks for.',
      );
      expect(subline).toBe('£210k of annual demand is at risk while these stay suppressed.');
    });

    it('uses "Up to £X" framing when low === 0', () => {
      const { subline } = revenueLede({
        low: 0,
        high: 50_000,
        productCount: 200,
        productsWithAnySignal: 40,
      });
      expect(subline).toBe('Up to £50k of annual demand is at risk while these stay suppressed.');
    });

    it('formats £-figures across the bands (£100k+, £1m+, £10m+)', () => {
      expect(
        revenueLede({ low: 1_500, high: 9_500, productCount: 50, productsWithAnySignal: 20 })
          .subline,
      ).toBe('Roughly £1.5k–£9.5k of annual demand is at risk while these stay suppressed.');
      expect(
        revenueLede({ low: 100_000, high: 250_000, productCount: 500, productsWithAnySignal: 200 })
          .subline,
      ).toBe('Roughly £100k–£250k of annual demand is at risk while these stay suppressed.');
      expect(
        revenueLede({ low: 1_200_000, high: 3_400_000, productCount: 5_000, productsWithAnySignal: 2_000 })
          .subline,
      ).toBe('Roughly £1.2m–£3.4m of annual demand is at risk while these stay suppressed.');
      expect(
        revenueLede({ low: 12_000_000, high: 25_000_000, productCount: 20_000, productsWithAnySignal: 8_000 })
          .subline,
      ).toBe('Roughly £12m–£25m of annual demand is at risk while these stay suppressed.');
    });
  });

  describe('backward-compat path (older persisted scans)', () => {
    it('returns single-sentence headline when productsWithAnySignal is undefined', () => {
      const { headline, subline } = revenueLede({ low: 210_000, high: 480_000 });
      expect(headline).toBe(
        'Roughly £210k–£480k of annual demand is at risk while these stay suppressed.',
      );
      expect(subline).toBeNull();
    });

    it('returns single-sentence headline when productCount is undefined', () => {
      const { headline, subline } = revenueLede({
        low: 210_000,
        high: 480_000,
        productsWithAnySignal: 506,
      });
      expect(headline).toBe(
        'Roughly £210k–£480k of annual demand is at risk while these stay suppressed.',
      );
      expect(subline).toBeNull();
    });
  });
});
