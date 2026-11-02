// Unit tests for src/core/schema.mjs and the real shared calendar's content and theme. Carried over and
// adapted from the kington-parishes repo's own Advent module: the theme no longer carries the per-site launch
// flags (previewEnabled, adventEnabled, publicListing, artRequired, goLive), and siteName is now optional —
// there is one shared calendar, not one per church, so there is no one church name to bake in (a church
// supplies its own name per-embed instead; see src/client/advent.js and teaser.js).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, validateTheme, artPathIsSafe, DAY_COUNT } from '../../src/core/schema.mjs';
import { siteNameIsSafe } from '../../src/core/day.mjs';
import { content } from '../../content/content.mjs';
import { theme } from '../../content/theme.mjs';

const clone = (value) => structuredClone(value);
const rejects = (mutate, pattern, base = content, validate = validateContent) => {
  const copy = clone(base);
  mutate(copy);
  assert.throws(() => validate(copy), pattern);
};
const dayOf = (c, n) => c.days.find((d) => d.day === n);

describe('the real shared calendar files', () => {
  test('content.mjs is valid and has 25 days (plus the Epiphany bonus)', () => {
    assert.deepEqual(validateContent(content), content);
    assert.equal(content.days.length, DAY_COUNT);
    assert.equal(content.bonus.day, 26);
  });

  test('theme.mjs is valid and carries no built-in church name', () => {
    assert.deepEqual(validateTheme(theme), theme);
    assert.equal(theme.timeZone, 'Europe/London');
    assert.equal(theme.siteName, '');
  });

  test('every day has its own picture file named by its number', () => {
    for (const d of content.days) assert.equal(d.art, `day-${String(d.day).padStart(2, '0')}.svg`);
  });

  test('Day 25 is the Nativity and Day 1 is the first light', () => {
    assert.match(dayOf(content, 25).title, /Christmas Day/);
    assert.match(dayOf(content, 1).ref, /Genesis 1/);
  });
});

describe('validateContent: structure', () => {
  test('rejects a non-object, a missing days list and unknown top-level keys', () => {
    assert.throws(() => validateContent(null), /content: must be an object/);
    assert.throws(() => validateContent([]), /must be an object/);
    assert.throws(() => validateContent({}), /missing key "days"/);
    assert.throws(() => validateContent({ days: 'x' }), /"days" must be a list/);
    rejects((c) => { c.extra = 1; }, /unknown key "extra"/);
  });

  test('rejects a missing day, naming it', () => {
    rejects((c) => { c.days = c.days.filter((d) => d.day !== 13); }, /exactly 25 days/);
  });

  test('rejects a duplicate day', () => {
    rejects((c) => { dayOf(c, 14).day = 13; }, /day 13: appears more than once/);
  });

  test('rejects a 26th day and day numbers outside 1 to 25', () => {
    rejects((c) => { c.days.push({ ...clone(dayOf(c, 1)), day: 26 }); }, /exactly 25 days/);
    rejects((c) => { dayOf(c, 25).day = 26; }, /day 26: "day" must be a whole number from 1 to 25/);
    rejects((c) => { dayOf(c, 2).day = 0; }, /"day" must be a whole number/);
    rejects((c) => { dayOf(c, 2).day = 2.5; }, /"day" must be a whole number/);
    rejects((c) => { dayOf(c, 2).day = '2'; }, /"day" must be a whole number/);
  });

  test('rejects an unknown key inside a day, naming day and key', () => {
    rejects((c) => { dayOf(c, 7).html = 'x'; }, /day 7: unknown key "html"/);
  });

  test('rejects a missing required key', () => {
    rejects((c) => { delete dayOf(c, 9).prayer; }, /day 9: missing key "prayer"/);
  });

  test('a day that is not an object is rejected', () => {
    rejects((c) => { c.days[4] = 'nope'; }, /days\[4\]: must be an object/);
  });
});

