# The link preview card

`public/dgfari-og.jpg` is what unfurls when someone pastes a dgfari.com link
into X, LinkedIn, iMessage, WhatsApp or Slack, and it is also the preview shown
inside the site's own share sheet.

## Regenerating it

```
node render-og.mjs
```

Run it from this folder with a Chrome install present. It renders
`og-template.html` at 1200x630 with a 2x device pixel ratio, waits for Geist to
load from Google Fonts rather than screenshotting the fallback, then resamples
down to 1200x630 and writes JPEGs at three qualities so the smallest one that
still holds up can be chosen by looking rather than by guessing.

Copy the chosen file to `public/dgfari-og.jpg` and **bump the `?v=` query in all
four places**: `src/components/SEO.tsx`, `src/components/ShareButton.tsx`, and
the two meta tags in `index.html`. Every unfurler caches these aggressively by
URL, so without the bump the old card keeps appearing for weeks.

## What is in it

The left column is the itsdgfari icon and wordmark set the way the portfolio
navbar sets them, the tagline, the sparkle rule, the five destinations and the
domain. The right is `hero-f0.png`, the first frame of
`public/videos/character/hero.webm` extracted with its alpha intact:

```
ffmpeg -c:v libvpx-vp9 -i ../../public/videos/character/hero.webm -frames:v 1 hero-f0.png
```

The `-c:v libvpx-vp9` before `-i` is load-bearing. Without it ffmpeg picks a
decoder that drops the alpha channel and the cutout comes out on black.

Keep it at 1200x630. Anything else gets letterboxed or cropped by one platform
or another, and the crop is never the one you would have chosen.


## The backlight

The glow behind her is not a gradient anyone invented. It is the
`.character-rim` recipe from `src/components/styles/Landing.css`, the same
backlight the portfolio hero sits in: a pink disc (`#f59bf8`) carrying a
violet-blue inset shadow (`rgba(85, 0, 255, 0.65)`) pushed 66px right and 35px
down, blurred hard. That off-centre offset is the whole trick, and it is why the
glow reads as two colours, warm on the upper left and cool on the lower right,
rather than as one flat wash.

It is sized to stay fully inside the card. A larger one looks more dramatic in
isolation and gets sliced flat by the top edge, which reads as an accident, and
it lifts the whole field so the wordmark and pills lose contrast at the ~350px
width a card is actually seen at in a feed.

Two earlier attempts are worth not repeating. A hand-written radial gradient
came out visibly bluer and more saturated than the card it replaced. Recovering
the old card's background by masking and diffusion matched it exactly but kept a
wash that was never the portfolio's look in the first place. Neither is needed:
the ground is plain `--backgroundColor` with this one glow on it, which is what
the hero sits on in the portfolio.

The glow's position is derived from the artwork, not hardcoded. `render-og.mjs`
finds her head by scanning the frame's alpha for the widest opaque span across
the top, so changing `CARD.hero` moves the glow with her instead of leaving a
second number to keep in sync.

## Tuning it

Everything adjustable lives in the `CARD` object at the top of `render-og.mjs`:
hero width, how far below the bottom edge she is cropped (raise `drop` to buy
headroom above her head), and the four glow values.
