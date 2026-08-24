# Hub link logos

Drop the three brand marks here with exactly these names. The hub already points
at them, so no code change is needed once the files exist:

| File                | Row            |
| ------------------- | -------------- |
| `omnigenesis.png`   | DGFari AI      |
| `dgfari-art.png`    | DGFari Art     |
| `dgfari-studio.png` | DGFari Studio  |

PNG with transparency, square, 256px or larger. SVG also works: change the
extension in the `LINKS` table in `src/routes/Hub.tsx` to match.

Until a file is present the row falls back to its placeholder icon rather than
showing a broken image.
