import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';

/**
 * GDPR mandatory webhook: customers/data_request.
 * Shopify forwards a merchant customer's DSAR to us. We have 30 days to respond.
 * See memory/compliance-risk/incident-disclosure.md + memory/product-engineering/security-posture.md.
 *
 * Flintmere does not store end-buyer PII; the response is typically "we do not hold data for this customer."
 * Operator is notified to confirm and reply within the window.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic !== 'CUSTOMERS_DATA_REQUEST') {
    return new Response('wrong topic', { status: 400 });
  }

  // Log the request. Operator handles the 30-day response window.
  // eslint-disable-next-line no-console
  console.info('[gdpr] customers/data_request', { shop, payload });

  // TODO(admin-ops): enqueue notification to operator with 30-day deadline.

  return new Response();
}
