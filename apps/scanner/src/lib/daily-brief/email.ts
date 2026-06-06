/**
 * Render the composed brief into an HTML + plain-text email and send via
 * Resend. Letterhead canon mirrors `lib/outreach/template.ts` — paper bg
 * #f7f7f4, ink #0a0a0b, single 640px column, mono bracket signature on
 * the closing wordmark. No CTA buttons, no amber, no images.
 *
 * Markdown renderer is intentionally tiny: only the constructs the
 * compose prompt is allowed to emit (h2, h3, paragraphs, ordered and
 * unordered lists, inline code, fenced code blocks, **bold**). Anything
 * outside that grammar renders as plain paragraph text.
 */

import { sendEmail, type SendEmailResult } from '../resend';
import { DAILY_HEALTH_CHECK_MARKDOWN } from './health-check';
import type { ComposedBrief, BriefState } from './types';

const FROM_DEFAULT = 'Flintmere <hello@flintmere.com>';
const RECIPIENT_DEFAULT = 'info@eazyaccess.org';

const STYLE_BODY =
  "margin:0;padding:0;background:#f7f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0a0a0b;font-size:15px;line-height:1.65;";
const STYLE_COLUMN = 'max-width:640px;margin:0 auto;padding:32px 24px;';
const STYLE_PARA = 'margin:0 0 16px 0;';
const STYLE_H2 = 'margin:32px 0 12px 0;font-size:20px;font-weight:600;letter-spacing:-0.01em;';
const STYLE_H3 = 'margin:24px 0 8px 0;font-size:16px;font-weight:600;';
const STYLE_LIST = 'margin:0 0 16px 0;padding-left:24px;';
const STYLE_LI = 'margin:0 0 6px 0;';
const STYLE_MONO =
  "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;";
const STYLE_INLINE_CODE = `${STYLE_MONO}background:#ecebe4;padding:1px 5px;border-radius:3px;font-size:13.5px;`;
const STYLE_PRE = `${STYLE_MONO}background:#0a0a0b;color:#f7f7f4;padding:14px 16px;border-radius:4px;margin:0 0 16px 0;font-size:13px;line-height:1.55;overflow-x:auto;`;
const STYLE_BRACKET = `${STYLE_MONO}font-feature-settings:'tnum' 1;white-space:nowrap;`;
const STYLE_RULE = 'border:none;border-top:1px solid #e5e3dc;margin:32px 0 16px 0;';
const STYLE_FOOTER = 'margin:0 0 8px 0;font-size:12px;color:#8b8d95;line-height:1.55;';
const STYLE_FOOTER_LAST = 'margin:0;font-size:12px;color:#8b8d95;line-height:1.55;';
const STYLE_PREHEADER =
  'display:none;max-height:0;overflow:hidden;mso-hide:all;color:#f7f7f4;';

export interface SendDailyBriefInput {
  brief: ComposedBrief;
  state: BriefState;
  /** Override the recipient. Defaults to DAILY_BRIEF_RECIPIENT env or `info@eazyaccess.org`. */
  to?: string;
  /** Override the sender. Defaults to DAILY_BRIEF_FROM env or `Flintmere <hello@flintmere.com>`. */
  from?: string;
}

export async function sendDailyBrief(
  input: SendDailyBriefInput,
): Promise<SendEmailResult> {
  const to = input.to ?? process.env.DAILY_BRIEF_RECIPIENT ?? RECIPIENT_DEFAULT;
  const from = input.from ?? process.env.DAILY_BRIEF_FROM ?? FROM_DEFAULT;
  // Prepend the deterministic health-check block. Single source of truth
  // in health-check.ts; the LLM is instructed (system prompt) not to
  // produce its own Daily health check section.
  const footer = renderPipelineFooter(input.state);
  const withHealthCheck: ComposedBrief = {
    ...input.brief,
    bodyMarkdown: `${DAILY_HEALTH_CHECK_MARKDOWN}\n${input.brief.bodyMarkdown}${footer}`,
  };
  const html = renderHtml(withHealthCheck, input.state);
  const text = renderText(withHealthCheck, input.state);
  const attachment = buildBriefAttachment(withHealthCheck, input.state);
  return sendEmail({
    to,
    from,
    subject: input.brief.subject,
    html,
    text,
    attachments: [attachment],
    tags: [
      { name: 'kind', value: 'daily-brief' },
      { name: 'date', value: input.state.date },
    ],
  });
}

