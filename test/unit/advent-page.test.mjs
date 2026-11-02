// src/client/advent.js's `?site=` query override (the calendar page's equivalent of the teaser embed's
// `data-site-name`): extracted from the shipped source the same way test/unit/teaser.test.mjs does, so this
// runs the ACTUAL shipped function, not a hand-copied rewrite of it.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SOURCE = readFileSync(new URL('../../src/client/advent.js', import.meta.url), 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `expected advent.js to define function ${name}`);
  let depth = 0;
  let i = source.indexOf('{', start);
  const bodyStart = i;
  for (; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') { depth -= 1; if (depth === 0) break; }
  }
  return source.slice(start, i + 1);
}

// siteNameFromQuery imports siteNameIsSafe from './advent-core/day.mjs': stub a minimal compatible copy so
// the extracted function runs standalone, matching day.mjs's NAME_ALLOWED positive list closely enough for
// these cases (the real cross-module agreement is covered by test/unit/schema.test.mjs's siteNameIsSafe
// tests, which exercise the one real implementation).
function loadSiteNameFromQuery(source) {
  const fn = extractFunction(source, 'siteNameFromQuery');
  // eslint-disable-next-line no-new-func
  const sandbox = new Function('URLSearchParams', 'siteNameIsSafe', `
    const siteNameFromQuery = ${fn};
    return siteNameFromQuery;
  `);
  const siteNameIsSafe = (value) => typeof value === 'string' && value.length <= 80 && /^[\p{L}\p{M}0-9 .,'\-’]*$/u.test(value);
  return sandbox(URLSearchParams, siteNameIsSafe);
}

const siteNameFromQuery = loadSiteNameFromQuery(SOURCE);

describe('siteNameFromQuery: a church\'s own name, from ?site= on the calendar page\'s address', () => {
  test('reads a plain name', () => {
    assert.equal(siteNameFromQuery('?site=St%20Mary%27s'), "St Mary's");
  });

  test('absent, empty, or invalid gives null (the shared, unnamed calendar)', () => {
    for (const search of ['', '?other=1', '?site=', '?site=<b>x</b>', '?site=see%20http://evil.example']) {
      assert.equal(siteNameFromQuery(search), null, search);
    }
  });

  test('a repeated parameter uses the first one (URLSearchParams\' own rule), still checked the same way', () => {
    assert.equal(siteNameFromQuery('?site=A&site=B'), 'A');
  });
});
