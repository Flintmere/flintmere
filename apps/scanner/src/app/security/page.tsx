import type { Metadata } from 'next';
import { LegalShell, Clause } from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Security',
  description:
    'How Flintmere secures Shopify tokens, catalog data, and customer information. Encryption, HMAC, TLS, incident response.',
};

export default function Security() {
  return (
    <LegalShell
      eyebrow="Security"
      title="What we do to protect your store."
      summary="Shopify access tokens are encrypted at rest with a key stored outside the database. Every webhook is HMAC-verified. Everything on the wire uses TLS 1.2 or better. We scan dependencies automatically and have a written incident-response runbook. If you find a vulnerability, email security@flintmere.com and we&rsquo;ll respond within 24 hours."
      lastUpdated="2026-04-23"
      anchorNumeral="03"
    >
      <Clause n="01" heading="Encryption at rest">
        <p>
          Shopify access tokens are encrypted at rest using{' '}
          <strong>AES-256-GCM</strong>. The encryption key is stored in an
          environment secret outside the database — a database dump alone
          cannot decrypt tokens. Keys are rotated annually or on any suspected
          compromise.
        </p>
        <p className="mt-4">
          Other sensitive fields (webhook secrets, Stripe references,
          sub-processor API keys) are stored in our infrastructure secret
          store, never committed to source control.
        </p>
      </Clause>

      <Clause n="02" heading="Encryption in transit">
        <p>
          All traffic to <code>flintmere.com</code>,{' '}
          <code>audit.flintmere.com</code>, and <code>app.flintmere.com</code>{' '}
          uses <strong>TLS 1.2 or higher</strong> with modern cipher suites.
          HTTP is redirected to HTTPS. HSTS is enabled on all subdomains.
        </p>
      </Clause>

      <Clause n="03" heading="Webhook verification">
        <p>
          Every incoming Shopify webhook is verified by HMAC-SHA256 against
          the shared secret before we process it. Unverified webhooks are
          rejected with <code>401</code>. This protects against spoofed
          uninstall or GDPR webhooks.
        </p>
        <p className="mt-4">
          Mandatory Shopify compliance webhooks (
          <code>customers/data_request</code>, <code>customers/redact</code>,
          <code>shop/redact</code>, <code>app/uninstalled</code>) are handled
          within Shopify&rsquo;s published response windows.
        </p>
      </Clause>

      <Clause n="04" heading="Scope minimisation">
        <p>
          The Shopify app requests only <code>read_products</code> and{' '}
          <code>write_products</code>. We do not request customer, order,
          inventory, financial, shipping, or fulfillment scopes. If Shopify
          adds a scope in a future API version that we don&rsquo;t need, we
          keep the minimum.
        </p>
      </Clause>

      <Clause n="05" heading="Access control">
        <p>
          Production access is limited to two people by default. All
          production access is logged. We use short-lived tokens and hardware
          security keys for administrator authentication. We do not use shared
          logins.
        </p>
      </Clause>

      <Clause n="06" heading="Dependency and vulnerability management">
        <p>
          We run automated dependency scans on every commit. Critical and high
          CVEs are patched within 7 days; medium within 30; low within 90. We
          track Shopify API deprecation notices and migrate within one version
          of release.
        </p>
      </Clause>

      <Clause n="07" heading="Infrastructure and backups">
        <p>
          Flintmere runs on <strong>DigitalOcean</strong> (UK region) managed
          via <strong>Coolify</strong>. Postgres is backed up nightly with
          point-in-time recovery retained for 14 days. Backups are encrypted.
          We do not use cross-region replication outside the UK/EU.
        </p>
      </Clause>

      <Clause n="08" heading="Logging and monitoring">
        <p>
          Application errors are captured in <strong>Sentry (EU)</strong> with
          PII scrubbing at source. Uptime is monitored by{' '}
          <strong>BetterStack (EU)</strong>. Request logs retain 90 days hot,
          up to 13 months cold for fraud and abuse investigation. We do not
          log Shopify access tokens, customer PII, or payment card data.
        </p>
      </Clause>

      <Clause n="09" heading="Incident response">
        <p>
          We maintain a written incident-response runbook. On confirmed
          personal-data breach, we notify the ICO within 72 hours as required
          by UK GDPR Article 33, and affected individuals without undue delay
          where there is a high risk.
        </p>
        <p className="mt-4">
          Shopify partners are notified via the Partner Dashboard per
          Shopify&rsquo;s App Store requirements.
        </p>
      </Clause>

      <Clause n="10" heading="Responsible disclosure">
        <p>
          We welcome security research. Email{' '}
          <a href="mailto:security@flintmere.com" className="underline">
            security@flintmere.com
          </a>{' '}
          with findings. We will:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>Acknowledge your report within 24 hours</li>
          <li>Not pursue legal action for good-faith research</li>
          <li>Confirm resolution timelines within 5 working days</li>
          <li>
            Credit you publicly once the issue is fixed (unless you prefer
            anonymity)
          </li>
        </ul>
        <p className="mt-4">
          Please do not test against other merchants&rsquo; stores, extract
          data beyond what&rsquo;s needed to demonstrate the issue, or degrade
          service availability.
        </p>
      </Clause>

      <Clause n="11" heading="What we don't claim">
        <p>
          We&rsquo;re a small team. We are not currently ISO 27001 certified
          or SOC 2 audited. We do not claim PCI-DSS compliance because Stripe
          handles payment card data directly and we never see it. If your
          procurement requires a formal audit, contact us at{' '}
          <a href="mailto:security@flintmere.com" className="underline">
            security@flintmere.com
          </a>{' '}
          — we can walk you through our security questionnaire.
        </p>
      </Clause>
    </LegalShell>
  );
}
