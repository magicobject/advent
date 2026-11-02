# Changelog

A simple changelog (see `CLAUDE.md`'s "This repo's deviations" for why this isn't the full `/updates` page
pipeline other MediaWright sites use yet). Newest first. Build tags follow `build-<date>.<NNN>`.

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
