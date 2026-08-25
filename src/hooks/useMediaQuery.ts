import { useEffect, useState } from "react";

/**
 * Tracks a media query and re-renders only when it flips.
 *
 * For the cases that genuinely need their own breakpoint rather than the
 * site-wide one in useIsDesktop. Use it sparingly: a breakpoint that only one
 * component knows about is a breakpoint the next person will not find.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
