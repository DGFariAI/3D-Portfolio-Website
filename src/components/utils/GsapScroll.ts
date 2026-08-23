import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function setAllTimeline() {
  const careerTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".career-section",
      start: "top 30%",
      end: "100% center",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  careerTimeline
    .fromTo(
      ".career-timeline",
      { maxHeight: "10%" },
      { maxHeight: "100%", duration: 0.5 },
      0
    )

    .fromTo(
      ".career-timeline",
      { opacity: 0 },
      { opacity: 1, duration: 0.1 },
      0
    )
    .fromTo(
      ".career-info-box",
      { opacity: 0 },
      { opacity: 1, stagger: 0.1, duration: 0.5 },
      0
    )
    .fromTo(
      ".career-dot",
      { animationIterationCount: "infinite" },
      {
        animationIterationCount: "1",
        delay: 0.3,
        duration: 0.1,
      },
      0
    );

  if (window.innerWidth > 1024) {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: "20%", duration: 0.5, delay: 0.2 },
      0
    );
  } else {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: 0, duration: 0.5, delay: 0.2 },
      0
    );
  }
}

export function setWhatIDoTimeline() {
  gsap.registerPlugin(ScrollTrigger);
  // Reveal What I Do container and then its panels (Design/Manage)
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-section",
      start: "center 55%",
      end: "bottom top",
      toggleActions: "restart none none none",
      invalidateOnRefresh: true,
      onLeaveBack: () => {
        tl.pause(0).progress(0);
        gsap.set(".what-box-in", { clearProps: "all", display: "none", autoAlpha: 0, y: 40 });
        gsap.set(".what-content", { clearProps: "opacity,transform", autoAlpha: 0, y: 20 });
      },
    },
  });

  tl.set(".what-box-in", { display: "flex" });

  tl.fromTo(
    ".what-box-in",
    { autoAlpha: 0, y: 40 },
    { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }
  );

  tl.fromTo(
    ".what-content",
    { autoAlpha: 0, y: 20 },
    { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.15 },
    "-=0.2"
  );
}

// Sets up the landing text fade and pinned state independently of the 3D character.
// Both the pin and the scroll fade are desktop-only. On desktop the intro/info
// blocks are held at a fixed viewport position and dissolved as you scroll past.
// On a phone that reads as the text sliding down the page and then vanishing, so
// mobile does neither — the text simply scrolls away with the hero section.
export function setLandingFadeTimeline(isDesktop: boolean = window.innerWidth > 1024) {
  gsap.registerPlugin(ScrollTrigger);

  // Clear any inline opacity/visibility a previous desktop-width init left behind.
  if (!isDesktop) {
    gsap.set([".landing-intro", ".landing-info"], {
      clearProps: "opacity,visibility",
    });
  }

  // Pin the intro and info blocks without adding pin spacing
  const pins: ScrollTrigger[] = [];
  if (isDesktop) {
    pins.push(
      ScrollTrigger.create({
        trigger: ".landing-section",
        start: "top top",
        end: "bottom top",
        pin: ".landing-intro",
        pinSpacing: false,
        anticipatePin: 1,
      }),
      ScrollTrigger.create({
        trigger: ".landing-section",
        start: "top top",
        end: "bottom top",
        pin: ".landing-info",
        pinSpacing: false,
        anticipatePin: 1,
      })
    );
  }

  // Fades the landing text out over the first 40% of the section. Landing.tsx
  // no longer listens for a "faded out" event from here: it derives that from
  // scroll geometry, because this timeline is scrubbed and so reports about a
  // second behind the actual scroll position.
  const st = ScrollTrigger.create({
    trigger: ".landing-section",
    start: "top top",
    end: "bottom top",
    scrub: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (!isDesktop) return;
      const opacity = 1 - Math.min(self.progress / 0.4, 1);
      gsap.set([".landing-intro", ".landing-info"], { autoAlpha: opacity });
    },
  });

  return () => {
    st.kill();
    // kill(true) reverts the pin so GSAP unwraps the .pin-spacer it injected —
    // without it the stale spacers pile up on every re-init.
    pins.forEach((pin) => pin.kill(true));
  };
}
