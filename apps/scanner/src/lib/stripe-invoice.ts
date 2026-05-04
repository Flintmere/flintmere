/**
 * Concierge-audit invoice generation.
 *
 * After a PaymentIntent succeeds (Path C — see Standing Council 2026-05-04
 * verdict on receipts/invoices), create a paid Stripe Invoice as the
 * downloadable accounting artefact. We keep the in-page Payment Element
 * checkout for the customer-facing flow; the invoice is rendered post-
 * payment via the Stripe Invoices API and surfaced as a "Download invoice
 * (PDF)" link inside the branded concierge confirmation email.
 *
 * Why Stripe and not a hand-rolled PDF: Eazy Access Ltd is sub-VAT-
 * threshold today, so no statutory format is required. When we cross the
 * VAT threshold (~£90K turnover) we'll re-do this with a VAT breakdown
 * anyway — building our own PDF infrastructure now is engineering we'd
 * throw away. Stripe handles invoice numbering, hosted-page persistence,
 * tax-math (when enabled), reissue/amendment flows, and DSAR scope (Stripe
 * is already a sub-processor under our DPA).
 *
 * Branding: Stripe pulls logo + colour + business name from Settings →
 * Branding. Footer text + custom-fields below give us the seller-of-record
 * disclosure (Eazy Access Ltd + Companies House 13205428). The bookkeeper
 * receiving this invoice has seen 1,000 Stripe-format invoices and parses
 * the layout in 0.5 seconds — that's the win.
 *
 * Failure mode: if any Stripe call throws, log + return null. The webhook
 * handler must NOT fail the whole booking on invoice failure — the customer
 * has already been charged, the DB row exists, and the confirmation emails
 * should still send (just without the invoice link). Operator can manually
 * create the invoice in Stripe Dashboard from the PaymentIntent if needed.
 */

import type Stripe from 'stripe';
import { bandBySlug, type AuditBandSlug } from './audit-pricing';

export interface ConciergeInvoice {
  /** Customer-facing URL to view the hosted invoice (HTML + download). */
  hostedUrl: string;
  /** Direct PDF download URL (signed, time-limited). */
  pdfUrl: string;
  /** Stripe-assigned invoice number (e.g. "FLINT-0042"). */
  number: string;
}

export interface CreateConciergeInvoiceArgs {
  stripe: Stripe;
  email: string;
  shopUrl: string;
  paymentIntentId: string;
  bandSlug: AuditBandSlug;
}

export async function createConciergeInvoice(
  args: CreateConciergeInvoiceArgs,
): Promise<ConciergeInvoice | null> {
  const { stripe, email, shopUrl, paymentIntentId, bandSlug } = args;
  const band = bandBySlug(bandSlug);

  if (!band || band.pricePence === null) {
    // Band 3 (bespoke) doesn't go through Stripe — no invoice to create.
    return null;
  }

  try {
    const customer = await findOrCreateCustomer(stripe, email, shopUrl);

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 0,
      description: `Concierge AI-readiness audit (${band.label}) for ${shopUrl}`,
      custom_fields: [
        { name: 'Shop', value: shopUrl.slice(0, 30) },
        { name: 'Audit band', value: `${band.label} (${band.skuRangeLabel})` },
        { name: 'Delivery', value: 'Three working days' },
      ],
      footer:
        'Flintmere is a trading name of Eazy Access Ltd. Companies House 13205428. ' +
        'Registered office: 71–75 Shelton Street, Covent Garden, London, WC2H 9JQ.',
      metadata: {
        kind: 'concierge-audit',
        payment_intent: paymentIntentId,
        audit_band: bandSlug,
        shop_url: shopUrl.slice(0, 250),
      },
    });

    if (!invoice.id) {
      // eslint-disable-next-line no-console
      console.warn(
        JSON.stringify({
          event: 'concierge-invoice-no-id',
          paymentIntentId,
        }),
      );
      return null;
    }

    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: band.pricePence,
      currency: 'gbp',
      description:
        `Flintmere concierge AI-readiness audit — ${band.label} ` +
        `(${band.skuRangeLabel}). Full written audit + per-product fix CSV ` +
        `(worst ${band.deliverable.fullyDraftedFixCount} products fully drafted). ` +
        `Delivery: three working days from booking. ` +
        `Day-30 re-scan included.`,
      metadata: {
        audit_band: bandSlug,
        payment_intent: paymentIntentId,
      },
    });

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    if (!finalized.id) return null;
    const paid = await stripe.invoices.pay(finalized.id, {
      paid_out_of_band: true,
    });

    if (!paid.hosted_invoice_url || !paid.invoice_pdf || !paid.number) {
      // eslint-disable-next-line no-console
      console.warn(
        JSON.stringify({
          event: 'concierge-invoice-missing-urls',
          paymentIntentId,
          invoiceId: paid.id,
        }),
      );
      return null;
    }

    return {
      hostedUrl: paid.hosted_invoice_url,
      pdfUrl: paid.invoice_pdf,
      number: paid.number,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        event: 'concierge-invoice-failed',
        paymentIntentId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return null;
  }
}

async function findOrCreateCustomer(
  stripe: Stripe,
  email: string,
  shopUrl: string,
): Promise<Stripe.Customer> {
  const list = await stripe.customers.list({ email, limit: 1 });
  if (list.data[0]) return list.data[0];

  return stripe.customers.create({
    email,
    name: shopUrl.slice(0, 80),
    metadata: {
      shop_url: shopUrl.slice(0, 250),
      source: 'concierge-audit',
    },
  });
}
