import { describe, expect, it } from 'vitest';
import { sanitizeMessages, sanitizeText } from '../src/index.js';

describe('sanitizeText', () => {
  it('redacts email addresses', () => {
    const r = sanitizeText('Reach me at jane.doe+orders@example.co.uk for queries.');
    expect(r.text).toBe('Reach me at [REDACTED] for queries.');
    expect(r.redactions).toBe(1);
  });

  it('redacts UK and international phone numbers', () => {
    const r = sanitizeText('Call +44 20 7946 0958 or 020-7946-0958 today.');
    expect(r.text).not.toMatch(/7946/);
    expect(r.redactions).toBeGreaterThanOrEqual(2);
  });

  it('redacts credit-card-shaped digit groups', () => {
    const r = sanitizeText('Test card: 4111 1111 1111 1111.');
    expect(r.text).toContain('[REDACTED]');
    expect(r.redactions).toBe(1);
  });

  it('passes catalog text through unchanged', () => {
    const input = 'Premium organic cotton t-shirt — medium, navy blue, 200gsm fabric.';
    const r = sanitizeText(input);
    expect(r.text).toBe(input);
    expect(r.redactions).toBe(0);
  });

  it('returns count across multiple PII types', () => {
    const r = sanitizeText('Email a@b.co or call +447700900123.');
    expect(r.redactions).toBeGreaterThanOrEqual(2);
  });
});

describe('sanitizeMessages', () => {
  it('sanitizes every message and aggregates redaction count', () => {
    const r = sanitizeMessages([
      { role: 'system', content: 'You are a catalog assistant.' },
      { role: 'user', content: 'Customer email is buyer@shop.io.' },
    ]);
    expect(r.messages[0]?.content).toBe('You are a catalog assistant.');
    expect(r.messages[1]?.content).toContain('[REDACTED]');
    expect(r.redactions).toBe(1);
  });

  it('preserves message roles', () => {
    const r = sanitizeMessages([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'usr' },
      { role: 'assistant', content: 'ast' },
    ]);
    expect(r.messages.map((m) => m.role)).toEqual(['system', 'user', 'assistant']);
  });
});
