import type { Metadata } from 'next';
import { LegalShell, Clause } from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Data Processing Agreement',
  description:
    'Flintmere Data Processing Agreement for Shopify merchants and agency customers. Incorporates UK SCCs and International Data Transfer Addendum.',
};

export default function DPA() {
  return (
    <LegalShell
      eyebrow="DPA"
      title="Data Processing Agreement."
      summary="You are the controller, we are the processor. This page is the full written DPA that applies when you install the Shopify app or take out a paid plan. It covers why we process, for how long, who helps us, how we protect the data, and how we handle transfers out of the UK/EU."
      lastUpdated="2026-04-23"
      anchorNumeral="05"
    >
      <Clause n="01" heading="Parties and scope">
        <p>
          This Data Processing Agreement (&ldquo;<strong>DPA</strong>&rdquo;)
          forms part of the Terms of Service between <strong>Eazy Access Ltd</strong>{' '}
          (trading as Flintmere, the &ldquo;<strong>Processor</strong>&rdquo;)
          and the customer (the &ldquo;<strong>Controller</strong>&rdquo;). It
          applies whenever Flintmere processes personal data on behalf of the
          Controller in the course of providing the scanner, Shopify app, or
          concierge audit services.
        </p>
      </Clause>

      <Clause n="02" heading="Subject matter and duration">
        <p>
          The subject matter is Flintmere&rsquo;s provision of catalog scoring
          and fixing services to the Controller. Duration is the term of the
          subscription plus the retention periods set out in the Privacy
          Policy.
        </p>
      </Clause>

      <Clause n="03" heading="Nature and purpose of processing">
        <p>
          Flintmere processes personal data to:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>Authenticate the Controller&rsquo;s Shopify store</li>
          <li>Read and (where authorised) write product catalog data</li>
          <li>Generate scores, diagnostics, and suggested fixes</li>
          <li>Deliver email reports on explicit consent</li>
          <li>Provide support and billing</li>
          <li>Meet legal and regulatory obligations</li>
        </ul>
      </Clause>

      <Clause n="04" heading="Categories of data and data subjects">
        <p><strong>Categories of personal data:</strong></p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>Shopify store owner email (from OAuth install)</li>
          <li>IP address of scanner submitters (for abuse prevention)</li>
          <li>Email addresses voluntarily submitted to receive reports</li>
          <li>Billing contact (for direct-invoiced customers)</li>
        </ul>
        <p className="mt-4"><strong>Categories of data subjects:</strong></p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>Controller&rsquo;s staff with Shopify access</li>
          <li>Public visitors to the scanner</li>
          <li>Report recipients (who opt in)</li>
        </ul>
        <p className="mt-4">
          We do not process special-category data, children&rsquo;s data, or
          payment card data as part of this DPA.
        </p>
      </Clause>

      <Clause n="05" heading="Processor obligations">
        <p>Flintmere will:</p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            Process personal data only on documented instructions from the
            Controller (including those embedded in these terms and in the
            Shopify app&rsquo;s normal use)
          </li>
          <li>
            Ensure persons authorised to process the data are under
            confidentiality obligations
          </li>
          <li>
            Implement the security measures set out in Schedule 2
          </li>
          <li>
            Not engage sub-processors without authorisation (see Clause 07)
          </li>
          <li>
            Assist the Controller in responding to data subject rights
            requests
          </li>
          <li>
            Assist the Controller with data protection impact assessments on
            reasonable request
          </li>
          <li>
            Notify the Controller without undue delay of any personal data
            breach (within 24 hours of Flintmere becoming aware)
          </li>
          <li>
            On termination, delete or return all personal data as required by
            the retention rules in the Privacy Policy
          </li>
        </ul>
      </Clause>

      <Clause n="06" heading="Controller obligations">
        <p>
          The Controller warrants that:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            It has a lawful basis to share the personal data it instructs us
            to process
          </li>
          <li>
            Its own privacy notices disclose the use of Flintmere as a
            processor
          </li>
          <li>
            It will respond to data subject rights requests directed at it
            within statutory timelines
          </li>
        </ul>
      </Clause>

      <Clause n="07" heading="Sub-processors">
        <p>
          The Controller authorises Flintmere to engage the sub-processors
          listed in Schedule 1 below. Flintmere will:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            Maintain a written agreement with each sub-processor requiring
            equivalent data protection obligations
          </li>
          <li>
            Give at least 30 days&rsquo; notice of any new or replaced
            sub-processor via email to the Controller&rsquo;s billing contact
          </li>
          <li>
            Allow the Controller to object on reasonable data protection
            grounds; if the objection cannot be resolved, the Controller may
            terminate the affected service without penalty
          </li>
        </ul>
      </Clause>

      <Clause n="08" heading="International transfers">
        <p>
          Where personal data is transferred outside the UK/EEA, Flintmere
          relies on one of:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            An adequacy decision of the UK Government or the European
            Commission
          </li>
          <li>
            The <strong>UK International Data Transfer Addendum</strong> to
            the EU Standard Contractual Clauses (IDTA) approved by the ICO
          </li>
          <li>
            The <strong>EU Standard Contractual Clauses</strong> (Module 2 or
            Module 3 as appropriate) with the 2021 updates
          </li>
        </ul>
        <p className="mt-4">
          The SCCs / IDTA are incorporated by reference into this DPA. The
          Controller is the &ldquo;data exporter&rdquo; and Flintmere is the
          &ldquo;data importer&rdquo; (or Flintmere&rsquo;s onward
          sub-processor, as applicable).
        </p>
      </Clause>

      <Clause n="09" heading="Audit">
        <p>
          Flintmere will make available on request the information necessary
          to demonstrate compliance with this DPA. Enterprise customers may
          conduct an audit no more than once per year on 30 days&rsquo; notice,
          during business hours, at their own cost, and subject to
          confidentiality. Flintmere may substitute independent third-party
          audit reports for on-site audits.
        </p>
      </Clause>

      <Clause n="10" heading="Liability">
        <p>
          The liability limits in the main Terms of Service apply to this
          DPA. Nothing in this DPA limits a data subject&rsquo;s rights under
          UK GDPR.
        </p>
      </Clause>

      <Clause n="11" heading="Schedule 1 — Sub-processors">
        <p>
          See the &ldquo;Who we share it with&rdquo; section of our Privacy
          Policy for the current list, region, and purpose of each
          sub-processor:{' '}
          <a href="/privacy" className="underline">
            flintmere.com/privacy
          </a>
          . That list is the canonical version for this DPA.
        </p>
      </Clause>

      <Clause n="12" heading="Schedule 2 — Technical and organisational measures">
        <p>
          Flintmere applies the measures set out on our Security page,
          including encryption at rest (AES-256-GCM), TLS 1.2+ in transit,
          HMAC webhook verification, dependency scanning, access control,
          logging, and incident response:{' '}
          <a href="/security" className="underline">flintmere.com/security</a>.
          That page is the canonical version for this DPA.
        </p>
      </Clause>

      <Clause n="13" heading="How to countersign">
        <p>
          Installing the Shopify app or accepting a paid subscription is
          treated as acceptance of this DPA on behalf of the Controller.
          Enterprise customers who require a countersigned copy should email{' '}
          <a href="mailto:legal@flintmere.com" className="underline">
            legal@flintmere.com
          </a>
          ; we will return a signed PDF within 5 working days.
        </p>
      </Clause>
    </LegalShell>
  );
}
