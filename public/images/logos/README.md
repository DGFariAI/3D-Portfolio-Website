# Hub link marks

The four rows on the hub read these files. Filenames are load-bearing and are
matched exactly: the site is served from Linux, where paths are case-sensitive.

| File                    | Row                |
| ----------------------- | ------------------ |
| `dgfari-portfolio.svg`  | DGFari's Portfolio |
| `dgfari-ai.svg`         | DGFari AI          |
| `dgfari-art.svg`        | DGFari Art         |
| `dgfari-studio.svg`     | DGFari Studio      |

## They are a set, not four separate files

All four are drawn to one construction spec, because a column of marks reads as
designed or as assembled depending on whether they share one:

| property             | target                | measured spread |
| -------------------- | --------------------- | --------------- |
| limb weight          | 24px in a 256 viewBox | 1.04x           |
| optical size         | 89 to 90% of the box  | 1.01x           |
| saturation           | 0.47 to 0.58          | 1.23x           |
| value                | 0.91 to 0.93          | 1.02x           |

For comparison, the marks these replaced varied by **4.6x** on limb weight.

Hue is deliberately *not* unified. Two marks are violet, one gold, one warm
orange, and that warmth is the only colour on the page that is not violet.

## Changing one

Do not edit these by hand: an edit that misses the weight or size target puts
the set back where it started. Re-run the pipeline in
`source-assets/logos/normalised/`, which traces the source artwork, equalises
limb weight by dilation or erosion, normalises optical size, and prints the
spread table above so a regression is visible immediately.

`DGFari-Art-authored.svg` in that folder is the one mark that could not be
normalised from its own artwork. Its lines were 5.5px and had to grow 4.5x to
reach the shared weight, which closed the frame and fused its six rays into a
blob, so the frame and a three-ray burst were redrawn as clean geometry already
at the target weight. The original is still in `source-assets/logos/`.

A row falls back to a placeholder icon if its file is missing or fails to
decode, so a bad filename degrades quietly instead of showing a broken image.
