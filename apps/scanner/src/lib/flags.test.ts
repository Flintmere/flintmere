import { describe, it, expect } from 'vitest';
import { isFlagEnabled, getFlagPayload } from './flags';

describe('flags', () => {
  it('returns false / undefined safely outside the browser', () => {
    expect(isFlagEnabled('any_flag')).toBe(false);
    expect(getFlagPayload('any_flag')).toBeUndefined();
  });
});
