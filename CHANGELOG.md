# Changelog

A simple changelog (see `CLAUDE.md`'s "This repo's deviations" for why this isn't the full `/updates` page
pipeline other MediaWright sites use yet). Newest first. Build tags follow `build-<date>.<NNN>`.

## build-2026-11-02.002 — Greg Wright

Dropped the per-church "slug" concept: there is now ONE shared calendar, served at the root address, instead
of one `tenants/<slug>/` per church. `tenants/kington` and `tenants/_example` moved to a single `content/`
folder; `content/theme.mjs`'s `siteName` is now optional and empty by default (no church's name is baked in).
A church supplies its own name and colours entirely at embed time instead: `?site=` on the calendar page's
own address, or `data-site-name`/`data-night`/`data-accent`/etc. on the teaser embed — both validated
client-side by the same rule the build uses (`siteNameIsSafe` in `src/core/day.mjs`). Generalised the shared
content itself while this change was made: a local "Hergest Ridge" reference and every picture's "Original
illustration for Kington Parishes" credit (now "for this calendar") no longer name a specific church, since
the content is shared by whoever embeds it. See `docs/embedding.md` for the new snippet and
`docs/editing-content.md` (renamed from `docs/adding-a-church.md`) for editing the shared content.

## build-2026-11-02.001 — Greg Wright

First release: a multi-tenant Advent calendar platform, grown out of the Advent calendar module built for
one church's own website in 2025 (fully built, reviewed, but never launched there before the project was
shelved). The date/season logic, the content and theme validators, and the SVG picture safety-and-draw-cost
lint carried over largely unchanged; everything about how a church's content is served is new: each church is
now a `tenants/<slug>/` folder, built to its own `public/<slug>/` address, and embedded into the church's own
site via a two-line cross-origin snippet ([docs/embedding.md](docs/embedding.md)) instead of being compiled
into one specific site's build.

First tenant: `tenants/kington` (Kington Parishes), its story and 26 pictures recovered from the original
module's git history.
