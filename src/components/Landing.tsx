import { PropsWithChildren, useEffect, useRef, useState } from "react";
import "./styles/Landing.css";
import { setLandingFadeTimeline } from "./utils/GsapScroll";
import { useIsDesktop } from "../hooks/useIsDesktop";

type VisualKey = "hero" | "about" | "whatido";

// VP9-alpha WebM (real per-pixel transparency) — she's a true cutout, no
// background box. Ping-pong looped so the restart is imperceptible.
const VISUALS: Record<VisualKey, { webm: string; poster: string }> = {
  hero: {
    webm: "/videos/character/hero.webm?v=8",
    poster: "/videos/character/hero-poster.webp?v=8",
  },
  about: {
    webm: "/videos/character/about.webm",
    poster: "/videos/character/about-poster.webp",
  },
  whatido: {
    // ?v= busts stale browser/CDN caches after matte fixes — bump when the file changes
    webm: "/videos/character/what-i-do-v2.webm?v=11",
    poster: "/videos/character/what-i-do-v2-poster.webp?v=11",
  },
};

// Backlight offsets above the frozen anchor, in px. FAR applies while the What
// I Do section is still a full viewport away; NEAR once it is close, which is
// when she has risen far enough that the old offset left the glow hanging above
// her head. Between the two thresholds the lift interpolates.
// Where she rests while following the viewport, as a fraction of its height.
// Must track `top: 60%` on .landing-sticky-visual in Landing.css.
const RESTING_TOP = 0.6;

// The scroll window over which she travels from that resting spot down to her
// place in the What I Do section, expressed as the section's top edge in
// viewport heights. Driving the move from scroll position rather than from a
// timer means it tracks the wheel exactly, reverses when the visitor reverses,
// and never has to animate across the fixed/absolute switch, which is what made
// earlier attempts read as a jump.
const SLIDE_START = 1.05;
const SLIDE_END = 0.55;

// While she is resting in the About section the glow is placed entirely by CSS:
// .character-rim.about-position sits at 45% of the viewport with a -28% shift.
// Once she freezes, Landing positions it inline instead, and the two rules have
// to agree or the glow visibly jumps up off her head at the handover. Rather
// than hardcode a second number that has to be kept in sync by hand, derive the
// inline offset from the same CSS values.
const RIM_RESTING_TOP = 0.45; // must track .character-rim.about-position
/**
 * How far above her anchor the glow's `top` is set, so the frozen placement
 * reproduces the resting one exactly.
 *
 * Only the difference between the two `top` percentages matters. The rim keeps
 * the same -28% translate in both states, so the gap between its `top` and where
 * its centre actually lands is identical either way and cancels out. Subtracting
 * it here (an earlier mistake) pushed the glow 88px too low, which measured as
 * 41px below her centre instead of 47px above it.
 */
function rimLiftFor(viewportHeight: number): number {
  return (RESTING_TOP - RIM_RESTING_TOP) * viewportHeight;
}

