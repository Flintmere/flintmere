import { describe, it, expect } from 'vitest';
import { formatLondonDate, formatLondonWeekday } from './state';
import {
  renderMarkdownToHtml,
  renderText,
  renderHtml,
  buildBriefAttachment,
  renderPipelineFooter,
} from './email';
import { DAILY_HEALTH_CHECK_MARKDOWN } from './health-check';
import type { BriefState, ComposedBrief, SocialSnapshot } from './types';

// ---- Fixtures ----

function emptySocial(): SocialSnapshot {
  return {
    postedLast24h: [],
    queuedNext7d: [],
    failed: [],
    xCredentialsMissing: false,
    lastAgentInsertAt: null,
  };
}

function baseState(overrides: Partial<BriefState> = {}): BriefState {
  return {
    date: '2026-05-13',
    weekday: 'Wed',
    outreach: {
      queued: 0,
      sent: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      lastSendAt: null,
      todaysSends: 0,
    },
    social: emptySocial(),
    approvals: { pending: [] },
    posthog: null,
    warnings: [],
    ...overrides,
  };
}

// ---- Date helpers ----

describe('formatLondonDate', () => {
  it('emits YYYY-MM-DD in Europe/London', () => {
    const d = new Date('2026-05-13T03:00:00Z');
    expect(formatLondonDate(d)).toBe('2026-05-13');
  });

  it('rolls forward to next London day across midnight BST', () => {
    // 23:30 UTC on 2026-05-12 = 00:30 BST on 2026-05-13.
    const d = new Date('2026-05-12T23:30:00Z');
    expect(formatLondonDate(d)).toBe('2026-05-13');
  });
});

describe('formatLondonWeekday', () => {
  it('returns short weekday name', () => {
    const d = new Date('2026-05-13T09:00:00Z'); // Wednesday
    expect(formatLondonWeekday(d)).toBe('Wed');
  });
});

// ---- Markdown renderer ----

