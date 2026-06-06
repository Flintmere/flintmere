import { describe, it, expect } from 'vitest';
import { captureServerEvent } from './analytics-server';

describe('captureServerEvent', () => {
  it('resolves without throwing when the key is a stub', async () => {
    await expect(
      captureServerEvent('concierge_paid', { shop: 'x.myshopify.com' }),
    ).resolves.toBeUndefined();
  });
});
