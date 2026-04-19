const FLUFF_PATTERNS: readonly RegExp[] = [
  /\b(best|greatest|amazing|awesome|incredible|unbelievable)\s+ever\b/i,
  /\b100\s*%\s*(guaranteed|safe|authentic)/i,
  /\blimited\s*(time|edition|offer|stock)/i,
  /\bhurry\b/i,
  /\bdon'?t\s+miss\b/i,
  /\bmust\s*have\b/i,
  /\btop[-\s]*rated\b/i,
  /\brevolutionary\b/i,
  /\bgame[-\s]*chang(er|ing)\b/i,
  /!{2,}/,
  /[A-Z]{6,}/,
  /\b(sale|deal|discount)\b/i,
];

export interface FluffMatch {
  pattern: string;
  excerpt: string;
}

export function detectFluff(text: string): FluffMatch[] {
  const matches: FluffMatch[] = [];
  for (const pattern of FLUFF_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      matches.push({
        pattern: pattern.source,
        excerpt: match[0],
      });
    }
  }
  return matches;
}
