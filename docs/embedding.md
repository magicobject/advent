# Embedding the calendar on your church's website

Your calendar address is `https://advent.mediawright.uk/<your-slug>/` — MediaWright will give you the exact
address when your calendar is set up. There are two ways to show it on your own site; use either or both.

## 1. A banner on your home page ("today's door")

Paste this wherever you want the banner to appear (your home page is the usual choice):

```html
<div data-advent-teaser data-slug="your-slug"></div>
<script src="https://advent.mediawright.uk/embed/teaser.js" defer></script>
```

Replace `your-slug` with your calendar's address. That's it — nothing else to configure. The banner:

- shows nothing at all outside 1 December to 6 January, so your page is unaffected the rest of the year;
- shows today's door (title and picture) during Advent, and "the Christmas story" during the 12 days after;
- links to your full calendar;
- loads its own stylesheet and colours itself from your calendar's settings, so there's nothing to style by
  hand;
- makes one request to `advent.mediawright.uk` for your calendar's public settings, and (during Advent) one
  more for today's story title and picture — nothing from your own site is sent anywhere.

You can place the `<div>` anywhere on the page; the script does not move it or affect anything else around it.

## 2. The full calendar, embedded in a page

If you'd rather show the whole calendar inside one of your own pages (instead of just linking to it), use an
`<iframe>`:

```html
<iframe src="https://advent.mediawright.uk/your-slug/" title="Advent calendar" width="100%" height="900"
  style="border: 0; max-width: 760px; display: block; margin: 0 auto;" loading="lazy"></iframe>
```

The calendar page adjusts its own height as the "today" state and opened-day dialog change, but an `<iframe>`
can't follow that automatically — pick a height tall enough for the whole calendar (900px comfortably fits
it on a phone) and let visitors scroll inside the frame if they need to. Linking to the calendar directly (not
inside a frame) gives a better experience if you have the choice.

## What data leaves your site

Nothing. The embed script only ever talks to `advent.mediawright.uk`, with no cookies and no data about your
visitors sent along (`credentials: 'omit'` on every request). It stores nothing in the visitor's browser.
