// The embeddable Advent banner: the ONE script a church pastes into its own site to show "today's door" on its
// home page and link to the full calendar. Unlike advent.js (the calendar page itself), this script runs on a
// FOREIGN origin — the church's own site, not advent.mediawright.uk — so every address it uses must be
// absolute, and it never assumes anything about the host page's markup beyond the one container element.
//
// A church's embed snippet is two lines (see docs/embedding.md):
//   <div data-advent-teaser data-slug="kington"></div>
//   <script src="https://advent.mediawright.uk/embed/teaser.js" defer></script>
// The script works out this app's own origin from its OWN <script src>, so the same file works for every
// church and for a staging deploy, with nothing to edit in the snippet beyond the slug.
//
// Same safety rules as the calendar page: nothing is stored in the browser; text from the config and day
// files is only ever set as plain text, never as markup; every address is built from a checked whole number
// or a plain file name; requests are same-method GET with credentials omitted (nothing of the church's own
// session, if it has one, is ever sent to advent.mediawright.uk).
(function () {
  const script = document.currentScript;
  if (!script) return;
  let origin;
  try {
    origin = new URL(script.src).origin;
  } catch {
    return;
  }

  const DAY_COUNT = 25;
  const BONUS_DAY = 26;
  const MAX_JSON_BYTES = 16 * 1024;
  const FETCH_TIMEOUT_MS = 8000;
  const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ---- date logic (the same rules as src/core/date.mjs, kept in step by test/unit/teaser.test.mjs) ----

  function londonDateParts(ms, timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
        timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hourCycle: 'h23',
      });
      const found = {};
      for (const part of formatter.formatToParts(new Date(ms))) {
        if (['year', 'month', 'day'].includes(part.type)) found[part.type] = Number(part.value);
      }
      return Number.isInteger(found.year) ? found : null;
    } catch {
      return null;
    }
  }

  const monthDay = (month, day) => month * 100 + day;
  const utcDay = (year, month, day) => Date.UTC(year, month - 1, day);

  function daysUntilStart(parts, season) {
    return Math.round((utcDay(parts.year, season.start.month, season.start.day) - utcDay(parts.year, parts.month, parts.day)) / 86400000);
  }

  function seasonState(parts, season) {
    if (!parts) return 'after';
    const today = monthDay(parts.month, parts.day);
    const [start, end] = [monthDay(season.start.month, season.start.day), monthDay(season.end.month, season.end.day)];
    if (today >= start && today <= end) return 'live';
    if (season.archiveUntil) {
      const until = monthDay(season.archiveUntil.month, season.archiveUntil.day);
      const inArchive = until < start ? today > end || today <= until : today > end && today <= until;
      if (inArchive) return 'archive';
    }
    return 'after';
  }

  // ---- building absolute addresses ----

  function tenantUrl(slug, path) {
    return `${origin}/${slug}/${path}`;
  }

  function calendarUrl(slug) {
    return tenantUrl(slug, '');
  }

  // ---- fetching, size-capped and checked the same way the calendar page does ----

  function timeoutSignal(ms) {
    if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  async function fetchJson(url) {
    const response = await fetch(url, { credentials: 'omit', signal: timeoutSignal(FETCH_TIMEOUT_MS) });
    if (!response || !response.ok) throw new Error('request failed');
    if (!/^application\/json\b/i.test(response.headers.get('content-type') ?? '')) throw new Error('not JSON');
    const text = await response.text();
    if (new TextEncoder().encode(text).length > MAX_JSON_BYTES) throw new Error('too large');
    return JSON.parse(text);
  }

  function configIsSane(config) {
    return config && typeof config === 'object' &&
      typeof config.siteName === 'string' && config.siteName.length <= 80 &&
      typeof config.timeZone === 'string' &&
      config.season && Number.isInteger(config.season.start?.month) && Number.isInteger(config.season.start?.day) &&
      Number.isInteger(config.season.end?.month) && Number.isInteger(config.season.end?.day) &&
      Number.isInteger(config.dayCount) && config.dayCount >= 1 && config.dayCount <= DAY_COUNT &&
      (config.scene === null || (typeof config.scene === 'string' && /^[a-z0-9-]+\.svg$/.test(config.scene)));
  }

  function dayFileIsSane(file, expectedDay) {
    return file && typeof file === 'object' && file.day === expectedDay &&
      typeof file.title === 'string' && file.title.length <= 120 &&
      (file.art === undefined || (typeof file.art === 'string' && /^[a-z0-9-]+\.svg$/.test(file.art)));
  }

  // ---- rendering ----

  function teaserWords(season, today, title, config) {
    const heading = `Advent at ${config.siteName}`;
    if (season === 'archive') return { heading, line: `The Christmas story, in ${config.dayCount} short pieces`, button: 'Open the calendar' };
    return { heading, line: title ? `Day ${today} · ${title}` : `Day ${today}`, button: "Open today's door" };
  }

  function applyColours(root, colours) {
    if (!colours || typeof colours !== 'object') return;
    for (const name of ['night', 'sky2', 'cream', 'accent', 'accentInk', 'doorEdge', 'focus']) {
      const value = colours[name];
      if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
        root.style.setProperty(`--mw-advent-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, value);
      }
    }
  }

  async function render(root, slug, config, season, parts) {
    const today = season === 'live' ? 1 - daysUntilStart(parts, config.season) : 0;
    const words = teaserWords(season, today, null, config);
    root.className = 'mw-advent-teaser';
    applyColours(root, config.colours);

    const inner = make('div', 'mw-advent-teaser-inner');
    const thumb = make('img', 'mw-advent-teaser-thumb');
    thumb.alt = '';
    if (config.scene) thumb.src = tenantUrl(slug, config.scene);
    const text = make('div', 'mw-advent-teaser-text');
    const heading = make('h2', 'mw-advent-teaser-heading', words.heading);
    const line = make('p', 'mw-advent-teaser-line', words.line);
    const open = make('a', 'mw-advent-teaser-pill', words.button);
    open.href = calendarUrl(slug);
    text.append(heading, line, open);
    inner.append(thumb, text);
    root.replaceChildren(inner);
    root.hidden = false;

    if (season !== 'live') return;
    try {
      const day = String(today).padStart(2, '0');
      const file = await fetchJson(tenantUrl(slug, `day-${day}.json`));
      if (!dayFileIsSane(file, today)) return;
      line.textContent = teaserWords(season, today, file.title, config).line;
      if (file.art) thumb.src = tenantUrl(slug, `art/${file.art}`);
    } catch {
      // Without the title the banner simply says "Day N".
    }
  }

  async function start(root) {
    const slug = root.dataset.slug;
    if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) return;
    let config;
    try {
      config = await fetchJson(tenantUrl(slug, 'config.json'));
    } catch {
      return;
    }
    if (!configIsSane(config)) return;
    const parts = londonDateParts(Date.now(), config.timeZone);
    const season = seasonState(parts, config.season);
    if (season === 'live' || season === 'archive') await render(root, slug, config, season, parts);
  }

  function ensureStylesheet() {
    if (document.querySelector('link[data-advent-teaser-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${origin}/embed/teaser.css`;
    link.setAttribute('data-advent-teaser-css', '');
    document.head.append(link);
  }

  const roots = document.querySelectorAll('[data-advent-teaser]');
  if (roots.length === 0) return;
  ensureStylesheet();
  for (const root of roots) {
    start(root).catch(() => {}); // anything unexpected simply leaves the container empty
  }
})();
