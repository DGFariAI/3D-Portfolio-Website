import { useEffect, useState } from "react";
import "./styles/Reveal.css";

const SESSION_KEY = "dgfari-reveal-shown";

/**
 * Plays once per browser session before the hub is seen: the flame mark
 * forming out of embers, then a crossfade into the hub already mounted
 * underneath it. Source clip renders on pure black so the browser can
 * composite it onto the real page background with mix-blend-mode: screen
 * instead of shipping a matte.
 */
const Reveal = () => {
  const [phase, setPhase] = useState<"playing" | "exiting" | "done">(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return "done";
    } catch {
      /* Storage can be unavailable (private mode, disabled cookies) - fall
         through and just play it once for this page load. */
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return "done";
    }
    return "playing";
  });

  // Marked as soon as it starts, not when it finishes, so navigating away
  // mid-clip still counts as "seen" and it never replays this session.
  useEffect(() => {
    if (phase !== "playing") return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* Nothing to persist; it'll just play again next time. */
    }
  }, [phase]);

  const finish = () => {
    setPhase((p) => (p === "playing" ? "exiting" : p));
  };

  // A clip that never fires onEnded (a stalled load, a decode error) must
  // not trap the hub behind it forever.
  useEffect(() => {
    if (phase !== "playing") return;
    const failsafe = window.setTimeout(finish, 4500);
    return () => window.clearTimeout(failsafe);
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
      <video
        className="reveal-video"
        src="/videos/reveal/logo-reveal.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => window.setTimeout(finish, 300)}
        onError={finish}
      />
    </div>
  );
};

export default Reveal;
