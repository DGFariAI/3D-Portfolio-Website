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

The left column is the wordmark, the tagline, the sparkle rule, the four
destinations and the domain. The right is `hero-f0.png`, the first frame of
`public/videos/character/hero.webm` extracted with its alpha intact:

```
ffmpeg -c:v libvpx-vp9 -i ../../public/videos/character/hero.webm -frames:v 1 hero-f0.png
```

The `-c:v libvpx-vp9` before `-i` is load-bearing. Without it ffmpeg picks a
decoder that drops the alpha channel and the cutout comes out on black.

Keep it at 1200x630. Anything else gets letterboxed or cropped by one platform
or another, and the crop is never the one you would have chosen.
