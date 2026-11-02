# Advent

An embeddable Advent calendar for church websites. One small app, many churches: each church gets its own
25-door calendar (26 with an optional Epiphany bonus door), its own story and pictures, its own colours — and
embeds it on its own site with two lines of HTML. Nothing to install, nothing to host themselves.

A church's calendar lives at `https://advent.mediawright.uk/<their-slug>/` and can be:
- linked to directly, or shown full-page in an `<iframe>`;
- shown as a small "today's door" banner on the church's own home page via a tiny embed script.

See [docs/embedding.md](docs/embedding.md) for the two snippets a church's webmaster pastes in.

## How it works

- `tenants/<slug>/` is one church: `theme.mjs` (name, dates, colours), `content.mjs` (the 25 days of story
  text, references, wonder questions and prayers), `art/day-NN.svg` (one picture per day) and an optional
  `scene.svg` (the calendar's backdrop picture). See [docs/adding-a-church.md](docs/adding-a-church.md) for
  how to add one — it's a copy-and-edit job, no code.
- `npm run build` (`scripts/build.mjs`) validates every tenant's theme and content, lints every picture for
  safety and draw cost, and writes static output to `public/<slug>/`: the calendar page, one JSON file per
  day, the pictures, and a small public `config.json` the embed script reads.
- `src/core/` holds the pure logic — date and season rules, content validation, the picture safety lint — all
  covered by `test/unit/`. `src/client/` holds the browser code: `advent.js`/`advent.css` (the calendar page
  itself, shared by every church) and `teaser.js`/`teaser.css` (the cross-origin embed banner).
- The whole thing is a static site. There is no server-side code and no database: `wrangler.toml` points
  Cloudflare at `public/` as a Workers static-assets site.

This grew out of an Advent calendar built for one church's own website in 2025, which was fully built but
never launched there. The hard parts — the date and season logic, the content safety rules, the SVG picture
lint (it bounds not just file size but how *expensive a picture is to draw*, since a visitor's browser draws
whatever a church uploads) — carried over mostly unchanged. What changed is everything about how a church's
content is served: instead of being compiled into one specific site's build, it's now read at build time from
a `tenants/` folder and served from this app's own domain, so any number of churches can use it without
touching each other's code.

## Commands

```bash
npm install
npm run build   # tenants/ + src/ -> public/
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

First tenant: `tenants/kington` (Kington Parishes), carried over from the site it was originally built for.
Everything else in `tenants/` is `_example`, the template a new church is copied from — folders starting with
`_` are skipped by the build, so it's never deployed on its own.
