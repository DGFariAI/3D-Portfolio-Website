# Hub link logos

The hub reads these three marks. The filenames are load-bearing and are matched
exactly, capitals included: the site is served from Linux, where paths are
case-sensitive, so `dgfari-ai.png` would 404 even though it resolves on Windows.

| File                | Row           |
| ------------------- | ------------- |
| `DGFari-AI.png`     | DGFari AI     |
| `DGFari-Art.png`    | DGFari Art    |
| `DGFari-Studio.png` | DGFari Studio |

These are 128px display copies. The full-resolution originals live in
`source-assets/logos/`, outside the deployed folder. To change one, replace the
original there and re-export at 128px wide rather than editing these directly.

A row falls back to a placeholder icon if its file is missing or fails to
decode, so a bad filename degrades quietly instead of showing a broken image.
