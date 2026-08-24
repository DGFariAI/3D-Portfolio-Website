# Character clip masters

`dgfari-learn-reading.mp4` is the raw 15s green-screen generation.
`dgfari-learn-reading-source.png` is the still it was generated from.
`dgfari-learn-reading-looped.mp4` is the loop actually used on the hub, and is
what `public/videos/character/dgfari-learn.webm` is keyed from.

## Why the loop is cut where it is

The raw generation cannot be looped as-is, for two separate reasons.

**It ramps.** Measured frame by frame, overall brightness climbs from 74 to 80
over the first six seconds and then holds, so any loop that includes the opening
wraps with a visible jump. The ramp is in the shadows, not the skin: her face
moves only 195 to 200 across the whole clip. That rules out fixing it by gain,
which scales the brightest pixels most and left her face 6.5% hot.

**Its ends do not match.** A search over every pair of frames found the closest
usable pair at 5.133s and 14.133s. Cutting there, with a short 0.267s crossfade
to absorb the residual, gives a wrap step no larger than the clip's own ordinary
frame-to-frame motion, at the 75th percentile of it.

A longer crossfade was tried first and is the wrong answer: at 0.8s the opening
frames carried two to three times the normal inter-frame change, which reads as
a visible ghosting glitch. The fix is a good cut point plus a short blend, not a
long blend.

## Keying it

```
colorkey=0x0AC510:0.30:0.12        # colorkey, not chromakey, and no despill:
                                   # despill shifted her white shirt magenta
erosion                            # choke one pixel to kill the green rim
clip((lum-55)*3.0, 0, 255)         # harden the matte, see below
lum * min(1, (H-Y)/(H*0.16))       # fade the bottom, the book runs off frame
selectivecolor reds/yellows        # match her skin to the portfolio clips
fill transparent RGB with #0B080C  # stop VP9 chroma bleeding green back in
```

**Hardening the matte is not optional.** VP9 compresses the alpha plane lossily
like any other, so a flat 255 comes back around 230 with dips to 98, and
anything behind her shows through her face. Before hardening only 27% of her
forehead and 1.3% of the book cover were fully opaque. Raising the bitrate does
not fix it: crf 38 scored 94% against crf 44's 93%. Hardening took it to 100%,
and made the file smaller, because flat regions compress.
