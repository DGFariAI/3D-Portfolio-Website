import { PropsWithChildren, useEffect, useRef, useState } from "react";
import "./styles/Landing.css";
import { setLandingFadeTimeline } from "./utils/GsapScroll";

type VisualKey = "hero" | "about" | "whatido";

// VP9-alpha WebM (real per-pixel transparency) — she's a true cutout, no
// background box. Ping-pong looped so the restart is imperceptible.
const VISUALS: Record<VisualKey, { webm: string; poster: string }> = {
  hero: {
    webm: "/videos/character/hero.webm",
    poster: "/videos/character/hero-poster.webp",
  },
  about: {
    webm: "/videos/character/about.webm",
    poster: "/videos/character/about-poster.webp",
  },
  whatido: {
    webm: "/videos/character/what-i-do.webm",
    poster: "/videos/character/what-i-do-poster.webp",
  },
};

const Landing = ({ children }: PropsWithChildren) => {
  const [isSwitched, setIsSwitched] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInAboutSection, setIsInAboutSection] = useState(false);
  const [hasFadedOut, setHasFadedOut] = useState(false);
  const [isInWhatIDo, setIsInWhatIDo] = useState(false);
  const [lockWhatImage, setLockWhatImage] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenTop, setFrozenTop] = useState<number | null>(null);
  const [hideBelowWhat, setHideBelowWhat] = useState(false);
  const [isPastWhatIDo, setIsPastWhatIDo] = useState(false);
  const [activeSection, setActiveSection] = useState<VisualKey>('hero');
  const videoRefs = useRef<Partial<Record<VisualKey, HTMLVideoElement | null>>>({});
  const hasFrozenRef = useRef(false);
  const frozenTopRef = useRef<number | null>(null);
  const scrollScheduledRef = useRef(false);
  const cachedElsRef = useRef<{
    about: HTMLElement | null;
    what: HTMLElement | null;
    title: HTMLElement | null;
    content: HTMLElement | null;
    container: HTMLElement | null;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        
        // Change text early in the animation (while letters are going up)
        setTimeout(() => {
          setIsSwitched(prev => !prev);
        }, 200); // Switch at 25% of animation (200ms of 800ms)
        
        // Reset animation state after completion
        setTimeout(() => {
          setIsAnimating(false);
        }, 800);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  useEffect(() => {
    // Ensure landing scroll fade/pin is initialized
    const cleanupFade = setLandingFadeTimeline();

    const readEls = () => {
      if (!cachedElsRef.current) {
        cachedElsRef.current = {
          about: document.getElementById('about'),
          what: document.querySelector('.whatIDO') as HTMLElement | null,
          title: document.querySelector('.whatIDO .title') as HTMLElement | null,
          content: document.querySelector('.whatIDO .what-box-in') as HTMLElement | null,
          container: document.querySelector('.landing-container') as HTMLElement | null,
        };
      }
      return cachedElsRef.current;
    };

    const handleScrollCore = () => {
      const { about: aboutSection, what: whatIDoSection, title: titleEl, content: contentEl, container: containerEl } = readEls();

      // About section visibility (enter once the top reaches 85% of viewport for a faster return)
      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
        if (isVisible && !isInAboutSection) {
          setIsInAboutSection(true);
          // As soon as About is visible again, release any What I Do image lock so About.png returns promptly
          if (lockWhatImage) setLockWhatImage(false);
        } else if (!isVisible && isInAboutSection) {
          setIsInAboutSection(false);
        }
      }

      // What I Do section visibility (switch when section reaches middle of viewport)
      if (whatIDoSection) {
        const rect = whatIDoSection.getBoundingClientRect();
        const withinViewport = rect.top < window.innerHeight && rect.bottom > 0;
        const aboveViewport = rect.bottom <= 0; // scrolled past What I Do
        const belowViewport = rect.top >= window.innerHeight; // haven't reached What I Do yet
        const passedImageSwitchThreshold = rect.top < window.innerHeight * 0.4 && rect.bottom > 0; // switch slightly after middle

        // Update proximity state for image switching (later threshold so About holds longer)
        setIsInWhatIDo(passedImageSwitchThreshold);
        if (passedImageSwitchThreshold && !lockWhatImage) setLockWhatImage(true);

        if (withinViewport || aboveViewport) {
          setHideBelowWhat(false);
          if (!hasFrozenRef.current && titleEl && contentEl && containerEl) {
            const titleRect = titleEl.getBoundingClientRect();
            const contentRect = contentEl.getBoundingClientRect();
            const containerRect = containerEl.getBoundingClientRect();
            const gapTop = titleRect.bottom;
            const gapBottom = contentRect.top;
            const gapMidViewportY = gapTop + Math.max(0, (gapBottom - gapTop)) / 2;
            const freezeOffset = -60; // raise higher
            const topWithinContainer = gapMidViewportY - containerRect.top + freezeOffset;

            // Freeze at the midpoint position (only once)
            hasFrozenRef.current = true;
            frozenTopRef.current = topWithinContainer;
            setIsFrozen(true);
            setFrozenTop(topWithinContainer);
          }
          if (aboveViewport && !isPastWhatIDo) setIsPastWhatIDo(true);
          if (withinViewport && isPastWhatIDo) setIsPastWhatIDo(false);
        } else if (belowViewport) {
          // Release when scrolling up before the section (no freeze before section)
          setHideBelowWhat(false);
          if (isFrozen) setIsFrozen(false);
          if (frozenTop !== null) setFrozenTop(null);
          hasFrozenRef.current = false;
          frozenTopRef.current = null;
          if (isPastWhatIDo) setIsPastWhatIDo(false);
          if (lockWhatImage) setLockWhatImage(false);
        }
      }

      // Deterministic active character based purely on scroll position, so the
      // right video always shows and it's symmetric scrolling up or down.
      const vh = window.innerHeight;
      let section: VisualKey = 'hero';
      if (aboutSection && aboutSection.getBoundingClientRect().top < vh * 0.6) section = 'about';
      if (whatIDoSection && whatIDoSection.getBoundingClientRect().top < vh * 0.5) section = 'whatido';
      setActiveSection((prev) => (prev === section ? prev : section));
    };

    const handleScroll = () => {
      if (scrollScheduledRef.current) return;
      scrollScheduledRef.current = true;
      requestAnimationFrame(() => {
        scrollScheduledRef.current = false;
        handleScrollCore();
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (typeof cleanupFade === 'function') cleanupFade();
    };
  }, [isInAboutSection]);

  useEffect(() => {
    const onFadeComplete = () => setHasFadedOut(true);
    const onFadeReset = () => setHasFadedOut(false);
    window.addEventListener('landingFadeComplete', onFadeComplete as EventListener);
    window.addEventListener('landingFadeReset', onFadeReset as EventListener);
    return () => {
      window.removeEventListener('landingFadeComplete', onFadeComplete as EventListener);
      window.removeEventListener('landingFadeReset', onFadeReset as EventListener);
    };
  }, []);

  // Drop About positioning as soon as What I Do threshold is reached so switch occurs centered
  const aboutReady = isInAboutSection && hasFadedOut && !isInWhatIDo;

  // Which character video is shown — driven by scroll position (see handler)
  const activeVisual: VisualKey = activeSection;

  // Only play the visible section's clip to save CPU/battery
  useEffect(() => {
    (Object.keys(VISUALS) as VisualKey[]).forEach((key) => {
      const v = videoRefs.current[key];
      if (!v) return;
      if (key === activeVisual) v.play().catch(() => {});
      else v.pause();
    });
  }, [activeVisual]);

  const renderAnimatedText = (text: string) => {
    return text.split('').map((letter, index) => (
      <span
        key={index}
        className={`letter ${isAnimating ? 'switching' : ''}`}
        style={{
          animationDelay: `${index * 0.05}s`
        }}
      >
        {letter}
      </span>
    ));
  };

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              DANICA
              <br />
              <span>GABRIELLA</span>
            </h1>
          </div>
          <div
            className={`landing-sticky-visual ${aboutReady ? 'about-position' : ''} ${hideBelowWhat ? 'hide-below-what' : ''} ${isFrozen ? 'frozen' : ''}`}
          style={
            isFrozen && frozenTop !== null
              ? {
                  top: `${frozenTop}px`,
                  transform: activeVisual === 'whatido'
                    ? 'translate(-50%, -50%)'
                    : 'translate(calc(-50% - 40px), -50%)',
                  zIndex: isPastWhatIDo ? 0 : 8,
                }
              : undefined
          }
          >
            <div className="character-tilt">
              {(['hero', 'about'] as VisualKey[]).map((key) => (
                <video
                  key={key}
                  ref={(el) => {
                    videoRefs.current[key] = el;
                  }}
                  className={`landing-sticky-video visual-${key} ${
                    activeVisual === key ? 'active' : ''
                  }`}
                  src={VISUALS[key].webm}
                  poster={VISUALS[key].poster}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="auto"
                  disablePictureInPicture
                />
              ))}
              {/* What I Do: transparent cutout + a small floor-light beneath her */}
              <div
                className={`landing-sticky-video visual-whatido whatido-wrap ${
                  activeVisual === 'whatido' ? 'active' : ''
                }`}
              >
                <span className="whatido-floor-glow" aria-hidden="true" />
                <video
                  ref={(el) => {
                    videoRefs.current.whatido = el;
                  }}
                  className="whatido-video"
                  src={VISUALS.whatido.webm}
                  poster={VISUALS.whatido.poster}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="auto"
                  disablePictureInPicture
                />
              </div>
            </div>
          </div>
          <div className="landing-info">
            <h3>A Product</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">
                <span className="switch-text">
                  {renderAnimatedText(isSwitched ? 'Designer' : 'Manager')}
                </span>
              </div>
              <div className="landing-h2-2"></div>
            </h2>
            <h2>
              <div className="landing-h2-info">
                <span className="switch-text">
                  {renderAnimatedText(isSwitched ? 'Manager' : 'Designer')}
                </span>
              </div>
              <div className="landing-h2-info-1"></div>
            </h2>
          </div>
        </div>
        <div
          className={`character-rim ${aboutReady ? 'about-position' : ''} ${hideBelowWhat || activeVisual === 'whatido' ? 'hide-below-what' : ''} ${isFrozen ? 'frozen' : ''}`}
          style={
            isFrozen && frozenTop !== null
              ? {
                  top: `${Math.max(0, frozenTop - 300)}px`,
                  zIndex: isPastWhatIDo ? -1 : 1,
                  transform: 'translate(calc(-50% - 50px), -50%) scale(1.4)',
                }
              : undefined
          }
        ></div>
        {children}
      </div>
    </>
  );
};

export default Landing;
