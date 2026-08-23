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
      // A generous margin: the chunk still has to download and the physics
      // world has to settle, so start well before the section is on screen.
      { rootMargin: "1200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The sentinel holds the section's place in the scroll flow so the page
  // height does not jump when the real component arrives.
  return (
    <div ref={sentinelRef}>
      {shouldLoad && (
        <Suspense fallback={null}>
          <TechStack />
        </Suspense>
      )}
    </div>
  );
};

export default TechStackLazy;
