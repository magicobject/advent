# Embedding the calendar on your church's website

There is one shared calendar at `https://advent.mediawright.uk/` — every church embeds the same content.
There are two ways to show it on your own site; use either or both. Neither needs any setup beyond pasting
the snippet.

## 1. A banner on your home page ("today's door")

Paste this wherever you want the banner to appear (your home page is the usual choice):

```html
<div data-advent-teaser data-site-name="St Mary's"></div>
<script src="https://advent.mediawright.uk/embed/teaser.js" defer></script>
```

`data-site-name` is optional — set it to your church's name and the banner reads "Advent at St Mary's"
instead of the plain "Advent calendar"; leave it out for the plain version. Nothing else needs filling in.
The banner:

- shows nothing at all outside 1 December to 6 January, so your page is unaffected the rest of the year;
- shows today's door (title and picture) during Advent, and "the Christmas story" during the 12 days after;
- links to the full calendar, carrying your church's name along so it shows there too;
- loads its own stylesheet and uses the shared calendar's own colours, so there's nothing to style by hand —
  see "Matching your own colours" below if you'd like different ones;
- makes one request to `advent.mediawright.uk` for the calendar's public settings, and (during Advent) one
  more for today's story title and picture — nothing from your own site is sent anywhere.

You can place the `<div>` anywhere on the page; the script does not move it or affect anything else around it.

### Matching your own colours

Add any of these attributes to the same `<div>` to override the shared calendar's colours in your banner
(each is a `#rrggbb` colour; leave any of them out to keep the shared default):

```html
<div data-advent-teaser data-site-name="St Mary's"
  data-night="#102030" data-sky2="#1c3045" data-accent="#c9a227" data-accent-ink="#2a2000"
  data-cream="#f0e6cf" data-door-edge="#8a6a20" data-focus="#fff0c0"></div>
```

`data-night`/`data-sky2` are the banner's background gradient, `data-accent`/`data-accent-ink` the button and
heading, `data-cream` the body text, `data-door-edge` a hairline, and `data-focus` the keyboard focus ring.
This only changes your own banner — the full calendar page keeps the shared look.

## 2. The full calendar, embedded in a page

If you'd rather show the whole calendar inside one of your own pages (instead of just linking to it), use an
`<iframe>`:

```html
<iframe src="https://advent.mediawright.uk/?site=St%20Mary%27s" title="Advent calendar" width="100%" height="900"
  style="border: 0; max-width: 760px; display: block; margin: 0 auto;" loading="lazy"></iframe>
```

The `?site=` part is optional, the same name as `data-site-name` above, URL-encoded. The calendar page
adjusts its own height as the "today" state and opened-day dialog change, but an `<iframe>` can't follow that
automatically — pick a height tall enough for the whole calendar (900px comfortably fits it on a phone) and
let visitors scroll inside the frame if they need to. Linking to the calendar directly (not inside a frame)
gives a better experience if you have the choice.

## What data leaves your site

Nothing. The embed script only ever talks to `advent.mediawright.uk`, with no cookies and no data about your
visitors sent along (`credentials: 'omit'` on every request). It stores nothing in the visitor's browser.
