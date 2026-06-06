import { describe, it, expect } from 'vitest';
import { track } from './analytics';

describe('track', () => {
  it('is a safe no-op without a browser window (SSR)', () => {
    // vitest environment is 'node' — window is undefined here.
    expect(() => track('scan_started', { domain: 'x.com' })).not.toThrow();
  });

  it('accepts events without props', () => {
    expect(() => track('email_captured')).not.toThrow();
  });
});