describe('validateContent: length caps', () => {
  test('title up to 120', () => {
    rejects((c) => { dayOf(c, 1).title = 'a'.repeat(121); }, /day 1: "title" is longer than 120/);
    const ok = clone(content);
    dayOf(ok, 1).title = 'a'.repeat(120);
    validateContent(ok);
  });

  test('paragraph up to 1200 and at most 12 paragraphs, at least 1', () => {
    rejects((c) => { dayOf(c, 4).paragraphs = ['a'.repeat(1201)]; }, /paragraphs\[0\]" is longer than 1200/);
    rejects((c) => { dayOf(c, 4).paragraphs = Array(13).fill('Fine.'); }, /1 to 12 paragraphs/);
    rejects((c) => { dayOf(c, 4).paragraphs = []; }, /1 to 12 paragraphs/);
    rejects((c) => { dayOf(c, 4).paragraphs = 'one string'; }, /1 to 12 paragraphs/);
    const ok = clone(content);
    dayOf(ok, 4).paragraphs = Array(12).fill('a'.repeat(1200));
    validateContent(ok);
  });

  test('alt up to 300 and not empty', () => {
    rejects((c) => { dayOf(c, 5).alt = 'a'.repeat(301); }, /"alt" is longer than 300/);
    rejects((c) => { dayOf(c, 5).alt = ''; }, /"alt" must not be empty/);
    rejects((c) => { dayOf(c, 5).alt = '   '; }, /"alt" must not be empty/);
  });

  test('alt must not equal the title (ignoring case and spaces at the ends)', () => {
    rejects((c) => { dayOf(c, 5).alt = dayOf(c, 5).title; }, /day 5: "alt" must describe the picture/);
    rejects((c) => { dayOf(c, 5).alt = `  ${dayOf(c, 5).title.toUpperCase()} `; }, /must describe the picture/);
  });

  test('credit must not be empty', () => {
    rejects((c) => { dayOf(c, 6).credit = ''; }, /day 6: "credit" must not be empty/);
    rejects((c) => { delete dayOf(c, 6).credit; }, /missing key "credit"/);
  });

  test('errors never quote the long raw value', () => {
    const copy = clone(content);
    dayOf(copy, 8).title = 'SECRETLONGVALUE'.repeat(50);
    assert.throws(() => validateContent(copy), (error) => !error.message.includes('SECRETLONGVALUE') && error.message.length < 200);
  });

  test('non-text values are rejected', () => {
    rejects((c) => { dayOf(c, 2).wonder = 42; }, /"wonder" must be text/);
    rejects((c) => { dayOf(c, 2).paragraphs = [{}]; }, /must be text/);
  });
});

describe('validateContent: forbidden characters and patterns', () => {
  const badValues = {
    'a less-than sign': 'x < y',
    'a greater-than sign': 'x > y',
    'a script tag': '<script>alert(1)</script>',
    'opening template braces': 'Hello {{name}}',
    'closing template braces': 'oops }}',
    'an at sign': 'write to someone@example.org',
    'a bare at sign': 'at @home',
    'http address': 'see http://example.org',
    'https address': 'see HTTPS://example.org',
    'protocol-relative address': 'see //example.org/x',
    'data address': 'data:text/html,hi',
    'javascript address': 'javascript:alert(1)',
    'a control character': 'tab\there',
    'a newline': 'line\nbreak',
    'a NUL': 'nul\u0000here',
    'a delete character': 'del\u007Fhere',
    'a bidi override (U+202E)': 'abc‮def',
    'a bidi embedding (U+202A)': 'abc‪def',
    'a bidi isolate (U+2066)': 'abc⁦def',
    'a bidi isolate end (U+2069)': 'abc⁩def',
  };

  for (const [name, value] of Object.entries(badValues)) {
    test(`rejects ${name} in a title, a paragraph and a prayer`, () => {
      rejects((c) => { dayOf(c, 10).title = value; }, /day 10: "title"/);
      rejects((c) => { dayOf(c, 10).paragraphs = ['Fine.', value]; }, /day 10: "paragraphs\[1\]"/);
      rejects((c) => { dayOf(c, 10).prayer = value; }, /day 10: "prayer"/);
    });
  }

  test('also checks the translation field', () => {
    rejects((c) => { dayOf(c, 10).translation = 'see http://x.org'; }, /day 10: "translation"/);
  });

  test('plain punctuation, quotes and apostrophes are fine', () => {
    const ok = clone(content);
    dayOf(ok, 10).paragraphs = ['"Don\'t be afraid," she said; it\'s half done: really (yes) - 1 Samuel 16:1-13!'];
    validateContent(ok);
  });
});

describe('art paths', () => {
  test('artPathIsSafe accepts simple lower-case svg file names', () => {
    for (const ok of ['day-05.svg', 'a.svg', '0.svg', 'christmas-star-2.svg']) assert.equal(artPathIsSafe(ok), true, ok);
  });

  test('artPathIsSafe rejects traversal, folders, other types and odd characters', () => {
    for (const bad of ['../x.svg', 'a/b.svg', '/x.svg', 'x.png', 'x.svg.png', 'x.SVG', 'X.svg', '-x.svg', '.svg', 'x..svg', 'x.svg ', 'x\\y.svg', 'a b.svg', '', 'x.svg\n', null, undefined, 5, ['x.svg']]) {
      assert.equal(artPathIsSafe(bad), false, String(bad));
    }
    assert.equal(artPathIsSafe('a'.repeat(70) + '.svg'), false);
  });

  test('validateContent rejects a bad art path', () => {
    for (const bad of ['../x.svg', 'a/b.svg', 'x.png']) {
      rejects((c) => { dayOf(c, 11).art = bad; }, /day 11: "art" must look like/);
    }
  });
});

// siteNameIsSafe is the one check shared by the build (theme.siteName, usually '') and both client entry
// points (advent.js's `?site=`, teaser.js's `data-site-name`): see CLAUDE.md's architecture notes.
describe('siteNameIsSafe: a church\'s own name, wherever it is supplied', () => {
  test('accepts \'\' (no name given) and plain names up to 80 characters', () => {
    for (const ok of ['', "St Mary's", 'Kington Parishes', 'Église Saint-Martin', 'a'.repeat(80)]) {
      assert.equal(siteNameIsSafe(ok), true, ok);
    }
  });

  test('rejects anything over 80 characters, markup, addresses, template braces and non-text', () => {
    for (const bad of [
      'a'.repeat(81), '<b>Church</b>', 'see http://evil.example', 'x{{y}}', 'tab\there', 'line\nbreak',
      null, undefined, 5, [], {},
    ]) {
      assert.equal(siteNameIsSafe(bad), false, String(bad));
    }
  });
});

describe('validateTheme', () => {
  const bad = (mutate, pattern) => rejects(mutate, pattern, theme, validateTheme);

  test('accepts a different season, colours and time zone (not that this app runs more than one calendar)', () => {
    const other = clone(theme);
    other.timeZone = 'Pacific/Auckland';
    other.bonus = null;
    other.season = { start: { month: 12, day: 1 }, end: { month: 12, day: 25 }, archiveUntil: null };
    other.colours.night = '#000000';
    validateTheme(other);
  });

  test('rejects unknown keys and a missing required key', () => {
    bad((t) => { t.previewKey = 'abc'; }, /unknown key "previewKey"/);
    bad((t) => { delete t.translationName; }, /missing key "translationName"/);
  });

  test('siteName is optional: absent defaults to \'\', and \'\' is itself valid (no built-in church name)', () => {
    const { siteName, ...withoutSiteName } = clone(theme);
    assert.equal(validateTheme(withoutSiteName).siteName, '');
    const blank = clone(theme);
    blank.siteName = '';
    assert.equal(validateTheme(blank).siteName, '');
    const named = clone(theme);
    named.siteName = "St Mary's";
    assert.equal(validateTheme(named).siteName, "St Mary's");
  });

  test('rejects bad colours', () => {
    for (const colour of ['red', '#fff', '#12345g', '#1234567', 'rgb(0,0,0)', '123456', '#12345', 5, null, 'url(x)']) {
      bad((t) => { t.colours.night = colour; }, /"night" must be a colour/);
    }
    bad((t) => { delete t.colours.link; }, /missing key "link"/);
    bad((t) => { t.colours.sparkle = '#ffffff'; }, /unknown key "sparkle"/);
  });

  test('rejects a bad time zone, accepts Europe/London', () => {
    for (const zone of ['Mars/Olympus', 'europe/london', '', 5, null, 'Europe/London; DROP']) {
      bad((t) => { t.timeZone = zone; }, /"timeZone"/);
    }
    validateTheme(theme);
  });

  test('rejects bad season dates', () => {
    bad((t) => { t.season.start.month = 13; }, /theme.season.start: "month"/);
    bad((t) => { t.season.start.day = 0; }, /theme.season.start: "day"/);
    bad((t) => { t.season.end = { month: 2, day: 30 }; }, /theme.season.end: "day"/);
    bad((t) => { t.season.start.day = 1.5; }, /"day"/);
    bad((t) => { t.season.start.day = '1'; }, /"day"/);
    bad((t) => { t.season.end = { month: 11, day: 25 }; }, /end must not be before the start/);
    bad((t) => { t.season.archiveUntil = { month: 12, day: 10 }; }, /"archiveUntil" must be after the end/);
    bad((t) => { t.season.archiveUntil = undefined; }, /missing key|must be \{month, day\}|archiveUntil/);
    bad((t) => { t.season.extra = 1; }, /unknown key "extra"/);
  });

  test('allows leap day only as 29 Feb and null for no archive', () => {
    const ok = clone(theme);
    ok.bonus = null;
    ok.season = { start: { month: 2, day: 5 }, end: { month: 2, day: 29 }, archiveUntil: null }; // 25 days, ending on 29 Feb
    validateTheme(ok);
  });

  test('rejects hostile text in names', () => {
    bad((t) => { t.siteName = '<b>Church</b>'; }, /"siteName"/);
    bad((t) => { t.siteName = 'see http://evil.example'; }, /"siteName"/);
    bad((t) => { t.siteName = 'a'.repeat(81); }, /"siteName"/);
    bad((t) => { t.translationName = 'x{{y}}'; }, /"translationName"/);
    bad((t) => { t.translationName = 'a'.repeat(81); }, /"translationName"/);
  });

  test('rejects a theme that is not an object', () => {
    assert.throws(() => validateTheme(null), /theme: must be an object/);
  });
});

describe('the live season must match the number of doors', () => {
  const withSeason = (start, end, archiveUntil = { month: 1, day: 6 }) => ({ ...clone(theme), bonus: null, season: { start, end, archiveUntil } });

  test('the real season (1 to 25 December) is exactly 25 days and passes', () => {
    assert.doesNotThrow(() => validateTheme(clone(theme)));
  });

  test('a season of any other length is refused with a clear message: it would leave doors with no day, or days with no door', () => {
    for (const end of [{ month: 12, day: 20 }, { month: 12, day: 24 }, { month: 12, day: 26 }, { month: 12, day: 31 }]) {
      assert.throws(() => validateTheme(withSeason({ month: 12, day: 1 }, end)), /season.*25 days|25 doors/, JSON.stringify(end));
    }
    assert.throws(() => validateTheme(withSeason({ month: 12, day: 2 }, { month: 12, day: 25 })), /25 days|25 doors/);
  });

  test('another church can run its 25 days at another time of year, including across a month end', () => {
    assert.doesNotThrow(() => validateTheme(withSeason({ month: 3, day: 10 }, { month: 4, day: 3 }, null)));
    assert.doesNotThrow(() => validateTheme(withSeason({ month: 11, day: 20 }, { month: 12, day: 14 }, { month: 1, day: 6 })));
  });

  test('the length is counted in whole days from the start date to the end date, both included', () => {
    assert.doesNotThrow(() => validateTheme(withSeason({ month: 12, day: 7 }, { month: 12, day: 31 }, null))); // 25 days
    assert.throws(() => validateTheme(withSeason({ month: 12, day: 7 }, { month: 12, day: 30 }, null)), /25 days|25 doors/); // 24 days
  });

  test('a season that crosses 29 February changes length in a leap year, so it is refused, with a message that says so', () => {
    assert.throws(
      () => validateTheme(withSeason({ month: 2, day: 28 }, { month: 3, day: 24 }, null)),
      /exactly 25 days in every year.*26 days in a leap year.*25 days in other years/,
    );
  });

  test('seasons that do not cross 29 February are the same length every year and are accepted', () => {
    assert.doesNotThrow(() => validateTheme(withSeason({ month: 1, day: 20 }, { month: 2, day: 13 }, null))); // ends before 29 February
    assert.doesNotThrow(() => validateTheme(withSeason({ month: 3, day: 1 }, { month: 3, day: 25 }, null))); // starts after it
    assert.doesNotThrow(() => validateTheme(withSeason({ month: 2, day: 4 }, { month: 2, day: 28 }, null))); // ends on 28 February
  });
});
