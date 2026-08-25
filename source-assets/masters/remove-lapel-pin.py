"""Remove the amber lapel pin, by matching its shape.

Colour cannot do it and neither can position. The shadow between two fingers is
dark and warm, which is exactly what the pin is: measured, the pin reads
blue/red 0.44 at luminance 74 and lit skin 0.66 at 188, but that shadow sits in
the pin's range on both. And they are adjacent, 4 to 8 pixels apart on most of
the frames where both are visible, so growing a protective mask out from her
skin either misses the shadow or swallows the pin.

What does separate them is shape. The pin is a small roundel with concentric
rings; a finger is smooth. Correlating a template of the pin against the same
patch of every frame gives 0.68 to 1.00 where it is present and -0.43 to 0.22
where it is not, which is not a close call.

Matching also returns where it is, so the disc is centred on the pin as found
rather than on an average of where it usually sits.
"""
import glob
import numpy as np
from PIL import Image

CX, CY = 437, 521          # where the pin sits on the frame the template comes from
TEMPLATE_FRAME = 24
R = 14                     # template half-size
SEARCH = 7                 # how far the pin is allowed to have drifted
THRESHOLD = 0.55
RADIUS = 11.0              # the disc that covers it
COAT = np.array([19, 19, 15], dtype=np.float32)

files = sorted(glob.glob('frames/f-*.png'))


def grey(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32).mean(axis=2)


tmpl = grey(files[TEMPLATE_FRAME])[CY - R:CY + R, CX - R:CX + R]
t = tmpl - tmpl.mean()
tn = float(np.sqrt((t * t).sum()))

patched = 0
scores = []

for p in files:
    im = Image.open(p).convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    g = a[..., :3].mean(axis=2)

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
    scores.append(best)
    if best < THRESHOLD:
        continue

    x0, y0 = bx - 24, by - 24
    x1, y1 = bx + 24, by + 24
    sub = a[y0:y1, x0:x1, :3]
    r, b = sub[..., 0], sub[..., 2]
    lum = sub.mean(axis=2)

    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    disc = np.clip((RADIUS + 2.5 - np.sqrt((xx - bx) ** 2 + (yy - by) ** 2)) / 3.0, 0, 1)

    # The page is neutral where the pin is warm, and must not be painted over.
    page = (np.clip((45.0 - np.abs(r - b)) / 18.0, 0, 1)
            * np.clip((lum - 100.0) / 30.0, 0, 1))

    # Her skin, with a two pixel fringe so the shading at its edge goes too.
    # Only two: the pin is often within four pixels of it.
    lit = ((lum > 150) & ((r - b) > 40)).astype(np.float32)
    for _ in range(2):
        s = lit
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                s = np.maximum(s, np.roll(np.roll(lit, dy, 0), dx, 1))
        lit = s

    m = disc * (1.0 - np.maximum(page, lit))
    if m.sum() < 40:
        continue

    a[y0:y1, x0:x1, :3] = sub * (1 - m[..., None]) + COAT * m[..., None]
    Image.fromarray(a.astype(np.uint8), 'RGBA').save(p)
    patched += 1

sc = np.array(scores)
print('patched %d of %d frames' % (patched, len(files)))
print('match score: above threshold on %d frames, median elsewhere %.2f'
      % ((sc >= THRESHOLD).sum(), float(np.median(sc[sc < THRESHOLD]))))
