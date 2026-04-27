import type { Metadata } from 'next';
import { LegalShell, Clause } from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'How to get help with Flintmere — scanner, Shopify app, concierge audits. Response times by plan, security reporting, status page.',
};

export default function Support() {
  return (
    <LegalShell
      eyebrow="Support"
      title="How to get help."
      summary="One inbox per topic, real humans reading. Support is support@flintmere.com. Security is security@flintmere.com. Billing is billing@flintmere.com. We reply within one working day on the free scanner, same day on paid plans. The team reads every email for the first hundred customers."
      lastUpdated="2026-04-23"
      anchorNumeral="06"
    >
      <Clause n="01" heading="Who answers">
        <p>
          Flintmere is run by a small team in the UK. John Morris (founder)
          personally reads and replies to support for the first hundred paying
          customers. As the team grows, support will shift to a rota with the
          same response standards.
        </p>
      </Clause>

      <Clause n="02" heading="How to reach us">
        <div className="mt-4 border border-[color:var(--color-line)]">
          <div className="grid grid-cols-[auto_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p className="eyebrow" style={{ color: 'var(--color-mute)' }}>Product / how-to</p>
            <p>
              <a href="mailto:support@flintmere.com" className="underline">
                support@flintmere.com
              </a>
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p className="eyebrow" style={{ color: 'var(--color-mute)' }}>Billing and refunds</p>
            <p>
              <a href="mailto:billing@flintmere.com" className="underline">
                billing@flintmere.com
              </a>
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p className="eyebrow" style={{ color: 'var(--color-mute)' }}>Privacy and GDPR</p>
            <p>
              <a href="mailto:privacy@flintmere.com" className="underline">
                privacy@flintmere.com
              </a>
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p className="eyebrow" style={{ color: 'var(--color-mute)' }}>Security disclosure</p>
            <p>
              <a href="mailto:security@flintmere.com" className="underline">
                security@flintmere.com
              </a>
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-4 p-4">
            <p className="eyebrow" style={{ color: 'var(--color-mute)' }}>Legal and contracts</p>
            <p>
              <a href="mailto:legal@flintmere.com" className="underline">
                legal@flintmere.com
              </a>
            </p>
          </div>
        </div>
      </Clause>

      <Clause n="03" heading="Response times by plan">
        <div className="mt-4 border border-[color:var(--color-line)]">
          <div className="grid grid-cols-[180px_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p><strong>Free scanner</strong></p>
            <p>Reply within 1 working day. Best-effort.</p>
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p><strong>Growth £79/mo</strong></p>
            <p>Reply same working day during UK office hours.</p>
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p><strong>Scale £249/mo</strong></p>
            <p>Reply same working day. Priority queue.</p>
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p><strong>Agency £499/mo</strong></p>
            <p>
              Same working day. Dedicated Slack Connect channel on request.
            </p>
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-4 p-4 border-b border-[color:var(--color-line-soft)]">
            <p><strong>Plus from £1,500/mo</strong></p>
            <p>
              Contractual SLA per order form. Named contact with mobile
              number. Monthly review call.
            </p>
          </div>
          <div className="grid grid-cols-[180px_1fr] gap-4 p-4">
            <p><strong>Security reports</strong></p>
            <p>
              Acknowledged within 24 hours, 7 days a week.
            </p>
          </div>
        </div>
        <p className="mt-4">
          UK office hours are Monday–Friday, 09:00–17:30 Europe/London,
          excluding UK public holidays.
        </p>
      </Clause>

      <Clause n="04" heading="Status and uptime">
        <p>
          Live service status is published at{' '}
          <a href="https://status.flintmere.com" className="underline">
            status.flintmere.com
          </a>
          . Incidents are posted there within 10 minutes of detection. Root-
          cause post-mortems follow within 5 working days for any Severity 1
          or 2 incident.
        </p>
      </Clause>

      <Clause n="05" heading="What we need from you">
        <p>
          To help us help you quickly, please include:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            Your Shopify store domain (e.g. <code>yourstore.myshopify.com</code>)
          </li>
          <li>
            The scan ID (for scanner issues) or the exact step you were on
            (for app issues)
          </li>
          <li>
            A screenshot or the text of any error message
          </li>
          <li>
            The approximate time the issue occurred (so we can pull the right
            logs)
          </li>
        </ul>
      </Clause>

      <Clause n="06" heading="Feature requests">
        <p>
          We take feature requests seriously — many shipped features came
          from a customer email. Send them to{' '}
          <a href="mailto:support@flintmere.com" className="underline">
            support@flintmere.com
          </a>{' '}
          with the word <em>&ldquo;feature&rdquo;</em> in the subject line.
          We read them all and publish a quarterly roadmap summary.
        </p>
      </Clause>

      <Clause n="07" heading="Complaints and escalation">
        <p>
          If you aren&rsquo;t happy with the response you received, reply with
          the word <em>&ldquo;escalate&rdquo;</em> and the thread is routed
          directly to the founder. Unresolved complaints about personal data can be
          raised with the ICO:{' '}
          <a href="https://ico.org.uk/make-a-complaint/" className="underline">
            ico.org.uk/make-a-complaint
          </a>
          .
        </p>
      </Clause>
    </LegalShell>
  );
}
