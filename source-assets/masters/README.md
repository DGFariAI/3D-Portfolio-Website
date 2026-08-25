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

## The green flecks, and what actually fixed them

Residual green survived the key at fast-moving edges, showing as flecks during
the page turn. It had always been there, and got noticed only once she was made
larger: the clip before it carried six times more, 886 pixels in its worst frame
against 145.

Restructuring the pipeline to fix it was a dead end, recorded here so nobody
repeats it. Keying before the slow-down, denoising after the key, temporal
mixing, slowing by frame duplication and keying harder all removed the green,
and every one of them cost either the matte or the weight: opacity down to
28-66% where the backlight shines through her face, or 2.2 to 3.1MB against
675KB. Keying harder at 0.50 similarity started eating her outright.

What fixed it is one clamp on the colour, applied where the fill already runs:

```
g' = min(g, (r + b) / 2 + 12)      for visible pixels
```

Green can never run more than a little ahead of red and blue, which is the
definition of a green fleck, and nothing else in frame is green so nothing else
moves. Zero green pixels, the matte untouched at 99.6% opaque, and the file came
out smaller than before.

## Clicking the book

Only the book opens the blog, and it is done by hit testing coordinates in the
click handler rather than by overlaying a button on the clip. An overlaid
element was tried and made the picture stutter: a positioned box on top of a
video with an alpha channel pulls it out of its own compositing layer, so the
browser recomposites her every frame.

## Stutter on the book cover during the page turn

The cover's text is not temporally stable in the generation: across six
consecutive frames of the master the word Learn changes shape and the divider
shifts, because the model redraws the text each frame rather than tracking it.
Nothing downstream can restore detail that was never consistent.

It only became visible once she was made larger, and the numbers say the clip
itself was not the cause: measured on the title region during the page turn,
the version before it was jerkier, at 1.55 against 1.32.

What helps is `tmix=frames=3` on the finished RGBA, which averages each frame
with its neighbours and cuts the jerkiness to 0.80. Two alternatives were tried
and rejected. `tmix=frames=5` scores better still, 0.74, and visibly doubles her
hand during the turn. Motion compensated interpolation, `mi_mode=mci`, was worse
than doing nothing, at 1.54, because it tries to track text that moves
incoherently and smears it.

The cost of `tmix=3` is a slightly soft edge on her hand at the fastest frames,
which at the size she actually renders is close to invisible. If the cover ever
needs to be genuinely sharp, that is a regeneration with the book held still,
not an encoding setting.


## The title blinking during the page flip

The "DGFari Learn" lettering on the cover appeared to shimmer, worst while the
book was moving. It was not the encode and it was not the lettering. It was the
retiming.

Slowing the clip to 0.85x was done with `minterpolate=fps=30:mi_mode=blend`,
which holds the output at 30fps by inventing the frames the slowdown leaves
gaps for. A 9 second window is 270 real frames; the retimed clip had 307. Those
37 extra frames are weighted averages of their neighbours, so each one shows the
cover text twice at half strength. That is the blink, and it only shows while
there is motion to average, which is why the book moving made it worse.

The fix is to invent nothing. The same 270 frames are played at 25.5fps
(30 x 0.85), which is the identical duration and the identical speed with every
frame a real one:

    setpts=PTS/0.85   then   -r 51/2 -fps_mode cfr

Measured on the title: sharpness wobble between frames fell from 0.0131 to
0.0058, and the worst single jump, which is the blink you actually see, from
0.186 to 0.032. Overall edge sharpness went up as well, 3.84 to 4.02, because
the bits no longer go into 37 blurred frames.

crf 42 was tried and measured no better than crf 45, which confirms the cause
was never the bitrate.

### What was tried and is wrong

Frame averaging (`tmix=frames=3`) steadies the text but also averages her
flipping hand, which ghosts. Restricting it with a mask over the title does not
save it: her hand travels into the title region when she reaches across to turn
the page, so a fixed rectangle averages the hand too. A mask cannot be placed
from one frame when the thing it must avoid moves.

## The blink at 8.7s

The generation closes her eyelid almost entirely in a single frame: 71% of the
whole closure happened between two frames, and the remaining 29% then crawled
over eight. Snap-then-crawl is what reads as a glitch. It is in the generated
footage, not in the pipeline, and it survives at any frame rate because the
intermediate lid position was never drawn.

The fix draws it. One frame is inserted before the snap, built by motion
interpolation of the eye box only:

    ffmpeg -i seven.mp4 -vf minterpolate=fps=51:mi_mode=mci:mc_mode=aobmc:
           me_mode=bidir:vsbmc=1

Motion interpolation rather than averaging, because averaging two lid positions
gives a translucent lid with the iris showing through it, while interpolation
moves the lid and keeps the lashes sharp. The rest of the inserted frame is a
copy of the frame after it, which is safe here because the book and hands are
nearly still at this moment: 0.03 to 0.46 per frame against a clip median of
1.25 and a page-flip average of 2.86. So nothing is interpolated except the
eyelid, and the body simply holds for 39ms.

Measured: the largest single-frame lid jump fell from 32.1 to 16.3, and the
inserted frame scores 1.08 on single-frame deviation against a clip median of
0.90, so it does not itself stand out.

The clip is now 265 frames over 10.392s.

## The crossfade had to go

A second flicker showed up at the start of the loop, right as she begins to
turn the page. It was not a blink. Her eyes read 43.7, then 29.3, then 37.1:
down and back up inside two frames, which no eyelid does.

It was the loop crossfade. Blending the last seven frames over the first seven
blends her eyelids too, and her eyes are not in the same position at both ends,
so one lid ghosted over the other. Frame 4 sat at the middle of the blend and
carried the worst single-frame deviation in the whole clip, 1.37 against a
median of 0.90.

The crossfade is removed. All 270 frames of the window are kept and the loop
simply wraps. Measured, the wrap step is 1.86 against ordinary frame-to-frame
motion whose median is 0.62 and whose maximum is 6.04, so it lands at the 87th
percentile: a larger than average step, nowhere near an outlier, and far
cheaper than a ghosted eyelid on every loop.

Frame 4 now steps -0.6 instead of -14.4, and deviates 0.84 instead of 1.37.

The note further up about a 0.267s crossfade describes the old build. The cut
points it defends are still the right ones; only the blend is gone.

The clip is now 271 frames over 10.627s.

## Two exports, and why

The clip ships at 880x948, not the 620x668 it was keyed at. The desktop layout
stands her on the bottom edge of the page, which needs roughly 740px of her on
a 900px screen, and at 620px she went soft past about 660px wide.

Measured on the book title at the size she is actually displayed, the 880px
export is 13.5% sharper than upscaling the 620px one. crf 46 was tried and
bought only 2.7 more points for another 396KB, so crf 50 ships: 965KB against
724KB, for 2.06x the pixels.

The blink work survives the re-encode. Title wobble is 0.0061 and the worst
single jump 0.0473, against 0.0060 and 0.0527 at crf 46.
