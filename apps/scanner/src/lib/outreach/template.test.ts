import { describe, expect, it } from 'vitest';
import { renderInitialEmail, renderFollowupEmail } from './template';

const baseInput = {
  shopDomain: 'matersandco.com',
  recipientFirstName: 'Sam',
  score: 42,
  grade: 'D',
  productCount: 318,
  senderName: 'Abu',
  rescanUrl: 'https://audit.flintmere.com/scan?url=matersandco.com',
  auditUrl: 'https://audit.flintmere.com/audit',
  unsubscribeUrl: 'https://audit.flintmere.com/api/outreach/unsubscribe?t=abc&s=def',
};

describe('renderInitialEmail', () => {
  it('uses subject variant A by default', () => {
    const out = renderInitialEmail(baseInput);
    expect(out.subject).toBe('matersandco.com — your AI-shopping score (42/100)');
  });

  it('uses subject variant B when requested', () => {
    const out = renderInitialEmail({ ...baseInput, variant: 'B' });
    expect(out.subject).toBe("quick note on matersandco.com's catalog data");
  });

  it('puts the score in line 1 of the body (the load-bearing hook)', () => {
    const out = renderInitialEmail(baseInput);
    // Line 1 of the body proper is the "Hi" greeting; line 2 onwards is
    // the data-intake hook. The score must appear in the first paragraph.
    const firstParagraph = out.bodyText.split('\n\n').slice(0, 2).join('\n\n');
    expect(firstParagraph).toContain('42/100');
    expect(firstParagraph).toContain('D-grade');
    expect(firstParagraph).toContain('318');
  });

  it('renders "Hi there," when first name missing — never fabricates', () => {
    const out = renderInitialEmail({ ...baseInput, recipientFirstName: null });
    expect(out.bodyText).toMatch(/^Hi there,/);
    expect(out.bodyHtml).toContain('Hi there,');
  });

  it('renders the first name when provided', () => {
    const out = renderInitialEmail({ ...baseInput, recipientFirstName: 'Sam' });
    expect(out.bodyText).toMatch(/^Hi Sam,/);
  });

  it('escapes HTML special characters in shop domain to prevent injection', () => {
    const out = renderInitialEmail({
      ...baseInput,
      shopDomain: 'evil.com<script>alert(1)</script>',
    });
    expect(out.bodyHtml).not.toContain('<script>alert(1)</script>');
    expect(out.bodyHtml).toContain('&lt;script&gt;');
  });

  it('includes the rescan URL, audit URL, and unsubscribe URL in the text body verbatim', () => {
    const out = renderInitialEmail(baseInput);
    expect(out.bodyText).toContain(baseInput.rescanUrl);
    expect(out.bodyText).toContain(baseInput.auditUrl);
    expect(out.bodyText).toContain(baseInput.unsubscribeUrl);
  });

  it('includes the URLs in the HTML body with & properly escaped to &amp;', () => {
    const out = renderInitialEmail(baseInput);
    expect(out.bodyHtml).toContain(baseInput.rescanUrl);
    expect(out.bodyHtml).toContain(baseInput.auditUrl);
    // Unsubscribe URL contains `&` which MUST be escaped in HTML.
    const escapedUnsub = baseInput.unsubscribeUrl.replace(/&/g, '&amp;');
    expect(out.bodyHtml).toContain(escapedUnsub);
  });

  it('includes the legal footer (CH 13205428 + ICO ZC137268) in both bodies', () => {
    const out = renderInitialEmail(baseInput);
    for (const body of [out.bodyText, out.bodyHtml]) {
      expect(body).toContain('13205428');
      expect(body).toContain('ZC137268');
      expect(body).toContain('Eazy Access Ltd');
    }
  });

  it('bridges the brand→entity gap with "trading as Flintmere"', () => {
    // Matches canonical phrasing on /privacy, /terms, /dpa, /about.
    // Without this bridge, recipients see "Sent by Eazy Access Ltd" and
    // wonder if the email is actually from Flintmere.
    const out = renderInitialEmail(baseInput);
    for (const body of [out.bodyText, out.bodyHtml]) {
      expect(body).toContain('Eazy Access Ltd (trading as Flintmere)');
    }
  });

  it('includes a privacy-notice link (PECR + GDPR Article 13)', () => {
    const out = renderInitialEmail(baseInput);
    for (const body of [out.bodyText, out.bodyHtml]) {
      expect(body).toContain('https://flintmere.com/privacy');
    }
  });

  it('sign-off uses team voice — sender name + "The Flintmere team"', () => {
    const out = renderInitialEmail(baseInput);
    expect(out.bodyText).toContain('Best,\nAbu\nThe Flintmere team');
  });

  it('renders the score with the legibility-bracket signature in HTML', () => {
    // The Flintmere brand signature: `[ 47/100 ]` in mono with hairline ink
    // brackets, on the load-bearing noun. See `memory/design/tokens.md`
    // §Signature. Plain `<strong>` was the prior pre-canon rendering.
    const out = renderInitialEmail(baseInput);
    expect(out.bodyHtml).toContain('[&nbsp;42/100&nbsp;]');
    expect(out.bodyHtml).not.toContain('<strong>42/100</strong>');
  });

  it('renders the sign-off wordmark with the legibility-bracket signature', () => {
    // The second canonical brand beat per the cold-email letterhead spec:
    // `The [ Flintmere ] team`. Mono span around the wordmark.
    const out = renderInitialEmail(baseInput);
    expect(out.bodyHtml).toContain('[&nbsp;Flintmere&nbsp;]');
  });

  it('uses paper canon background (#f7f7f4), not white', () => {
    // Paper canon per `apps/scanner/src/app/globals.css --color-paper`.
    // White (#FFFFFF) was the pre-canon background.
    const out = renderInitialEmail(baseInput);
    expect(out.bodyHtml).toContain('background:#f7f7f4');
    expect(out.bodyHtml).not.toContain('background:#FFFFFF');
  });

  it('uses anchor-text links, not raw-URL paste, for body CTAs', () => {
    // Raw URL paste reads as marketing-template generic; anchor text reads
    // as letterhead. The URL still appears in the href (separate assertion
    // below covers that), but visible link text is human-readable.
    const out = renderInitialEmail(baseInput);
    expect(out.bodyHtml).toContain('run the free scan');
    expect(out.bodyHtml).toContain('see audit + retainer details');
  });
});

