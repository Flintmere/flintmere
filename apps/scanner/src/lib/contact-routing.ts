/**
 * Contact-form topic → inbox routing.
 *
 * The contact form is the ONLY public route to any Flintmere inbox — no
 * mailto: links anywhere on the site, no exceptions for security / press /
 * billing (per `memory/feedback_no_mailto_links_anywhere.md`, locked
 * 2026-05-03; mailto sweep landed Phase 2 2026-05-03). All form
 * submissions land in scanner_contact_messages and the route handler
 * forwards each to the inbox below by topic. The persisted row keeps
 * `routed_to` for traceability so historical routing decisions stay
 * auditable when the matrix changes.
 *
 * Sole non-surface mailto in the codebase: the `List-Unsubscribe` header
 * in `app/api/lead/route.ts` carries both an HTTPS unsubscribe URL and a
 * `mailto:` form per RFC 8058 — that's an outbound email-delivery
 * standard, not a public site link, and is not in scope for the rule.
 */

import { ContactTopic } from '@/generated/prisma';

const SUPPORT_EMAIL = 'support@flintmere.com';
const PRIVACY_EMAIL = 'privacy@flintmere.com';
const SECURITY_EMAIL = 'security@flintmere.com';
const BILLING_EMAIL = 'billing@flintmere.com';
const LEGAL_EMAIL = 'legal@flintmere.com';
const FOUNDER_EMAIL = 'john@flintmere.com';

const ROUTING: Record<ContactTopic, string> = {
  general: SUPPORT_EMAIL,
  privacy: PRIVACY_EMAIL,
  security: SECURITY_EMAIL,
  billing: BILLING_EMAIL,
  legal: LEGAL_EMAIL,
  plus: FOUNDER_EMAIL,
  concierge: FOUNDER_EMAIL,
  partnership: FOUNDER_EMAIL,
};

export function inboxForTopic(topic: ContactTopic): string {
  return ROUTING[topic];
}

const TOPIC_LABELS: Record<ContactTopic, string> = {
  general: 'General enquiry',
  privacy: 'Privacy / DPA',
  security: 'Security report',
  billing: 'Billing',
  legal: 'Legal / contracts',
  plus: 'Plus tier enquiry',
  concierge: 'Catalog letter',
  partnership: 'Partnership / press',
};

export function labelForTopic(topic: ContactTopic): string {
  return TOPIC_LABELS[topic];
}

export const ALL_TOPICS: readonly ContactTopic[] = [
  'general',
  'privacy',
  'security',
  'billing',
  'legal',
  'plus',
  'concierge',
  'partnership',
] as const;
