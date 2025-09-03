import { useEffect, useState } from "react";
import { FaRedo } from "react-icons/fa";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/RefreshButton.css";

gsap.registerPlugin(ScrollTrigger);

const RefreshButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show button when user scrolls down
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRefresh = () => {
    // Scroll to top with smooth animation
    gsap.to(window, {
      duration: 1.5,
      scrollTo: { y: 0, autoKill: false },
      ease: "power3.inOut",
      onComplete: () => {
        // Refresh ScrollTrigger after scroll completes
        ScrollTrigger.refresh();
      }
    });
  };

  return (
    <button
      className={`refresh-button ${isVisible ? 'visible' : ''}`}
      onClick={handleRefresh}
      data-cursor="pointer"
      aria-label="Scroll to top"
    >
      <FaRedo />
    </button>
  );
};

export default RefreshButton;
