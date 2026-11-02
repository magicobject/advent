// src/client/teaser.js runs on a church's own foreign site, so it cannot import src/core/date.mjs as a module
// the way the calendar page does (see its own comment for why) — it keeps a small inlined copy of the season
// logic instead. This test keeps that copy honest: it is extracted from the source text and checked against
// src/core/date.mjs's seasonState for a whole year, so the two can never quietly drift apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seasonState as realSeasonState, londonDateParts as realLondonDateParts } from '../../src/core/date.mjs';

const SOURCE = readFileSync(new URL('../../src/client/teaser.js', import.meta.url), 'utf8');

// Pulls the two functions teaser.js defines for itself (londonDateParts, seasonState) out of the source text
// and evaluates them in a sandbox, so this test runs the ACTUAL shipped code, not a hand-copied version of it.
function loadInlinedDateLogic(source) {
  const parts = ['monthDay', 'utcDay', 'londonDateParts', 'daysUntilStart', 'seasonState'].map((name) => extractDeclaration(source, name));
  // eslint-disable-next-line no-new-func
  const sandbox = new Function('Intl', 'Date', `
    ${parts.join('\n')}
    return { londonDateParts, seasonState, daysUntilStart };
  `);
  return sandbox(Intl, Date);
}

// Extracts one top-level `function name(...) { ... }` declaration, or one `const name = (...) => ...;`
// arrow declaration, exactly as teaser.js wrote it — never a hand-copied rewrite of it.
function extractDeclaration(source, name) {
  const fn = source.indexOf(`function ${name}(`);
  if (fn >= 0) return extractBraced(source, fn, `function ${name}(`);
  const arrow = source.indexOf(`const ${name} = `);
  assert.ok(arrow >= 0, `expected teaser.js to define ${name}`);
  const semicolon = source.indexOf(';\n', arrow);
  assert.ok(semicolon >= 0, `expected ${name} to end with ";\\n"`);
  return source.slice(arrow, semicolon + 1);
}

function extractBraced(source, start, head) {
  let depth = 0;
  let i = source.indexOf('{', start);
  const bodyStart = i;
  for (; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') { depth -= 1; if (depth === 0) break; }
  }
  return `${head}${source.slice(start + head.length, source.indexOf(')', start))})${source.slice(bodyStart, i + 1)}`;
}

const { seasonState: inlinedSeasonState, londonDateParts: inlinedLondonDateParts } = loadInlinedDateLogic(SOURCE);

const CFG = { start: { month: 12, day: 1 }, end: { month: 12, day: 25 }, archiveUntil: { month: 1, day: 6 } };

test('the inlined season logic in teaser.js agrees with src/core/date.mjs for every day of a year', () => {
  // teaser.js only ever needs to know "live", "archive", or neither (see its start()): unlike the calendar
  // page it never shows the calm "before" message, so its inlined logic does not distinguish 'before' from
  // 'after' the way date.mjs's full seasonState does. Everywhere that matters to what the embed actually
  // does, the two must still agree exactly.
  for (let day = 0; day < 366; day += 1) {
    const instant = Date.UTC(2026, 0, 1) + day * 86400000;
    const real = realSeasonState(realLondonDateParts(instant), CFG);
    const inlined = inlinedSeasonState(inlinedLondonDateParts(instant, 'Europe/London'), CFG);
    const stamp = new Date(instant).toISOString();
    if (real === 'live' || real === 'archive') assert.equal(inlined, real, stamp);
    else assert.ok(inlined !== 'live' && inlined !== 'archive', `${stamp}: real is ${real}, inlined is ${inlined}`);
  }
});

test('teaser.js never imports anything (it must stand alone on a foreign page)', () => {
  assert.doesNotMatch(SOURCE, /\bimport\b/);
});
