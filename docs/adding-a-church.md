# Adding a new church

No code changes are needed — only data. This is the checklist for whoever is onboarding a new church
(normally Greg, drafting the content with the church, or an agent briefed with their material).

1. **Copy the template.**
   ```bash
   cp -r tenants/_example tenants/<their-slug>
   ```
   The slug becomes the church's address (`advent.mediawright.uk/<their-slug>/`): lower-case words joined by
   single hyphens, up to 32 characters (`src/core/schema.mjs`'s `slugIsSafe` checks this, and refuses a
   handful of names this app's own routes use — `assets`, `embed`, `help`, and so on).

2. **Edit `tenants/<slug>/theme.mjs`**: the church's name, time zone, the 25-day season dates (they must span
   exactly 25 days — the validator explains why if they don't), the optional Epiphany bonus door, and the
   colour palette. Every colour pairing the calendar page uses is checked for WCAG AA contrast by
   `test/unit/contrast.test.mjs`; run `npm test` after changing colours.

3. **Edit `tenants/<slug>/content.mjs`**: 25 days, each with a title, Bible reference, one or more short
   paragraphs of story, a "wonder" question, a short prayer, and credits. `src/core/day.mjs`'s text rules
   refuse markup, web addresses, template braces and a handful of other things that don't belong in a day's
   text — the error names exactly which field and why. Add a 26th "bonus" entry (numbered 26) only if the
   theme's `bonus` is set.

4. **Add the pictures**: one `day-NN.svg` per day in `tenants/<slug>/art/`, named to match `content.mjs`'s
   `art` field for that day, plus `scene.svg` if the church wants its own backdrop (otherwise the shared
   default hills scene is used). `scripts/build.mjs` lints every picture for safety (no scripts, no external
   links, no markup beyond a small allow-listed set of SVG elements and attributes) and for draw cost (how
   expensive it is for a visitor's browser to draw — a cheap-looking picture can still be very costly if it's
   built out of thousands of shapes or a nested mask). If a picture is refused, the error says exactly why.

5. **Build and test:**
   ```bash
   npm run build
   npm test
   ```
   `npm run build` writes `public/<slug>/` (day files, pictures, the calendar page, `config.json`) and
   regenerates the shared `public/_headers`. `npm test` includes a check that the real build runs clean and
   that the pictures stay comfortably under the safety and cost limits.

6. **Look at it.** `npm run serve` starts a local Cloudflare dev server (this honours `public/_headers`,
   unlike a plain static file server) at `http://localhost:8787/<slug>/`. Use `?advent-preview=2026-12-12` on
   the calendar page's own address to see any date without waiting for it (see
   [the embedding guide](embedding.md) for the cross-origin embed, which has no preview mode of its own).

7. **Commit, open a PR, get it reviewed and merged** (see this repo's `CLAUDE.md` for the branch and
   auto-merge rules). Once merged and deployed, the church's calendar is live at its address — there is no
   separate "launch" step or flag: a tenant going live is simply its folder being in `main` and deployed.

8. **Give the church [docs/embedding.md](embedding.md)** so their webmaster can add the two-line embed
   snippet to their own site.

## Content rules worth knowing before you start writing

- **One source of truth.** There's nowhere else a church's story or settings live — `tenants/<slug>/` is it.
- **Never invent facts.** If a date, a reference or a detail isn't confirmed, leave it out or ask, same as any
  other MediaWright content.
- **The text rules are strict on purpose**: no markup, no web addresses, no `{{` template braces, no control
  or invisible characters. This is what lets every day's text be served as plain JSON with no further
  escaping and no risk of a day's story carrying a hidden link or script. Plain punctuation, quotes and
  Bible references (`John 3:16`, with a space after the book name) are all fine.
