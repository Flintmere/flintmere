import type { AdminApiContext } from '@shopify/shopify-app-remix/server';

/**
 * Shopify bulk-operation helpers per memory/product-engineering/shopify-api-rules.md.
 *
 * Bulk query we run on sync. Keep the field set minimal — every field widens the JSONL file.
 */
export const CATALOG_BULK_QUERY = /* GraphQL */ `
  query {
    products {
      edges {
        node {
          id
          handle
          title
          descriptionHtml
          vendor
          productType
          status
          tags
          publishedAt
          updatedAt
          media(first: 10) {
            edges {
              node {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                    width
                    height
                  }
                }
              }
            }
          }
          variants {
            edges {
              node {
                id
                sku
                barcode
                price
                compareAtPrice
                inventoryQuantity
                inventoryPolicy
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

export interface BulkOpHandle {
  id: string;
  status:
    | 'CREATED'
    | 'RUNNING'
    | 'COMPLETED'
    | 'CANCELED'
    | 'FAILED'
    | 'EXPIRED'
    | 'UNKNOWN';
  url?: string;
  partialUrl?: string;
  rootObjectCount?: number;
  errorCode?: string;
}

export async function startBulkCatalogQuery(
  admin: AdminApiContext,
): Promise<BulkOpHandle> {
  const response = await admin.graphql(
    /* GraphQL */ `
      mutation StartBulk($query: String!) {
        bulkOperationRunQuery(query: $query) {
          bulkOperation {
            id
            status
            errorCode
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    { variables: { query: CATALOG_BULK_QUERY } },
  );

  const payload = await response.json();
  const op = payload.data?.bulkOperationRunQuery?.bulkOperation;
  const errors = payload.data?.bulkOperationRunQuery?.userErrors ?? [];

  if (!op || errors.length > 0) {
    throw new Error(
      `bulk-op-start-failed: ${JSON.stringify(errors.map((e: { message: string }) => e.message))}`,
    );
  }

  return {
    id: op.id,
    status: op.status,
    errorCode: op.errorCode ?? undefined,
  };
}

/**
 * Poll currentBulkOperation until a terminal state is reached.
 */
export async function pollBulkOp(
  admin: AdminApiContext,
  options: { maxWaitMs?: number; pollIntervalMs?: number } = {},
): Promise<BulkOpHandle> {
  const { maxWaitMs = 10 * 60_000, pollIntervalMs = 5_000 } = options;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const response = await admin.graphql(/* GraphQL */ `
      {
        currentBulkOperation {
          id
          status
          url
          partialDataUrl
          rootObjectCount
          errorCode
        }
      }
    `);
    const payload = await response.json();
    const op = payload.data?.currentBulkOperation;

    if (!op) {
      throw new Error('bulk-op-missing');
    }

    if (
      op.status === 'COMPLETED' ||
      op.status === 'CANCELED' ||
      op.status === 'FAILED' ||
      op.status === 'EXPIRED'
    ) {
      return {
        id: op.id,
        status: op.status,
        url: op.url ?? undefined,
        partialUrl: op.partialDataUrl ?? undefined,
        rootObjectCount: op.rootObjectCount ?? undefined,
        errorCode: op.errorCode ?? undefined,
      };
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error('bulk-op-poll-timeout');
}
