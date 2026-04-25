#!/usr/bin/env node
/**
 * Smoke test for the OpenAI Platform fallback provider per ADR 0010.
 *
 * Usage (from /packages/llm):
 *   pnpm build
 *   OPENAI_API_KEY=$(cat /tmp/openai_key) \
 *   OPENAI_PROJECT_ID=proj_tm1F1hYtq8pfQXdjPMut18Dw \
 *     node scripts/smoke-openai.mjs
 *
 * Validates: project-key construction, basic completion, sanitizer warn-log,
 * vision rejection.
 */

import { OpenAIProvider, LLMError } from '../dist/index.js';

const apiKey = process.env.OPENAI_API_KEY;
const projectId = process.env.OPENAI_PROJECT_ID;

if (!apiKey) throw new Error('OPENAI_API_KEY env var required');
if (!projectId) throw new Error('OPENAI_PROJECT_ID env var required');

let redactionEvents = 0;
const provider = new OpenAIProvider({
  apiKey,
  projectId,
  model: 'gpt-4o-mini',
  inputPriceTenthPencePerMillion: 120,
  outputPriceTenthPencePerMillion: 480,
  onRedactions: (count) => {
    redactionEvents += count;
    console.log(`[sanitizer] redactions=${count}`);
  },
});

console.log('=== Test 1: basic completion ===');
const t0 = Date.now();
const result = await provider.complete({
  messages: [
    { role: 'system', content: 'You are concise.' },
    { role: 'user', content: 'Reply with exactly the three words: smoke test passed' },
  ],
  maxOutputTokens: 32,
  temperature: 0,
});
console.log(JSON.stringify({
  provider: result.provider,
  model: result.model,
  text: result.text.trim(),
  finishReason: result.finishReason,
  inputTokens: result.usage.inputTokens,
  outputTokens: result.usage.outputTokens,
  latencyMs: result.latencyMs,
  costTenthPence: result.costTenthPence,
  totalElapsedMs: Date.now() - t0,
}, null, 2));

if (result.provider !== 'openai') throw new Error(`expected provider 'openai', got '${result.provider}'`);
if (!result.text || result.text.length === 0) throw new Error('empty completion text');
if (result.usage.outputTokens === 0) throw new Error('zero output tokens reported');

console.log('\n=== Test 2: sanitizer warn-log on PII ===');
const piiResult = await provider.complete({
  messages: [
    { role: 'user', content: 'Catalog cleanup test. Customer email is buyer@shop.io and phone is +44 20 7946 0958.' },
  ],
  maxOutputTokens: 32,
  temperature: 0,
});
console.log(`completion text: ${piiResult.text.trim().slice(0, 80)}`);
console.log(`redaction events captured: ${redactionEvents}`);
if (redactionEvents < 2) throw new Error(`expected ≥2 redactions (email + phone), got ${redactionEvents}`);

console.log('\n=== Test 3: vision rejection (ADR 0010) ===');
try {
  await provider.completeVision({
    messages: [{ role: 'user', content: 'Describe.' }],
    maxOutputTokens: 32,
    temperature: 0,
    images: [{ data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUeJxjYAAAAAIAAUivpHEAAAAASUVORK5CYII=', mimeType: 'image/png' }],
  });
  throw new Error('expected LLMError, got success');
} catch (err) {
  if (!(err instanceof LLMError)) throw err;
  if (err.code !== 'invalid-input') throw new Error(`expected code 'invalid-input', got '${err.code}'`);
  console.log(`✓ rejected: ${err.message.slice(0, 100)}...`);
}

console.log('\n=== Test 4: user-key rejection ===');
try {
  new OpenAIProvider({ apiKey: 'sk-not-a-project-key', projectId, model: 'gpt-4o-mini' });
  throw new Error('expected LLMError on user key, got success');
} catch (err) {
  if (!(err instanceof LLMError)) throw err;
  if (err.code !== 'auth') throw new Error(`expected code 'auth', got '${err.code}'`);
  console.log(`✓ rejected: ${err.message.slice(0, 80)}...`);
}

console.log('\nAll smoke tests passed.');
