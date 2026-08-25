import type { CompositeScore, PillarId } from '@flintmere/scoring';
import {
  AUTHORITY_LINE,
  FOUNDER_SIGNATURE_IMAGE_URL,
  FOUNDER_SIGNATURE_NAME,
  FOUNDER_SIGNATURE_REPLY_INVITE,
  FOUNDER_SIGNATURE_TEAM_LINE,
  REPLY_SLA,
  gradeBadgeAnchor,
  issueCodeToFounderSpeak,
  pillarLabelCustomerFacing,
  verdictHeader,
} from './copy';
import {
  GMC_EMAIL_BANNER_LABEL,
  GMC_EMAIL_FOOTNOTE,
  GMC_TOP_ISSUES_LABEL,
  gmcLede,
  gmcSubline,
  truncatedNote,
} from './gmc-copy';
import type { GmcGroundTruth } from './gmc/types';

/**
 * Hand-rolled HTML + plain-text email template for the full report.
 *
 * Email clients (Gmail/Outlook/iOS/Apple Mail) apply aggressive sanitisation —
 * inline styles, tables for layout, no CSS variables, no external fonts, no JS.
 * Therefore we do not reference @flintmere/tokens.md variables directly; we bake
 * the hex values in. Canon is still respected: neutral-bold, bracket signature,
 * sharp corners, no shadows.
 *
 * Copy rules (Copy Council #20 #21 #22 #37):
 *   - No banned jargon (see BANNED_JARGON in lib/copy).
 *   - Every issue translated via issueCodeToFounderSpeak.
 *   - Two-door close: catalog letter / reply. The earlier "install app"
 *     door pitched a Shopify embedded app that is post-launch per the
 *     2026-05-05 launch decision — selling it from the inbox set up a
 *     dead link to /for/plus. Catalog letter + reply are the only paths
 *     that resolve to a shipped product right now.
 */

export interface ReportEmailInput {
  score: CompositeScore;
  unsubscribeUrl: string;
  shareableBadgeUrl?: string;
  appUrl: string;
  auditUrl: string;
  recipientEmail: string;
  /**
   * Per ADR 0023 slice 3 — when the merchant has connected GMC and the
   * read succeeded, surfaces ground-truth disapproval counts + Google's
   * own issue language ahead of the modelled signals. Null otherwise.
   */
  gmcGroundTruth?: GmcGroundTruth | null;
}

export function buildReportEmail(input: ReportEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = buildSubject(input.score);
  const html = renderHtml(input);
  const text = renderText(input);
  return { subject, html, text };
}

function invisibleCountFor(score: CompositeScore): number {
  return score.issues
    .filter((i) => i.severity === 'critical' || i.severity === 'high')
    .reduce((max, i) => Math.max(max, i.affectedCount), 0);
}

function buildSubject(score: CompositeScore): string {
  const invisible = invisibleCountFor(score);
  const total = score.productCount;
  if (score.grade === 'A') {
    return `${score.shopDomain} — ready for AI shopping agents · Grade ${score.grade}`;
  }
  if (invisible === 0) {
    return `${score.shopDomain} — full catalog scan · Grade ${score.grade}`;
  }
  return `${score.shopDomain} — at least ${invisible.toLocaleString()} of ${total.toLocaleString()} products invisible to AI agents`;
}

