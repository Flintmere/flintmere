/**
 * Daily health check — the canonical five-tab glance every brief opens
 * with. Hardcoded because the URLs never change and we want every
 * brief to surface them without LLM variability (compose was producing
 * its own "Daily health check" section with pipeline observations
 * instead of the tab list — confusing).
 *
 * The compose system prompt tells the LLM NOT to include its own
 * Daily health check section; the email template prepends this block
 * before the LLM-composed body. Single source of truth.
 *
 * If a URL changes, update here. If a tab is retired or its tool
 * swapped, update here and in the playbook in the same commit.
 */

import { SCANNER_HOST } from '../host-routing';

export const DAILY_HEALTH_CHECK_MARKDOWN = `## Daily health check

Five tabs, one glance each. ≤5 min. If anything red, drop a line into today's notes and surface in the next Claude session.

1. **BetterStack** — https://uptime.betterstack.com — any monitor red in the last 24h?
2. **Resend** — https://resend.com/emails — bounces or complaints since yesterday?
3. **PostHog** — https://eu.posthog.com — yesterday's pageviews + any replay worth watching (single project covers both \`flintmere.com\` and \`${SCANNER_HOST}\` — same Next.js app behind two domains). Note anything zero or unusually high.
4. **Admin outreach** — https://${SCANNER_HOST}/admin/outreach — queued / sent / replied. Anything stuck?
5. **Sentry** — https://sentry.io/organizations/flintmere/issues/?project=flintmere-scanner — any new error in 24h?

If all five clear, move on.

---
`;
