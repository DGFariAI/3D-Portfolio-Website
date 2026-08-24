import { Suspense, lazy, useEffect, useRef, useState } from "react";

// three.js, the postprocessing pass and the Rapier physics engine are by far
// the heaviest thing on the page, and the section that needs them sits near the
// bottom. Importing it statically put all of that in the initial bundle, where
// it had to be downloaded, parsed and executed before the visitor could
// interact with the hero. Loading it on approach keeps that cost off the
// critical path entirely.
const TechStack = lazy(() => import("./TechStack"));

const TechStackLazy = () => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Fetch the chunk during idle time, well before it is needed. Waiting for the
  // observer meant a 3MB download only started as the section came into view,
  // so a visitor scrolling quickly reached empty space, saw the Contact section
  // below it, and only then had the scene appear behind them.
  useEffect(() => {
    let cancelled = false;
    const prefetch = () => {
      if (!cancelled) import("./TechStack");
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const handle = w.requestIdleCallback
      ? w.requestIdleCallback(prefetch, { timeout: 4000 })
      : window.setTimeout(prefetch, 2500);
    return () => {
      cancelled = true;
      if (!w.requestIdleCallback) window.clearTimeout(handle);
    };
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      // Mount well ahead of the section: the physics world still needs a moment
      // to settle once the chunk is in, and this is what guarantees the scene is
      // there before the visitor arrives rather than after.
      { rootMargin: "2500px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The placeholder reserves exactly the height .techstack will occupy. Without
  // it the wrapper was zero-height until the chunk arrived, so mounting added a
  // full viewport of height mid-scroll: GSAP re-measured the pinned Work
  // section and the page lurched, which reads as a jump while scrolling
  // through the Career section just above it.
  return (
    <div
      ref={sentinelRef}
      className={shouldLoad ? undefined : "techstack-placeholder"}
    >
      {shouldLoad && (
        <Suspense fallback={null}>
          <TechStack />
        </Suspense>
      )}
    </div>
  );
};

export default TechStackLazy;
