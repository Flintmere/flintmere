/**
 * Compose today's brief via Gemini 2.5 Flash on Vertex (per ADR 0005).
 *
 * The LLM's job is narrow: given the playbook + cadence + outreach state,
 * extract today's tasks, order them by time of day, end with bandwidth
 * math. Voice constraints (British, no banned phrases, baby steps) live
 * in the system prompt; the playbook content is the authoritative source
 * for what's due — the LLM is not licensed to invent tasks.
 *
 * On Vertex failure we fall back to a deterministic template that emits
 * today's playbook block raw. The channel never goes silent.
 */

import { VertexProvider, type CompletionOpts } from '@flintmere/llm';
import type { BriefState, ComposedBrief } from './types';

const SUBJECT_MAX = 90;
const PREHEADER_MAX = 140;

const SYSTEM_PROMPT = [
  "You are composing the Flintmere operator's daily brief — a baby-step",
  'plan for one solo founder running a 9-to-5 day-job alongside the',
  'company. Bandwidth posture is ~20hr/week sustainable, spread across',
  'every day (weekends included). The brief is operator-facing, internal,',
  'never customer-visible.',
  '',
  'Source material (in priority order):',
  '  1. The operator daily playbook — authoritative for what is due today',
  '     (may be absent in this environment; compose from cadence then).',
  '  2. The marketing-launch cadence runbook — week-by-week day-by-day.',
  '  3. Live outreach DB state — concrete counters to ground the brief.',
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
  '    "Don\'t publish. Final polish + schedule lands Sun 2026-05-17."',
  '',
  'Honest pushback (load-bearing). If a cadence task is stale or',
  'contradicted by live state, flag it in ONE sharp sentence — do not',
  'soften it.',
  '  Bad: "This may suggest the cadence runbook needs to be updated to',
  '        reflect current activity."',
  '  Good: "Cadence says 9 June. DB shows 15 sent today. Cadence is stale."',
  '',
  'DO NOT include a Daily health check section. The five-tab glance is',
  'prepended deterministically before your body. Start your body with',
  'the first action item BEYOND the health check (drafting block,',
  'outreach review, deploy verification, whatever today calls for).',
  '',
  'Output shape (markdown):',
  "  • Lead with a single tight line of framing ('today is X kind of day').",
  '  • Order tasks by time of day or execution order.',
  '  • Number every step. Steps are imperatives.',
  '  • Use fenced ```bash``` blocks for any shell command — operator',
  '    copies verbatim.',
  '  • Group steps under `##` section headings (e.g. "Pre-flight",',
  '    "Drafting block", "End of day"). Skip empty sections.',
  '  • Close with a one-sentence bandwidth footer: total active minutes',
  '    spread across the day.',
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

function buildUserPrompt(state: BriefState): string {
  const outreach = state.outreach;
  const lastSendLine = outreach.lastSendAt
    ? `last send at ${outreach.lastSendAt.toISOString()}`
    : 'no sends yet';
  const warnings =
    state.warnings.length > 0
      ? `\nCollector warnings (surface in brief footer):\n  - ${state.warnings.join('\n  - ')}`
      : '';

  // Cadence is always present (bundled snapshot). Playbook is operator-
  // local and absent on prod — the LLM should compose from cadence in
  // that case rather than apologise for the missing playbook.
  const playbookBlock = state.playbookContent
    ? [
        '----- BEGIN OPERATOR DAILY PLAYBOOK -----',
        state.playbookContent,
        '----- END OPERATOR DAILY PLAYBOOK -----',
        '',
      ].join('\n')
    : '(operator playbook not available in this environment — compose from the cadence runbook alone; do not mention the missing playbook)\n';

  return [
    `Today's date: ${state.date} (${state.weekday}, Europe/London).`,
    `Cadence snapshot taken: ${state.cadenceSnapshotAt} from ${state.cadenceSource}.`,
    '',
    'Live outreach state:',
    `  queued: ${outreach.queued}`,
    `  sent: ${outreach.sent}`,
    `  replied: ${outreach.replied}`,
    `  bounced: ${outreach.bounced}`,
    `  unsubscribed: ${outreach.unsubscribed}`,
    `  today's sends so far: ${outreach.todaysSends}`,
    `  ${lastSendLine}`,
    warnings,
    '',
    playbookBlock,
    '----- BEGIN MARKETING-LAUNCH CADENCE -----',
    state.cadenceContent,
    '----- END MARKETING-LAUNCH CADENCE -----',
    '',
    "Compose today's brief now. Find today's tasks by matching today's",
    'date and weekday against the cadence runbook (W0/W1/W2 day-by-day',
    'blocks). Output JSON only.',
  ].join('\n');
}

// ---- Fallback ----

function fallbackBrief(state: BriefState, reason: string): ComposedBrief {
  // Prefer the playbook's `## Today —` block (operator-authored,
  // most specific). Fall back to the whole playbook, then the cadence
  // snapshot. The cadence is always present (bundled), so the brief
  // never ships empty.
  const todayBlock =
    extractTodayBlock(state.playbookContent) ||
    state.playbookContent ||
    state.cadenceContent;
  const subject = `Daily brief · ${state.weekday} ${state.date} (fallback)`;
  const preheader = `LLM compose unavailable — source block raw. ${reason}.`;
  const bodyMarkdown = [
    `## ${state.weekday} ${state.date} — fallback brief`,
    '',
    `LLM compose failed (${reason}). Surfacing source content raw so the channel doesn't go silent.`,
    '',
    todayBlock,
    '',
    '---',
    '',
    '## Outreach state',
    '',
    `- queued: ${state.outreach.queued}`,
    `- sent: ${state.outreach.sent}`,
    `- replied: ${state.outreach.replied}`,
    `- today's sends so far: ${state.outreach.todaysSends}`,
    state.outreach.lastSendAt
      ? `- last send: ${state.outreach.lastSendAt.toISOString()}`
      : '- last send: none',
  ].join('\n');
  return { subject: subject.slice(0, SUBJECT_MAX), preheader, bodyMarkdown };
}

/** Best-effort `## Today —` block extraction from the playbook. Returns
 *  null if no heading matches; caller falls back to the whole document. */
export function extractTodayBlock(playbook: string): string | null {
  const lines = playbook.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+Today\s+/.test(lines[i]!)) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i]!)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim();
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
