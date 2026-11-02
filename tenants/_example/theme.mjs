// TEMPLATE, NOT A REAL TENANT. Copy this folder to tenants/<your-church-slug>/ to add a new church (see
// docs/adding-a-church.md) and replace every placeholder below and in content.mjs. Folders starting with "_"
// are skipped by scripts/build.mjs, so this one is never built or deployed on its own.
// Shape and limits are documented in src/core/schema.mjs.
export const theme = Object.freeze({
  siteName: 'Example Parish',
  timeZone: 'Europe/London',
  season: Object.freeze({
    start: Object.freeze({ month: 12, day: 1 }),
    end: Object.freeze({ month: 12, day: 25 }),
    archiveUntil: Object.freeze({ month: 1, day: 6 }),
  }),
  // A 26th door (for example Epiphany on 6 January) needs a `bonus` day in content.mjs as well. null = 25 doors.
  bonus: null,
  // null = the shared default hills scene. A file name such as 'scene.svg' means your own hand-made picture
  // in this folder (tenants/<slug>/scene.svg), linted exactly like the day pictures.
  scene: null,
  translationName: 'Example Bible translation',
  // Every pairing is checked for WCAG AA contrast by test/unit/contrast.test.mjs: keep that test passing if you
  // change these colours (see docs/adding-a-church.md for the full list of pairings it checks).
  colours: Object.freeze({
    night: '#10233a',
    sky2: '#243b55',
    ridge: '#0a1626',
    cream: '#EEF2E6',
    accent: '#9AD0B5',
    accentInk: '#0B1E16',
    door: '#1d3552',
    doorLocked: '#14263a',
    doorEdge: '#5C957E',
    paper: '#F6F8F4',
    text: '#1c2420',
    textSoft: '#3d4a43',
    link: '#2F6B54',
    focus: '#E6F4EA',
  }),
});
