import { useEffect, useState } from "react";

/**
 * Single source of truth for the desktop breakpoint.
 *
 * This value was previously repeated in four places, split across two different
 * mechanisms (`window.innerWidth > 1024` in some files, a matchMedia query in
 * others), which meant a change in one place silently disagreed with the rest.
 * It matches the `max-width: 899px` mobile block in the stylesheets.
 *
 * 900 rather than 1025 because of what a phone does when it is asked for the
 * desktop site: it ignores the viewport meta tag, lays the page out at 980px
 * wide, and scales the result down. At 1025 that request landed in the mobile
 * block, whose positions are fixed pixel offsets tuned for a phone-sized
 * viewport, and stretching them over a 2121px-tall canvas pulled the hero
 * headline and the Work section apart into overlapping pieces. 980 now sits in
 * the desktop block, which is built for a canvas this size.
 */
export const DESKTOP_MIN_WIDTH = 900;
const DESKTOP_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;

/** Synchronous check, for code outside React. */
export function isDesktopViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
}

/** Tracks the breakpoint and re-renders only when it actually flips. */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(isDesktopViewport);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}
