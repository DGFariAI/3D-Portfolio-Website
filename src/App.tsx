import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { useDeviceTier } from "./hooks/useDeviceTier";

// Every route is its own chunk. The portfolio pulls in GSAP and, further down,
// three.js and a physics engine; the hub is the page every link points at and
// must not carry any of that. Splitting here is what keeps the front door
// light, so these imports are deliberately lazy rather than static.
const Hub = lazy(() => import("./routes/Hub"));
const Portfolio = lazy(() => import("./routes/Portfolio"));
const Blogs = lazy(() => import("./routes/Blogs"));
const Post = lazy(() => import("./routes/Post"));
const ComingSoon = lazy(() => import("./routes/ComingSoon"));

const App = () => {
  const { pathname } = useLocation();

  // Publishes tier-high / tier-medium / tier-low on <html> so the stylesheets
  // can scale their own expensive effects to the device. App-wide, so it stays
  // here rather than moving into a route.
  useDeviceTier();

  // Land at the top on every entry: reload, back/forward, and bfcache restore.
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const scrollToTop = () =>
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    scrollToTop();
    window.addEventListener("pageshow", scrollToTop);
    return () => window.removeEventListener("pageshow", scrollToTop);
  }, []);

  // ...and on every route change, since navigating keeps the document.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    // No fallback UI: the chunks are small and a flash of a spinner reads worse
    // than a beat of the background, which is already painted.
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:slug" element={<Post />} />
        <Route
          path="/ai"
          element={
            <ComingSoon
              name="DGFari AI"
              logo="/images/logos/DGFari-AI.png"
              blurb="Become who you were made to be"
              path="/ai"
              description="DGFari AI is coming soon. Become who you were made to be."
            />
          }
        />
        {/* Anything unknown lands on the hub rather than a dead end. */}
        <Route path="*" element={<Hub />} />
      </Routes>
    </Suspense>
  );
};

export default App;
