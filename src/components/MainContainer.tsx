import { PropsWithChildren, useEffect, useState } from "react";
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

interface MainContainerProps extends PropsWithChildren {}

const MainContainer = ({ children }: MainContainerProps) => {
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );

  useEffect(() => {
    const resizeHandler = () => {
      setSplitText();
      setIsDesktopView(window.innerWidth > 1024);
    };
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isDesktopView]);

  // Ensure ScrollTrigger is refreshed and scroll is reset on mount
  useEffect(() => {
    // Reset scroll to top on component mount
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Refresh ScrollTrigger instances with a slight delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
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