const Landing = ({ children }: PropsWithChildren) => {
  const [isSwitched, setIsSwitched] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInAboutSection, setIsInAboutSection] = useState(false);
  const [hasFadedOut, setHasFadedOut] = useState(false);
  const [isInWhatIDo, setIsInWhatIDo] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenTop, setFrozenTop] = useState<number | null>(null);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === 'undefined' ? 900 : window.innerHeight
  );
  const [isPastWhatIDo, setIsPastWhatIDo] = useState(false);
  const [activeSection, setActiveSection] = useState<VisualKey>('hero');
  const [heroOffscreen, setHeroOffscreen] = useState(false);
  // How far above the frozen anchor the backlight sits. She rises into view as
  // What I Do approaches, so a single value cannot stay behind her head: high
  // while About still owns the screen, then easing down onto her head as she
  // comes up. Measured in the browser, not guessed.
  // Mobile only ever gets the hero clip — the About and What I Do videos are
  // never mounted there, so phones don't pay their download/decode cost.
  const isDesktop = useIsDesktop();
  const videoRefs = useRef<Partial<Record<VisualKey, HTMLVideoElement | null>>>({});
  const scrollScheduledRef = useRef(false);
  // Her destination inside .landing-container. Scroll-invariant, so it is
  // measured once per layout rather than every frame.
  const gapTargetRef = useRef<number | null>(null);
  const cachedElsRef = useRef<{
    landing: HTMLElement | null;
    about: HTMLElement | null;
    what: HTMLElement | null;
    title: HTMLElement | null;
    content: HTMLElement | null;
    container: HTMLElement | null;
  } | null>(null);

  useEffect(() => {
    // One interval for the life of the component. Keying this on isAnimating
    // restarted the timer on every switch, so the real period drifted to 6.8s
    // and the settle timeout outlived unmount.
    let settle: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      // Both flip in the same tick: the outgoing word starts leaving at the
      // exact moment the incoming one starts arriving.
      setIsAnimating(true);
      setIsSwitched((prev) => !prev);

      // Long enough for the last letter (0.05s stagger) to finish its 0.4s
      // move before the spent word is parked back below.
      settle = setTimeout(() => setIsAnimating(false), 800);
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(settle);
    };
  }, []);

  useEffect(() => {
    // Ensure landing scroll fade/pin is initialized
    const cleanupFade = setLandingFadeTimeline(isDesktop);

    const readEls = () => {
      if (!cachedElsRef.current) {
        cachedElsRef.current = {
          landing: document.getElementById('landingDiv'),
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
      const {
        landing: landingSection,
        about: aboutSection,
        what: whatIDoSection,
        title: titleEl,
        content: contentEl,
        container: containerEl,
      } = readEls();
      const vh = window.innerHeight;
      setViewportHeight(vh);

      // Every branch below writes state unconditionally, through a plain or
      // functional setter. Reading component state here would capture it in
      // this closure and let it go stale between effect re-runs, which is what
      // used to leave her stuck in the frozen position on the way back up.
      // React bails out when a value is unchanged, so writing every frame is
      // cheap.

      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        // Enter once the top reaches 85% of the viewport, for a faster return.
        setIsInAboutSection(rect.top < vh * 0.85 && rect.bottom > 0);
        setHeroOffscreen(rect.top <= 0);
      }

      // The landing fade used to be reported by GSAP's scrubbed timeline, which
      // trails the scroll by about a second and made her hesitate before
      // repositioning. Derive it from geometry so it is exact and symmetric.
      // The two thresholds are hysteresis, so the flag cannot chatter.
      if (landingSection) {
        const rect = landingSection.getBoundingClientRect();
        const progress = rect.height > 0 ? -rect.top / rect.height : 0;
        setHasFadedOut((prev) => (prev ? progress >= 0.36 : progress >= 0.4));
      }

      if (whatIDoSection) {
        const rect = whatIDoSection.getBoundingClientRect();
        const aboveViewport = rect.bottom <= 0; // scrolled past What I Do

        // Switch slightly after the middle so About holds a little longer.
        setIsInWhatIDo(rect.top < vh * 0.4 && rect.bottom > 0);

        // Her vertical position is a pure function of scroll: at SLIDE_START she
        // is still resting where she follows the viewport, by SLIDE_END she has
        // arrived in the What I Do gap, and in between she travels smoothly.
        if (containerEl) {
          const containerRect = containerEl.getBoundingClientRect();
          // Where she currently sits, expressed in container coordinates. At
          // progress 0 this equals her fixed position exactly, so handing over
          // between the two positioning modes is seamless.
          const restingTop = vh * RESTING_TOP - containerRect.top;

          if (gapTargetRef.current === null && titleEl && contentEl) {
            const titleRect = titleEl.getBoundingClientRect();
            const contentRect = contentEl.getBoundingClientRect();
            const gapTop = titleRect.bottom;
            const gapBottom = contentRect.top;
            const gapMid = gapTop + Math.max(0, gapBottom - gapTop) / 2;
            const freezeOffset = -60; // sit a little above the exact midpoint
            gapTargetRef.current = gapMid - containerRect.top + freezeOffset;
          }

          const span = (SLIDE_START - SLIDE_END) * vh;
          const raw = span > 0 ? (SLIDE_START * vh - rect.top) / span : 0;
          const progress = Math.min(1, Math.max(0, raw));
          // Smoothstep, so she eases out of the resting spot and into the gap
          // instead of starting and stopping abruptly.
          const eased = progress * progress * (3 - 2 * progress);
          const target = gapTargetRef.current;

          if (progress <= 0 || target === null) {
            setIsFrozen(false);
            setFrozenTop(null);
          } else {
            setIsFrozen(true);
            setFrozenTop(Math.round(restingTop + (target - restingTop) * eased));
          }
        }

        setIsPastWhatIDo(aboveViewport);
      }

      // Which clip is shown, from scroll position alone, so it is identical
      // going up and going down.
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

    // A resize invalidates every measurement the freeze was computed from, so
    // drop the cached nodes and let the next frame re-measure.
    const handleResize = () => {
      cachedElsRef.current = null;
      gapTargetRef.current = null;
      setIsFrozen(false);
      setFrozenTop(null);
      handleScrollCore();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (typeof cleanupFade === 'function') cleanupFade();
    };
  }, [isDesktop]);

  // Drop About positioning as soon as What I Do threshold is reached so switch occurs centered
  const aboutReady = isDesktop && isInAboutSection && hasFadedOut && !isInWhatIDo;

  // Which character video is shown — driven by scroll position (see handler).
  // On mobile there is only ever the hero clip.
  const activeVisual: VisualKey = isDesktop ? activeSection : 'hero';

  // On mobile she is anchored inside the hero section (see Landing.css), so she
  // simply scrolls out of view — pause her once she's gone so an off-screen
  // video isn't decoding on battery.
  const mobileParked = !isDesktop && heroOffscreen;

  // Only play the visible section's clip to save CPU/battery
  useEffect(() => {
    (Object.keys(VISUALS) as VisualKey[]).forEach((key) => {
      const v = videoRefs.current[key];
      if (!v) return;
      if (key === activeVisual && !mobileParked) v.play().catch(() => {});
      else v.pause();
    });
  }, [activeVisual, mobileParked]);

  // One word of a switching pair. Keyed by its own text so React keeps each
  // word on its own DOM node across a switch — a word never rewrites itself
  // into the other one mid-flight, it only changes state.
  const renderWord = (text: string, state: 'active' | 'leaving' | 'parked') => (
    <span
      key={text}
      className={`switch-word is-${state}`}
      aria-hidden={state !== 'active'}
    >
      {text.split('').map((letter, index) => (
        <span
          key={index}
          className="letter"
          style={{ transitionDelay: `${index * 0.05}s` }}
        >
          {letter}
        </span>
      ))}
    </span>
  );

  // Both words of a pair stay mounted, stacked in one grid cell. That keeps the
  // cell as wide as the wider word — the shrink-to-fit, centre-anchored
  // .landing-info would otherwise slide sideways on every switch — and lets the
  // outgoing word rise out while the incoming one rises in behind it.
  const renderSwitchText = (live: string, other: string) => (
    <span className="switch-text">
      {renderWord(live, 'active')}
      {renderWord(other, isAnimating ? 'leaving' : 'parked')}
    </span>
  );

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
            className={`landing-sticky-visual ${aboutReady ? 'about-position' : ''} ${isDesktop && isFrozen ? 'frozen' : ''}`}
          style={
            isDesktop && isFrozen && frozenTop !== null
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
              {(isDesktop ? (['hero', 'about'] as VisualKey[]) : (['hero'] as VisualKey[])).map((key) => (
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
              {isDesktop && (
              <div
                className={`landing-sticky-video visual-whatido whatido-wrap ${
                  activeVisual === 'whatido' ? 'active' : ''
                }`}
              >
                <span className="whatido-head-glow" aria-hidden="true" />
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
              )}
            </div>
          </div>
          <div className="landing-info">
            <h3>A Kingdom</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">
                {renderSwitchText(
                  isSwitched ? 'Marketer' : 'Builder',
                  isSwitched ? 'Builder' : 'Marketer'
                )}
              </div>
              <div className="landing-h2-2"></div>
            </h2>
            <h2>
              <div className="landing-h2-info">
                {renderSwitchText(
                  isSwitched ? 'Builder' : 'Marketer',
                  isSwitched ? 'Marketer' : 'Builder'
                )}
              </div>
              <div className="landing-h2-info-1"></div>
            </h2>
          </div>
        </div>
        <div
          className={`character-rim ${aboutReady ? 'about-position' : ''} ${activeVisual === 'whatido' ? 'hide-below-what' : ''} ${isDesktop && isFrozen ? 'frozen' : ''}`}
          style={
            isDesktop && isFrozen && frozenTop !== null
              ? {
                  // Behind her head, not above it. frozenTop is her centre and
                  // the video frame is only ~330px tall above that, so this
                  // offset has to stay well inside it. Wins over
                  // .character-rim.about-position in the stylesheet, so it is
                  // the number that actually moves the About glow.
                  top: `${Math.max(0, frozenTop - rimLiftFor(viewportHeight))}px`,
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
