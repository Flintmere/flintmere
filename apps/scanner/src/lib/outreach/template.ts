/**
 * Cold-email template renderer for the 2026-05-09 outreach sprint.
 * Pure function: target row + variant + sender_name → { subject, bodyHtml, bodyText }.
 *
 * Two subject variants (A/B) per `data/recruitment/cold-email-template-2026-05-09.md`.
 * Two send kinds: 'initial' (full pitch) + 'followup' (5-day single nudge).
 *
 * HTML treatment — letterhead, not marketing template. Paper canon background
 * (#f7f7f4), ink (#0a0a0b) text, single reading column at 580px. Two beats of
 * Flintmere signature only: the legibility bracket on the score `[ 47/100 ]`
 * and on the sign-off wordmark `The [ Flintmere ] team`, both set in the
 * system mono stack (ui-monospace → SF Mono → Menlo). No logo image, no CTA
 * buttons, no amber, no gradients — those tropes trip Promotions filters and
 * shave reply rates. The bracket-on-noun pattern reads distinctly Flintmere
 * while preserving the personal-note cadence cold email demands.
 *
 * Plain-text body intentionally stays austere — it's the fallback rendering
 * for the small fraction of recipients on plain-text-only clients and for
 * deliverability sniffers that read both versions.
 *
 * The data-intake hook ("we already scored you") is load-bearing per
 * council seat #36. Score appears in line 1 of the initial body.
 */

// Inline style fragments. Email clients don't reliably honour <style> blocks
// or external stylesheets, so every visual choice ships inline. Centralising
// the strings keeps the two render functions in lockstep and the diff small
// when a token shifts.
const STYLE_BODY =
  "margin:0;padding:0;background:#f7f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0a0a0b;font-size:15px;line-height:1.65;";
const STYLE_COLUMN = 'max-width:580px;margin:0 auto;padding:32px 20px;';
const STYLE_PARA = 'margin:0 0 16px 0;';
const STYLE_MONO =
  "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;";
// Bracket-on-noun signature. `white-space:nowrap` keeps `[ 47/100 ]` together
// across narrow viewports; `font-feature-settings:'tnum' 1` gives tabular
// numerals so the score reads as data not prose. `&nbsp;` pads the brackets
// since the design-system `.bracket` utility's 0.16em margin can't be
// referenced here — email contexts don't load app CSS.
const STYLE_BRACKET_MONO = `${STYLE_MONO}font-feature-settings:'tnum' 1;white-space:nowrap;`;
const STYLE_LINK = 'color:#0a0a0b;text-decoration:underline;text-underline-offset:3px;';
const STYLE_RULE = 'border:none;border-top:1px solid #e5e3dc;margin:32px 0 16px 0;';
const STYLE_FOOTER = 'margin:0 0 8px 0;font-size:12px;color:#8b8d95;line-height:1.55;';
const STYLE_FOOTER_LAST = 'margin:0;font-size:12px;color:#8b8d95;line-height:1.55;';
const STYLE_FOOTER_LINK = 'color:#5a5c64;';

// "(trading as Flintmere)" matches the canonical phrasing on /privacy,
// /terms, /dpa, /about — bridges the brand→entity gap so recipients
// don't read "Sent by Eazy Access Ltd" as a different sender from the
// Flintmere brand they see in the body. PECR identity preserved
// (Eazy Access Ltd is the legal sender).
const COMPANY_FOOTER =
  'Sent by Eazy Access Ltd (trading as Flintmere), registered in England and Wales, company no. 13205428, registered office 71-75 Shelton Street, London, WC2H 9JQ. ICO data-controller registration ZC137268.';

// PECR + GDPR Article 13: include a route to the privacy notice on first
// contact. Hardcoded per anti-waste rule #6 (public URL, identical across
// envs, never rotated).
const PRIVACY_NOTICE_URL = 'https://flintmere.com/privacy';

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

We also do a £197 catalog letter, delivered within three working days —
top priorities identified, top fixes spec'd — and a £349/month Concierge
retainer that keeps the score moving as the channels evolve. Worth a
15-minute reply if either's interesting; details at:

${input.auditUrl}

Best,
${input.senderName}
The Flintmere team

—
${COMPANY_FOOTER}
Privacy notice: ${PRIVACY_NOTICE_URL}

