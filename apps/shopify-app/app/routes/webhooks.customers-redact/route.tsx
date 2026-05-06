import type { ActionFunctionArgs } from '@remix-run/node';
import { handleGdprDsarWebhook } from '../../gdpr-dsar-webhook.server';

/**
 * GDPR mandatory webhook: customers/redact.
 * 30-day deadline to delete identified customer's PII. Flintmere does not
 * store end-buyer PII by default, so the operation is generally a no-op
 * recorded for audit. If any customer-level data exists, the operator
 * removes it within the window — the audit row + alert make that visible.
 */
export async function action({ request }: ActionFunctionArgs) {
  return handleGdprDsarWebhook({
    request,
    expectedTopic: 'CUSTOMERS_REDACT',
  });
}
