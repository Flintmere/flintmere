import { beforeEach, describe, expect, it, vi } from 'vitest'

const lookupMock = vi.fn()

vi.mock('node:dns/promises', () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}))

import {
  assertPublicHost,
  isPrivateHostLiteral,
  isPrivateIPv4,
  isPrivateIPv6,
  SsrfBlockedError,
} from './ssrf'

describe('isPrivateIPv4', () => {
  it('flags every RFC1918 + loopback + reserved range', () => {
    expect(isPrivateIPv4('10.0.0.1')).toBe(true)
    expect(isPrivateIPv4('10.255.255.255')).toBe(true)
    expect(isPrivateIPv4('127.0.0.1')).toBe(true)
    expect(isPrivateIPv4('0.0.0.0')).toBe(true)
    expect(isPrivateIPv4('169.254.169.254')).toBe(true)
    expect(isPrivateIPv4('192.168.1.1')).toBe(true)
    expect(isPrivateIPv4('172.16.0.1')).toBe(true)
    expect(isPrivateIPv4('172.31.255.255')).toBe(true)
    expect(isPrivateIPv4('100.64.0.1')).toBe(true)
    expect(isPrivateIPv4('100.127.255.255')).toBe(true)
    expect(isPrivateIPv4('224.0.0.1')).toBe(true)
    expect(isPrivateIPv4('239.255.255.255')).toBe(true)
    expect(isPrivateIPv4('255.255.255.255')).toBe(true)
  })

  it('passes public ranges including the 172.32+ boundary', () => {
    expect(isPrivateIPv4('1.1.1.1')).toBe(false)
    expect(isPrivateIPv4('8.8.8.8')).toBe(false)
    expect(isPrivateIPv4('172.15.0.1')).toBe(false)
    expect(isPrivateIPv4('172.32.0.1')).toBe(false)
    expect(isPrivateIPv4('192.167.1.1')).toBe(false)
    expect(isPrivateIPv4('100.63.255.255')).toBe(false)
    expect(isPrivateIPv4('100.128.0.1')).toBe(false)
    expect(isPrivateIPv4('203.0.113.1')).toBe(false)
  })

  it('returns false for non-IPv4 strings', () => {
    expect(isPrivateIPv4('localhost')).toBe(false)
    expect(isPrivateIPv4('::1')).toBe(false)
    expect(isPrivateIPv4('10.0.0')).toBe(false)
    expect(isPrivateIPv4('not-an-ip')).toBe(false)
  })
})

describe('isPrivateIPv6', () => {
  it('flags loopback + ULA + link-local + multicast', () => {
    expect(isPrivateIPv6('::1')).toBe(true)
    expect(isPrivateIPv6('::')).toBe(true)
    expect(isPrivateIPv6('fc00::1')).toBe(true)
    expect(isPrivateIPv6('fd12:3456:789a::1')).toBe(true)
    expect(isPrivateIPv6('fe80::1')).toBe(true)
    expect(isPrivateIPv6('feab::1')).toBe(true)
    expect(isPrivateIPv6('ff02::1')).toBe(true)
    expect(isPrivateIPv6('0100::1')).toBe(true)
  })

  it('flags IPv4-mapped IPv6 pointing at private IPv4', () => {
    expect(isPrivateIPv6('::ffff:10.0.0.1')).toBe(true)
    expect(isPrivateIPv6('::ffff:127.0.0.1')).toBe(true)
    expect(isPrivateIPv6('::ffff:192.168.1.1')).toBe(true)
  })

  it('passes IPv4-mapped IPv6 pointing at public IPv4', () => {
    expect(isPrivateIPv6('::ffff:1.1.1.1')).toBe(false)
    expect(isPrivateIPv6('::ffff:8.8.8.8')).toBe(false)
  })

  it('strips brackets and is case-insensitive', () => {
    expect(isPrivateIPv6('[::1]')).toBe(true)
    expect(isPrivateIPv6('FE80::1')).toBe(true)
    expect(isPrivateIPv6('FC00::abcd')).toBe(true)
  })

  it('passes public IPv6 (Google + Cloudflare)', () => {
    expect(isPrivateIPv6('2001:4860:4860::8888')).toBe(false)
    expect(isPrivateIPv6('2606:4700:4700::1111')).toBe(false)
  })

  it('returns false for non-IPv6 strings', () => {
    expect(isPrivateIPv6('127.0.0.1')).toBe(false)
    expect(isPrivateIPv6('example.com')).toBe(false)
  })
})

