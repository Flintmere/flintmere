import { describe, expect, it } from 'vitest';
import { scoreTitles } from '../src/pillars/titles.js';
import { detectFluff } from '../src/utils/fluff.js';
import {
  cleanProduct,
  fluffyTitleProduct,
  longTitleProduct,
  makeCatalog,
} from './fixtures/products.js';

describe('detectFluff', () => {
  it('flags all-caps shouting', () => {
    expect(detectFluff('BEST PRODUCT EVER')).toHaveLength(2);
  });

  it('flags multiple bangs', () => {
    expect(detectFluff('Buy now!!!').length).toBeGreaterThan(0);
  });

  it('flags "limited" and "hurry"', () => {
    expect(detectFluff('Limited time offer, hurry').length).toBeGreaterThan(0);
  });

  it('leaves clean product titles alone', () => {
    expect(detectFluff('Meridian Matte Black Coffee Grinder')).toHaveLength(0);
  });
});

describe('scoreTitles', () => {
  it('scores a clean catalog high', () => {
    const catalog = makeCatalog([cleanProduct]);
    const result = scoreTitles(catalog);
    expect(result.score).toBeGreaterThan(70);
    expect(result.issues).toHaveLength(0);
  });

  it('emits over-limit issue on a long title', () => {
    const catalog = makeCatalog([longTitleProduct]);
    const result = scoreTitles(catalog);
    const issue = result.issues.find((i) => i.code === 'title-over-limit');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('high');
  });

  it('emits fluff issue on a shouty title', () => {
    const catalog = makeCatalog([fluffyTitleProduct]);
    const result = scoreTitles(catalog);
    const issue = result.issues.find((i) => i.code === 'title-marketing-fluff');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('high');
  });

  it('emits short-description issue for thin body html', () => {
    const catalog = makeCatalog([
      { ...cleanProduct, bodyHtml: '<p>Nice coffee grinder.</p>' },
    ]);
    const result = scoreTitles(catalog);
    const issue = result.issues.find((i) => i.code === 'description-too-short');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('medium');
  });

  it('returns zero for an empty catalog', () => {
    const catalog = makeCatalog([]);
    const result = scoreTitles(catalog);
    expect(result.score).toBe(0);
  });
});
