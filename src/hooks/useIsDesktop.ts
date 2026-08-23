import { useEffect, useState } from "react";

/**
 * Single source of truth for the desktop breakpoint.
 *
 * This value was previously repeated in four places, split across two different
 * mechanisms (`window.innerWidth > 1024` in some files, a matchMedia query in
 * others), which meant a change in one place silently disagreed with the rest.
 * It matches the `max-width: 1024px` mobile block in the stylesheets.
 */
export const DESKTOP_MIN_WIDTH = 1025;
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
