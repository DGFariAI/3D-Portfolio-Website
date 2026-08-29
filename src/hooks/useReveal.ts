import { useEffect, useRef } from "react";

/**
 * Reveals `[data-reveal]` descendants as they enter the viewport.
 *
 * An IntersectionObserver rather than a scroll listener: the browser reports
 * the crossing itself instead of the main thread recomputing positions on
 * every frame of a scroll. Elements are unobserved once shown, so the
 * observer empties itself as the page is read.
 *
 * Anyone who has asked for reduced motion gets the finished state applied
 * immediately, so the content is never gated behind an animation they have
 * turned off.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (!items.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      // Fires a little before the element is fully in view, so the motion
      // reads as the page arriving rather than as a reaction to the scroll.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return ref;
}
