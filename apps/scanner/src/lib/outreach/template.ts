/**
 * Cold-email template renderer for the 2026-05-09 outreach sprint.
 * Pure function: target row + variant + sender_name → { subject, bodyHtml, bodyText }.
 *
 * Two subject variants (A/B) per `data/recruitment/cold-email-template-2026-05-09.md`.
 * Two send kinds: 'initial' (full pitch) + 'followup' (5-day single nudge).
 *
 * Minimal HTML — cold email reads better as a personal note than as a
 * designed marketing email. Single reading column, no card, no eyebrow,
 * no amber accent. Signature carries one bracketed `[ Flintmere ]` only
 * when the line naturally calls for it; the rest is plain prose.
 *
 * The data-intake hook ("we already scored you") is load-bearing per
 * council seat #36. Score appears in line 1 of the initial body.
 */

const COMPANY_FOOTER =
  'Sent by Eazy Access Ltd, registered in England and Wales, company no. 13205428, registered office 71-75 Shelton Street, London, WC2H 9JQ. ICO data-controller registration ZC137268.';

export interface TemplateInput {
  shopDomain: string;
  /** Display name; defaults to shop_domain if absent. */
  shopName?: string | null;
  recipientFirstName: string | null;
  score: number;
  grade: string;
  productCount: number;
  /** Operator's name for the body sign-off. Always paired with "The Flintmere team" line. */
  senderName: string;
  /** Subject A/B. Defaults to A. */
  variant?: 'A' | 'B';
  /** Public scanner re-scan URL (origin + path + ?url=domain). */
  rescanUrl: string;
  /** Audit-page URL (origin + /audit). */
  auditUrl: string;
  /** One-click unsubscribe URL (HMAC-signed, public). */
  unsubscribeUrl: string;
}

