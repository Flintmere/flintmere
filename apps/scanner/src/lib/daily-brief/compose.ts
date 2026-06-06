/**
 * Compose today's brief via Gemini 2.5 Flash on Vertex (per ADR 0005).
 *
 * The LLM narrates live marketing-pipeline state (ADR 0026): what the
 * social queue shipped since yesterday, what's scheduled next, what
 * outreach awaits approval, and the Monday PostHog rollup. Voice
 * constraints (British, no banned phrases, baby steps) live in the
 * system prompt; live pipeline state is the authoritative source — the
 * LLM is not licensed to invent tasks or activity.
 *
 * On Vertex failure we fall back to a deterministic report built from
 * state. The channel never goes silent.
 */

import { VertexProvider, type CompletionOpts } from '@flintmere/llm';
import type { BriefState, ComposedBrief } from './types';

const SUBJECT_MAX = 90;
const PREHEADER_MAX = 140;
const BODY_EXCERPT = 120;

const SYSTEM_PROMPT = [
  "You are composing the Flintmere operator's daily brief — a baby-step",
  'plan for one solo founder running a 9-to-5 day-job alongside the',
  'company. Bandwidth posture is ~20hr/week sustainable, spread across',
  'every day (weekends included). The brief is operator-facing, internal,',
  'never customer-visible.',
  '',
  'Source material (in priority order):',
  '  1. Live pipeline state (social queue, outreach approvals, PostHog) —',
  '     authoritative for what HAPPENED and what\'s SCHEDULED.',
  '  2. The operator does NOT execute marketing tasks. Agents draft, the',
  '     app publishes. Mention an operator action ONLY when state demands',
  '     a human: a pending approve link, a failed X post, missing X',
  '     credentials, a stale agent heartbeat.',
  '',
  'Report shape: lead with what shipped since yesterday, then what\'s',
  'scheduled next, then (only if any) the needs-you list. If nothing',
  'needs the operator, say so in one line — that is the normal, good case.',
  '',
  'Voice (binding):',
  '',
  '  Register: a colleague leaving a sticky note for tomorrow-you. NOT a',
  '  PR team writing a status update. NOT a project manager updating a',
  '  client. Short sentences. Imperative ("Open …", "Run …", "Confirm …",',
  '  "Note anything zero"). Contractions fine. Reasons go INLINE with',
  '  the action ("Open BetterStack — any monitor red?"), never split',
  '  out as their own sentence ("This step is important because…").',
  '',
  '  British English: colour, organise, behaviour, prioritise. No',
  '  Americanisms.',
  '',
  '  Banned phrases (hard): leverage (as a verb), unlock, transform,',
  '  synergy, supercharge, world-class, industry-leading, AI-powered,',
  '  best-in-class, "ChatGPT will recommend you", AI-driven.',
  '',
  '  Banned softeners + corporate registers (hard): "foundational day",',
  '  "critical setup", "this indicates", "this suggests", "please',
  '  clarify if this is intended", "ensure", "going forward", "in order',
  '  to", "carefully", "thoroughly", "diligently", "successfully".',
  '',
  '  Operator-voice samples (the target register — taken from the',
  '  operator\'s own playbook authoring):',
  '    "Past = past. Don\'t catch up; roll forward."',
  '    "Daily health check — every weekday, ≤5 min, before any other task."',
  '    "Run this even on bandwidth-crash days."',
  '    "If all five clear, move on."',
  '    "Note anything zero or unusually high."',
  '',
  'Honest pushback (load-bearing). If live state contradicts itself or',
  'looks stale, flag it in ONE sharp sentence — do not soften it.',
  '  Bad: "This may suggest the pipeline needs attention."',
  '  Good: "Agent last ran 12 days ago. The weekly routine has stopped."',
  '',
  'DO NOT include a Daily health check section. The five-tab glance is',
  'prepended deterministically before your body. Start your body with',
  'the shipped-since-yesterday summary.',
  '',
  'Output shape (markdown):',
  "  • Lead with a single tight line of framing ('quiet day' / 'two posts",
  "    shipped, one batch waiting').",
  '  • Group steps under `##` section headings (e.g. "Shipped",',
  '    "Scheduled next", "Needs you"). Skip empty sections.',
  '  • Use fenced ```bash``` blocks for any shell command — operator',
  '    copies verbatim.',
  '  • A deterministic "Needs you" footer is appended after your body;',
  '    don\'t duplicate approve links or failure lines — summarise in prose.',
  '',
  'Length budget: ≤450 words (the prepended health-check adds ~80 more).',
  '',
  'Output strictly as JSON — no prose outside the JSON, no markdown code',
  'fence wrapping the JSON:',
  '{',
  '  "subject": "string (≤90 chars)",',
  '  "preheader": "string (≤140 chars, inbox preview)",',
  '  "bodyMarkdown": "string (the brief body, markdown)"',
  '}',
].join('\n');

