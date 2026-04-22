// Flintmere design tokens, inlined for the embedded-app island.
// Authoritative definitions live in memory/design/tokens.md. Kept inline here
// (rather than a CSS module) so the island survives the Polaris cascade
// without needing a scoped-CSS build step in the Remix app.

export const island = {
  paper: '#F7F7F4',
  paper2: '#EDECE6',
  ink: '#0A0A0B',
  ink2: '#141518',
  mute: '#5A5C64',
  mute2: '#8B8D95',
  line: '#0A0A0B',
  lineSoft: 'rgba(10,10,11,0.16)',
  accent: '#F8BF24',
  accentInk: '#0A0A0B',
  alert: '#E54A2A',
  ok: '#3F8F57',
  fontSans: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontMono:
    '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;
