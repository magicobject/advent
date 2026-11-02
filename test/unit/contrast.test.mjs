// WCAG 2 contrast checks for the colour pairings the Advent calendar uses, computed from the real
// content/theme.mjs (never eyeballed). Carried over from the kington-parishes repo's own Advent module.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { theme } from '../../content/theme.mjs';

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground, background, theme) {
  const [a, b] = [luminance(theme.colours[foreground]), luminance(theme.colours[background])];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('contrast', () => {
  test('the luminance function is right: black on white is 21:1, identical colours 1:1', () => {
    assert.ok(Math.abs((luminance('#ffffff') + 0.05) / (luminance('#000000') + 0.05) - 21) < 0.001);
    assert.equal((luminance('#336699') + 0.05) / (luminance('#336699') + 0.05), 1);
  });

  const pairs = [
    ['text', 'paper', 4.5],
    ['textSoft', 'paper', 4.5],
    ['link', 'paper', 4.5],
    ['cream', 'night', 4.5],
    ['accentInk', 'accent', 4.5],
    ['accent', 'night', 4.5],
    ['doorEdge', 'door', 3], // user-interface edge, 3:1 is the rule
    ['focus', 'night', 3], // focus ring, 3:1 is the rule
    ['cream', 'door', 4.5], // door number and date on an open door
    ['cream', 'doorLocked', 4.5], // door number and date on a "not yet" door
    ['cream', 'sky2', 4.5], // heading and status on the lighter end of the sky gradient
    ['doorEdge', 'night', 3], // a door's edge against the sky (user-interface edge)
    ['doorEdge', 'sky2', 3], // the same against the lighter end of the sky
    ['doorEdge', 'doorLocked', 3], // the dashed edge against its own "not yet" door
    ['doorEdge', 'paper', 3], // hairlines between the sections of the day panel
    ['focus', 'sky2', 3], // focus ring against the lighter end of the sky
    ['focus', 'door', 3], // the pale "today" ring against an open door
    ['accent', 'sky2', 4.5], // the banner heading on the lighter end of its gradient
  ];
  for (const [foreground, background, minimum] of pairs) {
    test(`${foreground} on ${background} is at least ${minimum}:1`, () => {
      const actual = ratio(foreground, background, theme);
      assert.ok(actual >= minimum, `${foreground} on ${background} is ${actual.toFixed(2)}:1`);
    });
  }
});

// The two buttons of the "Not quite yet" card ("Maybe later" is the filled gold primary, "Open it anyway" the
// quieter outline). Read from the stylesheet's custom properties so the test follows the swap, then computed
// against the real theme.
describe('the gentle card buttons', () => {
  const css = readFileSync(new URL('../../src/client/advent.css', import.meta.url), 'utf8');
  const property = (name) => new RegExp(`--advent-gentle-${name}:\\s*([^;]+);`).exec(css)?.[1].trim();
  const colourOf = (token) => (token === 'transparent' ? 'paper' : /var\(--advent-([a-z-]+)\)/.exec(token)[1].replace(/-(\w)/g, (_, l) => l.toUpperCase()));
  const r = (fg, bg) => ratio(fg, bg, theme);

  test('"Maybe later" is the filled gold primary: accent ink on accent, at least 4.5:1', () => {
    assert.equal(property('later-bg'), 'var(--advent-accent)');
    assert.equal(property('later-fg'), 'var(--advent-accent-ink)');
    assert.equal(property('later-border'), 'var(--advent-accent-ink)');
    assert.ok(r('accentInk', 'accent') >= 4.5);
  });

  test('"Open it anyway" is the quiet outline: link colour on the paper card (text 4.5:1, edge 3:1)', () => {
    assert.equal(property('anyway-bg'), 'transparent');
    assert.equal(property('anyway-fg'), 'var(--advent-link)');
    assert.equal(property('anyway-border'), 'var(--advent-link)');
    assert.ok(r('link', 'paper') >= 4.5, `link on paper ${r('link', 'paper').toFixed(2)}`);
  });

  test('every colour named is a real token', () => {
    for (const name of ['later-bg', 'later-fg', 'anyway-fg', 'anyway-border']) assert.ok(theme.colours[colourOf(property(name))], name);
  });
});

// Every colour in the calendar page stylesheet comes from a --advent-* token (set by scripts/build.mjs from
// content/theme.mjs), so every pairing is one the table above checked. The only literal colours allowed are
// black and white, in the print stylesheet.
describe('the calendar stylesheet uses only tokens', () => {
  test('src/client/advent.css has no literal colours except black and white (print)', () => {
    const css = readFileSync(new URL('../../src/client/advent.css', import.meta.url), 'utf8');
    const literal = css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) ?? [];
    const allowed = new Set(['#000', '#fff']);
    assert.deepEqual(literal.filter((value) => !allowed.has(value.toLowerCase())), []);
  });
});

// The cross-origin teaser embed cannot rely on a per-tenant generated stylesheet (it runs on a foreign site,
// before it knows which church it is), so its default colours are literal — but they must still be a safe,
// readable look on their own, since a slow or failed config fetch could leave them showing.
describe('the teaser embed\'s default colours', () => {
  test('the --mw-advent-* defaults in teaser.css pass the pairings the banner actually uses', () => {
    const css = readFileSync(new URL('../../src/client/teaser.css', import.meta.url), 'utf8');
    const value = (name) => new RegExp(`--mw-advent-${name}:\\s*(#[0-9a-fA-F]{6});`).exec(css)[1];
    const palette = { colours: {
      night: value('night'), sky2: value('sky2'), cream: value('cream'),
      accent: value('accent'), accentInk: value('accent-ink'), focus: value('focus'),
    } };
    assert.ok(ratio('cream', 'night', palette) >= 4.5);
    assert.ok(ratio('cream', 'sky2', palette) >= 4.5);
    assert.ok(ratio('accent', 'night', palette) >= 4.5);
    assert.ok(ratio('accentInk', 'accent', palette) >= 4.5);
  });
});
