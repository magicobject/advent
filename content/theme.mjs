// The shared Advent calendar's settings: ONE calendar, shared by every church that embeds it (see
// docs/embedding.md) — there is no church-specific content any more, so siteName is left '' (every embedding
// church supplies its own name at embed time instead; see src/client/advent.js's `?site=` query handling and
// teaser.js's `data-site-name`). Shape and limits are documented in src/core/schema.mjs. The story, pictures
// and colours were originally written for Kington Parishes' own website in 2025 (that module was fully built
// and reviewed but never launched there before the project was shelved) and carry over as the one shared
// calendar's content: nothing in the text or pictures names Kington specifically.
export const theme = Object.freeze({
  siteName: '',
  timeZone: 'Europe/London',
  season: Object.freeze({
    start: Object.freeze({ month: 12, day: 1 }),
    end: Object.freeze({ month: 12, day: 25 }),
    archiveUntil: Object.freeze({ month: 1, day: 6 }),
  }),
  // The 6 January bonus door (Epiphany, "Gifts for a King").
  bonus: Object.freeze({ on: Object.freeze({ month: 1, day: 6 }), label: 'Epiphany' }),
  // This church's own scene picture (the five church silhouettes on the ridge): tenants/kington/scene.svg.
  scene: 'scene.svg',
  translationName: 'World English Bible',
  // Contrast (WCAG 2, computed by test/unit/contrast.test.mjs):
  //   text on paper 14.09   textSoft on paper 8.52   link on paper 5.53   (need 4.5)
  //   cream on night 13.29  accentInk on accent 10.26  accent on night 9.78 (need 4.5)
  //   doorEdge on door 3.68 (need 3, UI edge)   focus on night 14.87 (need 3, focus ring)
  // AVOID: focus on paper (about 1.0) and link on night (about 2.7). They fail.
  colours: Object.freeze({
    night: '#14202b',
    sky2: '#2E3C48',
    ridge: '#0d161e',
    cream: '#F2E6C4',
    accent: '#E8C27A',
    accentInk: '#1F1A0B',
    door: '#22323f',
    doorLocked: '#18232d',
    doorEdge: '#A8813C',
    paper: '#F8F5EE',
    text: '#262521',
    textSoft: '#4A473F',
    link: '#7C5E28',
    focus: '#fff3c8',
  }),
});
