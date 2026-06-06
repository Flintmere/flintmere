import { describe, expect, it } from 'vitest';

import {
  GmcApiError,
  type RequestFn,
  __testing,
  createMerchantApiClient,
} from './merchant-api';

const { normaliseAccount, normaliseProduct, deriveDestinationStatus, normaliseSeverity, mapGoogleError } =
  __testing;

const signal = new AbortController().signal;

describe('normaliseAccount', () => {
  it('extracts the numeric id from the resource name and keeps accountName', () => {
    expect(
      normaliseAccount({ name: 'accounts/123456789', accountName: 'Acme Foods' }),
    ).toEqual({ accountId: '123456789', accountName: 'Acme Foods', websiteUrl: null });
  });

  it('returns null when the resource carries no usable id', () => {
    expect(normaliseAccount({ accountName: 'No Name' })).toBeNull();
    expect(normaliseAccount({ name: '' })).toBeNull();
  });

  it('tolerates a bare id without the accounts/ prefix', () => {
    expect(normaliseAccount({ name: '42' })).toMatchObject({ accountId: '42' });
  });
});

describe('deriveDestinationStatus', () => {
  it('disapproved wins over pending and approved', () => {
    expect(
      deriveDestinationStatus({
        approvedCountries: ['GB'],
        pendingCountries: ['IE'],
        disapprovedCountries: ['FR'],
      }),
    ).toBe('disapproved');
  });

  it('pending wins over approved', () => {
    expect(
      deriveDestinationStatus({ approvedCountries: ['GB'], pendingCountries: ['IE'] }),
    ).toBe('pending');
  });

  it('approved when only approved countries exist', () => {
    expect(deriveDestinationStatus({ approvedCountries: ['GB'] })).toBe('approved');
  });

  it('unknown when all arrays are empty or missing', () => {
    expect(deriveDestinationStatus({})).toBe('unknown');
    expect(deriveDestinationStatus({ approvedCountries: [] })).toBe('unknown');
  });
});

describe('normaliseSeverity', () => {
  it('maps the Merchant API enum onto the domain split', () => {
    expect(normaliseSeverity('DISAPPROVED')).toBe('error');
    expect(normaliseSeverity('DEMOTED')).toBe('warning');
    expect(normaliseSeverity('NOT_IMPACTED')).toBe('warning');
    expect(normaliseSeverity('SEVERITY_UNSPECIFIED')).toBe('unknown');
    expect(normaliseSeverity('')).toBe('unknown');
  });
});

describe('normaliseProduct', () => {
  it('maps a Merchant API product onto ProductStatusEntry', () => {
    const entry = normaliseProduct({
      name: 'accounts/123/products/en~GB~sku-1',
      offerId: 'sku-1',
      productAttributes: { title: 'Raw Honey 340g' },
      productStatus: {
        destinationStatuses: [
          {
            reportingContext: 'SHOPPING_ADS',
            approvedCountries: ['GB'],
            disapprovedCountries: ['FR'],
          },
        ],
        itemLevelIssues: [
          {
            code: 'missing_value',
            severity: 'DISAPPROVED',
            description: 'Missing value [gtin]',
            attribute: 'gtin',
            reportingContext: 'SHOPPING_ADS',
          },
        ],
      },
    });

    expect(entry).toEqual({
      offerId: 'sku-1',
      title: 'Raw Honey 340g',
      destinationStatuses: [{ destination: 'SHOPPING_ADS', status: 'disapproved' }],
      itemLevelIssues: [
        {
          code: 'missing_value',
          description: 'Missing value [gtin]',
          severity: 'error',
          attributeName: 'gtin',
        },
      ],
    });
  });

  it('fails soft on a sparse product', () => {
    expect(normaliseProduct({})).toEqual({
      offerId: '',
      title: '',
      destinationStatuses: [],
      itemLevelIssues: [],
    });
  });
});

describe('mapGoogleError', () => {
  const gaxios = (status: number, body?: { message?: string; status?: string }) => ({
    response: { status, data: { error: body } },
    message: body?.message ?? 'http error',
  });

  it('401 → invalid_grant', () => {
    expect(mapGoogleError(gaxios(401)).code).toBe('invalid_grant');
  });

  it('403 PERMISSION_DENIED → account_suspended', () => {
    expect(
      mapGoogleError(gaxios(403, { status: 'PERMISSION_DENIED', message: 'nope' })).code,
    ).toBe('account_suspended');
  });

  it('403 (other) and 429 → quota', () => {
    expect(mapGoogleError(gaxios(403, { message: 'rate' })).code).toBe('quota');
    expect(mapGoogleError(gaxios(429)).code).toBe('quota');
  });

  it('abort → timeout', () => {
    const abort = Object.assign(new Error('The request was aborted'), {
      name: 'AbortError',
    });
    expect(mapGoogleError(abort).code).toBe('timeout');
  });

  it('anything else → unexpected', () => {
    expect(mapGoogleError(new Error('boom')).code).toBe('unexpected');
  });
});

describe('createMerchantApiClient (injected transport)', () => {
  it('listAccounts follows nextPageToken to exhaustion', async () => {
    const calls: string[] = [];
    const requestFn: RequestFn = async ({ url }) => {
      calls.push(url);
      if (!url.includes('pageToken')) {
        return {
          data: {
            accounts: [{ name: 'accounts/1', accountName: 'A' }],
            nextPageToken: 'p2',
          },
        };
      }
      return { data: { accounts: [{ name: 'accounts/2', accountName: 'B' }] } };
    };

    const client = createMerchantApiClient('rt', requestFn);
    const accounts = await client.listAccounts({ signal });

    expect(accounts.map((a) => a.accountId)).toEqual(['1', '2']);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('https://merchantapi.googleapis.com/accounts/v1/accounts');
    expect(calls[1]).toContain('pageToken=p2');
  });

  it('listProductStatuses hits products/v1 with page params and returns the token', async () => {
    let seenUrl = '';
    const requestFn: RequestFn = async ({ url }) => {
      seenUrl = url;
      return {
        data: {
          products: [{ offerId: 'sku-1', productAttributes: { title: 'T' } }],
          nextPageToken: 'next',
        },
      };
    };

    const client = createMerchantApiClient('rt', requestFn);
    const page = await client.listProductStatuses({
      merchantId: '123',
      pageToken: 'tok',
      signal,
    });

    expect(seenUrl).toContain(
      'https://merchantapi.googleapis.com/products/v1/accounts/123/products',
    );
    expect(seenUrl).toContain('pageSize=250');
    expect(seenUrl).toContain('pageToken=tok');
    expect(page.resources[0]?.offerId).toBe('sku-1');
    expect(page.nextPageToken).toBe('next');
  });

  it('wraps transport failures in GmcApiError', async () => {
    const requestFn: RequestFn = async () => {
      throw { response: { status: 401, data: { error: { message: 'expired' } } } };
    };
    const client = createMerchantApiClient('rt', requestFn);
    await expect(client.listAccounts({ signal })).rejects.toBeInstanceOf(GmcApiError);
    await expect(
      client.listProductStatuses({ merchantId: '1', signal }),
    ).rejects.toMatchObject({ code: 'invalid_grant' });
  });
});
