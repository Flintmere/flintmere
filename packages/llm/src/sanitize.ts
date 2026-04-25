/**
 * PII sanitizer applied at the OpenAI fallback boundary per ADR 0010.
 * Defensive layer — catalog payloads should not contain PII to begin with,
 * but this catches inadvertent leakage before it crosses to a non-EU-pinned
 * processor.
 */

import type { Message } from './types.js';

const REDACTED = '[REDACTED]';

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  // International phone-ish: leading + or digit, 8+ digits with optional separators
  { name: 'phone', re: /(?:\+|\b00)?\d(?:[\d\s().-]{7,}\d)/g },
  // Credit-card-like: 13–19 digits in 4-group format
  { name: 'card', re: /\b(?:\d[ -]?){12,18}\d\b/g },
];

export interface SanitizeResult {
  text: string;
  redactions: number;
}

export function sanitizeText(input: string): SanitizeResult {
  let out = input;
  let count = 0;
  for (const { re } of PATTERNS) {
    out = out.replace(re, () => {
      count += 1;
      return REDACTED;
    });
  }
  return { text: out, redactions: count };
}

export interface SanitizeMessagesResult {
  messages: Message[];
  redactions: number;
}

export function sanitizeMessages(messages: Message[]): SanitizeMessagesResult {
  let total = 0;
  const out = messages.map((m) => {
    const r = sanitizeText(m.content);
    total += r.redactions;
    return { ...m, content: r.text };
  });
  return { messages: out, redactions: total };
}
