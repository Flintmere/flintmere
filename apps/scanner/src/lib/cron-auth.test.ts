import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { verifyAgentSecret, verifyCronSecret } from './cron-auth'

const VALID_SECRET = 'a'.repeat(40)

describe('verifyCronSecret', () => {
  let original: string | undefined

  beforeEach(() => {
    original = process.env.CRON_SECRET
  })

  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  it('returns 503 when CRON_SECRET is unset', () => {
    delete process.env.CRON_SECRET
    const result = verifyCronSecret('anything')
    expect(result?.status).toBe(503)
  })

  it('returns 503 when CRON_SECRET is shorter than 32 chars', () => {
    process.env.CRON_SECRET = 'short'
    const result = verifyCronSecret('anything')
    expect(result?.status).toBe(503)
  })

  it('returns 403 when supplied header is null', () => {
    process.env.CRON_SECRET = VALID_SECRET
    const result = verifyCronSecret(null)
    expect(result?.status).toBe(403)
  })

  it('returns 403 when supplied header is empty', () => {
    process.env.CRON_SECRET = VALID_SECRET
    const result = verifyCronSecret('')
    expect(result?.status).toBe(403)
  })

  it('returns 403 when supplied header mismatches', () => {
    process.env.CRON_SECRET = VALID_SECRET
    const result = verifyCronSecret('b'.repeat(40))
    expect(result?.status).toBe(403)
  })

  it('returns 403 when supplied is a different length than expected', () => {
    process.env.CRON_SECRET = VALID_SECRET
    // Length-mismatch must NOT short-circuit. The digest comparison
    // produces equal-length buffers regardless of input length.
    const result = verifyCronSecret('a'.repeat(10))
    expect(result?.status).toBe(403)
  })

  it('returns null when supplied matches CRON_SECRET', () => {
    process.env.CRON_SECRET = VALID_SECRET
    const result = verifyCronSecret(VALID_SECRET)
    expect(result).toBeNull()
  })
})

describe('verifyAgentSecret', () => {
  let originalAgent: string | undefined
  let originalCron: string | undefined

  beforeEach(() => {
    originalAgent = process.env.AGENT_API_SECRET
    originalCron = process.env.CRON_SECRET
  })

  afterEach(() => {
    if (originalAgent === undefined) delete process.env.AGENT_API_SECRET
    else process.env.AGENT_API_SECRET = originalAgent
    if (originalCron === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = originalCron
  })

  it('returns 503 when AGENT_API_SECRET is unset', () => {
    delete process.env.AGENT_API_SECRET
    const result = verifyAgentSecret('anything')
    expect(result?.status).toBe(503)
  })

  it('returns 403 when supplied header mismatches', () => {
    process.env.AGENT_API_SECRET = VALID_SECRET
    const result = verifyAgentSecret('b'.repeat(40))
    expect(result?.status).toBe(403)
  })

  it('does NOT accept the cron secret — scopes are separate', () => {
    process.env.AGENT_API_SECRET = VALID_SECRET
    process.env.CRON_SECRET = 'c'.repeat(40)
    const result = verifyAgentSecret('c'.repeat(40))
    expect(result?.status).toBe(403)
  })

  it('returns null when supplied matches AGENT_API_SECRET', () => {
    process.env.AGENT_API_SECRET = VALID_SECRET
    const result = verifyAgentSecret(VALID_SECRET)
    expect(result).toBeNull()
  })
})
