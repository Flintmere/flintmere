/**
 * Immutability guard for the published food catalog standard.
 *
 * Per ADR 0024 §Immutability enforcement. `standards.flintmere.com/food/v1.0/`
 * is a citation target: trade press, academics, and AI crawlers resolve
 * that URL and are entitled to find the same document they cited. Silent
 * edits to a published standard are the failure mode this test exists to
 * make impossible.
 *
 * The guard is deliberately blunt — it hashes the whole source-of-truth
 * file rather than reasoning about which changes are semantically
 * breaking. A comment fix trips it just as a field removal does. That is
 * the point: every change to the published standard should be a conscious
 * act with a changelog entry, not a drive-by.
 *
 * WHEN THIS TEST FAILS, that is usually correct behaviour. To proceed:
 *   1. Decide whether the change belongs in v1.0 at all. Corrections to a
 *      published standard ship as v1.0.1 at a new URL, never as in-place
 *      edits (ADR 0024 §Q10). Pre-publication edits during the RC window
 *      are fine.
 *   2. Add a dated entry to repo-root STANDARDS-CHANGELOG.md saying what
 *      changed and why.
 *   3. Update REFERENCE_SHA256 below, in the same commit.
 *
 * Flipping the `verified` flags after #39 Regulatory Affairs review will
 * trip this. That is a change to the published standard and gets a
 * changelog entry like any other.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * SHA-256 of `../food-v1-fields.ts`. Update deliberately, paired with a
 * STANDARDS-CHANGELOG.md entry. See the header for the procedure.
 */
const REFERENCE_SHA256 =
  '015d196b902c8162810badb32a27edbcd0621bc09bc666f5a1d7890bac6c191f';

const SOURCE_OF_TRUTH = new URL('../food-v1-fields.ts', import.meta.url);

function hashSourceOfTruth(): string {
  const contents = readFileSync(SOURCE_OF_TRUTH, 'utf8');
  return createHash('sha256').update(contents, 'utf8').digest('hex');
}

describe('food-v1-fields immutability', () => {
  it('matches the committed reference hash', () => {
    const actual = hashSourceOfTruth();
    expect(
      actual,
      [
        '',
        'The published food catalog standard has changed.',
        '',
        'If this change is intended:',
        '  1. Confirm it belongs in v1.0 — corrections to a published',
        '     standard ship as v1.0.1 at a new URL (ADR 0024 §Q10).',
        '  2. Add a dated entry to STANDARDS-CHANGELOG.md.',
        `  3. Set REFERENCE_SHA256 to: ${actual}`,
        '',
      ].join('\n'),
    ).toBe(REFERENCE_SHA256);
  });

  it('reads a non-empty source file', () => {
    // Guards against the hash accidentally passing on an empty or
    // unreadable file in some future refactor of the path resolution.
    expect(readFileSync(SOURCE_OF_TRUTH, 'utf8').length).toBeGreaterThan(1000);
  });
});
