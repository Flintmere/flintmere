import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetRateLimitState,
  checkScanRateLimit,
  checkCheckoutRateLimit,
} from './rate-limit'

const FIXED_NOW = 1_700_000_000_000

describe('checkScanRateLimit — per-IP token bucket', () => {
  beforeEach(() => {
    __resetRateLimitState()
  })

  it('allows the full burst of 6 from one IP and blocks the 7th', () => {
    for (let i = 0; i < 6; i++) {
      const r = checkScanRateLimit({
        ip: '203.0.113.1',
        normalisedDomain: `shop-${i}.myshopify.com`,
        now: FIXED_NOW + i,
      })
      expect(r.ok).toBe(true)
    }

    const blocked = checkScanRateLimit({
      ip: '203.0.113.1',
      normalisedDomain: 'shop-7.myshopify.com',
      now: FIXED_NOW + 100,
    })
    expect(blocked.ok).toBe(false)
    expect(blocked.reason).toBe('ip')
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it('does not refill before ~60s and does refill afterwards', () => {
    for (let i = 0; i < 6; i++) {
      checkScanRateLimit({
        ip: '203.0.113.2',
        normalisedDomain: `s-${i}.myshopify.com`,
        now: FIXED_NOW,
      })
    }

    const stillBlocked = checkScanRateLimit({
      ip: '203.0.113.2',
      normalisedDomain: 's-x.myshopify.com',
      now: FIXED_NOW + 30_000,
    })
    expect(stillBlocked.ok).toBe(false)

    // Comfortably past one full token's worth of refill (60s) — covers
    // floating-point drift from earlier partial-refill calls bumping
    // updatedAt mid-window.
    const recovered = checkScanRateLimit({
      ip: '203.0.113.2',
      normalisedDomain: 's-y.myshopify.com',
      now: FIXED_NOW + 120_000,
    })
    expect(recovered.ok).toBe(true)
  })

  it('keeps separate buckets per IP', () => {
    for (let i = 0; i < 6; i++) {
      checkScanRateLimit({
        ip: '203.0.113.3',
        normalisedDomain: `a-${i}.myshopify.com`,
        now: FIXED_NOW + i,
      })
    }

    const otherIp = checkScanRateLimit({
      ip: '203.0.113.4',
      normalisedDomain: 'b-0.myshopify.com',
      now: FIXED_NOW + 50,
    })
    expect(otherIp.ok).toBe(true)
  })

  it('null IP collapses to a shared "anon" bucket', () => {
    for (let i = 0; i < 6; i++) {
      checkScanRateLimit({
        ip: null,
        normalisedDomain: `n-${i}.myshopify.com`,
        now: FIXED_NOW + i,
      })
    }
    const blocked = checkScanRateLimit({
      ip: null,
      normalisedDomain: 'n-7.myshopify.com',
      now: FIXED_NOW + 100,
    })
    expect(blocked.ok).toBe(false)
    expect(blocked.reason).toBe('ip')
  })
})

describe('checkScanRateLimit — per-domain dedupe', () => {
  beforeEach(() => {
    __resetRateLimitState()
  })

  it('blocks a fresh scan of the same domain within 30s — even from a new IP', () => {
    const first = checkScanRateLimit({
      ip: '203.0.113.10',
      normalisedDomain: 'gymshark.myshopify.com',
      now: FIXED_NOW,
    })
    expect(first.ok).toBe(true)

    const second = checkScanRateLimit({
      ip: '203.0.113.11',
      normalisedDomain: 'gymshark.myshopify.com',
      now: FIXED_NOW + 10_000,
    })
    expect(second.ok).toBe(false)
    expect(second.reason).toBe('domain')
    expect(second.retryAfterSec).toBeGreaterThan(0)
    expect(second.retryAfterSec).toBeLessThanOrEqual(30)
  })

  it('allows the same domain again after the 30s window passes', () => {
    checkScanRateLimit({
      ip: '203.0.113.12',
      normalisedDomain: 'allbirds.myshopify.com',
      now: FIXED_NOW,
    })

    const after = checkScanRateLimit({
      ip: '203.0.113.12',
      normalisedDomain: 'allbirds.myshopify.com',
      now: FIXED_NOW + 30_001,
    })
    expect(after.ok).toBe(true)
  })

  it('domain dedupe takes precedence over IP-bucket exhaustion', () => {
    checkScanRateLimit({
      ip: '203.0.113.13',
      normalisedDomain: 'shop.myshopify.com',
      now: FIXED_NOW,
    })

    const r = checkScanRateLimit({
      ip: '203.0.113.99',
      normalisedDomain: 'shop.myshopify.com',
      now: FIXED_NOW + 5_000,
    })
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('domain')
  })
})

describe('checkCheckoutRateLimit — per-email + per-IP', () => {
  beforeEach(() => {
    __resetRateLimitState()
  })

  it('allows the full burst of 5 from one email and blocks the 6th', () => {
    for (let i = 0; i < 5; i++) {
      const r = checkCheckoutRateLimit({
        email: 'merchant@store.com',
        ip: `203.0.113.${i + 1}`, // varying IPs so per-IP doesn't fire
        now: FIXED_NOW + i,
      })
      expect(r.ok).toBe(true)
    }

    const blocked = checkCheckoutRateLimit({
      email: 'merchant@store.com',
      ip: '203.0.113.99',
      now: FIXED_NOW + 100,
    })
    expect(blocked.ok).toBe(false)
    expect(blocked.reason).toBe('email')
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it('per-IP cap kicks in at 20 attempts even when emails rotate', () => {
    for (let i = 0; i < 20; i++) {
      const r = checkCheckoutRateLimit({
        email: `attacker-${i}@bot.com`, // distinct emails so per-email doesn't fire
        ip: '203.0.113.50',
        now: FIXED_NOW + i,
      })
      expect(r.ok).toBe(true)
    }

    const blocked = checkCheckoutRateLimit({
      email: 'attacker-21@bot.com',
      ip: '203.0.113.50',
      now: FIXED_NOW + 100,
    })
    expect(blocked.ok).toBe(false)
    expect(blocked.reason).toBe('ip')
  })

  it('email is normalised to lowercase + trim so case-tricks do not bypass', () => {
    for (let i = 0; i < 5; i++) {
      checkCheckoutRateLimit({
        email: 'merchant@store.com',
        ip: `203.0.113.${i + 1}`,
        now: FIXED_NOW + i,
      })
    }

    const sneaky = checkCheckoutRateLimit({
      email: '  Merchant@Store.com  ',
      ip: '203.0.113.99',
      now: FIXED_NOW + 100,
    })
    expect(sneaky.ok).toBe(false)
    expect(sneaky.reason).toBe('email')
  })

  it('per-email block does not consume IP budget for the same caller', () => {
    // Burn the email budget.
    for (let i = 0; i < 5; i++) {
      checkCheckoutRateLimit({
        email: 'shared@store.com',
        ip: '203.0.113.70',
        now: FIXED_NOW + i,
      })
    }

    // Email-blocked attempt — should report 'email', not 'ip'.
    const r1 = checkCheckoutRateLimit({
      email: 'shared@store.com',
      ip: '203.0.113.70',
      now: FIXED_NOW + 100,
    })
    expect(r1.ok).toBe(false)
    expect(r1.reason).toBe('email')

    // A different email from the same IP still has 15 IP tokens left
    // (5 consumed by the legit attempts, 0 by the blocked attempt above).
    let allowed = 0
    for (let i = 0; i < 15; i++) {
      const r = checkCheckoutRateLimit({
        email: `other-${i}@store.com`,
        ip: '203.0.113.70',
        now: FIXED_NOW + 200 + i,
      })
      if (r.ok) allowed += 1
    }
    expect(allowed).toBe(15)
  })

  it('refill restores budget after the policy window', () => {
    for (let i = 0; i < 5; i++) {
      checkCheckoutRateLimit({
        email: 'recovery@store.com',
        ip: `203.0.113.${i + 1}`,
        now: FIXED_NOW + i,
      })
    }

    // 1 hour later — full refill.
    const recovered = checkCheckoutRateLimit({
      email: 'recovery@store.com',
      ip: '203.0.113.99',
      now: FIXED_NOW + 3_600_000,
    })
    expect(recovered.ok).toBe(true)
  })
})

describe('__resetRateLimitState', () => {
  it('clears bucket + dedupe state between tests', () => {
    for (let i = 0; i < 6; i++) {
      checkScanRateLimit({
        ip: '203.0.113.50',
        normalisedDomain: `r-${i}.myshopify.com`,
        now: FIXED_NOW + i,
      })
    }
    const blockedBefore = checkScanRateLimit({
      ip: '203.0.113.50',
      normalisedDomain: 'r-x.myshopify.com',
      now: FIXED_NOW + 100,
    })
    expect(blockedBefore.ok).toBe(false)

    __resetRateLimitState()

    const freshAfter = checkScanRateLimit({
      ip: '203.0.113.50',
      normalisedDomain: 'r-y.myshopify.com',
      now: FIXED_NOW + 200,
    })
    expect(freshAfter.ok).toBe(true)
  })
})