describe('isPrivateHostLiteral', () => {
  it('flags well-known private hostnames', () => {
    expect(isPrivateHostLiteral('localhost')).toBe(true)
    expect(isPrivateHostLiteral('LOCALHOST')).toBe(true)
    expect(isPrivateHostLiteral('ip6-localhost')).toBe(true)
    expect(isPrivateHostLiteral('ip6-loopback')).toBe(true)
    expect(isPrivateHostLiteral('broadcasthost')).toBe(true)
  })

  it('flags suffix-blocked TLDs', () => {
    expect(isPrivateHostLiteral('printer.local')).toBe(true)
    expect(isPrivateHostLiteral('server.localhost')).toBe(true)
    expect(isPrivateHostLiteral('admin.internal')).toBe(true)
  })

  it('flags IPv4 + IPv6 literals via the helpers', () => {
    expect(isPrivateHostLiteral('127.0.0.1')).toBe(true)
    expect(isPrivateHostLiteral('169.254.169.254')).toBe(true)
    expect(isPrivateHostLiteral('::1')).toBe(true)
    expect(isPrivateHostLiteral('fc00::1')).toBe(true)
  })

  it('passes public hostnames', () => {
    expect(isPrivateHostLiteral('shopify.com')).toBe(false)
    expect(isPrivateHostLiteral('example.myshopify.com')).toBe(false)
    expect(isPrivateHostLiteral('1.1.1.1')).toBe(false)
  })
})

describe('assertPublicHost', () => {
  beforeEach(() => {
    lookupMock.mockReset()
  })

  it('throws empty for an empty host', async () => {
    await expect(assertPublicHost('')).rejects.toBeInstanceOf(SsrfBlockedError)
    expect(lookupMock).not.toHaveBeenCalled()
  })

  it('throws on a literal private hostname before resolving', async () => {
    await expect(assertPublicHost('localhost')).rejects.toMatchObject({
      name: 'SsrfBlockedError',
      reason: 'literal',
    })
    expect(lookupMock).not.toHaveBeenCalled()
  })

  it('throws on a literal private IPv4 without resolving', async () => {
    await expect(assertPublicHost('127.0.0.1')).rejects.toMatchObject({
      reason: 'literal',
    })
    expect(lookupMock).not.toHaveBeenCalled()
  })

  it('passes a public IP literal without resolving', async () => {
    await expect(assertPublicHost('1.1.1.1')).resolves.toBeUndefined()
    expect(lookupMock).not.toHaveBeenCalled()
  })

  it('passes a public hostname that resolves to public addresses', async () => {
    lookupMock.mockResolvedValueOnce([
      { address: '23.227.38.65', family: 4 },
      { address: '2620:127:f00f:7::1', family: 6 },
    ])
    await expect(assertPublicHost('shopify.com')).resolves.toBeUndefined()
    expect(lookupMock).toHaveBeenCalledWith('shopify.com', { all: true })
  })

  it('throws resolved-private when DNS returns a private IPv4', async () => {
    lookupMock.mockResolvedValueOnce([{ address: '10.0.0.5', family: 4 }])
    await expect(
      assertPublicHost('internal.example.com'),
    ).rejects.toMatchObject({
      name: 'SsrfBlockedError',
      reason: 'resolved-private',
    })
  })

  it('throws resolved-private when DNS returns a private IPv6', async () => {
    lookupMock.mockResolvedValueOnce([{ address: 'fc00::1', family: 6 }])
    await expect(
      assertPublicHost('internal.example.com'),
    ).rejects.toMatchObject({
      reason: 'resolved-private',
    })
  })

  it('throws resolved-private when DNS returns the AWS metadata address', async () => {
    lookupMock.mockResolvedValueOnce([
      { address: '169.254.169.254', family: 4 },
    ])
    await expect(
      assertPublicHost('metadata.example'),
    ).rejects.toMatchObject({ reason: 'resolved-private' })
  })

  it('blocks even when ONE of multiple resolved addresses is private', async () => {
    lookupMock.mockResolvedValueOnce([
      { address: '23.227.38.65', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ])
    await expect(assertPublicHost('mixed.example')).rejects.toMatchObject({
      reason: 'resolved-private',
    })
  })

  it('treats DNS failure as non-blocking (caller surfaces unreachable)', async () => {
    lookupMock.mockRejectedValueOnce(new Error('ENOTFOUND'))
    await expect(
      assertPublicHost('nonexistent.example'),
    ).resolves.toBeUndefined()
  })

  it('passes when DNS returns an empty list', async () => {
    lookupMock.mockResolvedValueOnce([])
    await expect(assertPublicHost('nodata.example')).resolves.toBeUndefined()
  })
})
