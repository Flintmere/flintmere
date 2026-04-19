# platform-rules.md

External platform policy constraints. These rules belong to the platforms we depend on — they change without notice, so every pre-ship check re-verifies against the current policy.

`policy-alignment` is the skill that uses this file. Other skills consult it.

## Platforms in scope

| Platform | Why we care | Policy risk |
|---|---|---|
| **Shopify App Store** | Our primary distribution channel + sole install path for `app.flintmere.com` | App review, Built-for-Shopify requirements, merchant data rules, webhook uptime SLAs |
| **Shopify Partner Program** | Our commercial relationship with Shopify | Revenue share (0% first $1M, then 15%), incident reporting, GDPR webhook mandatory set |
| **Google Cloud / Vertex AI** | Primary LLM provider | Acceptable Use Policy, content policies on prompt inputs/outputs, data processing terms |
| **Azure OpenAI** | Fallback LLM provider | Content filtering posture, responsible AI requirements, region pinning obligations |
| **Stripe** | Agency + Enterprise direct invoicing + £97 concierge audit | Restricted Businesses list, Terms of Service |
| **Google Ads** | Possible paid acquisition (not day-one) | B2B SaaS advertising policies, editorial quality |
| **LinkedIn Ads** | Possible B2B acquisition channel | Professional content standards |
| **DigitalOcean + Coolify** | Hosting | AUP — prohibited content, abuse handling, uptime terms |
| **Resend** | Transactional email | Anti-spam policy, sender reputation, bounce handling |
| **Sentry** | Error tracking | Data processing terms, PII scrubbing |
| **GitHub** | Code hosting + CI | Community guidelines, export control |

## Primary constraint — Shopify App Store

### Built-for-Shopify requirements (pre-submission checklist)

- App Bridge v3+ integration verified
- Polaris UI throughout merchant-facing surfaces
- GDPR mandatory webhooks implemented: `customers/data_request`, `customers/redact`, `shop/redact`
- Webhook HMAC verification on every handler (no exceptions)
- 5-second webhook response budget met across all handlers
- OAuth scopes minimised and justified
- App listing copy accurate, no misleading claims
- Pricing displayed upfront; no hidden tiers
- App uninstall flow clean — tokens scrubbed within 60s of uninstall webhook
- Performance: embedded app loads within reasonable time inside Shopify admin iframe
- No modification of Shopify core admin chrome
- Support contact listed + responsive

### App listing content rules

- App name: Flintmere (no claim of "official", "certified", "approved" without authorisation)
- Descriptions: accurate per the claims-register
- Screenshots: actual app screenshots, not mockups
- Videos: short, no autoplay sound, captions recommended
- Keywords: relevant to the app's actual function; no keyword stuffing

### Shopify incident reporting

- Security incidents affecting merchant data → Partner Dashboard within reasonable time.
- Breaking changes to app behaviour → advance notice to merchants via in-app banner + email.
- Planned maintenance affecting >15 minutes of availability → merchant notification.

### Authoritative source

`https://shopify.dev/docs/apps/launch/app-requirements-checklist` (verify current URL before each submission).

## Google Cloud / Vertex AI

### Data processing posture

- Google's enterprise DPA covers our merchant catalog data as processor inputs.
- Region pinning (europe-west1, europe-west4) must be enforced in every call — never default region.
- Prompt data is **not** used for model training under our enterprise contract (verify this in the DPA before each quarterly review).
- Logs retained per Google's standard policy; we surface the retention window in our Privacy Policy.

### Content policy

- Do not send prompts that could be classified as harmful under Google's Acceptable Use Policy.
- Merchant catalog data is commercial product data — not a concern.
- Scanner user-submitted URLs: validate before including in prompts to avoid prompt-injection attempts.

### Authoritative sources

- `https://cloud.google.com/terms/data-processing-addendum`
- `https://cloud.google.com/vertex-ai/generative-ai/docs/responsible-ai`

## Azure OpenAI

- Content filtering is enabled by default; turning it off requires enterprise review.
- Responsible AI registration may be required depending on use case (Flintmere's use case is text generation for structured data — should be in the standard lane).
- Region pinning to EU (swedencentral or francecentral).
- Standard Microsoft enterprise DPA applies.

## Stripe — restricted businesses

- Flintmere is a B2B SaaS selling a subscription to a Shopify app. Fully supported on Stripe.
- We do not hold customer funds, do not process e-commerce payments for merchants, do not issue barcodes or other regulated items.
- Pre-launch action (already complete when account opens): confirm Stripe account approved for SaaS business model.
- Authoritative source: `https://stripe.com/restricted-businesses` (verify current URL).

## Google Ads + LinkedIn Ads

### Google Ads

- B2B SaaS ads are generally permitted.
- Avoid superlative claims ("#1", "best") without substantiation.
- Landing pages must match ad copy.
- Authoritative source: `https://support.google.com/adspolicy` (verify).

### LinkedIn Ads

- Professional content standards — avoid hype, clickbait, excessive emoji.
- Case-study content performs well but requires customer permission citations.
- Authoritative source: LinkedIn Advertising Guidelines page.

Note: no paid acquisition pre-launch. Advertising policies become active when we turn on paid acquisition — targeted for month 4+ per `SPEC.md` §9.

## Resend — email deliverability

- All sender domains properly authenticated (SPF, DKIM, DMARC).
- Unsubscribe link in every transactional-but-marketing-adjacent email (scanner reports, drift alerts).
- Pure transactional (password reset, OAuth confirmation) technically exempt but we include unsubscribe for simplicity.
- Bounce handling: remove hard-bounced addresses immediately; flag soft-bounces after 3 consecutive.
- Authoritative source: Resend sending policy + CAN-SPAM / PECR for compliance.

## Sentry — PII handling

- Default Sentry config scrubs email, IP, and common PII patterns. Verify scrubbing is on for our project.
- Never send Shopify access tokens to Sentry — they must be redacted in error messages before capture.
- Retention: 90 days hot, 13 months cold, then deleted.

## How this file is maintained

**Update on:**

- A platform changes its policy (we find out via news, platform email, account warning).
- A Flintmere campaign or app submission is rejected or blocked.
- A new platform enters our dependency graph.

**Do not update on:**

- Speculation about future policy.
- Internet rumours.
- "I think they changed the rule" without a link + date.

Every update cites a link + a date. Old policy versions are retained; append new notes, don't overwrite.

## When a platform's policy blocks us

1. `policy-alignment` identifies the block.
2. Produce a finding: which surface, which rule, what changed.
3. Route to the owning skill:
   - Marketing copy → `writer` + `conversion`.
   - Legal pages → `legal-page-draft`.
   - Engineering behaviour → `build-feature`.
   - App Store listing → `shopify-app-store-submission` (when that skill exists).
   - Billing → `implement-checkout-flow`.
4. Track in an issue; note the resolution date.
5. Update this file with the lesson.

## Changelog

- 2026-04-19: Rewritten for Flintmere. Removed Google Ads / Meta Ads cryptocurrency sections (not applicable to Flintmere). Added Shopify App Store as primary platform, Vertex AI + Azure OpenAI LLM platforms, Coolify hosting platform.
