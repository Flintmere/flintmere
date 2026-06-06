import { describe, it, expect } from 'vitest';
import { formatLondonDate, formatLondonWeekday } from './state';
import { extractTodayBlock } from './compose';
import {
  renderMarkdownToHtml,
  renderText,
  renderHtml,
  buildBriefAttachment,
} from './email';
import { DAILY_HEALTH_CHECK_MARKDOWN } from './health-check';
import type { BriefState, ComposedBrief } from './types';

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

describe('extractTodayBlock', () => {
  it('extracts the block between `## Today —` and the next `##` heading', () => {
    const playbook = [
      '# Title',
      '',
      '## Daily health check',
      'preamble',
      '',
      '## Today — Wed 2026-05-13',
      '',
      'first step',
      'second step',
      '',
      '## Tomorrow — Thu 2026-05-14',
      'tomorrow content',
    ].join('\n');
    const block = extractTodayBlock(playbook);
    expect(block).toContain('Today — Wed 2026-05-13');
    expect(block).toContain('first step');
    expect(block).toContain('second step');
    expect(block).not.toContain('Tomorrow');
    expect(block).not.toContain('Daily health check');
  });

  it('returns null when no `## Today —` heading present', () => {
    expect(extractTodayBlock('## Something else\nbody')).toBeNull();
  });

  it('extracts to end of document when no following `##` heading', () => {
    const playbook = '## Today — Wed\nbody line\n';
    const block = extractTodayBlock(playbook);
    expect(block).toContain('body line');
  });
});

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

describe('renderText', () => {
  it('returns markdown body verbatim plus footer', () => {
    const brief: ComposedBrief = {
      subject: 's',
      preheader: 'p',
      bodyMarkdown: '## Today\nFirst.',
    };
    const state: BriefState = {
      date: '2026-05-13',
      weekday: 'Wed',
      playbookContent: '',
      cadenceContent: '',
      cadenceSource: 'test.md',
      cadenceSnapshotAt: '2026-05-13T00:00:00.000Z',
      outreach: {
        queued: 0,
        sent: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
        lastSendAt: null,
        todaysSends: 0,
      },
      warnings: [],
    };
    const text = renderText(brief, state);
    expect(text).toContain('## Today');
    expect(text).toContain('First.');
    expect(text).toContain('2026-05-13');
    expect(text).toContain('The [ Flintmere ] team');
  });
});

describe('buildBriefAttachment', () => {
  const brief: ComposedBrief = {
    subject: 'Daily brief · Wed 2026-05-13',
    preheader: 'p',
    bodyMarkdown: '## Pre-flight\n1. Open laptop.',
  };
  const state: BriefState = {
    date: '2026-05-13',
    weekday: 'Wed',
    playbookContent: '',
    cadenceContent: '',
    cadenceSource: '2026-05-11-marketing-launch-and-cadence.md',
    cadenceSnapshotAt: '2026-05-13T12:27:40.372Z',
    outreach: {
      queued: 0,
      sent: 30,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      lastSendAt: new Date('2026-05-13T08:00:49.021Z'),
      todaysSends: 15,
    },
    warnings: [],
  };

  it('emits a dated, sortable filename', () => {
    const { filename } = buildBriefAttachment(brief, state);
    expect(filename).toBe('flintmere-brief-2026-05-13.md');
  });

  it('emits a UTF-8 Buffer', () => {
    const { content } = buildBriefAttachment(brief, state);
    expect(Buffer.isBuffer(content)).toBe(true);
    expect(content.toString('utf8')).toContain('## Pre-flight');
  });

  it('opens with YAML frontmatter carrying state', () => {
    const text = buildBriefAttachment(brief, state).content.toString('utf8');
    expect(text.startsWith('---\n')).toBe(true);
    expect(text).toContain('date: 2026-05-13');
    expect(text).toContain('weekday: Wed');
    expect(text).toContain('cadence_source: "2026-05-11-marketing-launch-and-cadence.md"');
    expect(text).toContain('  sent: 30');
    expect(text).toContain('  todays_sends: 15');
    expect(text).toContain('  last_send_at: 2026-05-13T08:00:49.021Z');
  });

  it('encodes warnings as a YAML list when present', () => {
    const stateWithWarnings: BriefState = {
      ...state,
      warnings: ['outreach DB query failed: "connection refused"'],
    };
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

describe('renderHtml', () => {
  it('wraps composed brief in letterhead chrome and surfaces warnings', () => {
    const brief: ComposedBrief = {
      subject: 'Daily brief · Wed 2026-05-13',
      preheader: 'Today: drafting block at 19:00.',
      bodyMarkdown: '## Pre-flight\n1. Open laptop.',
    };
    const state: BriefState = {
      date: '2026-05-13',
      weekday: 'Wed',
      playbookContent: '',
      cadenceContent: '',
      cadenceSource: 'test.md',
      cadenceSnapshotAt: '2026-05-13T00:00:00.000Z',
      outreach: {
        queued: 0,
        sent: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
        lastSendAt: null,
        todaysSends: 0,
      },
      warnings: ['outreach DB query failed — counters omitted: connection refused'],
    };
    const html = renderHtml(brief, state);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Today: drafting block at 19:00.'); // preheader
    expect(html).toContain('<h2');
    expect(html).toContain('Pre-flight');
    expect(html).toContain('Collector warnings');
    expect(html).toContain('connection refused');
    expect(html).toContain('[&nbsp;Flintmere&nbsp;]');
    expect(html).toContain('2026-05-13');
  });
});