function renderHtml(input: ReportEmailInput): string {
  const { score, unsubscribeUrl, appUrl, auditUrl, gmcGroundTruth } = input;
  const topIssues = score.issues.slice(0, 3);
  const unlockedPillars = score.pillars.filter((p) => !p.locked);
  const lockedPillars = score.pillars.filter((p) => p.locked);

  const invisible = invisibleCountFor(score);
  const verdict = verdictHeader({
    grade: score.grade,
    invisibleCount: invisible,
    totalProducts: score.productCount,
  });
  const gradeAnchor = gradeBadgeAnchor({ grade: score.grade });
  const gmcSection = gmcGroundTruth ? renderGmcSectionHtml(gmcGroundTruth) : '';

  const evidenceRows = topIssues
    .map((issue) => {
      const speak = issueCodeToFounderSpeak[issue.code];
      const title = esc(speak?.title ?? issue.title);
      const consequence = esc(speak?.consequence ?? issue.description);
      const severityColour =
        issue.severity === 'critical'
          ? '#E54A2A'
          : issue.severity === 'high'
            ? '#0A0A0B'
            : '#8B8D95';
      return `
        <tr>
          <td style="padding:18px 0;border-top:1px solid #D5D2C8;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
              <tr>
                <td width="90" valign="top" style="padding-right:12px;">
                  <span style="display:inline-block;padding:4px 8px;background:${severityColour};color:#F7F7F4;font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">${esc(issue.severity)}</span>
                </td>
                <td valign="top">
                  <div style="font-size:16px;font-weight:500;color:#0A0A0B;line-height:1.3;">${title}</div>
                  <div style="font-size:14px;color:#5A5C64;margin-top:6px;line-height:1.5;">${consequence}</div>
                </td>
                <td width="100" valign="top" align="right" style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.08em;color:#5A5C64;text-transform:uppercase;">${issue.affectedCount.toLocaleString()} products</td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join('');

  const pillarRows = unlockedPillars
    .map(
      (p) =>
        `<tr>
          <td style="padding:10px 0;border-top:1px solid #D5D2C8;font-size:14px;color:#0A0A0B;">${esc(pillarLabelFor(p.pillar))}</td>
          <td style="padding:10px 0;border-top:1px solid #D5D2C8;font-family:ui-monospace,Menlo,monospace;font-size:12px;text-align:right;color:#0A0A0B;">${Math.round(p.score)}%</td>
        </tr>`,
    )
    .join('');

  const lockedListText =
    lockedPillars.length > 0
      ? lockedPillars.map((p) => esc(pillarLabelFor(p.pillar))).join(', ')
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Flintmere Report</title>
</head>
<body style="margin:0;padding:0;background:#F7F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A0A0B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F4;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#F7F7F4;border:1px solid #0A0A0B;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px 32px;border-bottom:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Flintmere Report · ${today()} · ${esc(score.shopDomain)}</div>
              <div style="margin-top:14px;font-size:24px;font-weight:500;letter-spacing:-0.02em;line-height:1.2;color:#0A0A0B;">
                ${esc(verdict.headline)}
              </div>
              <div style="margin-top:10px;font-size:15px;color:#5A5C64;line-height:1.5;">
                ${esc(verdict.subhead)}
              </div>
              <div style="margin-top:16px;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.08em;color:#5A5C64;">
                ${esc(gradeAnchor)}
              </div>
            </td>
          </tr>

          ${gmcSection}

          <!-- Authority line -->
          <tr>
            <td style="padding:20px 32px;background:#EDECE6;border-bottom:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin-bottom:6px;">How we score</div>
              <div style="font-size:13px;color:#141518;line-height:1.5;">${esc(AUTHORITY_LINE)}</div>
            </td>
          </tr>

          <!-- Evidence: top 3 issues in founder-speak -->
          <tr>
            <td style="padding:8px 32px 24px 32px;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin:16px 0 4px 0;">What AI agents see first</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${evidenceRows}</table>
            </td>
          </tr>

          <!-- Score breakdown (unlocked only) -->
          <tr>
            <td style="padding:0 32px 24px 32px;border-top:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin:24px 0 4px 0;">What we checked</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pillarRows}</table>
              ${
                lockedPillars.length > 0
                  ? `<p style="margin:16px 0 0 0;font-size:13px;color:#8B8D95;line-height:1.5;">
                      <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;">[&nbsp;${lockedPillars.length}&nbsp;]</span>
                      more checks — ${lockedListText} — read merchant-side data the free scan can&rsquo;t see. The £197 catalog letter covers them.
                    </p>`
                  : ''
              }
            </td>
          </tr>

          <!-- Two-door close -->
          <tr>
            <td style="padding:32px;background:#0A0A0B;color:#F7F7F4;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#A8AAB2;">What next</div>
              <div style="margin-top:12px;font-size:20px;font-weight:500;letter-spacing:-0.015em;line-height:1.25;">
                Two ways to fix what we found.
              </div>

              <!-- Door 1: concierge -->
              <div style="margin-top:24px;padding:20px;border:1px solid #F8BF24;background:rgba(248,191,36,0.06);">
                <div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#F8BF24;">Recommended · from £197 one-off · three working days</div>
                <div style="margin-top:8px;font-size:17px;font-weight:500;color:#F7F7F4;line-height:1.3;">Have us read your store for you.</div>
                <p style="margin:8px 0 0 0;font-size:14px;color:#A8AAB2;line-height:1.5;">
                  We read your store product by product, write a detailed catalog letter pointing at exactly what to fix, and send a per-product CSV with the worst 10 (£197, up to 1,500 SKUs) or worst 25 (£397, 1,501–5,000 SKUs) products already drafted. A 30-day re-scan is included. No video, no call — just the data. Larger catalogs scope bespoke from £597.
                </p>
                <a href="${esc(auditUrl)}" style="display:inline-block;margin-top:14px;background:#F8BF24;color:#0A0A0B;padding:12px 20px;font-family:ui-monospace,Menlo,monospace;font-size:12px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;">Book your catalog letter →</a>
              </div>

              <!-- Door 2: reply -->
              <p style="margin:24px 0 0 0;font-size:13px;color:#A8AAB2;line-height:1.55;">
                Prefer to talk first? Just reply to this email. ${esc(REPLY_SLA)}
              </p>
            </td>
          </tr>

          <!-- Founder sign-off -->
          <tr>
            <td style="padding:28px 32px 28px 32px;">
              ${
                FOUNDER_SIGNATURE_IMAGE_URL
                  ? `<img src="${esc(FOUNDER_SIGNATURE_IMAGE_URL)}" alt="${esc(FOUNDER_SIGNATURE_NAME)}" width="200" height="60" style="display:block;height:auto;width:200px;max-width:200px;margin:0 0 6px 0;">`
                  : `<div style="font-family:ui-monospace,Menlo,monospace;font-size:32px;font-weight:600;letter-spacing:-0.01em;color:#0A0A0B;margin:0 0 4px 0;">[&nbsp;${esc(FOUNDER_SIGNATURE_NAME)}&nbsp;]</div>`
              }
              <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">
                ${esc(FOUNDER_SIGNATURE_TEAM_LINE)}
              </p>
              <p style="margin:14px 0 0 0;font-size:13px;color:#8B8D95;line-height:1.55;">
                ${esc(FOUNDER_SIGNATURE_REPLY_INVITE)}
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #0A0A0B;">
              <p style="margin:0;font-size:11px;color:#8B8D95;line-height:1.55;">
                Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction. The checks in this report are informational and map to Shopify product data requirements, GS1 UK identifier rules, and Google Merchant Center specifications.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#EDECE6;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.1em;color:#5A5C64;">
                Flintmere is a trading name of Eazy Access Ltd · <a href="${esc(appUrl)}" style="color:#5A5C64;text-decoration:underline;">flintmere.com</a> · hello@flintmere.com
              </div>
              <div style="margin-top:6px;font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.1em;color:#5A5C64;">
                <a href="${esc(unsubscribeUrl)}" style="color:#5A5C64;text-decoration:underline;">Unsubscribe (one click)</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderGmcSectionHtml(gmc: GmcGroundTruth): string {
  const lede = gmcLede(gmc);
  const sub = gmcSubline(gmc);
  const truncated = truncatedNote(gmc);
  const issueRows = gmc.topIssues
    .slice(0, 3)
    .map((issue) => {
      const samples = issue.sampleProducts
        .slice(0, 3)
        .map(
          (s) =>
            `<li style="font-size:12px;color:#5A5C64;line-height:1.55;margin:0;padding:0;">${esc(s.title)}</li>`,
        )
        .join('');
      const samplesBlock = samples
        ? `<ul style="margin:8px 0 0 0;padding:0 0 0 14px;list-style:disc;list-style-position:outside;">${samples}</ul>`
        : '';
      return `
        <tr>
          <td style="padding:14px 0;border-top:1px solid #D5D2C8;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
              <tr>
                <td valign="top" style="padding-right:12px;">
                  <div style="font-size:14px;color:#0A0A0B;line-height:1.45;">${esc(issue.description)}</div>
                  <div style="margin-top:4px;font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.1em;color:#8B8D95;text-transform:uppercase;">code: ${esc(issue.code)} · ${esc(issue.severity)}</div>
                  ${samplesBlock}
                </td>
                <td width="110" valign="top" align="right" style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.08em;color:#0A0A0B;text-transform:uppercase;">${issue.productCount.toLocaleString()} products</td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join('');

  const truncatedBlock = truncated
    ? `<p style="margin:14px 0 0 0;font-size:12px;color:#8B8D95;line-height:1.55;">${esc(truncated)}</p>`
    : '';

  return `
          <tr>
            <td style="padding:24px 32px;background:#F7F7F4;border-bottom:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#0A0A0B;">
                <span style="font-weight:700;">[&nbsp;ground truth&nbsp;]</span>
                <span style="margin-left:10px;color:#8B8D95;">${esc(GMC_EMAIL_BANNER_LABEL)}</span>
              </div>
              <div style="margin-top:14px;font-size:32px;font-weight:600;letter-spacing:-0.02em;line-height:1.15;color:#0A0A0B;">
                ${esc(lede)}
                <span aria-hidden="true" style="display:inline-block;width:0.22em;height:2px;background:#F8BF24;vertical-align:0.25em;margin-left:6px;"></span>
              </div>
              <div style="margin-top:6px;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.06em;color:#5A5C64;line-height:1.6;">
                ${esc(sub)}
              </div>
              ${
                gmc.topIssues.length > 0
                  ? `<div style="margin-top:18px;">
                      <div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin-bottom:4px;">${esc(GMC_TOP_ISSUES_LABEL)}</div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${issueRows}</table>
                    </div>`
                  : ''
              }
              ${truncatedBlock}
              <p style="margin:14px 0 0 0;font-size:11px;color:#8B8D95;line-height:1.55;">${esc(GMC_EMAIL_FOOTNOTE)}</p>
            </td>
          </tr>`;
}

function renderGmcSectionText(gmc: GmcGroundTruth): string {
  const lede = gmcLede(gmc);
  const sub = gmcSubline(gmc);
  const truncated = truncatedNote(gmc);
  const issueLines = gmc.topIssues
    .slice(0, 3)
    .map((issue, idx) => {
      const samples = issue.sampleProducts
        .slice(0, 3)
        .map((s) => `       - ${s.title}`)
        .join('\n');
      const samplesBlock = samples ? `\n${samples}` : '';
      return `${idx + 1}. ${issue.description}
    code: ${issue.code} · ${issue.severity} · ${issue.productCount.toLocaleString()} products${samplesBlock}`;
    })
    .join('\n\n');

  const truncatedLine = truncated ? `\n\n${truncated}` : '';
  const issuesBlock = gmc.topIssues.length > 0
    ? `\n\n${GMC_TOP_ISSUES_LABEL}\n${issueLines}`
    : '';

  return `[ ground truth ] ${GMC_EMAIL_BANNER_LABEL}

${lede}
${sub}${issuesBlock}${truncatedLine}

${GMC_EMAIL_FOOTNOTE}`;
}

function renderText(input: ReportEmailInput): string {
  const { score, unsubscribeUrl, appUrl, auditUrl, gmcGroundTruth } = input;
  const invisible = invisibleCountFor(score);
  const verdict = verdictHeader({
    grade: score.grade,
    invisibleCount: invisible,
    totalProducts: score.productCount,
  });
  const gmcBlock = gmcGroundTruth ? `${renderGmcSectionText(gmcGroundTruth)}\n\n` : '';

  const top = score.issues
    .slice(0, 3)
    .map((i, idx) => {
      const speak = issueCodeToFounderSpeak[i.code];
      const title = speak?.title ?? i.title;
      const consequence = speak?.consequence ?? i.description;
      return `${idx + 1}. [${i.severity.toUpperCase()}] ${title}\n    ${consequence}\n    Affected: ${i.affectedCount.toLocaleString()} products`;
    })
    .join('\n\n');

  const unlocked = score.pillars
    .filter((p) => !p.locked)
    .map(
      (p) =>
        `  - ${pillarLabelFor(p.pillar).padEnd(32, ' ')} ${Math.round(p.score)}%`,
    )
    .join('\n');

  const lockedPillars = score.pillars.filter((p) => p.locked);
  const lockedNote =
    lockedPillars.length > 0
      ? `\n\n[ ${lockedPillars.length} ] more checks — ${lockedPillars
          .map((p) => pillarLabelFor(p.pillar))
          .join(
            ', ',
          )} — read merchant-side data the free scan can't see. The £197 catalog letter covers them.`
      : '';

  return `Flintmere Report — ${score.shopDomain}

${verdict.headline}

${verdict.subhead}

${gradeBadgeAnchor({ grade: score.grade })}

${gmcBlock}How we score
${AUTHORITY_LINE}

What AI agents see first
${top}

What we checked
${unlocked}${lockedNote}

What next — two ways to fix what we found

1. Recommended · from £197 one-off · three working days
   Have us read your store for you. We read every product, write a
   detailed catalog letter pointing at exactly what to fix, and send a
   per-product CSV with the worst 10 (£197, up to 1,500 SKUs) or worst
   25 (£397, 1,501–5,000 SKUs) products already drafted. A 30-day re-scan
   is included. No video, no call — just the data. Larger catalogs scope
   bespoke from £597.
   ${auditUrl}

2. Prefer to talk first?
   Just reply to this email. ${REPLY_SLA}

[ ${FOUNDER_SIGNATURE_NAME} ]
${FOUNDER_SIGNATURE_TEAM_LINE}

${FOUNDER_SIGNATURE_REPLY_INVITE}

---

Flintmere is not affiliated with GS1. Identifier requirements vary by
marketplace and jurisdiction. The checks in this report are informational
and map to Shopify product data requirements, GS1 UK identifier rules, and
Google Merchant Center specifications.

Flintmere is a trading name of Eazy Access Ltd · ${appUrl} · hello@flintmere.com
Unsubscribe (one click): ${unsubscribeUrl}
`;
}

function pillarLabelFor(pillar: PillarId | string): string {
  return (
    pillarLabelCustomerFacing[pillar as PillarId] ?? String(pillar)
  );
}

function esc(raw: string): string {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
