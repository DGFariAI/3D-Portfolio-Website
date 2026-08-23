import { PropsWithChildren, useEffect } from "react";
import About from "./About";
import Career from "./Career";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";

import SocialIcons from "./SocialIcons";
import TechStack from "./TechStack";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import setSplitText from "./utils/splitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIsDesktop } from "../hooks/useIsDesktop";

const MainContainer = ({ children }: PropsWithChildren) => {
  const isDesktopView = useIsDesktop();

  useEffect(() => {
    const resizeHandler = () => {
      setSplitText();
    };
    resizeHandler();
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
    // Registered once: the handler only reads live values, so re-subscribing
    // whenever the breakpoint flipped just churned listeners.
  }, []);

  useEffect(() => {
    // Scroll restoration is handled once in App.tsx. Refresh ScrollTrigger
    // after the DOM settles so its measurements match the final layout.
    const timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
      // refresh() calls clearScrollMemory internally, which resets
      // history.scrollRestoration to "auto" and undoes what App.tsx set. Hand
      // it back as "manual" so the browser does not restore a stale position.
      ScrollTrigger.clearScrollMemory("manual");
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialIcons />

      {isDesktopView && children}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="container-main">
            <Landing>{!isDesktopView && children}</Landing>
            <About />
            <WhatIDo />
            <Career />
            <Work />
            {isDesktopView && <TechStack />}
            <Contact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
