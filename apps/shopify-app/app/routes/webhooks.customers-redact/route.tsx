import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';

/**
 * GDPR mandatory webhook: customers/redact.
 * 30-day deadline to delete identified customer's PII. Flintmere does not store end-buyer PII by default,
 * so the operation is generally a no-op logged for audit. If any customer-level data exists (e.g. in logs),
 * it must be removed within the window.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic !== 'CUSTOMERS_REDACT') {
    return new Response('wrong topic', { status: 400 });
  }

  // eslint-disable-next-line no-console
  console.info('[gdpr] customers/redact', { shop, payload });

  return new Response();
}
