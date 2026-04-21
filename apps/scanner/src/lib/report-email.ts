import type { CompositeScore } from '@flintmere/scoring';

/**
 * Hand-rolled HTML + plain-text email template for the full report.
 *
 * Email clients (Gmail/Outlook/iOS/Apple Mail) apply aggressive sanitisation —
 * inline styles, tables for layout, no CSS variables, no external fonts, no JS.
 * Therefore we do not reference @flintmere/tokens.md variables directly; we bake
 * the hex values in. Canon is still respected: neutral-bold, bracket signature,
 * sharp corners, no shadows.
 */

export interface ReportEmailInput {
  score: CompositeScore;
  unsubscribeUrl: string;
  shareableBadgeUrl?: string;
  appUrl: string;
  recipientEmail: string;
}

export function buildReportEmail(input: ReportEmailInput): { subject: string; html: string; text: string } {
  const { score, unsubscribeUrl, shareableBadgeUrl, appUrl } = input;

  const subject = `[ Flintmere Report ] ${score.shopDomain} · ${score.score}/100 · Grade ${score.grade}`;
  const html = renderHtml(input);
  const text = renderText(input);

  return { subject, html, text };
}

function renderHtml(input: ReportEmailInput): string {
  const { score, unsubscribeUrl, appUrl } = input;
  const topIssues = score.issues.slice(0, 5);
  const unlockedPillars = score.pillars.filter((p) => !p.locked);
  const lockedPillars = score.pillars.filter((p) => p.locked);

  const rows = topIssues
    .map((issue) => {
      const severityColour =
        issue.severity === 'critical'
          ? '#E54A2A'
          : issue.severity === 'high'
            ? '#0A0A0B'
            : '#8B8D95';
      return `
        <tr>
          <td style="padding:16px 0;border-top:1px solid #D5D2C8;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
              <tr>
                <td width="90" valign="top" style="padding-right:12px;">
                  <span style="display:inline-block;padding:4px 8px;background:${severityColour};color:#F7F7F4;font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">${esc(issue.severity)}</span>
                </td>
                <td valign="top">
                  <div style="font-size:15px;font-weight:500;color:#0A0A0B;line-height:1.35;">${esc(issue.title)}</div>
                  <div style="font-size:13px;color:#5A5C64;margin-top:4px;line-height:1.5;">${esc(issue.description)}</div>
                </td>
                <td width="80" valign="top" align="right" style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.08em;color:#5A5C64;text-transform:uppercase;">${issue.affectedCount} items</td>
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
          <td style="padding:10px 0;border-top:1px solid #D5D2C8;font-size:14px;color:#0A0A0B;">${esc(pillarLabel(p.pillar))}</td>
          <td style="padding:10px 0;border-top:1px solid #D5D2C8;font-family:ui-monospace,Menlo,monospace;font-size:12px;text-align:right;color:#0A0A0B;">${Math.round(p.score)}%</td>
        </tr>`,
    )
    .join('');

  const lockedRows = lockedPillars
    .map(
      (p) =>
        `<tr>
          <td style="padding:10px 0;border-top:1px solid #D5D2C8;font-size:14px;color:#8B8D95;">${esc(pillarLabel(p.pillar))} <span style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8B8D95;">locked</span></td>
          <td style="padding:10px 0;border-top:1px solid #D5D2C8;font-family:ui-monospace,Menlo,monospace;font-size:11px;text-align:right;color:#8B8D95;text-transform:uppercase;letter-spacing:0.08em;">Install to unlock</td>
        </tr>`,
    )
    .join('');

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
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;">Flintmere Report · ${today()}</div>
              <div style="margin-top:12px;font-size:28px;font-weight:500;letter-spacing:-0.02em;color:#0A0A0B;">
                <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;">[&nbsp;${score.score}&nbsp;]</span> / 100 · Grade ${esc(score.grade)}
              </div>
              <div style="margin-top:6px;font-size:14px;color:#5A5C64;">${esc(score.shopDomain)} · ${score.productCount} products analysed</div>
            </td>
          </tr>

          <!-- Headline paragraph -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:16px;line-height:1.55;color:#141518;">
                Your catalog scores ${score.score}/100 across the seven checks AI shopping agents run on product catalogs. Your ceiling without GS1-registered barcodes is <strong>${score.gtinlessCeiling}/100</strong>.
              </p>
              <p style="margin:12px 0 0 0;font-size:14px;color:#5A5C64;line-height:1.55;">
                This is the partial audit. Three checks stay locked until you install Flintmere on your store — those need access to your metafields and catalog-mapping settings.
              </p>
            </td>
          </tr>

          <!-- Pillar breakdown -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin-bottom:4px;">Score breakdown</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${pillarRows}
                ${lockedRows}
              </table>
            </td>
          </tr>

          <!-- Top issues -->
          <tr>
            <td style="padding:0 32px 24px 32px;border-top:1px solid #0A0A0B;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8D95;margin:24px 0 8px 0;">Top issues · ranked by revenue impact</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            </td>
          </tr>

          <!-- CTA block (inverted) -->
          <tr>
            <td style="padding:32px;background:#0A0A0B;color:#F7F7F4;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#A8AAB2;">Next step</div>
              <div style="margin-top:12px;font-size:22px;font-weight:500;letter-spacing:-0.02em;line-height:1.3;">
                Install Flintmere to unlock the remaining <span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;">[&nbsp;${lockedPillars.length}&nbsp;]</span> checks and apply safe auto-fixes with 7-day revert.
              </div>
              <p style="margin:16px 0 24px 0;font-size:14px;color:#A8AAB2;line-height:1.55;">
                Every change previewed before it ships. Every change reversible for 7 days. First month £29 for scanner users (Growth tier, normally £49).
              </p>
              <a href="${esc(appUrl)}" style="display:inline-block;background:#F8BF24;color:#0A0A0B;padding:14px 24px;border:1px solid #F8BF24;font-family:ui-monospace,Menlo,monospace;font-size:13px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;">Install Flintmere →</a>
            </td>
          </tr>

          <!-- Disclaimer + signature -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #0A0A0B;">
              <p style="margin:0;font-size:12px;color:#5A5C64;line-height:1.55;">
                Flintmere is not affiliated with GS1. Identifier requirements vary by marketplace and jurisdiction. AI-visibility estimates are based on comparable Shopify stores in the same vertical and size band — actual outcomes depend on many factors including catalog composition, competitive set, and agent behaviour.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#EDECE6;">
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.1em;color:#5A5C64;">
                Flintmere Ltd · <a href="${esc(appUrl)}" style="color:#5A5C64;text-decoration:underline;">flintmere.com</a> · hello@flintmere.com
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

function renderText(input: ReportEmailInput): string {
  const { score, unsubscribeUrl, appUrl } = input;
  const top = score.issues
    .slice(0, 5)
    .map(
      (i, idx) =>
        `${idx + 1}. [${i.severity.toUpperCase()}] ${i.title}\n    ${i.description}\n    Affected: ${i.affectedCount} products`,
    )
    .join('\n\n');
  const pillars = score.pillars
    .map(
      (p) =>
        `  - ${pillarLabel(p.pillar).padEnd(30, ' ')} ${p.locked ? 'locked (install to unlock)' : `${Math.round(p.score)}%`}`,
    )
    .join('\n');

  return `Flintmere Report — ${score.shopDomain}

[ ${score.score} ] / 100 · Grade ${score.grade}
${score.productCount} products analysed · GTIN-less ceiling: ${score.gtinlessCeiling}/100

Score breakdown
${pillars}

Top issues (ranked by revenue impact)
${top}

Next step
Install Flintmere to unlock the remaining checks and apply safe auto-fixes
with 7-day revert. First month £29 for scanner users.

${appUrl}

---

Flintmere is not affiliated with GS1. Identifier requirements vary by
marketplace and jurisdiction. AI-visibility estimates are based on comparable
Shopify stores in the same vertical — actual outcomes depend on many factors.

Flintmere Ltd · ${appUrl} · hello@flintmere.com
Unsubscribe (one click): ${unsubscribeUrl}
`;
}

function pillarLabel(pillar: string): string {
  switch (pillar) {
    case 'identifiers':
      return 'Identifier completeness';
    case 'attributes':
      return 'Attribute completeness';
    case 'titles':
      return 'Title & description';
    case 'mapping':
      return 'Catalog mapping';
    case 'consistency':
      return 'Consistency & integrity';
    case 'checkout-eligibility':
      return 'AI checkout eligibility';
    case 'crawlability':
      return 'Agent crawlability';
    default:
      return pillar;
  }
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
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
}
