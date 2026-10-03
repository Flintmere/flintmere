import { describe, expect, it } from 'vitest';
import { scanScopeLine } from './copy-scan-scope';

describe('scanScopeLine', () => {
  it('says nothing extra when every scanned product had its barcode read', () => {
    expect(
      scanScopeLine({ sampledCount: 40, actualProductCount: 40, truncated: false, barcodesRead: 40 }),
    ).toBe('Scanned 40 products · 60 seconds');
  });

  it('states the barcode count when it is smaller than the scan', () => {
    expect(
      scanScopeLine({ sampledCount: 1000, actualProductCount: 4312, truncated: true, barcodesRead: 50 }),
    ).toBe('Scanned 1,000 of 4,312 products · barcodes on 50 · 60 seconds');
  });

  it('says barcodes were not read rather than implying none exist', () => {
    expect(
      scanScopeLine({ sampledCount: 120, actualProductCount: 120, truncated: false, barcodesRead: 0 }),
    ).toBe('Scanned 120 products · barcodes not read · 60 seconds');
  });

  it('omits the clause entirely for a persisted scan with no barcode data', () => {
    expect(
      scanScopeLine({ sampledCount: 120, actualProductCount: 120, truncated: false }),
    ).toBe('Scanned 120 products · 60 seconds');
  });
});