export interface ComposeOptions {
  /** Inject a VertexProvider for tests; defaults to a fresh build from env. */
  vertex?: VertexProvider;
}

export async function composeBrief(
  state: BriefState,
  options: ComposeOptions = {},
): Promise<ComposedBrief> {
  const vertex = options.vertex ?? buildVertex(process.env);
  if (!vertex) {
    return fallbackBrief(state, 'vertex unavailable (missing GOOGLE_CLOUD_PROJECT)');
  }

  try {
    return await composeViaVertex(vertex, state);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown';
    return fallbackBrief(state, `vertex compose failed — ${reason}`);
  }
}

async function composeViaVertex(
  vertex: VertexProvider,
  state: BriefState,
): Promise<ComposedBrief> {
  const opts: CompletionOpts = {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(state) },
    ],
    maxOutputTokens: 8192,
    temperature: 0.2,
    responseMimeType: 'application/json',
    tag: 'daily-brief',
  };
  const result = await vertex.complete(opts);
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch (err) {
    throw new Error(
      `compose output not JSON: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
  return validateAndClamp(parsed);
}

function validateAndClamp(raw: unknown): ComposedBrief {
  if (!raw || typeof raw !== 'object') throw new Error('compose output not an object');
  const obj = raw as Record<string, unknown>;
  const subject = typeof obj.subject === 'string' ? obj.subject : '';
  const preheader = typeof obj.preheader === 'string' ? obj.preheader : '';
  const bodyMarkdown = typeof obj.bodyMarkdown === 'string' ? obj.bodyMarkdown : '';
  if (!subject || !bodyMarkdown) {
    throw new Error('compose output missing subject or bodyMarkdown');
  }
  return {
    subject: subject.slice(0, SUBJECT_MAX),
    preheader: preheader.slice(0, PREHEADER_MAX),
    bodyMarkdown,
  };
}

function excerpt(body: string): string {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > BODY_EXCERPT ? `${clean.slice(0, BODY_EXCERPT)}…` : clean;
}

function buildUserPrompt(state: BriefState): string {
  const { outreach, social, approvals } = state;
  const lastSendLine = outreach.lastSendAt
    ? `last send at ${outreach.lastSendAt.toISOString()}`
    : 'no sends yet';

  const postedBlock =
    social.postedLast24h.length > 0
      ? social.postedLast24h.map((p) => `  - "${excerpt(p.body)}"`).join('\n')
      : '  (none)';
  const queuedBlock =
    social.queuedNext7d.length > 0
      ? social.queuedNext7d
          .map((p) => `  - ${p.scheduledAt.toISOString()} — "${excerpt(p.body)}"`)
          .join('\n')
      : '  (none)';
  const failedBlock =
    social.failed.length > 0
      ? social.failed
          .map((p) => `  - "${excerpt(p.body)}" — ${p.errorMessage ?? 'unknown error'}`)
          .join('\n')
      : '  (none)';
  const approvalBlock =
    approvals.pending.length > 0
      ? approvals.pending
          .map(
            (b) =>
              `  - batch ${b.batchId}: ${b.count} emails, oldest staged ${b.oldestStagedAt.toISOString()}` +
              (b.approveUrl ? ` — approve: ${b.approveUrl}` : ' — (no approve link: ADMIN_SESSION_SECRET unset)'),
          )
          .join('\n')
      : '  (none)';

  const heartbeat = social.lastAgentInsertAt
    ? social.lastAgentInsertAt.toISOString()
    : 'never (agent has not run)';

  const posthogBlock =
    state.posthog !== null
      ? [
          '',
          'Monday PostHog rollup (last 7 days):',
          state.posthog.available
            ? `  visitors: ${state.posthog.visitors7d}\n  scans: ${state.posthog.scans7d}`
            : '  (PostHog query unavailable — see warnings)',
        ].join('\n')
      : '';

  const warnings =
    state.warnings.length > 0
      ? `\nCollector warnings (surface in brief footer):\n  - ${state.warnings.join('\n  - ')}`
      : '';

  return [
    `Today's date: ${state.date} (${state.weekday}, Europe/London).`,
    '',
    'Social posts shipped in the last 24h:',
    postedBlock,
    '',
    'Social posts scheduled in the next 7 days:',
    queuedBlock,
    '',
    'Failed social posts (unresolved):',
    failedBlock,
    '',
    `X credentials present: ${social.xCredentialsMissing ? 'NO (posts cannot publish)' : 'yes'}`,
    `Weekly content agent last inserted: ${heartbeat}`,
    '',
    'Outreach batches awaiting approval:',
    approvalBlock,
    '',
    'Live outreach counters:',
    `  queued: ${outreach.queued}`,
    `  sent: ${outreach.sent}`,
    `  replied: ${outreach.replied}`,
    `  bounced: ${outreach.bounced}`,
    `  unsubscribed: ${outreach.unsubscribed}`,
    `  today's sends so far: ${outreach.todaysSends}`,
    `  ${lastSendLine}`,
    posthogBlock,
    warnings,
    '',
    "Compose today's brief now. Lead with what shipped, then what's",
    'scheduled, then (only if state demands it) what needs the operator.',
    'Output JSON only.',
  ].join('\n');
}