Reply with "unsubscribe" or click ${input.unsubscribeUrl} if you'd prefer
not to hear from us — we won't email you again.`;

  const html = `<!doctype html>
<html>
  <body style="${STYLE_BODY}">
    <div style="${STYLE_COLUMN}">
      <p style="${STYLE_PARA}">${greeting(input.recipientFirstName)}</p>
      <p style="${STYLE_PARA}">We benchmark Shopify catalogs against the data-quality requirements that Google Shopping, Amazon Fresh, and the AI shopping channels coming online this year look for. ${esc(shop)} scored <span style="${STYLE_BRACKET_MONO}">[&nbsp;${input.score}/100&nbsp;]</span> (${esc(input.grade)}-grade) across ${input.productCount} of your products in our most recent pass.</p>
      <p style="${STYLE_PARA}">The pattern we see most often at that score: a meaningful chunk of products miss valid GTINs or carry title formats Google&rsquo;s shopping crawler can&rsquo;t parse, which silently demotes them in shopping results. The lost demand compounds because the same catalog data feeds the AI channels &mdash; Perplexity Shopping, ChatGPT product cards, the new Google AI Overviews carousels.</p>
      <p style="${STYLE_PARA}">If it&rsquo;s useful, you can pull the full breakdown including an estimated suppressed-revenue band: <a href="${esc(input.rescanUrl)}" style="${STYLE_LINK}">run the free scan &rarr;</a></p>
      <p style="${STYLE_PARA}">We also do a £197 catalog letter, delivered within three working days &mdash; top priorities identified, top fixes spec&rsquo;d &mdash; and a £349/month Concierge retainer that keeps the score moving as the channels evolve. Worth a 15-minute reply if either&rsquo;s interesting: <a href="${esc(input.auditUrl)}" style="${STYLE_LINK}">see catalog letter + retainer details &rarr;</a></p>
      <p style="${STYLE_PARA}">Best,<br>${esc(input.senderName)}<br>The <span style="${STYLE_MONO}">[&nbsp;Flintmere&nbsp;]</span> team</p>
      <hr style="${STYLE_RULE}">
      <p style="${STYLE_FOOTER}">${esc(COMPANY_FOOTER)}</p>
      <p style="${STYLE_FOOTER}">Privacy notice: <a href="${PRIVACY_NOTICE_URL}" style="${STYLE_FOOTER_LINK}">${PRIVACY_NOTICE_URL}</a></p>
      <p style="${STYLE_FOOTER_LAST}">Reply with &ldquo;unsubscribe&rdquo; or <a href="${esc(input.unsubscribeUrl)}" style="${STYLE_FOOTER_LINK}">click here</a> if you&rsquo;d prefer not to hear from us &mdash; we won&rsquo;t email you again.</p>
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
The Flintmere team

—
${COMPANY_FOOTER}
Privacy notice: ${PRIVACY_NOTICE_URL}

Click ${input.unsubscribeUrl} to opt out of any further emails from us.`;

  const html = `<!doctype html>
<html>
  <body style="${STYLE_BODY}">
    <div style="${STYLE_COLUMN}">
      <p style="${STYLE_PARA}">${greeting(input.recipientFirstName)}</p>
      <p style="${STYLE_PARA}">Following up on the ${esc(shop)} catalog score note &mdash; happy to leave it there if it&rsquo;s not useful, but wanted to send the one-line version in case the first email got buried.</p>
      <p style="${STYLE_PARA}">The free scan is here if you want the breakdown: <a href="${esc(input.rescanUrl)}" style="${STYLE_LINK}">run the scan &rarr;</a></p>
      <p style="${STYLE_PARA}">Best,<br>${esc(input.senderName)}<br>The <span style="${STYLE_MONO}">[&nbsp;Flintmere&nbsp;]</span> team</p>
      <hr style="${STYLE_RULE}">
      <p style="${STYLE_FOOTER}">${esc(COMPANY_FOOTER)}</p>
      <p style="${STYLE_FOOTER}">Privacy notice: <a href="${PRIVACY_NOTICE_URL}" style="${STYLE_FOOTER_LINK}">${PRIVACY_NOTICE_URL}</a></p>
      <p style="${STYLE_FOOTER_LAST}"><a href="${esc(input.unsubscribeUrl)}" style="${STYLE_FOOTER_LINK}">Click here</a> to opt out of any further emails from us.</p>
    </div>
  </body>
</html>`;

  return { subject, bodyHtml: html, bodyText: text };
}

export type SendKind = 'initial' | 'followup';

export function renderEmail(kind: SendKind, input: TemplateInput): TemplateOutput {
  return kind === 'initial' ? renderInitialEmail(input) : renderFollowupEmail(input);
}