export interface TemplateOutput {
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function greeting(firstName: string | null | undefined): string {
  // "Hi there," is honest if name unknown; never fabricate.
  return firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi there,';
}

function shopDisplayName(input: TemplateInput): string {
  return input.shopName?.trim() || input.shopDomain;
}

/** Subject line for the initial send. Variants per the canonical template. */
function buildInitialSubject(input: TemplateInput): string {
  const variant = input.variant ?? 'A';
  const shop = shopDisplayName(input);
  if (variant === 'B') {
    return `quick note on ${shop}'s catalog data`;
  }
  return `${shop} — your AI-shopping score (${input.score}/100)`;
}

export function renderInitialEmail(input: TemplateInput): TemplateOutput {
  const subject = buildInitialSubject(input);
  const shop = shopDisplayName(input);

  const text = `${greeting(input.recipientFirstName)}

We benchmark Shopify catalogs against the data-quality requirements that
Google Shopping, Amazon Fresh, and the AI shopping channels coming online
this year look for. ${shop} scored ${input.score}/100 (${input.grade}-grade) across
${input.productCount} of your products in our most recent pass.

The pattern we see most often at that score: a meaningful chunk of
products miss valid GTINs or carry title formats Google's shopping
crawler can't parse, which silently demotes them in shopping results.
The lost demand compounds because the same catalog data feeds the AI
channels — Perplexity Shopping, ChatGPT product cards, the new Google
AI Overviews carousels.

If it's useful, you can pull the full breakdown including an estimated
suppressed-revenue band here:

${input.rescanUrl}

We also run a £197 catalog audit, delivered within three working days —
top priorities identified, top fixes spec'd — and a £349/month Concierge
retainer that keeps the score moving as the channels evolve. Worth a
15-minute reply if either's interesting; details at:

${input.auditUrl}

Best,
${input.senderName}
The Flintmere team

—
${COMPANY_FOOTER}

Reply with "unsubscribe" or click ${input.unsubscribeUrl} if you'd prefer
not to hear from us — we won't email you again.`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0B;font-size:15px;line-height:1.6;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <p style="margin:0 0 16px 0;">${greeting(input.recipientFirstName)}</p>
      <p style="margin:0 0 16px 0;">We benchmark Shopify catalogs against the data-quality requirements that Google Shopping, Amazon Fresh, and the AI shopping channels coming online this year look for. ${esc(shop)} scored <strong>${input.score}/100</strong> (${esc(input.grade)}-grade) across ${input.productCount} of your products in our most recent pass.</p>
      <p style="margin:0 0 16px 0;">The pattern we see most often at that score: a meaningful chunk of products miss valid GTINs or carry title formats Google&rsquo;s shopping crawler can&rsquo;t parse, which silently demotes them in shopping results. The lost demand compounds because the same catalog data feeds the AI channels &mdash; Perplexity Shopping, ChatGPT product cards, the new Google AI Overviews carousels.</p>
      <p style="margin:0 0 16px 0;">If it&rsquo;s useful, you can pull the full breakdown including an estimated suppressed-revenue band here:<br><a href="${esc(input.rescanUrl)}" style="color:#0A0A0B;">${esc(input.rescanUrl)}</a></p>
      <p style="margin:0 0 16px 0;">We also run a £197 catalog audit, delivered within three working days &mdash; top priorities identified, top fixes spec&rsquo;d &mdash; and a £349/month Concierge retainer that keeps the score moving as the channels evolve. Worth a 15-minute reply if either&rsquo;s interesting; details at:<br><a href="${esc(input.auditUrl)}" style="color:#0A0A0B;">${esc(input.auditUrl)}</a></p>
      <p style="margin:0 0 16px 0;">Best,<br>${esc(input.senderName)}<br>The Flintmere team</p>
      <hr style="border:none;border-top:1px solid #E5E5E2;margin:24px 0;">
      <p style="margin:0 0 12px 0;font-size:12px;color:#8B8D95;line-height:1.55;">${esc(COMPANY_FOOTER)}</p>
      <p style="margin:0;font-size:12px;color:#8B8D95;line-height:1.55;">Reply with &ldquo;unsubscribe&rdquo; or <a href="${esc(input.unsubscribeUrl)}" style="color:#5A5C64;">click here</a> if you&rsquo;d prefer not to hear from us &mdash; we won&rsquo;t email you again.</p>
    </div>
  </body>
</html>`;

  return { subject, bodyHtml: html, bodyText: text };
}

export function renderFollowupEmail(input: TemplateInput): TemplateOutput {
  const shop = shopDisplayName(input);
  const subject = `re: ${shop} catalog data`;

  const text = `${greeting(input.recipientFirstName)}

Following up on the ${shop} catalog score note — happy to leave it
there if it's not useful, but wanted to send the one-line version in
case the first email got buried.

The free scan is here if you want the breakdown:
${input.rescanUrl}

Best,
${input.senderName}

—
${COMPANY_FOOTER}

Click ${input.unsubscribeUrl} to opt out of any further emails from us.`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0B;font-size:15px;line-height:1.6;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <p style="margin:0 0 16px 0;">${greeting(input.recipientFirstName)}</p>
      <p style="margin:0 0 16px 0;">Following up on the ${esc(shop)} catalog score note &mdash; happy to leave it there if it&rsquo;s not useful, but wanted to send the one-line version in case the first email got buried.</p>
      <p style="margin:0 0 16px 0;">The free scan is here if you want the breakdown:<br><a href="${esc(input.rescanUrl)}" style="color:#0A0A0B;">${esc(input.rescanUrl)}</a></p>
      <p style="margin:0 0 16px 0;">Best,<br>${esc(input.senderName)}</p>
      <hr style="border:none;border-top:1px solid #E5E5E2;margin:24px 0;">
      <p style="margin:0 0 12px 0;font-size:12px;color:#8B8D95;line-height:1.55;">${esc(COMPANY_FOOTER)}</p>
      <p style="margin:0;font-size:12px;color:#8B8D95;line-height:1.55;"><a href="${esc(input.unsubscribeUrl)}" style="color:#5A5C64;">Click here</a> to opt out of any further emails from us.</p>
    </div>
  </body>
</html>`;

  return { subject, bodyHtml: html, bodyText: text };
}

export type SendKind = 'initial' | 'followup';

export function renderEmail(kind: SendKind, input: TemplateInput): TemplateOutput {
  return kind === 'initial' ? renderInitialEmail(input) : renderFollowupEmail(input);
}
