// src/client/teaser.js runs on a church's own foreign site, so it cannot import src/core/date.mjs as a module
// the way the calendar page does (see its own comment for why) — it keeps a small inlined copy of the season
// logic instead. This test keeps that copy honest: it is extracted from the source text and checked against
// src/core/date.mjs's seasonState for a whole year, so the two can never quietly drift apart.
import { test, describe } from 'node:test';
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

// A minimal stand-in for the one container element teaser.js reads: `dataset` for siteNameOverride,
// `getAttribute` for colourOverrides (real element attributes are always strings or absent, never undefined).
function fakeRoot(attributes) {
  return {
    dataset: Object.fromEntries(Object.entries(attributes).filter(([key]) => key !== 'style').map(([key, value]) => [toCamel(key), value])),
    getAttribute: (name) => (name in attributes ? attributes[name] : null),
  };
}
const toCamel = (name) => name.replace(/^data-/, '').replace(/-(\w)/g, (_, c) => c.toUpperCase());

function loadEmbedOverrides(source, origin) {
  const consts = ['NAME_ALLOWED', 'COLOUR_NAMES', 'HEX_COLOUR'].map((name) => extractDeclaration(source, name));
  const fns = ['siteNameOverride', 'colourOverrides', 'calendarUrl'].map((name) => extractDeclaration(source, name));
  // eslint-disable-next-line no-new-func
  const sandbox = new Function('origin', 'encodeURIComponent', `
    ${consts.join('\n')}
    ${fns.join('\n')}
    return { siteNameOverride, colourOverrides, calendarUrl };
  `);
  return sandbox(origin, encodeURIComponent);
}

const { siteNameOverride, colourOverrides, calendarUrl } = loadEmbedOverrides(SOURCE, 'https://advent.mediawright.uk');

describe('siteNameOverride: a church\'s own name, from data-site-name on the embed\'s container', () => {
  test('a plain name is accepted', () => {
    assert.equal(siteNameOverride(fakeRoot({ 'data-site-name': "St Mary's" })), "St Mary's");
  });

  test('missing, empty or hostile text gives \'\' (the shared, unnamed banner)', () => {
    for (const value of [undefined, '', '<b>x</b>', 'see http://evil.example', 'a'.repeat(81)]) {
      assert.equal(siteNameOverride(fakeRoot(value === undefined ? {} : { 'data-site-name': value })), '', String(value));
    }
  });
});

describe('colourOverrides: a church\'s own colours, from data-* attributes on the embed\'s container', () => {
  test('accepts a plain #rrggbb per known colour name, kebab-cased', () => {
    const root = fakeRoot({ 'data-night': '#102030', 'data-accent-ink': '#2a2000' });
    assert.deepEqual(colourOverrides(root), { night: '#102030', accentInk: '#2a2000' });
  });

  test('drops anything that is not a plain hex colour, and anything not on the known list', () => {
    const root = fakeRoot({ 'data-night': 'red', 'data-accent': '#12345g', 'data-unknown': '#ffffff' });
    assert.deepEqual(colourOverrides(root), {});
  });
});

describe('calendarUrl: the link the banner\'s button carries to the full calendar', () => {
  test('with no name, the bare origin', () => {
    assert.equal(calendarUrl(''), 'https://advent.mediawright.uk/');
  });

  test('with a name, ?site= carries it forward, URL-encoded', () => {
    assert.equal(calendarUrl("St Mary's"), "https://advent.mediawright.uk/?site=St%20Mary's");
  });
});
