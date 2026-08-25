import { describe, expect, it } from 'vitest';
import { pickState } from './pick-state';

describe('pickState', () => {
  it('returns pre-verification when feature flag is off', () => {
    expect(pickState({ featureOn: false, connected: false })).toBe(
      'pre-verification',
    );
    // connected=true is impossible with the flag off (no row gets read),
    // but the dispatch must still pin to pre-verification — flag is gate.
    expect(pickState({ featureOn: false, connected: true })).toBe(
      'pre-verification',
    );
  });

  it('returns connect when feature on and no connection', () => {
    expect(pickState({ featureOn: true, connected: false })).toBe('connect');
  });

  it('returns connected when feature on and connection live', () => {
    expect(pickState({ featureOn: true, connected: true })).toBe('connected');
  });
});
