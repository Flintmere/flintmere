export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasStructuralMarkup(html: string | null | undefined): boolean {
  if (!html) return false;
  return /<(ul|ol|li|h[1-6]|strong|p)\b/i.test(html);
}

const USE_CASE_MARKERS: readonly RegExp[] = [
  /\bideal for\b/i,
  /\bperfect for\b/i,
  /\bdesigned for\b/i,
  /\bsuitable for\b/i,
  /\bmade for\b/i,
  /\bworks with\b/i,
  /\bcompatible with\b/i,
  /\bgreat for\b/i,
];

export function hasUseCasePhrase(text: string): boolean {
  return USE_CASE_MARKERS.some((pattern) => pattern.test(text));
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
