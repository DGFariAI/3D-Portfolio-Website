"""Remove the amber lapel pin.

Found by shape: the pin is a roundel of concentric rings and a finger is smooth,
so correlating a template of it scores 0.68 to 1.00 where it is present and
-0.43 to 0.22 where it is not. Colour and position both fail, because the shadow
between two fingers is dark and warm exactly like the pin and sits four to eight
pixels away from it.

Covered by cloning, not by painting. Filling with a colour was tried twice, flat
and sampled, and both left a patch that did not match the cloth around it and
changed shade from frame to frame, which read as the cover itself glitching.
The coat directly above the pin is the same cloth under the same light, so it is
copied down over it. That carries the real shading and the real grain, and it
moves with her because it is taken from the same frame.

The page edge runs beneath the pin and is protected: it is bright and neutral
where the coat is dark, so it is never cloned over.
"""
import glob
import numpy as np
from PIL import Image

CX, CY = 437, 521
TEMPLATE_FRAME = 24
R = 14
SEARCH = 7
STRONG = 0.55
WEAK = 0.38
GAP = 4
# Generous on purpose. The track still wobbles a pixel or two after smoothing,
# and a disc sized exactly to the pin left a sliver of it showing whenever the
# centre was slightly off. Cloning a little extra coat costs nothing: it is the
# same cloth either way.
RADIUS = 15.0
PAD = 26
LIFT = 34                 # how far above the pin the clean coat is taken from

files = sorted(glob.glob('frames/f-*.png'))
arrays, greys = [], []
for p in files:
    a = np.asarray(Image.open(p).convert('RGBA')).astype(np.float32)
    arrays.append(a)
    greys.append(a[..., :3].mean(axis=2))

tmpl = greys[TEMPLATE_FRAME][CY - R:CY + R, CX - R:CX + R]
t = tmpl - tmpl.mean()
tn = float(np.sqrt((t * t).sum()))

score = np.zeros(len(files))
pos = np.zeros((len(files), 2), dtype=int)
for i, g in enumerate(greys):
    best, bx, by = -2.0, CX, CY
    for dy in range(-SEARCH, SEARCH + 1):
        for dx in range(-SEARCH, SEARCH + 1):
            q = g[CY + dy - R:CY + dy + R, CX + dx - R:CX + dx + R]
            q = q - q.mean()
            qn = float(np.sqrt((q * q).sum()))
            if qn < 1e-6:
                continue
            c = float((t * q).sum() / (tn * qn))
            if c > best:
                best, bx, by = c, CX + dx, CY + dy
    score[i], pos[i] = best, (bx, by)

present = score >= STRONG
idx = np.where(present)[0]
for a_, b_ in zip(idx, idx[1:]):
    if b_ - a_ <= GAP + 1 and (score[a_ + 1:b_] >= WEAK).all():
        present[a_:b_] = True

# Matching decides whether the pin is there. It does not decide where, and that
# distinction is what took several passes to see: the search wanders by a few
# pixels between frames and a disc centred on its answer kept clipping the pin
# and leaving a crescent. Measured directly, the pin barely moves at all. Across
# every frame it shows on it occupies x 423 to 440 and y 516 to 529, so the
# cover sits at the centre of that, always.
PIN = np.array([432.0, 522.5])
sm = np.repeat(PIN[None, :], len(files), axis=0)

patched = skipped = 0
for i, p in enumerate(files):
    if not present[i]:
        continue
    a = arrays[i]
    bx, by = int(round(sm[i][0])), int(round(sm[i][1]))
    x0, y0, x1, y1 = bx - PAD, by - PAD, bx + PAD, by + PAD

    sub = a[y0:y1, x0:x1, :3]
    src = a[y0 - LIFT:y1 - LIFT, x0:x1, :3]          # the same cloth, higher up
    r, b = sub[..., 0], sub[..., 2]
    lum = sub.mean(axis=2)

    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dist = np.sqrt((xx - bx) ** 2 + (yy - by) ** 2)
    disc = np.clip((RADIUS + 3.0 - dist) / 3.5, 0, 1)

    # Only clone from clean coat. If what is above happens to be bright, this
    # is not the cloth and copying it down would be worse than the pin.
    srcdisc = disc > 0.02
    if float(src.mean(axis=2)[srcdisc].mean()) > 60:
        skipped += 1
        continue

    page = (np.clip((45.0 - np.abs(r - b)) / 18.0, 0, 1)
            * np.clip((lum - 100.0) / 30.0, 0, 1))
    # The pin's lower edge sits on the page boundary, and protecting the page
    # blindly there left a crescent of it behind. The page's own anti-aliased
    # edge is neutral; the pin is not, at 50 to 116 of red over blue. So a
    # clearly amber pixel gives up the page's protection.
    amber = np.clip(((r - b) - 22.0) / 12.0, 0, 1)
    page = page * (1.0 - amber)

    lit = ((lum > 150) & ((r - b) > 40) & (b > r * 0.55)).astype(np.float32)
    for _ in range(2):
        s = lit
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                s = np.maximum(s, np.roll(np.roll(lit, dy, 0), dx, 1))
        lit = s

    m = disc * (1.0 - np.maximum(page, lit))
    if m.sum() < 40:
        skipped += 1
        continue

    a[y0:y1, x0:x1, :3] = sub * (1 - m[..., None]) + src * m[..., None]
    Image.fromarray(a.astype(np.uint8), 'RGBA').save(p)
    patched += 1

print('patched %d frames, skipped %d that had nothing clean to clone from'
      % (patched, skipped))
