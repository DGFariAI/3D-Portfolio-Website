import { useEffect, useMemo, useState } from "react";
import "./styles/Reveal.css";

const LOGO = "/images/logos/dgfari-portfolio.png";
const PARTICLE_COUNT = 14;

/** Deterministic-enough scatter for the embers: which side they start from,
 * how far out, how high/low, and a small stagger so they don't all move in
 * lockstep. Recomputed on every mount, so every refresh looks slightly
 * different - that's wanted here, not a bug to pin down. */
const useEmbers = () =>
  useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const sx = side * (30 + Math.random() * 18); // vw from center
        const sy = (Math.random() - 0.5) * 70; // vh from center
        const delay = Math.random() * 260; // ms
        const size = 3 + Math.random() * 4; // px
        return { id: i, sx, sy, delay, size };
      }),
    [],
  );

/**
 * Plays on every hub load: embers travel in from the left/right edges of the
 * viewport, converge behind the mark, then a light sweep reveals the real
 * logo asset (masked, not redrawn) and a glow bloom settles. Pure CSS/DOM -
 * no video - so the background is always exactly the hub's own, and it
 * scales to any viewport instead of being a fixed-aspect clip.
 */
const Reveal = () => {
  const embers = useEmbers();
  const [phase, setPhase] = useState<"playing" | "exiting" | "done">(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "done"
      : "playing",
  );

  const finish = () => {
    setPhase((p) => (p === "playing" ? "exiting" : p));
  };

  useEffect(() => {
    if (phase !== "playing") return;
    // Embers ~0-950ms, sweep ~350-1250ms, bloom pulse ~1250-1750ms, hold to
    // ~2100ms - then start the exit crossfade.
    const t = window.setTimeout(finish, 2100);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const t = window.setTimeout(() => setPhase("done"), 450);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`reveal ${phase === "exiting" ? "reveal-exit" : ""}`}
      onClick={finish}
      onKeyDown={(e) => e.key === "Escape" && finish()}
      role="presentation"
      aria-hidden="true"
    >
      {embers.map((e) => (
        <span
          key={e.id}
          className="reveal-ember"
          style={
            {
              "--sx": `${e.sx}vw`,
              "--sy": `${e.sy}vh`,
              "--delay": `${e.delay}ms`,
              width: `${e.size}px`,
              height: `${e.size}px`,
            } as React.CSSProperties
          }
        />
      ))}

      <span className="reveal-logo-wrap">
        <span
          className="reveal-logo-base"
          style={{ backgroundImage: `url(${LOGO})` }}
        />
        <span
          className="reveal-logo-top"
          style={{ backgroundImage: `url(${LOGO})` }}
        />
      </span>
    </div>
  );
};

export default Reveal;