/**
 * Build the markdown attachment that ships with every brief.
 *
 * Goal: a self-documenting `.md` file the operator can save off the
 * email and re-read later. YAML frontmatter carries date, cadence
 * source, outreach state, and any collector warnings so the file is
 * self-explanatory if shared or archived.
 *
 * Filename is sortable: `flintmere-brief-YYYY-MM-DD.md`. Operator can
 * drop a folder of these into any markdown reader and skim the day-
 * by-day history.
 */
export function buildBriefAttachment(
  brief: ComposedBrief,
  state: BriefState,
): { filename: string; content: Buffer } {
  const frontmatter = buildFrontmatter(brief, state);
  const body = brief.bodyMarkdown;
  const footer = [
    '',
    '---',
    '',
    `Composed by Flintmere · ${state.date} · ${state.weekday}.`,
    `The [ Flintmere ] team`,
    '',
  ].join('\n');
  const full = `${frontmatter}\n\n# ${brief.subject}\n\n${body}\n${footer}`;
  return {
    filename: `flintmere-brief-${state.date}.md`,
    content: Buffer.from(full, 'utf8'),
  };
}

function buildFrontmatter(brief: ComposedBrief, state: BriefState): string {
  const lastSendAt = state.outreach.lastSendAt
    ? state.outreach.lastSendAt.toISOString()
    : 'null';
  const warnings =
    state.warnings.length === 0
      ? '[]'
      : '\n' + state.warnings.map((w) => `  - ${yamlString(w)}`).join('\n');
  return [
    '---',
    `date: ${state.date}`,
    `weekday: ${state.weekday}`,
    `subject: ${yamlString(brief.subject)}`,
    `social:`,
    `  posted_last_24h: ${state.social.postedLast24h.length}`,
    `  queued_next_7d: ${state.social.queuedNext7d.length}`,
    `  failed: ${state.social.failed.length}`,
    `  x_credentials_missing: ${state.social.xCredentialsMissing}`,
    `approvals_pending: ${state.approvals.pending.length}`,
    `outreach:`,
    `  queued: ${state.outreach.queued}`,
    `  sent: ${state.outreach.sent}`,
    `  replied: ${state.outreach.replied}`,
    `  bounced: ${state.outreach.bounced}`,
    `  unsubscribed: ${state.outreach.unsubscribed}`,
    `  todays_sends: ${state.outreach.todaysSends}`,
    `  last_send_at: ${lastSendAt}`,
    `warnings: ${warnings}`,
    '---',
  ].join('\n');
}

// YAML 1.2 plain-scalar safety — single-line quoted string. Good enough
// for a brief's frontmatter; we don't carry multi-line values here.
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// ---- Deterministic "Needs you" footer ----
//
// Appended after the LLM body in both HTML and text renders (same
// mechanism as the prepended health check). Empty string when nothing
// needs the operator — the normal, good case.

export function renderPipelineFooter(state: BriefState): string {
  const lines: string[] = [];
  for (const b of state.approvals.pending) {
    const link = b.approveUrl ? ` — approve: ${b.approveUrl}` : '';
    lines.push(`- [ approve ] ${b.count} outreach emails (${b.batchId})${link}`);
  }
  for (const f of state.social.failed) {
    lines.push(`- [ failed ] X post "${f.body.slice(0, 50)}…" — ${f.errorMessage ?? 'unknown'}`);
  }
  if (state.social.xCredentialsMissing && state.social.queuedNext7d.length > 0) {
    lines.push('- [ setup ] X API keys missing — posts are queued but cannot publish. developer.x.com → create app on @flintmere_ → 4 keys → Coolify env (X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET) → redeploy.');
  }
  const heartbeat = state.social.lastAgentInsertAt;
  const eightDays = 8 * 24 * 60 * 60 * 1000;
  if (heartbeat && Date.now() - heartbeat.getTime() > eightDays) {
    lines.push(`- [ stale ] weekly content agent last ran ${heartbeat.toISOString().slice(0, 10)} — check the scheduled routine.`);
  }
  if (lines.length === 0) return '';
  return ['', '---', '', '## Needs you', '', ...lines].join('\n');
}

// ---- HTML render ----

