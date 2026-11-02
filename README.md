# Advent

An embeddable Advent calendar for church websites. One shared calendar — 25 doors, 26 with the Epiphany bonus
door — that any number of churches embed on their own site with two lines of HTML. Nothing to install,
nothing to host themselves, and nothing to configure beyond an optional name and colours.

The calendar lives at `https://advent.mediawright.uk/` and can be:
- linked to directly, or shown full-page in an `<iframe>`;
- shown as a small "today's door" banner on a church's own home page via a tiny embed script.

See [docs/embedding.md](docs/embedding.md) for the two snippets a church's webmaster pastes in.

## How it works

- `content/` is the one shared calendar: `theme.mjs` (dates, colours, Bible translation credit),
  `content.mjs` (the 25 days of story text, references, wonder questions and prayers), `art/day-NN.svg` (one
  picture per day) and an optional `scene.svg` (the calendar's backdrop picture). See
  [docs/editing-content.md](docs/editing-content.md) for how to change it.
- `npm run build` (`scripts/build.mjs`) validates the theme and content, lints every picture for safety and
  draw cost, and writes static output to `public/`: the calendar page, one JSON file per day, the pictures,
  and a small public `config.json` the embed script reads.
- There is no church-specific content anywhere in the build. A church's name and colours are supplied entirely
  at embed time — `?site=` on the calendar page's own address, `data-site-name`/`data-night`/`data-accent`/etc.
  on the teaser embed — read and validated client-side (`src/client/advent.js`, `teaser.js`), never baked in.
- `src/core/` holds the pure logic — date and season rules, content validation, the picture safety lint — all
  covered by `test/unit/`. `src/client/` holds the browser code: `advent.js`/`advent.css` (the calendar page
  itself) and `teaser.js`/`teaser.css` (the cross-origin embed banner).
- The whole thing is a static site. There is no server-side code and no database: `wrangler.toml` points
  Cloudflare at `public/` as a Workers static-assets site.

This grew out of an Advent calendar built for one church's own website in 2025, which was fully built but
never launched there. The hard parts — the date and season logic, the content safety rules, the SVG picture
lint (it bounds not just file size but how *expensive a picture is to draw*, since a visitor's browser draws
whatever gets uploaded) — carried over mostly unchanged. What changed is everything about how the content is
served and who it belongs to: it started out compiled into one specific church's site build, with that
church's name baked into every page; it's now one shared, nameless calendar read at build time from `content/`
and served from this app's own domain, with each embedding church supplying its own identity at the point of
embedding instead.

## Commands

```bash
npm install
npm run build   # content/ + src/ -> public/
npm test        # node's built-in test runner, test/unit/
npm run audit   # npm audit --audit-level=high
npm run serve   # build, then a local Cloudflare dev server (honours public/_headers, unlike a plain static server)
npm run deploy  # build, then wrangler deploy (Greg does this; see "Deploying" below)
```

## Deploying

Greg owns the Cloudflare Worker and the `advent.mediawright.uk` DNS (MediaWright's standing practice: build-side
Cloudflare resources are this app's to manage, DNS and account settings are his). This repo only needs to keep
`public/` buildable and `wrangler.toml` correct; `npm run deploy` is there for whoever has the Cloudflare
credentials to run it, or it can be wired into GitHub's own Cloudflare integration later.

## Status

Live content: `content/` (story and 26 pictures originally written for Kington Parishes' own website — see
`CHANGELOG.md` for when the text was generalised so it carries no single church's name or local references).