// ---- Fallback ----

function fallbackBrief(state: BriefState, reason: string): ComposedBrief {
  const { outreach, social, approvals } = state;
  const subject = `Daily brief · ${state.weekday} ${state.date} (fallback)`;
  const preheader = `LLM compose unavailable — pipeline state raw. ${reason}.`;

  const shipped =
    social.postedLast24h.length > 0
      ? social.postedLast24h.map((p) => `- "${excerpt(p.body)}"`)
      : ['- Nothing posted in the last 24h.'];
  const scheduled =
    social.queuedNext7d.length > 0
      ? social.queuedNext7d.map(
          (p) => `- ${p.scheduledAt.toISOString().slice(0, 16).replace('T', ' ')} — "${excerpt(p.body)}"`,
        )
      : ['- Nothing scheduled in the next 7 days.'];

  const needsYou: string[] = [];
  for (const b of approvals.pending) {
    const link = b.approveUrl ? ` — approve: ${b.approveUrl}` : '';
    needsYou.push(`- ${b.count} outreach emails awaiting approval (${b.batchId})${link}`);
  }
  for (const f of social.failed) {
    needsYou.push(`- Failed X post "${excerpt(f.body)}" — ${f.errorMessage ?? 'unknown'}`);
  }
  if (social.xCredentialsMissing && social.queuedNext7d.length > 0) {
    needsYou.push('- X API keys missing — posts are queued but cannot publish.');
  }

  const posthogLines =
    state.posthog !== null && state.posthog.available
      ? ['', '## Last 7 days', '', `- visitors: ${state.posthog.visitors7d}`, `- scans: ${state.posthog.scans7d}`]
      : [];

  const bodyMarkdown = [
    `## ${state.weekday} ${state.date} — fallback brief`,
    '',
    `LLM compose failed (${reason}). Pipeline state raw so the channel doesn't go silent.`,
    '',
    '## Shipped',
    '',
    ...shipped,
    '',
    '## Scheduled next',
    '',
    ...scheduled,
    ...posthogLines,
    '',
    '## Outreach state',
    '',
    `- queued: ${outreach.queued}`,
    `- sent: ${outreach.sent}`,
    `- replied: ${outreach.replied}`,
    `- today's sends so far: ${outreach.todaysSends}`,
    outreach.lastSendAt
      ? `- last send: ${outreach.lastSendAt.toISOString()}`
      : '- last send: none',
    ...(needsYou.length > 0 ? ['', '## Needs you', '', ...needsYou] : ['', 'Nothing needs you right now.']),
  ].join('\n');

  return { subject: subject.slice(0, SUBJECT_MAX), preheader: preheader.slice(0, PREHEADER_MAX), bodyMarkdown };
}

// ---- Vertex bootstrap ----

function buildVertex(env: NodeJS.ProcessEnv): VertexProvider | null {
  const project = env.GOOGLE_CLOUD_PROJECT;
  if (!project) return null;
  return new VertexProvider({
    project,
    location: env.LLM_PRIMARY_REGION ?? 'europe-west1',
    model: env.DAILY_BRIEF_MODEL ?? 'gemini-2.5-flash',
  });
}
