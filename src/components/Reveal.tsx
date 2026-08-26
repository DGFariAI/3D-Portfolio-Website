import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
 * Set the moment this module is first evaluated by the browser, which only
 * happens on an actual page load/refresh - not on a React Router navigation
 * back to "/" from Portfolio, AI, etc, which remounts Hub (and this
 * component) without reloading the page or re-running module code. That's
 * the distinction that's wanted: replay on refresh, stay quiet on an
 * in-app trip back to the hub.
 */
let hasPlayedThisPageLoad = false;

/**
 * Plays once per real page load: embers travel in from the left/right edges
 * of the viewport, converge behind the mark, then an iris reveals the real
 * logo asset and a glow settles. Pure CSS/DOM - no video - so the background
 * is always exactly the hub's own, and it scales to any viewport instead of
 * being a fixed-aspect clip.
 *
 * Portalled to document.body rather than rendered inline in Hub's tree: .hub
 * has `transform: translateY(-14px)`, and a transform makes an element both
 * a new stacking context and the containing block for fixed descendants
 * (BrandCursor.tsx hit the identical issue and portals for the same reason).
 * Left inline, this component's "fixed, full-viewport, z-index: 999999"
 * only ever resolved against .hub's own box and stacking level - covering
 * just the hub's ~560px column instead of the real viewport, and losing to
 * BrandCursor's z-index because .hub itself stacks below it at the root.
 * That's what let the nav buttons' edges and the cursor show through.
 */
const Reveal = () => {
  const embers = useEmbers();
  const [phase, setPhase] = useState<"playing" | "exiting" | "done">(() => {
    if (hasPlayedThisPageLoad) return "done";
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "done"
      : "playing";
  });

  // Mutating the flag belongs here, not in the useState initializer above:
  // React 18 StrictMode double-invokes lazy initializers in dev specifically
  // to catch impure ones, and a state initializer that mutates shared module
  // state on every call is exactly that - the first (discarded) invocation
  // flipped the flag, so the second saw it as already-played and the reveal
  // never showed at all. Effects are the correct place for this kind of
  // side effect.
  useEffect(() => {
    hasPlayedThisPageLoad = true;
  }, []);

  const finish = () => {
    setPhase((p) => (p === "playing" ? "exiting" : p));
  };

  useEffect(() => {
    if (phase !== "playing") return;
    // Embers ~0-1700ms, iris reveal ~400-3000ms, glow builds and settles by
    // ~3200ms, held to ~3800ms - then the exit crossfade starts.
    const t = window.setTimeout(finish, 3800);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const t = window.setTimeout(() => setPhase("done"), 450);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  return createPortal(
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
    </div>,
    document.body,
  );
};

export default Reveal;
