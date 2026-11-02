# Editing the shared calendar's content

There is one calendar, shared by every church that embeds it (see [docs/embedding.md](embedding.md)) — so
there is no per-church onboarding any more. Everything lives in `content/`:

- `content/theme.mjs`: the season dates, the optional Epiphany bonus door, the colour palette, time zone, and
  the Bible translation credit. `siteName` is left `''` on purpose — a church supplies its own name per-embed
  instead (`?site=` on the calendar page, `data-site-name` on the teaser embed), so there's nowhere a single
  church's name belongs here.
- `content/content.mjs`: the 25 days of story text, references, wonder questions and prayers (plus the
  optional 26th bonus day).
- `content/art/day-NN.svg`: one picture per day, named to match `content.mjs`'s `art` field.
- `content/scene.svg`: the calendar's backdrop picture (optional; the shared default hills scene is used if
  this is absent and `theme.scene` is `null`).

## Making a change

1. Edit the file(s) above directly.
2. `npm run build` — validates the theme and content (`src/core/schema.mjs`), lints every picture for safety
   and draw cost (`src/core/svg-lint.mjs`), and writes `public/`. If anything is wrong, the error names
   exactly which field (and which day, for content) and why.
3. `npm test` — includes a check that the real build runs clean and that the pictures stay comfortably under
   the safety and cost limits, plus a WCAG AA contrast check on every colour pairing the stylesheet uses.
4. Look at it: `npm run serve` starts a local Cloudflare dev server (this honours `public/_headers`, unlike a
   plain static file server) at `http://localhost:8787/`. Use `?advent-preview=2026-12-12` to see any date
   without waiting for it.
5. Commit, open a PR, get it reviewed and merged (see this repo's `CLAUDE.md` for the branch and auto-merge
   rules). There is no separate "launch" step: the change is live once it's merged and deployed.

## Content rules worth knowing before you start writing

- **One source of truth.** `content/` is the only place this story or these settings live.
- **Never invent facts.** If a date, a reference or a detail isn't confirmed, leave it out or ask.
- **Keep it generic.** Since every church shares this calendar, nothing in the text or credits should name a
  particular church or place (this was tightened once already — see `CHANGELOG.md` — when the content was
  moved out of a single church's own site).
- **The text rules are strict on purpose**: no markup, no web addresses, no `{{` template braces, no control
  or invisible characters. This is what lets every day's text be served as plain JSON with no further
  escaping and no risk of a day's story carrying a hidden link or script. Plain punctuation, quotes and
  Bible references (`John 3:16`, with a space after the book name) are all fine.

## A church's own name and colours

A church never edits `content/` to add its name or colours — that would make the one shared calendar carry
one church's identity for everyone. Instead, a church's name and colour overrides are supplied entirely at
embed time (`?site=` / `data-site-name`, and the `data-night`/`data-accent`/etc. colour attributes on the
teaser), validated client-side by the same rules the build enforces (`siteNameIsSafe` in `src/core/day.mjs`).
See [docs/embedding.md](embedding.md) for the exact snippet.
