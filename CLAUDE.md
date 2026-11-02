# Advent — repo notes

An embeddable Advent calendar platform for church websites: see [README.md](README.md) for what this is and
how it's built, [docs/adding-a-church.md](docs/adding-a-church.md) for onboarding a church, and
[docs/embedding.md](docs/embedding.md) for the church-facing embed guide. The global `~/.claude/CLAUDE.md`
("Standing practices") is binding here except where this file is more specific.

## This repo's deviations from the standing practices, and why

- **No full `/updates` changelog page or commit-hook pipeline yet.** Other MediaWright sites have an
  auto-refreshing `/updates` page, a `users.json` author lookup and git hooks that enforce a changelog entry
  and build tag on every commit. Building that whole pipeline wasn't on the critical path for this app's first
  release (a brand-new, single-purpose repo, not a multi-page parish site), so for now this repo keeps a plain
  `CHANGELOG.md` instead, with build tags applied by hand (`build-<date>.<NNN>`, matching the convention).
  Bringing over the full pipeline from `MrWrightsRules` is a reasonable follow-up once there's enough change
  volume to justify it — raise it with Greg rather than building it unasked.
- **No `/help` page on the live site yet.** `docs/embedding.md` and `docs/adding-a-church.md` are the
  plain-English guides for now (the former is for a church's webmaster, who is exactly the "non-technical
  person" the standing practice has in mind); a hosted `/help` page is a natural follow-up once the app has
  more than one tenant-facing page to explain.
- **No browser/E2e test suite yet** (no Playwright): `test/unit/` (`node --test`) covers the date and season
  logic, content and theme validation, the SVG safety/draw-cost lint (including the full attack-pattern suite
  carried over from the original module's security review), contrast, and a build smoke test. Before this app
  carries real traffic, a short Playwright suite exercising the calendar page and the cross-origin embed in a
  real browser (`playwright install --with-deps chromium`, then wire into `.github/workflows/ci.yml` the way
  other MediaWright repos do) is worth adding.

## Architecture notes (not duplicated from README.md)

- **Multi-tenant, not multi-site.** One Worker, one deploy, many churches — see README.md's "How it works".
  Adding a church is a data change (`tenants/<slug>/`), never a code change; `src/core/schema.mjs`'s
  `slugIsSafe` and `RESERVED_SLUGS` are the only things standing between a tenant folder name and a live page
  address, so a new reserved route (anything this app serves itself outside `tenants/`) must be added there.
- **Launch flags were deliberately dropped.** The original kington-parishes module had `goLive`,
  `artRequired`, `publicListing` and a whole pre-launch rehearsal/guard-test system, because that module was
  compiled into one specific site's build and needed a safety net against accidentally revealing an
  unfinished calendar on a live site that already had other content. Here, a tenant simply isn't added to
  `tenants/` (or deployed) until it's ready — "merged to `main` and deployed" already is the launch step, so
  the extra machinery would be redundant complexity.
- **Day files are not server-side date-gated.** Like the original module, every day's JSON is always
  fetchable (not secret, just kept out of search via `X-Robots-Tag: noindex`); the client-side date logic is
  what keeps a future door's content from showing in the UI. Now that this app actually controls its own
  server (unlike the original's pure static hosting), server-side gating of future days is a real option if
  the "don't let a curious visitor peek ahead by guessing the file name" property turns out to matter more
  than it did for the original — a possible future hardening pass, not something to add unasked.
- **The cross-origin teaser (`src/client/teaser.js`) duplicates a small slice of `src/core/date.mjs`'s season
  logic**, because it has to run standalone on a church's own foreign site with no bundler and no module
  imports available to it. `test/unit/teaser.test.mjs` extracts the inlined functions straight from the
  shipped source and checks them against the real `date.mjs` for a whole year, so the two can't quietly drift
  apart — if you change the season rules in `date.mjs`, update the matching logic in `teaser.js` too and
  rerun that test.

## Commands

See README.md's "Commands" section — `npm run build`, `npm test`, `npm run audit`, `npm run serve`,
`npm run deploy`. Report test runs as `advent: N tests passed in Xs`, per the global standing practice.