describe('renderFollowupEmail', () => {
  it('uses the followup subject "re: <shop> catalog data"', () => {
    const out = renderFollowupEmail(baseInput);
    expect(out.subject).toBe('re: matersandco.com catalog data');
  });

  it('mentions the original note + sends only the rescan URL', () => {
    const out = renderFollowupEmail(baseInput);
    expect(out.bodyText).toContain('Following up on the matersandco.com catalog score note');
    expect(out.bodyText).toContain(baseInput.rescanUrl);
    // Followup is intentionally lighter — no audit URL nudge.
    expect(out.bodyText).not.toContain('£197');
    expect(out.bodyText).not.toContain('£349');
  });

  it('keeps the legal footer + unsubscribe link', () => {
    const out = renderFollowupEmail(baseInput);
    expect(out.bodyText).toContain('13205428');
    expect(out.bodyText).toContain(baseInput.unsubscribeUrl);
  });

  it('includes a privacy-notice link', () => {
    const out = renderFollowupEmail(baseInput);
    for (const body of [out.bodyText, out.bodyHtml]) {
      expect(body).toContain('https://flintmere.com/privacy');
    }
  });

  it('also bridges brand→entity with "trading as Flintmere"', () => {
    const out = renderFollowupEmail(baseInput);
    for (const body of [out.bodyText, out.bodyHtml]) {
      expect(body).toContain('Eazy Access Ltd (trading as Flintmere)');
    }
  });

  it('sign-off uses team voice in both bodies', () => {
    // Per `memory/feedback_always_team_voice.md` — every customer-facing
    // surface uses team voice; sender name alone is borderline. Followup
    // previously omitted the team line; aligned with initial here.
    const out = renderFollowupEmail(baseInput);
    expect(out.bodyText).toContain('Best,\nAbu\nThe Flintmere team');
    expect(out.bodyHtml).toContain('[&nbsp;Flintmere&nbsp;]');
  });
});
