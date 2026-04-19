import type { PrismaClient, Prisma } from '@prisma/client';
import type { ParsedProductBlock } from './streaming-parser.server';

/**
 * Transform Shopify bulk-op JSONL blocks into Prisma upsert payloads.
 * We store the raw payload alongside the typed columns so scoring + enrichment
 * can access any field Shopify returns, not just the ones we normalise.
 */

export interface ChunkWriteStats {
  productsUpserted: number;
  variantsUpserted: number;
}

export async function writeChunk(
  prisma: PrismaClient,
  shopDomain: string,
  blocks: ParsedProductBlock[],
): Promise<ChunkWriteStats> {
  let productsUpserted = 0;
  let variantsUpserted = 0;

  await prisma.$transaction(async (tx) => {
    for (const block of blocks) {
      const productRow = extractProduct(block);
      if (!productRow) continue;

      const product = await tx.product.upsert({
        where: {
          shopDomain_shopifyProductId: {
            shopDomain,
            shopifyProductId: productRow.shopifyProductId,
          },
        },
        update: {
          handle: productRow.handle,
          title: productRow.title,
          vendor: productRow.vendor,
          productType: productRow.productType,
          status: productRow.status,
          publishedAt: productRow.publishedAt,
          rawPayload: productRow.rawPayload as Prisma.InputJsonValue,
        },
        create: {
          shopDomain,
          shopifyProductId: productRow.shopifyProductId,
          handle: productRow.handle,
          title: productRow.title,
          vendor: productRow.vendor,
          productType: productRow.productType,
          status: productRow.status,
          publishedAt: productRow.publishedAt,
          rawPayload: productRow.rawPayload as Prisma.InputJsonValue,
        },
      });
      productsUpserted += 1;

      const variantRows = extractVariants(block, product.id);
      for (const row of variantRows) {
        await tx.variant.upsert({
          where: {
            productId_shopifyVariantId: {
              productId: row.productId,
              shopifyVariantId: row.shopifyVariantId,
            },
          },
          update: {
            sku: row.sku,
            barcode: row.barcode,
            price: row.price,
            inventoryQuantity: row.inventoryQuantity,
            rawPayload: row.rawPayload as Prisma.InputJsonValue,
          },
          create: row as Prisma.VariantCreateInput,
        });
        variantsUpserted += 1;
      }
    }
  });

  return { productsUpserted, variantsUpserted };
}

function extractProduct(block: ParsedProductBlock): {
  shopifyProductId: string;
  handle: string;
  title: string;
  vendor: string | null;
  productType: string | null;
  status: string;
  publishedAt: Date | null;
  rawPayload: unknown;
} | null {
  const p = block.product;
  const id = typeof p.id === 'string' ? p.id : null;
  const handle = typeof p.handle === 'string' ? p.handle : null;
  const title = typeof p.title === 'string' ? p.title : null;
  if (!id || !handle || !title) return null;

  return {
    shopifyProductId: id,
    handle,
    title,
    vendor: typeof p.vendor === 'string' ? p.vendor : null,
    productType: typeof p.productType === 'string' ? p.productType : null,
    status:
      typeof p.status === 'string' ? p.status.toLowerCase() : 'unknown',
    publishedAt:
      typeof p.publishedAt === 'string' ? new Date(p.publishedAt) : null,
    rawPayload: { ...p, children: block.children },
  };
}

function extractVariants(
  block: ParsedProductBlock,
  productId: string,
): Array<{
  productId: string;
  shopifyVariantId: string;
  sku: string | null;
  barcode: string | null;
  price: string;
  inventoryQuantity: number | null;
  rawPayload: unknown;
}> {
  const rows: Array<{
    productId: string;
    shopifyVariantId: string;
    sku: string | null;
    barcode: string | null;
    price: string;
    inventoryQuantity: number | null;
    rawPayload: unknown;
  }> = [];
  for (const child of block.children) {
    if (typeof child.id !== 'string') continue;
    if (!/\/ProductVariant\//.test(child.id)) continue;
    rows.push({
      productId,
      shopifyVariantId: child.id,
      sku: typeof child.sku === 'string' ? child.sku : null,
      barcode: typeof child.barcode === 'string' ? child.barcode : null,
      price: typeof child.price === 'string' ? child.price : '0.00',
      inventoryQuantity:
        typeof child.inventoryQuantity === 'number' ? child.inventoryQuantity : null,
      rawPayload: child,
    });
  }
  return rows;
}
