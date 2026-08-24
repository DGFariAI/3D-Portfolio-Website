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

The glow is not designed, it is **ported from the portfolio's mobile hero**,
which is the look this card is meant to match.

`measure-hero-glow.mjs` loads `/portfolio` at 390px in a headless browser, waits
out the intro, and reads the live `.character-rim`: its box after transform, its
blur, its inset shadow, and where its centre sits inside the clip. Those numbers
are the `PORTFOLIO_MOBILE` block in `render-og.mjs`, and every glow value on the
card is derived from them by the ratio between the two hero widths. Change
`CARD.hero` and the glow rescales with her; nothing has to be re-tuned by hand.

Two things about it are easy to get wrong by eye. The glow is roughly **twice
her head width**, not a tight halo. And its centre sits near her **chin**, not
behind her head, which is what gives the bloom its lift up past her hair and
down across her shoulders.

Three earlier attempts are worth not repeating. A hand-written radial gradient
came out visibly bluer and more saturated than the card it replaced. Recovering
the old card's background by masking and diffusion matched that card exactly but
kept a wash that was never the portfolio's look. A tight halo sized to sit
inside the card was contained and tidy and still did not look like the phone.
Measuring the real thing was the only approach that worked.

If the glow ever needs to change, re-run `measure-hero-glow.mjs` against
whatever the portfolio does then, and paste the numbers back in.

## Tuning it

Everything adjustable lives in the `CARD` object at the top of `render-og.mjs`:
hero width, how far below the bottom edge she is cropped (raise `drop` to buy
headroom above her head), and the four glow values.