export function renderHtml(brief: ComposedBrief, state: BriefState): string {
  const body = renderMarkdownToHtml(brief.bodyMarkdown);
  const warningsBlock =
    state.warnings.length > 0
      ? `<hr style="${STYLE_RULE}" /><p style="${STYLE_FOOTER}"><strong>Collector warnings.</strong></p><ul style="${STYLE_LIST}">${state.warnings
          .map((w) => `<li style="${STYLE_LI}font-size:12px;color:#8b8d95;">${esc(w)}</li>`)
          .join('')}</ul>`
      : '';

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${esc(brief.subject)}</title>`,
    '</head>',
    `<body style="${STYLE_BODY}">`,
    `<div style="${STYLE_PREHEADER}">${esc(brief.preheader)}</div>`,
    `<div style="${STYLE_COLUMN}">`,
    body,
    warningsBlock,
    `<hr style="${STYLE_RULE}" />`,
    `<p style="${STYLE_FOOTER}">Markdown copy attached as <span style="${STYLE_BRACKET}">flintmere-brief-${esc(state.date)}.md</span> &mdash; save it for the archive.</p>`,
    `<p style="${STYLE_FOOTER}">Composed by Flintmere &middot; <span style="${STYLE_BRACKET}">${esc(state.date)}</span> &middot; ${esc(state.weekday)}.</p>`,
    `<p style="${STYLE_FOOTER_LAST}">The <span style="${STYLE_BRACKET}">[&nbsp;Flintmere&nbsp;]</span> team</p>`,
    '</div>',
    '</body>',
    '</html>',
  ].join('');
}

export function renderText(brief: ComposedBrief, state: BriefState): string {
  const warnings =
    state.warnings.length > 0
      ? '\n\n--- Collector warnings ---\n' + state.warnings.map((w) => `  - ${w}`).join('\n')
      : '';
  return [
    brief.bodyMarkdown,
    warnings,
    '',
    `--`,
    `Markdown copy attached as flintmere-brief-${state.date}.md — save for the archive.`,
    `Flintmere · ${state.date} · ${state.weekday}`,
    `The [ Flintmere ] team`,
  ].join('\n');
}

// ---- Tiny markdown renderer ----
//
// Constructs supported: ## H2, ### H3, blank-line-separated paragraphs,
// `- ` and `* ` unordered lists, `N. ` ordered lists, fenced code blocks
// (```bash ... ```), inline `code`, **bold**. Everything else renders as
// plain paragraph text. This stays in one ~80-line function rather than
// pulling in a markdown dep — the grammar the LLM emits is bounded.

export function renderMarkdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === '') {
      i++;
      continue;
    }
    // Fenced code block
    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i]!)) {
        codeLines.push(lines[i]!);
        i++;
      }
      if (i < lines.length) i++; // skip closing fence
      out.push(`<pre style="${STYLE_PRE}">${esc(codeLines.join('\n'))}</pre>`);
      continue;
    }
    // Heading
    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2) {
      out.push(`<h2 style="${STYLE_H2}">${renderInline(h2[1]!)}</h2>`);
      i++;
      continue;
    }
    const h3 = /^###\s+(.*)$/.exec(line);
    if (h3) {
      out.push(`<h3 style="${STYLE_H3}">${renderInline(h3[1]!)}</h3>`);
      i++;
      continue;
    }
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      out.push(`<hr style="${STYLE_RULE}" />`);
      i++;
      continue;
    }
    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^[-*]\s+/, ''));
        i++;
      }
      out.push(
        `<ul style="${STYLE_LIST}">${items.map((it) => `<li style="${STYLE_LI}">${renderInline(it)}</li>`).join('')}</ul>`,
      );
      continue;
    }
    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\d+\.\s+/, ''));
        i++;
      }
      out.push(
        `<ol style="${STYLE_LIST}">${items.map((it) => `<li style="${STYLE_LI}">${renderInline(it)}</li>`).join('')}</ol>`,
      );
      continue;
    }
    // Paragraph (collect contiguous non-blank, non-block lines)
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i]!.trim() !== '' &&
      !/^(```|##\s|###\s|---+$|[-*]\s|\d+\.\s)/.test(lines[i]!)
    ) {
      paraLines.push(lines[i]!);
      i++;
    }
    out.push(`<p style="${STYLE_PARA}">${renderInline(paraLines.join(' '))}</p>`);
  }
  return out.join('');
}

function renderInline(raw: string): string {
  // Escape FIRST. Then re-inject the inline markdown markers we recognise.
  // Order matters: code spans must be substituted before bold so backticks
  // inside `**foo**` aren't accidentally re-bolded.
  let s = esc(raw);
  s = s.replace(/`([^`]+)`/g, (_, code) => `<code style="${STYLE_INLINE_CODE}">${code}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