describe('renderMarkdownToHtml', () => {
  it('renders an h2', () => {
    const html = renderMarkdownToHtml('## Pre-flight');
    expect(html).toContain('<h2');
    expect(html).toContain('Pre-flight');
  });

  it('renders ordered lists', () => {
    const md = '1. first\n2. second\n3. third';
    const html = renderMarkdownToHtml(md);
    expect(html).toContain('<ol');
    expect(html).toMatch(/<li[^>]*>first<\/li>/);
    expect(html).toMatch(/<li[^>]*>third<\/li>/);
  });

  it('renders unordered lists', () => {
    const md = '- alpha\n- beta';
    const html = renderMarkdownToHtml(md);
    expect(html).toContain('<ul');
    expect(html).toMatch(/<li[^>]*>alpha<\/li>/);
  });

  it('renders fenced code blocks', () => {
    const md = '```bash\necho hello\n```';
    const html = renderMarkdownToHtml(md);
    expect(html).toContain('<pre');
    expect(html).toContain('echo hello');
  });

  it('renders inline code', () => {
    const html = renderMarkdownToHtml('Run `pnpm typecheck` now.');
    expect(html).toMatch(/<code[^>]*>pnpm typecheck<\/code>/);
  });

  it('renders bold', () => {
    const html = renderMarkdownToHtml('Lead with **today**.');
    expect(html).toContain('<strong>today</strong>');
  });

  it('escapes HTML in raw text', () => {
    const html = renderMarkdownToHtml('Visit <script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes HTML inside code blocks', () => {
    const html = renderMarkdownToHtml('```\n<dangerous>\n```');
    expect(html).not.toContain('<dangerous>');
    expect(html).toContain('&lt;dangerous&gt;');
  });
});

// ---- Text render ----

describe('renderText', () => {
  it('returns markdown body verbatim plus footer', () => {
    const brief: ComposedBrief = {
      subject: 's',
      preheader: 'p',
      bodyMarkdown: '## Shipped\nFirst.',
    };
    const text = renderText(brief, baseState());
    expect(text).toContain('## Shipped');
    expect(text).toContain('First.');
    expect(text).toContain('2026-05-13');
    expect(text).toContain('The [ Flintmere ] team');
  });
});

// ---- Attachment ----

describe('buildBriefAttachment', () => {
  const brief: ComposedBrief = {
    subject: 'Daily brief · Wed 2026-05-13',
    preheader: 'p',
    bodyMarkdown: '## Shipped\n- Two posts went out.',
  };
  const state = baseState({
    outreach: {
      queued: 0,
      sent: 30,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      lastSendAt: new Date('2026-05-13T08:00:49.021Z'),
      todaysSends: 15,
    },
    social: {
      ...emptySocial(),
      postedLast24h: [{ body: 'a', externalId: '1' }],
      queuedNext7d: [{ body: 'b', scheduledAt: new Date('2026-05-14T09:00:00Z') }],
    },
    approvals: {
      pending: [
        {
          batchId: 'b1',
          count: 20,
          oldestStagedAt: new Date('2026-05-12T09:00:00Z'),
          approveUrl: 'https://audit.flintmere.com/api/approve?token=t',
        },
      ],
    },
  });

  it('emits a dated, sortable filename', () => {
    const { filename } = buildBriefAttachment(brief, state);
    expect(filename).toBe('flintmere-brief-2026-05-13.md');
  });

  it('emits a UTF-8 Buffer', () => {
    const { content } = buildBriefAttachment(brief, state);
    expect(Buffer.isBuffer(content)).toBe(true);
    expect(content.toString('utf8')).toContain('## Shipped');
  });

  it('opens with YAML frontmatter carrying state', () => {
    const text = buildBriefAttachment(brief, state).content.toString('utf8');
    expect(text.startsWith('---\n')).toBe(true);
    expect(text).toContain('date: 2026-05-13');
    expect(text).toContain('weekday: Wed');
    expect(text).toContain('  posted_last_24h: 1');
    expect(text).toContain('  queued_next_7d: 1');
    expect(text).toContain('approvals_pending: 1');
    expect(text).toContain('  sent: 30');
    expect(text).toContain('  todays_sends: 15');
    expect(text).toContain('  last_send_at: 2026-05-13T08:00:49.021Z');
  });

  it('encodes warnings as a YAML list when present', () => {
    const stateWithWarnings = baseState({
      warnings: ['outreach DB query failed: "connection refused"'],
    });
    const text = buildBriefAttachment(brief, stateWithWarnings).content.toString('utf8');
    expect(text).toMatch(/warnings: \n  - "outreach DB query failed: \\"connection refused\\""/);
  });

  it('escapes quotes and backslashes in YAML string values', () => {
    const briefWithSpecials: ComposedBrief = {
      ...brief,
      subject: 'has "quote" and \\backslash',
    };
    const text = buildBriefAttachment(briefWithSpecials, state).content.toString('utf8');
    expect(text).toContain('subject: "has \\"quote\\" and \\\\backslash"');
  });

  it('closes with the bracket signature footer', () => {
    const text = buildBriefAttachment(brief, state).content.toString('utf8');
    expect(text).toContain('The [ Flintmere ] team');
  });
});

// ---- Health check block ----

describe('DAILY_HEALTH_CHECK_MARKDOWN', () => {
  it('lists the five canonical tabs', () => {
    expect(DAILY_HEALTH_CHECK_MARKDOWN).toContain('BetterStack');
    expect(DAILY_HEALTH_CHECK_MARKDOWN).toContain('Resend');
    expect(DAILY_HEALTH_CHECK_MARKDOWN).toContain('PostHog');
    expect(DAILY_HEALTH_CHECK_MARKDOWN).toContain('Admin outreach');
    expect(DAILY_HEALTH_CHECK_MARKDOWN).toContain('Sentry');
  });

  it('renders cleanly through markdown→HTML', () => {
    const html = renderMarkdownToHtml(DAILY_HEALTH_CHECK_MARKDOWN);
    expect(html).toContain('<h2');
    expect(html).toContain('Daily health check');
    expect(html).toContain('<ol');
    expect(html).toContain('uptime.betterstack.com');
    expect(html).toContain('eu.posthog.com');
  });
});

// ---- HTML render ----

describe('renderHtml', () => {
  it('wraps composed brief in letterhead chrome and surfaces warnings', () => {
    const brief: ComposedBrief = {
      subject: 'Daily brief · Wed 2026-05-13',
      preheader: 'Quiet day. Two posts scheduled.',
      bodyMarkdown: '## Shipped\nNothing posted.',
    };
    const state = baseState({
      warnings: ['outreach DB query failed — counters omitted: connection refused'],
    });
    const html = renderHtml(brief, state);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Quiet day. Two posts scheduled.'); // preheader
    expect(html).toContain('<h2');
    expect(html).toContain('Shipped');
    expect(html).toContain('Collector warnings');
    expect(html).toContain('connection refused');
    expect(html).toContain('[&nbsp;Flintmere&nbsp;]');
    expect(html).toContain('2026-05-13');
  });
});

// ---- Deterministic pipeline footer ----

describe('renderPipelineFooter', () => {
  it('footer lists pending approval batch with link', () => {
    const state = baseState({
      approvals: {
        pending: [
          {
            batchId: 'b1',
            count: 20,
            oldestStagedAt: new Date('2026-05-12T09:00:00Z'),
            approveUrl: 'https://audit.flintmere.com/api/approve?token=t',
          },
        ],
      },
    });
    const footer = renderPipelineFooter(state);
    expect(footer).toContain('## Needs you');
    expect(footer).toContain('[ approve ] 20 outreach emails (b1)');
    expect(footer).toContain('/api/approve?token=t');
  });

  it('footer absent when nothing needs the operator', () => {
    const footer = renderPipelineFooter(baseState());
    expect(footer).toBe('');
    expect(footer).not.toContain('Needs you');
  });

  it('footer flags missing X credentials only when posts are queued', () => {
    const queued = baseState({
      social: {
        ...emptySocial(),
        xCredentialsMissing: true,
        queuedNext7d: [{ body: 'queued post', scheduledAt: new Date('2026-05-14T09:00:00Z') }],
      },
    });
    expect(renderPipelineFooter(queued)).toContain('[ setup ] X API keys missing');

    const emptyQueue = baseState({
      social: { ...emptySocial(), xCredentialsMissing: true },
    });
    expect(renderPipelineFooter(emptyQueue)).not.toContain('[ setup ] X API keys missing');
  });

  it('footer flags a failed X post', () => {
    const state = baseState({
      social: {
        ...emptySocial(),
        failed: [{ body: 'a post that failed to publish', errorMessage: '401 unauthorized' }],
      },
    });
    const footer = renderPipelineFooter(state);
    expect(footer).toContain('[ failed ] X post');
    expect(footer).toContain('401 unauthorized');
  });

  it('footer flags a stale weekly agent heartbeat', () => {
    const state = baseState({
      social: {
        ...emptySocial(),
        lastAgentInsertAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
    });
    const footer = renderPipelineFooter(state);
    expect(footer).toContain('[ stale ] weekly content agent last ran');
  });
});
