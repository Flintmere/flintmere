import { describe, it, expect } from 'vitest';
import { findAiTell, findBannedPhrase } from './lint';

describe('findAiTell', () => {
  it('flags single-word tells on a word boundary', () => {
    expect(findAiTell('Let us delve into GTINs.')).toBe('delve');
    expect(findAiTell('A seamless feed.')).toBe('seamless');
  });

  it('does not flag a word-tell embedded in another word', () => {
    // "realm" must not match inside "overwhelm".
    expect(findAiTell('This can overwhelm a small team.')).toBeNull();
  });

  it('flags multi-word phrase tells as substrings', () => {
    expect(findAiTell("In today's market, feeds matter.")).toBe("in today's");
    expect(findAiTell('It is a testament to good data.')).toBe('testament to');
    expect(findAiTell('In conclusion, fix your titles.')).toBe('in conclusion');
  });

  it('is case-insensitive', () => {
    expect(findAiTell('FURTHERMORE, the score dropped.')).toBe('furthermore');
  });

  it('returns null for clean copy', () => {
    expect(
      findAiTell('A GTIN is a barcode number. Google matches on it. Missing GTINs suppress products.'),
    ).toBeNull();
  });
});

describe('findBannedPhrase', () => {
  it('flags a VOICE.md banned phrase', () => {
    expect(findBannedPhrase('Our AI-powered engine.')).toBe('ai-powered');
    expect(findBannedPhrase('Leverage your catalog.')).toBe('leverage');
  });

  it('returns null for clean copy', () => {
    expect(findBannedPhrase('We read four public pillars and report a partial score.')).toBeNull();
  });
});
