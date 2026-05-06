import type { ActionFunctionArgs } from '@remix-run/node';
import { handleGdprDsarWebhook } from '../../gdpr-dsar-webhook.server';

/**
 * GDPR mandatory webhook: customers/data_request.
 * Shopify forwards a merchant customer's DSAR to us. We have 30 days to
 * respond. See memory/compliance-risk/incident-disclosure.md +
 * memory/product-engineering/security-posture.md.
 *
 * Flintmere does not store end-buyer PII; the response is typically
 * "we do not hold data for this customer." The audit row + queued
 * operator alert give us the durable proof we received the request and
 * acted on it within the 30-day window.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleGdprDsarWebhook({
    request,
    expectedTopic: 'CUSTOMERS_DATA_REQUEST',
  });
}
